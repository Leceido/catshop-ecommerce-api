const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()

const UsersController = require('../routes/controllers/users-controller')

router.get('/', UsersController.getHome)

module.exports = router