/* =====================================================================================
   LOJA ÚNICA — database/seed.sql
   Carga das TABELAS DE DOMÍNIO + RBAC de 4 níveis + configurações da loja.
   Execute APÓS schema.sql. Nenhum produto/cliente fictício aqui.

   A MARCA NÃO É DADO NO BANCO, É IDENTIDADE DO SISTEMA.
   Troque o nome em 3 lugares:
     1) configuracao.loja_nome (abaixo)
     2) header e footer do web/index.html  (procure por "SUA MARCA")
     3) <title> e <meta name="description"> do web/index.html
   ===================================================================================== */
SET NAMES utf8mb4;

/* ---------- 1. OS 4 NÍVEIS ---------- */
INSERT INTO papel (id, codigo, nome, nivel, descricao) VALUES
  (1, 'cliente',      'Cliente Comprador', 1, 'Catálogo, carrinho, checkout, pedidos e dados próprios.'),
  (2, 'operador',     'Operador de Loja',  2, 'Cadastra produto, movimenta estoque e atualiza o envio dos pedidos.'),
  (3, 'gerente',      'Gerente',           3, 'Publica produtos, define preços/promoções/cupons, vê relatórios e modera avaliações.'),
  (4, 'proprietario', 'Proprietário',      4, 'Controle total: acessos, logs, faturamento e integrações de pagamento.');

/* ---------- 2. PERMISSÕES (33) ---------- */
INSERT INTO permissao (codigo, recurso, acao, descricao) VALUES
  /* nível 1 — cliente */
  ('catalogo.ler',              'catalogo',    'ler',       'Navegar o catálogo público'),
  ('carrinho.gerenciar',        'carrinho',    'atualizar', 'Adicionar, remover e alterar itens do carrinho'),
  ('pedido.criar',              'pedido',      'criar',     'Fechar pedido (checkout)'),
  ('pedido.ler.proprio',        'pedido',      'ler',       'Ver o próprio histórico de compras'),
  ('perfil.atualizar.proprio',  'perfil',      'atualizar', 'Editar dados cadastrais e endereços próprios'),
  /* nível 2 — operador de loja */
  ('produto.criar',             'produto',     'criar',     'Cadastrar produto (nasce como rascunho/em análise)'),
  ('produto.atualizar',         'produto',     'atualizar', 'Editar produto, variantes e imagens'),
  ('produto.enviar.aprovacao',  'produto',     'enviar',    'Enviar produto para o gerente publicar'),
  ('variante.gerenciar',        'variante',    'atualizar', 'Criar SKUs por cor e tamanho'),
  ('imagem.gerenciar',          'imagem',      'atualizar', 'Subir e ordenar imagens do produto'),
  ('estoque.movimentar',        'estoque',     'atualizar', 'Dar entrada, ajustar ou baixar estoque manualmente'),
  ('pedido.ler.todos',          'pedido',      'ler',       'Consultar pedidos de qualquer cliente'),
  ('pedido.status.atualizar',   'pedido',      'atualizar', 'Mover o pedido entre pago, em separação, enviado...'),
  ('envio.atualizar',           'envio',       'atualizar', 'Informar transportadora, rastreio e prazo'),
  ('cliente.ler',               'cliente',     'ler',       'Consultar dados de clientes (atendimento)'),
  /* nível 3 — gerente */
  ('produto.publicar',          'produto',     'publicar',  'Aprovar e publicar produto no catálogo'),
  ('produto.despublicar',       'produto',     'despublicar','Retirar produto da vitrine sem excluir'),
  ('produto.excluir',           'produto',     'excluir',   'Excluir produto definitivamente'),
  ('preco.atualizar',           'preco',       'atualizar', 'Alterar preço de tabela e preço promocional'),
  ('desconto.aplicar',          'desconto',    'criar',     'Criar promoções e descontos por coleção'),
  ('cupom.gerenciar',           'cupom',       'atualizar', 'Criar, ativar e desativar cupons'),
  ('avaliacao.moderar',         'avaliacao',   'aprovar',   'Publicar, remover ou responder avaliações'),
  ('relatorio.vendas.ler',      'relatorio',   'ler',       'Relatórios de vendas, ticket médio e ranking'),
  ('relatorio.estoque.ler',     'relatorio',   'ler',       'Relatório de estoque crítico e giro'),
  ('cliente.gerenciar',         'cliente',     'atualizar', 'Bloquear/desbloquear cliente e tratar LGPD'),
  /* nível 4 — proprietário */
  ('log.ler',                   'log',         'ler',       'Auditar logs de auditoria e acesso'),
  ('usuario.papel.gerenciar',   'usuario',     'atualizar', 'Conceder e revogar papéis, inclusive de gerentes'),
  ('usuario.criar',             'usuario',     'criar',     'Criar conta interna para funcionário'),
  ('configuracao.ler',          'configuracao','ler',       'Ler as configurações da loja'),
  ('configuracao.atualizar',    'configuracao','atualizar', 'Alterar configurações gerais'),
  ('faturamento.configurar',    'faturamento', 'atualizar', 'Configurar frete, impostos, nota fiscal e políticas'),
  ('gateway.configurar',        'gateway',     'atualizar', 'Configurar credenciais do Mercado Pago'),
  ('relatorio.financeiro.ler',  'relatorio',   'ler',       'Ver faturamento consolidado, estornos e margem');

