const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError, asyncHandler } = require('../utils/errors');

exports.protect = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.token || (req.headers.authorization || '').replace(/^Bearer /, '');
  if (!token) throw new AppError('Authentication required', 401);
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new AppError('Your session has expired. Sign in again.', 401);
  }
  const user = await User.findById(payload.sub).select('name email role').lean();
  if (!user) throw new AppError('Account no longer exists', 401);
  req.user = { id: user._id, name: user.name, email: user.email, role: user.role };
  next();
});

exports.restrictTo = (...roles) => (req, _res, next) =>
  roles.includes(req.user.role) ? next() : next(new AppError('You do not have access to this resource', 403));
