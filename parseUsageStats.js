const fs = require('fs');
const readline = require('readline');
const stream = require('stream');

const PATH = 'ou-moveset.txt'

const instream = fs.createReadStream(PATH);
const outstream = new stream();


const rl = readline.createInterface(instream, outstream);

const pokemonObjects = [];

NAME_REGEX = /\| ([\w-]+)\s+\|/
ITEM_REGEX = / \| ([\w\s-\']+)\s{1,2}(\d+\.\d+)%\s+\| /
ABILITY_REGEX = / \| ([\w\s-]+)\s{1,2}(\d+\.\d+)%\s+\| /
SPREAD_REGEX = / \| (\w+)\:(\d+)\/(\d+)\/(\d+)\/(\d+)\/(\d+)\/(\d+)\s{1,2}(\d+\.\d+)%\s+\| /
MOVE_REGEX = / \| ([\w\s-]+)\s{1,2}(\d+\.\d+)%\s+\| /

const dividerLine = " +----------------------------------------+ "

let linecount = 0
let lastLine = "";
let currentObj = {
    name: "",
    abilities: [],
    items: [],
    spreads: [],
    moves: [],
};
let onNameLine = false

let readingCategory = false;
let currentCategory = "";

rl.on('line', (line) => {
    if(line === dividerLine && lastLine === dividerLine){
        const lastPokemon = {}
        //process last obj
        for(key in currentObj){
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
    } else if(onNameLine || linecount === 1){
        const res = NAME_REGEX.exec(line);
        currentObj.name = res[1];
        onNameLine = false
    } else if(line === dividerLine){
        readingCategory = false
    } else if(lastLine === dividerLine){
        if(line.includes("Abilities")){
            readingCategory = true
            currentCategory = "abilities"
        } else if(line.includes("Items")){
            readingCategory = true
            currentCategory = "items"
        } else if(line.includes("Spreads")){
            readingCategory = true
            currentCategory = "spreads"
        } else if(line.includes("Moves")){
            readingCategory = true
            currentCategory = "moves"
        }
    } else if(readingCategory){
        if(currentCategory === "abilities"){
            const res = ABILITY_REGEX.exec(line);
            currentObj.abilities.push([res[1], +res[2]/100]);
        } else if(currentCategory === "items"){
            const res = ITEM_REGEX.exec(line);
            currentObj.items.push([res[1], +res[2]/100]);
        } else if(currentCategory === "spreads"){
            const res = SPREAD_REGEX.exec(line);
            if(res){
                const spread = {nature: res[1],
                                spread: [
                                    res[2],
                                    res[3],
                                    res[4],
                                    res[5],
                                    res[6],
                                    res[7]
                                ]}
                currentObj.spreads.push([spread, res[8]]);
            }
        } else if(currentCategory === "moves"){
            const res = MOVE_REGEX.exec(line)
            currentObj.moves.push([res[1], res[2]]);
        }
    }

    lastLine = line;
    linecount++
});

rl.on('close', () => {
    console.log(pokemonObjects)
})