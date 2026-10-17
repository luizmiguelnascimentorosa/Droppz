/* =====================================================================================
   DROPPZ · js/carrinho.js
   Monta a PÁGINA do carrinho a partir do estado guardado em Sacola (localStorage).

   O que este arquivo NÃO faz (e por quê):
     · não guarda nem altera itens  -> isso é do sacola.js (a regra fica num lugar só)
     · não calcula frete            -> isso é do frete.js (a Fase 5 liga aqui)
     · não formata dinheiro         -> Sacola.moeda()
   Este arquivo só sabe LER o estado e desenhar a tela.

   Depende de: config.js, dados.js, sacola.js  (e app.js precisa vir depois)
   ===================================================================================== */
(function () {
  'use strict';

  var produtos = (window.LOJA && window.LOJA.produtos) || [];

  var tpl            = document.getElementById('tpl-item-carrinho');
  var lista          = document.getElementById('lista-carrinho');
  var grade          = document.getElementById('carrinho');
  var avisoVazio     = document.getElementById('carrinho-vazio');
  var contagem       = document.getElementById('carrinho-contagem');
  var campoSubtotal  = document.getElementById('carrinho-subtotal');
  var campoTotal     = document.getElementById('carrinho-total');

  /* Cada página checa o que precisa antes de usar: assim ela não quebra se algum
     pedaço do HTML for removido por engano. */
  if (!tpl || !lista || !window.Sacola) return;

  /* O item guardado na sacola tem só o essencial (produtoId, tamanho, cor, preço).
     Categoria e coleção — a linha "Regatas · Básicos" — vêm do catálogo. */
  function acharProduto(id) {
    return produtos.filter(function (p) { return p.id === id; })[0];
  }

  function preencherLinha(item) {
    var linha = tpl.content.firstElementChild.cloneNode(true);
    var produto = acharProduto(item.produtoId) || {};
    var link = 'produto.html?slug=' + encodeURIComponent(item.slug);

    /* O id do item na sacola é "produtoId::tamanho::cor" — é por ele que os botões
       de quantidade vão saber QUAL linha estão alterando (Fase 4). */
    linha.dataset.itemId = item.id;

    var img = linha.querySelector('.carrinho__foto img');
    img.src = item.imagem;
    img.alt = item.imagemAlt || item.titulo;

    Array.prototype.forEach.call(linha.querySelectorAll('a'), function (a) { a.href = link; });

    var categoria = produto.categoria ? produto.categoria.nome : '';
    var colecoes = (produto.colecoes || []).map(function (c) { return c.nome; }).join(' / ');
    linha.querySelector('.carrinho__marca').textContent =
      colecoes ? categoria + ' · ' + colecoes : categoria;

    linha.querySelector('.carrinho__titulo a').textContent = item.titulo;
    linha.querySelector('.carrinho__variacao').textContent =
      'Tam ' + (item.tamanho === 'Unico' ? 'Único' : item.tamanho) + ' · ' + item.cor;
    linha.querySelector('.carrinho__unitario').textContent = Sacola.moeda(item.preco) + ' a unidade';
    linha.querySelector('.controle-qtd output').textContent = item.quantidade;
    linha.querySelector('.carrinho__total').textContent = Sacola.moeda(item.preco * item.quantidade);

    return linha;
  }

  function atualizarResumo() {
    var resumo = Sacola.resumo();   // { linhas, pecas, subtotal, subtotalFormatado, ... }

    campoSubtotal.textContent = Sacola.moeda(resumo.subtotal);
    campoTotal.textContent = Sacola.moeda(resumo.subtotal);   // frete e cupom entram na Fase 5

    contagem.textContent = resumo.pecas === 0
      ? ''
      : resumo.pecas + (resumo.pecas === 1 ? ' peça' : ' peças') + ' na sacola';
  }

  function renderizar() {
    var itens = Sacola.listar();

    lista.textContent = '';   // limpa SÓ a lista — nunca a página inteira

    // Sacola vazia: esconde o carrinho e mostra o convite para o catálogo
    if (!itens.length) {
      if (grade) grade.hidden = true;
      if (avisoVazio) avisoVazio.hidden = false;
      atualizarResumo();
      return;
    }

    if (grade) grade.hidden = false;
    if (avisoVazio) avisoVazio.hidden = true;

    var fragmento = document.createDocumentFragment();
    itens.forEach(function (item) { fragmento.appendChild(preencherLinha(item)); });
    lista.appendChild(fragmento);

    atualizarResumo();
  }

  renderizar();

  /* ⚠️ Sem esta linha, mudar a quantidade pela GAVETA do cabeçalho não atualizaria
     esta página: o dado mudaria no localStorage e a tela ficaria velha. O sacola.js
     avisa todo mundo com este evento a cada alteração. */
  document.addEventListener('sacola:alterada', renderizar);
})();
