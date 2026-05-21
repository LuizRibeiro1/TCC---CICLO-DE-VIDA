// ============================================================
// CONFIGURAÇÃO DE CONEXÃO COM O MYSQL (LifeStock)
// Cria um pool de conexões reutilizável para os models
// ============================================================

const mysql = require("mysql2/promise")

// Pool mantém várias conexões abertas para melhor desempenho
const pool = mysql.createPool({
    host: process.env.DB_HOST,         // Ex.: localhost
    user: process.env.DB_USER,         // Ex.: root
    password: process.env.DB_PASSWORD, // Senha do MySQL (definida no .env)
    database: process.env.DB_NAME,     // Ex.: LifeStock
    waitForConnections: true,          // Aguarda se todas as conexões estiverem em uso
    connectionLimit: 10,               // Máximo de conexões simultâneas
    queueLimit: 0                      // 0 = fila de espera ilimitada
})

// Exportado para usuarioModel e outros models usarem db.execute()
module.exports = pool;
