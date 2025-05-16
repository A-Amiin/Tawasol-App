const mongoose = require('mongoose');
const config = require('config');
const db = config.get('mongoConnectionString');

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