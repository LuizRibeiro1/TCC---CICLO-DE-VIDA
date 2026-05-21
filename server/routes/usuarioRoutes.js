const express = require("express");
const router = express.Router();
const usuarioController = require("../controllers/usuarioController.js")

router.post("/login", usuarioController.login)
router.post("/cadastrar", usuarioController.cadastrar)
router.get("/logout", usuarioController.logout)

module.exports = router
