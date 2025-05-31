const bcrypt = require('bcrypt');

async function generateHash() {
    const password = "123";
    const hash = await bcrypt.hash(password, 10);
    console.log('Hash pour le mot de passe "123":', hash);
}

generateHash(); 