require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const cheerio = require('cheerio');
const CronJob = require('cron').CronJob;

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de base
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Connexion MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

// Authentification
const auth = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        req.userData = { userId: jwt.verify(token, process.env.JWT_SECRET).userId };
        next();
    } catch {
        res.status(401).json({ error: 'Non autorisé' });
    }
};

// Routes API
app.post('/api/auth/register', async (req, res) => {
    try {
        const hash = await bcrypt.hash(req.body.password, 10);
        db.query('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [req.body.username, req.body.email, hash],
            (err, result) => {
                if (err) return res.status(500).json({ error: 'Email déjà utilisé' });
                res.status(201).json({
                    token: jwt.sign({ userId: result.insertId }, process.env.JWT_SECRET, { expiresIn: '24h' })
                });
            }
        );
    } catch {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    db.query('SELECT * FROM users WHERE email = ?', [req.body.email], async (err, [user]) => {
        if (err || !user || !await bcrypt.compare(req.body.password, user.password_hash)) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }
        res.json({
            token: jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' }),
            user: { id: user.id, email: user.email }
        });
    });
});

// Routes séances
app.get('/api/seances', auth, (req, res) => {
    db.query('SELECT * FROM seances WHERE utilisateur_id = ? ORDER BY date_seance ASC',
        [req.userData.userId],
        (err, results) => {
            if (err) return res.status(500).json({ error: 'Erreur serveur' });
            res.json(results);
        }
    );
});

app.post('/api/seances', auth, (req, res) => {
    const { date_seance, creneau, type, contenu } = req.body;

    // Debug
    console.log('Données reçues:', {
        utilisateur_id: req.userData.userId,
        date_seance,
        creneau,
        type,
        contenu
    });

    db.query(
        'INSERT INTO seances (utilisateur_id, date_seance, creneau, type, contenu) VALUES (?, ?, ?, ?, ?)',
        [req.userData.userId, date_seance, creneau, type, contenu],
        (err, result) => {
            if (err) {
                console.error('Erreur MySQL:', err);
                return res.status(500).json({ error: 'Erreur serveur' });
            }
            res.status(201).json({ id: result.insertId });
        }
    );
});

app.delete('/api/seances/:id', auth, (req, res) => {
    db.query('DELETE FROM seances WHERE id = ? AND utilisateur_id = ?',
        [req.params.id, req.userData.userId],
        (err) => {
            if (err) return res.status(500).json({ error: 'Erreur serveur' });
            res.json({ success: true });
        }
    );
});

// Configuration des sources pour le scraping
const sources = {
    // Sources pour les conseils sportifs
    sport: [
        {
            url: 'https://www.lequipe.fr/Coaching/Fitness/',
            selector: 'article',
            titleSelector: '.title',
            contentSelector: '.description'
        },
        {
            url: 'https://www.doctissimo.fr/forme/news',
            selector: '.article-item',
            titleSelector: '.title',
            contentSelector: '.excerpt'
        }
    ],
    // Sources pour les conseils de travail/études
    travail: [
        {
            url: 'https://www.letudiant.fr/etudes/conseils.html',
            selector: '.article',
            titleSelector: '.title',
            contentSelector: '.description'
        },
        {
            url: 'https://www.studyrama.com/formations/conseils',
            selector: '.article',
            titleSelector: 'h2',
            contentSelector: '.content'
        }
    ]
};

// Fonction qui récupère et sauvegarde les conseils automatiquement
async function scrapeAndSave() {
    try {
        // Pour chaque type de conseil (sport et travail)
        for (const type of ['sport', 'travail']) {
            // Pour chaque source de ce type
            for (const source of sources[type]) {
                try {
                    console.log(`Récupération des conseils depuis ${source.url}`);
                    // Fait une requête HTTP vers la source
                    const response = await axios.get(source.url, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0...' // Simule un navigateur
                        }
                    });

                    // Parse le HTML reçu
                    const $ = cheerio.load(response.data);

                    // Pour chaque article trouvé (limite à 2 par source)
                    $(source.selector).each((i, element) => {
                        if (i < 2) {
                            const titre = $(element).find(source.titleSelector).text().trim();
                            const contenu = $(element).find(source.contentSelector).text().trim();

                            // Si on a un titre et un contenu
                            if (titre && contenu) {
                                // Sauvegarde dans la base de données
                                const sql = `
                                    INSERT INTO conseils 
                                    (date_publication, type, titre, contenu, source, auteur) 
                                    VALUES (CURDATE(), ?, ?, ?, ?, ?)
                                    ON DUPLICATE KEY UPDATE
                                    contenu = VALUES(contenu)
                                `;

                                db.query(sql, [
                                    type,
                                    titre.substring(0, 255),
                                    contenu,
                                    source.url,
                                    'auto-generated'
                                ], (err) => {
                                    if (err) {
                                        console.error(`Erreur d'insertion:`, err);
                                    }
                                });
                            }
                        }
                    });
                } catch (sourceError) {
                    console.error(`Erreur pour la source ${source.url}:`, sourceError);
                }
            }
        }
        console.log('Mise à jour des conseils terminée');
    } catch (error) {
        console.error('Erreur générale du scraping:', error);
    }
}

// Route API pour récupérer les conseils
app.get('/api/conseils', (req, res) => {
    console.log('Route /api/conseils appelée');
    // Requête SQL pour récupérer les 10 derniers conseils
    const sql = `
        SELECT 
            id,
            DATE_FORMAT(date_publication, '%d/%m/%Y') as date,
            type,
            titre,
            contenu,
            source
        FROM conseils 
        ORDER BY date_publication DESC
        LIMIT 10
    `;

    // Exécution de la requête
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erreur MySQL:', err);
            return res.status(500).json({ error: 'Erreur serveur' });
        }
        console.log(`${results.length} conseils trouvés`);
        res.json(results);
    });
});

// Exécute le scraping au démarrage du serveur
scrapeAndSave();

// Programme le scraping tous les jours à minuit
const job = new CronJob('0 0 * * *', scrapeAndSave);
job.start();

// Route pour la page d'accueil
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(PORT, () => console.log(`Serveur lancé sur le port ${PORT}`));