/* ---------- 3. RBAC: papel x permissão ---------- */
/* Nível 1 — Cliente Comprador */
INSERT INTO papel_permissao (papel_id, permissao_id)
SELECT 1, id FROM permissao WHERE codigo IN (
  'catalogo.ler','carrinho.gerenciar','pedido.criar','pedido.ler.proprio','perfil.atualizar.proprio');

/* Nível 2 — Operador de Loja (herda o nível 1: quem trabalha na loja também compra) */
INSERT INTO papel_permissao (papel_id, permissao_id)
SELECT 2, id FROM permissao WHERE codigo IN (
  'catalogo.ler','carrinho.gerenciar','pedido.criar','pedido.ler.proprio','perfil.atualizar.proprio',
  'produto.criar','produto.atualizar','produto.enviar.aprovacao','variante.gerenciar','imagem.gerenciar',
  'estoque.movimentar','pedido.ler.todos','pedido.status.atualizar','envio.atualizar','cliente.ler');

/* Nível 3 — Gerente (tudo do operador + publicação, preço, cupom, relatórios e moderação) */
INSERT INTO papel_permissao (papel_id, permissao_id)
SELECT 3, id FROM permissao WHERE codigo IN (
  'catalogo.ler','carrinho.gerenciar','pedido.criar','pedido.ler.proprio','perfil.atualizar.proprio',
  'produto.criar','produto.atualizar','produto.enviar.aprovacao','variante.gerenciar','imagem.gerenciar',
  'estoque.movimentar','pedido.ler.todos','pedido.status.atualizar','envio.atualizar','cliente.ler',
  'produto.publicar','produto.despublicar','produto.excluir','preco.atualizar','desconto.aplicar',
  'cupom.gerenciar','avaliacao.moderar','relatorio.vendas.ler','relatorio.estoque.ler','cliente.gerenciar');

/* Nível 4 — Proprietário: TODAS as permissões */
INSERT INTO papel_permissao (papel_id, permissao_id)
SELECT 4, id FROM permissao;

/* ---------- 4. DOMÍNIOS DO CATÁLOGO ---------- */

INSERT INTO status_publicacao (id, codigo, nome, ordem) VALUES
  (1,'rascunho','Rascunho',1),
  (2,'em_analise','Em análise',2),
  (3,'publicado','Publicado',3),
  (4,'reprovado','Reprovado',4),
  (5,'arquivado','Arquivado',5);

INSERT INTO condicao_produto (id, codigo, nome) VALUES
  (1,'novo','Novo'), (2,'drop_antigo','Drop Antigo');

INSERT INTO estilo_caimento (id, codigo, nome, descricao) VALUES
  (1,'oversized','Oversized','Amplo, ombro caído, comprimento estendido.'),
  (2,'slim','Slim','Ajustado ao corpo, sem sobra no tronco.'),
  (3,'regular','Regular','Caimento tradicional, reto.'),
  (4,'boxy','Boxy','Tronco curto e largo, quadrado.'),
  (5,'cropped','Cropped','Comprimento encurtado na cintura.'),
  (6,'baggy','Baggy','Perna larga, cintura alta, sobra proposital no comprimento.');

INSERT INTO publico_alvo (id, nome) VALUES
  (1,'Masculino'), (2,'Feminino'), (3,'Unissex');

