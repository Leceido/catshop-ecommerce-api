const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Produto = new Schema({
    nome: {
        type: String,
        required: true
    },
    idade: {
        type: Number,
    },
    valor: {
        type: Number,
        required: true
    },
    quantidade: {
        type: Number,
        required: true
    },
    categorias: {
        type: String
    }
})

mongoose.model('produtos', Produto)