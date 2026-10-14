# ROTEIRO DO FRONT-END — para quem está aprendendo

> Como usar este documento: **não leia tudo de uma vez.** Pegue a Fase 1, faça a tarefa 1,
> teste no navegador, commite. Só depois olhe a tarefa 2.
> Cada tarefa tem: o que fazer, o que você aprende, quando está pronta e quanto tempo leva.

---

## 0. O que JÁ está pronto (não refaça)

| Já implementado | Onde | Por que importa |
|---|---|---|
| Header persistente + busca unificada | `index.html` + `css/layout.css` | posição fixa dos elementos em todas as páginas |
| Carrossel de banner em JS puro | `js/carrossel.js` | autoplay, dots, teclado, arraste, pausa em hover |
| Motor de filtros + facetas + ordenação | `js/vitrine.js` | lê o DOM, filtra um array, re-renderiza por `<template>` |
| Carrinho no LocalStorage com drawer | `js/sacola.js` + `js/app.js` | estado + persistência + evento customizado |
| Gavetas acessíveis (foco preso, ESC) | `js/app.js` | modal de verdade, não só um `display: block` |
| Simulação de frete por CEP | `js/app.js` | tabela de regiões, máscara, `aria-live` |
| Toasts, newsletter, links "em construção" | `js/app.js` | feedback de ação sem `alert()` |
| Design system em 4 camadas | `css/tokens|base|layout|components` | variável em vez de valor mágico |

**Ou seja: a "casca" da home está feita.** O que falta é *páginas* e *integração*.

---

## Como estudar cada tarefa (o ciclo que funciona)

```
1. LEIA o código que já existe da parte mais parecida com o que você vai fazer
2. ESCREVA a menor versão que funciona (feia, incompleta, mas funcionando)
3. TESTE no navegador: Elements (estrutura), Console (erros), Application > Local Storage
4. SÓ ENTÃO refatore (renomear, extrair função, tirar repetição)
5. COMMITE no git com uma frase que diz o que você fez
```

**Regra de ouro para iniciante:** se você está 40 minutos travado sem ver nada na tela,
o problema é pequeno e bobo (caminho de arquivo errado, `id` que não existe, script antes do
HTML). Abra o Console (F12) **primeiro**. 90% dos bugs de iniciante aparecem lá em vermelho.

**Instale o git hoje.** Sem ele você não tem como voltar atrás quando quebrar algo — e você
vai quebrar. `git init` → `git add .` → `git commit -m "primeira versão"` na pasta do projeto.

---

# FASE 1 — HTML e CSS puro (sem uma linha de JS)

Objetivo: dominar estrutura semântica e layout responsivo **antes** de pensar em lógica.

### Tarefa 1 — Página `sobre.html` (Missão, Visão e Valores) ⏱️ 3–5 h
- **O que fazer:** copie o `index.html`, apague a vitrine e escreva a página institucional com
  as seções Missão, Visão e Valores + a história da marca. Reuse a classe `.pilares`/`.pilar`
  que já existe no `components.css`.
- **Aprende:** HTML semântico (`<section>`, `<h1>`→`<h2>`→`<h3>` na ordem certa, `<blockquote>`),
  reaproveitar CSS existente em vez de inventar classes novas.
- **Pronta quando:** a página abre sem CSS quebrado, tem **um só `<h1>`**, e no celular
  (DevTools → modo dispositivo, 360px) nada estoura para o lado.
- **Armadilha:** você vai perceber que copiou o header e o footer inteiros. **Sinta essa dor
  agora** — ela é a lição da tarefa 4.

### Tarefa 2 — Página `404.html` ⏱️ 1 h
- **O que fazer:** página de erro com o header, uma mensagem clara e um botão "voltar à loja".
- **Aprende:** página mínima, hierarquia visual, `flex` centralizando conteúdo na vertical
  (`min-height: 60vh` + `align-items: center`).
- **Pronta quando:** centraliza em telas de 360px a 1920px.

### Tarefa 3 — Página `guia-de-medidas.html` ⏱️ 4–6 h
- **O que fazer:** tabela de medidas (P, M, G, GG, XG × tórax/comprimento/ombro) + como medir
  a própria peça + dicas de caimento (oversized, regular, baggy).
