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
