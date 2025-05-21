const mongoose = require('mongoose');
require('dotenv').config();

const db = process.env.MONGO_URI;
const connection = async () => {
    try {
        await mongoose.connect(db);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error.message);
        process.exit(1);
    }
}

module.exports = connection;