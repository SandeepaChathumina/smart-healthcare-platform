import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (user.accountStatus === 'suspended') {
        return res.status(403).json({ message: 'Account is suspended' });
      }

      req.user = user;
      next();
    } catch (error) {
      return res
        .status(401)
        .json({ message: 'Not authorized, token failed or expired' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Access denied. You are not allowed to access this route.'
      });
    }
    next();
  };
};

export const ensureEmailVerified = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      message: 'Please verify your email first'
    });
  }
  next();
};

export const ensureDoctorApproved = (req, res, next) => {
  if (req.user.role === 'Doctor' && req.user.accountStatus !== 'active') {
    return res.status(403).json({
      message: 'Doctor account is not approved yet'
    });
  }
  next();
};