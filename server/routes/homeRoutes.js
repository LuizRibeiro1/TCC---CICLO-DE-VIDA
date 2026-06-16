// ============================================================
// ROTAS DA PÁGINA PRINCIPAL
// ============================================================

const express = require("express")
const router = express.Router()
const produtoController = require("../controllers/produtoController.js")
const { verificarToken } = require("../middleware/authMiddleware.js")

router.get("/home", verificarToken, produtoController.index)

module.exports = router
