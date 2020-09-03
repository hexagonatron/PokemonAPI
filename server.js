const express = require('express');
const db = require('./models');
const mongoose = require("mongoose").set('debug', true);
const cors = require('cors');
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const app = express();

const routes = require('./routes/routes')

app.use(cors())
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(routes)

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true
})


app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
});