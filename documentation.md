# Documentation du Projet Workout History - Partie 1 : Structure Générale

## Vue d'ensemble
Cette application permet de suivre ses séances de sport et d'études. Voici une explication détaillée de chaque composant.

## 1. Fichiers principaux

### index.html
- **Rôle** : Page d'accueil de l'application
- **Contenu** : 
  - Barre de navigation responsive
  - Section de présentation
  - Liens vers connexion/inscription
- **Fonctionnalités** :
  - Détection automatique de connexion
  - Redirection selon le statut de l'utilisateur
  - Menu adaptatif selon les droits

### workouts.html
- **Rôle** : Page principale avec le calendrier
- **Composants** :
  - Calendrier interactif
  - Formulaire d'ajout de séances
  - Section statistiques
  - Système de recherche
- **Fonctionnalités** :
  - Affichage des séances par date
  - Ajout/suppression de séances
  - Filtrage par type (sport/études)
  - Export des données

### script.js
- **Rôle** : Gestion du calendrier et des interactions
- **Classes principales** :
  - Calendar : Gère l'affichage et les interactions
  - WorkoutManager : Gère les opérations CRUD
- **Fonctionnalités clés** :
  - Navigation entre les mois
  - Mise à jour en temps réel
  - Calcul des statistiques

## Table des matières
1. [Structure du projet](#structure)
2. [Base de données](#database)
3. [Serveur (server.js)](#server)
4. [Authentification (auth.js)](#auth)
5. [Interface utilisateur](#ui)
6. [Calendrier (script.js)](#calendar)
7. [Pages HTML](#pages)
8. [Configuration Vercel](#vercel)

## 1. Structure du projet <a name="structure"></a>

### Organisation des fichiers 