const express = require("express")
const router = express.Router()
const mongoose = require('mongoose')
require('../models/Produto')
const Produto = mongoose.model('produtos')
const multer = require('multer')
const storage = multer.memoryStorage()
const upload = multer({
    dest: 'uploads/',
    storage: storage
})
const s3 = require("@aws-sdk/client-s3")
const crypto = require('crypto')

const randomImageName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex')

const acessKey = process.env.AWS_ACESS_KEY
const secretKey = process.env.AWS_SECRET_KEY
const region = process.env.AWS_REGION
const bucketName = process.env.AWS_BUCKET_NAME

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const login = require("../helpers/login")

const s3Client = new s3.S3Client({
    credentials: {
        accessKeyId: acessKey,
        secretAccessKey: secretKey
    },
    region: region
})

router.get('/', async (req, res) => {
    try {
        const produtos = await Produto.find();
        if (!produtos || produtos.length === 0) {
            return res.status(404).send({ message: "Nenhum produto encontrado" });
        }

        res.status(200).send({
            produtos: await Promise.all(produtos.map(async produto => {
                let urlImagens = []
                await Promise.all(produto.imagens.map(async imagem => {
                    const GetObjectParams = {
                        Bucket: bucketName,
                        Key: imagem
                    };

                    const command = new s3.GetObjectCommand(GetObjectParams);
                    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
                    urlImagens.push(url);
                    return urlImagens
                }))
                return {
                    id: produto._id,
                    nome: produto.nome,
                    quantidade: produto.quantidade,
                    preco: produto.preco,
                    anunciante: produto.anunciante,
                    imagens: {
                        name: produto.imagens,
                        url: urlImagens
                    }

                }
            }))
        })
    } catch (error) {
        res.status(500).send({ message: "internet server error: " + error })
    }
})

router.get('/:id', async (req, res) => {
    try {
        const produto = await Produto.findOne({ _id: req.params.id })
        if (!produto) {
            return res.status(404).send({ message: "Nenhum produto encontrado" });
        }
        let urlImagens = []
        await Promise.all(produto.imagens.map(async imagem => {
            const GetObjectParams = {
                Bucket: bucketName,
                Key: imagem
            };

            const command = new s3.GetObjectCommand(GetObjectParams);
            const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
            urlImagens.push(url);
            return urlImagens
        }))
        res.status(200).send({
            produto:
            {
                id: produto._id,
                nome: produto.nome,
                quantidade: produto.quantidade,
                preco: produto.preco,
                anunciante: produto.anunciante,
                imagens: {
                    name: produto.imagens,
                    url: urlImagens
                }
            }
        })


    } catch (error) {
        res.status(500).send({ message: "internet server error: " + error })
    }
})


router.post('/', login ,upload.array('images'), async (req, res) => {
    try {
        if (req.body.preco < 0) {
            return res.status(400).send({ message: "Erro ao cadastrar produto, preço invalido" })
        }
        if (req.body.quantidade < 1) {
            return res.status(400).send({ message: "Erro ao cadastrar produto, quantidade invalida" })
        }
        if (!req.body.quantidade) {
            return res.status(400).send({ message: "Erro ao cadastrar produto, quantidade não informada" })
        }

        const files = await req.files

        const produto = new Produto({
            nome: req.body.nome,
            quantidade: req.body.quantidade,
            preco: req.body.preco,
            anunciante: req.user.id
        })

        await Promise.all(files.map(async file => {
            const params = {
                Bucket: bucketName,
                Key: randomImageName(),
                Body: file.buffer,
                ContentType: file.mimetype
            }

            produto.imagens.push(params.Key)

            const command = new s3.PutObjectCommand(params)

            await s3Client.send(command)
        }))

        produto.save()

        res.status(201).send({ message: "produto criado" })
    } catch (error) {
        res.status(500).send({ message: "internet server error: " + error })
    }
})

router.delete('/:id', login, async (req, res) => {
    try {

        const produto = await Produto.findOne({ _id: req.params.id })

        if (!produto) {
            return res.status(404).send({ message: "Produto não encontrado" })
        }

        if (produto.anunciante != req.user.id ) {
            return res.status(401).send({message: "Acesso negado"})
        }

        await Promise.all(produto.imagens.map(async imagem => {
            const params = {
                Bucket: bucketName,
                Key: imagem
            }
            const command = new s3.DeleteObjectCommand(params)
            await s3Client.send(command)
        }))

        await Produto.findOneAndDelete({ _id: req.params.id })

        res.status(200).send({ message: "Produto deletado" })
    } catch (error) {
        res.status(500).send({ message: "internet server error: " + error })
    }
})

router.put('/:id', login, upload.array('images'), async (req, res) => {
    try {
        const files = req.files
        const produto = await Produto.findOne({ _id: req.params.id })

        if (!produto) {
            return res.status(404).send({ message: "Produto não encontrado" })
        }

        if (produto.anunciante != req.user.id ) {
            return res.status(401).send({message: "Acesso negado"})
        }

        if (req.body.nome) {
            produto.nome = req.body.nome;
        }

        if (req.body.preco) {
            produto.preco = req.body.preco;
        }

        if (req.body.quantidade) {
            produto.quantidade = req.body.quantidade;
        }


        await Promise.all(files.map(async file => {
            const params = {
                Bucket: bucketName,
                Key: randomImageName(),
                Body: file.buffer,
                ContentType: file.mimetype
            }

            produto.imagens.push(params.Key)

            const command = new s3.PutObjectCommand(params)

            await s3Client.send(command)
        }))

        produto.save()

        res.status(200).send({ message: "Produto Editado" })
    } catch (error) {
        res.status(500).send({ message: "internet server error: " + error })
    }
})

router.delete('/:id/:nameImage', login, async (req, res) => {
    try {
        const produto = await Produto.findOne({_id: req.params.id})
        if (!produto) {
            return res.status(404).send({ message: "Produto não encontrado" })
        }
        if (produto.anunciante != req.user.id ) {
            return res.status(401).send({message: "Acesso negado"})
        }
        await Produto.findOneAndUpdate({ _id: req.params.id }, { $pull: { "imagens": req.params.nameImage } })

        const params = {
            Bucket: bucketName,
            Key: req.params.nameImage
        }
        const command = new s3.DeleteObjectCommand(params)
        await s3Client.send(command)

        res.status(200).send({ message: "Imagem removida" })
    } catch (error) {
        res.status(500).send({ message: "internet server error: " + error })
    }

})

router.post("/postImage", upload.array('images'), async (req, res) => {
    try {
        const files = await req.files


        await Promise.all(files.map(async file => {
            console.log(file);
            const params = {
                Bucket: bucketName,
                Key: randomImageName(),
                Body: file.buffer,
                ContentType: file.mimetype
            }

            const command = new s3.PutObjectCommand(params)

            await s3Client.send(command)
        }))

        res.status(200).send({ message: "upload feito" })
    } catch (error) {
        res.status(500).send({ message: "internet server error" })
    }
})


module.exports = router