const express = require("express");
const userController = require("./../controllers/userController");
const { protect } = require("./../middlewares/authMiddleware");

const router = express.Router();

router.route("/signup").post(userController.signUp);
router.route("/signin").post(userController.signIn);
router.route("/updatepassword").post(userController.updatePassword);
router.route("/delete").post(userController.deleteUser);
router.route("/me").get(protect, userController.getMe);
router.route("/signout").post(userController.signOut);

module.exports = router;

