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

// puting like to the post

router.put("/like/:id", auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (post.likes.some(like => like.user.toString() === req.user.id)) {
            return res.status(400).json({ message: "Post already liked" });
        }

        post.likes.unshift({ user: req.user.id });

        await post.save();

        return res.json(post.likes);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Server Error");
    }
});

// unlike the post

router.put("/unlike/:id", auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post.likes.some(like => like.user.toString() === req.user.id)) {
            return res.status(400).json({ message: "Post not yet liked" });
        }

        post.likes = post.likes.filter(like => like.user.toString() !== req.user.id);

        await post.save();

        return res.json(post.likes);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Server Error");
    }
});

// Create a new Api for the Comment object

router.post(
    "/comment/:id",
    [
        auth,
        check("text", "Text is required").notEmpty()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            // Fetch the current user using the user ID from the auth token
            const user = await User.findById(req.user.id).select("-password");

            // Find the post using the post ID from the params
            const post = await Post.findById(req.params.id);

            if (!post) {
                return res.status(404).json({ message: "Post not found" });
            }

            // Create the new comment
            const newComment = {
                text: req.body.text,
                name: user.name,
                user: req.user.id
            };

            // Add the comment at the beginning of the comments array
            post.comments.unshift(newComment);

            // Save the updated post
            await post.save();

            // Return the updated comments
            return res.json(post.comments);
        } catch (error) {
            console.error("Server Error:", error.message);
            return res.status(500).send("Server Error");
        }
    }
);

// Delete a Comment

router.delete("/comment/:id/:comment_id",
    auth,
    async (req, res) => {
        try {

            const post = await Post.findById(req.params.id);

            const comment = post.comments.find(comment =>
                comment._id.toString() === req.params.comment_id
            );
            if (!comment) return res.status(404).json({ message: "Comment not found" });

            if (comment.user.toString() !== req.user.id) {
                return res.status(401).json({ message: "Not authorized" });
            }
            post.comments = post.comments.filter(comment =>
                comment._id.toString() !== req.params.comment_id
            );
            await post.save();
            return res.json(post.comments);

        } catch (error) {
            console.error(error.message);
            res.status(500).send("Server Error");
        }
    });

module.exports = router;