const express = require('express');
const router = express.Router();
const { auth } = require("../Utilities/utilities");
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const Post = require('../models/Post');

router.post("/",
    [
        auth,
        check("text", "text is required").notEmpty(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const user = await User.findById(req.user.id).select("-password");
            const newPost = new Post(
                {
                    text: req.body.text,
                    name: user.name,
                    user: req.user.id
                }
            );
            const post = await newPost.save();
            res.json(post);

        } catch (error) {
            console.error(error.message);
            res.status(500).send("Server Error");
        }
    }
);

// GET All Posts '/posts'

router.get("/", auth, async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 });
        res.json(posts);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Server Error");
    }
});

// GET Single Post '/posts/:id'

router.get("/:id", auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) return res.status(404).json({ msg: "Post not found" });

        res.json(post);
    } catch (error) {
        console.error(error.message);
        if (error.kind === "ObjectId") return res.status(404).json({ msg: "Post not found" });
        res.status(500).send("Server Error");
    }
});
module.exports = router;