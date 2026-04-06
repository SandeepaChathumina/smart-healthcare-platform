const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Since we're using shared database, we can query User model directly
const User = mongoose.model('User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database (shared with auth-service)
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
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Access denied. Required role: ' + roles.join(' or ')
      });
    }
    next();
  };
};

module.exports = { protect, authorizeRoles };