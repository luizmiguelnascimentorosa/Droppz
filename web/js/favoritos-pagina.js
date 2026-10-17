/* =====================================================================================
   LOJA ÚNICA · js/favoritos-pagina.js
   Monta a PÁGINA da lista de desejos.

   ⚠️ Não confundir com js/favoritos.js:
     · js/favoritos.js        → o ESTADO (quais ids estão salvos, no localStorage)
     · js/favoritos-pagina.js → a TELA (quais cards mostrar, o vazio, a contagem)

   Os cards são os MESMOS da home: quem monta é o CardProduto, não este arquivo.

   Depende de: config.js, dados.js, sacola.js, favoritos.js, card-produto.js
   ===================================================================================== */
(function () {
  'use strict';

  var produtos = (window.LOJA && window.LOJA.produtos) || [];

  var tplCard = document.getElementById('tpl-card');
  var grid = document.getElementById('grid-favoritos');
  var avisoVazio = document.getElementById('favoritos-vazio');
  var contagem = document.getElementById('favoritos-contagem');

  if (!grid || !tplCard || !window.CardProduto || !window.Favoritos) return;

  /* Converte os ids salvos em produtos do catálogo, na ordem em que foram salvos.
     O .filter(Boolean) descarta id que não existe mais (produto saiu de linha):
     sem isso, a página mostraria um card vazio. */
  function produtosSalvos() {
    return Favoritos.listar()
      .map(function (id) {
        return produtos.filter(function (p) { return String(p.id) === String(id); })[0];
      })
      .filter(Boolean);
  }

  function renderizar() {
    var lista = produtosSalvos();

    grid.textContent = '';

    if (contagem) {
      contagem.textContent = lista.length === 0
        ? ''
        : (lista.length === 1 ? '1 peça salva' : lista.length + ' peças salvas');
    }

    // Lista vazia: esconde o grid e mostra o convite para explorar o catálogo
    if (!lista.length) {
      if (avisoVazio) avisoVazio.hidden = false;
      return;
    }
    if (avisoVazio) avisoVazio.hidden = true;

    var fragmento = document.createDocumentFragment();
    lista.forEach(function (produto) {
      fragmento.appendChild(CardProduto.criar(produto, tplCard));
    });
    grid.appendChild(fragmento);
  }

  renderizar();

  /* Escolher tamanho e favoritar (o coração). Uma vez só: o listener fica no contêiner,
     então continua valendo para os cards recriados a cada renderização. */
  CardProduto.ligarInteracoesDoGrid(grid);

  /* Ao desfavoritar, o card precisa SAIR da página na hora — senão o coração fica
     vazio na lista de desejos, o que não faz sentido. O módulo Favoritos avisa
     todo mundo com este evento. */
  document.addEventListener('favoritos:alterados', renderizar);
})();
