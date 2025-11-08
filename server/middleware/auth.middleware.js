const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

// JWT Secret Key is now read from process.env.JWT_SECRET.

const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.user.id).select('-password');
      next();
    } catch (error) {
      console.error('Token verification failed:', error.message);
      res.status(401).json({ msg: 'Token is not valid' });
    }
  }

  if (!token) {
    res.status(401).json({ msg: 'No token, authorization denied' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    res.status(403).json({ msg: 'Not authorized as an admin' });
  }
};

module.exports = { protect, admin };