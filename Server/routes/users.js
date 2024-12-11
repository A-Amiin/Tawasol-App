const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
import { auth } from "../Utilities/utilities";

// @route   POST /register
// @desc    User registration
// @access  Public
router.post(
    "/register",
    [
        check("name", "Name is required").notEmpty(),
        check("email", "Please enter a valid email").isEmail(),
        check("password", "Password must be at least 6 characters").isLength({ min: 6 }),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password } = req.body;

        try {
            let user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({ errors: [{ msg: "Email already exists" }] });
            }

            user = new User({
                name,
                email,
                password,
            });

            // Hash the password before saving it to the database
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
            await user.save();

            const payload = {
                user: {
                    id: user.id,
                },
            };

            jwt.sign(
                payload,
                config.get("jwtSecret"),
                { expiresIn: "3 days" },
                (err, token) => {
                    if (err) throw err;
                    res.json({ token });
                }
            );
        } catch (err) {
            console.error(err.message);
            res.status(500).send(err.message);
        }
    }
);

// @route   POST /login
// @desc    User login
// @access  Public
router.post(
    "/login",
    [
        check("email", "Please enter a valid email").isEmail(),
        check("password", "Password is required").notEmpty(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            let user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ errors: [{ msg: "Invalid Credentials" }] });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ errors: [{ msg: "Invalid Credentials" }] });
            }

            const payload = {
                user: {
                    id: user.id,
                },
            };

            jwt.sign(
                payload,
                config.get("jwtSecret"),
                { expiresIn: "3 days" },
                (err, token) => {
                    if (err) throw err;
                    res.json({ token });
                }
            );
        } catch (err) {
            console.error(err.message);
            res.status(500).send(err.message);
        }
    }
);

// @route   GET /
// @desc    Get logged-in user details
// @access  Private
router.get("/", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password"); // Fetch user by ID from token
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }
        res.json(user); // Send user details as response
    } catch (err) {
        console.error("Error fetching user:", err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;
