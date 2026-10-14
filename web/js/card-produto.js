/* =====================================================================================
   LOJA ÚNICA · js/card-produto.js
   Monta UM card de produto a partir do <template id="tpl-card">.

   Por que este arquivo existe: a vitrine e a PDP (na seção "você também pode gostar")
   mostram o mesmo card. Se cada tela tivesse a sua versão, mudar o badge exigiria
   lembrar de dois lugares — e um deles ficaria para trás.

   Depende de: config.js (LOJA), sacola.js (Sacola), favoritos.js (Favoritos).
   ===================================================================================== */
(function () {
  'use strict';

  var loja = window.LOJA || { marca: { nome: 'SUA MARCA' }, entrega: { prazoPostagem: '24h úteis' } };

  /* Quanto de desconto arredondado, para o badge "-25%". */
  function calcularDesconto(produto) {
    if (!produto.precoAntigo || produto.precoAntigo <= produto.preco) return 0;
    return Math.round((1 - produto.preco / produto.precoAntigo) * 100);
  }

  /* Regras de badge, em ordem de prioridade. Máximo 2 por card para não poluir. */
  function montarBadges(produto, limite) {
    var lista = [];
    var desconto = calcularDesconto(produto);

    if (desconto >= 10) lista.push({ texto: '-' + desconto + '%', classe: 'badge--alerta' });
    if (produto.condicao === 'novo') lista.push({ texto: 'Novo drop', classe: '' });
    else lista.push({ texto: 'Drop antigo', classe: 'badge--suave' });
    if (produto.estoque <= 4) {
      lista.push({ texto: 'Últimas ' + produto.estoque + ' un.', classe: 'badge--escuro' });
    }

    return lista.slice(0, limite || 2);
  }

  /* Atributos rápidos do card: composição, gramatura, UV e nota. */
  function montarAtributos(produto) {
    var lista = [produto.tecido.composicao];
    if (produto.tecido.gramatura) lista.push(produto.tecido.gramatura + ' g/m²');
    if (produto.tecido.protecaoUv) lista.push('Proteção UV');
    if (produto.avaliacoes) {
      lista.push('★ ' + produto.nota.toFixed(1).replace('.', ',') + ' (' + produto.avaliacoes + ')');
    }
    return lista;
  }

  function nomesDasColecoes(produto) {
    return (produto.colecoes || []).map(function (c) { return c.nome; });
  }

  /**
   * Cria o elemento do card.
   * @param {Object} produto  item no formato de js/dados.js
   * @param {HTMLTemplateElement} template  o <template id="tpl-card"> da página
   * @returns {HTMLElement}
   */
  function criar(produto, template) {
    var card = template.content.firstElementChild.cloneNode(true);
    card.dataset.produtoId = produto.id;

    var linkProduto = 'produto.html?slug=' + encodeURIComponent(produto.slug);
    Array.prototype.forEach.call(card.querySelectorAll('[data-link-produto]'), function (link) {
      link.setAttribute('href', linkProduto);
    });

    var imagem = card.querySelector('.card__imagem');
    imagem.src = produto.imagem;
    imagem.alt = produto.imagemAlt || produto.titulo;

    var areaBadges = card.querySelector('.card__badges');
    montarBadges(produto).forEach(function (info) {
      var span = document.createElement('span');
      span.className = 'badge ' + info.classe;
      span.textContent = info.texto;
      areaBadges.appendChild(span);
    });

    var botaoFavorito = card.querySelector('.card__favorito');
    var favoritado = !!(window.Favoritos && window.Favoritos.ehFavorito(produto.id));
    botaoFavorito.setAttribute('aria-pressed', favoritado ? 'true' : 'false');
    botaoFavorito.setAttribute('aria-label', favoritado
      ? 'Remover da lista de desejos' : 'Salvar na lista de desejos');

    var linhaMarca = card.querySelector('.card__marca');
    var em = document.createElement('em');
    em.textContent = produto.categoria.nome;
    linhaMarca.appendChild(em);
    linhaMarca.appendChild(document.createTextNode(' · ' + nomesDasColecoes(produto).join(' / ')));

    var titulo = card.querySelector('.card__titulo a');
    titulo.textContent = produto.titulo;
    titulo.setAttribute('href', linkProduto);

    var atributos = card.querySelector('.card__atributos');
    montarAtributos(produto).forEach(function (texto) {
      var li = document.createElement('li');
      li.textContent = texto;
      atributos.appendChild(li);
    });

    var areaTamanhos = card.querySelector('.card__tamanhos');
    produto.tamanhos.forEach(function (sigla, indice) {
      var botao = document.createElement('button');
      botao.type = 'button';
      botao.className = 'card__tamanho';
      botao.dataset.acao = 'escolher-tamanho';
      botao.dataset.tamanho = sigla;
      botao.setAttribute('aria-pressed', indice === 0 ? 'true' : 'false');
      botao.textContent = sigla === 'Unico' ? 'Único' : sigla;
      areaTamanhos.appendChild(botao);
    });

    var areaCores = card.querySelector('.card__cores');
    produto.cores.forEach(function (cor) {
      var i = document.createElement('i');
      i.style.background = cor.hex;
      i.title = cor.nome;
      areaCores.appendChild(i);
    });

    var areaPreco = card.querySelector('.card__preco');
    var precoAtual = areaPreco.querySelector('.preco');
    precoAtual.textContent = Sacola.moeda(produto.preco);

    if (produto.precoAntigo) {
      // O "de" sempre ACIMA do preço atual: é como se lê uma oferta.
      var antigo = document.createElement('span');
      antigo.className = 'card__preco-antigo';
      antigo.textContent = 'de ' + Sacola.moeda(produto.precoAntigo);
      areaPreco.insertBefore(antigo, precoAtual);
    }

    var parcelas = card.querySelector('.card__parcelas');
    var forte = document.createElement('strong');
    forte.textContent = produto.parcelas + 'x de ' + Sacola.parcela(produto.preco, produto.parcelas);
    parcelas.appendChild(forte);
    parcelas.appendChild(document.createTextNode(' sem juros'));

    /* Linha de garantia da loja. Cuidado para não repetir o que já está nos atributos. */
    var linhaEntrega = card.querySelector('.card__entrega span');
    var marca = document.createElement('strong');
    marca.textContent = loja.marca.nome;
    linhaEntrega.appendChild(marca);
    linhaEntrega.appendChild(document.createTextNode(
      ' · postado em ' + (loja.entrega.prazoPostagem || '24h úteis') + ' · troca em 30 dias'
    ));

    return card;
  }

  /**
   * Liga os cliques de um GRID de cards: escolher tamanho e favoritar.
   * Um único listener no contêiner resolve todos os cards — inclusive os que ainda não
   * existem. Por isso pode ser chamada antes do grid ser renderizado (delegação de evento).
   * @param {HTMLElement} container elemento que contém os cards
   */
  function ligarInteracoesDoGrid(container) {
    if (!container) return;

    container.addEventListener('click', function (evento) {
      var botaoTamanho = evento.target.closest('[data-acao="escolher-tamanho"]');
      if (botaoTamanho) {
        Array.prototype.forEach.call(
          botaoTamanho.parentNode.querySelectorAll('.card__tamanho'),
          function (outro) { outro.setAttribute('aria-pressed', 'false'); }
        );
        botaoTamanho.setAttribute('aria-pressed', 'true');
        return;
      }

      var botaoFavorito = evento.target.closest('[data-acao="favoritar"]');
      if (botaoFavorito) {
        var card = botaoFavorito.closest('[data-produto-id]');
        if (!card || !window.Favoritos) return;
        var agora = Favoritos.alternar(card.dataset.produtoId);
        botaoFavorito.setAttribute('aria-pressed', agora ? 'true' : 'false');
        botaoFavorito.setAttribute('aria-label', agora
          ? 'Remover da lista de desejos' : 'Salvar na lista de desejos');
        if (window.UI) {
          UI.avisar(agora ? 'Salvo na sua lista de desejos.' : 'Removido da lista de desejos.');
        }
      }
    });
  }

  window.CardProduto = {
    criar: criar,
    ligarInteracoesDoGrid: ligarInteracoesDoGrid,
    calcularDesconto: calcularDesconto,
    montarBadges: montarBadges,
    montarAtributos: montarAtributos
  };
})();
