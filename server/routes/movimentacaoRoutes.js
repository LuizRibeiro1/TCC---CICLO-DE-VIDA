// ============================================================
// ROTAS DE MOVIMENTAÇÃO (prefixo: /movimentacao)
// ============================================================

const express = require("express")
const router = express.Router()
const movimentacaoController = require("../controllers/movimentacaoController.js")
const { verificarToken, somenteAdmin } = require("../middleware/authMiddleware.js")

router.get("/entrada", verificarToken, movimentacaoController.exibirEntrada)
router.post("/entrada", verificarToken, (req, res) => {
    req.params.tipo = 'entrada'
    return movimentacaoController.registrar(req, res)
})

router.get("/saida", verificarToken, movimentacaoController.exibirSaida)
router.post("/saida", verificarToken, (req, res) => {
    req.params.tipo = 'saida'
    return movimentacaoController.registrar(req, res)
})

router.post("/reset", verificarToken, somenteAdmin, movimentacaoController.reset)

module.exports = router
