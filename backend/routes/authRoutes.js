import express from 'express';
import rateLimit from 'express-rate-limit';
import { login, signup,refreshToken } from '../controller/authController.js'; 
const router = express.Router();

// rate limiter for login
const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 5, 
  message: {
    status: 429,
    message: 'Too many login attempts, please try again later.',
  },
});

router.post('/login', loginLimiter, login);

router.post('/signup', signup);

router.post('/refresh-token', refreshToken);

export default router;