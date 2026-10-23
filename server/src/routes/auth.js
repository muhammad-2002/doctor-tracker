const router = require('express').Router();
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { loginBody } = require('../validators/schemas');
const { AppError, asyncHandler } = require('../utils/errors');

const cookieOptions = () => ({
  httpOnly: true, // not readable from JS -> XSS cannot steal the session
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many sign-in attempts. Try again in a few minutes.' },
});

router.post('/login', loginLimiter, validate(loginBody), asyncHandler(async (req, res) => {
  const { email, password } = req.valid.body;
  const user = await User.findOne({ email }).select('+password');
  // Same message for unknown email and wrong password so accounts cannot be enumerated.
  if (!user || !(await user.matchesPassword(password))) throw new AppError('Invalid email or password', 401);
  const token = jwt.sign({ sub: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
  res.cookie('token', token, cookieOptions());
  res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
}));

router.post('/logout', (_req, res) => {
  res.clearCookie('token', { ...cookieOptions(), maxAge: undefined });
  res.status(204).end();
});

router.get('/me', protect, (req, res) => res.json({ user: req.user }));

module.exports = router;
