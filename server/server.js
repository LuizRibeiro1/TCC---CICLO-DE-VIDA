// ============================================================
// ARQUIVO PRINCIPAL DO SERVIDOR (LifeStock)
// Configura o Express, rotas públicas e inicia o app após conectar ao MySQL
// ============================================================

const express = require("express");
const app = express();
const path = require("path");

require('dotenv').config()

const port = process.env.PORT || 5000;

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(require('cookie-parser')())

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../client/views"));
app.use(express.static(path.join(__dirname, "../client/public")));

app.get("/", (req, res) => {
  res.status(200).redirect("/login");
});

app.get("/login", (req, res) => {
  res.render('auth/login', {
    cadastro: req.query.cadastro === '1'
  });
});

app.get("/cadastro", (req, res) => {
  res.render('auth/cadastro');
});

const usuariosRoutes = require("./routes/usuarioRoutes.js");
const usuarioController = require("./controllers/usuarioController.js");
const homeRoutes = require("./routes/homeRoutes.js");
const produtoRoutes = require("./routes/produtoRoutes.js");
const movimentacaoRoutes = require("./routes/movimentacaoRoutes.js");
const movimentacaoController = require("./controllers/movimentacaoController.js");
const { verificarToken, somenteAdmin } = require("./middleware/authMiddleware.js");

app.get("/usuarios", verificarToken, somenteAdmin, usuarioController.listar);

app.use("/", homeRoutes);
app.use("/usuarios", usuariosRoutes);
app.use("/produtos", produtoRoutes);

app.post("/movimentacao/reset", verificarToken, somenteAdmin, movimentacaoController.reset);
app.use("/movimentacao", movimentacaoRoutes);

const pool = require("./config/db.js");

(async () => {
  try {
    await pool.getConnection();
    console.log("Banco conectado");

    app.listen(port, () => {
      console.log(`Link: http://localhost:${port}`);
      console.log(`Servidor funcionando na porta ${port}`);
    });
  } catch (erro) {
    console.log("Erro ao tentar conectar com o banco de dados");
    process.exit(1);
  }
})();
