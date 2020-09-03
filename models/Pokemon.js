const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const PokemonSchema = new Schema({
    name: { type: String },
    abilities: [
        [
            { type: String },
            { type: Number}
        ]
    ],
    items: [
        [
            { type: String },
            { type: Number}
        ]
    ],
    spreads: [
        [
            {type: Object},
            {type: Number}
        ]
    ],
    moves: [
        [
            { type: String },
            { type: Number}
        ]
    ],
    probability: {type: Number}
})

const Pokemon = mongoose.model("Pokemon", PokemonSchema);

module.exports = Pokemon;