// servidor.js — servidor de arquivos estáticos que expande os partials
const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORTA    = 5000;
const RAIZ     = path.join(__dirname, 'web');       // único diretório público
const PARCIAIS = path.join(__dirname, 'partials');  // nunca acessível por URL

// O Content-Type diz ao navegador COMO tratar o arquivo.
// Errar aqui é o famoso "meu CSS sumiu".
const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css' : 'text/css; charset=utf-8',
  '.js'  : 'text/javascript; charset=utf-8',
  '.svg' : 'image/svg+xml',
  '.png' : 'image/png',
  '.jpg' : 'image/jpeg',
  '.webp': 'image/webp',
  '.ico' : 'image/x-icon'
};

// Lê um partial do disco e devolve como texto
function lerParcial(nome) {
  return fs.readFileSync(path.join(PARCIAIS, nome + '.html'), 'utf8');
}

// Troca <!-- #include nome --> pelo conteúdo de partials/nome.html
function expandirIncludes(html) {
  return html.replace(/<!--\s*#include\s+([\w-]+)\s*-->/g, function (tudo, nome) {
    try {
      return lerParcial(nome);
    } catch (erro) {
      // Em vez de derrubar o servidor, avisa no terminal e deixa um recado na página
      console.warn('  !! partial nao encontrado: ' + nome);
      return '<!-- partial "' + nome + '" nao encontrado -->';
    }
  });
}

const servidor = http.createServer(function (req, res) {
  // 1. Descobre o caminho pedido (sem a query string)
  let caminho = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (caminho === '/') caminho = '/index.html';   // "/" vira a home

  // 2. Resolve o caminho absoluto dentro da pasta pública
  const arquivo = path.join(RAIZ, caminho);

  // 3. SEGURANÇA: impede sair da pasta pública com ../ (path traversal)
  if (!arquivo.startsWith(RAIZ + path.sep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 - acesso negado');
    return;
  }

  // 4. Lê o arquivo
  fs.readFile(arquivo, function (erro, conteudo) {
    if (erro) {                                   // 5. Não existe: 404 tratado
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>404 - nao encontrei ' + caminho + '</h1>');
      return;
    }

    const ext  = path.extname(arquivo).toLowerCase();
    const tipo = TIPOS[ext] || 'application/octet-stream';

    // 6. SÓ o HTML passa pelo include; CSS, JS e imagem vão crus
    const corpo = ext === '.html' ? expandirIncludes(conteudo.toString('utf8')) : conteudo;

    res.writeHead(200, { 'Content-Type': tipo });
    res.end(corpo);
  });
});

servidor.on('error', function (erro) {
  if (erro.code === 'EADDRINUSE') {
    console.error('A porta ' + PORTA + ' ja esta em uso. Feche o outro servidor ou troque a PORTA.');
  } else {
    console.error(erro.message);
  }
  process.exit(1);
});

servidor.listen(PORTA, function () {
  console.log('Rodando em http://localhost:' + PORTA);
});