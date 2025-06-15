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
        return res.status(400).json({ status: false, message: 'Phone and password are required' });
    }

    db.query('SELECT * FROM users WHERE phone = ?', [phone], async (err, results) => {
        if (err) {
            console.error('SQL error:', err);
            return res.status(500).json({ status: false, message: 'Server error' });
        }

        if (results.length === 0) {
            return res.status(401).json({ status: false, message: 'Invalid phone or password' });
        }

        const user = results[0];
        console.log('User found:', user);

        try {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ status: false, message: 'Invalid phone or password' });
            }

            // Generate JWT token
            const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

            // Calculate expiration date
            const tokenExpiredOn = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
            const tokenExpiredOnISO = tokenExpiredOn.toISOString(); // Optional: format as string

            db.query('UPDATE users SET token = ? WHERE id = ?', [token, user.id], (updateErr) => {
                if (updateErr) {
                    console.error('Token update error:', updateErr);
                    return res.status(500).json({ status: false, message: 'Failed to save token' });
                }

                // Return data in required structure
                return res.status(200).json({
                    status: true,
                    message: "Login successfully.",
                    data: {
                        id: user.id,
                        name: user.name,
                        phone: user.phone,
                        email: user.email,
                        token,
                        token_expired_on: tokenExpiredOnISO,
                        role: user.role,
                        referral_code: user.referral_code,
                        referred_by: user.referred_by,
                        kyc_verified: user.kyc_verified
                    }
                });
            });

        } catch (bcryptError) {
            console.error('bcrypt error:', bcryptError);
            return res.status(500).json({ status: false, message: 'Server error' });
        }
    });
};
