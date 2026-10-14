/* =====================================================================================
   tools/gerar-imagens.js
   Gera os placeholders visuais (SVG) da vitrine. Zero dependências externas.
   Uso:  node tools/gerar-imagens.js
   Troque os arquivos gerados pelas fotos reais quando o upload de mídia existir;
   os nomes e o caminho já batem com js/dados.js e index.html.
   ===================================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');

const DESTINO = path.join(__dirname, '..', 'web', 'assets', 'img');
fs.mkdirSync(DESTINO, { recursive: true });

const FONTE = 'Inter, Segoe UI, Helvetica, Arial, sans-serif';
const MONO = 'ui-monospace, Consolas, monospace';

/* Paletas de streetwear: fundo escuro/terroso com um acento forte. */
const paletas = [
  { a: '#0f0f10', b: '#2a2a2d', acento: '#d8ff3e', texto: '#f4f4f1' },
  { a: '#232326', b: '#3f4145', acento: '#f2f0e9', texto: '#ffffff' },
  { a: '#101a2c', b: '#1d2a44', acento: '#d8ff3e', texto: '#eef2f7' },
  { a: '#3a3128', b: '#5a4032', acento: '#e8d9c3', texto: '#f6efe6' },
  { a: '#3f4636', b: '#4b5340', acento: '#f2f0e9', texto: '#f3f5ef' },
  { a: '#2d1f3d', b: '#4b2e5e', acento: '#d8ff3e', texto: '#f1e9f6' },
  { a: '#8f8f88', b: '#b8b8b3', acento: '#101010', texto: '#141414' },
  { a: '#8f2420', b: '#c0342a', acento: '#f7e6c4', texto: '#fdf3e8' }
];

function grao() {
  return '<filter id="grao" x="0" y="0" width="100%" height="100%">' +
    '<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch"/>' +
    '<feColorMatrix type="saturate" values="0"/></filter>';
}

function documento(largura, altura, corpo, rotulo) {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + largura + ' ' + altura + '" ' +
    'width="' + largura + '" height="' + altura + '" role="img" aria-label="' + rotulo + '">' +
    corpo + '</svg>\n';
}

/* Ajusta o corpo da fonte para o texto caber na largura útil (640px). */
function tamanhoFonte(texto, teto) {
  const estimativa = Math.round(640 / Math.max(texto.length, 1) * 1.75);
  return Math.max(48, Math.min(teto, estimativa));
}

/* ---------------- foto de produto (4:5) ---------------- */
function produto(numero, paleta, titulo, etiqueta) {
  const fonte = tamanhoFonte(titulo, 120);
  const corpo =
    '<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="' + paleta.a + '"/><stop offset="1" stop-color="' + paleta.b + '"/>' +
    '</linearGradient>' + grao() + '</defs>' +
    '<rect width="800" height="1000" fill="url(#bg)"/>' +
    '<circle cx="620" cy="225" r="255" fill="' + paleta.acento + '" opacity="0.16"/>' +
    '<circle cx="620" cy="225" r="150" fill="' + paleta.acento + '" opacity="0.1"/>' +
    '<path d="M0 770 L800 545 L800 1000 L0 1000 Z" fill="' + paleta.acento + '" opacity="0.13"/>' +
    '<path d="M118 0 L196 0 L74 1000 L0 1000 Z" fill="' + paleta.acento + '" opacity="0.07"/>' +
    '<rect width="800" height="1000" filter="url(#grao)" opacity="0.09"/>' +
    '<text x="64" y="838" font-family="' + FONTE + '" font-size="' + fonte + '" font-weight="800" ' +
    'letter-spacing="-3" fill="' + paleta.texto + '">' + titulo + '</text>' +
    '<text x="66" y="892" font-family="' + FONTE + '" font-size="28" font-weight="600" ' +
    'letter-spacing="4" fill="' + paleta.acento + '">SUA MARCA</text>' +
    '<text x="66" y="940" font-family="' + FONTE + '" font-size="22" font-weight="500" ' +
    'letter-spacing="1" fill="' + paleta.texto + '" opacity="0.62">' + etiqueta + '</text>' +
    '<text x="66" y="116" font-family="' + MONO + '" font-size="22" ' +
    'fill="' + paleta.texto + '" opacity="0.5">' + numero + '</text>' +
    '<rect x="46" y="46" width="708" height="908" fill="none" stroke="' + paleta.texto + '" ' +
    'stroke-opacity="0.15" stroke-width="2"/>';

  return documento(800, 1000, corpo, titulo + ' — SUA MARCA');
}

