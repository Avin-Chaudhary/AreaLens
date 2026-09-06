const express = require("express");
const locController = require("./../controllers/locController");
const jwt = require("jsonwebtoken");
const User = require("./../models/userModel");
const { protect } = require("./../middlewares/authMiddleware");

const router = express.Router();

router.route("/").get(protect, locController);

module.exports = router;
