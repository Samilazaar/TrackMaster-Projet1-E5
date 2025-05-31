-- Supprime la base si elle existe et la recrée
DROP DATABASE IF EXISTS workout_tracker;
CREATE DATABASE workout_tracker;
USE workout_tracker;

-- Création de la table users
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    weekly_goal INT DEFAULT 3,
    study_goal INT DEFAULT 10,
    theme VARCHAR(20) DEFAULT 'light',
    is_admin BOOLEAN DEFAULT FALSE
);

-- Création de la table seances
CREATE TABLE seances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL,
    date_seance DATE NOT NULL,
    creneau INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    contenu TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES users(id),
    UNIQUE KEY unique_seance (date_seance, creneau, utilisateur_id)
);

-- Création des index pour optimiser les performances
CREATE INDEX idx_date_seance ON seances(date_seance);
CREATE INDEX idx_utilisateur ON seances(utilisateur_id);

-- Création de ton compte admin (mot de passe: "123")
INSERT INTO users (id, username, email, password_hash) 
VALUES (1, 'admin', 'admin@example.com', '$2b$10$/JxRRQYiQe4yRuuRDhc4X.vBV5x/UXNKFvWUpsDlQ1Mr003aGTKTG');

-- Toutes les séances sont associées à l'ID 1 (ton compte admin)
INSERT INTO seances (utilisateur_id, date_seance, creneau, type, contenu) VALUES 
(1, '2025-02-01', 2, 'travail', 'Études - 2 heures'),
(1, '2025-02-02', 2, 'travail', 'Études - 2 heures'),
(1, '2025-02-03', 2, 'travail', 'Études - 2 heures'),
(1, '2025-02-04', 2, 'travail', 'Études - 2 heures'),
(1, '2025-02-05', 2, 'travail', 'Études - 2 heures'),
(1, '2025-02-06', 2, 'travail', 'Études - 2 heures'),
(1, '2025-02-07', 2, 'travail', 'Études - 2 heures'),
(1, '2025-02-08', 2, 'travail', 'Études - 2 heures'),
(1, '2025-02-09', 2, 'travail', 'Études - 2 heures'),
(1, '2025-02-10', 2, 'travail', 'Études - 2 heures'),
(1, '2025-02-11', 2, 'travail', 'Études - 2 heures'),
(1, '2025-02-12', 2, 'travail', 'Études - 2 heures'),
(1, '2025-02-13', 2, 'travail', 'Études - 2 heures'),
(1, '2025-02-14', 2, 'travail', 'Études - 2 heures'),
(1, '2025-02-15', 2, 'travail', 'Études - 2 heures'),
(1, '2025-02-16', 2, 'travail', 'Études - 2 heures'),
(1, '2025-02-17', 2, 'travail', 'Études - 2 heures'),
(1, '2025-02-18', 2, 'travail', 'Études - 2 heures'),
(1, '2025-02-19', 2, 'travail', 'Études - 2 heures'),
(1, '2025-02-20', 2, 'travail', 'Études - 2 heures'),
(1, '2025-02-21', 2, 'travail', 'Études - 2 heures'),
(1, '2025-02-22', 2, 'travail', 'Études - 2 heures'),
(1, '2025-02-23', 2, 'travail', 'Études - 2 heures'),
(1, '2025-02-24', 2, 'travail', 'Études - 2 heures'),
(1, '2025-02-25', 2, 'travail', 'Études - 2 heures'),
(1, '2025-02-26', 2, 'travail', 'Études - 2 heures'),
(1, '2025-02-27', 2, 'travail', 'Études - 2 heures'),
(1, '2025-02-28', 2, 'travail', 'Études - 2 heures');

-- Mettre à jour l'utilisateur admin
UPDATE users SET is_admin = TRUE WHERE id = 1;

-- Création de la table conseils
CREATE TABLE conseils (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date_publication DATE,
    type VARCHAR(50),
    titre VARCHAR(255),
    contenu TEXT,
    source VARCHAR(255),
    auteur VARCHAR(100)
);

-- Insérer quelques conseils initiaux
INSERT INTO conseils (date_publication, type, titre, contenu, source, auteur) VALUES
('2024-03-20', 'sport', 'Hydratation pendant l''effort', 'Pour une performance optimale, buvez 200-300ml d''eau toutes les 15-20 minutes pendant l''exercice. La déshydratation de seulement 2% peut réduire les performances jusqu''à 20%.', 'Journal of Sports Medicine', 'admin'),
('2024-03-21', 'travail', 'Règle des 2 minutes', 'Si une tâche prend moins de deux minutes, faites-la immédiatement. Cette règle de productivité évite l''accumulation de petites tâches et réduit la charge mentale.', 'Getting Things Done - David Allen', 'admin');

-- Ajouter plus de conseils initiaux
INSERT INTO conseils (date_publication, type, titre, contenu, source, auteur) VALUES
('2024-03-22', 'sport', 'Récupération post-entraînement', 'Les 30 minutes suivant l''exercice sont cruciales pour la récupération. Consommez un mélange de protéines et de glucides pour optimiser la reconstruction musculaire.', 'https://www.insep.fr/conseils-recuperation', 'auto-generated'),
('2024-03-22', 'travail', 'Technique de mémorisation active', 'La méthode des loci : associez chaque information à un lieu familier. Cette technique améliore la mémorisation de 60% selon les études.', 'https://www.sciencedaily.com/memory-techniques', 'auto-generated'),
('2024-03-23', 'sport', 'Importance du sommeil', 'Les athlètes dormant moins de 8h par nuit ont 1.7 fois plus de risques de blessures. Visez 8-9h de sommeil pour une récupération optimale.', 'https://www.sleepfoundation.org/athletes', 'auto-generated'),
('2024-03-23', 'travail', 'Pause optimale', 'La recherche montre qu''une pause de 17 minutes toutes les 52 minutes de travail maximise la productivité et la concentration.', 'https://www.sciencedirect.com/productivity', 'auto-generated'); 