const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Produto = new Schema({
    nome: {
        type: String,
        required: true
    },
    quantidade: {
        type: Number,
        required: true
    },
    preco: {
        type: Number,
        required: true
    },
    imagens: {
        type: Array
    },
    anunciante: {
        type: Schema.Types.ObjectId,
        ref: "usuarios"
    }
})

mongoose.model('produtos', Produto)