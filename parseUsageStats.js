const fs = require('fs');
const readline = require('readline');
const stream = require('stream');
const mongoose = require('mongoose');
const db = require('./models');
require('dotenv').config();
const fetch = require('node-fetch');

//Read moveset Stats
const readMovesetStats = (url = 'https://www.smogon.com/stats/2020-08/moveset/gen8ou-0.txt') => {

    const NAME_REGEX = /\| ([\w-\'\.\:]+(\s[\w-\'\.]+)?)\s+\|/;
    const ITEM_REGEX = / \| ([\w\s-\']+?)\s{1,2}(\d+\.\d+)%\s+\| /;
    const ABILITY_REGEX = / \| ([\w\s-]+?)\s{1,2}(\d+\.\d+)%\s+\| /;
    const SPREAD_REGEX = / \| (\w+)\:(\d+)\/(\d+)\/(\d+)\/(\d+)\/(\d+)\/(\d+)\s{1,2}(\d+\.\d+)%\s+\| /;
    const MOVE_REGEX = / \| ([\w\s-\']+?)\s{1,2}(\d+\.\d+)%\s+\| /;

    const dividerLine = " +----------------------------------------+ ";

    return new Promise(async (resolve, reject) => {
        const instream = await createReadStreamFromUrl(url);
        const outstream = new stream();
        const rl = readline.createInterface(instream, outstream);

        const pokemonObjects = [];
        let lastLine = "";
        let linecount = 0;

        let onNameLine = false;
        let readingCategory = false;
        let currentCategory = "";

        let currentObj = {
            name: "",
            abilities: [],
            items: [],
            spreads: [],
            moves: [],
        };


        rl.on('line', (line) => {
            try {

                if (line === dividerLine && lastLine === dividerLine) {
                    const lastPokemon = {}
                    //process last obj
                    for (key in currentObj) {
                        lastPokemon[key] = currentObj[key]
                    }
                    pokemonObjects.push(lastPokemon);
                    currentObj = {
                        name: "",
                        abilities: [],
                        items: [],
                        spreads: [],
                        moves: [],
                    };
                    onNameLine = true;
                } else if (onNameLine || linecount === 1) {
                    const res = NAME_REGEX.exec(line);
                    currentObj.name = res[1];
                    onNameLine = false
                } else if (line === dividerLine) {
                    readingCategory = false
                } else if (lastLine === dividerLine) {
                    if (line.includes("Abilities")) {
                        readingCategory = true
                        currentCategory = "abilities"
                    } else if (line.includes("Items")) {
                        readingCategory = true
                        currentCategory = "items"
                    } else if (line.includes("Spreads")) {
                        readingCategory = true
                        currentCategory = "spreads"
                    } else if (line.includes("Moves")) {
                        readingCategory = true
                        currentCategory = "moves"
                    }
                } else if (readingCategory) {
                    if (currentCategory === "abilities") {
                        const res = ABILITY_REGEX.exec(line);
                        currentObj.abilities.push([res[1], +res[2] / 100]);
                    } else if (currentCategory === "items") {
                        const res = ITEM_REGEX.exec(line);
                        currentObj.items.push([res[1], +res[2] / 100]);
                    } else if (currentCategory === "spreads") {
                        const res = SPREAD_REGEX.exec(line);
                        if (res) {
                            const spread = {
                                nature: res[1],
                                evs: {
                                    hp: +res[2],
                                    atk: +res[3],
                                    def: +res[4],
                                    spa: +res[5],
                                    spd: +res[6],
                                    spe: +res[7],

                                }                            }
                            currentObj.spreads.push([spread, +res[8] / 100]);
                        }
                    } else if (currentCategory === "moves") {
                        const res = MOVE_REGEX.exec(line)
                        currentObj.moves.push([res[1], +res[2]/100]);
                    }
                }

            } catch (err) {
                console.log(line);
                throw err
            }
            lastLine = line;
            linecount++
        });

        rl.on('close', () => {
            resolve(pokemonObjects)
        })

    })

}
const readUsageStats = (url = 'https://www.smogon.com/stats/2020-08/gen8ou-0.txt') => {

    const NAME_REGEX = /\|.*?\| ([\w-\'\.\:]+(\s[\w-\'\.]+)?)\s+\|.*?\|.*?\|.*?\|.*?\|\s+(\d+\.\d+)% \|/;

    return new Promise(async (resolve, reject) => {
        const instream = await createReadStreamFromUrl(url);
        const outstream = new stream();
        const rl = readline.createInterface(instream, outstream);

        const pokemonObjects = [];
        let linecount = 0;

        rl.on('line', (line) => {
            try {
                if (linecount > 2) {
                    const result = NAME_REGEX.exec(line);
                    if (result) {
                        pokemonObjects.push({
                            name: result[1],
                            probability: +result[3]/100
                        });
                    }
                }
            } catch (err) {
                console.log(line);
                throw err
            }
            linecount++
        });

        rl.on('close', () => {
            resolve(pokemonObjects)
        })

    })

}


//Read and fill moveset stats
const getMovesetStatsThenFillDb = async () => {
    return new Promise(async (resolve, reject) => {
        const pokemonObjects = await readMovesetStats();
        upsertPokemonDocuments(pokemonObjects).then(res => {
            console.log(res);
            resolve();
        });
    })
}

//Read and fill usage stats
const getUsageStatsThenFillDb = async () => {
    return new Promise(async (resolve, reject) => {
        const pokemonObjects = await readUsageStats();
        upsertPokemonDocuments(pokemonObjects).then(res => {
            console.log(res);
            resolve()
        });
    })
}

//Clear DB
const emptyPokemonDocuments = () => {
    return new Promise((resolve, reject) => {
        mongoose.connect(process.env.MONGODB_URI, { useUnifiedTopology: true, useNewUrlParser: true }).then(() => {
            db.Pokemon.deleteMany({}).then(res => {
                console.log(res)
                mongoose.disconnect();
                resolve(res)

            })
        }).catch(err => {
            mongoose.disconnect()
            reject(err)
        })
    })
}

//Fill DB
const upsertPokemonDocuments = (documentArray) => {

    return new Promise((resolve, reject) => {
        const bulkOperations = documentArray.map(pokemon => {
            return {
                'updateOne': {
                    'filter': { 'name': pokemon.name },
                    'update': pokemon,
                    'upsert': true
                }
            }

        });

        mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true }).then(() => {
            console.log("loading into database");
            db.Pokemon.bulkWrite(bulkOperations).then(res => {
                mongoose.disconnect();
                resolve(res)
            }).catch(err => {
                mongoose.disconnect();
                reject(err)
            });
        })
    })

}

//Create stream from file
const createReadStreamFromFile = async (path) => {
    const instream = fs.createReadStream(path);
    return instream
}

//Create stream from http
const createReadStreamFromUrl = async (url) => {
    const stream = await fetch(url).then(res => res.body);
    return stream;
}

(async () => {
    await emptyPokemonDocuments();
    await getMovesetStatsThenFillDb();
    await getUsageStatsThenFillDb();
})();