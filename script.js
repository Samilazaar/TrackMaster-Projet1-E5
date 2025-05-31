class Calendar {
    // Le constructeur est appelé quand on crée un nouveau calendrier
    // Il initialise les données de base nécessaires
    constructor() {
        this.currentDate = new Date();
        this.workouts = new Map(); // Utiliser une Map pour stocker les séances
        this.monthDisplay = document.getElementById('currentMonth');
        this.calendarDays = document.getElementById('calendarDays');
        this.initializeCalendar();
    }

    // Configure tous les éléments du calendrier
    initializeCalendar() {
        // Récupère les éléments HTML nécessaires
        this.prevButton = document.getElementById('prevMonth');    // Bouton mois précédent
        this.nextButton = document.getElementById('nextMonth');    // Bouton mois suivant
        this.monthDisplay = document.getElementById('currentMonth'); // Affichage du mois actuel
        this.calendarDays = document.getElementById('calendarDays'); // Grille des jours

        // Configure les boutons pour changer de mois
        // -1 = mois précédent, +1 = mois suivant
        this.prevButton.addEventListener('click', () => this.changeMonth(-1));
        this.nextButton.addEventListener('click', () => this.changeMonth(1));

        // Affiche le calendrier initial
        this.renderCalendar();
    }

    // Charge toutes les séances depuis le serveur
    async loadWorkouts() {
        try {
            const token = Auth.getToken();
            if (!token) {
                throw new Error('Non authentifié');
            }

            const response = await fetch(`${window.location.origin}/api/seances`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Erreur lors du chargement des séances');
            }

            const workouts = await response.json();
            console.log('Séances reçues:', workouts); // Debug

            // Réinitialiser la Map
            this.workouts = new Map();

            // Grouper les séances par date
            workouts.forEach(workout => {
                const dateKey = workout.date_seance;
                if (!this.workouts.has(dateKey)) {
                    this.workouts.set(dateKey, []);
                }
                this.workouts.get(dateKey).push(workout);
            });

            // Mettre à jour l'affichage
            this.renderCalendar();

            // Mettre à jour les statistiques
            updateStats(workouts);
        } catch (error) {
            console.error('Erreur:', error);
        }
    }

    changeMonth(delta) {
        const newDate = new Date(this.currentDate);
        newDate.setMonth(newDate.getMonth() + delta);

        // Permettre la navigation dans toute la plage de dates
        this.currentDate = newDate;
        this.renderCalendar();
        this.updateStats();
    }

    getWorkoutForSlot(date, slot) {
        console.log('Recherche workout pour:', date, slot); // Debug
        console.log('Workouts disponibles:', this.workouts); // Debug
        const workouts = this.workouts.get(date) || [];
        console.log('Workouts trouvés pour cette date:', workouts); // Debug
        return workouts.find(workout => workout.creneau === parseInt(slot));
    }

    showWorkout(date, slot) {
        const workout = this.getWorkoutForSlot(date, slot);
        if (!workout) return;

        const modal = document.getElementById('workoutModal');
        const modalDate = document.getElementById('modalDate');
        const modalContent = document.getElementById('modalContent');

        modalContent.innerHTML = '';

        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = new Date(date).toLocaleDateString('fr-FR', options);

        // Contenu
        const contentDiv = document.createElement('div');
        contentDiv.textContent = workout.contenu;
        modalContent.appendChild(contentDiv);

        // Actions
        const modalActions = document.createElement('div');
        modalActions.className = 'modal-actions';

        // Bouton de suppression
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-workout';
        deleteButton.textContent = 'Supprimer cette séance';

        deleteButton.onclick = async () => {
            if (!confirm('Êtes-vous sûr de vouloir supprimer cette séance ?')) {
                return;
            }

            deleteButton.disabled = true;
            deleteButton.textContent = 'Suppression en cours...';

            try {
                await this.deleteWorkout(workout.id);
                modal.style.display = 'none';
                await this.loadWorkouts();
                alert('Séance supprimée avec succès');
            } catch (error) {
                alert(error.message);
            } finally {
                deleteButton.disabled = false;
                deleteButton.textContent = 'Supprimer cette séance';
            }
        };

        modalActions.appendChild(deleteButton);
        modalContent.appendChild(modalActions);

        // En-tête
        modalDate.textContent = `${formattedDate} - ${workout.creneau_texte}`;
        modal.style.display = 'block';
    }

    updateNavigationButtons() {
        // Désactiver le bouton précédent si on est en décembre 2024
        const isDecember2024 =
            this.currentDate.getFullYear() === 2024 &&
            this.currentDate.getMonth() === 11;

        if (isDecember2024) {
            this.prevButton.style.opacity = '0.5';
            this.prevButton.style.cursor = 'not-allowed';
        } else {
            this.prevButton.style.opacity = '1';
            this.prevButton.style.cursor = 'pointer';
        }
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // Debug: Afficher le mois/année en cours de rendu
        console.log(`Rendu du calendrier pour ${month + 1}/${year}`);

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay() || 7;

        // Mise à jour du titre du mois
        const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        this.monthDisplay.textContent = `${monthNames[month]} ${year}`;

        let calendarHTML = '';

        // Jours du mois précédent
        for (let i = startingDay - 1; i > 0; i--) {
            const date = new Date(year, month, 1 - i);
            const dateKey = this.formatDate(date);
            calendarHTML += this.generateDayHTML(date, dateKey, false);
        }

        // Jours du mois actuel
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const dateKey = this.formatDate(date);
            calendarHTML += this.generateDayHTML(date, dateKey, true);
        }

        // Jours du mois suivant
        const remainingDays = 42 - (startingDay - 1 + daysInMonth);
        for (let i = 1; i <= remainingDays; i++) {
            const date = new Date(year, month + 1, i);
            const dateKey = this.formatDate(date);
            calendarHTML += this.generateDayHTML(date, dateKey, false);
        }

        this.calendarDays.innerHTML = calendarHTML;
        this.updateNavigationButtons();
        console.log('Rendu du calendrier terminé');
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    generateDayHTML(date, dateKey, isCurrentMonth) {
        const dayWorkouts = this.workouts.get(dateKey) || [];

        return `
            <div class="calendar-day ${isCurrentMonth ? '' : 'other-month'}">
                <div class="day-number">${date.getDate()}</div>
                <div class="workout-slots">
                    ${[1, 2, 3].map(creneau => {
            const workout = dayWorkouts.find(w => parseInt(w.creneau) === creneau);
            console.log('Workout trouvé:', workout); // Debug
            return `
                            <div class="workout-slot ${workout ? `has-workout ${workout.type}` : ''}"
                                 data-date="${dateKey}"
                                 data-slot="${creneau}">
                                 ${workout ? getCreneauText(workout.creneau) : ''}
                            </div>`;
        }).join('')}
                </div>
            </div>`;
    }

    updateStats() {
        // Récupère le mois et l'année actuellement affichés dans le calendrier
        const currentMonth = this.currentDate.getMonth();
        const currentYear = this.currentDate.getFullYear();

        // Initialisation des compteurs pour les statistiques
        let stats = {
            total: 0,          // Nombre total de séances dans le mois
            sport: 0,          // Nombre de séances de sport
            travail: 0,        // Nombre de séances de travail
            creneaux: {        // Compteur par créneau horaire
                'Matin': 0,    // Séances du matin (créneau 1)
                'Midi': 0,     // Séances du midi (créneau 2)
                'Soir': 0      // Séances du soir (créneau 3)
            },
            types: {}          // Pour d'éventuels types supplémentaires
        };

        // Parcours de toutes les séances stockées
        this.workouts.forEach((workouts, date) => {
            // Convertit la date de la séance en objet Date
            const workoutDate = new Date(date);

            // Vérifie si la séance appartient au mois/année en cours
            if (workoutDate.getMonth() === currentMonth &&
                workoutDate.getFullYear() === currentYear) {

                // Pour chaque séance du jour
                workouts.forEach(w => {
                    stats.total++;    // Incrémente le total
                    stats.creneaux[w.creneau_texte]++;  // Compte par créneau
                    stats[w.type]++;  // Compte par type (sport/travail)
                });
            }
        });

        // Mise à jour des compteurs dans l'interface
        document.getElementById('totalWorkouts').textContent = stats.total;
        document.getElementById('sportCount').textContent = stats.sport;
        document.getElementById('travailCount').textContent = stats.travail;

        // Trouve et affiche le créneau le plus utilisé
        document.getElementById('mostActiveTime').textContent =
            Object.entries(stats.creneaux)  // Convertit l'objet en tableau de paires [clé, valeur]
                .sort((a, b) => b[1] - a[1])  // Trie par nombre de séances décroissant
                .shift()[0];  // Prend le premier élément (le plus fréquent) et récupère son nom
    }

    initializeSearch() {
        const searchInput = document.getElementById('searchWorkouts');
        const searchResults = document.getElementById('searchResults');

        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase();
            if (query.length < 2) {
                searchResults.style.display = 'none';
                return;
            }

            const results = this.searchWorkouts(query);
            this.displaySearchResults(results);
        });

        // Fermer les résultats quand on clique ailleurs
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                searchResults.style.display = 'none';
            }
        });
    }

    searchWorkouts(query) {
        const results = [];
        this.workouts.forEach((workouts, date) => {
            workouts.forEach(workout => {
                if (workout.contenu && workout.contenu.toLowerCase().includes(query.toLowerCase())) {
                    results.push({
                        date,
                        ...workout
                    });
                }
            });
        });
        return results;
    }

    displaySearchResults(results) {
        const searchResults = document.getElementById('searchResults');
        if (results.length === 0) {
            searchResults.style.display = 'none';
            return;
        }

        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        searchResults.innerHTML = results.map(result => `
            <div class="search-result-item" onclick="calendar.showWorkoutFromSearch('${result.date}', ${result.creneau})">
                <div class="search-result-date">
                    ${new Date(result.date).toLocaleDateString('fr-FR', options)} - ${result.creneau_texte}
                </div>
                <div class="search-result-preview">${result.contenu}</div>
            </div>
        `).join('');

        searchResults.style.display = 'block';
    }

    showWorkoutFromSearch(date, slot) {
        this.showWorkout(date, slot);
        document.getElementById('searchResults').style.display = 'none';
        document.getElementById('searchWorkouts').value = '';
    }

    // Ajout d'une fonction d'export
    exportWorkouts() {
        const workouts = [];
        this.workouts.forEach((dayWorkouts, date) => {
            dayWorkouts.forEach(workout => {
                workouts.push({
                    date,
                    creneau: workout.creneau_texte,
                    contenu: workout.contenu
                });
            });
        });

        const csv = this.convertToCSV(workouts);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'workouts.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    convertToCSV(workouts) {
        const header = 'Date,Créneau,Contenu\n';
        const rows = workouts.map(workout => {
            return `${workout.date},${workout.creneau},"${workout.contenu.replace(/"/g, '""')}"`;
        });
        return header + rows.join('\n');
    }

    async deleteWorkout(id) {
        try {
            // Ajout de logs pour déboguer
            console.log('Tentative de suppression de la séance:', id);

            const API_URL = window.location.origin;
            const response = await fetch(`${API_URL}/api/seances/${id}`, {
                method: 'DELETE'
            });

            const data = await response.json();
            console.log('Réponse du serveur:', data);  // Debug

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la suppression');
            }

            // Recharger immédiatement les séances
            await this.loadWorkouts();
            return true;
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            throw error;
        }
    }

    updateCalendar(workouts) {
        if (!Array.isArray(workouts)) {
            console.error('updateCalendar: workouts n\'est pas un tableau', workouts);
            return;
        }

        console.log('Mise à jour du calendrier avec:', workouts);

        // Réinitialiser la Map
        this.workouts = new Map();

        // Grouper les séances par date
        workouts.forEach(workout => {
            // S'assurer que la date est au bon format YYYY-MM-DD
            const dateKey = workout.date_seance.split('T')[0]; // Enlever la partie temps si elle existe

            if (!this.workouts.has(dateKey)) {
                this.workouts.set(dateKey, []);
            }

            // S'assurer que le type et le créneau sont corrects
            const formattedWorkout = {
                ...workout,
                type: workout.type.toLowerCase(), // Normaliser le type en minuscules
                creneau: parseInt(workout.creneau) // S'assurer que c'est un nombre
            };

            this.workouts.get(dateKey).push(formattedWorkout);
        });

        // Mettre à jour l'affichage
        this.renderCalendar();
    }
}

