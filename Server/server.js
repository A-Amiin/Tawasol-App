const express = require('express');
const connection = require('./config/db');
const app = express();
app.use(express.json());

app.use("/api/users", require('./routes/users'));
app.use("/api/profiles", require('./routes/profiles'));
app.use("/api/posts", require('./routes/posts'));

// Connect to the database
connection();
app.get('/', (req, res) => res.send("Server working Correct"));

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
