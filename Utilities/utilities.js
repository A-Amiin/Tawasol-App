const jwt = require("jsonwebtoken");
const multer = require("multer");

// Middleware function for authentication
const auth = (req, res, next) => {
    const token = req.header("x-authorization-token");
    if (!token) {
        return res.status(401).json({ msg: "No token, authorization denied" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // ✅ تم التعديل هنا
        req.user = decoded.user;
        next();
    } catch (err) {
        console.error("Invalid token:", err.message);
        return res.status(401).json({ msg: "Token is not valid" });
    }
};

// Multer middleware for handling profile picture uploads
const storage = multer.diskStorage({
    destination: "public/images",
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${req.user.id}`);
    },
});

const upload = multer({ storage: storage }).single("");

module.exports = { auth, upload };