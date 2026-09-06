const jwt = require("jsonwebtoken");
const User = require("./../models/userModel");

exports.protect = async (req, res, next) => {
  try {
    let token;

    // 1️⃣ Get token from cookie
    if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        status: "failure",
        msgcode: 1020,
        message: "You are not logged in. Please log in to get access.",
      });
    }

    // 2️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded = { id, iat, exp }

    // 3️⃣ Check if user still exists
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        status: "failure",
        msgcode: 1020,
        message: "The user belonging to this token no longer exists.",
      });
    }

    // 4️⃣ Check if password was changed after token was issued
    if (user.lastPasswordChange && user.lastPasswordChange > decoded.iat) {
      return res.status(401).json({
        status: "failure",
        msgcode: 1020,
        message: "Password was changed recently. Please log in again.",
      });
    }

    // 5️⃣ Grant access
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      status: "failure",
      msgcode: 1020,
      message: "Invalid or expired token",
    });
  }
};
