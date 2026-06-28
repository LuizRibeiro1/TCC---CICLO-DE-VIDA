// ============================================================
// MODEL DE MOVIMENTAÇÃO DE ESTOQUE
// Entrada, saída e totais do dashboard
// ============================================================

const db = require("../config/db.js")

const registrarHistorico = async (conexao, { idUsuario, idLote, tipo, quantidade }) => {
    if (!idUsuario || !idLote || !quantidade) {
        throw new Error('Dados incompletos para registrar movimentação')
    }

    await conexao.execute(
        `INSERT INTO MOVIMENTACAO_ESTOQUE (id_usuario, id_lote, data_hora, tipo_movimentacao, quantidade)
         VALUES (?, ?, NOW(), ?, ?)`,
        [idUsuario, idLote, tipo, quantidade]
    )
}

module.exports = {
    registrarHistorico,

    obterTotais: async () => {
        const query = `
            SELECT
                CAST(COALESCE(SUM(CASE WHEN tipo_movimentacao = 'ENTRADA' THEN quantidade ELSE 0 END), 0) AS UNSIGNED) AS entrada,
                CAST(COALESCE(SUM(CASE WHEN tipo_movimentacao = 'SAIDA' THEN quantidade ELSE 0 END), 0) AS UNSIGNED) AS saida
            FROM MOVIMENTACAO_ESTOQUE
        `

        const [linhas] = await db.execute(query)
        return {
            entrada: Number(linhas[0].entrada) || 0,
            saida: Number(linhas[0].saida) || 0
        }
    },

    zerarTodas: async () => {
        await db.execute('DELETE FROM MOVIMENTACAO_ESTOQUE')
    },

    listarLotesDisponiveis: async (tipo = null) => {
        let where = 'WHERE p.ativo = 1'

        if (tipo === 'SAIDA') {
            where += ' AND l.quantidade > 0'
        }

        const query = `
            SELECT
                l.id_lote,
                l.quantidade,
                l.data_validade,
                p.id_produto,
                p.nome_produto,
                p.categoria_produto
            FROM LOTE l
            INNER JOIN PRODUTO p ON p.id_produto = l.id_produto
            ${where}
            ORDER BY p.nome_produto ASC, l.id_lote ASC
        `

        const [linhas] = await db.execute(query)
        return linhas
    },

    registrar: async ({ idUsuario, idLote, tipo, quantidade }) => {
        const conexao = await db.getConnection()

        try {
            await conexao.beginTransaction()

            const [lote] = await conexao.execute(
                `SELECT l.quantidade, p.ativo, p.nome_produto
                 FROM LOTE l
                 INNER JOIN PRODUTO p ON p.id_produto = l.id_produto
                 WHERE l.id_lote = ?`,
                [idLote]
            )

            if (!lote.length) {
                throw new Error('Lote não encontrado')
            }

            if (!lote[0].ativo) {
                throw new Error('Produto desativado')
            }

            const estoqueAtual = lote[0].quantidade

            if (tipo === 'SAIDA' && quantidade > estoqueAtual) {
                throw new Error(`Estoque insuficiente. Disponível: ${estoqueAtual}`)
            }

            const novaQuantidade = tipo === 'ENTRADA'
                ? estoqueAtual + quantidade
                : estoqueAtual - quantidade

            await conexao.execute(
                'UPDATE LOTE SET quantidade = ? WHERE id_lote = ?',
                [novaQuantidade, idLote]
            )

            await registrarHistorico(conexao, { idUsuario, idLote, tipo, quantidade })

            await conexao.commit()
        } catch (erro) {
            await conexao.rollback()
            throw erro
        } finally {
            conexao.release()
        }
    }
}
