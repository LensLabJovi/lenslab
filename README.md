# 📸 LensLab — Sprint 2

Projeto acadêmico desenvolvido para as disciplinas de **Front-End Design** e **Web Development** na FIAP.

---

## 💡 A ideia: uma câmera simplificada

A câmera dos celulares hoje virou um painel cheio de modos, filtros e ajustes que confundem mais do que ajudam. Quem só quer **tirar uma foto** acaba perdido entre opções, e quem quer **controle real** precisa cavar fundo nos menus.

O **LensLab** propõe um caminho do meio: uma câmera mais **fácil de usar, sem perder profundidade**.

A ideia é que a câmera mostre **sugestões simples na tela** conforme o que a pessoa está fotografando — por exemplo: "Parece um documento, quer escanear?", "Detectamos uma pessoa, ativar modo retrato?", "Caderno aberto, transformar em PDF?". Essas sugestões aparecem como **chips discretos** sobre o visor e o usuário decide:

- **Toca na sugestão** → a câmera entra naquele modo automaticamente.
- **Ignora** → tira a foto normal, sem nenhum filtro ou alteração.

Depois da captura, a tela de pós-foto também oferece **opções úteis no contexto**: transformar em PDF se for documento, melhorar a luz se ficou escura, recortar se for um cartão, compartilhar direto.

E pra quem **gosta de mexer**, existe uma aba dedicada com **todos os modos disponíveis** — retrato, noturno, macro, HDR, manual, etc. — onde dá pra escolher tudo na mão e ajustar brilho, contraste e saturação por slider.

> **Resumo:** a câmera é **intuitiva pra quem quer praticidade** e **completa pra quem quer controle**. As sugestões inteligentes são a porta de entrada; os modos manuais ficam ali, escondidos mas acessíveis, pra quem quiser ir além.

---

## 🧪 Sobre este repositório

Este repositório contém um **protótipo web** que **demonstra a ideia acima** na prática, usando HTML, CSS e JavaScript puro.

Não é o produto final — é uma maneira de **mostrar o conceito funcionando no navegador**: as sugestões de modo aparecem como chips, a câmera real funciona via webcam (`getUserMedia`), as fotos são salvas localmente e a aba de "todos os modos" lista as 13 opções avançadas.

A entrega atende, ao mesmo tempo, os requisitos das duas disciplinas (detalhados mais abaixo).

---

## 👥 Equipe

| Nome Completo | RM |
|---------------|-----|
| Marcelo Antônio Scoleso Junior | RM 571626 |
| João Paulo Francisco de Oliveira | RM 571306 |
| Julia Souza Matarazzo | RM 571340 |
| Gabriel Souza Alexandre Silva | RM 572607 |

---

## 🚀 Como executar

1. Clone o repositório:
   ```bash
   git clone https://github.com/LensLabJovi/lenslab.git
   ```

2. **Sirva os arquivos via servidor local** (a câmera real exige `http://localhost` ou `https://`):
   - **VS Code**: instale a extensão *Live Server* e clique em "Go Live".
   - **Python**: `python -m http.server 8000` e abra `http://localhost:8000`.
   - **Node**: `npx serve` e abra a URL exibida.

> ⚠️ Abrir o `index.html` direto via `file://` (duplo clique) **funciona pra navegação**, mas a câmera real será bloqueada pelo navegador por segurança.

---

## ✅ Atendimento aos requisitos das disciplinas

### 🎨 Sprint 2 — Front-End Design

| # | Requisito | Pontos | Status | Onde foi atendido |
|---|-----------|--------|:------:|--------------------|
| 1 | **Layout dinâmico e moderno** — interface atraente e contemporânea | 30 | ✅ | Landing com hero, gradientes e *orbs* animados; bottom sheets na câmera; modal full-screen na galeria; tema escuro consistente via tokens em `css/variables.css` |
| 2 | **HTML semântico** — estruturação adequada do código HTML | 50 | ✅ | Todas as 10 páginas usam `<header>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<nav>`, `<footer>`, `<form>`; atributos `aria-label`, `role`, `lang="pt-BR"`, `meta charset/viewport` |
| 3 | **Flexbox** — posicionamento e estrutura via Flexbox | 20 | ✅ | 11 dos 13 arquivos CSS usam `display: flex` (somente `reset.css` e `variables.css` não — por natureza) |
|   | **Total** | **100** | ✅ | |

