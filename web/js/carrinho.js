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

  // Resumo: frete, desconto e os campos que alimentam a conta
  var campoFrete     = document.getElementById('carrinho-frete');
  var linhaDesconto  = document.getElementById('carrinho-desconto-linha');
  var campoDesconto  = document.getElementById('carrinho-desconto');
  var campoCep       = document.getElementById('carrinho-cep');
  var botaoCalcular  = document.getElementById('carrinho-calcular-frete');
  var resultadoFrete = document.getElementById('carrinho-frete-resultado');
  var campoCupom     = document.getElementById('carrinho-cupom');
  var botaoAplicar   = document.getElementById('carrinho-aplicar-cupom');
  var resultadoCupom = document.getElementById('carrinho-cupom-resultado');

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

    /* Trava o "+" no limite do estoque. O estoqueMaximo vem do produto e está
       guardado dentro do próprio item da sacola (foi copiado no momento em que
       a peça entrou). */
    var botaoMais = linha.querySelector('[data-acao="aumentar"]');
    var noLimite = item.quantidade >= (item.estoqueMaximo || 99);
    botaoMais.disabled = noLimite;
    if (noLimite) botaoMais.title = 'Só temos ' + item.estoqueMaximo + ' em estoque';

    return linha;
  }

  /* A conta do total mora AQUI, num lugar só: subtotal − desconto + frete.
     Se a regra do cupom mudar um dia, é só aqui que muda. */
  function calcularTotais(subtotal, frete) {
    var desconto = 0;
    var cupomVale = !!cupomAtual && subtotal >= cupomAtual.minimo;

    if (cupomVale) {
      if (cupomAtual.tipo === 'porcentagem') desconto = subtotal * (cupomAtual.valor / 100);
      else if (cupomAtual.tipo === 'fixo') desconto = Math.min(cupomAtual.valor, subtotal);
    }

    var valorFrete = frete ? frete.valor : 0;
    if (cupomVale && cupomAtual.tipo === 'frete') valorFrete = 0;

    return {
      desconto: desconto,
      frete: valorFrete,
      cupomVale: cupomVale,
      total: Math.max(0, subtotal - desconto + valorFrete)
    };
  }

  function atualizarResumo() {
    var resumo = Sacola.resumo();

    /* O frete é RECALCULADO a cada mudança da sacola. Guardar o valor do frete (em vez
       do CEP) deixaria a tela mentindo: um carrinho com frete grátis que perde uma peça
       precisaria voltar a cobrar o frete. */
    var frete = cepAtual ? Frete.paraCep(cepAtual, resumo.subtotal) : null;
    var contas = calcularTotais(resumo.subtotal, frete);
    var freteSaiDeGraca = !!frete && (frete.gratis || (contas.cupomVale && cupomAtual.tipo === 'frete'));

    campoSubtotal.textContent = Sacola.moeda(resumo.subtotal);

    if (campoFrete) {
      campoFrete.textContent = !frete
        ? 'calcule pelo CEP'
        : (freteSaiDeGraca ? 'Grátis' : Sacola.moeda(contas.frete));
    }

    /* A mensagem do frete também é reescrita aqui, porque "grátis" pode ter mudado
       com a quantidade. */
    if (resultadoFrete && frete) {
      resultadoFrete.textContent = frete.gratis
        ? 'Frete grátis · ' + frete.regiao + ' · ' + frete.prazoMin +
          ' a ' + frete.prazoMax + ' dias úteis'
        : Frete.descrever(frete);   // texto pronto do módulo: nenhuma tela inventa formato
      limparAviso(resultadoFrete);
      resultadoFrete.classList.add('carrinho__aviso--ok');
    }

    /* A linha "Desconto" só aparece quando existe desconto de verdade. */
    if (linhaDesconto) {
      linhaDesconto.hidden = contas.desconto <= 0;
      if (campoDesconto) campoDesconto.textContent = '− ' + Sacola.moeda(contas.desconto);
    }

    /* Cupom que deixou de valer porque o subtotal caiu abaixo do mínimo:
       avisa em vez de simplesmente parar de aplicar sem explicação. */
    if (cupomAtual && !contas.cupomVale && resultadoCupom) {
      resultadoCupom.textContent = 'O cupom ' + cupomAtual.codigo + ' não vale mais: ' +
        'o mínimo é ' + Sacola.moeda(cupomAtual.minimo) + '.';
      limparAviso(resultadoCupom);
      resultadoCupom.classList.add('carrinho__aviso--erro');
    }

    campoTotal.textContent = Sacola.moeda(contas.total);

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

  /* ---------- Quantidade e remoção ---------- */

  function avisarRemocao() {
    /* window.UI vive no app.js, que carrega DEPOIS deste arquivo — por isso a
       checagem é feita aqui, na hora do clique, e não no topo do arquivo. */
    if (window.UI) UI.avisar('Peça removida da sacola.');
  }

  /* Um listener só, no <ul>, cobrindo todas as linhas — inclusive as que ainda
     serão criadas nas próximas renderizações. É o mesmo padrão da gaveta
     (js/app.js): não amarramos um evento em cada botão. */
  lista.addEventListener('click', function (evento) {
    var botao = evento.target.closest('[data-acao]');
    if (!botao) return;

    var linha = botao.closest('[data-item-id]');
    if (!linha) return;

    var id = linha.dataset.itemId;
    var item = Sacola.listar().filter(function (i) { return i.id === id; })[0];
    if (!item) return;   // linha de um item que já saiu da sacola

    if (botao.dataset.acao === 'remover') {
      Sacola.remover(id);
      avisarRemocao();
      return;
    }

    /* O sacola.js decide as regras: limita ao estoque e, se a quantidade chegar
       a zero, remove a linha. Aqui só dizemos "mais um" ou "menos um". */
    var novaQuantidade = item.quantidade + (botao.dataset.acao === 'aumentar' ? 1 : -1);
    Sacola.definirQuantidade(id, novaQuantidade);

    if (novaQuantidade <= 0) avisarRemocao();
  });

  /* ---------- Frete e cupom ---------- */

  /* ⚠️ SIMULAÇÃO DE FRONT. No back-end isto vira uma rota que valida o cupom e devolve
     o valor final — preço, frete e desconto NUNCA podem ser decididos pelo navegador:
     qualquer pessoa abre o DevTools e muda o que quiser. */
  var CUPONS = {
    'DROPPZ10':       { tipo: 'porcentagem', valor: 10, minimo: 200, como: '10% de desconto' },
    'PRIMEIRACOMPRA': { tipo: 'fixo',        valor: 30, minimo: 250, como: 'R$ 30 de desconto' },
    'FRETEGRATIS':    { tipo: 'frete',       valor: 0,  minimo: 0,   como: 'frete grátis' }
  };

  var cepAtual = null;     // último CEP que passou na validação
  var cupomAtual = null;   // { codigo, tipo, valor, minimo }

  function limparAviso(elemento) {
    if (!elemento) return;
    elemento.classList.remove('carrinho__aviso--erro', 'carrinho__aviso--ok');
  }

  function calcularFrete() {
    limparAviso(resultadoFrete);

    if (!Frete.estimar(campoCep.value)) {
      cepAtual = null;
      resultadoFrete.textContent = 'CEP não encontrado. Confira os 8 dígitos.';
      resultadoFrete.classList.add('carrinho__aviso--erro');
      atualizarResumo();
      return;
    }

    /* Guardamos o CEP, não o valor: o valor é recalculado a cada mudança da sacola,
       porque o frete grátis depende do subtotal. Quem escreve a mensagem é o resumo. */
    cepAtual = Frete.formatarCep(campoCep.value);
    atualizarResumo();
  }

  function aplicarCupom() {
    var codigo = (campoCupom.value || '').trim().toUpperCase();
    if (!codigo) return;

    var subtotal = Sacola.subtotal();
    var cupom = CUPONS[codigo];

    limparAviso(resultadoCupom);

    if (!cupom) {
      cupomAtual = null;
      resultadoCupom.textContent = 'Cupom "' + codigo + '" não encontrado.';
      resultadoCupom.classList.add('carrinho__aviso--erro');
      atualizarResumo();
      return;
    }

    if (subtotal < cupom.minimo) {
      cupomAtual = null;
      resultadoCupom.textContent = 'Este cupom vale a partir de ' +
        Sacola.moeda(cupom.minimo) + ' em produtos.';
      resultadoCupom.classList.add('carrinho__aviso--erro');
      atualizarResumo();
      return;
    }

    cupomAtual = { codigo: codigo, tipo: cupom.tipo, valor: cupom.valor, minimo: cupom.minimo };
    resultadoCupom.textContent = 'Cupom ' + codigo + ' aplicado · ' + cupom.como + '.';
    resultadoCupom.classList.add('carrinho__aviso--ok');
    atualizarResumo();
  }

  if (campoCep && botaoCalcular && resultadoFrete && window.Frete) {
    /* Máscara enquanto digita. O módulo cuida do formato (01310-100) e da validação —
       aqui só ligamos o campo, igual ao app.js faz na PDP. */
    campoCep.addEventListener('input', function () {
      campoCep.value = Frete.formatarCep(campoCep.value);
      limparAviso(resultadoFrete);
      resultadoFrete.textContent = '';
    });

    botaoCalcular.addEventListener('click', calcularFrete);

    campoCep.addEventListener('keydown', function (evento) {
      if (evento.key === 'Enter') { evento.preventDefault(); calcularFrete(); }
    });
  }

  if (campoCupom && botaoAplicar && resultadoCupom) {
    botaoAplicar.addEventListener('click', aplicarCupom);

    campoCupom.addEventListener('keydown', function (evento) {
      if (evento.key === 'Enter') { evento.preventDefault(); aplicarCupom(); }
    });
  }

  renderizar();

  /* ⚠️ Sem esta linha, mudar a quantidade pela GAVETA do cabeçalho não atualizaria
     esta página: o dado mudaria no localStorage e a tela ficaria velha. O sacola.js
     avisa todo mundo com este evento a cada alteração. */
  document.addEventListener('sacola:alterada', renderizar);
})();
