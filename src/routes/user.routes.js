import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistory,
  loginUser,
  LogoutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage
} from "../controllers/user.controllers.js";

import { upload } from "../middlewares/multer.middleware.js";
import { body, validationResult } from "express-validator";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = Router();

const validator = [
  body("username")
    .notEmpty()
    .trim()
    .withMessage("Username required")
    .isLength({ min: 3, max: 20 })
    .withMessage("Username must be 3–20 chars"),
  body("email")
    .notEmpty()
    .trim()
    .withMessage("Email required")
    .isEmail()
    .withMessage("Invalid email format"),
  body("fullname")
    .notEmpty()
    .trim()
    .withMessage("Fullname required")
    .isLength({ min: 3, max: 20 })
    .withMessage("Fullname must be 3–20 chars"),
  body("password")
    .notEmpty()
    .matches(/^(?=.*\d)(?=.*[A-Z]).{6,}$/)
    .withMessage("Password must contain at least 1 number, 1 uppercase, and be 6+ chars"),
  body("avatar")
    .notEmpty()
    .withMessage("Avatar is required")
];

// Public Routes
router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1
    },
    {
      name: "coverImage",
      maxCount: 1
    }
  ]),
  ...validator,
  registerUser
);

router.route("/login").post(loginUser);
// here registerUser is method

// Secured Routes
router.route("/logout").post(verifyJWT, LogoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);
// Params
router.route("/c/:username").get(verifyJWT, getUserChannelProfile);
router.route("/history").get(verifyJWT, getWatchHistory);

export default router;