#### Entregáveis formais
- [x] `INTEGRANTES.TXT` na raiz com nome completo e RM dos 4 integrantes
- [x] Repositório público no GitHub
- [x] Entrega via Teams (link do repositório)

---

### 💻 Sprint 2 — Web Development

| # | Requisito | Pontos | Status | Onde foi atendido |
|---|-----------|--------|:------:|--------------------|
| 1 | **Boas práticas** | 10 | ✅ | Código modular (1 responsabilidade por arquivo `.js`); `DOMContentLoaded` em todos os scripts; nomes em português descritivos; *guards* (`if (!formulario) return`); comentários explicativos por seção |
| 2 | **Manipulação de strings e variáveis** | 20 | ✅ | Regex de e-mail, força de senha e nome (`login.js`, `cadastro.js`, `contato.js`); `.split()`, `.trim()`, `.charAt().toUpperCase()` para capitalização do nome a partir do email; formatação de datas em português (`galeria.js`) |
| 3 | **Manipulação de eventos** | 30 | ✅ | **88+ `addEventListener`** distribuídos pelos scripts. Eventos: `click`, `submit`, `input`, `blur`, `change`, `keydown`, `mouseenter`/`mouseleave`, `wheel`. Slideshow com setas, indicadores, autoplay, pausa no hover e setas do teclado |
| 4 | **Git e GitHub** | 25 | ✅ | Repositório criado **dentro de uma organização** no GitHub, com commits dos 4 integrantes e **mais de 10 commits** seguindo padrão *conventional commits* (`feat:`, `fix:`) |
| 5 | **Entrega** | 15 | ✅ | ZIP do projeto + link do repositório (público) entregues via Teams; `README.md` com RM e nome completo de cada aluno |
|   | **Total** | **100** | ✅ | |

#### Requisitos técnicos exigidos

| Requisito | Onde está implementado |
|-----------|------------------------|
| **Manipulação dinâmica de elementos e eventos** | `camera.js` (sliders, modos, flash, zoom, grade, captura), `galeria.js` (filtros, toggle grade/diário, modal), `home.js` (saudação personalizada) |
| **Validação de formulários e login** | `login.js` (e-mail por regex + senha mín. 6); `cadastro.js` (nome, e-mail, senha + confirmação, indicador de força em 5 níveis, aceite de termos); `contato.js` (nome só letras, e-mail, assunto obrigatório, mensagem 10–500 chars) |
| **Alertas e prompts** | `alert()` em login, cadastro, contato; `confirm()` em cadastro (senha fraca), galeria (excluir foto), pós-captura (descartar), contato (confirmar envio); `prompt()` em pós-captura (renomear/adicionar matéria) |
| **Manipulação de imagens (slideshow)** | `galeria.js` — 5 slides com troca automática a cada 5 s, setas ‹ ›, indicadores clicáveis, navegação por teclado (← →) e pausa no hover |
| **Eventos do DOM (botões etc.)** | Botões de captura, alternância de câmera, flash, grade, zoom, modos, filtros, logout, toggle de visualização, modal — todos via `addEventListener` |
| **Sem frameworks ou bibliotecas externas** | 100% Vanilla JS — `fetch` nativo no `contato.js`, `localStorage`/`sessionStorage`, `MediaDevices`, `Canvas`, `Web Audio` |

---

## 🛠️ Tecnologias usadas no protótipo

- **HTML5** semântico
- **CSS3** com Flexbox e variáveis CSS
- **JavaScript puro** (sem frameworks ou bibliotecas externas)
- **APIs nativas do navegador**: MediaDevices, Canvas, Web Audio, Web Storage, Vibration, Web Share
- **Git + GitHub** (repositório dentro de organização para commits colaborativos)

---

## 📁 Estrutura do projeto

```
lenslab/
├── index.html                  ← Landing pública
├── INTEGRANTES.TXT
├── README.md
├── pages/                      ← 10 páginas internas (login, cadastro, home,
│                                  camera, pos-captura, galeria, modos, sobre,
│                                  contato, ideias-futuras)
├── css/                        ← 15 folhas (uma por página + reset, variables, global)
├── js/                         ← 13 scripts (uma responsabilidade por arquivo)
└── assets/                     ← Imagens dos slides
```

---

## 📄 Licença

Projeto acadêmico — uso educacional.
