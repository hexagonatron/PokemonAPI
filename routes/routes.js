const express = require('express');
const router = express.Router();

const { generateTeamAsShowdownFormat } = require('../controllers/teamControllers')

const apiRoutes = require('./api');

router.use('/api', apiRoutes);

router.get('*', (req, res) => {
    generateTeamAsShowdownFormat().then(team => {
        res.send(`<pre>${team}</pre>`)
    })
})

module.exports = router