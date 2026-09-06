const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Please tell us your name!"],
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 8,
  },
  lastPasswordChange: {
    type: Number, // seconds since epoch
    default: () => Math.floor(Date.now() / 1000),
  },
});

const userModel = mongoose.model("User", userSchema);

module.exports = userModel;
