const router = require('express').Router();

const apiTeamRoutes = require('./team.js');

router.use('/team', apiTeamRoutes);

module.exports = router