// ============================================================
// MIDDLEWARE DE AUTENTICAÇÃO
// Valida o JWT gravado no cookie e expõe req.usuario
// ============================================================

const jwt = require('jsonwebtoken')

const verificarToken = (req, res, next) => {
    const token = req.cookies.token

    if (!token) {
        return res.redirect('/login')
    }

    try {
        const dados = jwt.verify(token, process.env.JWT_SECRET)
        req.usuario = dados
        next()
    } catch (erro) {
        res.clearCookie('token')
        return res.redirect('/login')
    }
}

const somenteAdmin = (req, res, next) => {
    if (req.usuario?.perfil !== 'ADMINISTRADOR') {
        return res.status(403).render('erro', { mensagem: 'Acesso restrito a administradores' })
    }
    next()
}

module.exports = { verificarToken, somenteAdmin }
