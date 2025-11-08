const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

// ⬅️ تم "زرع" نفس المفتاح هنا
const MY_SECRET_KEY = 'your_super_secret_key_for_mohamed_dataannotation_2025';

const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, MY_SECRET_KEY); // ⬅️ استخدمنا المفتاح المزروع
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