/* TECIDOS — a gramatura vive aqui (evita dependência transitiva no produto). */
INSERT INTO tecido (id, nome, composicao, gramatura_gm2, protecao_uv, secagem_rapida, elasticidade, cuidado_lavagem) VALUES
  (1,'Algodão Pesado','100% Algodão penteado',240,0,0,'nenhuma','Lavar do avesso em água fria; não usar alvejante.'),
  (2,'Moletom Flanelado','80% Algodão, 20% Poliéster',320,0,0,'leve','Lavar do avesso; secadora em temperatura baixa.'),
  (3,'Sarja Ripstop','94% Algodão, 6% Elastano',260,0,0,'media','Lavar à máquina no ciclo delicado.'),
  (4,'Denim Rígido','100% Algodão 14 oz',400,0,0,'nenhuma','Lavar do avesso, água fria; não usar secadora.'),
  (5,'Nylon Ripstop','100% Poliamida',120,1,1,'leve','Lavar à mão; não passar; não usar secadora.'),
  (6,'Tricoline Estampada','100% Algodão',150,0,0,'nenhuma','Lavar em água fria para preservar a serigrafia.'),
  (7,'Sarja Drill','100% Algodão sarja',300,0,0,'nenhuma','Lavar à mão para não deformar a aba.'),
  (8,'Algodão Canelado','100% Algodão penteado',180,0,0,'media','Lavar à mão ou em ciclo delicado para não abrir a canelura.');

INSERT INTO cor (nome, hex, familia_cor) VALUES
  ('Preto',           '#101010','Preto'),
  ('Grafite',         '#3f4145','Cinza'),
  ('Cinza Mescla',    '#b8b8b3','Cinza'),
  ('Off-white',       '#f2f0e9','Off-white'),
  ('Branco',          '#ffffff','Branco'),
  ('Verde Militar',   '#4b5340','Verde'),
  ('Verde Neon',      '#d8ff3e','Verde'),
  ('Azul Marinho',    '#1d2a44','Azul'),
  ('Azul Jeans',      '#4a6b8a','Azul'),
  ('Vinho',           '#6d1f2c','Vermelho'),
  ('Vermelho Fogo',   '#c0342a','Vermelho'),
  ('Marrom Cafe',     '#5a4032','Marrom'),
  ('Lilás',           '#8a6ea8','Roxo'),
  ('Bege Areia',      '#d9cdb8','Bege');

INSERT INTO tamanho (sigla, tipo_grade, ordem) VALUES
  ('PP','letra',1),('P','letra',2),('M','letra',3),('G','letra',4),('GG','letra',5),('XG','letra',6),('EXG','letra',7),
  ('36','numero',10),('38','numero',11),('40','numero',12),('42','numero',13),('44','numero',14),
  ('Unico','unico',20);

INSERT INTO categoria (id, categoria_pai_id, nome, slug, ordem) VALUES
  (1, NULL, 'Camisetas',   'camisetas',   1),
  (2, NULL, 'Moletons',    'moletons',    2),
  (3, NULL, 'Calças',      'calcas',      3),
  (4, NULL, 'Jaquetas',    'jaquetas',    4),
  (5, NULL, 'Bonés',       'bones',       5),
  (6, NULL, 'Acessórios',  'acessorios',  6),
  /* subcategorias */
  (7, 1,    'Oversized',   'camisetas-oversized',  1),
  (8, 1,    'Baby Look',   'camisetas-baby-look',  2),
  (9, 2,    'Hoodie',      'moletons-hoodie',      1),
  (10,2,    'Crewneck',    'moletons-crewneck',    2),
  (11,3,    'Cargo',       'calcas-cargo',         1),
  (12,3,    'Jeans',       'calcas-jeans',         2);

INSERT INTO colecao (id, nome, slug, descricao, lancada_em, destaque, ativa) VALUES
  (1,'Essencial','essencial','Algodão pesado, modelagem oversized e cores neutras: a base do guarda-roupa.','2026-01-10',1,1),
  (2,'Drop Inverno','drop-inverno','Moletons flanelados, jaquetas corta-vento e calças de sarja.','2026-02-01',1,1),
  (3,'Linha Neon','linha-neon','Verde neon e estampas de alta visibilidade em tiragem limitada.','2026-02-12',0,1),
  (4,'Básicos','basicos','Camisetas e bonés de reposição, estoque permanente o ano inteiro.','2025-08-01',0,1);

