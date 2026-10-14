/* =====================================================================================
   LOJA ÚNICA · js/produto.js
   PDP (Product Detail Page): lê o ?slug= da URL, monta a página e liga a compra.

   Este arquivo é o melhor exemplo de "estado da interface" do projeto:
     · a URL diz QUAL produto mostrar;
     · o objeto `estado` guarda o que o cliente escolheu (tamanho, cor, foto);
     · cada mudança de estado só redesenha o pedaço que mudou.

   Depende de: config.js, dados.js, sacola.js, favoritos.js, frete.js, card-produto.js, app.js
   ===================================================================================== */
(function () {
  'use strict';

  var loja = window.LOJA || {};
  var produtos = loja.produtos || [];

  /* ---------------------------------------------------------------- 1. QUAL PRODUTO */

  /* URLSearchParams lê a query string: em produto.html?slug=regata-canelada-essencial
     ele devolve "regata-canelada-essencial". */
  var parametros = new URLSearchParams(window.location.search);
  var slug = parametros.get('slug');
  var produto = produtos.filter(function (p) { return p.slug === slug; })[0];

  var raiz = document.getElementById('pdp');
  var indisponivel = document.getElementById('pdp-indisponivel');
  var secaoRelacionados = document.getElementById('pdp-relacionados-secao');

  if (!produto) {
    // Sem produto válido: esconde a PDP (e as seções de detalhes) e mostra o aviso.
    // Nunca uma página em branco nem uma seção vazia esquecida.
    if (raiz) raiz.hidden = true;
    if (secaoRelacionados) secaoRelacionados.hidden = true;
    var detalhes = document.getElementById('pdp-detalhes');
    if (detalhes) detalhes.hidden = true;
    if (indisponivel) indisponivel.hidden = false;
    if (slug && indisponivel) {
      var alvo = document.getElementById('pdp-indisponivel-slug');
      if (alvo) alvo.textContent = slug;
    }
    document.title = 'Produto não encontrado — ' + (loja.marca ? loja.marca.nome : 'Loja');
    return;
  }

  /* ------------------------------------------------------------------- 2. ESTADO */

  var estado = {
    tamanho: produto.tamanhos[0],
    cor: produto.cores[0].nome,
    foto: 0
  };

  var imagens = (produto.imagens && produto.imagens.length) ? produto.imagens : [produto.imagem];

  /* Atalho para não repetir document.getElementById em cada função. */
  function $(seletor) { return document.querySelector(seletor); }

  function texto(seletor, valor) {
    var el = $(seletor);
    if (el) el.textContent = valor;
  }

  function limpar(el) { if (el) el.textContent = ''; }

  /* ------------------------------------------------- A. SEO e título da aba (grátis) */

  function atualizarCabecalhoDoDocumento() {
    document.title = produto.titulo + ' — ' + (loja.marca ? loja.marca.nome : 'Loja');
    var meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content',
        produto.tecido.composicao + ', ' + produto.tecido.gramatura + ' g/m². ' +
        produto.imagemAlt + '. Frete grátis acima de R$ ' + Frete.freteGratisAcima + '.');
    }
  }

  /* --------------------------------------------------------------- B. Cabeçalho */

  function montarCabecalho() {
    texto('#pdp-colecao', produto.categoria.nome + ' · ' +
      (produto.colecoes || []).map(function (c) { return c.nome; }).join(' / '));

    texto('#pdp-titulo', produto.titulo);

    var trilha = $('#pdp-trilha-categoria');
    if (trilha) {
      trilha.textContent = produto.categoria.nome;
      trilha.setAttribute('href', 'index.html?q=' + encodeURIComponent(produto.categoria.nome));
    }

    var notaEl = $('#pdp-avaliacao');
    if (notaEl) {
      limpar(notaEl);
      var estrelas = document.createElement('span');
      estrelas.className = 'estrelas';
      estrelas.setAttribute('aria-hidden', 'true');
      estrelas.textContent = '★★★★★'.slice(0, Math.round(produto.nota)) +
        '☆☆☆☆☆'.slice(0, 5 - Math.round(produto.nota));
      notaEl.appendChild(estrelas);
      notaEl.appendChild(document.createTextNode(
        ' ' + produto.nota.toFixed(1).replace('.', ',') + ' · ' + produto.avaliacoes + ' avaliações'
      ));
    }
  }

  /* ------------------------------------------------------------------ C. Galeria */

  function mostrarFoto(indice) {
    estado.foto = indice;
    var principal = $('#pdp-foto');
    if (principal) {
      principal.src = imagens[indice];
      principal.alt = produto.imagemAlt || produto.titulo;
    }
    Array.prototype.forEach.call(document.querySelectorAll('#pdp-miniaturas [data-foto]'), function (botao) {
      botao.setAttribute('aria-current', Number(botao.dataset.foto) === indice ? 'true' : 'false');
    });
  }

  function montarGaleria() {
    var caixaMiniaturas = $('#pdp-miniaturas');
    if (!caixaMiniaturas) return;

    limpar(caixaMiniaturas);

    // Uma foto só: não faz sentido mostrar miniaturas.
    if (imagens.length < 2) {
      caixaMiniaturas.hidden = true;
    } else {
      caixaMiniaturas.hidden = false;
      imagens.forEach(function (url, indice) {
        var botao = document.createElement('button');
        botao.type = 'button';
        botao.className = 'pdp__miniatura';
        botao.dataset.foto = indice;
        botao.setAttribute('aria-label', 'Ver foto ' + (indice + 1) + ' de ' + imagens.length);
        botao.setAttribute('aria-current', indice === 0 ? 'true' : 'false');
        var img = document.createElement('img');
        img.src = url;
        img.alt = '';
        img.width = 76;
        img.height = 95;
        img.loading = 'lazy';
        botao.appendChild(img);
        botao.addEventListener('click', function () { mostrarFoto(indice); });
        caixaMiniaturas.appendChild(botao);
      });
    }

    mostrarFoto(0);
  }

  /* ---------------------------------------------------------------- D. Preço */

  function montarPreco() {
    var desconto = CardProduto.calcularDesconto(produto);

    var antigo = $('#pdp-preco-antigo');
    if (antigo) {
      if (produto.precoAntigo) {
        antigo.textContent = 'de ' + Sacola.moeda(produto.precoAntigo);
        antigo.hidden = false;
      } else {
        antigo.hidden = true;
      }
    }

    texto('#pdp-preco', Sacola.moeda(produto.preco));
    texto('#pdp-parcelas', 'ou ' + produto.parcelas + 'x de ' +
      Sacola.parcela(produto.preco, produto.parcelas) + ' sem juros');

    var seloDesconto = $('#pdp-desconto');
    if (seloDesconto) {
      seloDesconto.hidden = desconto < 10;
      seloDesconto.textContent = '-' + desconto + '%';
    }

    // Preço no Pix com 5% de desconto (regra da loja, aqui só para exibição).
    var pix = produto.preco * 0.95;
    texto('#pdp-pix', Sacola.moeda(pix) + ' no Pix (5% de desconto)');
  }

  /* ----------------------------------------------------------------- E. Cores */

  function montarCores() {
    var caixa = $('#pdp-cores');
    if (!caixa) return;
    limpar(caixa);

    produto.cores.forEach(function (cor) {
      var botao = document.createElement('button');
      botao.type = 'button';
      botao.className = 'opcao-cor';
      botao.dataset.cor = cor.nome;
      botao.setAttribute('aria-pressed', cor.nome === estado.cor ? 'true' : 'false');
      botao.setAttribute('aria-label', 'Cor ' + cor.nome);

      var amostra = document.createElement('span');
      amostra.className = 'opcao-cor__amostra';
      amostra.style.background = cor.hex;
      botao.appendChild(amostra);

      var rotulo = document.createElement('span');
      rotulo.className = 'opcao-cor__nome';
      rotulo.textContent = cor.nome;
      botao.appendChild(rotulo);

      botao.addEventListener('click', function () {
        estado.cor = cor.nome;
        Array.prototype.forEach.call(caixa.children, function (outro) {
          outro.setAttribute('aria-pressed', outro === botao ? 'true' : 'false');
        });
        texto('#pdp-cor-atual', cor.nome);
      });

      caixa.appendChild(botao);
    });

    texto('#pdp-cor-atual', estado.cor);
  }

  /* ------------------------------------------------------------- F. Tamanhos */

  var ANCORA_MEDIDAS = {
    camisetas: '#camisetas',
    regatas: '#regatas',
    moletons: '#moletons',
    calcas: '#calcas',
    bones: '#bones'
  };

  function montarTamanhos() {
    var caixa = $('#pdp-tamanhos');
    if (!caixa) return;
    limpar(caixa);

    produto.tamanhos.forEach(function (sigla) {
      var botao = document.createElement('button');
      botao.type = 'button';
      botao.className = 'opcao-tamanho';
      botao.dataset.tamanho = sigla;
      botao.setAttribute('aria-pressed', sigla === estado.tamanho ? 'true' : 'false');
      botao.textContent = sigla === 'Unico' ? 'Único' : sigla;

      botao.addEventListener('click', function () {
        estado.tamanho = sigla;
        Array.prototype.forEach.call(caixa.children, function (outro) {
          outro.setAttribute('aria-pressed', outro === botao ? 'true' : 'false');
        });
        texto('#pdp-tamanho-atual', sigla === 'Unico' ? 'Único' : sigla);
      });

      caixa.appendChild(botao);
    });

    texto('#pdp-tamanho-atual', estado.tamanho === 'Unico' ? 'Único' : estado.tamanho);

    /* Link do guia de medidas ancorado NA TABELA da categoria certa. */
    var guia = $('#pdp-guia');
    if (guia) {
      guia.setAttribute('href', 'guia-de-medidas.html' + (ANCORA_MEDIDAS[produto.categoria.slug] || ''));
    }
  }

  /* --------------------------------------------------------------- G. Estoque */

  function montarEstoque() {
    var aviso = $('#pdp-estoque');
    if (!aviso) return;

    if (produto.estoque <= 0) {
      aviso.textContent = 'Esgotado nesta coleção';
      aviso.className = 'pdp__estoque pdp__estoque--esgotado';
      [ $('#pdp-adicionar'), $('#pdp-comprar') ].forEach(function (botao) {
        if (botao) botao.setAttribute('aria-disabled', 'true');
      });
      return;
    }

    if (produto.estoque <= 4) {
      aviso.textContent = 'Últimas ' + produto.estoque + ' unidades';
      aviso.className = 'pdp__estoque pdp__estoque--alerta';
    } else {
      aviso.textContent = 'Pronta entrega · ' + produto.estoque + ' unidades em estoque';
      aviso.className = 'pdp__estoque';
    }
  }

  /* ---------------------------------------------------- H. Ficha técnica e texto */

  function montarFicha() {
    var lista = $('#pdp-ficha');
    if (!lista) return;
    limpar(lista);

    var linhas = [
      ['Coleção', (produto.colecoes || []).map(function (c) { return c.nome; }).join(' / ') || '—'],
      ['Tecido', produto.tecido.nome],
      ['Composição', produto.tecido.composicao],
      ['Gramatura', produto.tecido.gramatura ? produto.tecido.gramatura + ' g/m²' : '—'],
      ['Caimento', produto.caimento.charAt(0).toUpperCase() + produto.caimento.slice(1)],
      ['Público', produto.publico],
      ['Condição', produto.condicao === 'novo' ? 'Novo (coleção atual)' : 'Drop antigo — peça nova, nunca usada'],
      ['Proteção UV', produto.tecido.protecaoUv ? 'Sim' : 'Não'],
      ['Cuidados', produto.tecido.cuidadoLavagem || 'Lavar do avesso em água fria.']
    ];

    linhas.forEach(function (par) {
      var linha = document.createElement('div');
      linha.className = 'ficha-tecnica__linha';
      var dt = document.createElement('dt');
      dt.textContent = par[0];
      var dd = document.createElement('dd');
      dd.textContent = par[1];
      linha.appendChild(dt);
      linha.appendChild(dd);
      lista.appendChild(linha);
    });
  }

  /* A descrição real vem do banco (produto.descricao). Como os dados de exemplo ainda
     não têm esse campo, montamos um texto honesto a partir da própria ficha técnica —
     e quando o campo existir, ele tem prioridade. */
  function montarDescricao() {
    var alvo = $('#pdp-descricao');
    if (!alvo) return;
    limpar(alvo);

    var paragrafos = [];

    if (produto.descricao) {
      paragrafos.push(produto.descricao);
    } else {
      paragrafos.push(produto.titulo + ' em ' + produto.tecido.composicao.toLowerCase() +
        (produto.tecido.gramatura ? ' de ' + produto.tecido.gramatura + ' g/m²' : '') +
        ', com caimento ' + produto.caimento + '.');
      paragrafos.push('Ficha técnica completa abaixo: composição, gramatura e cuidados de lavagem ' +
        'ficam sempre visíveis, porque tecido é o que decide se a peça dura dois meses ou dois anos.');
      if (produto.condicao === 'drop_antigo') {
        paragrafos.push('Esta é uma peça de coleção anterior: nova, nunca usada, sem produção futura. ' +
          'Quando o estoque acabar, não volta.');
      }
    }

    paragrafos.forEach(function (textoParagrafo) {
      var p = document.createElement('p');
      p.textContent = textoParagrafo;
      alvo.appendChild(p);
    });
  }

  /* ------------------------------------------------------------- I. Frete (CEP) */

  function montarFrete() {
    var campo = $('#pdp-cep');
    var resultado = $('#pdp-frete-resultado');
    var botao = $('#pdp-calcular-frete');
    if (!campo || !resultado) return;

    campo.addEventListener('input', function () {
      campo.value = Frete.formatarCep(campo.value);
    });

    function calcular() {
      var estimativa = Frete.estimar(campo.value);

      if (!Frete.cepValido(campo.value)) {
        campo.setAttribute('aria-invalid', 'true');
        resultado.textContent = 'Digite um CEP válido com 8 dígitos.';
        resultado.className = 'pdp__frete-resultado pdp__frete-resultado--erro';
        return;
      }

      campo.removeAttribute('aria-invalid');

      var politica = Frete.calcularParaSubtotal(produto.preco);
      var valorFinal = politica.gratis ? 0 : estimativa.valor;
      var regiao = estimativa.regiao;
      var prazo = estimativa.prazoMin + ' a ' + estimativa.prazoMax + ' dias úteis';

      resultado.textContent = valorFinal === 0
        ? 'Frete grátis para ' + regiao + ' · chega em ' + prazo
        : Sacola.moeda(valorFinal) + ' para ' + regiao + ' · chega em ' + prazo;
      resultado.className = 'pdp__frete-resultado';
    }

    if (botao) botao.addEventListener('click', calcular);
    campo.addEventListener('keydown', function (evento) {
      if (evento.key === 'Enter') { evento.preventDefault(); calcular(); }
    });
  }

  /* ------------------------------------------------------------- J. Compra */

  function montarBadges() {
    var caixa = $('#pdp-badges');
    if (!caixa) return;
    limpar(caixa);
    CardProduto.montarBadges(produto, 3).forEach(function (info) {
      var span = document.createElement('span');
      span.className = 'badge ' + info.classe;
      span.textContent = info.texto;
      caixa.appendChild(span);
    });
  }

  function ligarCompra() {
    var botaoAdicionar = $('#pdp-adicionar');
    var botaoComprar = $('#pdp-comprar');
    var botaoFavorito = $('#pdp-favorito');

    function esgotado() { return produto.estoque <= 0; }

    function adicionar() {
      if (esgotado()) return false;
      Sacola.adicionar(produto, { tamanho: estado.tamanho, cor: estado.cor });
      return true;
    }

    if (botaoAdicionar) {
      botaoAdicionar.addEventListener('click', function () {
        if (!adicionar()) return;
        var tamanho = estado.tamanho === 'Unico' ? 'Único' : estado.tamanho;
        if (window.UI) {
          UI.avisar(produto.titulo.slice(0, 30) + '… · ' + estado.cor + ' · ' + tamanho + ' na sacola.');
          UI.abrirSacola(botaoAdicionar);
        }
      });
    }

    if (botaoComprar) {
      botaoComprar.addEventListener('click', function () {
        if (!adicionar()) return;
        /* TODO (próxima etapa): quando o checkout.html existir, troque o bloco abaixo por
             window.location.href = 'checkout.html';
           Mandar o cliente para uma página que não existe é pior do que avisar. */
        if (window.UI) {
          UI.avisar('Checkout entra na próxima etapa — seu item já está na sacola.');
          UI.abrirSacola(botaoComprar);
        }
      });
    }

    if (botaoFavorito) {
      var atualizarFavorito = function () {
        var marcado = Favoritos.ehFavorito(produto.id);
        botaoFavorito.setAttribute('aria-pressed', marcado ? 'true' : 'false');
        botaoFavorito.setAttribute('aria-label', marcado
          ? 'Remover da lista de desejos' : 'Salvar na lista de desejos');
      };
      atualizarFavorito();
      botaoFavorito.addEventListener('click', function () {
        var agora = Favoritos.alternar(produto.id);
        atualizarFavorito();
        if (window.UI) UI.avisar(agora ? 'Salvo na sua lista de desejos.' : 'Removido da lista de desejos.');
      });
    }
  }

  /* -------------------------------------------------- K. Você também pode gostar */

  function montarRelacionados() {
    var container = $('#pdp-relacionados');
    var tpl = document.getElementById('tpl-card');
    if (!container || !tpl || !secaoRelacionados) return;

    var parecidos = produtos
      .filter(function (p) {
        return p.id !== produto.id && p.categoria.slug === produto.categoria.slug;
      })
      .sort(function (a, b) { return b.vendas - a.vendas; })
      .slice(0, 4);

    if (!parecidos.length) {
      secaoRelacionados.hidden = true;
      return;
    }

    var fragmento = document.createDocumentFragment();
    parecidos.forEach(function (p) { fragmento.appendChild(CardProduto.criar(p, tpl)); });
    container.appendChild(fragmento);

    // Os cards de relacionados têm as MESMAS interações do grid da home.
    CardProduto.ligarInteracoesDoGrid(container);
  }

  /* ------------------------------------------------------------------- START */

  atualizarCabecalhoDoDocumento();
  montarCabecalho();
  montarGaleria();
  montarBadges();
  montarPreco();
  montarCores();
  montarTamanhos();
  montarEstoque();
  montarFrete();
  montarFicha();
  montarDescricao();
  ligarCompra();
  montarRelacionados();
})();
