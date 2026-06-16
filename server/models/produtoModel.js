// ============================================================
// MODEL DE PRODUTO
// Consultas de estoque, lotes e resumo do dashboard
// ============================================================

const db = require("../config/db.js")

const DIAS_PROXIMO_VENCIMENTO = 7

module.exports = {
    DIAS_PROXIMO_VENCIMENTO,

    listarComLotes: async ({ busca = '', filtro = '', pagina = 1, porPagina = 8 }) => {
        const offset = (pagina - 1) * porPagina
        const params = []
        let where = 'WHERE 1=1'

        if (busca.trim()) {
            where += ' AND (p.nome_produto LIKE ? OR p.categoria_produto LIKE ?)'
            const termo = `%${busca.trim()}%`
            params.push(termo, termo)
        }

        if (filtro === 'proximo') {
            where += ` AND l.data_validade >= CURDATE() AND l.data_validade <= DATE_ADD(CURDATE(), INTERVAL ${DIAS_PROXIMO_VENCIMENTO} DAY)`
        } else if (filtro === 'vencido') {
            where += ' AND l.data_validade < CURDATE()'
        } else if (filtro === 'em_dia') {
            where += ` AND l.data_validade > DATE_ADD(CURDATE(), INTERVAL ${DIAS_PROXIMO_VENCIMENTO} DAY)`
        }

        const query = `
            SELECT
                p.id_produto,
                p.nome_produto,
                p.categoria_produto,
                l.id_lote,
                l.quantidade,
                l.data_validade,
                DATEDIFF(l.data_validade, CURDATE()) AS dias_restantes
            FROM PRODUTO p
            INNER JOIN LOTE l ON p.id_produto = l.id_produto
            ${where}
            ORDER BY l.data_validade ASC, p.nome_produto ASC
            LIMIT ? OFFSET ?
        `

        const countQuery = `
            SELECT COUNT(*) AS total
            FROM PRODUTO p
            INNER JOIN LOTE l ON p.id_produto = l.id_produto
            ${where}
        `

        params.push(porPagina, offset)

        const [linhas] = await db.execute(query, params)
        const [contagem] = await db.execute(countQuery, params.slice(0, -2))

        return {
            produtos: linhas,
            total: contagem[0].total
        }
    },

    obterResumo: async () => {
        const query = `
            SELECT
                COUNT(*) AS total_estoque,
                SUM(CASE
                    WHEN l.data_validade >= CURDATE()
                     AND l.data_validade <= DATE_ADD(CURDATE(), INTERVAL ${DIAS_PROXIMO_VENCIMENTO} DAY)
                    THEN 1 ELSE 0 END) AS proximo_validade,
                SUM(CASE
                    WHEN l.data_validade < CURDATE()
                    THEN 1 ELSE 0 END) AS vencidos
            FROM LOTE l
        `

        const [linhas] = await db.execute(query)
        return linhas[0]
    },

    criarProdutoComLote: async (dados) => {
        const conexao = await db.getConnection()

        try {
            await conexao.beginTransaction()

            const insertProduto = `
                INSERT INTO PRODUTO (nome_produto, descricao_produto, categoria_produto, preco_produto, fornecedor_produto)
                VALUES (?, ?, ?, ?, ?)
            `

            const [produto] = await conexao.execute(insertProduto, [
                dados.nome,
                dados.descricao || null,
                dados.categoria,
                dados.preco || null,
                dados.fornecedor || null
            ])

            const insertLote = `
                INSERT INTO LOTE (id_produto, data_validade, quantidade)
                VALUES (?, ?, ?)
            `

            await conexao.execute(insertLote, [
                produto.insertId,
                dados.validade,
                dados.quantidade
            ])

            await conexao.commit()
            return produto.insertId
        } catch (erro) {
            await conexao.rollback()
            throw erro
        } finally {
            conexao.release()
        }
    }
}
