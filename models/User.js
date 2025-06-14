const db = require('../config/db');

const createUser = (userData, callback) => {
    const sql = 'INSERT INTO users SET ?';
    db.query(sql, userData, callback);
};

const findUserByEmail = (email, callback) => {
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], (err, results) => {
        if (err) return callback(err);
        callback(null, results[0]);
    });
};

module.exports = { createUser, findUserByEmail };