/**
 * Définit le mot de passe administrateur (même algorithme SHA-256 que server.js).
 * Usage : node scripts/set-admin-password.js [motDePasse]
 * Défaut : supbasket2026
 */
const path = require('path');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const plain = process.argv[2] || 'supbasket2026';

if (String(plain).length < 8) {
    console.error('Le mot de passe doit contenir au moins 8 caractères.');
    process.exit(1);
}

const hash = crypto.createHash('sha256').update(String(plain)).digest('hex');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Base :', err.message);
        process.exit(1);
    }
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS admin_config (
        key TEXT PRIMARY KEY,
        value TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS admin_sessions (
        token TEXT PRIMARY KEY,
        expires_at INTEGER
    )`);
    db.run(
        `INSERT INTO admin_config (key, value) VALUES ('admin_password', ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        [hash],
        function (e) {
            if (e) {
                console.error(e.message);
                process.exit(1);
            }
            db.run(`DELETE FROM admin_sessions`, [], (e2) => {
                if (e2) console.error(e2.message);
                console.log('Mot de passe administrateur mis à jour. Sessions fermées.');
                db.close();
            });
        }
    );
});
