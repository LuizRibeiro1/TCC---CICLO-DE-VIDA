// ============================================================
// MODEL DE USUÁRIO
// Responsável apenas por consultas e inserts no banco (camada de dados)
// Tabelas: USUARIO e PERFIL (banco LifeStock)
// ============================================================

const db = require("../config/db.js")

// id_perfil = 1 corresponde a FUNCIONARIO; 2 = ADMINISTRADOR
const ID_PERFIL_FUNCIONARIO = 1
const ID_PERFIL_ADMIN = 2

module.exports = {
    // Busca um usuário pelo e-mail (usado no login e para evitar e-mail duplicado no cadastro)
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
        return linhas[0] // undefined se não encontrar
    },

    // Insere novo usuário; sempre como FUNCIONARIO (cadastro público)
    criarUsuario: async (nome, email, senhaHash) => {
        const query = `
            INSERT INTO USUARIO (nome_usuario, email_usuario, senha_hash, id_perfil)
            VALUES (?, ?, ?, ?)
        `
        const [resultado] = await db.execute(query, [
            nome,
            email,
            senhaHash,              // senha já criptografada pelo controller (bcrypt)
            ID_PERFIL_FUNCIONARIO
        ])
        return resultado.insertId  // id do usuário recém-criado
    },

    // Insere novo usuário com perfil definido (usado pelo admin)
    criarUsuarioComPerfil: async (nome, email, senhaHash, idPerfil) => {
        const query = `
            INSERT INTO USUARIO (nome_usuario, email_usuario, senha_hash, id_perfil)
            VALUES (?, ?, ?, ?)
        `
        const [resultado] = await db.execute(query, [
            nome,
            email,
            senhaHash,
            idPerfil
        ])
        return resultado.insertId
    },

    // Busca usuário pelo id (edição de perfil)
    buscarPorId: async (id) => {
        const query = `
            SELECT
                u.id_usuario,
                u.nome_usuario AS nome,
                u.email_usuario AS email,
                u.id_perfil,
                p.nome_perfil AS perfil
            FROM USUARIO u
            INNER JOIN PERFIL p ON u.id_perfil = p.id_perfil
            WHERE u.id_usuario = ?
        `
        const [linhas] = await db.execute(query, [id])
        return linhas[0]
    },

    // Atualiza nome e e-mail do usuário logado
    atualizarUsuario: async (id, nome, email) => {
        const query = `
            UPDATE USUARIO
            SET nome_usuario = ?, email_usuario = ?
            WHERE id_usuario = ?
        `
        const [resultado] = await db.execute(query, [nome, email, id])
        return resultado.affectedRows
    },

    // Atualiza senha quando informada na edição de perfil
    atualizarSenha: async (id, senhaHash) => {
        const query = `
            UPDATE USUARIO
            SET senha_hash = ?
            WHERE id_usuario = ?
        `
        const [resultado] = await db.execute(query, [senhaHash, id])
        return resultado.affectedRows
    },

    // Remove usuário pelo id
    excluirUsuario: async (id) => {
        const query = `
            DELETE FROM USUARIO
            WHERE id_usuario = ?
        `
        const [resultado] = await db.execute(query, [id])
        return resultado.affectedRows
    },

    // DEV: retorna todos os usuários sem expor a senha (rota GET /usuarios)
    listarTodos: async () => {
        const query = `
            SELECT
                u.id_usuario,
                u.nome_usuario,
                u.email_usuario,
                u.id_perfil,
                p.nome_perfil
            FROM USUARIO u
            INNER JOIN PERFIL p ON u.id_perfil = p.id_perfil
            ORDER BY u.id_usuario
        `
        const [linhas] = await db.execute(query)
        return linhas
    }
}
