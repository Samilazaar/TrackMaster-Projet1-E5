// Gestion de l'authentification
class Auth {
    static isAuthenticated() {
        const token = localStorage.getItem('userToken');
        if (!token) return false;

        try {
            // Vérifier si le token est valide
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (!payload) {
                localStorage.removeItem('userToken');
                return false;
            }
            return true;
        } catch (e) {
            localStorage.removeItem('userToken');
            return false;
        }
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
        if (!nav) return;

        if (this.isAuthenticated()) {
            nav.innerHTML = `
                <li><a href="/">Accueil</a></li>
                <li><a href="/workouts.html">Calendrier</a></li>
                <li><a href="/conseils.html">Conseils</a></li>
                <li><a href="#" onclick="Auth.logout()">Déconnexion</a></li>
            `;
        } else {
            nav.innerHTML = `
                <li><a href="/">Accueil</a></li>
                <li><a href="/login.html">Connexion</a></li>
                <li><a href="/register.html">Inscription</a></li>
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
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur de connexion');
            }

            if (!data.token) {
                throw new Error('Token non reçu');
            }

            localStorage.setItem('userToken', data.token);
            return data;
        } catch (error) {
            throw new Error(error.message || 'Erreur lors de la connexion');
        }
    }
} 