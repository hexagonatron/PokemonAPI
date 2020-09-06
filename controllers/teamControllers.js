const db = require('../models');

Array.prototype.shuffle = function () {
    for (let i = this.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this[i], this[j]] = [this[j], this[i]];
    }
    return this
}

Array.prototype.pickRandom = function () {
    const randomIndex = Math.floor(Math.random() * this.length)
    return this[randomIndex];
}

const generateTeamAsShowdownFormat = () => {
    return new Promise(async (resolve, reject) => {
        //pick 6 pokemon
        const pokemonArray = await pickSixPokemon();

        //convert to right format
        const pokemonTeamAsShowdownFormat = formatPokemonArrayToShowdownString(pokemonArray);

        //return
        return resolve(pokemonTeamAsShowdownFormat);
    })
}

const pickSixPokemon = () => {
    return new Promise(async (resolve, reject) => {
        //get all pokemon from database
        const allValidPokemon = await findAllValidPokemon();

        //pick 6 randomly
        const teamPokemonArray = selectFromArrayBasedOnProbability(6, allValidPokemon, (pokemon) => pokemon.probability);

        const teamPokemonArrayWithAttributes = chooseAttributesForPokemonArray(teamPokemonArray);

        resolve(teamPokemonArrayWithAttributes);
    })
}

const findAllValidPokemon = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const allValidPokemon = await db.Pokemon.find({
                name: { $exists: true },
                abilities: { $exists: true },
                items: { $exists: true },
                moves: { $exists: true },
                spreads: { $exists: true },
                probability: { $exists: true },
            });

            if (allValidPokemon.length === 0) return reject("No pokemon Found");

            return resolve(allValidPokemon);

        } catch (err) {
            return reject(err)
        }
    })
}

const selectFromArrayBasedOnProbability = (numberToSelect, sourceArray, fnToGetProbability, fnToAddToArray = (item) => item) => {

    workingArray = JSON.parse(JSON.stringify(sourceArray))
    workingArray.shuffle();

    let randomNumber = Math.random();

    let selected = [];

    for (let i = 0; i < numberToSelect; i++) {
        let cumlativeSum = 0;
        for (item of workingArray) {
            cumlativeSum += fnToGetProbability(item);
            if (randomNumber <= cumlativeSum) {
                selected.push(fnToAddToArray(item));
                randomNumber += 1;
                break;
            }
        }
    }

    if (selected.length != numberToSelect) {
        throw "Didn't succesfully select correct number of things"
    }


    return selected;
}

const chooseAttributesForPokemonArray = (pokemonArray) => {
    return pokemonArray.map(chooseAttributesForPokemon)
}

const chooseAttributesForPokemon = (pokemonObject) => {

    const ability = pickItemFromWeightedDupleArray(pokemonObject.abilities)
    const item = pickItemFromWeightedDupleArray(pokemonObject.items, notOtherFilterfn)
    const spread = pickItemFromWeightedDupleArray(pokemonObject.spreads, notOtherFilterfn)

    //filter others out of movearray
    const movesFiltered = pokemonObject.moves.filter(notOtherFilterfn)
    const movesFilteredAndNormalised = normaliseDupleArray(movesFiltered, 4);

    const moves = selectFromArrayBasedOnProbability(4, movesFilteredAndNormalised, (move) => +move[1], (move) => move[0]);

    return {
        name: pokemonObject.name,
        ability: ability,
        item: item,
        moves: moves,
        spread: spread
    }
}

const notOtherFilterfn = item => item[0] != "Other";

const normaliseDupleArray = (array, normalizationValue) => {
    const totalProbability = array.reduce((acc, val) => acc += +val[1], 0);

    const normalizedArray = array.map(val => [val[0], (val[1] / totalProbability) * normalizationValue])
    return normalizedArray
}

