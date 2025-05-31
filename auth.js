// Gestion de l'authentification
class Auth {
    static isAuthenticated() {
        return localStorage.getItem('userToken') !== null;
    }

    static getToken() {
        return localStorage.getItem('userToken');
    }

    static logout() {
        localStorage.removeItem('userToken');
        window.location.href = '/';
    }

    static updateNavigation() {
        const nav = document.querySelector('nav ul');
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        if (this.isAuthenticated()) {
            nav.innerHTML = `
                <li><a href="index.html" ${currentPage === 'index.html' ? 'class="active"' : ''}>Accueil</a></li>
                <li><a href="workouts.html" ${currentPage === 'workouts.html' ? 'class="active"' : ''}>Mes Séances</a></li>
                <li><a href="conseils.html" ${currentPage === 'conseils.html' ? 'class="active"' : ''}>Conseils</a></li>
                <li><a href="about.html" ${currentPage === 'about.html' ? 'class="active"' : ''}>À propos</a></li>
                <li><a href="#" onclick="Auth.logout(); return false;">Déconnexion</a></li>
            `;
        } else {
            nav.innerHTML = `
                <li><a href="index.html" ${currentPage === 'index.html' ? 'class="active"' : ''}>Accueil</a></li>
                <li><a href="about.html" ${currentPage === 'about.html' ? 'class="active"' : ''}>À propos</a></li>
                <li><a href="conseils.html" ${currentPage === 'conseils.html' ? 'class="active"' : ''}>Conseils</a></li>
                <li><a href="login.html" ${currentPage === 'login.html' ? 'class="active"' : ''}>Connexion</a></li>
                <li><a href="register.html" ${currentPage === 'register.html' ? 'class="active"' : ''}>Inscription</a></li>
            `;
        }
    }

    static checkAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    static redirectIfAuthenticated() {
        if (this.isAuthenticated()) {
            window.location.href = 'workouts.html';
            return true;
        }
        return false;
    }

    static async register(username, email, password) {
        const response = await fetch(`${window.location.origin}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Erreur lors de l\'inscription');
        }

        localStorage.setItem('userToken', data.token);
        return data;
    }

    static async login(email, password) {
        const response = await fetch(`${window.location.origin}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
    }
} 