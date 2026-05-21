// ============================================================
// ARQUIVO PRINCIPAL DO SERVIDOR (LifeStock)
// Configura o Express, rotas públicas e inicia o app após conectar ao MySQL
// ============================================================

// Importa o framework Express para criar o servidor HTTP
const express = require("express");
const app = express();

// Módulo nativo do Node para montar caminhos de pastas (views, arquivos estáticos)
const path = require("path");

// Carrega variáveis do arquivo .env (PORT, DB_HOST, JWT_SECRET, etc.)
require('dotenv').config()

// Porta definida no .env; se não existir, usa 5000 como padrão
const port = process.env.PORT || 5000;

// --- MIDDLEWARES GLOBAIS ---
// Permite receber JSON no corpo das requisições (APIs, Insomnia)
app.use(express.json())

// Permite ler dados enviados por formulários HTML (login e cadastro)
app.use(express.urlencoded({ extended: true }))

// Permite gravar e ler cookies (token JWT após o login)
app.use(require('cookie-parser')())

// --- CONFIGURAÇÃO DO FRONT-END (EJS + arquivos públicos) ---
// Define EJS como motor de templates das páginas
app.set("view engine", "ejs");

// Informa ao Express onde ficam os arquivos .ejs
app.set("views", path.join(__dirname, "../client/views"));

// Expõe CSS, imagens e JS da pasta public (ex.: /css/login.css)
app.use(express.static(path.join(__dirname, "../client/public")));

// --- ROTAS DE PÁGINAS (GET) ---
// Raiz do site: redireciona sempre para a tela de login
app.get("/", (req, res) => {
  res.status(200).redirect("/login");
});

// Exibe a página de login (layout customizado em auth/login.ejs)
// Passa flags da URL para mostrar mensagens de sucesso após login ou cadastro
app.get("/login", (req, res) => {
  res.render('auth/login', {
    sucesso: req.query.sucesso === '1',   // usuário logou com sucesso
    cadastro: req.query.cadastro === '1'  // conta criada, pode fazer login
  });
});

// Exibe a página de cadastro de novo usuário
app.get("/cadastro", (req, res) => {
  res.render('auth/cadastro');
});

// --- ROTAS DE USUÁRIO (API + formulários) ---
const usuariosRoutes = require("./routes/usuarioRoutes.js");
const usuarioController = require("./controllers/usuarioController.js");

// DEV: lista todos os usuários em JSON (testar no Insomnia com GET /usuarios)
// Para desativar, comente a linha abaixo:
app.get("/usuarios", usuarioController.listar);

// Demais rotas de usuário: POST /usuarios/login, POST /usuarios/cadastrar, GET /usuarios/logout
app.use("/usuarios", usuariosRoutes);

// --- INICIALIZAÇÃO DO SERVIDOR ---
// Só sobe o servidor depois de confirmar conexão com o MySQL
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
