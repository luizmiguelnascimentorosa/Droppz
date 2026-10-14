/* =====================================================================================
   LOJA ÚNICA · js/app.js
   Interface global: sacola no header, gavetas, busca, simulação de frete por CEP,
   toasts e acessibilidade dos diálogos (foco preso + ESC + devolução de foco).
   ===================================================================================== */
(function () {
  'use strict';

  var $ = function (seletor, escopo) { return (escopo || document).querySelector(seletor); };
  var $$ = function (seletor, escopo) {
    return Array.prototype.slice.call((escopo || document).querySelectorAll(seletor));
  };

  var loja = window.LOJA || { marca: { nome: 'SUA MARCA' }, entrega: { freteGratisAcima: 349, fretePadrao: 24.9 } };

  var overlay = $('#overlay');
  var gavetaAberta = null;
  var elementoComFocoAnterior = null;

  /* ==================================================================== TOASTS */

  var regiaoToast = $('#toast-regiao');

  function avisar(mensagem, opcoes) {
    if (!regiaoToast) return;
    var config = opcoes || {};
    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', config.erro ? 'alert' : 'status');

    if (!config.erro) {
      toast.insertAdjacentHTML('afterbegin',
        '<svg class="toast__icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
        'stroke-width="2" aria-hidden="true"><path d="M20 7 9.5 17.5 4 12"></path></svg>');
    }

    var texto = document.createElement('span');
    texto.textContent = mensagem;
    toast.appendChild(texto);
    regiaoToast.appendChild(toast);

    requestAnimationFrame(function () { toast.classList.add('visivel'); });
    window.setTimeout(function () {
      toast.classList.remove('visivel');
      window.setTimeout(function () { toast.remove(); }, 260);
    }, config.duracao || 3200);
  }

  /* ==================================================================== GAVETAS */

  function focaveis(container) {
    return $$('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex="0"]', container)
      .filter(function (elemento) { return elemento.offsetParent !== null || elemento === document.activeElement; });
  }

  function abrirGaveta(elemento, gatilho) {
    if (!elemento || gavetaAberta === elemento) return;

    elementoComFocoAnterior = gatilho || document.activeElement;
    elemento.hidden = false;
    if (overlay) overlay.hidden = false;

    requestAnimationFrame(function () {
      elemento.classList.add('aberto');
      if (overlay) overlay.classList.add('visivel');
    });

    document.body.classList.add('sem-scroll');
    if (gatilho) gatilho.setAttribute('aria-expanded', 'true');
    gavetaAberta = elemento;

    var primeiro = focaveis(elemento)[0];
    if (primeiro) primeiro.focus();
    else { elemento.setAttribute('tabindex', '-1'); elemento.focus(); }
  }

  function fecharGaveta() {
    if (!gavetaAberta) return;
    var elemento = gavetaAberta;
    gavetaAberta = null;

    elemento.classList.remove('aberto');
    if (overlay) overlay.classList.remove('visivel');

    window.setTimeout(function () {
      elemento.hidden = true;
      if (overlay) overlay.hidden = true;
    }, 320);

    document.body.classList.remove('sem-scroll');

    $$('[aria-expanded="true"][aria-controls]').forEach(function (botao) {
      var alvo = document.getElementById(botao.getAttribute('aria-controls'));
      if (alvo === elemento) botao.setAttribute('aria-expanded', 'false');
    });

    if (elementoComFocoAnterior && document.contains(elementoComFocoAnterior)) {
      elementoComFocoAnterior.focus();
    }
    elementoComFocoAnterior = null;
  }

  if (overlay) overlay.addEventListener('click', fecharGaveta);

  document.addEventListener('keydown', function (evento) {
    if (evento.key === 'Escape' && gavetaAberta) { fecharGaveta(); return; }

    if (evento.key === 'Tab' && gavetaAberta) {
      var lista = focaveis(gavetaAberta);
      if (!lista.length) return;
      var primeiro = lista[0];
      var ultimo = lista[lista.length - 1];
      if (evento.shiftKey && document.activeElement === primeiro) { evento.preventDefault(); ultimo.focus(); }
      else if (!evento.shiftKey && document.activeElement === ultimo) { evento.preventDefault(); primeiro.focus(); }
    }
  });

  $$('[data-fechar]').forEach(function (botao) {
    botao.addEventListener('click', fecharGaveta);
  });

  /* ==================================================================== FRETE (CEP) */
  /* A REGRA de frete mora em js/frete.js, porque três telas usam a mesma conta:
     a sidebar da home, a gaveta da sacola e o produto.html. Aqui só ligamos o campo. */

  var entradaCep = $('#cep-frete');
  var saidaCep = $('#cep-resultado');

  if (entradaCep && saidaCep && window.Frete) {
    entradaCep.addEventListener('input', function () {
      entradaCep.value = Frete.formatarCep(entradaCep.value);

      if (Frete.apenasDigitos(entradaCep.value).length < 8) {
        saidaCep.textContent = '';
        return;
      }

      var estimativa = Frete.estimar(entradaCep.value);
      saidaCep.textContent = estimativa
        ? Frete.descrever(estimativa)
        : 'CEP não encontrado. Confira os 8 dígitos.';
    });
  }

  /* ==================================================================== SACOLA */

  var drawerSacola = $('#drawer-sacola');
  var botaoSacola = $('#abrir-sacola');
  var badgeSacola = $('#sacola-badge');
  var anuncioSacola = $('#sacola-anuncio');
  var corpoSacola = $('#sacola-corpo');
  var resumoSacola = $('#sacola-resumo');
  var subtotalEl = $('#sacola-subtotal');
  var freteEl = $('#sacola-frete');
  var totalEl = $('#sacola-total');
  var tplItem = $('#tpl-item-sacola');

  function desenharSacola() {
    var itens = Sacola.listar();
    var resumo = Sacola.resumo();

    badgeSacola.textContent = resumo.pecas > 99 ? '99+' : String(resumo.pecas);
    badgeSacola.dataset.vazio = resumo.pecas === 0 ? 'true' : 'false';
    if (anuncioSacola) anuncioSacola.textContent = resumo.pecas + ' item(ns) na sacola';

    resumoSacola.textContent = resumo.pecas === 0
      ? 'Nenhum item'
      : resumo.pecas + (resumo.pecas === 1 ? ' peça' : ' peças') +
        ' · ' + resumo.linhas + (resumo.linhas === 1 ? ' modelo' : ' modelos');

    corpoSacola.textContent = '';

    if (!itens.length) {
      var vazia = document.createElement('div');
      vazia.className = 'sacola-vazia';
      vazia.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">' +
        '<path d="M5.5 8h13l-1 12.2a1.6 1.6 0 0 1-1.6 1.5H8.1a1.6 1.6 0 0 1-1.6-1.5z"></path>' +
        '<path d="M9 8V6.4a3 3 0 0 1 6 0V8"></path></svg>' +
        '<h3>Sua sacola está vazia</h3>' +
        '<p class="texto-sm">Escolha tamanho e cor direto no card do produto.</p>';
      var verProdutos = document.createElement('a');
      verProdutos.className = 'btn btn--contorno';
      verProdutos.href = '#vitrine';
      verProdutos.textContent = 'Ver produtos';
      verProdutos.addEventListener('click', fecharGaveta);
      vazia.appendChild(verProdutos);
      corpoSacola.appendChild(vazia);
    } else {
      var lista = document.createElement('ul');
      lista.className = 'lista-sacola';

      itens.forEach(function (item) {
        var no = tplItem.content.firstElementChild.cloneNode(true);
        no.dataset.itemId = item.id;

        var imagem = no.querySelector('.item-sacola__imagem');
        imagem.src = item.imagem;
        imagem.alt = item.imagemAlt || item.titulo;

        no.querySelector('.item-sacola__titulo').textContent = item.titulo;
        no.querySelector('.item-sacola__variacao').textContent =
          'Tam ' + (item.tamanho === 'Unico' ? 'Único' : item.tamanho) + ' · ' + item.cor;
        no.querySelector('.item-sacola__vendedor').textContent = 'Enviado por ' + loja.marca.nome;
        no.querySelector('.controle-qtd output').textContent = item.quantidade;
        no.querySelector('.preco').textContent = Sacola.moeda(item.preco * item.quantidade);

        lista.appendChild(no);
      });

      corpoSacola.appendChild(lista);
    }

    /* A regra de frete vem do módulo Frete — a mesma usada na PDP e na sidebar. */
    var frete = window.Frete
      ? Frete.calcularParaSubtotal(resumo.subtotal)
      : { valor: 0, gratis: false, indeterminado: true };

    subtotalEl.textContent = Sacola.moeda(resumo.subtotal);
    freteEl.textContent = frete.indeterminado
      ? 'informe o CEP no checkout'
      : (frete.gratis ? 'Grátis' : Sacola.moeda(frete.valor));
    totalEl.textContent = Sacola.moeda(resumo.subtotal + frete.valor);
  }

  document.addEventListener('sacola:alterada', function () {
    desenharSacola();
    badgeSacola.classList.remove('pulsar');
    void badgeSacola.offsetWidth; // reinicia a animação
    badgeSacola.classList.add('pulsar');
  });

  if (botaoSacola && drawerSacola) {
    botaoSacola.addEventListener('click', function () { abrirGaveta(drawerSacola, botaoSacola); });
  }

  if (corpoSacola) {
    corpoSacola.addEventListener('click', function (evento) {
      var botao = evento.target.closest('[data-acao]');
      if (!botao) return;

      var linha = botao.closest('[data-item-id]');
      if (!linha) return;
      var id = linha.dataset.itemId;
      var item = Sacola.listar().filter(function (i) { return i.id === id; })[0];
      if (!item) return;

      switch (botao.dataset.acao) {
        case 'aumentar':
          Sacola.definirQuantidade(id, item.quantidade + 1);
          break;
        case 'diminuir':
          Sacola.definirQuantidade(id, item.quantidade - 1);
          break;
        case 'remover':
          Sacola.remover(id);
          avisar('Item removido da sacola.');
          break;
      }
    });
  }

  /* Adicionar à sacola: um listener no DOCUMENTO cobre qualquer grid de cards,
     em qualquer página (home e "você também pode gostar" na PDP). Antes ele estava
     preso ao id #grid-produtos — o que só funcionava na home. */
  document.addEventListener('click', function (evento) {
    var botao = evento.target.closest('[data-acao="adicionar"]');
    if (!botao) return;

    var card = botao.closest('[data-produto-id]');
    if (!card) return;
    var produtoId = Number(card.dataset.produtoId);
    var produto = (loja.produtos || []).filter(function (p) { return p.id === produtoId; })[0];
    if (!produto) return;

    var escolhido = card.querySelector('.card__tamanho[aria-pressed="true"]');
    var tamanho = escolhido ? escolhido.dataset.tamanho : produto.tamanhos[0];

    Sacola.adicionar(produto, { tamanho: tamanho });
    var nomeCurto = produto.titulo.length > 34 ? produto.titulo.slice(0, 34) + '…' : produto.titulo;
    avisar(nomeCurto + ' · tam ' + (tamanho === 'Unico' ? 'Único' : tamanho) + ' na sacola.');
    abrirGaveta(drawerSacola, botaoSacola);
  });

  /* ==================================================================== BUSCA */

  var formBusca = $('#form-busca');
  var entradaBusca = $('#entrada-busca');
  var temporizadorBusca = null;
  /* Nem toda página tem vitrine (guia de medidas, sobre, 404). Antes de agir,
     conferimos se o elemento existe — foi assim que este arquivo quebraria aqui. */
  var temVitrine = !!$('#grid-produtos');

  function buscar(termo) {
    if (window.Vitrine && temVitrine) window.Vitrine.definirBusca(termo);
  }

  if (formBusca) {
    formBusca.addEventListener('submit', function (evento) {
      evento.preventDefault();
      var termo = entradaBusca.value.trim();

      // Página sem catálogo: leva a busca para a home com o termo na URL (?q=...).
      if (!temVitrine) {
        window.location.href = 'index.html?q=' + encodeURIComponent(termo);
        return;
      }

      buscar(termo);
      document.getElementById('vitrine').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  if (entradaBusca && temVitrine) {
    entradaBusca.addEventListener('input', function () {
      window.clearTimeout(temporizadorBusca);
      temporizadorBusca = window.setTimeout(function () { buscar(entradaBusca.value); }, 220);
    });

    // Atalho "/" foca a busca (padrão de e-commerce).
    document.addEventListener('keydown', function (evento) {
      if (evento.key !== '/' || gavetaAberta) return;
      var alvo = evento.target;
      var digitando = alvo && (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA' || alvo.isContentEditable);
      if (digitando) return;
      evento.preventDefault();
      entradaBusca.focus();
    });

    // Busca vinda da URL: index.html?q=camiseta já abre filtrado.
    var termoInicial = new URLSearchParams(window.location.search).get('q');
    if (termoInicial) {
      entradaBusca.value = termoInicial;
      buscar(termoInicial);
    }
  }

  /* ============================================================ FILTROS E MENU MOBILE */

  var painelFiltros = $('#filtros');
  var botaoFiltros = $('#abrir-filtros');
  var menuLateral = $('#menu-lateral');
  var botaoMenu = $('#abrir-menu');

  if (botaoFiltros && painelFiltros) {
    botaoFiltros.addEventListener('click', function () { abrirGaveta(painelFiltros, botaoFiltros); });
  }

  if (botaoMenu && menuLateral) {
    botaoMenu.addEventListener('click', function () { abrirGaveta(menuLateral, botaoMenu); });
  }

  if (painelFiltros) {
    painelFiltros.addEventListener('change', function () {
      if (window.matchMedia('(max-width: 1024px)').matches && gavetaAberta === painelFiltros) {
        window.setTimeout(fecharGaveta, 220);
      }
    });
  }

  /* ============================================================ LINKS EM CONSTRUÇÃO */

  document.addEventListener('click', function (evento) {
    var link = evento.target.closest('[data-pagina-futura]');
    if (!link) return;
    evento.preventDefault();
    avisar('A página "' + link.dataset.paginaFutura + '" entra na próxima etapa do projeto.');
  });

  /* ==================================================================== NEWSLETTER */

  var formNewsletter = $('#form-newsletter');
  if (formNewsletter) {
    formNewsletter.addEventListener('submit', function (evento) {
      evento.preventDefault();
      var email = $('#newsletter-email').value.trim();
      if (!email) return;
      avisar('Pronto! Vamos avisar você no ' + email + ' antes de cada drop.');
      formNewsletter.reset();
    });
  }

  /* ======================================================================== START */

  /* ========================================================== API PARA OUTRAS TELAS */
  /* A PDP precisa avisar (toast) e abrir a sacola. Em vez de deixar essas funções
     "soltas" no escopo do arquivo, expomos só o necessário — uma API pequena e explícita
     é melhor do que outra tela tentar alcançar as tripas deste arquivo. */
  window.UI = {
    avisar: avisar,
    abrirSacola: function (gatilho) { abrirGaveta(drawerSacola, gatilho || botaoSacola); },
    fecharGaveta: fecharGaveta
  };

  desenharSacola();
})();
