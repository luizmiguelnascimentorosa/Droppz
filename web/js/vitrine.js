/* =====================================================================================
   LOJA ÚNICA · js/vitrine.js
   Motor de filtros + ordenação + render do grid da home.

   O que NÃO mora mais aqui (e por quê):
     · a montagem do card   -> js/card-produto.js  (a PDP usa o mesmo card)
     · a lista de favoritos -> js/favoritos.js     (a PDP usa a mesma lista)
     · o cálculo de frete   -> js/frete.js         (a PDP e a sacola usam a mesma regra)
   ===================================================================================== */
(function () {
  'use strict';

  var loja = window.LOJA || {};
  var produtos = loja.produtos || [];

  var grid = document.getElementById('grid-produtos');
  var tplCard = document.getElementById('tpl-card');
  var formFiltros = document.getElementById('form-filtros');
  var saidaContagem = document.getElementById('resultado-contagem');
  var seletorOrdem = document.getElementById('ordenar');
  var btnLimpar = document.getElementById('limpar-filtros');
  var contadorFiltros = document.getElementById('filtros-contagem');

  var precoMin = document.getElementById('preco-min');
  var precoMax = document.getElementById('preco-max');
  var saidaMin = document.getElementById('preco-min-valor');
  var saidaMax = document.getElementById('preco-max-valor');
  var progresso = document.getElementById('faixa-progresso');

  var estado = {
    termo: '',
    ordem: 'relevancia',
    filtros: {
      categoria: [], condicao: [], colecao: [], caimento: [],
      tamanho: [], cor: [], precoMin: 0, precoMax: 0
    }
  };

  /* ------------------------------------------------------------------ utilidades */

  function normalizar(texto) {
    return String(texto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  function marcados(nome) {
    if (!formFiltros) return [];
    return Array.prototype.slice
      .call(formFiltros.querySelectorAll('input[name="' + nome + '"]:checked'))
      .map(function (input) { return input.value; });
  }

  function slugsDasColecoes(produto) {
    return (produto.colecoes || []).map(function (c) { return c.slug; });
  }

  /* ------------------------------------------------------------------- filtragem */

  function lerFiltrosDaTela() {
    estado.filtros.categoria = marcados('categoria');
    estado.filtros.condicao = marcados('condicao');
    estado.filtros.colecao = marcados('colecao');
    estado.filtros.caimento = marcados('caimento');
    estado.filtros.tamanho = marcados('tamanho');
    estado.filtros.cor = marcados('cor');

    var min = Number(precoMin.value);
    var max = Number(precoMax.value);
    if (min > max) { var troca = min; min = max; max = troca; }
    estado.filtros.precoMin = min;
    estado.filtros.precoMax = max;

    estado.ordem = seletorOrdem ? seletorOrdem.value : 'relevancia';
  }

  function combinaBusca(produto) {
    if (!estado.termo) return true;
    var alvo = normalizar([
      produto.titulo, produto.categoria.nome, produto.caimento, produto.publico,
      produto.tecido.nome, produto.tecido.composicao,
      produto.condicao === 'novo' ? 'novo colecao atual' : 'drop antigo',
      (produto.colecoes || []).map(function (c) { return c.nome; }).join(' '),
      produto.cores.map(function (c) { return c.nome; }).join(' ')
    ].join(' '));
    // Todos os termos digitados precisam aparecer (AND), em qualquer ordem.
    return normalizar(estado.termo).split(/\s+/).every(function (termo) {
      return alvo.indexOf(termo) > -1;
    });
  }

  function combinaFiltros(produto) {
    var f = estado.filtros;

    if (f.categoria.length && f.categoria.indexOf(produto.categoria.slug) === -1) return false;
    if (f.condicao.length && f.condicao.indexOf(produto.condicao) === -1) return false;
    if (f.caimento.length && f.caimento.indexOf(produto.caimento) === -1) return false;

    if (f.colecao.length) {
      var slugs = slugsDasColecoes(produto);
      if (!f.colecao.some(function (slug) { return slugs.indexOf(slug) > -1; })) return false;
    }

    if (f.tamanho.length) {
      if (!produto.tamanhos.some(function (t) { return f.tamanho.indexOf(t) > -1; })) return false;
    }

    if (f.cor.length) {
      if (!produto.familias.some(function (familia) { return f.cor.indexOf(familia) > -1; })) return false;
    }

    if (produto.preco < f.precoMin || produto.preco > f.precoMax) return false;

    return true;
  }

  function resultados() {
    return produtos.filter(function (produto) {
      return combinaBusca(produto) && combinaFiltros(produto);
    });
  }

  function ordenar(lista) {
    var copia = lista.slice();
    switch (estado.ordem) {
      case 'menor-preco':
        return copia.sort(function (a, b) { return a.preco - b.preco; });
      case 'maior-preco':
        return copia.sort(function (a, b) { return b.preco - a.preco; });
      case 'avaliacao':
        return copia.sort(function (a, b) { return b.nota - a.nota || b.avaliacoes - a.avaliacoes; });
      case 'mais-vendidos':
        return copia.sort(function (a, b) { return b.vendas - a.vendas; });
      case 'novidades':
        return copia.sort(function (a, b) { return new Date(b.lancadoEm) - new Date(a.lancadoEm); });
      default:
        // Relevância: drop novo + melhor nota + mais vendido + estoque saudável.
        return copia.sort(function (a, b) {
          var pesoA = (a.condicao === 'novo' ? 2 : 0) + a.nota + a.vendas / 500 + Math.min(a.estoque, 30) / 100;
          var pesoB = (b.condicao === 'novo' ? 2 : 0) + b.nota + b.vendas / 500 + Math.min(b.estoque, 30) / 100;
          return pesoB - pesoA;
        });
    }
  }

  /* ------------------------------------------------------------------ renderização */

  function estadoVazio() {
    var caixa = document.createElement('div');
    caixa.className = 'estado-vazio';
    caixa.style.gridColumn = '1 / -1';

    var titulo = document.createElement('h3');
    titulo.textContent = 'Nenhuma peça bate com esses filtros';

    var texto = document.createElement('p');
    texto.className = 'texto-sm';
    texto.textContent = 'Tente ampliar a faixa de preço, remover a grade selecionada ou buscar por outro termo.';

    var botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'btn btn--contorno';
    botao.textContent = 'Limpar filtros';
    botao.addEventListener('click', limparTudo);

    caixa.appendChild(titulo);
    caixa.appendChild(texto);
    caixa.appendChild(botao);
    return caixa;
  }

  function renderizar() {
    var lista = ordenar(resultados());
    var fragmento = document.createDocumentFragment();

    if (!lista.length) {
      fragmento.appendChild(estadoVazio());
    } else {
      lista.forEach(function (produto) {
        fragmento.appendChild(CardProduto.criar(produto, tplCard));
      });
    }

    grid.textContent = '';
    grid.appendChild(fragmento);

    saidaContagem.textContent = lista.length === 1
      ? '1 produto encontrado'
      : lista.length + ' produtos encontrados';

    atualizarContagensFacetas();
    atualizarContadorAtivos();
  }

  /* --------------------------------------------------- contagens e estado dos filtros */

  function contarPor(chave, valor) {
    return produtos.filter(function (produto) {
      switch (chave) {
        case 'categoria': return produto.categoria.slug === valor;
        case 'condicao': return produto.condicao === valor;
        case 'colecao': return slugsDasColecoes(produto).indexOf(valor) > -1;
        case 'caimento': return produto.caimento === valor;
        case 'tamanho': return produto.tamanhos.indexOf(valor) > -1;
        case 'cor': return produto.familias.indexOf(valor) > -1;
        default: return false;
      }
    }).length;
  }

  function atualizarContagensFacetas() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-contagem]'), function (alvo) {
      var partes = alvo.dataset.contagem.split(':');
      alvo.textContent = contarPor(partes[0], partes[1]);
    });
  }

  function atualizarContadorAtivos() {
    if (!contadorFiltros) return;
    var f = estado.filtros;
    var total = f.categoria.length + f.condicao.length + f.colecao.length +
      f.caimento.length + f.tamanho.length + f.cor.length;
    var faixaTocada = (f.precoMin > Number(precoMin.min)) || (f.precoMax < Number(precoMax.max));
    if (faixaTocada) total++;

    contadorFiltros.hidden = total === 0;
    contadorFiltros.textContent = total ? '(' + total + ')' : '';
  }

  /* ---------------------------------------------------------------- faixa de preço */

  function sincronizarFaixa(origem) {
    var min = Number(precoMin.value);
    var max = Number(precoMax.value);
    var passo = Number(precoMin.step) || 1;

    if (min > max - passo) {
      if (origem === precoMin) { min = max - passo; precoMin.value = String(min); }
      else { max = min + passo; precoMax.value = String(max); }
    }

    var teto = Number(precoMax.max);
    progresso.style.left = ((min / teto) * 100) + '%';
    progresso.style.width = (((max - min) / teto) * 100) + '%';

    saidaMin.textContent = 'R$ ' + min;
    saidaMax.textContent = 'R$ ' + max;
  }

  /* ----------------------------------------------------------------------- ações */

  function limparTudo() {
    if (formFiltros) formFiltros.reset();
    if (precoMin) { precoMin.value = precoMin.min; precoMax.value = precoMax.max; }
    sincronizarFaixa();
    lerFiltrosDaTela();
    renderizar();
  }

  /* -------------------------------------------------------------------- eventos */

  if (formFiltros) {
    formFiltros.addEventListener('input', function (evento) {
      if (evento.target.type === 'range') sincronizarFaixa(evento.target);
      lerFiltrosDaTela();
      renderizar();
    });
    formFiltros.addEventListener('change', function () { lerFiltrosDaTela(); renderizar(); });
    formFiltros.addEventListener('submit', function (evento) { evento.preventDefault(); });
  }

  if (seletorOrdem) seletorOrdem.addEventListener('change', function () { lerFiltrosDaTela(); renderizar(); });
  if (btnLimpar) btnLimpar.addEventListener('click', limparTudo);

  /* As interações dos cards (escolher tamanho e favoritar) vêm do card-produto.js:
     a PDP usa exatamente a mesma função no grid de relacionados. */
  if (grid) CardProduto.ligarInteracoesDoGrid(grid);

  /* ------------------------------------------------------------------- API pública */

  window.Vitrine = {
    definirBusca: function (termo) { estado.termo = termo || ''; renderizar(); },
    limparFiltros: limparTudo,
    reordenar: function (valor) {
      if (seletorOrdem) seletorOrdem.value = valor;
      lerFiltrosDaTela();
      renderizar();
    },
    resultados: resultados,
    renderizar: renderizar
  };

  /* ---------------------------------------------------------------------- start */

  if (precoMin && precoMax) {
    var faixa = loja.faixaPreco || { min: 0, max: 700, passo: 10 };
    precoMin.min = faixa.min; precoMax.min = faixa.min;
    precoMin.max = faixa.max; precoMax.max = faixa.max;
    precoMin.step = faixa.passo; precoMax.step = faixa.passo;
    precoMin.value = faixa.min; precoMax.value = faixa.max;
    sincronizarFaixa();
  }
  lerFiltrosDaTela();
  renderizar();
})();
