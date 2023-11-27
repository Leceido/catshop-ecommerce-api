const express = require('express')
const router = express.Router()

const ProdutosController = require('../routes/controllers/produtos-controller')

router.get('/', ProdutosController.getHome)

router.get('/:id', ProdutosController.getProduto)

router.post('/', ProdutosController.postProduto)

router.patch('/', ProdutosController.patchProduto)

router.delete('/', ProdutosController.deleteProduto)


module.exports = router