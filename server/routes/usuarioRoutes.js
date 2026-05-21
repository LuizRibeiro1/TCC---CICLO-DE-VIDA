// ============================================================
// ROTAS DE USUÁRIO (prefixo: /usuarios)
// Montadas em server.js com app.use("/usuarios", usuariosRoutes)
// ============================================================

const express = require("express");
const router = express.Router();
const usuarioController = require("../controllers/usuarioController.js")

// Processa o formulário de login (auth/login.ejs envia POST para aqui)
router.post("/login", usuarioController.login)

// Processa o formulário de cadastro (auth/cadastro.ejs)
router.post("/cadastrar", usuarioController.cadastrar)

// Encerra a sessão (link "Sair" na tela de login)
router.get("/logout", usuarioController.logout)

// Observação: GET /usuarios (listar JSON) está registrado direto em server.js

module.exports = router
