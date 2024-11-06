const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const hashPassword = (password) => {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(12, (err, salt) => {
      if (err) {
        reject(err);
      }
      bcrypt.hash(password, salt, (err, hash) => {
        if (err) {
          reject(err);
        }
        resolve(hash);
      });
    });
  });
};

const comparePassword = (password, hash) => {
  return bcrypt.compare(password, hash);
};

const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { success: true, data: decoded };
  } catch (error) {
    if (error.name === jwt.TokenExpiredError) {
      // return res.status(401).json({ success: false, message: "Token expired" });
      return { sucess: false, message: "Token expired" };
    }
    // return res.status(401).json({ success: false, message: "Unauthorized or invalid token" });
    return { success: false, message: "Unauthorized or invalid token" };
  }
};

module.exports = { hashPassword, comparePassword, verifyAccessToken };
