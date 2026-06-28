// ============================================================
// MODEL DE PRODUTO
// Consultas de estoque, lotes e resumo do dashboard
// ============================================================

const db = require("../config/db.js")
const movimentacaoModel = require("./movimentacaoModel.js")

const DIAS_PROXIMO_VENCIMENTO = 7

module.exports = {
    DIAS_PROXIMO_VENCIMENTO,

    listarComLotes: async ({ busca = '', filtro = '', categoria = '', pagina = 1, porPagina = 8 }) => {
        const offset = (pagina - 1) * porPagina
        const params = []
        let where = 'WHERE p.ativo = 1'

        if (busca.trim()) {
            where += ' AND (p.nome_produto LIKE ? OR p.categoria_produto LIKE ?)'
            const termo = `%${busca.trim()}%`
            params.push(termo, termo)
        }

        if (categoria) {
            where += ' AND p.categoria_produto = ?'
            params.push(categoria)
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
            INNER JOIN PRODUTO p ON p.id_produto = l.id_produto
            WHERE p.ativo = 1
        `

        const [linhas] = await db.execute(query)
        return linhas[0]
    },

    listarCategorias: async () => {
        const query = `
            SELECT DISTINCT categoria_produto
            FROM PRODUTO
            WHERE ativo = 1 AND categoria_produto IS NOT NULL AND categoria_produto != ''
            ORDER BY categoria_produto ASC
        `

        const [linhas] = await db.execute(query)
        return linhas.map((item) => item.categoria_produto)
    },

    buscarPorId: async (idProduto) => {
        const query = `
            SELECT id_produto, nome_produto, descricao_produto, categoria_produto,
                   preco_produto, fornecedor_produto, ativo
            FROM PRODUTO
            WHERE id_produto = ?
        `

        const [linhas] = await db.execute(query, [idProduto])
        return linhas[0] || null
    },

    atualizar: async (idProduto, dados) => {
        const query = `
            UPDATE PRODUTO
            SET nome_produto = ?, descricao_produto = ?, categoria_produto = ?,
                preco_produto = ?, fornecedor_produto = ?
            WHERE id_produto = ? AND ativo = 1
        `

        const [resultado] = await db.execute(query, [
            dados.nome,
            dados.descricao || null,
            dados.categoria,
            dados.preco || null,
            dados.fornecedor || null,
            idProduto
        ])

        return resultado.affectedRows > 0
    },

    desativar: async (idProduto, idUsuario) => {
        if (!idUsuario) {
            throw new Error('Usuário não identificado para registrar a saída')
        }

        const conexao = await db.getConnection()

        try {
            await conexao.beginTransaction()

            const [produto] = await conexao.execute(
                'SELECT id_produto FROM PRODUTO WHERE id_produto = ? AND ativo = 1',
                [idProduto]
            )

            if (!produto.length) {
                await conexao.rollback()
                return false
            }

            const [lotes] = await conexao.execute(
                'SELECT id_lote, quantidade FROM LOTE WHERE id_produto = ? AND quantidade > 0',
                [idProduto]
            )

            for (const lote of lotes) {
                const quantidade = Number(lote.quantidade)

                await movimentacaoModel.registrarHistorico(conexao, {
                    idUsuario,
                    idLote: lote.id_lote,
                    tipo: 'SAIDA',
                    quantidade
                })

                await conexao.execute(
                    'UPDATE LOTE SET quantidade = 0 WHERE id_lote = ?',
                    [lote.id_lote]
                )
            }

            await conexao.execute(
                'UPDATE PRODUTO SET ativo = 0 WHERE id_produto = ?',
                [idProduto]
            )

            await conexao.commit()
            return true
        } catch (erro) {
            await conexao.rollback()
            throw erro
        } finally {
            conexao.release()
        }
    },

    criarProdutoComLote: async (dados, idUsuario) => {
        if (!idUsuario) {
            throw new Error('Usuário não identificado para registrar a entrada')
        }

        const conexao = await db.getConnection()

        try {
            await conexao.beginTransaction()

            const insertProduto = `
                INSERT INTO PRODUTO (nome_produto, descricao_produto, categoria_produto, preco_produto, fornecedor_produto)
                VALUES (?, ?, ?, ?, ?)
            `

            const [resultadoProduto] = await conexao.execute(insertProduto, [
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

            const [resultadoLote] = await conexao.execute(insertLote, [
                resultadoProduto.insertId,
                dados.validade,
                dados.quantidade
            ])

            const idLote = resultadoLote.insertId

            await movimentacaoModel.registrarHistorico(conexao, {
                idUsuario,
                idLote,
                tipo: 'ENTRADA',
                quantidade: dados.quantidade
            })

            await conexao.commit()
            return resultadoProduto.insertId
        } catch (erro) {
            await conexao.rollback()
            throw erro
        } finally {
            conexao.release()
        }
    }
}
