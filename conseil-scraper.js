const axios = require('axios');
const mysql = require('mysql2');
const cheerio = require('cheerio');
require('dotenv').config();

// Configuration de la base de données
const db = mysql.createConnection({
    host: '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Root123$',
    database: 'workout_tracker'
});

// Sources fiables
const sources = {
    sport: [
        {
            url: 'https://www.doctissimo.fr/html/forme/forme.htm',
            selector: '.article-preview',
            titleSelector: '.title',
            contentSelector: '.description'
        },
        {
            url: 'https://www.lequipe.fr/Coaching/',
            selector: '.article',
            titleSelector: 'h2',
            contentSelector: '.description'
        }
    ],
    travail: [
        {
            url: 'https://www.studyrama.com/conseils-d-etudes',
            selector: '.article',
            titleSelector: 'h2',
            contentSelector: '.content'
        },
        {
            url: 'https://www.letudiant.fr/etudes/conseils.html',
            selector: '.article',
            titleSelector: 'h3',
            contentSelector: '.description'
        }
    ]
};

async function scrapeAndSave() {
    try {
        for (const type of ['sport', 'travail']) {
            for (const source of sources[type]) {
                const response = await axios.get(source.url);
                const $ = cheerio.load(response.data);

                $(source.selector).each((i, element) => {
                    if (i < 2) { // Limiter à 2 conseils par source
                        const titre = $(element).find(source.titleSelector).text().trim();
                        const contenu = $(element).find(source.contentSelector).text().trim();
                        
                        // Insérer dans la base de données
                        const sql = `
                            INSERT INTO conseils 
                            (date_publication, type, titre, contenu, source, auteur) 
                            VALUES (CURDATE(), ?, ?, ?, ?, ?)
                        `;

                        db.query(sql, [
                            type,
                            titre,
                            contenu,
                            source.url,
                            'auto-generated'
                        ]);
                    }
                });
            }
        }

        console.log('Conseils mis à jour avec succès');
    } catch (error) {
        console.error('Erreur lors de la récupération des conseils:', error);
    }
}

// Exécuter tous les jours à minuit
const CronJob = require('cron').CronJob;
const job = new CronJob('0 0 * * *', scrapeAndSave);
job.start();

// Exécuter immédiatement pour le test
scrapeAndSave(); 