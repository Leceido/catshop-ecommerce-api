const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
require('dotenv').config()
const apiProduct = require("./routes/product")
const apiUser = require('./routes/usuario')
const apiPedido = require('./routes/pedido')

const mongoose = require('mongoose')

mongoose.set('strictQuery', false)
mongoose.Promise = global.Promise
mongoose.connect(process.env.MONGO_URL).then(() => {
    console.log('Connected to mongoDB');
}).catch((err) => {
    console.log('failed to connect to mongoDB' + err);
})

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.use(cors())

app.use('/api/product', apiProduct)
app.use('/api/usuario', apiUser)
app.use('/api/pedido', apiPedido)

app.use((req, res, next) => {
    const erro = new Error('404 ERROR - Not found')
    erro.status = 404
    next(erro)
})

app.use((error, req, res, next) => {
    res.status(error.status || 500)
    return res.send({
        erro: {
            mensagem: error.message
        }
    })
})

module.exports = app