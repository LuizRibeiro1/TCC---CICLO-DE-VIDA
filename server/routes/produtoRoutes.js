// ============================================================
// ROTAS DE PRODUTO (prefixo: /produtos)
// ============================================================

const express = require("express")
const router = express.Router()
const produtoController = require("../controllers/produtoController.js")
const { verificarToken } = require("../middleware/authMiddleware.js")

router.get("/cadastrar", verificarToken, produtoController.exibirCadastro)
router.post("/cadastrar", verificarToken, produtoController.cadastrar)
router.get("/:id/editar", verificarToken, produtoController.exibirEdicao)
router.post("/:id/editar", verificarToken, produtoController.editar)
router.get("/:id/movimentar", verificarToken, produtoController.exibirMovimentacao)
router.post("/:id/movimentar", verificarToken, produtoController.movimentar)
router.post("/:id/desativar", verificarToken, produtoController.desativar)

router.get("/:id/editar", verificarToken, produtoController.exibirEditar)
router.post("/:id/atualizar", verificarToken, produtoController.atualizar)
router.post("/:id/desativar", verificarToken, produtoController.desativar)

module.exports = router
