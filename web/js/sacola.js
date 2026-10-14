/* =====================================================================================
   DROPZ · js/sacola.js
   Estado do carrinho persistido em LocalStorage, com API pública pequena e eventos.
   Contrato espelha o banco: carrinho_item { variante_id, quantidade } e o preço é
   SEMPRE recalculado (nunca confiamos em preço vindo do cliente no checkout).
   ===================================================================================== */
(function () {
  'use strict';

  var CHAVE = 'dropz.sacola.v2';
  var VERSAO = 2;
  var itens = [];

  /* ---------- Persistência ---------- */

  function lerArmazenado() {
    try {
      var bruto = localStorage.getItem(CHAVE);
      if (!bruto) return [];
      var dados = JSON.parse(bruto);
      // Compatibilidade com o formato antigo (array puro, v1).
      if (Array.isArray(dados)) return dados;
      if (dados && dados.versao === VERSAO && Array.isArray(dados.itens)) return dados.itens;
      return [];
    } catch (erro) {
      // LocalStorage bloqueado (modo privado/iframe): o carrinho vive só em memória.
      return [];
    }
  }

  function gravar() {
    try {
      localStorage.setItem(CHAVE, JSON.stringify({ versao: VERSAO, atualizadoEm: Date.now(), itens: itens }));
    } catch (erro) { /* segue em memória */ }
    notificar();
  }

  function notificar() {
    document.dispatchEvent(new CustomEvent('sacola:alterada', {
      detail: { itens: listar(), resumo: resumo() }
    }));
  }

  /* ---------- Utilidades ---------- */

  function chaveDe(produtoId, tamanho, cor) {
    return String(produtoId) + '::' + tamanho + '::' + cor;
  }

  function moeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  }

  function parcela(valor, vezes) {
    return moeda(Math.round((valor / vezes) * 100) / 100);
  }

  function indicePorId(id) {
    for (var i = 0; i < itens.length; i++) {
      if (itens[i].id === id) return i;
    }
    return -1;
  }

  /* ---------- API ---------- */

  function listar() {
    return itens.map(function (item) { return Object.assign({}, item); });
  }

  function adicionar(produto, opcoes) {
    var config = opcoes || {};
    var tamanho = config.tamanho || (produto.tamanhos && produto.tamanhos[0]) || 'Unico';
    var cor = config.cor || (produto.cores && produto.cores[0] ? produto.cores[0].nome : 'Única');
    var quantidade = Math.max(1, parseInt(config.quantidade, 10) || 1);

    var item = {
      id: chaveDe(produto.id, tamanho, cor),
      produtoId: produto.id,
      slug: produto.slug,
      titulo: produto.titulo,
      preco: produto.preco,
      imagem: produto.imagem,
      imagemAlt: produto.imagemAlt,
      tamanho: tamanho,
      cor: cor,
      corHex: (produto.cores && produto.cores[0] && produto.cores[0].nome === cor) ? produto.cores[0].hex : null,
      vendedor: produto.vendedor ? produto.vendedor.nome : '',
      cidade: produto.vendedor ? produto.vendedor.cidade + ', ' + produto.vendedor.uf : '',
      estoqueMaximo: produto.estoque || 99,
      quantidade: quantidade
    };

    var indice = indicePorId(item.id);
    if (indice > -1) {
      var novaQtd = Math.min(itens[indice].quantidade + quantidade, item.estoqueMaximo);
      itens[indice].quantidade = novaQtd;
    } else {
      itens.push(item);
    }
    gravar();
    return item;
  }

  function remover(id) {
    var indice = indicePorId(id);
    if (indice === -1) return false;
    itens.splice(indice, 1);
    gravar();
    return true;
  }

  function definirQuantidade(id, quantidade) {
    var indice = indicePorId(id);
    if (indice === -1) return false;
    var qtd = parseInt(quantidade, 10) || 0;
    if (qtd <= 0) return remover(id);
    itens[indice].quantidade = Math.min(qtd, itens[indice].estoqueMaximo || 99);
    gravar();
    return true;
  }

  function limpar() {
    itens = [];
    gravar();
  }

  function quantidadeTotal() {
    return itens.reduce(function (total, item) { return total + item.quantidade; }, 0);
  }

  function subtotal() {
    return itens.reduce(function (total, item) { return total + item.preco * item.quantidade; }, 0);
  }

  function resumo() {
    var subtotalCalculado = subtotal();
    var maiorParcelamento = itens.reduce(function (max, item) { return Math.max(max, item.quantidade > 0 ? 12 : 1); }, 1);
    return {
      linhas: itens.length,
      pecas: quantidadeTotal(),
      subtotal: subtotalCalculado,
      subtotalFormatado: moeda(subtotalCalculado),
      parcelamentoSugerido: maiorParcelamento,
      parcelaFormatada: parcela(subtotalCalculado, maiorParcelamento)
    };
  }

  itens = lerArmazenado();

  window.Sacola = {
    adicionar: adicionar,
    remover: remover,
    definirQuantidade: definirQuantidade,
    limpar: limpar,
    listar: listar,
    quantidadeTotal: quantidadeTotal,
    subtotal: subtotal,
    resumo: resumo,
    moeda: moeda,
    parcela: parcela,
    CHAVE: CHAVE
  };

  // Sincroniza abas abertas do mesmo navegador.
  window.addEventListener('storage', function (evento) {
    if (evento.key !== CHAVE) return;
    itens = lerArmazenado();
    notificar();
  });
})();
