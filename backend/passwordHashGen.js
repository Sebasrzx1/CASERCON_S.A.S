const bcrypt = require('bcrypt')
const password = "admin123";

async function generarHash(){
    const passwordHash = await bcrypt.hash(password, 10);
    console.log('Contraseña: ', passwordHash)
}

generarHash()