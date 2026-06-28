// ============================================================
// CONTROLLER DE PRODUTO
// Dashboard principal e cadastro de produtos
// ============================================================

const produtoModel = require("../models/produtoModel.js")
const movimentacaoModel = require("../models/movimentacaoModel.js")

const formatarData = (data) => {
    const date = new Date(data)
    const dia = String(date.getUTCDate()).padStart(2, '0')
    const mes = String(date.getUTCMonth() + 1).padStart(2, '0')
    const ano = date.getUTCFullYear()
    return `${dia}/${mes}/${ano}`
}

const montarStatus = (diasRestantes) => {
    if (diasRestantes < 0) {
        return { label: 'VENCIDO', classe: 'status-vencido' }
    }

    if (diasRestantes <= produtoModel.DIAS_PROXIMO_VENCIMENTO) {
        return { label: 'PRÓXIMO', classe: 'status-proximo' }
    }

    return { label: 'EM DIA', classe: 'status-em-dia' }
}

const montarTextoValidade = (diasRestantes) => {
    if (diasRestantes === 0) return 'hoje'
    if (diasRestantes > 0) return `${diasRestantes} dias`
    return `${Math.abs(diasRestantes)} dias`
}

module.exports = {
    index: async (req, res) => {
        try {
            const pagina = Math.max(parseInt(req.query.pagina, 10) || 1, 1)
            const busca = req.query.busca || ''
            const filtro = req.query.filtro || ''
            const categoria = req.query.categoria || ''
            const porPagina = 8

            const [{ produtos, total }, resumo, movimentacao, categorias] = await Promise.all([
                produtoModel.listarComLotes({ busca, filtro, categoria, pagina, porPagina }),
                produtoModel.obterResumo(),
                movimentacaoModel.obterTotais(),
                produtoModel.listarCategorias()
            ])

            const produtosFormatados = produtos.map((item) => {
                const status = montarStatus(item.dias_restantes)

                return {
                    ...item,
                    lote_formatado: String(item.id_lote).padStart(3, '0'),
                    validade_formatada: formatarData(item.data_validade),
                    validade_relativa: montarTextoValidade(item.dias_restantes),
                    status_label: status.label,
                    status_classe: status.classe
                }
            })

            const totalPaginas = Math.max(Math.ceil(total / porPagina), 1)

            return res.render('home/index', {
                usuario: req.usuario,
                produtos: produtosFormatados,
                resumo,
                movimentacao,
                categorias,
                busca,
                filtro,
                categoria,
                pagina,
                totalPaginas,
                ehAdmin: req.usuario.perfil === 'ADMINISTRADOR'
            })
        } catch (erro) {
            console.error(erro)
            res.status(500).render('erro', { mensagem: 'Erro ao carregar o estoque' })
        }
    },

    exibirCadastro: (req, res) => {
        res.render('produtos/cadastrar', {
            usuario: req.usuario,
            ehAdmin: req.usuario.perfil === 'ADMINISTRADOR'
        })
    },

    cadastrar: async (req, res) => {
        try {
            const { nome, categoria, quantidade, validade, descricao, preco, fornecedor } = req.body

            if (!nome || !categoria || !quantidade || !validade) {
                return res.status(400).render('erro', { mensagem: 'Preencha os campos obrigatórios do produto' })
            }

            const quantidadeNumero = parseInt(quantidade, 10)

            if (Number.isNaN(quantidadeNumero) || quantidadeNumero <= 0) {
                return res.status(400).render('erro', { mensagem: 'Informe uma quantidade válida' })
            }

            await produtoModel.criarProdutoComLote({
                nome: nome.trim(),
                categoria: categoria.trim(),
                quantidade: quantidadeNumero,
                validade,
                descricao: descricao?.trim(),
                preco: preco || null,
                fornecedor: fornecedor?.trim()
            }, req.usuario.id)

            return res.redirect('/home')
        } catch (erro) {
            console.error(erro)
            res.status(500).render('erro', { mensagem: 'Erro ao cadastrar produto' })
        }
    },

    exibirEditar: async (req, res) => {
        try {
            const produto = await produtoModel.buscarPorId(req.params.id)

            if (!produto || !produto.ativo) {
                return res.status(404).render('erro', { mensagem: 'Produto não encontrado' })
            }

            return res.render('produtos/editar', {
                usuario: req.usuario,
                ehAdmin: req.usuario.perfil === 'ADMINISTRADOR',
                produto
            })
        } catch (erro) {
            console.error(erro)
            res.status(500).render('erro', { mensagem: 'Erro ao carregar produto' })
        }
    },

    atualizar: async (req, res) => {
        try {
            const { nome, categoria, descricao, preco, fornecedor } = req.body

            if (!nome || !categoria) {
                return res.status(400).render('erro', { mensagem: 'Preencha os campos obrigatórios' })
            }

            const atualizado = await produtoModel.atualizar(req.params.id, {
                nome: nome.trim(),
                categoria: categoria.trim(),
                descricao: descricao?.trim(),
                preco: preco || null,
                fornecedor: fornecedor?.trim()
            })

            if (!atualizado) {
                return res.status(404).render('erro', { mensagem: 'Produto não encontrado' })
            }

            return res.redirect('/home')
        } catch (erro) {
            console.error(erro)
            res.status(500).render('erro', { mensagem: 'Erro ao atualizar produto' })
        }
    },

    desativar: async (req, res) => {
        try {
            const desativado = await produtoModel.desativar(parseInt(req.params.id, 10), req.usuario.id)

            if (!desativado) {
                return res.status(404).render('erro', { mensagem: 'Produto não encontrado' })
            }

            return res.redirect('/home')
        } catch (erro) {
            console.error(erro)
            res.status(500).render('erro', { mensagem: 'Erro ao desativar produto' })
        }
    }
}
