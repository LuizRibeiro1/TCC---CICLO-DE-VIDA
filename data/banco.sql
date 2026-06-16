-- ============================================================
-- SCRIPT DO BANCO LifeStock
-- Execute no MySQL Workbench ou linha de comando para criar
-- tabelas, perfis e usuários de teste do sistema
-- ============================================================

-- Remove o banco antigo (cuidado: apaga todos os dados)
DROP DATABASE IF EXISTS LifeStock;

CREATE DATABASE LifeStock;
USE LifeStock;

-- =========================
-- TABELA PERFIL
-- =========================
CREATE TABLE PERFIL (
    id_perfil INT PRIMARY KEY AUTO_INCREMENT,
    nome_perfil VARCHAR(50) NOT NULL
);

INSERT INTO PERFIL (nome_perfil) VALUES
('FUNCIONARIO'),
('ADMINISTRADOR');

-- =========================
-- TABELA USUARIO
-- =========================
CREATE TABLE USUARIO (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    nome_usuario VARCHAR(65) NOT NULL,
    email_usuario VARCHAR(65) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    id_perfil INT NOT NULL,
    FOREIGN KEY (id_perfil) REFERENCES PERFIL(id_perfil)
);

-- =========================
-- TABELA PRODUTO
-- =========================
CREATE TABLE PRODUTO (
    id_produto INT PRIMARY KEY AUTO_INCREMENT,
    nome_produto VARCHAR(100) NOT NULL,
    descricao_produto TEXT,
    categoria_produto VARCHAR(45),
    preco_produto DECIMAL(10,2),
    fornecedor_produto VARCHAR(45)
);

-- =========================
-- TABELA LOTE
-- =========================
CREATE TABLE LOTE (
    id_lote INT PRIMARY KEY AUTO_INCREMENT,
    id_produto INT NOT NULL,
    data_validade DATE NOT NULL,
    quantidade INT NOT NULL,
    FOREIGN KEY (id_produto) REFERENCES PRODUTO(id_produto)
);

-- =========================
-- TABELA MOVIMENTACAO_ESTOQUE
-- =========================
CREATE TABLE MOVIMENTACAO_ESTOQUE (
    id_movimentacao INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    id_lote INT NOT NULL,
    data_hora DATETIME NOT NULL,
    tipo_movimentacao ENUM('ENTRADA', 'SAIDA') NOT NULL,
    quantidade INT NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES USUARIO(id_usuario),
    FOREIGN KEY (id_lote) REFERENCES LOTE(id_lote)
);

-- =========================
-- TABELA ALERTA_VALIDADE
-- =========================
CREATE TABLE ALERTA_VALIDADE (
    id_alerta INT PRIMARY KEY AUTO_INCREMENT,
    id_lote INT NOT NULL,
    id_usuario INT NOT NULL,
    data_alerta DATE NOT NULL,
    tipo_alerta ENUM('PROXIMO_VENCIMENTO', 'VENCIDO') NOT NULL,
    status_alerta ENUM('ATIVO', 'RESOLVIDO') DEFAULT 'ATIVO',
    observacoes TEXT,
    FOREIGN KEY (id_lote) REFERENCES LOTE(id_lote),
    FOREIGN KEY (id_usuario) REFERENCES USUARIO(id_usuario)
);

-- Usuários de teste para login (senha em texto: 123456)
-- senha_hash foi gerada com bcrypt no Node
INSERT INTO USUARIO (nome_usuario, email_usuario, senha_hash, id_perfil) VALUES
(
    'Admin LifeStock',
    'admin@lifestock.com',
    '$2b$10$xQEalAV.BOQCzyvfxAKs8.N1nXS/RKJEwtAWqOtEb6//ZkxQVgX7q',
    2
),
(
    'Funcionario Teste',
    'funcionario@lifestock.com',
    '$2b$10$xQEalAV.BOQCzyvfxAKs8.N1nXS/RKJEwtAWqOtEb6//ZkxQVgX7q',
    1
);

-- =========================
-- DADOS DE EXEMPLO — PRODUTOS E LOTES
-- =========================
INSERT INTO PRODUTO (nome_produto, descricao_produto, categoria_produto, preco_produto, fornecedor_produto) VALUES
('Refrigerante', 'Refrigerante cola 2L', 'Bebidas', 8.50, 'Distribuidora Sul'),
('Mercearia A', 'Itens diversos de mercearia', 'Mercearia', 12.00, 'Atacado Central'),
('Pão de Forma', 'Pão de forma tradicional 500g', 'Padaria', 6.90, 'Padaria Bom Dia'),
('Arroz branco 5kg', 'Arroz tipo 1 pacote 5kg', 'Mercearia', 24.90, 'Atacado Central'),
('Leite integral 1L', 'Leite UHT integral', 'Laticínios', 5.20, 'Laticínios Vale'),
('Iogurte natural', 'Iogurte natural 170g', 'Laticínios', 3.80, 'Laticínios Vale'),
('Suco de laranja', 'Suco integral 900ml', 'Bebidas', 9.50, 'Distribuidora Sul'),
('Biscoito recheado', 'Biscoito recheado chocolate', 'Mercearia', 2.50, 'Atacado Central'),
('Queijo mussarela', 'Queijo mussarela fatiado 150g', 'Laticínios', 8.90, 'Laticínios Vale'),
('Água mineral 500ml', 'Água mineral sem gás', 'Bebidas', 2.00, 'Distribuidora Sul'),
('Macarrão espaguete', 'Macarrão espaguete 500g', 'Mercearia', 4.50, 'Atacado Central'),
('Café torrado 500g', 'Café torrado e moído', 'Mercearia', 18.90, 'Atacado Central'),
('Manteiga 200g', 'Manteiga com sal', 'Laticínios', 7.50, 'Laticínios Vale'),
('Salgadinho', 'Salgadinho de milho 120g', 'Mercearia', 3.20, 'Atacado Central'),
('Refrigerante zero', 'Refrigerante cola zero 2L', 'Bebidas', 8.90, 'Distribuidora Sul'),
('Pão francês (un)', 'Pão francês unidade', 'Padaria', 0.80, 'Padaria Bom Dia'),
('Achocolatado', 'Achocolatado em pó 400g', 'Mercearia', 11.50, 'Atacado Central'),
('Suco de uva', 'Suco de uva integral 900ml', 'Bebidas', 10.50, 'Distribuidora Sul'),
('Margarina 500g', 'Margarina cremosa', 'Laticínios', 6.80, 'Laticínios Vale'),
('Feijão carioca 1kg', 'Feijão carioca tipo 1', 'Mercearia', 7.90, 'Atacado Central');

INSERT INTO LOTE (id_produto, data_validade, quantidade) VALUES
(1, '2026-06-21', 41),
(2, '2026-06-18', 2),
(3, '2026-06-17', 93),
(4, '2026-05-15', 15),
(5, '2027-03-01', 120),
(6, '2026-06-19', 35),
(7, '2026-06-20', 28),
(8, '2027-01-15', 200),
(9, '2026-06-16', 18),
(10, '2027-06-01', 300),
(11, '2027-02-10', 85),
(12, '2027-04-20', 42),
(13, '2026-06-22', 22),
(14, '2027-01-05', 150),
(15, '2026-06-18', 55),
(16, '2026-06-16', 200),
(17, '2027-05-12', 60),
(18, '2026-06-21', 33),
(19, '2026-06-20', 47),
(20, '2027-08-30', 90);
