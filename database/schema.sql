/* =====================================================================================
   E-COMMERCE DE LOJA ÚNICA (marca própria de streetwear)
   Arquivo : database/schema.sql
   SGBD    : MySQL 8.0+ (InnoDB / utf8mb4)
   Modelo  : 3ª Forma Normal (3FN) — PKs surrogate, FKs declaradas e tabelas pivô para
             TODAS as relações N:N.

   O QUE MUDOU EM RELAÇÃO AO MARKETPLACE (leia isto primeiro)
   -------------------------------------------------------------------------------------
   Não existem mais:  vendedor · subpedido · regra_comissao · moderacao_vendedor
                      marca · collab · endereco.latitude/longitude
   Por quê:
     · sem vendedor terceiro, o pedido vira N itens diretos (pedido -> pedido_item);
     · sem comissão, não há valor_repasse nem split de pagamento;
     · sem multi-marca, a marca É a loja (não é dado, é identidade do sistema);
     · sem filtro por distância, latitude/longitude perde a função.
   O que passou a existir (e que loja única realmente precisa):
     · tecido         -> a gramatura deixa de ser coluna do produto (ver 3FN no módulo 3)
     · colecao        -> N:N com produto (uma peça entra em "Verão" e em "Promo")
     · status_publicacao + aprovacao_produto -> fluxo interno: operador cria, gerente publica
     · envio 1:1 com pedido (uma loja, um despacho por pedido)

   CONVENÇÕES
   -------------------------------------------------------------------------------------
   1. Domínio fechado e sem atributos próprios -> ENUM (ex.: usuario.status).
      Domínio gerenciável ou com atributos -> tabela de referência (cor.hex, tamanho.ordem).
   2. NADA derivado é gravado em tabela base: média de avaliação, estoque total do produto
      e receita por mês são VIEWs.
   3. Exceção justificada: SNAPSHOTS transacionais (pedido_item.preco_unitario e os totais
      do pedido). Não é redundância: é fato histórico imutável. Preço de tabela muda, a
      venda de ontem não.
   4. Nenhuma coluna polimórfica (entidade_tipo + entidade_id): a auditoria de estoque usa
      log_auditoria com payload antes/depois, preservando integridade referencial.
   5. Toda tabela tem PK; toda relação N:N tem pivô com PK composta; todo 1:N tem FK + índice.
   ===================================================================================== */

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS log_auditoria;
DROP TABLE IF EXISTS aprovacao_produto;
DROP TABLE IF EXISTS configuracao;
DROP TABLE IF EXISTS pagamento_evento;
DROP TABLE IF EXISTS pagamento;
DROP TABLE IF EXISTS metodo_pagamento;
DROP TABLE IF EXISTS avaliacao;
DROP TABLE IF EXISTS cupom_uso;
DROP TABLE IF EXISTS pedido_status_historico;
DROP TABLE IF EXISTS envio;
DROP TABLE IF EXISTS pedido_item;
DROP TABLE IF EXISTS pedido;
DROP TABLE IF EXISTS cupom;
DROP TABLE IF EXISTS status_envio;
DROP TABLE IF EXISTS status_pedido;
DROP TABLE IF EXISTS carrinho_item;
DROP TABLE IF EXISTS carrinho;
DROP TABLE IF EXISTS favorito;
DROP TABLE IF EXISTS produto_colecao;
DROP TABLE IF EXISTS produto_tag;
DROP TABLE IF EXISTS tag;
DROP TABLE IF EXISTS produto_imagem;
DROP TABLE IF EXISTS produto_variante;
DROP TABLE IF EXISTS produto;
DROP TABLE IF EXISTS status_publicacao;
DROP TABLE IF EXISTS tecido;
DROP TABLE IF EXISTS tamanho;
DROP TABLE IF EXISTS cor;
DROP TABLE IF EXISTS publico_alvo;
DROP TABLE IF EXISTS estilo_caimento;
DROP TABLE IF EXISTS condicao_produto;
DROP TABLE IF EXISTS colecao;
DROP TABLE IF EXISTS categoria;
DROP TABLE IF EXISTS endereco;
DROP TABLE IF EXISTS sessao;
DROP TABLE IF EXISTS usuario_papel;
DROP TABLE IF EXISTS usuario;
DROP TABLE IF EXISTS papel_permissao;
DROP TABLE IF EXISTS permissao;
DROP TABLE IF EXISTS papel;

/* =====================================================================================
   MÓDULO 1 — IDENTIDADE, PERMISSÕES E OS 4 NÍVEIS DE ACESSO
   Nível 2 deixou de ser "Vendedor terceiro" e passou a ser "Operador de Loja":
   o funcionário que cadastra produto, mexe em estoque e atualiza envio.
   ===================================================================================== */

