// ============================================================
// ROTAS DE PRODUTO (prefixo: /produtos)
// ============================================================

const express = require("express")
const router = express.Router()
const produtoController = require("../controllers/produtoController.js")
const { verificarToken } = require("../middleware/authMiddleware.js")

router.get("/cadastrar", verificarToken, produtoController.exibirCadastro)
router.post("/cadastrar", verificarToken, produtoController.cadastrar)
router.post("/:id/desativar", verificarToken, produtoController.desativar)

module.exports = router
