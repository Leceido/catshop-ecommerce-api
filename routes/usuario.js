const express = require('express')
const router = express.Router()

const UsuariosController = require('../routes/controllers/usuarios-controller')
const login = require('../helpers/login')

router.get('/', login, UsuariosController.getUsuario)

router.post('/cadastrar', UsuariosController.postCadastrar)

router.post('/login', UsuariosController.postLogin)

module.exports = router