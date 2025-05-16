const express = require('express');
const router = express.Router();
const Utilities = require("../Utilities/utilities");
const Profile = require("../models/Profile");
const User = require("../models/User");
const Posts = require("../models/Post");
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

router.delete('/', Utilities.auth, async (req, res) => {
    //removing the user and all about it
    try {
        await Promise.all([
            Posts.deleteMany({ user: req.user.id }),  // deleting all posts made by the user
            User.findByIdAndDelete(req.user.id),
            Profile.findOneAndDelete({ user: req.user.id })
        ]);
        res.json({ msg: "User information deleted successfully" });
    } catch (err) {
        console.error("Error deleting user:", err.message);
        res.status(500).send("Server error");
    }

});

router.post("upload", Utilities.auth, async (req, res) => {
    //uploading the file
    try {
        Utilities.upload(req, res, async (err) => {
            if (err) {
                console.error("Error uploading file:", err.message);
                return res.status(400).send("Error uploading file");
            } else {
                res.status(200).send(req.user.id);
            }
        })
    } catch (e) {
        console.error("Error uploading file:", e.message);
        return res.status(500).send("Server error");
    }
});

router.put("/experience", Utilities.auth,
    check("title", "Title is requaired").notEmpty(),
    check("company", "Company is requaired").notEmpty(),
    check("from", "From date is requaired, needs to be form the past").notEmpty().custom((value, { req }) => {
        return req.body.to ? value < req.body.to : true;
    }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const profile = await Profile.findOne({ user: req.user.id });
            profile.experience.unshift(req.body);
            await profile.save();
            return res.json(profile);
        } catch (err) {
            console.error("Error updating experience:", err.message);
            res.status(500).send("Server error");
        }
    }
);

router.delete("/experience/:exp_id", Utilities.auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        profile.experience = profile.experience.filter(exp => {
            return exp._id.toString() !== req.params.exp_id;
        });
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error("Error deleting experience:", err.message);
        res.status(500).send("Server error");
    }
});

router.put("/education", Utilities.auth,
    check("school", "School is requaired").notEmpty(),
    check("degree", "Degree is requaired").notEmpty(),
    check("fieldOfStudy", "Company is requaired").notEmpty(),
    check("from", "From is requaired, needs to be form the past").notEmpty().custom((value, { req }) => {
        return req.body.to ? value < req.body.to : true;
    }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const profile = await Profile.findOne({ user: req.user.id });
            profile.education.unshift(req.body);
            await profile.save();
            return res.json(profile);
        } catch (err) {
            console.error("Error updating experience:", err.message);
            res.status(500).send("Server error");
        }
    }
);

router.delete("/education/:edu_id", Utilities.auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        profile.education = profile.education.filter(edu => {
            return edu._id.toString() !== req.params.edu_id;
        });
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error("Error deleting experience:", err.message);
        res.status(500).send("Server error");
    }
});

module.exports = router;
