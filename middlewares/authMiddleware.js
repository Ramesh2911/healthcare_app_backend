const jwt = require('jsonwebtoken');
const db = require('../config/db');

const protect = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) return res.status(401).json({ message: 'Token is not valid' });

            const sql = 'SELECT * FROM users WHERE id = ?';
            db.query(sql, [decoded.id], (err, results) => {
                if (err || results.length === 0) {
                    return res.status(401).json({ message: 'User not found' });
                }
                req.user = results[0];
                next();
            });
        });
    } else {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = protect;