const mongoose = require('mongoose');
const db = require('../models');
require('dotenv').config();

const processBulkDbOperationArray = (bulkOperationArray) => {

    return new Promise((resolve, reject) => {
        mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true }).then(() => {
            console.log("loading into database");
            db.Pokemon.bulkWrite(bulkOperationArray).then(res => {
                mongoose.disconnect();
                resolve(res)
            }).catch(err => {
                mongoose.disconnect();
                reject(err)
            });
        })
    })

}

const createBulkDbUpsertsFromUsageData = (documentArray) => {
    const bulkOperations = documentArray.filter(val => val).map(pokemon => {
        return {
            'updateOne': {
                'filter': { 'name': pokemon.name },
                'update': pokemon,
                'upsert': true
            }
        }
    });

    return bulkOperations
}

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

module.exports = {
    createBulkDbUpsertsFromUsageData,
    processBulkDbOperationArray,
    emptyPokemonDocuments
}