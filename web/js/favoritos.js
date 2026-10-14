/* =====================================================================================
   LOJA ÚNICA · js/favoritos.js
   Lista de desejos em um só lugar. Antes vivia dentro do vitrine.js e a PDP precisaria
   copiar — agora as duas telas usam a mesma fonte.
   ===================================================================================== */
(function () {
  'use strict';

  var CHAVE = 'loja.favoritos.v1';   // ⚠️ mesma chave de antes: ninguém perde os favoritos
  var itens = carregar();

  function carregar() {
    try {
      var bruto = JSON.parse(localStorage.getItem(CHAVE) || '[]');
      return Array.isArray(bruto) ? bruto.map(String) : [];
    } catch (erro) {
      return [];
    }
  }

  function salvar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(itens)); } catch (erro) { /* segue em memória */ }
    document.dispatchEvent(new CustomEvent('favoritos:alterados', { detail: { itens: listar() } }));
  }

  function listar() { return itens.slice(); }

  function ehFavorito(id) { return itens.indexOf(String(id)) > -1; }

  function alternar(id) {
    var chave = String(id);
    var indice = itens.indexOf(chave);
    if (indice > -1) itens.splice(indice, 1); else itens.push(chave);
    salvar();
    return indice === -1; // true = passou a ser favorito
  }

  function remover(id) {
    var indice = itens.indexOf(String(id));
    if (indice === -1) return false;
    itens.splice(indice, 1);
    salvar();
    return true;
  }

  function total() { return itens.length; }

  /* Mantém duas abas abertas em sincronia. */
  window.addEventListener('storage', function (evento) {
    if (evento.key !== CHAVE) return;
    itens = carregar();
    document.dispatchEvent(new CustomEvent('favoritos:alterados', { detail: { itens: listar() } }));
  });

  window.Favoritos = {
    chave: CHAVE,
    listar: listar,
    ehFavorito: ehFavorito,
    alternar: alternar,
    remover: remover,
    total: total
  };
})();
