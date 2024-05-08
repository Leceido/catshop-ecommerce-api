const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Pedido = new Schema({
    id_produto: {
        type: Schema.Types.ObjectId,
        ref: "produtos",
        required: true
    },
    id_cliente: {
        type: Schema.Types.ObjectId,
        ref: "usuarios",
        required: true
    },
    quantidade: {
        type: Number,
        required: true
    },
    valor_total: {
        type: Number,
        required: true
    }
})

mongoose.model('pedidos', Pedido)