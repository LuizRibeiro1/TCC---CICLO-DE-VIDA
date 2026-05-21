const usuarioModel = require("../models/usuarioModel.js")
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

module.exports = {
    login: async (req, res) => {
        try {
            const { email, senha } = req.body

            if (!email || !senha) {
                return res.status(400).render('erro', { mensagem: "E-mail e senha são obrigatórios" })
            }

            const usuario = await usuarioModel.buscarPorEmail(email)

            if (!usuario) {
                return res.status(401).render('erro', { mensagem: "Credenciais inválidas" })
            }

            const senhaValida = await bcrypt.compare(senha, usuario.senha)

            if (!senhaValida) {
                return res.status(401).render('erro', { mensagem: "Credenciais inválidas" })
            }

            const token = jwt.sign(
                {
                    id: usuario.id_usuario,
                    perfil: usuario.perfil,
                    nome: usuario.nome
                },
                process.env.JWT_SECRET,
                { expiresIn: '2h' }
            )

            res.cookie('token', token, { httpOnly: true })

            return res.redirect('/login?sucesso=1')
        } catch (erro) {
            console.error(erro)
            res.status(500).render('erro', { mensagem: "Erro interno no servidor" })
        }
    },

    cadastrar: async (req, res) => {
        try {
            const { nome, email, senha, confirmar_senha } = req.body

            if (!nome || !email || !senha || !confirmar_senha) {
                return res.status(400).render('erro', { mensagem: "Preencha todos os campos obrigatórios" })
            }

            if (senha !== confirmar_senha) {
                return res.status(400).render('erro', { mensagem: "As senhas não coincidem" })
            }

            if (senha.length < 6) {
                return res.status(400).render('erro', { mensagem: "A senha deve ter no mínimo 6 caracteres" })
            }

            const usuarioExistente = await usuarioModel.buscarPorEmail(email)

            if (usuarioExistente) {
                return res.status(409).render('erro', { mensagem: "Este e-mail já está cadastrado" })
            }

            const senhaHash = await bcrypt.hash(senha, 10)
            await usuarioModel.criarUsuario(nome.trim(), email.trim().toLowerCase(), senhaHash)

            return res.redirect('/login?cadastro=1')
        } catch (erro) {
            console.error(erro)
            if (erro.code === 'ER_DUP_ENTRY') {
                return res.status(409).render('erro', { mensagem: "Este e-mail já está cadastrado" })
            }
            res.status(500).render('erro', { mensagem: "Erro interno no servidor" })
        }
    },

    logout: (req, res) => {
        res.clearCookie('token')
        res.redirect("/login")
    }
}
