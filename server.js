const express = require('express');
const mongoose = require("mongoose").set('debug', true);
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const app = express();


mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true
}).then(() => {
    
})


app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
});