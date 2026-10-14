/* =====================================================================================
   DROPZ · js/carrossel.js
   Banner rotativo em JavaScript puro — sem plugin, sem dependência.
   Recursos: autoplay, dots, setas, teclado, arraste (pointer events), pausa em hover,
   pausa com a aba em segundo plano, respeito a prefers-reduced-motion e ARIA de carrossel.
   ===================================================================================== */
(function () {
  'use strict';

  var raiz = document.getElementById('carrossel');
  if (!raiz) return;

  var trilha = document.getElementById('carrossel-trilha');
  var caixaPontos = document.getElementById('carrossel-pontos');
  var visor = raiz.querySelector('.carrossel__visor');
  var slides = Array.prototype.slice.call(trilha.children);

  if (slides.length < 2) {
    var setasUnicas = raiz.querySelector('.carrossel__setas');
    if (setasUnicas) setasUnicas.remove();
    return;
  }

  var INTERVALO = 6500;
  var indice = 0;
  var timer = null;
  var pausado = false;
  var reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  slides.forEach(function (slide, posicao) {
    slide.id = 'slide-' + posicao;
    slide.setAttribute('aria-label', (posicao + 1) + ' de ' + slides.length);
  });

  /* ------------------------------------------------------------------- navegação */

  function irPara(novoIndice, moverFoco) {
    indice = (novoIndice + slides.length) % slides.length;
    trilha.style.transform = 'translateX(' + (-indice * 100) + '%)';

    slides.forEach(function (slide, posicao) {
      // Slides fora de vista não devem ser alcançáveis por teclado nem por leitor de tela.
      slide.setAttribute('aria-hidden', posicao === indice ? 'false' : 'true');
      var focaveis = slide.querySelectorAll('a, button');
      Array.prototype.forEach.call(focaveis, function (elemento) {
        if (posicao === indice) elemento.removeAttribute('tabindex');
        else elemento.setAttribute('tabindex', '-1');
      });
    });

    Array.prototype.forEach.call(caixaPontos.children, function (ponto, posicao) {
      ponto.setAttribute('aria-selected', posicao === indice ? 'true' : 'false');
      ponto.tabIndex = posicao === indice ? 0 : -1;
    });

    if (moverFoco && caixaPontos.children[indice]) caixaPontos.children[indice].focus();
  }

  function proximo() { irPara(indice + 1); }
  function anterior() { irPara(indice - 1); }

  /* ----------------------------------------------------------------------- pontos */

  slides.forEach(function (slide, posicao) {
    var ponto = document.createElement('button');
    ponto.type = 'button';
    ponto.className = 'carrossel__ponto';
    ponto.setAttribute('role', 'tab');
    ponto.setAttribute('aria-controls', slide.id);
    ponto.setAttribute('aria-label', 'Ir para o destaque ' + (posicao + 1));
    ponto.addEventListener('click', function () { irPara(posicao); iniciar(); });
    caixaPontos.appendChild(ponto);
  });

  raiz.querySelector('[data-carrossel="proximo"]').addEventListener('click', function () { proximo(); iniciar(); });
  raiz.querySelector('[data-carrossel="anterior"]').addEventListener('click', function () { anterior(); iniciar(); });

  /* ---------------------------------------------------------------------- autoplay */

  function iniciar() {
    parar();
    if (reduzido || pausado) return;
    timer = window.setInterval(proximo, INTERVALO);
  }

  function parar() {
    if (timer) { window.clearInterval(timer); timer = null; }
  }

  raiz.addEventListener('mouseenter', function () { pausado = true; parar(); });
  raiz.addEventListener('mouseleave', function () { pausado = false; iniciar(); });
  raiz.addEventListener('focusin', function () { pausado = true; parar(); });
  raiz.addEventListener('focusout', function (evento) {
    if (!raiz.contains(evento.relatedTarget)) { pausado = false; iniciar(); }
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) parar(); else iniciar();
  });

  /* ---------------------------------------------------------------------- teclado */

  raiz.addEventListener('keydown', function (evento) {
    if (evento.key === 'ArrowRight') { evento.preventDefault(); proximo(); iniciar(); }
    if (evento.key === 'ArrowLeft') { evento.preventDefault(); anterior(); iniciar(); }
  });

  /* ----------------------------------------------------------------------- arraste */

  var inicioX = null;
  var arrastando = false;

  visor.addEventListener('pointerdown', function (evento) {
    if (evento.pointerType === 'mouse' && evento.button !== 0) return;
    inicioX = evento.clientX;
    arrastando = true;
    parar();
    visor.setPointerCapture(evento.pointerId);
  });

  visor.addEventListener('pointermove', function (evento) {
    if (!arrastando || inicioX === null) return;
    var deslocamento = evento.clientX - inicioX;
    if (Math.abs(deslocamento) < 56) return;

    if (deslocamento < 0) proximo(); else anterior();
    inicioX = evento.clientX;
  });

  function encerrarArraste(evento) {
    if (!arrastando) return;
    arrastando = false;
    inicioX = null;
    if (visor.hasPointerCapture && visor.hasPointerCapture(evento.pointerId)) {
      visor.releasePointerCapture(evento.pointerId);
    }
    iniciar();
  }

  visor.addEventListener('pointerup', encerrarArraste);
  visor.addEventListener('pointercancel', encerrarArraste);

  /* ------------------------------------------------------------------------ start */

  irPara(0);
  iniciar();
})();
