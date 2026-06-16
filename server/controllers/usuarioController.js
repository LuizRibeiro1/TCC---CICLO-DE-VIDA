// ============================================================
// CONTROLLER DE USUÁRIO
// Recebe requisições HTTP, valida dados e chama o model
// ============================================================

const usuarioModel = require("../models/usuarioModel.js")
const bcrypt = require('bcrypt')      // Criptografia de senha
const jwt = require('jsonwebtoken')   // Token de sessão após login

module.exports = {
    // POST /usuarios/login — autentica e grava cookie com JWT
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

            // Compara senha digitada com o hash salvo no banco
            const senhaValida = await bcrypt.compare(senha, usuario.senha)

            if (!senhaValida) {
                return res.status(401).render('erro', { mensagem: "Credenciais inválidas" })
            }

            // Gera token JWT com dados básicos do usuário (válido por 2 horas)
            const token = jwt.sign(
                {
                    id: usuario.id_usuario,
                    perfil: usuario.perfil,
                    nome: usuario.nome
                },
                process.env.JWT_SECRET,
                { expiresIn: '2h' }
            )

            // Salva o token em cookie httpOnly (não acessível via JavaScript no navegador)
            res.cookie('token', token, { httpOnly: true })

            return res.redirect('/home')
        } catch (erro) {
            console.error(erro)
            res.status(500).render('erro', { mensagem: "Erro interno no servidor" })
        }
    },

    // POST /usuarios/cadastrar — cria conta e redireciona para login
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

    // GET /usuarios/logout — remove o cookie e volta para o login
    logout: (req, res) => {
        res.clearCookie('token')
        res.redirect("/login")
    },

    // GET /usuarios/editar — formulário de edição (somente admin)
    exibirEditar: async (req, res) => {
        try {
            const usuario = await usuarioModel.buscarPorId(req.usuario.id)

            if (!usuario) {
                return res.status(404).render('erro', { mensagem: 'Usuário não encontrado' })
            }

            return res.render('usuario/editar', {
                usuario,
                sucesso: req.query.sucesso === '1'
            })
        } catch (erro) {
            console.error(erro)
            res.status(500).render('erro', { mensagem: 'Erro interno no servidor' })
        }
    },

    // POST /usuarios/atualizar — salva alterações do perfil (somente admin)
    atualizar: async (req, res) => {
        try {
            const { nome, email, senha, confirmar_senha } = req.body

            if (!nome || !email) {
                return res.status(400).render('erro', { mensagem: 'Nome e e-mail são obrigatórios' })
            }

            const usuarioAtual = await usuarioModel.buscarPorId(req.usuario.id)

            if (!usuarioAtual) {
                return res.status(404).render('erro', { mensagem: 'Usuário não encontrado' })
            }

            const emailNormalizado = email.trim().toLowerCase()

            if (emailNormalizado !== usuarioAtual.email) {
                const emailEmUso = await usuarioModel.buscarPorEmail(emailNormalizado)

                if (emailEmUso && emailEmUso.id_usuario !== req.usuario.id) {
                    return res.status(409).render('erro', { mensagem: 'Este e-mail já está cadastrado' })
                }
            }

            if (senha || confirmar_senha) {
                if (senha !== confirmar_senha) {
                    return res.status(400).render('erro', { mensagem: 'As senhas não coincidem' })
                }

                if (senha.length < 6) {
                    return res.status(400).render('erro', { mensagem: 'A senha deve ter no mínimo 6 caracteres' })
                }

                const senhaHash = await bcrypt.hash(senha, 10)
                await usuarioModel.atualizarSenha(req.usuario.id, senhaHash)
            }

            await usuarioModel.atualizarUsuario(req.usuario.id, nome.trim(), emailNormalizado)

            const token = jwt.sign(
                {
                    id: req.usuario.id,
                    perfil: req.usuario.perfil,
                    nome: nome.trim()
                },
                process.env.JWT_SECRET,
                { expiresIn: '2h' }
            )

            res.cookie('token', token, { httpOnly: true })

            return res.redirect('/usuarios/editar?sucesso=1')
        } catch (erro) {
            console.error(erro)
            if (erro.code === 'ER_DUP_ENTRY') {
                return res.status(409).render('erro', { mensagem: 'Este e-mail já está cadastrado' })
            }
            res.status(500).render('erro', { mensagem: 'Erro interno no servidor' })
        }
    },

    // GET /usuarios — DEV: responde JSON com lista de usuários (Insomnia)
    listar: async (req, res) => {
        try {
            const usuarios = await usuarioModel.listarTodos()
            res.status(200).json({
                total: usuarios.length,
                usuarios
            })
        } catch (erro) {
            console.error(erro)
            res.status(500).json({ mensagem: "Erro ao buscar usuários" })
        }
    }
}
