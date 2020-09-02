/* const moves = [
    ["Dragon Darts", 100],
    ["U-turn", 45.261],
    ["Draco Meteor", 44.806],
    ["Shadow Ball", 31.811],
    ["Hex", 30.059],
    ["Dragon Dance", 29.892],
    ["Fire Blast", 24.040],
    ["Phantom Force", 21.784],
    ["Flamethrower", 17.640],
    ["Thunderbolt", 16.904],
    ["Thunder Wave", 16.151],
    ["Steel Wing", 15.896],
    ["Will-O-Wisp", 12.525],
    ["Substitute", 10.321],
    ["Sucker Punch",  9.518],
    ["Psychic Fangs",  4.466],
    ["Thunder",  3.537],
    ["Other", 17.269],
] */

const moves = [
    ["move 2", 100],
    ["move 3", 100],
    ["always move", 99],
    ["move 4", 50],
    ["move 5", 25],
    ["move 6", 25],
    ["move 1", 1],
]

const movesProbability = moves.map((move) => [move[0], (move[1]/100)])
//.filter((move) => move[0] != "Other" && moves[0] != "Nothing");

const movesProbabilitySorted = movesProbability.sort((a, b) => b[1] - a[1])

console.log(movesProbabilitySorted)

const selectFourMoves = (moveArr) => {
    const movesAvailable = [...moveArr];
    
    const selected= [];

    //Check for p=1
    while(movesAvailable[0][1] === 1.0){
        //add to selected
        selected.push(movesAvailable[0][0])
        //remove from available
        movesAvailable.shift()
    }

    const selectWeightedMovesRecursively = () => {
        //If full then return
        if(selected.length === 4) return selected

        //Calculate total p of remaining moves
        const probabilitySum = movesAvailable.reduce((total, move) => total+move[1],0);

        //get random num from 0 to sum(p)
        const randomNumber = Math.random() * probabilitySum;

        //Iterate through moves until random num < cumlative p
        let cumlativeP = 0;
        for(let i = 0; i < movesAvailable.length;i++){
            cumlativeP+= movesAvailable[i][1];
            if(randomNumber < cumlativeP){
                //Add to selected and remove from available
                selected.push(movesAvailable[i][0]);
                movesAvailable.splice(i, 1);
                return selectWeightedMovesRecursively();
            }
        }
    }

    return selectWeightedMovesRecursively()

}

// console.log(selectFourMoves(movesProbabilitySorted));

const bulkMoves = [];

//Generate 1000 sets
for(let i =0; i < 1000000; i++){
    bulkMoves.push(selectFourMoves(movesProbabilitySorted))
}

// console.log(bulkMoves)

// count move probs

const hash = {
    total: bulkMoves.length,
    moveTally: {},
}

//loop through movesets and tally them up
for(moveset of bulkMoves){
    for(move of moveset){
        if(hash.moveTally[move]){
            hash.moveTally[move]++;
        } else {
            hash.moveTally[move] = 1;
        }
    }
}

//loop through tally and calc percentage
const percentages = []
for(move in hash.moveTally){
    percentages.push([move, (hash.moveTally[move]/hash.total)*100 ])
}
percentages.sort((a,b) => b[1]-a[1]);

console.log(percentages)