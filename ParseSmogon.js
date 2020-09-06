const fetch = require('node-fetch');
const {processBulkDbOperationArray, createBulkDbUpsertsFromUsageData} = require('./controllers/dbOperations')

const smogonPost = (url, body) => {
    return fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    })
    .then(res => res.json())
}


//Get list of all pokemon
const getAllSmogonPokemon = (generation = "ss", tier = "OU") => {
    return new Promise(async (resolve, reject) => {
        const [generationInformationJson, tierInformationJson] = await Promise.all([
            smogonPost('https://www.smogon.com/dex/_rpc/dump-gens', { gen: generation }),
            smogonPost('https://www.smogon.com/dex/_rpc/dump-format', { gen: generation, alias: tier.toLowerCase() }),
        ])

        const generationPokemon = generationInformationJson.pokemon;
        const pokemonOfTier = generationPokemon.filter(pokemon => pokemon.formats.includes(tier));
        const pokemonOfTierNamesOnly = pokemonOfTier.map(pokemon => pokemon.name);

        const pokemonWithTierStrategyNames = tierInformationJson.pokemon_with_strategies.map(pokemonName => pokemonName);

        const allViableTierPokemonNames = pokemonOfTierNamesOnly.concat(pokemonWithTierStrategyNames);


        // console.log(pokemonOfTier);

        console.log(allViableTierPokemonNames.length)

        return resolve(allViableTierPokemonNames)
    })
}

//Iterate through list of pokemon and get movesets
const getAllPokemonMovesets = (pokemonNameArray, tier = "OU", gen = "ss") => {
    return new Promise (async (resolve, reject) => {
        try {
            const pokemonWithMovesetsArrayPromises = pokemonNameArray.map(pokemonName => getOnePokemonMovesets(pokemonName, tier, gen));
        
            const pokemonWithMovesetsArray = await Promise.all(pokemonWithMovesetsArrayPromises);
    
            return resolve(pokemonWithMovesetsArray)
    
        } catch(err) {
            reject(err);
        }
    })

}

const getOnePokemonMovesets =  (pokemon, tier = "OU", gen = "ss") => {
    return new Promise(async (resolve, reject) => {
        try {
            const responseJson = await smogonPost('https://www.smogon.com/dex/_rpc/dump-pokemon', {alias: pokemon.toLowerCase(), gen: gen, language: "en"})
    
            if(responseJson){
                const pokemonMovesetsForGivenTier = responseJson.strategies.find(strategy => strategy.format === tier);

                if(pokemonMovesetsForGivenTier){
                    return resolve({
                        name: pokemon, 
                        smogon_sets: [{
                            tier: pokemonMovesetsForGivenTier.format,
                            sets: pokemonMovesetsForGivenTier.movesets
                        }]
                    });
                } else return resolve(null);
            }
            
            return resolve(null);

        } catch (err) {
            console.log(pokemon)
            return reject(err);
        }
    })
}


//load into database
const saveMovesetsToDb = (pokemonMovesetArray) => {
    return new Promise(async (resolve, reject) => {
        try{
            const bulkDbEventArray = createBulkDbUpsertsFromUsageData(pokemonMovesetArray)
    
            const dbResults = await processBulkDbOperationArray(bulkDbEventArray);

            return resolve(dbResults);

        } catch(err){
            return reject(err);
        }
    });
}

const createPokemonMovesetUpsert = (pokemon) => {

}


(async () => {
    const pokemonNames = await getAllSmogonPokemon();
    console.log(pokemonNames)
    const pokemonMovesets = await getAllPokemonMovesets(pokemonNames);

    console.log(pokemonMovesets)

    const dbResults = await saveMovesetsToDb(pokemonMovesets);
    console.log(dbResults)
})();