INSERT INTO tag (nome, slug) VALUES
  ('Oversize','oversize'),('Drop novo','drop-novo'),('Hype','hype'),('Vintage','vintage'),
  ('Serigrafia','serigrafia'),('Tiragem limitada','tiragem-limitada'),('Algodão pesado','algodao-pesado'),
  ('Streetwear','streetwear'),('Unissex','unissex');

/* ---------- 5. PAGAMENTO ---------- */
INSERT INTO metodo_pagamento (id, codigo, nome, ativo) VALUES
  (1,'pix','Pix',1), (2,'credito','Cartão de Crédito',1), (3,'boleto','Boleto',0);

/* ---------- 6. STATUS DE PEDIDO E ENVIO ---------- */
INSERT INTO status_pedido (id, codigo, nome, ordem) VALUES
  (1,'aguardando_pagamento','Aguardando pagamento',1),
  (2,'pago','Pagamento aprovado',2),
  (3,'em_separacao','Em separação',3),
  (4,'enviado','Enviado',4),
  (5,'entregue','Entregue',5),
  (6,'cancelado','Cancelado',6),
  (7,'reembolsado','Reembolsado',7);

INSERT INTO status_envio (id, codigo, nome, ordem) VALUES
  (1,'aguardando_postagem','Aguardando postagem',1),
  (2,'postado','Postado',2),
  (3,'em_transito','Em trânsito',3),
  (4,'entregue','Entregue',4),
  (5,'extraviado','Extraviado',5);

/* ---------- 7. CONFIGURAÇÕES DA LOJA (Proprietário) ---------- */
INSERT INTO configuracao (chave, valor, tipo, grupo, descricao) VALUES
  ('loja_nome',                  'SUA MARCA',          'texto',  'geral',      'Nome exibido da loja (troque pela sua marca)'),
  ('loja_cnpj',                  '00.000.000/0001-00', 'texto',  'geral',      'CNPJ da loja (emissor da nota fiscal)'),
  ('loja_email_contato',         'contato@suamarca.com.br','texto','geral',    'E-mail de atendimento'),
  ('loja_cep_expedicao',         '01310-100',          'texto',  'frete',      'CEP de origem para cálculo de frete'),
  ('frete_gratis_acima',         '349.00',             'decimal','frete',      'Frete grátis para pedidos acima de (R$)'),
  ('frete_fixo_padrao',          '24.90',              'decimal','frete',      'Frete cobrado abaixo do valor de frete grátis'),
  ('frete_prazo_producao_dias',  '2',                  'inteiro','frete',      'Dias úteis de separação antes da postagem'),
  ('entrega_retirada_ativa',     '1',                  'booleano','frete',     'Permitir retirada no ateliê'),
  ('gateway_provider',           'mercadopago',        'texto',  'faturamento','Gateway de pagamento ativo'),
  ('gateway_mp_public_key',      '',                   'texto',  'faturamento','Public key do Mercado Pago (preencher no deploy)'),
  ('gateway_mp_access_token',    '',                   'texto',  'faturamento','Access token do Mercado Pago (NUNCA commitar valor real)'),
  ('gateway_mp_webhook_secret',  '',                   'texto',  'faturamento','Segredo para validar a assinatura do webhook'),
  ('pix_expiracao_minutos',      '30',                 'inteiro','faturamento','Validade do QR Code Pix'),
  ('parcelas_maximas',           '12',                 'inteiro','faturamento','Parcelas máximas no cartão'),
  ('parcelas_sem_juros',         '6',                  'inteiro','faturamento','Parcelas sem juros (as demais com juros do emissor)'),
  ('nota_fiscal_automatica',     '1',                  'booleano','faturamento','Emitir NF-e automaticamente na aprovação do pagamento'),
  ('regime_tributario',          'simples_nacional',   'texto',  'faturamento','Regime usado no cálculo de impostos'),
  ('aliquota_imposto_percentual','6.00',               'decimal','faturamento','Alíquota média para relatório de margem'),
  ('aprovacao_produto_obrigatoria','1',                'booleano','seguranca','Produto criado pelo operador exige publicação do gerente'),
  ('estoque_minimo_alerta',      '5',                  'inteiro','seguranca',  'Quantidade que dispara alerta de reposição'),
  ('idade_minima_cadastro',      '18',                 'inteiro','geral',      'Idade mínima para comprar'),
  ('moeda',                      'BRL',                'texto',  'geral',      'Moeda de exibição');
