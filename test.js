const bcrypt = require("bcryptjs");

async function generateHash(password) {
    // const password = "password123"; // Use the same password for login
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    console.log("New Hashed Password:", hash);
    return hash;
}

module.exports = generateHash;
