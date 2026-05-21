const db = require("../config/db.js")

const ID_PERFIL_FUNCIONARIO = 1

module.exports = {
    buscarPorEmail: async (email) => {
        const query = `
            SELECT
                u.id_usuario,
                u.nome_usuario AS nome,
                u.email_usuario AS email,
                u.senha_hash AS senha,
                u.id_perfil,
                p.nome_perfil AS perfil
            FROM USUARIO u
            INNER JOIN PERFIL p ON u.id_perfil = p.id_perfil
            WHERE u.email_usuario = ?
        `
        const [linhas] = await db.execute(query, [email])
        return linhas[0]
    },

    criarUsuario: async (nome, email, senhaHash) => {
        const query = `
            INSERT INTO USUARIO (nome_usuario, email_usuario, senha_hash, id_perfil)
            VALUES (?, ?, ?, ?)
        `
        const [resultado] = await db.execute(query, [
            nome,
            email,
            senhaHash,
            ID_PERFIL_FUNCIONARIO
        ])
        return resultado.insertId
    }
}
