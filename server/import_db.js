require('dotenv').config({ path: './.env' })
const mysql = require('mysql2/promise')
const fs = require('fs')

;(async () => {
  try {
    const sql = fs.readFileSync('../data/banco.sql', 'utf8')

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      multipleStatements: true
    })

    await connection.query(sql)
    console.log('Importação do banco concluída com sucesso')
    await connection.end()
    process.exit(0)
  } catch (e) {
    console.error('Erro ao importar banco:', e)
    process.exit(1)
  }
})()
