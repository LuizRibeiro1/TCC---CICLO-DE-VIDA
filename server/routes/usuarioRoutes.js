// ============================================================
// ROTAS DE USUÁRIO (prefixo: /usuarios)
// Montadas em server.js com app.use("/usuarios", usuariosRoutes)
// ============================================================

const express = require("express");
const router = express.Router();
const usuarioController = require("../controllers/usuarioController.js")
const { verificarToken, somenteAdmin } = require("../middleware/authMiddleware.js")

// Processa o formulário de login (auth/login.ejs envia POST para aqui)
router.post("/login", usuarioController.login)

// Processa o formulário de cadastro (auth/cadastro.ejs)
router.post("/cadastrar", usuarioController.cadastrar)

// Encerra a sessão
router.get("/logout", usuarioController.logout)

// Edição de perfil — disponível apenas para administrador
router.get("/editar", verificarToken, somenteAdmin, usuarioController.exibirEditar)
router.post("/atualizar", verificarToken, somenteAdmin, usuarioController.atualizar)

// Observação: GET /usuarios (listar JSON) está registrado direto em server.js

module.exports = router
