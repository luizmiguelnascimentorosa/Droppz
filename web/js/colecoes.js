/* =====================================================================================
   LOJA ÚNICA · js/colecoes.js
   Página de coleções: para cada <section data-colecao="slug"> monta o grid com os
   produtos daquela coleção, usando o MESMO card da home (CardProduto).

   Depende de: config.js, dados.js, sacola.js, favoritos.js, frete.js, card-produto.js
   ===================================================================================== */
(function () {
  'use strict';

  var loja = window.LOJA || {};
  var produtos = loja.produtos || [];
  var tplCard = document.getElementById('tpl-card');

  if (!tplCard || !window.CardProduto) return;

  /* Um produto pode estar em mais de uma coleção (ex.: o id 1 está em Essencial e Básicos),
     então ele aparece em cada seção a que pertence — é o comportamento esperado. */
  function doColecao(slug) {
    return produtos
      .filter(function (produto) {
        return (produto.colecoes || []).some(function (c) { return c.slug === slug; });
      })
      .sort(function (a, b) { return b.vendas - a.vendas; }); // mais vendidos primeiro
  }

  function rotuloPecas(n) { return n + (n === 1 ? ' peça' : ' peças'); }

  // Contagem real nos mosaicos do topo (a mesma conta das seções abaixo).
  Array.prototype.forEach.call(document.querySelectorAll('[data-contagem-tile]'), function (alvo) {
    alvo.textContent = rotuloPecas(doColecao(alvo.dataset.contagemTile).length);
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-colecao]'), function (secao) {
    var lista = doColecao(secao.dataset.colecao);
    var grid = secao.querySelector('[data-grid-colecao]');
    var contador = secao.querySelector('[data-contagem-colecao]');

    // Coleção sem peças: esconde a seção inteira, nunca deixa um título solto.
    if (!lista.length) {
      secao.hidden = true;
      return;
    }

    if (contador) contador.textContent = rotuloPecas(lista.length);

    var fragmento = document.createDocumentFragment();
    lista.forEach(function (produto) {
      fragmento.appendChild(CardProduto.criar(produto, tplCard));
    });
    grid.appendChild(fragmento);

    // Escolher tamanho e favoritar. "Adicionar à sacola" já vem do app.js (delegação no document).
    CardProduto.ligarInteracoesDoGrid(grid);
  });
})();
