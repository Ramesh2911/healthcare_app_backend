import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
dotenv.config();
connectDB;

const app = express();
app.use(cors({
   origin: 'http://localhost:3000',
   credentials: true
}));
app.use(cors());
app.use(express.json());

// Import and use routes

app.use('/api', userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
