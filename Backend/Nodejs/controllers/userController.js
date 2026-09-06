const bcrypt = require("bcryptjs");
const User = require("./../models/userModel");
const jwt = require("jsonwebtoken");

/* =====================================================
   Helper functions
===================================================== */

const authenticateUser = async (username, password) => {
  const user = await User.findOne({ username }).select("+password");

  if (!user) return null;

  const isCorrect = await bcrypt.compare(password, user.password);
  if (!isCorrect) return null;

  return user;
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const sendCookieToken = (token, statusCode, res, msg) => {
  const days = Number(process.env.JWT_COOKIE_EXPIRES_IN) || 7;
  const isProd = process.env.NODE_ENV === "production";

  res.cookie("jwt", token, {
    expires: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: isProd,                  // ✅ HTTPS only in prod
    sameSite: isProd ? "none" : "lax",// 🔥 FIX
    path: "/",
  });

  res.status(statusCode).json({
    status: "success",
    message: msg,
  });
};




/* =====================================================
   AUTH CONTROLLERS
===================================================== */

exports.signUp = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        status: "failure",
        msgcode: 1521,
        message: "Username and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        status: "failure",
        msgcode: 1520,
        message: "Password must be at least 8 characters",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      username,
      password: hashedPassword,
      lastPasswordChange: Math.floor(Date.now() / 1000),
    });

    const token = generateToken(user._id);
    sendCookieToken(token, 201, res, "Successfully signed up");
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        status: "failure",
        msgcode: 1515,
        message: "Username already exists",
      });
    }

    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

exports.signIn = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        status: "failure",
        msgcode: 1521,
        message: "Please provide username and password",
      });
    }

    const user = await authenticateUser(username, password);

    if (!user) {
      return res.status(401).json({
        status: "failure",
        msgcode: 1510,
        message: "Incorrect username or password",
      });
    }

    const token = generateToken(user._id);
    sendCookieToken(token, 200, res, "Successfully signed in");
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { username, password, newPassword } = req.body;

    if (!username || !password || !newPassword) {
      return res.status(400).json({
        status: "failure",
        msgcode: 1482,
        message: "Username, current password and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        status: "failure",
        msgcode: 1520,
        message: "New password must be at least 8 characters",
      });
    }

    const user = await authenticateUser(username, password);

    if (!user) {
      return res.status(401).json({
        status: "failure",
        msgcode: 1510,
        message: "Invalid username or password",
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.lastPasswordChange = Math.floor(Date.now() / 1000) - 1;

    await user.save();

    const token = generateToken(user._id);
    sendCookieToken(token, 200, res, "Password updated successfully");
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        status: "failure",
        msgcode: 1521,
        message: "Username and password are required",
      });
    }

    const user = await authenticateUser(username, password);

    if (!user) {
      return res.status(401).json({
        status: "failure",
        msgcode: 1510,
        message: "Invalid username or password",
      });
    }

    await User.findByIdAndDelete(user._id);

    res.status(200).json({
      status: "success",
      message: "User deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const token = req.cookies?.jwt;

    // 1️⃣ No cookie → logged out
    if (!token) {
      return res.status(200).json({
        status: "success",
        data: null,
      });
    }

    // 2️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    // 3️⃣ User not found
    if (!user) {
      return res.status(200).json({
        status: "success",
        data: null,
      });
    }

    // 4️⃣ Logged in
    res.status(200).json({
      status: "success",
      data: { username: user.username },
    });
  } catch {
    // 5️⃣ Invalid / expired token
    res.status(200).json({
      status: "success",
      data: null,
    });
  }
};



exports.signOut = (req, res) => {
  res.cookie("jwt", "", {
    expires: new Date(0),      // destroy immediately
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",                 // MUST match
  });

  res.status(200).json({
    status: "success",
    message: "Successfully signed out",
  });
};










