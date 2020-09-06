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
    probability: {type: Number},
    smogon_sets: [
        {
            tier: {type: String},
            sets: [
                {type: Object}
            ]
        }
    ]
})

const Pokemon = mongoose.model("Pokemon", PokemonSchema);

module.exports = Pokemon;