/* ---------------- banner do carrossel (21:8) ---------------- */
function banner(numero, paleta, semente) {
  const cx = 1180 + (semente % 3) * 90;
  const corpo =
    '<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="0.6">' +
    '<stop offset="0" stop-color="' + paleta.a + '"/><stop offset="1" stop-color="' + paleta.b + '"/>' +
    '</linearGradient>' + grao() + '</defs>' +
    '<rect width="1680" height="640" fill="url(#bg)"/>' +
    '<circle cx="' + cx + '" cy="' + (245 + semente * 40) + '" r="325" fill="' + paleta.acento + '" opacity="0.15"/>' +
    '<circle cx="' + cx + '" cy="' + (245 + semente * 40) + '" r="185" fill="' + paleta.acento + '" opacity="0.1"/>' +
    '<path d="M905 640 L1285 0 L1520 0 L1140 640 Z" fill="' + paleta.acento + '" opacity="0.08"/>' +
    '<path d="M0 470 L700 380 L700 640 L0 640 Z" fill="#000" opacity="0.22"/>' +
    '<rect width="1680" height="640" filter="url(#grao)" opacity="0.1"/>';

  return documento(1680, 640, corpo, 'Banner de destaque ' + numero);
}

/* ---------------- tile do mosaico de coleções (3:4) ---------------- */
function tile(numero, paleta) {
  const corpo =
    '<defs><linearGradient id="bg" x1="0" y1="0" x2="0.8" y2="1">' +
    '<stop offset="0" stop-color="' + paleta.b + '"/><stop offset="1" stop-color="' + paleta.a + '"/>' +
    '</linearGradient>' + grao() + '</defs>' +
    '<rect width="600" height="800" fill="url(#bg)"/>' +
    '<circle cx="430" cy="205" r="215" fill="' + paleta.acento + '" opacity="0.16"/>' +
    '<path d="M0 560 L600 420 L600 800 L0 800 Z" fill="' + paleta.acento + '" opacity="0.12"/>' +
    '<rect width="600" height="800" filter="url(#grao)" opacity="0.1"/>';

  return documento(600, 800, corpo, 'Coleção ' + numero);
}

/* ---------------- favicon ---------------- */
function favicon() {
  const corpo =
    '<rect width="64" height="64" rx="14" fill="#0e0e0e"/>' +
    '<text x="32" y="45" font-family="' + FONTE + '" font-size="34" font-weight="800" ' +
    'text-anchor="middle" fill="#d8ff3e">SM</text>';
  return documento(64, 64, corpo, 'SUA MARCA');
}

/* ---------------- diagrama técnico de medidas (usado no guia de medidas) ----------------
   Desenho de flat-lay com as três cotas que o cliente precisa medir:
   A = ombro, B = largura/tórax, C = comprimento. */