const pickItemFromWeightedDupleArray = (arrayOfItems, filterFn = () => true) => {

    let selectionArray = JSON.parse(JSON.stringify(arrayOfItems))

    selectionArray = arrayOfItems.filter(filterFn)

    //sum all the probabilities
    const totalProbability = selectionArray.reduce((acc, item) => acc += +item[1], 0);

    //normalise the probabilities
    const selectionArrayProbabilityAdjusted = selectionArray
        .map((val) => [
            val[0],
            val[1] / totalProbability
        ]);


    const item = pickitemFromProbabilityArray(selectionArrayProbabilityAdjusted)

    return item;
}

const pickitemFromProbabilityArray = (array) => {
    const randomNumber = Math.random();
    let cumlativeSum = 0;
    for (item of array) {
        cumlativeSum += item[1];
        if (randomNumber <= cumlativeSum) {
            return item[0]
        }
    }
}

const formatPokemonArrayToShowdownString = (pokemonarray) => {
    const pokemonArrayAsStrings = pokemonarray.map(formatOnePokemonToShowdownString)
    const finalString = pokemonArrayAsStrings.join("");
    return finalString
}

const formatOnePokemonToShowdownString = (pokemonObject) => {
    const showdownString =
        `${pokemonObject.name} @ ${pokemonObject.item}\n` +
        `Ability: ${pokemonObject.ability}\n` +
        `EVs: ${pokemonObject.spread.evs.hp} HP / ${pokemonObject.spread.evs.atk} Atk / ${pokemonObject.spread.evs.def} Def / ${pokemonObject.spread.evs.spa} SpA / ${pokemonObject.spread.evs.spd} SpD / ${pokemonObject.spread.evs.spe} Spe\n` +
        `${pokemonObject.spread.nature} Nature\n` +
        pokemonObject.moves.map(move => {
            return `  - ${move}\n`
        }).join("") +
        `\n`;

    return showdownString
}

const generateTeamFromSmogonSetsAsShowdownFormat = () => {
    return new Promise(async (resolve, reject) => {
        //get all pokemon from database
        const allValidPokemon = await findAllValidPokemon();

        //pick 6 randomly
        const teamPokemonArray = selectFromArrayBasedOnProbability(6, allValidPokemon, (pokemon) => pokemon.probability);

        //Get Movesets
        const teamPokemonArrayWithMovesets = chooseAttributesFromSmogonSets(teamPokemonArray);

        const teamAsShowdownFormat = formatPokemonArrayToShowdownString(teamPokemonArrayWithMovesets);

        return resolve(teamAsShowdownFormat);
    })
}

const chooseAttributesFromSmogonSets = (pokemonArray) => {
    const pokemonWithMoveSets = pokemonArray.map((pokemon) => {
        if (hasSmogonMovesetsAvailable(pokemon)) return chooseSmogonMovesetForOnePokemon(pokemon);
        else return chooseAttributesForPokemon(pokemon);
    })

    return pokemonWithMoveSets;
}

const hasSmogonMovesetsAvailable = (pokemon) => {
    if (pokemon.smogon_sets) {
        return !!pokemon.smogon_sets.length
    }
    return false
}

const chooseSmogonMovesetForOnePokemon = (pokemon) => {
    const chosenSet = pokemon.smogon_sets[0].sets.pickRandom();

    const ability = chosenSet.abilities.pickRandom();
    const item = chosenSet.items.pickRandom();
    let moves
    do {
        moves = chosenSet.moveslots.map(slot => {
            console.log(slot);
            if (!slot.length) return null
            else if (slot.length > 1) {
                const move = slot.pickRandom().move;
                console.log(move)
                return move
            } else {
                const move = slot[0].move;
                console.log(move)
                return move
            }
        });
    } while (!hasNoDuplicateMoves(moves))

    const spread = {
        evs: chosenSet.evconfigs.pickRandom(),
        nature: chosenSet.natures.pickRandom()
    };

    return {
        name: pokemon.name,
        ability: ability,
        item: item,
        moves: moves,
        spread: spread
    }


}

const hasNoDuplicateMoves = (moves) => {
    const movesLength = moves.length;
    const movesWithoutDuplicatesLength = [...new Set(moves)].length;
    return movesLength === movesWithoutDuplicatesLength
}

module.exports = {
    generateTeamAsShowdownFormat,
    generateTeamFromSmogonSetsAsShowdownFormat
}