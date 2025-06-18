import rateLimit from 'express-rate-limit';

// global rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100, // each IP to 100 requests per windowMs (rate limiting rules)
  message: {
    status: 429,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true, 
  legacyHeaders: false, 
});

export default limiter;