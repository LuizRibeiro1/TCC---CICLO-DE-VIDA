// Importa o módulo mysql para conectar ao banco
const mysql = require("mysql2/promise")

// Cria uma pool de conexão, várias conexões de uma vez, para evitar erros no banco
const pool = mysql.createPool({
    host: process.env.DB_HOST, // Onde o banco está hospedado
    user: process.env.DB_USER, // Usuário que farà a conexão
    password: process.env.DB_PASSWORD, // Senha do usuário
    database: process.env.DB_NAME, // Banco ao qual deseja se conectar,
    // Se todas conexões estiverem ocupadas, deixa o usuário esperando, sem dar erro
    waitForConnections: true, 
    // Quantidade máxima de conexões ao mesmo tempo
    connectionLimit: 10,
    // Máximo de lista de espera
    queueLimit: 0 // 0 = ilimitado
})

// Exporta as informações do banco, pros models utilizarem
module.exports = pool;