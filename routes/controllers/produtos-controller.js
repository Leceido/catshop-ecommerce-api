const mongoose = require('mongoose')
require('../../models/Produto')
const Produto = mongoose.model('produtos')

exports.getHome = async (req, res) => {
    try {
        const produtos = await Produto.find()
        res.status(200).send({produtos})
    } catch (error) {
        res.status(500).send({ message: "internal server error" })
    }
}

exports.getProduto = async (req, res) => {
    try {
        const produto = await Produto.findOne({_id: req.params.id})

        if (produto) {
            res.status(200).send({produto})
        } else {
            res.status(404).send({message: 'Produto não encontrado'})
        }
    } catch (error) {
        res.status(500).send({ message: "internal server error" })
    }
}

exports.postProduto = async (req, res) => {
    try {
        const newProduto = new Produto({
            nome: req.body.nome,
            valor: req.body.valor,
            quantidade: req.body.quantidade
        })

        newProduto.save()

        res.status(201).send({
            message: 'Produto cadastrado',
            produto: {
                nome: req.body.nome,
                valor: req.body.valor,
                quantidade: req.body.quantidade
            }
        })
    } catch (error) {
        res.status(500).send({ message: "internal server error" })
    }
}

exports.patchProduto = async (req, res) => {
    try {
        const produto = await Produto.findOne({_id: req.body.id})

        if(!produto) {
            res.status(404).send({message: 'Produto nao encontrado'})
        }

        produto.nome = req.body.nome,
        produto.valor = req.body.valor,
        produto.quantidade = req.body.quantidade

        await produto.save()

        res.status(201).send({
            message: "Produto editado",
            produto: {produto}
        })
    } catch (error) {
        res.status(500).send({ message: "internal server error", error: error })
    }
}

exports.deleteProduto = async (req, res) => {
    try {
        await Produto.deleteOne({_id: req.body.id})

        res.status(200).send({message: "Produto deletado"})
    } catch (error) {
        res.status(500).send({ message: "internal server error", error: error })
    }
}