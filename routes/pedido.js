const express = require('express')
const router = express.Router()
const login = require("../helpers/login")

const PedidosController = require('../routes/controllers/pedidos-controller')

router.get('/', login, PedidosController.getPedido)

router.post('/', login, PedidosController.postPedido)

router.delete('/:id', login, PedidosController.deletePedido)

module.exports = router