class WorkoutManager {
    static async delete(id) {
        const API_URL = window.location.origin;
        const response = await fetch(`${API_URL}/api/seances/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error);
        }

        return true;
    }
}

// Initialisation
const calendar = new Calendar();

// Charger les séances au démarrage
document.addEventListener('DOMContentLoaded', () => {
    if (Auth.isAuthenticated()) {
        calendar.loadWorkouts();
    }
});

// Gestion de la modal
document.addEventListener('DOMContentLoaded', () => {
    // Gestionnaire pour fermer la modal avec le bouton X
    const closeButton = document.querySelector('.modal-close');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            document.getElementById('workoutModal').style.display = 'none';
        });
    }

    // Gestionnaire pour fermer la modal en cliquant en dehors
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('workoutModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});

function displayWorkout(workout) {
    return `
        <div class="workout ${workout.type}" data-id="${workout.id}">
            <span class="workout-time">${getCreneauText(workout.creneau)}</span>
            <span class="workout-type">${workout.type === 'sport' ? '🏃‍♂️ Sport' : '📚 Études'}</span>
            <p class="workout-content">${workout.contenu}</p>
            <button onclick="deleteWorkout(${workout.id})" class="delete-workout">×</button>
        </div>
    `;
}

// Fonction pour obtenir le texte du créneau
function getCreneauText(creneau) {
    switch (parseInt(creneau)) {
        case 1: return 'Matin';
        case 2: return 'Midi';
        case 3: return 'Soir';
        default: return '';
    }
}

// Fonction pour mettre à jour les statistiques
function updateStats(workouts) {
    const currentMonth = new Date().getMonth() + 1;
    const currentWorkouts = workouts.filter(w => {
        const workoutMonth = new Date(w.date_seance).getMonth() + 1;
        return workoutMonth === currentMonth;
    });

    document.getElementById('totalWorkouts').textContent = currentWorkouts.length;
    document.getElementById('sportCount').textContent =
        currentWorkouts.filter(w => w.type === 'sport').length;
    document.getElementById('travailCount').textContent =
        currentWorkouts.filter(w => w.type === 'travail').length;

    // Calcul du créneau le plus utilisé
    const creneauCounts = currentWorkouts.reduce((acc, w) => {
        acc[w.creneau] = (acc[w.creneau] || 0) + 1;
        return acc;
    }, {});

    const mostActive = Object.entries(creneauCounts)
        .sort((a, b) => b[1] - a[1])[0];

    if (mostActive) {
        const creneauTexte = {
            '1': 'Matin',
            '2': 'Midi',
            '3': 'Soir'
        }[mostActive[0]];
        document.getElementById('mostActiveTime').textContent = creneauTexte;
    }
}

// Fonction pour créer une séance
function createWorkoutElement(workout) {
    const workoutEl = document.createElement('div');
    workoutEl.className = `workout ${workout.type}`;
    workoutEl.textContent = getCreneauText(workout.creneau);
    workoutEl.onclick = () => showWorkoutDetails(workout);
    return workoutEl;
}

// Fonction pour le texte du créneau
function getCreneauText(creneau) {
    switch (parseInt(creneau)) {
        case 1: return 'Matin';
        case 2: return 'Midi';
        case 3: return 'Soir';
        default: return '';
    }
}