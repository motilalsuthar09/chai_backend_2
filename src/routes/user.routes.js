import { Router } from "express";
import { loginUser , LogoutUser, registerUser } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js"
const router = Router()
import { body, validationResult } from "express-validator";
import{ verifyJWT } from "../middlewares/auth.middleware.js"

const validator=[
    body('username').notEmpty().trim().withMessage("Username required").isLength({ min: 3, max: 20 }).withMessage("Username must be 3–20 chars"),
    body('email').notEmpty().trim().withMessage("Email required").isEmail().withMessage('Invalid email format'),
    body('fullname')
        .notEmpty().trim().withMessage("Fullname required").isLength({ min: 3, max: 20 }).withMessage("Fullname must be 3–20 chars"),

    body('password').notEmpty()
        .matches(/^(?=.*\d)(?=.*[A-Z]).{6,}$/)
        .withMessage('Password must contain at least 1 number, 1 uppercase, and be 6+ chars'),
        body('avatar').notEmpty().withMessage("Avatar is required")
];

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
    ]), ...validator,
    registerUser)

router.route("/login").post(loginUser)
// here registeruser is method 


//secured Routes
router.route("/logout").post(verifyJWT, LogoutUser)

export default router