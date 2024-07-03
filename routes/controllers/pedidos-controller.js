const mongoose = require('mongoose')
require('../../models/Pedido')
const Pedido = mongoose.model('pedidos')
require('../../models/Produto')
const Produto = mongoose.model('produtos')
const { MercadoPagoConfig, Preference } = require('mercadopago')
const client = new MercadoPagoConfig({ accessToken: process.env.VENDEDOR1_MERCADOPAGO_ACESS_TOKEN })
const preference = new Preference(client)

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
                            valor_total: pedido.valor_total,
                            status: pedido.preference_id
                        }
                    }
                    return {
                        id_pedido: pedido._id,
                        produto: {
                            message: "produto não esta mais disponivel",
                            id: pedido.id_produto
                        },
                        quantidade: pedido.quantidade,
                        valor_total: pedido.valor_total,
                        preference_id: pedido.preference_id
                    }
                }))
        })
    } catch (error) {
        res.status(500).send({ message: "Internal Server error" })
    }
}

exports.postPedido = async (req, res) => {
    try {
        const produtos = req.body.items
        const items = []
        const errors = []
        await Promise.all(produtos.map(async produtoBody => {
            const produto = await Produto.findOne({ _id: produtoBody.id_produto })
            if (!produto) {
                errors.push({ message: "Produto não encontrado", id: produtoBody.id_produto, status: 404});
                return;
            }
            if (produto.quantidade < produtoBody.quantidade) {
                errors.push({ message: "Quantidade indisponível", id: produtoBody.id_produto, status: 401 });
                return;
            }
            const item = {
                id: produto._id,
                title: produto.nome,
                quantity: Number(produtoBody.quantidade),
                unit_price: Number(produto.preco)
            }
            produto.quantidade -= produtoBody.quantidade
            await produto.save()

            items.push(item)
        }))

        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }
        

        const response = await preference.create({
                body: {
                    items: items,
                    back_urls: {
                        success: 'http://127.0.0.1:3000/pedido/status',
                        failure: 'http://127.0.0.1:3000/pedido/status',
                        pending: 'http://127.0.0.1:3000/pedido/status'
                    },
                    auto_return: "approved",
                }
        })

        const newPedido = new Pedido({
            items: req.body.items,
            id_cliente: req.user.id,
            valor_total: 1,
            id_preference: response.id
        })

        await newPedido.save()

        res.status(201).send({ 
            message: "Pedido criado",
            preference: response
         })
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