/* =====================================================================================
   LOJA ÚNICA · js/dados.js
   Catálogo de produtos da vitrine. Em produção, este arquivo é substituído pela resposta
   da API (GET /api/produtos) com EXATAMENTE o mesmo formato — o contrato abaixo espelha
   as colunas de vw_catalogo do banco (database/schema.sql).

   A configuração da loja (marca, frete, faixa de preço) NÃO fica aqui: está em js/config.js,
   que deve ser carregado ANTES deste arquivo.
   ===================================================================================== */
(function () {
  'use strict';

  window.LOJA = window.LOJA || {};

  window.LOJA.produtos = [
    {
      id: 1, slug: 'camiseta-oversized-essencial-240',
      titulo: 'Camiseta Oversized "Essencial" Algodão Pesado 240 g/m²',
      categoria: { nome: 'Camisetas', slug: 'camisetas' },
      colecoes: [{ nome: 'Essencial', slug: 'essencial' }, { nome: 'Básicos', slug: 'basicos' }],
      tecido: { nome: 'Algodão Pesado', composicao: '100% Algodão penteado', gramatura: 240, protecaoUv: false, secagemRapida: false },
      condicao: 'novo', caimento: 'oversized', publico: 'Unissex',
      preco: 189.9, precoAntigo: 229.9, parcelas: 6,
      tamanhos: ['P', 'M', 'G', 'GG', 'XG'],
      cores: [{ nome: 'Preto', hex: '#101010' }, { nome: 'Off-white', hex: '#f2f0e9' }],
      familias: ['Preto', 'Off-white'],
      estoque: 24, nota: 4.8, avaliacoes: 138, vendas: 412, lancadoEm: '2026-01-12',
      imagem: 'assets/img/p-01.svg',
      imagemAlt: 'Camiseta oversized preta em algodão pesado com estampa tipográfica nas costas'
    },
    {
      id: 2, slug: 'moletom-hoodie-flanelado-320',
      titulo: 'Moletom Hoodie Flanelado 320 g/m² com Capuz Forrado',
      categoria: { nome: 'Moletons', slug: 'moletons' },
      colecoes: [{ nome: 'Drop Inverno', slug: 'drop-inverno' }],
      tecido: { nome: 'Moletom Flanelado', composicao: '80% Algodão, 20% Poliéster', gramatura: 320, protecaoUv: false, secagemRapida: false },
      condicao: 'novo', caimento: 'regular', publico: 'Unissex',
      preco: 429.9, precoAntigo: null, parcelas: 10,
      tamanhos: ['M', 'G', 'GG', 'XG'],
      cores: [{ nome: 'Grafite', hex: '#3f4145' }, { nome: 'Verde Militar', hex: '#4b5340' }],
      familias: ['Cinza', 'Verde'],
      estoque: 12, nota: 4.9, avaliacoes: 96, vendas: 268, lancadoEm: '2026-02-01',
      imagem: 'assets/img/p-02.svg',
      imagemAlt: 'Moletom com capuz grafite em moletom flanelado'
    },
    {
      id: 3, slug: 'camiseta-boxy-linha-neon',
      titulo: 'Camiseta Boxy "Linha Neon" Estampa Grande',
      categoria: { nome: 'Camisetas', slug: 'camisetas' },
      colecoes: [{ nome: 'Linha Neon', slug: 'linha-neon' }],
      tecido: { nome: 'Tricoline Estampada', composicao: '100% Algodão', gramatura: 150, protecaoUv: false, secagemRapida: false },
      condicao: 'novo', caimento: 'boxy', publico: 'Unissex',
      preco: 249.9, precoAntigo: null, parcelas: 6,
      tamanhos: ['P', 'M', 'G'],
      cores: [{ nome: 'Off-white', hex: '#f2f0e9' }, { nome: 'Verde Neon', hex: '#d8ff3e' }],
      familias: ['Off-white', 'Verde'],
      estoque: 3, nota: 4.7, avaliacoes: 34, vendas: 87, lancadoEm: '2026-02-12',
      imagem: 'assets/img/p-03.svg',
      imagemAlt: 'Camiseta boxy off-white com estampa verde neon de alta visibilidade'
    },
    {
      id: 4, slug: 'calca-cargo-ripstop-com-cinto',
      titulo: 'Calça Cargo Ripstop com Cinto e Bolsos Laterais',
      categoria: { nome: 'Calças', slug: 'calcas' },
      colecoes: [{ nome: 'Drop Inverno', slug: 'drop-inverno' }],
      tecido: { nome: 'Sarja Ripstop', composicao: '94% Algodão, 6% Elastano', gramatura: 260, protecaoUv: false, secagemRapida: false },
      condicao: 'novo', caimento: 'regular', publico: 'Masculino',
      preco: 389.9, precoAntigo: 459.9, parcelas: 10,
      tamanhos: ['38', '40', '42', '44'],
      cores: [{ nome: 'Verde Militar', hex: '#4b5340' }, { nome: 'Marrom Cafe', hex: '#5a4032' }],
      familias: ['Verde', 'Marrom'],
      estoque: 15, nota: 4.6, avaliacoes: 71, vendas: 190, lancadoEm: '2026-02-03',
      imagem: 'assets/img/p-04.svg',
      imagemAlt: 'Calça cargo verde militar de sarja ripstop com bolsos laterais'
    },
    {
      id: 5, slug: 'bone-aba-curva-bordado-3d',
      titulo: 'Boné Aba Curva com Bordado 3D',
      categoria: { nome: 'Bonés', slug: 'bones' },
      colecoes: [{ nome: 'Básicos', slug: 'basicos' }],
      tecido: { nome: 'Sarja Drill', composicao: '100% Algodão sarja', gramatura: 300, protecaoUv: false, secagemRapida: false },
      condicao: 'novo', caimento: 'regular', publico: 'Unissex',
      preco: 129.9, precoAntigo: null, parcelas: 4,
      tamanhos: ['Unico'],
      cores: [{ nome: 'Preto', hex: '#101010' }, { nome: 'Bege Areia', hex: '#d9cdb8' }],
      familias: ['Preto', 'Bege'],
      estoque: 38, nota: 4.8, avaliacoes: 112, vendas: 305, lancadoEm: '2025-11-20',
      imagem: 'assets/img/p-05.svg',
      imagemAlt: 'Boné preto de aba curva com logo bordado em relevo'
    },
    {
      id: 6, slug: 'jaqueta-corta-vento-nylon-refletiva',
      titulo: 'Jaqueta Corta-Vento Nylon com Fita Refletiva',
      categoria: { nome: 'Jaquetas', slug: 'jaquetas' },
      colecoes: [{ nome: 'Drop Inverno', slug: 'drop-inverno' }],
      tecido: { nome: 'Nylon Ripstop', composicao: '100% Poliamida', gramatura: 120, protecaoUv: true, secagemRapida: true },
      condicao: 'novo', caimento: 'regular', publico: 'Unissex',
      preco: 599.9, precoAntigo: 699.9, parcelas: 12,
      tamanhos: ['M', 'G', 'GG'],
      cores: [{ nome: 'Lilás', hex: '#8a6ea8' }, { nome: 'Preto', hex: '#101010' }],
      familias: ['Roxo', 'Preto'],
      estoque: 6, nota: 4.9, avaliacoes: 48, vendas: 96, lancadoEm: '2026-02-08',
      imagem: 'assets/img/p-06.svg',
      imagemAlt: 'Jaqueta corta-vento lilás com faixas refletivas'
    },
    {
      id: 7, slug: 'camiseta-estampada-drop-antigo-skate',
      titulo: 'Camiseta Estampada "Skate 2019" — Drop Antigo',
      categoria: { nome: 'Camisetas', slug: 'camisetas' },
      colecoes: [{ nome: 'Básicos', slug: 'basicos' }],
      tecido: { nome: 'Tricoline Estampada', composicao: '100% Algodão', gramatura: 150, protecaoUv: false, secagemRapida: false },
      condicao: 'drop_antigo', caimento: 'oversized', publico: 'Unissex',
      preco: 149.9, precoAntigo: null, parcelas: 4,
      tamanhos: ['M', 'G', 'GG'],
      cores: [{ nome: 'Cinza Mescla', hex: '#b8b8b3' }],
      familias: ['Cinza'],
      estoque: 2, nota: 4.4, avaliacoes: 21, vendas: 74, lancadoEm: '2025-09-21',
      imagem: 'assets/img/p-07.svg',
      imagemAlt: 'Camiseta cinza mescla com estampa de skate desbotada'
    },
    {
      id: 8, slug: 'moletom-crewneck-flanelado-basico',
      titulo: 'Moletom Crewneck Flanelado Básico sem Capuz',
      categoria: { nome: 'Moletons', slug: 'moletons' },
      colecoes: [{ nome: 'Básicos', slug: 'basicos' }, { nome: 'Essencial', slug: 'essencial' }],
      tecido: { nome: 'Moletom Flanelado', composicao: '80% Algodão, 20% Poliéster', gramatura: 320, protecaoUv: false, secagemRapida: false },
      condicao: 'novo', caimento: 'regular', publico: 'Unissex',
      preco: 329.9, precoAntigo: null, parcelas: 8,
      tamanhos: ['P', 'M', 'G', 'GG', 'XG'],
      cores: [{ nome: 'Azul Marinho', hex: '#1d2a44' }, { nome: 'Off-white', hex: '#f2f0e9' }],
      familias: ['Azul', 'Off-white'],
      estoque: 21, nota: 4.7, avaliacoes: 156, vendas: 340, lancadoEm: '2025-10-09',
      imagem: 'assets/img/p-08.svg',
      imagemAlt: 'Moletom crewneck azul marinho sem capuz'
    },
    {
      id: 9, slug: 'camiseta-oversized-linha-neon-verde',
      titulo: 'Camiseta Oversized "Linha Neon" Verde Tiragem Limitada',
      categoria: { nome: 'Camisetas', slug: 'camisetas' },
      colecoes: [{ nome: 'Linha Neon', slug: 'linha-neon' }, { nome: 'Essencial', slug: 'essencial' }],
      tecido: { nome: 'Algodão Pesado', composicao: '100% Algodão penteado', gramatura: 240, protecaoUv: false, secagemRapida: false },
      condicao: 'novo', caimento: 'oversized', publico: 'Unissex',
      preco: 199.9, precoAntigo: null, parcelas: 6,
      tamanhos: ['P', 'M', 'G'],
      cores: [{ nome: 'Verde Neon', hex: '#d8ff3e' }, { nome: 'Preto', hex: '#101010' }],
      familias: ['Verde', 'Preto'],
      estoque: 4, nota: 5.0, avaliacoes: 17, vendas: 52, lancadoEm: '2026-02-13',
      imagem: 'assets/img/p-01.svg',
      imagemAlt: 'Camiseta oversized verde neon de tiragem limitada'
    },
    {
      id: 10, slug: 'calca-jeans-baggy-lavagem-escura',
      titulo: 'Calça Jeans Baggy Lavagem Escura — Drop Antigo',
      categoria: { nome: 'Calças', slug: 'calcas' },
      colecoes: [{ nome: 'Básicos', slug: 'basicos' }],
      tecido: { nome: 'Denim Rígido', composicao: '100% Algodão 14 oz', gramatura: 400, protecaoUv: false, secagemRapida: false },
      condicao: 'drop_antigo', caimento: 'baggy', publico: 'Masculino',
      preco: 279.9, precoAntigo: 349.9, parcelas: 8,
      tamanhos: ['40', '42', '44'],
      cores: [{ nome: 'Azul Jeans', hex: '#4a6b8a' }],
      familias: ['Azul'],
      estoque: 5, nota: 4.3, avaliacoes: 29, vendas: 118, lancadoEm: '2025-08-14',
      imagem: 'assets/img/p-02.svg',
      imagemAlt: 'Calça jeans baggy azul escuro de perna larga'
    },
    {
      id: 11, slug: 'moletom-oversized-estampa-costas',
      titulo: 'Moletom Oversized com Estampa Grande nas Costas',
      categoria: { nome: 'Moletons', slug: 'moletons' },
      colecoes: [{ nome: 'Essencial', slug: 'essencial' }],
      tecido: { nome: 'Moletom Flanelado', composicao: '80% Algodão, 20% Poliéster', gramatura: 320, protecaoUv: false, secagemRapida: false },
      condicao: 'novo', caimento: 'oversized', publico: 'Unissex',
      preco: 469.9, precoAntigo: null, parcelas: 10,
      tamanhos: ['G', 'GG', 'XG'],
      cores: [{ nome: 'Preto', hex: '#101010' }, { nome: 'Vermelho Fogo', hex: '#c0342a' }],
      familias: ['Preto', 'Vermelho'],
      estoque: 8, nota: 4.8, avaliacoes: 23, vendas: 61, lancadoEm: '2026-02-10',
      imagem: 'assets/img/p-03.svg',
      imagemAlt: 'Moletom oversized preto com estampa grande nas costas'
    },
    {
      id: 12, slug: 'camiseta-tie-dye-tingimento-em-peca',
      titulo: 'Camiseta Tie-Dye Tingimento em Peça — Drop Antigo',
      categoria: { nome: 'Camisetas', slug: 'camisetas' },
      colecoes: [{ nome: 'Linha Neon', slug: 'linha-neon' }],
      tecido: { nome: 'Tricoline Estampada', composicao: '100% Algodão', gramatura: 150, protecaoUv: false, secagemRapida: false },
      condicao: 'drop_antigo', caimento: 'oversized', publico: 'Unissex',
      preco: 199.9, precoAntigo: null, parcelas: 6,
      tamanhos: ['M', 'G'],
      cores: [{ nome: 'Lilás', hex: '#8a6ea8' }, { nome: 'Cinza Mescla', hex: '#b8b8b3' }],
      familias: ['Roxo', 'Cinza'],
      estoque: 1, nota: 4.9, avaliacoes: 11, vendas: 33, lancadoEm: '2025-12-02',
      imagem: 'assets/img/p-04.svg',
      imagemAlt: 'Camiseta tie-dye lilás com variação única de cor'
    },
    {
      id: 13, slug: 'regata-canelada-essencial',
      titulo: 'Regata Canelada "Essencial" Algodão 180 g/m²',
      categoria: { nome: 'Regatas', slug: 'regatas' },
      colecoes: [{ nome: 'Básicos', slug: 'basicos' }],
      tecido: { nome: 'Algodão Canelado', composicao: '100% Algodão penteado', gramatura: 180, protecaoUv: false, secagemRapida: false },
      condicao: 'novo', caimento: 'slim', publico: 'Masculino',
      preco: 89.9, precoAntigo: 119.9, parcelas: 6,
      tamanhos: ['P', 'M', 'G', 'GG'],
      cores: [{ nome: 'Preto', hex: '#101010' }, { nome: 'Off-white', hex: '#f2f0e9' }],
      familias: ['Preto', 'Off-white'],
      estoque: 24, nota: 4.9, avaliacoes: 112, vendas: 761, lancadoEm: '2026-01-12',
      imagem: 'assets/img/p-09.svg',
      imagemAlt: 'Regata preta canelada de alças finas em algodão penteado',
      /* Quando existirem fotos reais, basta listar aqui: a galeria da PDP monta as
         miniaturas sozinha. Com uma foto só, a PDP simplesmente não mostra miniaturas. */
      imagens: ['assets/img/p-09.svg', 'assets/img/p-09-detalhe.svg']
    }
  ];
})();
