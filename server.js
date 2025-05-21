const express = require('express');
require('dotenv').config();
const cors = require('cors');
const connection = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", require('./routes/users'));
app.use("/api/profiles", require('./routes/profiles'));
app.use("/api/posts", require('./routes/posts'));

connection();

app.get('/', (req, res) => res.send("Server working Correct"));

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});