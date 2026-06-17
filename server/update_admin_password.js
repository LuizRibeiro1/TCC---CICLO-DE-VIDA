require('dotenv').config({ path: './.env' })
const bcrypt = require('bcrypt')
const mysql = require('mysql2/promise')

;(async () => {
  try {
    const ADMIN_EMAIL = 'admin@lifestock.com'
    const NEW_PASSWORD = process.env.NEW_ADMIN_PASSWORD || '123456' // 6 dígitos simples por padrão

    console.log('Gerando hash bcrypt para a nova senha...')
    const hash = await bcrypt.hash(NEW_PASSWORD, 10)

    const pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 5
    })

    const [result] = await pool.execute(
      'UPDATE USUARIO SET senha_hash = ? WHERE email_usuario = ?',
      [hash, ADMIN_EMAIL]
    )

    if (result.affectedRows === 0) {
      console.error('Nenhum usuário encontrado com o e-mail', ADMIN_EMAIL)
      await pool.end()
      process.exit(1)
    }

    console.log(`Senha do admin (${ADMIN_EMAIL}) atualizada com sucesso para: ${NEW_PASSWORD}`)
    await pool.end()
    process.exit(0)
  } catch (e) {
    console.error('Erro ao atualizar senha do admin:', e)
    process.exit(1)
  }
})()
