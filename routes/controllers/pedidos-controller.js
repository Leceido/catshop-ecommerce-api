const mongoose = require('mongoose')
require('../../models/Pedido')
const Pedido = mongoose.model('pedidos')
require('../../models/Produto')
const Produto = mongoose.model('produtos')

exports.getPedido = async (req, res) => {
    try {
        const pedidos = await Pedido.find({ id_cliente: req.user.id })

        res.status(200).send({
            pedidos:
                await Promise.all(pedidos.map(async pedido => {
                    const produto = await Produto.findOne({ _id: pedido.id_produto })
                    if (produto) {
                        return {
                            id_pedido: pedido._id,
                            produto: {
                                id: produto.id,
                                nome: produto.nome,
                                preco: produto.preco
                            },
                            quantidade: pedido.quantidade,
                            valor_total: pedido.valor_total
                        }
                    }
                    return {
                        id_pedido: pedido._id,
                        produto: {
                            message: "produto não esta mais disponivel",
                            id: pedido.id_produto
                        },
                        quantidade: pedido.quantidade,
                        valor_total: pedido.valor_total
                    }
                }))
        })
    } catch (error) {
        res.status(500).send({ message: "Internal Server error" })
    }
}

exports.postPedido = async (req, res) => {
    try {
        const produto = await Produto.findOne({ _id: req.body.id_produto })
        if (!produto) {
            return res.status(404).send({ message: "Produto não encontrado" })
        }
        if (produto.quantidade < req.body.quantidade) {
            return res.status(401).send({ message: "Quantidade indisponivel" })
        }




        const newPedido = new Pedido({
            id_produto: req.body.id_produto,
            id_cliente: req.user.id,
            quantidade: req.body.quantidade,
            valor_total: produto.preco * req.body.quantidade
        })

        await newPedido.save()

        produto.quantidade -= req.body.quantidade
        await produto.save()

        res.status(201).send({ message: "Pedido criado" })
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Internal server error" })
    }
}

exports.deletePedido = async (req, res) => {
    try {
        const pedido = await Pedido.findOne({ _id: req.params.id })

        if (!pedido) {
            return res.status(404).send({ message: "Pedido não encontrado" })
        }
        if (pedido.id_cliente != req.user.id) {
            return res.status(401).send({ message: "Acesso negado" })
        }

        const produto = await Produto.findOne({ _id: pedido.id_produto })
        if (produto) {
            produto.quantidade += pedido.quantidade
            await produto.save()
        }

        await Pedido.findOneAndDelete({ _id: req.params.id })

        res.status(200).send({ message: "Pedido deletado" })
    } catch (error) {
        res.status(500).send({ message: "Internal server error" })
    }
}