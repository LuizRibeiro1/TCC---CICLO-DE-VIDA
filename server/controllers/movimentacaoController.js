// ============================================================
// CONTROLLER DE MOVIMENTAÇÃO
// Entrada, saída e reset de estoque
// ============================================================

const movimentacaoModel = require("../models/movimentacaoModel.js")

const formatarData = (data) => {
    const date = new Date(data)
    const dia = String(date.getUTCDate()).padStart(2, '0')
    const mes = String(date.getUTCMonth() + 1).padStart(2, '0')
    const ano = date.getUTCFullYear()
    return `${dia}/${mes}/${ano}`
}

const montarFormulario = async (req, res, tipo) => {
    try {
        const lotes = await movimentacaoModel.listarLotesDisponiveis(tipo)
        const lotesFormatados = lotes.map((lote) => ({
            ...lote,
            lote_formatado: String(lote.id_lote).padStart(3, '0'),
            validade_formatada: formatarData(lote.data_validade)
        }))

        return res.render('movimentacao/formulario', {
            usuario: req.usuario,
            ehAdmin: req.usuario.perfil === 'ADMINISTRADOR',
            tipo,
            titulo: tipo === 'ENTRADA' ? 'Entrada de estoque' : 'Saída de estoque',
            lotes: lotesFormatados,
            idLotePreSelecionado: req.query.lote || '',
            erro: null
        })
    } catch (erro) {
        console.error(erro)
        res.status(500).render('erro', { mensagem: 'Erro ao carregar formulário de movimentação' })
    }
}

module.exports = {
    exibirEntrada: (req, res) => montarFormulario(req, res, 'ENTRADA'),
    exibirSaida: (req, res) => montarFormulario(req, res, 'SAIDA'),

    registrar: async (req, res) => {
        const tipo = req.params.tipo === 'saida' ? 'SAIDA' : 'ENTRADA'

        try {
            const { id_lote, quantidade } = req.body
            const quantidadeNumero = parseInt(quantidade, 10)

            if (!id_lote || Number.isNaN(quantidadeNumero) || quantidadeNumero <= 0) {
                const lotes = await movimentacaoModel.listarLotesDisponiveis(tipo)
                const lotesFormatados = lotes.map((lote) => ({
                    ...lote,
                    lote_formatado: String(lote.id_lote).padStart(3, '0'),
                    validade_formatada: formatarData(lote.data_validade)
                }))

                return res.status(400).render('movimentacao/formulario', {
                    usuario: req.usuario,
                    ehAdmin: req.usuario.perfil === 'ADMINISTRADOR',
                    tipo,
                    titulo: tipo === 'ENTRADA' ? 'Entrada de estoque' : 'Saída de estoque',
                    lotes: lotesFormatados,
                    idLotePreSelecionado: id_lote || '',
                    erro: 'Selecione um lote e informe uma quantidade válida'
                })
            }

            await movimentacaoModel.registrar({
                idUsuario: req.usuario.id,
                idLote: parseInt(id_lote, 10),
                tipo,
                quantidade: quantidadeNumero
            })

            return res.redirect('/home')
        } catch (erro) {
            console.error(erro)

            const lotes = await movimentacaoModel.listarLotesDisponiveis(tipo)
            const lotesFormatados = lotes.map((lote) => ({
                ...lote,
                lote_formatado: String(lote.id_lote).padStart(3, '0'),
                validade_formatada: formatarData(lote.data_validade)
            }))

            return res.status(400).render('movimentacao/formulario', {
                usuario: req.usuario,
                ehAdmin: req.usuario.perfil === 'ADMINISTRADOR',
                tipo,
                titulo: tipo === 'ENTRADA' ? 'Entrada de estoque' : 'Saída de estoque',
                lotes: lotesFormatados,
                idLotePreSelecionado: req.body.id_lote || '',
                erro: erro.message || 'Erro ao registrar movimentação'
            })
        }
    },

    reset: async (req, res) => {
        try {
            await movimentacaoModel.zerarTodas()
            return res.redirect('/home')
        } catch (erro) {
            console.error(erro)
            res.status(500).render('erro', { mensagem: 'Erro ao redefinir movimentações' })
        }
    }
}
