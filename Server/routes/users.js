const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const Utilities = require("../Utilities/utilities");

let refreshTokens = [];

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

            user = new User({ name, email, password });
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
            await user.save();

            const payload = { user: { id: user.id } };
            const accessToken = jwt.sign(payload, config.get("jwtSecret"), { expiresIn: "15m" });
            const refreshToken = jwt.sign(payload, config.get("jwtRefreshSecret"), { expiresIn: "30d" });
            refreshTokens.push(refreshToken);

            res.json({ accessToken, refreshToken });
        } catch (err) {
            console.error(err.message);
            res.status(500).send(err.message);
        }
    }
);

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

            const payload = { user: { id: user.id } };
            const accessToken = jwt.sign(payload, config.get("jwtSecret"), { expiresIn: "15m" });
            const refreshToken = jwt.sign(payload, config.get("jwtRefreshSecret"), { expiresIn: "30d" });
            refreshTokens.push(refreshToken);

            res.json({ accessToken, refreshToken });
        } catch (err) {
            console.error(err.message);
            res.status(500).send(err.message);
        }
    }
);

router.post("/refresh-token", (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(401).json({ msg: "No refresh token provided" });
    }

    if (!refreshTokens.includes(token)) {
        return res.status(403).json({ msg: "Invalid refresh token" });
    }

    jwt.verify(token, config.get("jwtRefreshSecret"), (err, user) => {
        if (err) {
            return res.status(403).json({ msg: "Invalid refresh token" });
        }

        const accessToken = jwt.sign(
            { user: { id: user.user.id } },
            config.get("jwtSecret"),
            { expiresIn: "15m" }
        );
        res.json({ accessToken });
    });
});

router.post("/logout", (req, res) => {
    const { token } = req.body;
    refreshTokens = refreshTokens.filter(t => t !== token);
    res.json({ msg: "Logged out successfully" });
});

router.get("/", Utilities.auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }
        res.json(user);
    } catch (err) {
        console.error("Error fetching user:", err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;