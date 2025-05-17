const passport = require('passport');
require('dotenv').config();

exports.protect = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      let message = 'You are not authorized to access this route.';
      if (info && info.message) {
          message = info.message;
      }
      return res.status(401).json({ success: false, message: message });
    }
    req.user = user;
    next();
  })(req, res, next);
};