- **Aprende:** `<table>` semântica com `<caption>`, `<thead>`, `<th scope="col">`;
  **tabela responsiva** (o jeito certo é `overflow-x: auto` num contêiner — não espremer a tabela).
- **Pronta quando:** a tabela rola na horizontal no celular sem quebrar o layout da página.
- **Extra:** acrescente um acordeão com `<details>/<summary>` (já existe exemplo na sidebar).

### Tarefa 4 — Resolver a duplicação do header/footer ⏱️ 4–8 h
- **O que fazer:** com 4 páginas e o header copiado em todas, mude um item do menu e você vai
  editar 4 arquivos. Resolva. Três caminhos, do mais fácil ao mais "de gente grande":
  1. **Servidor local simples:** rode o site com um servidor em vez de abrir o arquivo.
     `python -m http.server 5500` (ou `npx serve`) na pasta `web/` e acesse `http://localhost:5500`.
     Isso já ensina HTTP e resolve o problema de `type="module"` (a Fase 4 precisa disso).
  2. **Include no servidor:** um arquivo `partials/header.html` + um mini servidor Node que
     substitui `<!--#include header-->` pelo conteúdo. ~40 linhas de Node.
  3. **Gerador estático** (Eleventy/Astro) — o site publicado continua HTML/CSS/JS puro.
- **Aprende:** o conceito de **partial/template**, por que frameworks existem, o que é um
  servidor de arquivos estáticos, e a diferença entre `file://` e `http://`.
- **Pronta quando:** você muda o menu em **um** arquivo e as 4 páginas mudam.
- 💡 Esta é a tarefa mais importante da Fase 1. Fazer isso na mão depois de 20 páginas é sofrimento.

---

# FASE 2 — JavaScript de verdade (a página que dá dinheiro)

Objetivo: ler a URL, buscar dados, montar a tela e reagir a cliques.

### Tarefa 5 — PDP: `produto.html` (a tarefa mais valiosa do projeto) ⏱️ 10–16 h
- **O que fazer:**
  1. Ler o `?slug=` da URL com `new URLSearchParams(location.search)`;
  2. Achar o produto em `window.LOJA.produtos` (ou mostrar "produto não encontrado");
  3. Preencher título, preço, atributos (use `textContent`, nunca `innerHTML` com dado);
  4. Montar a **galeria** de imagens (as 8 `p-0N.svg` servem, troque a principal ao clicar);
  5. Grade de tamanhos e bolinhas de cor **clicáveis** (estado selecionado);
  6. Botão "Adicionar à sacola" usando `Sacola.adicionar(produto, {tamanho, cor})`;
  7. Bloco de frete com o CEP (a função `estimarFrete` já existe no `app.js` — mova para
     `js/frete.js` e reaproveite nas duas páginas);
  8. Bloco de avaliação (nota + comentários falsos por enquanto).
- **Aprende:** query string, renderização dinâmica, **estado da interface** (tamanho escolhido,
  cor escolhida), eventos, reuso de módulo, e a desabilitar o botão "comprar" até escolher o tamanho.
- **Pronta quando:** abrir `produto.html?slug=calca-cargo-ripstop-com-cinto` mostra a calça certa;
  escolher 40 + verde militar e adicionar coloca exatamente isso na sacola.
- **Armadilha:** produto sem estoque naquele tamanho deve avisar, não adicionar.

### Tarefa 6 — `carrinho.html` (página da sacola, não a gaveta) ⏱️ 6–10 h
- **O que fazer:** tabela/lista dos itens com foto, variação, quantidade (com `+`/`-`),
  subtotal por linha, remover item, campo de cupom (simulado), frete por CEP, total,
  botão para o checkout. Reaproveite `Sacola`.
- **Aprende:** manipular listas no DOM, recalcular totais, **não duplicar regra de negócio**
  (o cálculo do frete tem que estar em um lugar só, usado pela gaveta, pelo carrinho e pelo checkout).
- **Pronta quando:** mudar a quantidade atualiza a linha, o subtotal e o total, e sobrevive a F5.
- **Refatoração obrigatória:** extraia o "cálculo do carrinho" para uma função única. Se você
  escreveu a mesma conta em dois arquivos, apague uma.

