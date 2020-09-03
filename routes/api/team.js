const router = require('express').Router();

const {generateTeamAsShowdownFormat} = require('../../controllers/teamControllers');
const dudTeam = "";

router.get('/', (req, res) => {
    generateTeamAsShowdownFormat().then(team => {

        res.send(team);
    }).catch(err => {
        res.send(dudTeam)
    })
})

module.exports = router;