/* =====================================================================================
   LOJA ÚNICA · js/colecoes.js
   Página de coleções: para cada <section data-colecao="slug"> monta o grid com os
   produtos daquela coleção, usando o MESMO card da home (CardProduto).

   Depende de: config.js, dados.js, sacola.js, favoritos.js, frete.js, card-produto.js
   ===================================================================================== */
(function () {
  'use strict';

  var tplCard = document.getElementById('tpl-card');

  if (!tplCard || !window.CardProduto || !window.Colecoes) return;

  /* A conta "quais produtos pertencem a esta coleção" mora em js/colecoes-dados.js,
     compartilhada com a home — assim as duas telas nunca divergem. */
  var doColecao = Colecoes.doColecao;
  var rotuloPecas = Colecoes.rotuloPecas;

  // Contagem real nos mosaicos do topo (a mesma conta das seções abaixo).
  Colecoes.preencherContagensTiles();

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