### Tarefa 7 — `favoritos.html` ⏱️ 3–4 h
- **O que fazer:** listar os produtos que o usuário favoritou (a chave `loja.favoritos.v1`
  já existe no `vitrine.js`), com botão de remover. Extraia a lógica de favoritos para
  `js/favoritos.js` para as duas páginas usarem.
- **Aprende:** reaproveitar a mesma fonte de dados em páginas diferentes, lidar com lista vazia
  ("você ainda não salvou nada") — estado vazio é parte do trabalho, não detalhe.

---

# FASE 3 — Formulários e validação (onde o iniciante evolui de verdade)

### Tarefa 8 — `entrar.html` e `cadastro.html` ⏱️ 10–14 h
- **O que fazer:** formulário de login e de cadastro. Validação **em duas camadas**:
  1. **HTML5:** `required`, `type="email"`, `minlength`, `pattern`, `autocomplete` correto;
  2. **JS:** mensagens em português, validar CPF (dígito verificador), força de senha,
     confirmação de senha, máscara de telefone/CEP.
  Sem back-end ainda: guarde em `localStorage` e simule o "login" (deixe claro em comentário
  que **isso não é segurança**, é só prática de interface).
- **Aprende:** o evento `submit`, `preventDefault`, `form.checkValidity()`, `setCustomValidity`,
  **acessibilidade de formulário**: `aria-invalid`, `aria-describedby` ligando a mensagem ao campo,
  `role="alert"` no erro, e focar o primeiro campo com erro.
- **Pronta quando:** dá para navegar e preencher **só com o teclado** (Tab), o erro é anunciado,
  e o foco vai para o campo errado ao enviar.

### Tarefa 9 — `checkout.html` em etapas ⏱️ 12–18 h
- **O que fazer:** 3 ou 4 passos — (1) identificação, (2) entrega + frete, (3) pagamento
  (Pix com QR falso / cartão com máscara), (4) revisão e confirmação. Resumo do pedido fixo
  na lateral. No fim, gere um "número de pedido" e mostre uma página de sucesso.
- **Aprende:** **máquina de estados** (passo atual, passos concluídos, voltar sem perder dados),
  persistir o progresso no `localStorage` (o cliente não pode perder o carrinho ao errar a senha),
  e desabilitar o botão "finalizar" até tudo estar válido.
- **Pronta quando:** recarregar a página no passo 3 mantém os dados; voltar do passo 3 para o 1
  não apaga nada; e o botão de avançar fica desabilitado com campo inválido.

---

# FASE 4 — Organização e qualidade (o que separa amador de profissional)

### Tarefa 10 — Módulos ES + servidor local ⏱️ 6–10 h
- **O que fazer:** rode o site com `python -m http.server` (ou `npx serve`) e troque as tags
  `<script src>` por `<script type="module">`, dividindo `vitrine.js` em
  `catalogo.js` (dados + filtro), `cards.js` (render do card) e `vitrine.js` (orquestração).
  Use `export` / `import`.
- **Aprende:** `import`/`export`, escopo de módulo (acaba o `window.Vitrine` global),
  e **por que `file://` não funciona com módulos** (CORS) — a primeira vez que você esbarra
  em política de origem sem saber o nome disso.
- **Pronta quando:** a home funciona igual, servida por HTTP, e nenhum arquivo passa de ~300 linhas.

### Tarefa 11 — Auditoria de acessibilidade e responsividade ⏱️ 4–6 h
- **O que fazer:** passe por todas as páginas com um checklist:
  navegar só com Tab (o foco é sempre visível?), leitor de tela do Windows (Narrador, Win+Ctrl+Enter),
  zoom de 200%, DevTools → Lighthouse (Accessibility e Best Practices), contraste de cor
  (mínimo 4.5:1 em texto), 360px / 768px / 1440px.
- **Aprende:** a diferença entre "funciona no meu navegador" e "funciona para todo mundo";
  e que acessibilidade se resolve com HTML correto, não com gambiarra de JS.

### Tarefa 12 — Performance e imagens ⏱️ 4–6 h
- **O que fazer:** `loading="lazy"` em tudo que está fora da primeira dobra, `srcset`/`sizes`
  quando tiver fotos reais, `width`/`height` em toda `<img>` (evita o "pulo" do layout),
  e medir com Lighthouse antes/depois.
