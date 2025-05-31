const bcrypt = require('bcrypt');

async function testHash() {
    const password = "123";
    const storedHash = '$2a$10$VK2c0YqzydpXo1zZVw.YXuEw.8LcuXDJh0Z.4kKxZxz4EBwcGnXm6';

    try {
        const isValid = await bcrypt.compare(password, storedHash);
        console.log('Test de comparaison:', {
            password,
            storedHash,
            isValid
        });
    } catch (error) {
        console.error('Erreur:', error);
    }
}

testHash(); 