function diagramaMedidas() {
    const tinta = '#17171a';
    const acento = '#d8ff3e';
    const grade = '#e4e4de';
    const cota = '#0e0e0e';

    const linhasGrade = [];
    for (let i = 1; i < 8; i++) linhasGrade.push('<line x1="' + (i * 100) + '" y1="0" x2="' + (i * 100) + '" y2="620"/>');
    for (let i = 1; i < 6; i++) linhasGrade.push('<line x1="0" y1="' + (i * 100) + '" x2="800" y2="' + (i * 100) + '"/>');

    const corpo =
      '<rect width="800" height="620" fill="#f4f4f1"/>' +
      '<g stroke="' + grade + '" stroke-width="1">' + linhasGrade.join('') + '</g>' +
      '<ellipse cx="400" cy="566" rx="152" ry="15" fill="#000" opacity="0.07"/>' +

      /* silhueta da camiseta (flat-lay) */
      '<path d="M296 104 L372 84 Q400 134 428 84 L504 104 L572 128 L648 248 L566 306 ' +
      'L524 246 L524 548 L276 548 L276 246 L234 306 L152 248 L228 128 Z" ' +
      'fill="' + tinta + '" stroke="#2e2e33" stroke-width="2"/>' +
      '<path d="M372 84 Q400 134 428 84" fill="none" stroke="#43434a" stroke-width="3"/>' +

      /* A — ombro */
      '<line x1="296" y1="104" x2="504" y2="104" stroke="' + acento + '" stroke-width="2" stroke-dasharray="7 5"/>' +
      '<line x1="296" y1="97" x2="296" y2="111" stroke="' + acento + '" stroke-width="2"/>' +
      '<line x1="504" y1="97" x2="504" y2="111" stroke="' + acento + '" stroke-width="2"/>' +
      '<text x="278" y="112" font-family="' + MONO + '" font-size="24" font-weight="700" text-anchor="end" fill="' + cota + '">A</text>' +

      /* B — largura (tórax) */
      '<line x1="276" y1="340" x2="524" y2="340" stroke="' + acento + '" stroke-width="2" stroke-dasharray="7 5"/>' +
      '<line x1="276" y1="333" x2="276" y2="347" stroke="' + acento + '" stroke-width="2"/>' +
      '<line x1="524" y1="333" x2="524" y2="347" stroke="' + acento + '" stroke-width="2"/>' +
      '<text x="258" y="348" font-family="' + MONO + '" font-size="24" font-weight="700" text-anchor="end" fill="' + cota + '">B</text>' +

      /* C — comprimento */
      '<line x1="400" y1="96" x2="400" y2="548" stroke="' + acento + '" stroke-width="2" stroke-dasharray="7 5"/>' +
      '<line x1="393" y1="548" x2="407" y2="548" stroke="' + acento + '" stroke-width="2"/>' +
      '<text x="416" y="250" font-family="' + MONO + '" font-size="24" font-weight="700" fill="' + acento + '">C</text>' +

      /* legenda — texto curto de propósito: precisa caber nos 680px úteis */
      '<text x="60" y="598" font-family="' + FONTE + '" font-size="19" fill="#5f5f5a">' +
      'A ombro · B tórax · C comprimento — medidas da peça</text>';

  return documento(800, 620, corpo, 'Diagrama de como medir a camiseta: ombro, largura e comprimento');
}

/* ---------------- close-up de tecido (segunda foto da galeria da PDP) ----------------
   Uma "foto de detalhe" da malha canelada: linhas verticais + etiqueta com o nome do tecido. */