- **Aprende:** por que imagem é 90% do peso de uma loja, o que é CLS/LCP, e como medir em vez de achar.

---

# FASE 5 — Integração com o back-end (quando ele existir)

### Tarefa 13 — Trocar `dados.js` por `fetch` ⏱️ 6–8 h
- **O que fazer:** crie `js/api.js` com `async function buscarProdutos()` fazendo
  `fetch('/api/produtos')`. Trate **três estados**: carregando (skeleton), erro (mensagem +
  botão "tentar de novo"), sucesso. O resto do código não deve mudar — o formato do objeto é o mesmo.
- **Aprende:** `fetch` + `async/await`, `try/catch`, `response.ok`, estados de interface,
  e por que o React existe (organizar isso fica chato na mão — você vai sentir a dor certa).

### Tarefa 14 — Carrinho no servidor e login real ⏱️ 8–12 h
- **O que fazer:** enviar o carrinho para a API, receber o preço **do servidor** (nunca confie
  no preço que veio do navegador), sessão por cookie `HttpOnly`.
- **Aprende:** a regra que vale para o resto da sua carreira: **o front-end nunca decide
  segurança nem preço.** O front pede; o back decide.

---

# O que NÃO fazer agora (armadilhas de quem está aprendendo)

| ❌ Não faça | Por quê |
|---|---|
| Pular para React/Vue agora | você pularia justamente o aprendizado de DOM, eventos e estado que é a base de tudo |
| Instalar Bootstrap/Tailwind antes de dominar CSS | você não saberia depurar layout quando quebrar |
| Copiar um template inteiro da internet | você vai passar 3 semanas consertando código que não entende |
| Fazer 20 páginas de uma vez | você vai duplicar o header 20 vezes e se afogar (Fase 1, tarefa 4) |
| Usar `innerHTML` com dado que vem do usuário ou da API | é a porta de entrada para XSS |
| Guardar preço/estoque "confiando" no LocalStorage | qualquer pessoa abre o DevTools e altera |
| `alert()` para tudo | use os toasts que já existem no projeto |

---

# Cinco erros que EU cometi neste projeto (para você não repetir)

1. **Ordem dos arquivos CSS.** Escrevi `display:none` para as setas do carrossel no mobile no
   `layout.css`, mas `components.css` (que carrega depois) dizia `display:flex`.
   Com a mesma especificidade, **vence o último arquivo**. → A regra que sobrescreve um componente
   deve morar no arquivo daquele componente.
2. **`[hidden]` não funciona se você definir `display` no CSS.** `.drawer { display: grid }` derrota
   o `display:none` que o navegador aplica em `[hidden]`. → Escreva `.drawer[hidden] { display:none }`.
3. **Informação duplicada no mesmo card.** O texto do tecido já dizia "380 g/m²" e o atributo
   repetia "380 g/m²". Funciona, mas é ruído visual. → Reler o componente pensando como usuário.
4. **Consertar um bug que não existia.** Achei que o mobile tinha overflow porque o print saiu
   cortado — mas o print era um recorte da janela. → **Meça** (`scrollWidth` vs `clientWidth`)
   antes de mexer no CSS.
5. **Preço antigo abaixo do preço atual.** Errei a ordem de inserção no DOM. → Teste o resultado
   na tela, não confie no código que você acabou de escrever.

---

# Ordem recomendada (resumo)

```
FASE 1 (só HTML/CSS)      → sobre.html → 404.html → guia-de-medidas.html → RESOLVER O INCLUDE
FASE 2 (JS de DOM)        → produto.html (PDP) → carrinho.html → favoritos.html
FASE 3 (formulários)      → entrar/cadastro → checkout em etapas
FASE 4 (qualidade)        → módulos ES + servidor local → acessibilidade → performance
FASE 5 (integração)       → fetch dos produtos → carrinho/login no servidor
```

Se você fizer **uma tarefa por fim de semana**, em ~3 meses você tem uma loja completa,
funcional, sem framework nenhum, e — o mais importante — **entendendo cada linha**.
A PDP (tarefa 5) e o checkout (tarefa 9) são as duas que mais ensinam. Comece pela PDP.
