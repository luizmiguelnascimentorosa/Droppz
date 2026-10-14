/* =====================================================================================
   LOJA ÚNICA · js/frete.js
   Regra de frete em UM lugar só. Antes esta lógica vivia dentro do app.js; agora ela é
   usada por três telas (sidebar da home, gaveta da sacola e PDP). Regra de negócio
   duplicada é regra de negócio que vai divergir.

   Simulação local. No back-end vira POST /api/checkout/frete, consultando a transportadora
   com a origem em configuracao.loja_cep_expedicao (aqui: LOJA.entrega.cepOrigem).
   ===================================================================================== */
(function () {
  'use strict';

  var loja = window.LOJA || {};
  var entrega = loja.entrega || {};

  var PRAZO_PRODUCAO_DIAS = entrega.prazoProducaoDias || 2;
  var FRETE_GRATIS_ACIMA = entrega.freteGratisAcima || 349;
  var FRETE_PADRAO = entrega.fretePadrao || 24.9;

  /* Prazo e valor base por região (1º dígito do CEP) + dias de produção da loja. */
  var REGIOES = {
    0: { nome: 'Sudeste', dias: [2, 4], valor: 19.9 },
    1: { nome: 'Sudeste', dias: [2, 4], valor: 19.9 },
    2: { nome: 'Sudeste', dias: [3, 5], valor: 22.9 },
    3: { nome: 'Sudeste', dias: [3, 5], valor: 22.9 },
    4: { nome: 'Nordeste', dias: [5, 8], valor: 29.9 },
    5: { nome: 'Nordeste', dias: [6, 9], valor: 32.9 },
    6: { nome: 'Norte / Centro-Oeste', dias: [6, 10], valor: 34.9 },
    7: { nome: 'Norte / Centro-Oeste', dias: [7, 12], valor: 38.9 },
    8: { nome: 'Sul', dias: [3, 6], valor: 24.9 },
    9: { nome: 'Sul', dias: [4, 7], valor: 26.9 }
  };

  function apenasDigitos(texto) {
    return String(texto == null ? '' : texto).replace(/\D/g, '');
  }

  function formatarCep(valor) {
    var digitos = apenasDigitos(valor).slice(0, 8);
    return digitos.length > 5 ? digitos.slice(0, 5) + '-' + digitos.slice(5) : digitos;
  }

  /* Aceita com ou sem hífen: "01310100" e "01310-100" dão o mesmo resultado. */
  function cepValido(valor) {
    var digitos = apenasDigitos(valor);
    if (digitos.length !== 8) return false;
    if (/^(\d)\1{7}$/.test(digitos)) return false; // 00000000, 11111111...
    return !!REGIOES[Number(digitos.charAt(0))];
  }

  function estimar(cep) {
    var digitos = apenasDigitos(cep);
    if (!cepValido(digitos)) return null;

    var regiao = REGIOES[Number(digitos.charAt(0))];
    return {
      cep: formatarCep(digitos),
      regiao: regiao.nome,
      prazoMin: regiao.dias[0] + PRAZO_PRODUCAO_DIAS,
      prazoMax: regiao.dias[1] + PRAZO_PRODUCAO_DIAS,
      valor: regiao.valor,
      valorBase: regiao.valor
    };
  }

  /* Aplica a política da loja: acima de X o frete é grátis. */
  function calcularParaSubtotal(subtotal) {
    if (!subtotal || subtotal <= 0) return { valor: 0, gratis: false, indeterminado: true };
    var gratis = subtotal >= FRETE_GRATIS_ACIMA;
    return { valor: gratis ? 0 : FRETE_PADRAO, gratis: gratis, indeterminado: false };
  }

  /* Texto pronto para exibição — assim nenhuma tela inventa o seu formato. */
  function descrever(estimativa) {
    if (!estimativa) return '';
    return estimativa.regiao + ' · ' + estimativa.prazoMin + ' a ' + estimativa.prazoMax +
      ' dias úteis · R$ ' + estimativa.valor.toFixed(2).replace('.', ',');
  }

  window.Frete = {
    regioes: REGIOES,
    apenasDigitos: apenasDigitos,
    formatarCep: formatarCep,
    cepValido: cepValido,
    estimar: estimar,
    calcularParaSubtotal: calcularParaSubtotal,
    descrever: descrever,
    freteGratisAcima: FRETE_GRATIS_ACIMA,
    fretePadrao: FRETE_PADRAO
  };
})();
