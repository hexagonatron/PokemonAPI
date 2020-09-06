const router = require('express').Router();

const {generateTeamAsShowdownFormat, generateTeamFromSmogonSetsAsShowdownFormat} = require('../../controllers/teamControllers');

const dudTeam = `API-Error (Magikarp)  
Ability: Swift Swim  
Level: 1  
Docile Nature  
IVs: 0 HP / 0 Atk / 0 Def / 0 SpA / 0 SpD / 0 Spe  
- Splash`;

router.get('/', (req, res) => {
    generateTeamAsShowdownFormat().then(team => {

        res.send(team);
    }).catch(err => {
        res.send(dudTeam)
    })
});

router.get('/smogon', (req, res) => {
    generateTeamFromSmogonSetsAsShowdownFormat().then(team => {
        res.send(`<pre>${team}</pre>`);
    }).catch(err => {
        res.send(dudTeam)
    })
})

module.exports = router;