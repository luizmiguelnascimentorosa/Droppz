/* =====================================================================================
   LOJA ÚNICA · js/config.js
   Configuração da loja: marca, regras de entrega e limites de filtro.
   Separado de dados.js de propósito — assim uma página que NÃO mostra produtos
   (guia de medidas, sobre, 404) carrega só este arquivo pequeno, e não o catálogo.

   ⚠️ ESTE É O LUGAR DA MARCA NO JAVASCRIPT. Troque `marca.nome` pela sua marca.
   Os valores abaixo espelham a tabela `configuracao` do banco (database/seed.sql).
   ===================================================================================== */
(function () {
  'use strict';

  window.LOJA = window.LOJA || {};

  window.LOJA.marca = {
    nome: 'SUA MARCA',
    slogan: 'streetwear de marca própria'
  };

  window.LOJA.entrega = {
    freteGratisAcima: 349,      // configuracao.frete_gratis_acima
    fretePadrao: 24.9,          // configuracao.frete_fixo_padrao
    prazoPostagem: '24h úteis',
    prazoProducaoDias: 2,       // configuracao.frete_prazo_producao_dias
    cepOrigem: '01310-100'      // configuracao.loja_cep_expedicao
  };

  window.LOJA.faixaPreco = { min: 0, max: 700, passo: 10 };

  window.LOJA.contato = {
    email: 'contato@suamarca.com.br'
  };

  window.LOJA.atualizadoEm = '2026-02-14T09:00:00-03:00';
})();
