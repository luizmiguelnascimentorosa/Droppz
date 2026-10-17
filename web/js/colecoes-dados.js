/* =====================================================================================
   LOJA ÚNICA · js/colecoes-dados.js
   Utilitários de coleção COMPARTILHADOS pela home e pela página de coleções.

   Por que este arquivo existe: a home mostra "Essencial · 4 peças" e a página de
   coleções mostra a mesma contagem. Se cada página fizesse a sua conta, uma delas
   ficaria desatualizada — foi exatamente o que aconteceu (a home tinha números
   escritos à mão: 11, 8, 4, 16).

   Depende de: js/dados.js (LOJA.produtos)
   ===================================================================================== */
(function () {
  'use strict';

  var produtos = (window.LOJA && window.LOJA.produtos) || [];

  /* Um produto pode estar em mais de uma coleção (o id 1 está em Essencial e em Básicos),
     então a soma das contagens pode passar do total de produtos. É o comportamento certo. */
  function doColecao(slug) {
    return produtos
      .filter(function (produto) {
        return (produto.colecoes || []).some(function (c) { return c.slug === slug; });
      })
      .sort(function (a, b) { return b.vendas - a.vendas; }); // mais vendidos primeiro
  }

  function rotuloPecas(n) {
    return n + (n === 1 ? ' peça' : ' peças');
  }

  /* Preenche todo elemento [data-contagem-tile="slug"] com a contagem real.
     O HTML já vem com o número certo dentro do span (para quem está sem JavaScript);
     esta função só mantém esse número verdadeiro quando o catálogo muda. */
  function preencherContagensTiles(raiz) {
    var escopo = raiz || document;
    Array.prototype.forEach.call(escopo.querySelectorAll('[data-contagem-tile]'), function (alvo) {
      var slug = alvo.dataset.contagemTile;
      if (!slug) return;
      alvo.textContent = rotuloPecas(doColecao(slug).length);
    });
  }

  window.Colecoes = {
    doColecao: doColecao,
    rotuloPecas: rotuloPecas,
    preencherContagensTiles: preencherContagensTiles
  };
})();
