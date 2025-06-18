import express from 'express';
import dotenv from 'dotenv'; 
import cors from 'cors';
import cookieParser from 'cookie-parser'; 
import rateLimiter from './middleware/rateLimiter.js';
import authRoutes from './routes/authRoutes.js';
import cryptoRoutes from './routes/cryptoRoutes.js';
import coinsRouter from './routes/coins.js'; 
import portfolioRouter from './routes/portfolio.js';
import newsRoutes from './routes/newsRoutes.js';


dotenv.config(); 

const app = express();

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.use(cookieParser());

app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true,
}));

app.use(rateLimiter);

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/crypto', cryptoRoutes);
app.use('/api/coins', coinsRouter); 
app.use('/api/portfolio', portfolioRouter);
app.use('/api/news', newsRoutes);

export default app;