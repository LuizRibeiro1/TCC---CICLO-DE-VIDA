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

// Edição de perfil — disponível para usuário autenticado (pode editar seu próprio perfil)
router.get("/editar", verificarToken, somenteAdmin, usuarioController.exibirEditar)
router.post("/atualizar", verificarToken, somenteAdmin, usuarioController.atualizar)

// Rotas administrativas para gerenciar usuários
router.get("/gerenciar", verificarToken, somenteAdmin, usuarioController.gerenciar)
router.get("/novo", verificarToken, somenteAdmin, usuarioController.exibirNovo)
router.post("/novo", verificarToken, somenteAdmin, usuarioController.novo)
router.get("/:id/editar", verificarToken, somenteAdmin, usuarioController.exibirEditarPorId)
router.post("/:id/atualizar", verificarToken, somenteAdmin, usuarioController.atualizarPorId)
router.post("/:id/excluir", verificarToken, somenteAdmin, usuarioController.excluir)

// Observação: GET /usuarios (listar JSON) está registrado direto em server.js

module.exports = router
