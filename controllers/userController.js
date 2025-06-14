import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from '../config/db.js';

//const User  from('../models/User');

export const registerUser = (req, res) => {
    const { name, email, phone, password, role, referral_code, referred_by } = req.body;

    if (!name || !email || !phone || !password) {
        return res.status(400).json({ error: 'Please fill all fromd fields' });
    }

    try {
        // Check if phone already exists
        db.query('SELECT * FROM users WHERE phone = ?', [phone], async (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (results.length > 0) {
                return res.status(409).json({ error: 'Phone number already registered' });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert new user
            const sql = `
        INSERT INTO users (name, email, phone, password, role, referral_code, referred_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
            const values = [name, email, phone, hashedPassword, role || 'user', referral_code || null, referred_by || null];

            db.query(sql, values, (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Failed to register user' });
                }

                res.status(200).json({ message: 'User registered successfully', user_id: result.insertId });
            });
        });

    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const loginUser = (req, res) => {
    const { phone, password } = req.body;

    console.log('Login request body:', req.body);

    if (!phone || !password) {
        return res.status(400).json({ message: 'Phone and password are required' });
    }

    db.query('SELECT * FROM users WHERE phone = ?', [phone], async (err, results) => {
        if (err) {
            console.error('SQL error:', err);
            return res.status(500).json({ message: 'Server error' });
        }

        console.log('User query result:', results);

        if (results.length === 0) {
            return res.status(401).json({ message: 'Invalid phone or password' });
        }

        const user = results[0];
        console.log('User password from DB:', user.password);

        try {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid phone or password' });
            }

            const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

            db.query('UPDATE users SET token = ? WHERE id = ?', [token, user.id], (updateErr) => {
                if (updateErr) {
                    console.error('Token update error:', updateErr);
                    return res.status(500).json({ message: 'Failed to save token' });
                }

                const { password, ...userWithoutPassword } = user;
                res.status(200).json({
                    message: 'Login successful',
                    token,
                    user: userWithoutPassword
                });
            });

        } catch (bcryptError) {
            console.error('bcrypt error:', bcryptError);
            return res.status(500).json({ message: 'Server error' });
        }
    });
};
