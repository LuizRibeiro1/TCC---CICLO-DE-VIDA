// ============================================================
// CONTROLLER DE USUÁRIO
// Recebe requisições HTTP, valida dados e chama o model
// ============================================================

const usuarioModel = require("../models/usuarioModel.js")
const bcrypt = require('bcrypt')      // Criptografia de senha
const jwt = require('jsonwebtoken')   // Token de sessão após login

// útil para páginas administrativas
const ID_PERFIL_ADMIN = 2

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

            // Salva o token em cookie httpOnly e garante o path raiz para o redirect funcionar em /home
            res.cookie('token', token, { httpOnly: true, path: '/' })

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
        res.clearCookie('token', { path: '/' })
        res.redirect("/login")
    },

    // GET /usuarios/editar — formulário de edição do perfil do usuário logado
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

    // POST /usuarios/atualizar — salva alterações do perfil do usuário logado
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

            res.cookie('token', token, { httpOnly: true, path: '/' })

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
    },

    // --- Ações administrativas (somente ADMIN via rotas protegidas) ---
    // GET /usuarios/gerenciar — lista usuários (view)
    gerenciar: async (req, res) => {
        try {
            const usuarios = await usuarioModel.listarTodos()
            return res.render('usuarios/gerenciar', {
                usuario: req.usuario,
                usuarios,
                ehAdmin: req.usuario.perfil === 'ADMINISTRADOR'
            })
        } catch (erro) {
            console.error(erro)
            res.status(500).render('erro', { mensagem: 'Erro ao carregar usuários' })
        }
    },

    // GET /usuarios/novo — formulário de criação pelo admin
    exibirNovo: (req, res) => {
        res.render('usuarios/novo', { usuario: req.usuario })
    },

    // POST /usuarios/novo — cria usuário com perfil escolhido
    novo: async (req, res) => {
        try {
            const { nome, email, senha, confirmar_senha, perfil } = req.body

            if (!nome || !email || !senha || !confirmar_senha || !perfil) {
                return res.status(400).render('erro', { mensagem: 'Preencha todos os campos obrigatórios' })
            }

            if (senha !== confirmar_senha) {
                return res.status(400).render('erro', { mensagem: 'As senhas não coincidem' })
            }

            if (senha.length < 6) {
                return res.status(400).render('erro', { mensagem: 'A senha deve ter no mínimo 6 caracteres' })
            }

            const emailNormalizado = email.trim().toLowerCase()
            const existente = await usuarioModel.buscarPorEmail(emailNormalizado)
            if (existente) {
                return res.status(409).render('erro', { mensagem: 'Este e-mail já está cadastrado' })
            }

            const senhaHash = await bcrypt.hash(senha, 10)
            const idPerfil = parseInt(perfil, 10) === ID_PERFIL_ADMIN ? ID_PERFIL_ADMIN : 1
            await usuarioModel.criarUsuarioComPerfil(nome.trim(), emailNormalizado, senhaHash, idPerfil)

            return res.redirect('/usuarios/gerenciar')
        } catch (erro) {
            console.error(erro)
            res.status(500).render('erro', { mensagem: 'Erro ao criar usuário' })
        }
    },

    // GET /usuarios/:id/editar — formulário de edição pelo admin
    exibirEditarPorId: async (req, res) => {
        try {
            const id = parseInt(req.params.id, 10)
            const usuarioEd = await usuarioModel.buscarPorId(id)
            if (!usuarioEd) {
                return res.status(404).render('erro', { mensagem: 'Usuário não encontrado' })
            }
            return res.render('usuarios/editar', { usuario: req.usuario, usuarioEd })
        } catch (erro) {
            console.error(erro)
            res.status(500).render('erro', { mensagem: 'Erro ao carregar usuário' })
        }
    },

    // POST /usuarios/:id/atualizar — atualiza usuário pelo admin
    atualizarPorId: async (req, res) => {
        try {
            const id = parseInt(req.params.id, 10)
            const { nome, email, senha, confirmar_senha, perfil } = req.body

            if (!nome || !email) {
                return res.status(400).render('erro', { mensagem: 'Nome e e-mail são obrigatórios' })
            }

            const usuarioAtual = await usuarioModel.buscarPorId(id)
            if (!usuarioAtual) {
                return res.status(404).render('erro', { mensagem: 'Usuário não encontrado' })
            }

            const emailNormalizado = email.trim().toLowerCase()
            if (emailNormalizado !== usuarioAtual.email) {
                const emailEmUso = await usuarioModel.buscarPorEmail(emailNormalizado)
                if (emailEmUso && emailEmUso.id_usuario !== id) {
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
                await usuarioModel.atualizarSenha(id, senhaHash)
            }

            await usuarioModel.atualizarUsuario(id, nome.trim(), emailNormalizado)

            // Atualiza perfil se foi passado (somente 1 ou 2)
            const novoPerfil = parseInt(perfil, 10)
            if (novoPerfil === 1 || novoPerfil === 2) {
                const query = `UPDATE USUARIO SET id_perfil = ? WHERE id_usuario = ?`
                await require('../config/db.js').execute(query, [novoPerfil, id])
            }

            return res.redirect('/usuarios/gerenciar')
        } catch (erro) {
            console.error(erro)
            res.status(500).render('erro', { mensagem: 'Erro ao atualizar usuário' })
        }
    },

    // POST /usuarios/:id/excluir — exclui usuário
    excluir: async (req, res) => {
        try {
            const id = parseInt(req.params.id, 10)
            if (id === req.usuario.id) {
                return res.status(400).render('erro', { mensagem: 'Administrador não pode excluir a si mesmo' })
            }
            await usuarioModel.excluirUsuario(id)
            return res.redirect('/usuarios/gerenciar')
        } catch (erro) {
            console.error(erro)
            res.status(500).render('erro', { mensagem: 'Erro ao excluir usuário' })
        }
    }
}
