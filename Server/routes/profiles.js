const express = require('express');
const router = express.Router();
const Utilities = require("../Utilities/utilities");
const Profile = require("../models/Profile");
const { check, validationResult } = require("express-validator");
const normalize = require("normalize-url");

router.post('/', Utilities.auth,
    [
        check('status', 'Status is required').notEmpty(),
        check('skills', 'Skills are required').notEmpty(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { website, skills, youtube, twitter, facebook, linkedin, instagram, github, ...rest } = req.body;

        const profileFields = {
            user: req.user.id,
            website: website && website !== "" ? normalize(website, { forceHttps: true }) : "",
            skills: Array.isArray(skills) ? skills : skills.split(",").map(s => s.trim()),
            ...rest
        };

        const socialProfileFields = { youtube, twitter, facebook, linkedin, instagram, github };

        // Iterate over the social profile fields
        for (const key of Object.keys(socialProfileFields)) {
            if (socialProfileFields[key] && socialProfileFields[key] !== "") {
                profileFields[key] = normalize(socialProfileFields[key], { forceHttps: true });
            }
        }

        profileFields.social = socialProfileFields;

        try {
            let profile = await Profile.findOneAndUpdate(
                { user: req.user.id },
                { $set: profileFields },  // Updated the update operation to use $set
                { new: true, upsert: true }
            );
            res.json(profile);
        } catch (err) {
            console.error("Error saving profile:", err.message);
            res.status(500).send("Server error");
        }
    }
);
router.get('/me', Utilities.auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name']);
        if (!profile) return res.status(400).json({ msg: "No profile found for this user" });
        return res.json(profile);
    } catch (err) {
        console.error("Error fetching profile:", err.message);
        res.status(500).send("Server error");
    }
});

router.get('/', Utilities.auth, async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name']);
        return res.json(profiles);
    } catch (err) {
        console.error("Error fetching profile:", err.message);
        res.status(500).send("Server error");
    }
});

router.get('/users/:user_id', Utilities.auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name']);
        if (!profile) return res.status(400).json({ msg: "No profile found for this user" });
        return res.json(profile);
    } catch (err) {
        if (err.kind === 'ObjectId') return res.status(404).json({ msg: "Profile not found" });
        console.error("Error fetching profile:", err.message);
        res.status(500).send("Server error");
    }
});

module.exports = router;