function detalheCanelura(paleta, rotulo, etiqueta) {
  const linhas = [];
  for (let x = 34; x < 800; x += 15) {
    linhas.push('<line x1="' + x + '" y1="0" x2="' + x + '" y2="1000" stroke="#ffffff" ' +
      'stroke-opacity="0.055" stroke-width="7"/>');
    linhas.push('<line x1="' + (x + 7) + '" y1="0" x2="' + (x + 7) + '" y2="1000" stroke="#000000" ' +
      'stroke-opacity="0.16" stroke-width="4"/>');
  }

  const corpo =
    '<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="' + paleta.a + '"/><stop offset="1" stop-color="' + paleta.b + '"/>' +
    '</linearGradient>' + grao() + '</defs>' +
    '<rect width="800" height="1000" fill="url(#bg)"/>' +
    linhas.join('') +
    '<rect width="800" height="1000" filter="url(#grao)" opacity="0.12"/>' +
    '<rect x="0" y="760" width="800" height="240" fill="#0e0e0e" opacity="0.45"/>' +
    '<text x="64" y="866" font-family="' + FONTE + '" font-size="70" font-weight="800" ' +
    'letter-spacing="-2" fill="' + paleta.texto + '">' + rotulo + '</text>' +
    '<text x="66" y="908" font-family="' + MONO + '" font-size="20" ' +
    'fill="' + paleta.acento + '">' + etiqueta + '</text>' +
    '<text x="66" y="116" font-family="' + MONO + '" font-size="22" ' +
    'fill="' + paleta.texto + '" opacity="0.55">DETALHE DO TECIDO</text>';

  return documento(800, 1000, corpo, 'Detalhe da malha: ' + rotulo);
}

/* ---------------- execução ---------------- */

const modelos = [
  { titulo: 'OVERSIZED', etiqueta: 'ALGODÃO PESADO 240 G/M²' },
  { titulo: 'HOODIE', etiqueta: 'MOLETOM FLANELADO 320 G/M²' },
  { titulo: 'NEON', etiqueta: 'TIRAGEM LIMITADA' },
  { titulo: 'CARGO', etiqueta: 'SARJA RIPSTOP' },
  { titulo: 'BONÉ', etiqueta: 'SARJA DRILL' },
  { titulo: 'CORTA-VENTO', etiqueta: 'NYLON RIPSTOP' },
  { titulo: 'VINTAGE', etiqueta: 'DROP ANTIGO' },
  { titulo: 'CREWNECK', etiqueta: 'MOLETOM FLANELADO 320 G/M²' },
  { titulo: 'REGATA', etiqueta: 'ALGODÃO CANELADO 180 G/M²' }
];

const arquivos = [];

for (let i = 0; i < modelos.length; i++) {
  const nome = 'p-0' + (i + 1) + '.svg';
  const numero = 'DROP ' + String(i + 1).padStart(3, '0');
  fs.writeFileSync(
    path.join(DESTINO, nome),
    produto(numero, paletas[i % paletas.length], modelos[i].titulo, modelos[i].etiqueta),
    'utf8'
  );
  arquivos.push(nome);
}

for (let i = 0; i < 3; i++) {
  const nome = 'banner-0' + (i + 1) + '.svg';
  fs.writeFileSync(path.join(DESTINO, nome), banner(i + 1, paletas[i * 3 % paletas.length], i + 1), 'utf8');
  arquivos.push(nome);
}

for (let i = 0; i < 4; i++) {
  const nome = 'drop-0' + (i + 1) + '.svg';
  fs.writeFileSync(path.join(DESTINO, nome), tile(i + 1, paletas[(i + 2) % paletas.length]), 'utf8');
  arquivos.push(nome);
}

fs.writeFileSync(path.join(DESTINO, 'favicon.svg'), favicon(), 'utf8');
arquivos.push('favicon.svg');

fs.writeFileSync(path.join(DESTINO, 'medidas-camiseta.svg'), diagramaMedidas(), 'utf8');
arquivos.push('medidas-camiseta.svg');

/* Segunda foto da galeria: só a regata tem, para demonstrar o caminho de N imagens
   (basta adicionar `imagens: [...]` no produto em js/dados.js). */
fs.writeFileSync(path.join(DESTINO, 'p-09-detalhe.svg'),
  detalheCanelura(paletas[2], 'CANELURA', 'ALGODÃO CANELADO 180 G/M²'), 'utf8');
arquivos.push('p-09-detalhe.svg');

console.log('Gerados ' + arquivos.length + ' arquivos em ' + DESTINO + ':');
console.log(' - ' + arquivos.join('\n - '));
