const mongoose = require('mongoose')
require('../../models/Usuario')
const Usuario = mongoose.model('usuarios')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

exports.getUsuario = async (req, res) => {
    try {
        const usuario = await Usuario.findOne({ _id: req.user.id })

        if (!usuario) {
            return res.status(404).send({ message: "Usuario não encontrato" })
        }

        res.status(200).send({
            id: usuario._id,
            nome: usuario.nome,
            user: usuario.user,
            email: usuario.email,
        })
    } catch (error) {
        res.status(500).send({ messagem: "Internal server error" })
    }
}

exports.postCadastrar = async (req, res) => {
    try {
        const userDB = await Usuario.findOne({ user: req.body.user })
        const emailDB = await Usuario.findOne({ email: req.body.email })
        const nome = req.body.nome
        const user = req.body.user
        const email = req.body.email
        const senha = req.body.senha
        if (userDB) {
            return res.status(401).send({ error: "Esse usuario já está cadastrado" })
        }
        if (emailDB) {
            return res.status(401).send({ error: "Esse email já está cadastrado" })
        }
        if (nome == null || nome.length == 0) {
            return res.status(401).send({ error: "Nome invalido" })
        }
        if (user == null || user.length == 0) {
            return res.status(401).send({ error: "User invalido" })
        }
        if (email == null || email.length == 0) {
            return res.status(401).send({ error: "email invalido" })
        }
        if (senha == null || senha.length == 0) {
            return res.status(401).send({ error: "Senha invalida" })
        }

        const newUser = new Usuario({
            nome: nome,
            user: user,
            email: email,
            senha: senha
        })

        bcrypt.hash(newUser.senha, 10, (errBcrypt, hash) => {
            if (errBcrypt) {
                console.log(errBcrypt);
                return res.status(500).send({ error: errBcrypt })
            }

            newUser.senha = hash

            newUser.save()

            res.status(201).send({
                message: "Usuario Criado",
                userCreated: {
                    name: req.body.nome,
                    user: req.body.user,
                    email: req.body.email
                }
            })
        })

    } catch (error) {
        console.log(error);
        res.status(500).send({ error: "internal server error", error })
    }
}

exports.postLogin = async (req, res) => {
    try {
        const user = await Usuario.findOne({ email: req.body.email })
        if (!user) {
            return res.status(404).send({ message: "Usuario não encontrado" })
        }
        bcrypt.compare(req.body.senha, user.senha, (err, result) => {
            if (result) {
                try {
                    const token = jwt.sign({
                        id: user.id,
                        nome: user.nome,
                        user: user.user,
                        email: user.email,

                    },
                        `${process.env.JWT_KEY}`,
                        {
                            expiresIn: "30d"
                        })
                    return res.status(200).send({
                        message: "Usuario autenticado",
                        token: token,
                        user: {
                            id: user.id,
                            nome: user.nome,
                            user: user.user,
                            email: user.email
                        }
                    })
                } catch (error) {
                    res.status(500).send({ messagem: "Internal server error" })
                }
            } else {
                res.status(401).send({ messagem: "Autenticação falhou, email ou senha incorretos" })
            }
        })
    } catch (error) {
        res.status(500).send({ messagem: "Internal server error" })
    }
}