CREATE TABLE papel (
  id        TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo    VARCHAR(30)      NOT NULL COMMENT 'cliente | operador | gerente | proprietario',
  nome      VARCHAR(60)      NOT NULL,
  nivel     TINYINT UNSIGNED NOT NULL COMMENT '1=Cliente 2=Operador 3=Gerente 4=Proprietario',
  descricao VARCHAR(255)     NULL,
  criado_em TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_papel_codigo (codigo),
  UNIQUE KEY uq_papel_nivel (nivel),
  CONSTRAINT ck_papel_nivel CHECK (nivel BETWEEN 1 AND 4)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE permissao (
  id        SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo    VARCHAR(80)       NOT NULL COMMENT 'ex.: produto.criar, preco.atualizar, log.ler',
  recurso   VARCHAR(40)       NOT NULL,
  acao      VARCHAR(30)       NOT NULL COMMENT 'ler | criar | atualizar | excluir | publicar | aprovar',
  descricao VARCHAR(200)      NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_permissao_codigo (codigo),
  UNIQUE KEY uq_permissao_recurso_acao (recurso, acao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/* PIVÔ 1 — papel x permissão. */
CREATE TABLE papel_permissao (
  papel_id     TINYINT UNSIGNED  NOT NULL,
  permissao_id SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (papel_id, permissao_id),
  KEY idx_papelpermissao_permissao (permissao_id),
  CONSTRAINT fk_papelpermissao_papel     FOREIGN KEY (papel_id)     REFERENCES papel (id)     ON DELETE CASCADE,
  CONSTRAINT fk_papelpermissao_permissao FOREIGN KEY (permissao_id) REFERENCES permissao (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE usuario (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome                VARCHAR(120)    NOT NULL,
  email               VARCHAR(160)    NOT NULL,
  senha_hash          VARCHAR(255)    NOT NULL COMMENT 'Argon2id (preferencial) ou bcrypt cost>=12',
  cpf                 CHAR(11)        NULL COMMENT 'somente dígitos; LGPD: cifrar em repouso na aplicação',
  telefone            VARCHAR(20)     NULL,
  data_nascimento     DATE            NULL,
  status              ENUM('pendente','ativo','bloqueado','inativo') NOT NULL DEFAULT 'pendente',
  aceite_lgpd_em      DATETIME        NULL COMMENT 'prova de consentimento (LGPD)',
  email_verificado_em DATETIME        NULL,
  ultimo_login_em     DATETIME        NULL,
  criado_em           TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuario_email (email),
  UNIQUE KEY uq_usuario_cpf (cpf),
  KEY idx_usuario_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/* PIVÔ 2 — usuário x papel. Mantido N:N porque um funcionário da loja também compra. */
CREATE TABLE usuario_papel (
  usuario_id    BIGINT UNSIGNED  NOT NULL,
  papel_id      TINYINT UNSIGNED NOT NULL,
  concedido_por BIGINT UNSIGNED  NULL COMMENT 'gerente/proprietário que concedeu nível 3 ou 4',
  concedido_em  TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (usuario_id, papel_id),
  KEY idx_usuariopapel_papel (papel_id),
  KEY idx_usuariopapel_concedente (concedido_por),
  CONSTRAINT fk_usuariopapel_usuario    FOREIGN KEY (usuario_id)    REFERENCES usuario (id) ON DELETE CASCADE,
  CONSTRAINT fk_usuariopapel_papel      FOREIGN KEY (papel_id)      REFERENCES papel (id)   ON DELETE RESTRICT,
  CONSTRAINT fk_usuariopapel_concedente FOREIGN KEY (concedido_por) REFERENCES usuario (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE sessao (
  id          CHAR(36)        NOT NULL,
  usuario_id  BIGINT UNSIGNED NOT NULL,
  token_hash  CHAR(64)        NOT NULL COMMENT 'SHA-256 do token; o cookie carrega só o token opaco',
  ip          VARCHAR(45)     NULL,
  user_agent  VARCHAR(255)    NULL,
  expira_em   DATETIME        NOT NULL,
  revogada_em DATETIME        NULL,
  criado_em   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sessao_token (token_hash),
  KEY idx_sessao_usuario (usuario_id, expira_em),
  CONSTRAINT fk_sessao_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/* =====================================================================================
   MÓDULO 2 — ENDEREÇO DE ENTREGA
   Sem latitude/longitude: não existe mais filtro por distância de vendedor.
   CEP/cidade/UF continuam essenciais para calcular frete e prazo.
   ===================================================================================== */

CREATE TABLE endereco (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id    BIGINT UNSIGNED NOT NULL,
  apelido       VARCHAR(40)     NULL COMMENT 'Casa, Trabalho, Academia...',
  destinatario  VARCHAR(120)    NOT NULL,
  cep           CHAR(8)         NOT NULL,
  logradouro    VARCHAR(160)    NOT NULL,
  numero        VARCHAR(20)     NOT NULL,
  complemento   VARCHAR(80)     NULL,
  bairro        VARCHAR(80)     NOT NULL,
  cidade        VARCHAR(80)     NOT NULL,
  uf            CHAR(2)         NOT NULL,
  pais          CHAR(2)         NOT NULL DEFAULT 'BR',
  principal     TINYINT(1)      NOT NULL DEFAULT 0,
  criado_em     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_endereco_usuario (usuario_id),
  KEY idx_endereco_cep (cep),
  KEY idx_endereco_cidade_uf (cidade, uf),
  CONSTRAINT fk_endereco_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/* =====================================================================================
   MÓDULO 3 — CATÁLOGO BASE (os filtros da sidebar saem daqui)
   ===================================================================================== */

/* Categoria auto-referenciada: Camisetas > Oversized. */
CREATE TABLE categoria (
  id               BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  categoria_pai_id BIGINT UNSIGNED   NULL,
  nome             VARCHAR(80)       NOT NULL,
  slug             VARCHAR(90)       NOT NULL,
  ordem            SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  ativo            TINYINT(1)        NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categoria_slug (slug),
  KEY idx_categoria_pai (categoria_pai_id),
  CONSTRAINT fk_categoria_pai FOREIGN KEY (categoria_pai_id) REFERENCES categoria (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/* Linha/coleção: "Essencial", "Drop Inverno", "Linha Neon". Relação N:N com produto (pivô). */
CREATE TABLE colecao (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome       VARCHAR(120)    NOT NULL,
  slug       VARCHAR(140)    NOT NULL,
  descricao  TEXT            NULL,
  lancada_em DATE            NULL,
  destaque   TINYINT(1)      NOT NULL DEFAULT 0,
  ativa      TINYINT(1)      NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_colecao_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE condicao_produto (
  id     TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(20)      NOT NULL COMMENT 'novo | drop_antigo',
  nome   VARCHAR(40)      NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_condicao_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE estilo_caimento (
  id        TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo    VARCHAR(20)      NOT NULL COMMENT 'oversized | slim | regular | boxy | cropped | baggy',
  nome      VARCHAR(40)      NOT NULL,
  descricao VARCHAR(160)     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_caimento_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE publico_alvo (
  id   TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome VARCHAR(30)      NOT NULL COMMENT 'Masculino | Feminino | Unissex',
  PRIMARY KEY (id),
  UNIQUE KEY uq_publico_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/* familia_cor agrupa tons para o filtro (ex.: "Off-white" cai em "Off-white", "Grafite" em "Cinza"). */
CREATE TABLE cor (
  id          SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome        VARCHAR(40)       NOT NULL,
  hex         CHAR(7)           NOT NULL COMMENT '#RRGGBB usado no swatch do filtro',
  familia_cor VARCHAR(30)       NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cor_nome (nome),
  CONSTRAINT ck_cor_hex CHECK (CHAR_LENGTH(hex) = 7 AND LEFT(hex, 1) = '#')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/* tipo_grade separa letra (P..XG) de número (36..44) e de peça única. */
CREATE TABLE tamanho (
  id         SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sigla      VARCHAR(6)        NOT NULL COMMENT 'PP, P, M, G, GG, XG, 38, 40...',
  tipo_grade ENUM('letra','numero','unico') NOT NULL DEFAULT 'letra',
  ordem      SMALLINT UNSIGNED NOT NULL COMMENT 'ordenação de grade, não alfabética',
  PRIMARY KEY (id),
  UNIQUE KEY uq_tamanho_sigla_grade (sigla, tipo_grade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/* TECIDO — decisão de 3FN importante:
   a gramatura é propriedade DO TECIDO ("Algodão pesado" é 240 g/m²), não do produto.
   Se produto guardasse gramatura_id E tecido_id, existiria dependência transitiva
   (produto -> tecido -> gramatura), violando a 3FN. Por isso a gramatura mora aqui. */
CREATE TABLE tecido (
  id               SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome             VARCHAR(80)       NOT NULL COMMENT 'Algodão Pesado, Moletom Flanelado, Sarja Ripstop...',
  composicao       VARCHAR(160)      NOT NULL COMMENT 'ex.: 100% Algodão penteado',
  gramatura_gm2    SMALLINT UNSIGNED NULL COMMENT 'g/m²; NULL para tecidos sem gramatura relevante',
  protecao_uv      TINYINT(1)        NOT NULL DEFAULT 0,
  secagem_rapida   TINYINT(1)        NOT NULL DEFAULT 0,
  elasticidade     ENUM('nenhuma','leve','media','alta') NOT NULL DEFAULT 'nenhuma',
  cuidado_lavagem  VARCHAR(200)      NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tecido_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/* =====================================================================================
   MÓDULO 4 — PRODUTO, SKU, IMAGEM, TAGS E COLEÇÕES
   ===================================================================================== */

/* Fluxo interno de publicação: operador cria (rascunho/em_analise), gerente publica. */
CREATE TABLE status_publicacao (
  id     TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(20)      NOT NULL COMMENT 'rascunho | em_analise | publicado | reprovado | arquivado',
  nome   VARCHAR(40)      NOT NULL,
  ordem  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_statuspublicacao_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE produto (
  id                  BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  categoria_id        BIGINT UNSIGNED  NOT NULL,
  tecido_id           SMALLINT UNSIGNED NOT NULL,
  condicao_id         TINYINT UNSIGNED NOT NULL,
  estilo_caimento_id  TINYINT UNSIGNED NOT NULL,
  publico_alvo_id     TINYINT UNSIGNED NOT NULL,
  status_publicacao_id TINYINT UNSIGNED NOT NULL DEFAULT 1,
  titulo              VARCHAR(160)     NOT NULL,
  slug                VARCHAR(180)     NOT NULL,
  descricao           TEXT             NOT NULL,
  preco_base          DECIMAL(10,2)    NOT NULL COMMENT 'preço de tabela; a variante pode ter ajuste',
  preco_promocional   DECIMAL(10,2)    NULL COMMENT 'se preenchido, é o preço praticado (deve ser menor)',
  peso_gramas         INT UNSIGNED     NULL COMMENT 'peso embalado, usado no cálculo de frete',
  altura_cm           SMALLINT UNSIGNED NULL,
  largura_cm          SMALLINT UNSIGNED NULL,
  comprimento_cm      SMALLINT UNSIGNED NULL,
  destaque            TINYINT(1)       NOT NULL DEFAULT 0,
  ativo               TINYINT(1)       NOT NULL DEFAULT 1,
  criado_em           TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_produto_slug (slug),
  KEY idx_produto_categoria (categoria_id, ativo),
  KEY idx_produto_tecido (tecido_id),
  KEY idx_produto_filtros (condicao_id, estilo_caimento_id, preco_base),
  KEY idx_produto_publicacao (status_publicacao_id),
  CONSTRAINT fk_produto_categoria FOREIGN KEY (categoria_id)         REFERENCES categoria (id)         ON DELETE RESTRICT,
  CONSTRAINT fk_produto_tecido   FOREIGN KEY (tecido_id)            REFERENCES tecido (id)            ON DELETE RESTRICT,
  CONSTRAINT fk_produto_condicao FOREIGN KEY (condicao_id)          REFERENCES condicao_produto (id)  ON DELETE RESTRICT,
  CONSTRAINT fk_produto_caimento FOREIGN KEY (estilo_caimento_id)   REFERENCES estilo_caimento (id)   ON DELETE RESTRICT,
  CONSTRAINT fk_produto_publico  FOREIGN KEY (publico_alvo_id)      REFERENCES publico_alvo (id)      ON DELETE RESTRICT,
  CONSTRAINT fk_produto_status   FOREIGN KEY (status_publicacao_id) REFERENCES status_publicacao (id) ON DELETE RESTRICT,
  CONSTRAINT ck_produto_preco CHECK (preco_base > 0),
  CONSTRAINT ck_produto_promocao CHECK (preco_promocional IS NULL OR (preco_promocional > 0 AND preco_promocional < preco_base))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/* SKU vendável = produto + cor + tamanho. ÚNICO lugar com estoque.
   Preço final = COALESCE(preco_promocional, preco_base) + preco_ajuste. */
CREATE TABLE produto_variante (
  id                BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  produto_id        BIGINT UNSIGNED   NOT NULL,
  cor_id            SMALLINT UNSIGNED NOT NULL,
  tamanho_id        SMALLINT UNSIGNED NOT NULL,
  sku               VARCHAR(60)       NOT NULL,
  preco_ajuste      DECIMAL(10,2)     NOT NULL DEFAULT 0.00 COMMENT 'ex.: +10 em tamanhos GG/XG',
  estoque           INT               NOT NULL DEFAULT 0,
  estoque_reservado INT               NOT NULL DEFAULT 0 COMMENT 'itens em carrinho/checkout pendente',
  ativo             TINYINT(1)        NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_variante_sku (sku),
  UNIQUE KEY uq_variante_combinacao (produto_id, cor_id, tamanho_id),
  KEY idx_variante_cor (cor_id),
  KEY idx_variante_tamanho (tamanho_id),
  KEY idx_variante_estoque (estoque),
  CONSTRAINT fk_variante_produto FOREIGN KEY (produto_id) REFERENCES produto (id) ON DELETE CASCADE,
  CONSTRAINT fk_variante_cor     FOREIGN KEY (cor_id)     REFERENCES cor (id)     ON DELETE RESTRICT,
  CONSTRAINT fk_variante_tamanho FOREIGN KEY (tamanho_id) REFERENCES tamanho (id) ON DELETE RESTRICT,
  CONSTRAINT ck_variante_estoque CHECK (estoque >= 0 AND estoque_reservado >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE produto_imagem (
  id         BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  produto_id BIGINT UNSIGNED   NOT NULL,
  url        VARCHAR(255)      NOT NULL,
  texto_alt  VARCHAR(180)      NOT NULL COMMENT 'acessibilidade + SEO',
  ordem      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  principal  TINYINT(1)        NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_imagem_produto (produto_id, ordem),
  CONSTRAINT fk_imagem_produto FOREIGN KEY (produto_id) REFERENCES produto (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE tag (
  id   SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome VARCHAR(40)       NOT NULL,
  slug VARCHAR(50)       NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tag_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/* PIVÔ 3 — produto x tag. */
CREATE TABLE produto_tag (
  produto_id BIGINT UNSIGNED   NOT NULL,
  tag_id     SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (produto_id, tag_id),
  KEY idx_produtotag_tag (tag_id),
  CONSTRAINT fk_produtotag_produto FOREIGN KEY (produto_id) REFERENCES produto (id) ON DELETE CASCADE,
  CONSTRAINT fk_produtotag_tag     FOREIGN KEY (tag_id)     REFERENCES tag (id)     ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/* PIVÔ 4 — produto x coleção: a mesma peça entra em "Verão" e em "Promo". */
CREATE TABLE produto_colecao (
  produto_id BIGINT UNSIGNED NOT NULL,
  colecao_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (produto_id, colecao_id),
  KEY idx_produtocolecao_colecao (colecao_id),
  CONSTRAINT fk_produtocolecao_produto FOREIGN KEY (produto_id) REFERENCES produto (id) ON DELETE CASCADE,
  CONSTRAINT fk_produtocolecao_colecao FOREIGN KEY (colecao_id) REFERENCES colecao (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/* PIVÔ 5 — lista de desejos. */
CREATE TABLE favorito (
  usuario_id BIGINT UNSIGNED NOT NULL,
  produto_id BIGINT UNSIGNED NOT NULL,
  criado_em  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (usuario_id, produto_id),
  KEY idx_favorito_produto (produto_id),
  CONSTRAINT fk_favorito_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE,
  CONSTRAINT fk_favorito_produto FOREIGN KEY (produto_id) REFERENCES produto (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/* =====================================================================================
   MÓDULO 5 — CARRINHO (logado ou visitante por token)
   Sem preço aqui de propósito: o valor é recalculado a partir de produto_variante,
   para o cliente nunca ver preço velho e o checkout nunca confiar no cliente.
   ===================================================================================== */

CREATE TABLE carrinho (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id    BIGINT UNSIGNED NULL COMMENT 'NULL => carrinho de visitante',
  sessao_token  CHAR(64)        NULL,
  cupom_id      BIGINT UNSIGNED NULL COMMENT 'FK adicionada no fim (cupom nasce no módulo 6)',
  status        ENUM('aberto','convertido','abandonado') NOT NULL DEFAULT 'aberto',
  criado_em     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_carrinho_usuario (usuario_id, status),
  KEY idx_carrinho_token (sessao_token),
  CONSTRAINT fk_carrinho_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE,
  CONSTRAINT ck_carrinho_dono CHECK (usuario_id IS NOT NULL OR sessao_token IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE carrinho_item (
  id          BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  carrinho_id BIGINT UNSIGNED   NOT NULL,
  variante_id BIGINT UNSIGNED   NOT NULL,
  quantidade  SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  criado_em   TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_carrinhoitem_variante (carrinho_id, variante_id),
  KEY idx_carrinhoitem_variante (variante_id),
  CONSTRAINT fk_carrinhoitem_carrinho FOREIGN KEY (carrinho_id) REFERENCES carrinho (id)         ON DELETE CASCADE,
  CONSTRAINT fk_carrinhoitem_variante FOREIGN KEY (variante_id) REFERENCES produto_variante (id) ON DELETE CASCADE,
  CONSTRAINT ck_carrinhoitem_qtd CHECK (quantidade BETWEEN 1 AND 99)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/* =====================================================================================
   MÓDULO 6 — PEDIDO (uma loja = um despacho; nenhum subpedido, nenhuma comissão)
   ===================================================================================== */

CREATE TABLE status_pedido (
  id     TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(30)      NOT NULL COMMENT 'aguardando_pagamento | pago | em_separacao | enviado | entregue | cancelado | reembolsado',
  nome   VARCHAR(60)      NOT NULL,
  ordem  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_statuspedido_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE status_envio (
  id     TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(30)      NOT NULL COMMENT 'aguardando_postagem | postado | em_transito | entregue | extraviado',
  nome   VARCHAR(60)      NOT NULL,
  ordem  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_statusenvio_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE cupom (
  id           BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  codigo       VARCHAR(40)      NOT NULL,
  tipo         ENUM('percentual','valor_fixo','frete_gratis') NOT NULL,
  valor        DECIMAL(10,2)    NOT NULL DEFAULT 0.00,
  valor_minimo DECIMAL(10,2)    NOT NULL DEFAULT 0.00,
  limite_uso   INT UNSIGNED     NULL COMMENT 'NULL = ilimitado; uso real = COUNT(cupom_uso)',
  inicio_em    DATETIME         NOT NULL,
  fim_em       DATETIME         NOT NULL,
  ativo        TINYINT(1)       NOT NULL DEFAULT 1,
  criado_por   BIGINT UNSIGNED  NULL,
  criado_em    TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cupom_codigo (codigo),
  KEY idx_cupom_vigencia (inicio_em, fim_em, ativo),
  CONSTRAINT fk_cupom_criador FOREIGN KEY (criado_por) REFERENCES usuario (id) ON DELETE SET NULL,
  CONSTRAINT ck_cupom_periodo CHECK (fim_em > inicio_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE carrinho
  ADD CONSTRAINT fk_carrinho_cupom FOREIGN KEY (cupom_id) REFERENCES cupom (id) ON DELETE SET NULL;

CREATE TABLE pedido (
  id                  BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  codigo              VARCHAR(20)      NOT NULL COMMENT 'código público (ex.: BSK-2026-000148)',
  comprador_id        BIGINT UNSIGNED  NOT NULL,
  endereco_entrega_id BIGINT UNSIGNED  NOT NULL COMMENT 'endereço CONGELADO da entrega',
  cupom_id            BIGINT UNSIGNED  NULL,
  status_pedido_id    TINYINT UNSIGNED NOT NULL,
  subtotal            DECIMAL(10,2)    NOT NULL DEFAULT 0.00 COMMENT 'mantido por trigger a partir dos itens',
  valor_frete         DECIMAL(10,2)    NOT NULL DEFAULT 0.00,
  valor_desconto      DECIMAL(10,2)    NOT NULL DEFAULT 0.00,
  valor_total         DECIMAL(10,2)    NOT NULL DEFAULT 0.00,
  observacoes         VARCHAR(255)     NULL,
  criado_em           TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pedido_codigo (codigo),
  KEY idx_pedido_comprador (comprador_id, criado_em),
  KEY idx_pedido_status (status_pedido_id, criado_em),
  KEY idx_pedido_cupom (cupom_id),
  KEY idx_pedido_endereco (endereco_entrega_id),
  CONSTRAINT fk_pedido_comprador FOREIGN KEY (comprador_id)        REFERENCES usuario (id)       ON DELETE RESTRICT,
  CONSTRAINT fk_pedido_endereco  FOREIGN KEY (endereco_entrega_id) REFERENCES endereco (id)      ON DELETE RESTRICT,
  CONSTRAINT fk_pedido_cupom     FOREIGN KEY (cupom_id)            REFERENCES cupom (id)         ON DELETE SET NULL,
  CONSTRAINT fk_pedido_status    FOREIGN KEY (status_pedido_id)    REFERENCES status_pedido (id) ON DELETE RESTRICT,
  CONSTRAINT ck_pedido_totais CHECK (subtotal >= 0 AND valor_frete >= 0 AND valor_desconto >= 0 AND valor_total >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/* Item do pedido: snapshot do preço + rastro de qual tecido/cor/tamanho saiu. */
CREATE TABLE pedido_item (
  id               BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  pedido_id        BIGINT UNSIGNED   NOT NULL,
  variante_id      BIGINT UNSIGNED   NOT NULL,
  quantidade       SMALLINT UNSIGNED NOT NULL,
  preco_unitario   DECIMAL(10,2)     NOT NULL COMMENT 'SNAPSHOT do preço praticado na venda',
  valor_total_item DECIMAL(10,2)     NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pedidoitem_variante (pedido_id, variante_id),
  KEY idx_pedidoitem_variante (variante_id),
  CONSTRAINT fk_pedidoitem_pedido   FOREIGN KEY (pedido_id)   REFERENCES pedido (id)           ON DELETE CASCADE,
  CONSTRAINT fk_pedidoitem_variante FOREIGN KEY (variante_id) REFERENCES produto_variante (id) ON DELETE RESTRICT,
  CONSTRAINT ck_pedidoitem_qtd CHECK (quantidade > 0),
  CONSTRAINT ck_pedidoitem_valor CHECK (valor_total_item = preco_unitario * quantidade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/* 1:1 com pedido — uma loja, um despacho. */
CREATE TABLE envio (
  id              BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  pedido_id       BIGINT UNSIGNED   NOT NULL,
  status_envio_id TINYINT UNSIGNED  NOT NULL,
  transportadora  VARCHAR(60)       NOT NULL,
  servico         VARCHAR(60)       NULL COMMENT 'PAC, SEDEX, transportadora própria...',
  codigo_rastreio VARCHAR(60)       NULL,
  valor_frete     DECIMAL(10,2)     NOT NULL DEFAULT 0.00,
  prazo_dias      SMALLINT UNSIGNED NULL,
  postado_em      DATETIME          NULL,
  entregue_em     DATETIME          NULL,
  atualizado_em   TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_envio_pedido (pedido_id),
  KEY idx_envio_rastreio (codigo_rastreio),
  KEY idx_envio_status (status_envio_id),
  CONSTRAINT fk_envio_pedido FOREIGN KEY (pedido_id)       REFERENCES pedido (id)       ON DELETE CASCADE,
  CONSTRAINT fk_envio_status FOREIGN KEY (status_envio_id) REFERENCES status_envio (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE pedido_status_historico (
  id               BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  pedido_id        BIGINT UNSIGNED  NOT NULL,
  status_pedido_id TINYINT UNSIGNED NOT NULL,
  usuario_id       BIGINT UNSIGNED  NULL COMMENT 'quem mudou (NULL = webhook do gateway)',
  observacao       VARCHAR(255)     NULL,
  criado_em        TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_historico_pedido (pedido_id, criado_em),
  KEY idx_historico_status (status_pedido_id),
  KEY idx_historico_usuario (usuario_id),
  CONSTRAINT fk_historico_pedido FOREIGN KEY (pedido_id)        REFERENCES pedido (id)        ON DELETE CASCADE,
  CONSTRAINT fk_historico_status FOREIGN KEY (status_pedido_id) REFERENCES status_pedido (id) ON DELETE RESTRICT,
  CONSTRAINT fk_historico_usuario FOREIGN KEY (usuario_id)      REFERENCES usuario (id)       ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE cupom_uso (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cupom_id       BIGINT UNSIGNED NOT NULL,
  pedido_id      BIGINT UNSIGNED NOT NULL,
  usuario_id     BIGINT UNSIGNED NOT NULL,
  valor_desconto DECIMAL(10,2)   NOT NULL,
  criado_em      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cupomuso_pedido (pedido_id),
  UNIQUE KEY uq_cupomuso_cupom_usuario_pedido (cupom_id, usuario_id, pedido_id),
  KEY idx_cupomuso_cupom (cupom_id),
  KEY idx_cupomuso_usuario (usuario_id),
  CONSTRAINT fk_cupomuso_cupom   FOREIGN KEY (cupom_id)   REFERENCES cupom (id)   ON DELETE RESTRICT,
  CONSTRAINT fk_cupomuso_pedido  FOREIGN KEY (pedido_id)  REFERENCES pedido (id)  ON DELETE CASCADE,
  CONSTRAINT fk_cupomuso_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/* Avaliação: só quem comprou avalia, e só uma vez por item.
   Fica aqui (e não no módulo 4) porque depende de pedido_item. */
CREATE TABLE avaliacao (
  id             BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  produto_id     BIGINT UNSIGNED  NOT NULL,
  usuario_id     BIGINT UNSIGNED  NOT NULL,
  pedido_item_id BIGINT UNSIGNED  NOT NULL COMMENT 'amarra a avaliação a uma compra real',
  nota           TINYINT UNSIGNED NOT NULL,
  titulo         VARCHAR(120)     NULL,
  comentario     TEXT             NULL,
  status         ENUM('pendente','publicada','removida') NOT NULL DEFAULT 'pendente',
  resposta_loja  TEXT             NULL COMMENT 'a loja pode responder publicamente',
  criado_em      TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_avaliacao_item (pedido_item_id),
  KEY idx_avaliacao_produto (produto_id, status),
  KEY idx_avaliacao_usuario (usuario_id),
  CONSTRAINT fk_avaliacao_produto     FOREIGN KEY (produto_id)     REFERENCES produto (id)     ON DELETE CASCADE,
  CONSTRAINT fk_avaliacao_usuario     FOREIGN KEY (usuario_id)     REFERENCES usuario (id)     ON DELETE CASCADE,
  CONSTRAINT fk_avaliacao_pedido_item FOREIGN KEY (pedido_item_id) REFERENCES pedido_item (id) ON DELETE CASCADE,
  CONSTRAINT ck_avaliacao_nota CHECK (nota BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/* =====================================================================================
   MÓDULO 7 — PAGAMENTO (Mercado Pago: Pix e cartão de crédito)
   ===================================================================================== */

CREATE TABLE metodo_pagamento (
  id     TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(20)      NOT NULL COMMENT 'pix | credito | boleto',
  nome   VARCHAR(40)      NOT NULL,
  ativo  TINYINT(1)       NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_metodopag_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE pagamento (
  id                    BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  pedido_id             BIGINT UNSIGNED  NOT NULL,
  metodo_id             TINYINT UNSIGNED NOT NULL,
  gateway               VARCHAR(30)      NOT NULL DEFAULT 'mercadopago',
  gateway_preference_id VARCHAR(80)      NULL COMMENT 'id da preference (Checkout Pro)',
  gateway_payment_id    VARCHAR(80)      NULL COMMENT 'id do payment devolvido pelo MP',
  status                ENUM('criado','pendente','em_processamento','aprovado','recusado','estornado','cancelado','chargeback') NOT NULL DEFAULT 'criado',
  valor                 DECIMAL(10,2)    NOT NULL,
  parcelas              TINYINT UNSIGNED NOT NULL DEFAULT 1,
  bandeira              VARCHAR(30)      NULL,
  ultimos_digitos       CHAR(4)          NULL COMMENT 'NUNCA armazenar o PAN completo (PCI-DSS)',
  pix_qr_code           TEXT             NULL,
  pix_copia_e_cola      TEXT             NULL,
  pix_expira_em         DATETIME         NULL,
  aprovado_em           DATETIME         NULL,
  criado_em             TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em         TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pagamento_gateway_id (gateway, gateway_payment_id),
  KEY idx_pagamento_pedido (pedido_id, status),
  KEY idx_pagamento_metodo (metodo_id),
  CONSTRAINT fk_pagamento_pedido FOREIGN KEY (pedido_id) REFERENCES pedido (id)           ON DELETE CASCADE,
  CONSTRAINT fk_pagamento_metodo FOREIGN KEY (metodo_id) REFERENCES metodo_pagamento (id) ON DELETE RESTRICT,
  CONSTRAINT ck_pagamento_valor CHECK (valor > 0),
  CONSTRAINT ck_pagamento_parcelas CHECK (parcelas BETWEEN 1 AND 12)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/* Trilha bruta dos webhooks: idempotência e prova em disputa/chargeback. */
CREATE TABLE pagamento_evento (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  pagamento_id  BIGINT UNSIGNED NULL COMMENT 'NULL quando o webhook chega antes do pagamento existir',
  tipo_evento   VARCHAR(60)     NOT NULL COMMENT 'payment.created, payment.updated...',
  gateway_ref   VARCHAR(80)     NULL,
  payload_json  JSON            NOT NULL,
  assinatura_ok TINYINT(1)      NOT NULL DEFAULT 0,
  recebido_em   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pagevento_pagamento (pagamento_id),
  KEY idx_pagevento_tipo (tipo_evento, recebido_em),
  KEY idx_pagevento_ref (gateway_ref),
  CONSTRAINT fk_pagevento_pagamento FOREIGN KEY (pagamento_id) REFERENCES pagamento (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/* =====================================================================================
   MÓDULO 8 — GOVERNANÇA: configuração, aprovação interna de produto e auditoria
   ===================================================================================== */

CREATE TABLE configuracao (
  chave          VARCHAR(60)     NOT NULL,
  valor          TEXT            NOT NULL,
  tipo           ENUM('texto','inteiro','decimal','booleano','json') NOT NULL DEFAULT 'texto',
  grupo          VARCHAR(40)     NOT NULL DEFAULT 'geral' COMMENT 'faturamento | frete | seguranca | geral',
  descricao      VARCHAR(200)    NULL,
  atualizado_por BIGINT UNSIGNED NULL,
  atualizado_em  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (chave),
  KEY idx_config_grupo (grupo),
  CONSTRAINT fk_config_usuario FOREIGN KEY (atualizado_por) REFERENCES usuario (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/* Equivalente interno do que era "moderação": o gerente aprova/reprova a publicação
   de um produto criado pelo operador. Preserva o rastro de quem autorizou o quê. */
CREATE TABLE aprovacao_produto (
  id           BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  produto_id   BIGINT UNSIGNED  NOT NULL,
  gerente_id   BIGINT UNSIGNED  NOT NULL,
  decisao_id   TINYINT UNSIGNED NOT NULL COMMENT 'status_publicacao aplicado',
  motivo       VARCHAR(255)     NOT NULL,
  criado_em    TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_aprovacao_produto (produto_id, criado_em),
  KEY idx_aprovacao_gerente (gerente_id),
  CONSTRAINT fk_aprovacao_produto FOREIGN KEY (produto_id) REFERENCES produto (id)            ON DELETE CASCADE,
  CONSTRAINT fk_aprovacao_gerente FOREIGN KEY (gerente_id) REFERENCES usuario (id)            ON DELETE RESTRICT,
  CONSTRAINT fk_aprovacao_decisao FOREIGN KEY (decisao_id) REFERENCES status_publicacao (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/* Auditoria: quem fez o quê, quando, de onde, com o antes/depois em JSON.
   É também o registro das movimentações de estoque (entrada, ajuste, perda). */
CREATE TABLE log_auditoria (
  id                BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  usuario_id        BIGINT UNSIGNED  NULL COMMENT 'NULL = ação de sistema/webhook',
  papel_contexto_id TINYINT UNSIGNED NULL COMMENT 'papel ativo no momento da ação',
  acao              VARCHAR(60)      NOT NULL COMMENT 'login, produto.publicar, estoque.movimentar, pedido.status.alterar...',
  entidade          VARCHAR(40)      NOT NULL,
  entidade_id       VARCHAR(40)      NULL,
  ip                VARCHAR(45)      NULL,
  user_agent        VARCHAR(255)     NULL,
  payload_json      JSON             NULL COMMENT 'antes/depois da alteração',
  criado_em         TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_log_usuario (usuario_id, criado_em),
  KEY idx_log_acao (acao, criado_em),
  KEY idx_log_entidade (entidade, entidade_id),
  CONSTRAINT fk_log_usuario FOREIGN KEY (usuario_id)        REFERENCES usuario (id) ON DELETE SET NULL,
  CONSTRAINT fk_log_papel   FOREIGN KEY (papel_contexto_id) REFERENCES papel (id)   ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS = 1;

/* =====================================================================================
   GATILHOS
   ===================================================================================== */

DELIMITER $$

/* 1) Baixa de estoque ATÔMICA. O UPDATE condicional pega o lock da linha e reavalia a
      condição sob o lock: duas compras simultâneas da última peça não passam as duas. */
CREATE TRIGGER trg_pedido_item_ai_baixa_estoque
AFTER INSERT ON pedido_item
FOR EACH ROW
BEGIN
  UPDATE produto_variante
     SET estoque           = estoque - NEW.quantidade,
         estoque_reservado = GREATEST(estoque_reservado - NEW.quantidade, 0)
   WHERE id = NEW.variante_id
     AND estoque >= NEW.quantidade;

  IF ROW_COUNT() = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Estoque insuficiente para a variante informada.';
  END IF;
END$$

/* 2) Totais do pedido recalculados a partir dos itens: o back-end não pode "esquecer"
      de somar, e nenhum total chega forjado do cliente. */
CREATE TRIGGER trg_pedido_item_ai_atualiza_totais
AFTER INSERT ON pedido_item
FOR EACH ROW
BEGIN
  UPDATE pedido
     SET subtotal    = (SELECT COALESCE(SUM(valor_total_item), 0)
                          FROM pedido_item WHERE pedido_id = NEW.pedido_id),
         valor_total = (SELECT COALESCE(SUM(valor_total_item), 0)
                          FROM pedido_item WHERE pedido_id = NEW.pedido_id)
                       - valor_desconto + valor_frete
   WHERE id = NEW.pedido_id;
END$$

DELIMITER ;

/* =====================================================================================
   VIEWS — nada derivado é gravado nas tabelas base
   ===================================================================================== */

/* Vitrine: preço praticado, estoque, nota média e a coleção (GROUP_CONCAT por ser N:N). */
CREATE OR REPLACE VIEW vw_catalogo AS
SELECT
  p.id                AS produto_id,
  p.titulo,
  p.slug,
  p.preco_base,
  p.preco_promocional,
  COALESCE(p.preco_promocional, p.preco_base) AS preco_vigente,
  cat.nome            AS categoria,
  cat.slug            AS categoria_slug,
  t.nome              AS tecido,
  t.composicao,
  t.gramatura_gm2,
  t.protecao_uv,
  t.secagem_rapida,
  ec.nome             AS caimento,
  cp.nome             AS condicao,
  pa.nome             AS publico,
  sp.codigo           AS status_publicacao,
  (SELECT GROUP_CONCAT(c2.nome ORDER BY c2.nome SEPARATOR ', ')
     FROM produto_colecao pc JOIN colecao c2 ON c2.id = pc.colecao_id
    WHERE pc.produto_id = p.id) AS colecoes,
  (SELECT MIN(pv.preco_ajuste) FROM produto_variante pv WHERE pv.produto_id = p.id AND pv.ativo = 1) AS menor_ajuste,
  (SELECT SUM(pv.estoque - pv.estoque_reservado) FROM produto_variante pv WHERE pv.produto_id = p.id AND pv.ativo = 1) AS estoque_disponivel,
  (SELECT ROUND(AVG(a.nota), 2) FROM avaliacao a WHERE a.produto_id = p.id AND a.status = 'publicada') AS nota_media,
  (SELECT COUNT(*) FROM avaliacao a WHERE a.produto_id = p.id AND a.status = 'publicada') AS total_avaliacoes,
  (SELECT pi.url FROM produto_imagem pi WHERE pi.produto_id = p.id AND pi.principal = 1 LIMIT 1) AS imagem_principal,
  p.destaque,
  p.criado_em
FROM produto p
JOIN categoria cat          ON cat.id = p.categoria_id
JOIN tecido t               ON t.id   = p.tecido_id
JOIN condicao_produto cp    ON cp.id  = p.condicao_id
JOIN estilo_caimento ec     ON ec.id  = p.estilo_caimento_id
JOIN publico_alvo pa        ON pa.id  = p.publico_alvo_id
JOIN status_publicacao sp   ON sp.id  = p.status_publicacao_id;
/* A filtragem por sp.codigo = 'publicado' é feita nas consultas da loja: a view mostra
   também rascunhos para o painel interno, sem duplicar lógica de visibilidade. */

/* Relatório do gerente: vendas por mês, ticket médio.
   ARMADILHA EVITADA — fan-out: juntar pedido com pedido_item e somar pe.subtotal
   multiplicaria o subtotal pelo número de itens do pedido. Por isso a contagem de peças
   vem de uma subconsulta agregada, mantendo 1 linha por pedido. */
CREATE OR REPLACE VIEW vw_vendas_por_mes AS
SELECT
  DATE_FORMAT(pe.criado_em, '%Y-%m')  AS competencia,
  COUNT(DISTINCT pe.id)               AS total_pedidos,
  COALESCE(SUM(it.pecas), 0)          AS pecas_vendidas,
  SUM(pe.subtotal)                    AS receita_produtos,
  SUM(pe.valor_frete)                 AS receita_frete,
  SUM(pe.valor_desconto)              AS total_descontos,
  SUM(pe.valor_total)                 AS faturamento,
  ROUND(AVG(pe.valor_total), 2)       AS ticket_medio
FROM pedido pe
JOIN status_pedido st ON st.id = pe.status_pedido_id
LEFT JOIN (
  SELECT pedido_id, SUM(quantidade) AS pecas
    FROM pedido_item GROUP BY pedido_id
) it ON it.pedido_id = pe.id
WHERE st.codigo IN ('pago','em_separacao','enviado','entregue')
GROUP BY DATE_FORMAT(pe.criado_em, '%Y-%m');

/* Ranking de produtos (o que repor primeiro). A nota média vem de subconsulta pelo mesmo
   motivo: um JOIN direto com avaliacao multiplicaria as linhas de pedido_item. */
CREATE OR REPLACE VIEW vw_produtos_mais_vendidos AS
SELECT
  pr.id            AS produto_id,
  pr.titulo,
  SUM(pi.quantidade)              AS pecas,
  SUM(pi.valor_total_item)        AS receita,
  (SELECT ROUND(AVG(a.nota), 2) FROM avaliacao a
    WHERE a.produto_id = pr.id AND a.status = 'publicada') AS nota_media
FROM pedido_item pi
JOIN produto_variante pv ON pv.id = pi.variante_id
JOIN produto pr          ON pr.id = pv.produto_id
JOIN pedido pe           ON pe.id = pi.pedido_id
JOIN status_pedido st    ON st.id = pe.status_pedido_id
WHERE st.codigo IN ('pago','em_separacao','enviado','entregue')
GROUP BY pr.id, pr.titulo;

/* Alerta de estoque: o que está acabando, na visão do operador. */
CREATE OR REPLACE VIEW vw_estoque_critico AS
SELECT
  pr.id AS produto_id, pr.titulo, pv.sku, cor.nome AS cor, tam.sigla AS tamanho,
  pv.estoque, pv.estoque_reservado, (pv.estoque - pv.estoque_reservado) AS disponivel
FROM produto_variante pv
JOIN produto pr     ON pr.id = pv.produto_id
JOIN cor            ON cor.id = pv.cor_id
JOIN tamanho tam    ON tam.id = pv.tamanho_id
WHERE pv.ativo = 1 AND (pv.estoque - pv.estoque_reservado) <= 5;
