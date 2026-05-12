// =======================================================
// camera.js — Lógica completa da tela da câmera
// =======================================================
// Funcionalidades:
//   - Acesso à câmera real via getUserMedia
//   - Flip frontal/traseira
//   - Captura de frame para canvas e salvamento via LensLabPhotos
//   - 13 modos com filtros CSS reais
//   - Sliders funcionais de brilho, saturação e contraste
//   - Proporção (1:1, 3:4, 9:16, 16:9, Cheio)
//   - Temporizador (3s, 5s, 10s) com contagem regressiva visual
//   - Som de obturador (Web Audio API) + vibração + timestamp
// =======================================================

document.addEventListener("DOMContentLoaded", function () {

  // =====================================================
  // 0) ESTADO GLOBAL DA CÂMERA
  // =====================================================
  // Tudo que precisa ser compartilhado entre os módulos
  // (modo ativo, ajustes, stream, etc.) fica neste objeto.
  // =====================================================

  const estado = {
    streamAtivo:    null,
    facingMode:     "environment",  // câmera traseira por padrão
    modoAtual:      "foto",         // modo de captura ativo
    timer:          0,              // 0, 3, 5 ou 10 segundos
    aspecto:        "full",         // full | 3-4 | 1-1 | 9-16 | 16-9
    capturando:     false,          // trava pra evitar dupla captura
    ajustes: {
      brilho:     100,   // %
      saturacao:  100,   // %
      contraste:  100    // %
    },
    demo: {
      ativo:      false,           // se true, captura sai de imagem/cena ao invés do <video>
      fonte:      null,            // "upload" | "scene"
      nomeFonte:  ""               // texto exibido no banner
    },
    silencioso:   false             // se true, não toca o som do obturador
  };

  // =====================================================
  // 1) MAPA DE MODOS — nome, cor do tema e filtro CSS
  // =====================================================
  // Cada modo aplica um filtro CSS no <video> do preview,
  // e o mesmo filtro é gravado na foto capturada.
  // =====================================================

  const MODOS = {
    foto:      { nome: "Foto",         cor: "#FFFFFF", filtro: "none" },
    doc:       { nome: "Documento",    cor: "#6C5CE7", filtro: "contrast(1.4) brightness(1.05) saturate(0)" },
    portrait:  { nome: "Retrato",      cor: "#FD79A8", filtro: "saturate(1.15) contrast(1.05)" },
    night:     { nome: "Noturno",      cor: "#FDCB6E", filtro: "brightness(1.4) contrast(1.15) saturate(1.1)" },
    caderno:   { nome: "Caderno",      cor: "#00D2D3", filtro: "contrast(1.5) brightness(1.1) grayscale(0.7)" },
    qrcode:    { nome: "QR Code",      cor: "#74B9FF", filtro: "contrast(1.6) saturate(0)" },
    comida:    { nome: "Comida",       cor: "#E17055", filtro: "saturate(1.5) contrast(1.1) brightness(1.05)" },
    panorama:  { nome: "Panorama",     cor: "#55EFC4", filtro: "saturate(1.2) contrast(1.05)" },
    macro:     { nome: "Macro",        cor: "#FFEAA7", filtro: "contrast(1.3) saturate(1.2)" },
    slowmo:    { nome: "Câmera Lenta", cor: "#FF7675", filtro: "saturate(1.1) hue-rotate(-5deg)" },
    timelapse: { nome: "Time-lapse",   cor: "#A29BFE", filtro: "saturate(1.1) brightness(1.05)" },
    hdr:       { nome: "HDR",          cor: "#FD79A8", filtro: "contrast(1.3) saturate(1.4) brightness(1.05)" },
    lousa:     { nome: "Lousa",        cor: "#81ECEC", filtro: "contrast(2) brightness(1.15) saturate(0.2)" },
    selfie:    { nome: "Selfie+",      cor: "#E056C1", filtro: "saturate(1.15) brightness(1.08) contrast(0.95)" }
  };

  // =====================================================
  // 2) ELEMENTOS DO DOM (cacheados uma vez só)
  // =====================================================

  const elementoVideo     = document.getElementById("cameraVideo");
  const blocoErro         = document.getElementById("cameraError");
  const mensagemErro      = document.getElementById("cameraErrorMsg");
  const botaoTentarNovo   = document.getElementById("cameraRetryBtn");
  const canvasCaptura     = document.getElementById("captureCanvas");

  // Modo demo (testar sem webcam)
  const demoImg            = document.getElementById("demoImg");
  const demoCanvas         = document.getElementById("demoCanvas");
  const demoBanner         = document.getElementById("demoBanner");
  const demoSourceName     = document.getElementById("demoSourceName");
  const demoFileInput      = document.getElementById("demoFileInput");
  const demoUploadTrigger  = document.getElementById("demoUploadTrigger");
  const botaoEntrarDemo    = document.getElementById("cameraDemoBtn");

  const botaoCaptura      = document.getElementById("captureButton");
  const capturaInner      = document.querySelector(".capture-inner");
  const botaoFlip         = document.querySelector(".flip-btn");
  const thumbnailImg      = document.getElementById("thumbnailImg");

  const badgeModo         = document.querySelector(".mode-badge");
  const countdownOverlay  = document.getElementById("countdownOverlay");
  const countdownNum      = document.getElementById("countdownNum");
  const captureTimestamp  = document.getElementById("captureTimestamp");

  // =====================================================
  // 3) CÂMERA REAL — getUserMedia + tratamento de erros
  // =====================================================

  async function iniciarCamera() {
    // Em modo demo a câmera real fica desligada — não interrompe a fonte demo
    if (estado.demo.ativo) return;

    if (blocoErro) blocoErro.setAttribute("hidden", "");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      mostrarErro("Seu navegador não suporta acesso à câmera. Tente outro navegador moderno (Chrome, Edge, Firefox).");
      return;
    }

    // Para qualquer stream anterior antes de pedir um novo
    pararCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: estado.facingMode },
        audio: false
      });

      estado.streamAtivo = stream;

      if (elementoVideo) {
        elementoVideo.srcObject = stream;
        elementoVideo.play().catch(() => { /* ignora autoplay bloqueado */ });
      }

    } catch (erro) {
      let texto = "Não foi possível acessar a câmera.";

      if (erro.name === "NotAllowedError" || erro.name === "PermissionDeniedError") {
        texto = "Permissão negada. Autorize o acesso à câmera nas configurações do site para continuar.";
      } else if (erro.name === "NotFoundError" || erro.name === "DevicesNotFoundError") {
        texto = "Nenhuma câmera encontrada no dispositivo.";
      } else if (erro.name === "NotReadableError" || erro.name === "TrackStartError") {
        texto = "A câmera está sendo usada por outro aplicativo. Feche-o e tente novamente.";
      } else if (erro.name === "OverconstrainedError") {
        // facingMode requested não disponível — tenta sem essa restrição
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          estado.streamAtivo = stream;
          if (elementoVideo) {
            elementoVideo.srcObject = stream;
            elementoVideo.play().catch(() => {});
          }
          return;
        } catch (e) {
          texto = "Câmera solicitada não disponível.";
        }
      } else if (erro.name === "SecurityError") {
        texto = "Acesso bloqueado. Abra a página via http://localhost ou https:// (não via arquivo direto).";
      }

      console.error("[câmera] Erro ao iniciar:", erro);
      mostrarErro(texto);
    }
  }

  function mostrarErro(texto) {
    if (mensagemErro) mensagemErro.textContent = texto;
    if (blocoErro)    blocoErro.removeAttribute("hidden");
  }

  function pararCamera() {
    if (estado.streamAtivo) {
      estado.streamAtivo.getTracks().forEach(track => track.stop());
      estado.streamAtivo = null;
    }
  }

  if (botaoTentarNovo) botaoTentarNovo.addEventListener("click", iniciarCamera);
  window.addEventListener("beforeunload", pararCamera);
  window.addEventListener("pagehide", pararCamera);

  iniciarCamera();

  // =====================================================
  // 4) FLIP — alterna entre câmera frontal e traseira
  // =====================================================

  if (botaoFlip) {
    botaoFlip.addEventListener("click", async function () {
      estado.facingMode = (estado.facingMode === "environment") ? "user" : "environment";
      // Anima o ícone
      botaoFlip.style.transform = "rotate(180deg)";
      setTimeout(() => { botaoFlip.style.transform = ""; }, 300);
      await iniciarCamera();
    });
  }

  // =====================================================
  // 5) FLASH (visual) — toggle do indicador
  // =====================================================
  // O efeito de "flash" real é o overlay branco no momento
  // da captura. Aqui só guardamos a preferência do usuário.

  const botaoFlash = document.querySelector('[data-control="flash"]');
  let flashLigado = false;

  if (botaoFlash) {
    botaoFlash.addEventListener("click", function () {
      flashLigado = !flashLigado;
      if (flashLigado) {
        botaoFlash.classList.add("active");
        botaoFlash.style.color = "#FDCB6E";
      } else {
        botaoFlash.classList.remove("active");
        botaoFlash.style.color = "";
      }
    });
  }

  // =====================================================
  // 6) GRADE 3x3 — toggle do overlay de regra dos terços
  // =====================================================

  const botaoGrade = document.querySelector('[data-control="grid"]');
  const viewfinder = document.querySelector(".viewfinder");
  let gradeAtiva = false;

  if (botaoGrade && viewfinder) {
    botaoGrade.addEventListener("click", function () {
      gradeAtiva = !gradeAtiva;
      botaoGrade.classList.toggle("active");

      if (gradeAtiva) {
        const grade = document.createElement("div");
        grade.id = "grade-overlay";
        grade.innerHTML = `
          <div class="grid-line vertical" style="left: 33.3%"></div>
          <div class="grid-line vertical" style="left: 66.6%"></div>
          <div class="grid-line horizontal" style="top: 33.3%"></div>
          <div class="grid-line horizontal" style="top: 66.6%"></div>
        `;
        viewfinder.appendChild(grade);
      } else {
        const grade = document.getElementById("grade-overlay");
        if (grade) grade.remove();
      }
    });
  }

  // =====================================================
  // 7) ZOOM — apenas marca o botão ativo (visual)
  // =====================================================

  const botoesZoom = document.querySelectorAll(".zoom-btn");
  botoesZoom.forEach(function (botao) {
    botao.addEventListener("click", function () {
      botoesZoom.forEach(b => b.classList.remove("active"));
      botao.classList.add("active");

      // Zoom visual via CSS scale (efeito leve, só no preview)
      const zoom = parseFloat(botao.dataset.zoom) || 1;
      if (elementoVideo) {
        elementoVideo.style.transform = "scale(" + zoom + ")";
      }
    });
  });

  // =====================================================
  // 8) MODOS — chips, mode-cards e mode-list-items
  // =====================================================
  // Qualquer elemento com [data-mode] ativa o modo correspondente.
  // - Aplica filtro CSS no <video>
  // - Atualiza o badge no viewfinder
  // - Pinta o botão de captura

  function aplicarFiltroNoVideo() {
    const dadosModo = MODOS[estado.modoAtual] || MODOS.foto;
    const filtroModo = dadosModo.filtro && dadosModo.filtro !== "none" ? dadosModo.filtro : "";

    // Combina o filtro do modo + ajustes do usuário (brilho/sat/contraste)
    const filtroAjustes =
      "brightness(" + (estado.ajustes.brilho / 100) + ")" +
      " saturate(" + (estado.ajustes.saturacao / 100) + ")" +
      " contrast(" + (estado.ajustes.contraste / 100) + ")";

    const filtroFinal = (filtroModo + " " + filtroAjustes).trim();

    if (elementoVideo) elementoVideo.style.filter = filtroFinal;
    if (demoImg)       demoImg.style.filter       = filtroFinal;
    if (demoCanvas)    demoCanvas.style.filter    = filtroFinal;
  }

  function ativarModo(slug) {
    estado.modoAtual = slug;
    const dados = MODOS[slug] || MODOS.foto;

    // Aplica filtro
    aplicarFiltroNoVideo();

    // Atualiza badge
    if (badgeModo) {
      if (slug === "foto") {
        badgeModo.setAttribute("hidden", "");
      } else {
        badgeModo.innerHTML = "<span>✨</span><span>Modo " + dados.nome + " ativo</span>";
        badgeModo.style.background   = dados.cor + "33";
        badgeModo.style.borderColor  = dados.cor + "66";
        badgeModo.style.color        = "#FFFFFF";
        badgeModo.removeAttribute("hidden");
      }
    }

    // Pinta o botão de captura
    if (capturaInner) {
      capturaInner.style.background = (slug === "foto") ? "" : dados.cor;
    }

    // Marca visualmente o item correto
    document.querySelectorAll("[data-mode]").forEach(function (el) {
      if (el.dataset.mode === slug) el.classList.add("active");
      else el.classList.remove("active");
    });

    // Garante que o modo escolhido apareça nos chips rápidos
    inserirChipSeNecessario(slug);
  }

  // Liga o clique em todos os elementos com data-mode
  document.querySelectorAll("[data-mode]").forEach(function (el) {
    el.addEventListener("click", function () {
      const slug = el.dataset.mode;
      // Clicar no modo já ativo desativa (volta pra "foto")
      if (estado.modoAtual === slug && slug !== "foto") {
        ativarModo("foto");
      } else {
        ativarModo(slug);
      }

      // Se foi clicado dentro de um overlay, fecha o overlay
      const overlayPai = el.closest(".overlay");
      if (overlayPai) fecharOverlay(overlayPai);
    });
  });

  // =====================================================
  // 8.5) MODOS RÁPIDOS DINÂMICOS — top 3 do uso recente
  // =====================================================
  // Lê os últimos usos salvos por registrarUsoModo() e
  // monta os chips com os 3 modos mais usados na janela
  // recente. Empate de contagem é resolvido pela recência.
  // Resultado: usuário que insiste num modo o mantém ali;
  // quando para de usar, ele cai da janela e dá lugar a
  // outros modos que estão sendo usados.

  const ICONES_MODO = {
    doc:       "📄",
    portrait:  "👤",
    night:     "🌙",
    caderno:   "📓",
    qrcode:    "🔲",
    comida:    "🍔",
    panorama:  "🏞️",
    macro:     "🔬",
    slowmo:    "🐢",
    timelapse: "⏱️",
    hdr:       "✨",
    lousa:     "📋",
    selfie:    "🤳"
  };

  const CHIPS_PADRAO = ["doc", "portrait", "night"];
  const JANELA_RECENTES = 20;

  function calcularModosRapidos() {
    let lista = [];
    try {
      lista = JSON.parse(localStorage.getItem("lenslab:padroesUso") || "[]");
    } catch (e) { /* ignora */ }

    if (!Array.isArray(lista) || lista.length === 0) {
      return CHIPS_PADRAO.slice();
    }

    const recentes = lista.slice(-JANELA_RECENTES);
    const contagem = {};
    const indiceUltimo = {};
    recentes.forEach(function (uso, i) {
      if (!uso || !uso.modo || uso.modo === "foto") return;
      contagem[uso.modo] = (contagem[uso.modo] || 0) + 1;
      indiceUltimo[uso.modo] = i;
    });

    const ranqueados = Object.keys(contagem).sort(function (a, b) {
      if (contagem[b] !== contagem[a]) return contagem[b] - contagem[a];
      return indiceUltimo[b] - indiceUltimo[a];
    });

    const resultado = ranqueados.slice(0, 3);
    // Completa com padrões se o usuário ainda não usou 3 modos diferentes
    for (let i = 0; resultado.length < 3 && i < CHIPS_PADRAO.length; i++) {
      if (!resultado.includes(CHIPS_PADRAO[i])) resultado.push(CHIPS_PADRAO[i]);
    }
    return resultado.slice(0, 3);
  }

  function renderizarChipsRapidos(slugs) {
    const container = document.querySelector(".suggestion-chips");
    if (!container) return;

    if (!slugs) slugs = calcularModosRapidos();
    container.innerHTML = "";

    slugs.forEach(function (slug) {
      const dados = MODOS[slug];
      if (!dados) return;
      const btn = document.createElement("button");
      btn.className = "chip";
      btn.dataset.mode = slug;
      btn.style.setProperty("--chip-color", dados.cor);
      btn.innerHTML =
        "<span>" + (ICONES_MODO[slug] || "✨") + "</span>" +
        "<span>" + dados.nome + "</span>";
      if (slug === estado.modoAtual) btn.classList.add("active");
      container.appendChild(btn);
    });
  }

  // Quando o usuário ativa um modo que não está nos chips
  // (ex: escolheu Caderno no overlay), substitui o último
  // chip do trio pelo novo modo — visual imediato, sem
  // esperar a próxima captura pra ele aparecer.
  function inserirChipSeNecessario(slug) {
    if (!slug || slug === "foto") return;
    const container = document.querySelector(".suggestion-chips");
    if (!container) return;
    if (container.querySelector('[data-mode="' + slug + '"]')) return;

    const lista = Array.from(container.querySelectorAll(".chip[data-mode]"))
      .map(function (c) { return c.dataset.mode; });
    lista.pop();
    lista.push(slug);
    renderizarChipsRapidos(lista);
  }

  // Delegação no container — como os chips são re-renderizados,
  // não dá pra confiar nos handlers diretos da seção 8.
  const chipsContainer = document.querySelector(".suggestion-chips");
  if (chipsContainer) {
    chipsContainer.addEventListener("click", function (evento) {
      const chip = evento.target.closest(".chip[data-mode]");
      if (!chip || !chipsContainer.contains(chip)) return;
      const slug = chip.dataset.mode;
      if (estado.modoAtual === slug && slug !== "foto") {
        ativarModo("foto");
      } else {
        ativarModo(slug);
      }
    });
  }

  // Render inicial — substitui os chips estáticos do HTML
  renderizarChipsRapidos();

  // =====================================================
  // 9) BOTTOM SHEETS (overlays de modos e avançado)
  // =====================================================

  function abrirOverlay(idOverlay) {
    const overlay = document.getElementById(idOverlay);
    if (!overlay) return;

    overlay.removeAttribute("hidden");
    setTimeout(function () { overlay.classList.add("aberto"); }, 10);
    document.body.style.overflow = "hidden";
  }

  function fecharOverlay(overlay) {
    if (!overlay) return;
    overlay.classList.remove("aberto");
    setTimeout(function () {
      overlay.setAttribute("hidden", "");
      document.body.style.overflow = "";
    }, 350);
  }

  document.querySelectorAll("[data-open]").forEach(function (botao) {
    botao.addEventListener("click", function () {
      abrirOverlay(botao.dataset.open);
    });
  });

  document.querySelectorAll("[data-close]").forEach(function (el) {
    el.addEventListener("click", function () {
      fecharOverlay(el.closest(".overlay"));
    });
  });

  document.addEventListener("keydown", function (evento) {
    if (evento.key === "Escape") {
      const overlayAberto = document.querySelector(".overlay.aberto");
      if (overlayAberto) fecharOverlay(overlayAberto);
    }
  });

  // =====================================================
  // 10) SLIDERS DE AJUSTE — Brilho, Saturação, Contraste
  // =====================================================

  function ligarSlider(idInput, idValor, chave, sufixo) {
    const input  = document.getElementById(idInput);
    const valor  = document.getElementById(idValor);
    if (!input || !valor) return;

    input.addEventListener("input", function () {
      const v = parseInt(input.value, 10);
      estado.ajustes[chave] = v;
      valor.textContent = v + (sufixo || "%");
      aplicarFiltroNoVideo();
    });
  }

  ligarSlider("ctrlBrilho",     "valBrilho",     "brilho");
  ligarSlider("ctrlSaturacao",  "valSaturacao",  "saturacao");
  ligarSlider("ctrlContraste",  "valContraste",  "contraste");

  // Restaurar padrão
  const botaoReset = document.getElementById("resetAjustes");
  if (botaoReset) {
    botaoReset.addEventListener("click", function () {
      estado.ajustes.brilho = estado.ajustes.saturacao = estado.ajustes.contraste = 100;

      ["ctrlBrilho", "ctrlSaturacao", "ctrlContraste"].forEach(function (id) {
        const el = document.getElementById(id);
        if (el) el.value = 100;
      });
      ["valBrilho", "valSaturacao", "valContraste"].forEach(function (id) {
        const el = document.getElementById(id);
        if (el) el.textContent = "100%";
      });

      aplicarFiltroNoVideo();
    });
  }

  // =====================================================
  // 11) PROPORÇÃO (segmented) — muda aspect-ratio do video
  // =====================================================

  document.querySelectorAll(".seg-btn[data-aspect]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      // Marca apenas o clicado dentro do mesmo grupo
      const grupo = btn.parentElement;
      grupo.querySelectorAll(".seg-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const aspecto = btn.dataset.aspect;
      estado.aspecto = aspecto;

      // Tira todas as classes ratio-* anteriores
      if (elementoVideo) {
        elementoVideo.classList.remove("ratio-3-4", "ratio-1-1", "ratio-9-16", "ratio-16-9");
        if (aspecto !== "full") {
          elementoVideo.classList.add("ratio-" + aspecto);
        }
      }
    });
  });

  // =====================================================
  // 12) TIMER — botão do topo (cicla 0→3→5→10) +
  //     segmented control no menu avançado (opção fixa)
  // =====================================================
  // Os dois ficam sincronizados: clicar num atualiza o outro.

  const TIMER_VALORES   = [0, 3, 5, 10];
  const botaoTimerTopo  = document.querySelector('[data-control="timer"]');
  const timerBadge      = botaoTimerTopo ? botaoTimerTopo.querySelector(".timer-badge") : null;

  function aplicarTimer(valor) {
    estado.timer = valor;

    // Sincroniza segmented control no menu avançado
    document.querySelectorAll(".seg-btn[data-timer]").forEach(function (b) {
      const v = parseInt(b.dataset.timer, 10);
      if (v === valor) b.classList.add("active");
      else             b.classList.remove("active");
    });

    // Atualiza badge no botão do topo (só aparece quando timer > 0)
    if (timerBadge && botaoTimerTopo) {
      if (valor > 0) {
        timerBadge.textContent = valor + "s";
        timerBadge.removeAttribute("hidden");
        botaoTimerTopo.classList.add("active");
        botaoTimerTopo.style.color = "#FDCB6E";
      } else {
        timerBadge.setAttribute("hidden", "");
        botaoTimerTopo.classList.remove("active");
        botaoTimerTopo.style.color = "";
      }
    }
  }

  // Botão do topo: cicla pelo próximo valor
  if (botaoTimerTopo) {
    botaoTimerTopo.addEventListener("click", function () {
      const idx = TIMER_VALORES.indexOf(estado.timer);
      const proximo = TIMER_VALORES[(idx + 1) % TIMER_VALORES.length];
      aplicarTimer(proximo);
    });
  }

  // Segmented control no menu avançado
  document.querySelectorAll(".seg-btn[data-timer]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      aplicarTimer(parseInt(btn.dataset.timer, 10) || 0);
    });
  });

  // =====================================================
  // 13) CAPTURA — clique no botão grande
  // =====================================================
  // Fluxo:
  //   1. Se o timer estiver ligado, mostra contagem regressiva
  //   2. Toca som + vibra
  //   3. Renderiza o frame do <video> num <canvas> aplicando filtros
  //   4. Salva via LensLabPhotos
  //   5. Vai pra pos-captura.html

  if (botaoCaptura) {
    botaoCaptura.addEventListener("click", async function () {
      if (estado.capturando) return;     // evita dupla captura
      if (!estado.streamAtivo && !estado.demo.ativo) {
        alert("⚠️ Câmera não está ativa. Use o modo demo se não tiver webcam.");
        return;
      }

      estado.capturando = true;

      try {
        // Contagem regressiva, se houver
        if (estado.timer > 0) {
          await rodarCountdown(estado.timer);
        }

        // Efeitos (som não toca em modo silencioso)
        if (!estado.silencioso) tocarSomObturador();
        vibrarBreve();
        animarFlash();

        // Captura o frame
        const dataURL = capturarFrame();

        // Se for modo de estudo (Documento ou Caderno), pergunta a matéria
        let materia = null;
        if (estado.modoAtual === "doc" || estado.modoAtual === "caderno") {
          materia = await perguntarMateria();
        }

        // Salva (com extras se houver)
        const foto = await LensLabPhotos.salvar(
          dataURL,
          estado.modoAtual,
          { ...estado.ajustes },
          { materia: materia }
        );

        // Registra o padrão de uso (pra sugestões adaptativas)
        registrarUsoModo(estado.modoAtual);

        // Mostra timestamp brevemente
        mostrarTimestamp();

        // Atualiza o thumbnail
        atualizarThumbnail(dataURL);

        // Vai pra pós-captura passando o id pela URL
        setTimeout(function () {
          window.location.href = "pos-captura.html?id=" + encodeURIComponent(foto.id);
        }, 350);

      } catch (erro) {
        console.error("[câmera] Erro na captura:", erro);
        alert("⚠️ Erro ao capturar foto: " + (erro.message || erro));
        estado.capturando = false;
      }
    });
  }

  // -----------------------------------------------------
  // Renderiza o frame do <video> num <canvas> com filtros
  // -----------------------------------------------------

  function capturarFrame() {
    // Em demo mode a fonte é o <img> (upload) ou o <canvas> (cena renderizada).
    let fonte = elementoVideo;
    if (estado.demo.ativo) {
      fonte = (estado.demo.fonte === "upload") ? demoImg : demoCanvas;
    }

    if (!fonte || !canvasCaptura) {
      throw new Error("Fonte de captura ou canvas não encontrado");
    }

    const w = fonte.videoWidth  || fonte.naturalWidth  || fonte.width  || 1280;
    const h = fonte.videoHeight || fonte.naturalHeight || fonte.height || 720;

    // Determina dimensões finais com base na proporção escolhida
    let larguraFinal = w;
    let alturaFinal  = h;
    let offsetX = 0;
    let offsetY = 0;

    if (estado.aspecto !== "full") {
      const proporcoes = {
        "1-1":  1,
        "3-4":  3 / 4,
        "9-16": 9 / 16,
        "16-9": 16 / 9
      };
      const ratio = proporcoes[estado.aspecto];
      if (ratio) {
        const ratioVideo = w / h;
        if (ratioVideo > ratio) {
          // vídeo mais largo do que o desejado — corta nas laterais
          larguraFinal = Math.round(h * ratio);
          alturaFinal  = h;
          offsetX = Math.round((w - larguraFinal) / 2);
        } else {
          // vídeo mais alto do que o desejado — corta em cima/baixo
          larguraFinal = w;
          alturaFinal  = Math.round(w / ratio);
          offsetY = Math.round((h - alturaFinal) / 2);
        }
      }
    }

    canvasCaptura.width  = larguraFinal;
    canvasCaptura.height = alturaFinal;

    const ctx = canvasCaptura.getContext("2d");

    // Aplica os mesmos filtros do preview
    const dadosModo = MODOS[estado.modoAtual] || MODOS.foto;
    const filtroModo = dadosModo.filtro && dadosModo.filtro !== "none" ? dadosModo.filtro : "";
    const filtroAjustes =
      "brightness(" + (estado.ajustes.brilho / 100) + ")" +
      " saturate(" + (estado.ajustes.saturacao / 100) + ")" +
      " contrast(" + (estado.ajustes.contraste / 100) + ")";
    ctx.filter = (filtroModo + " " + filtroAjustes).trim();

    // Espelha se for câmera frontal (parece mais natural pro usuário).
    // No modo demo nunca espelhamos — a imagem é estática e já está como o usuário escolheu.
    if (!estado.demo.ativo && estado.facingMode === "user") {
      ctx.translate(larguraFinal, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(
      fonte,
      offsetX, offsetY, larguraFinal, alturaFinal,
      0, 0, larguraFinal, alturaFinal
    );

    return canvasCaptura.toDataURL("image/jpeg", 0.9);
  }

  // =====================================================
  // 14) CONTAGEM REGRESSIVA (timer)
  // =====================================================

  function rodarCountdown(segundos) {
    return new Promise(function (resolve) {
      if (!countdownOverlay || !countdownNum) {
        setTimeout(resolve, segundos * 1000);
        return;
      }

      countdownOverlay.removeAttribute("hidden");
      let restante = segundos;
      countdownNum.textContent = restante;
      countdownNum.classList.remove("anim");
      // força reflow pra reiniciar a animação
      void countdownNum.offsetWidth;
      countdownNum.classList.add("anim");

      const intervalo = setInterval(function () {
        restante--;
        if (restante <= 0) {
          clearInterval(intervalo);
          countdownOverlay.setAttribute("hidden", "");
          resolve();
        } else {
          countdownNum.textContent = restante;
          countdownNum.classList.remove("anim");
          void countdownNum.offsetWidth;
          countdownNum.classList.add("anim");
        }
      }, 1000);
    });
  }

  // =====================================================
  // 15) EFEITOS — flash branco, som, vibração, timestamp
  // =====================================================

  function animarFlash() {
    const flash = document.createElement("div");
    flash.className = "flash-efeito";
    document.querySelector(".camera-app").appendChild(flash);
    setTimeout(() => { flash.style.opacity = "0"; }, 50);
    setTimeout(() => { flash.remove(); }, 400);
  }

  function tocarSomObturador() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "square";
      osc.frequency.setValueAtTime(900, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);

      osc.start();
      osc.stop(ctx.currentTime + 0.13);

      // Fecha o contexto depois pra não vazar
      setTimeout(() => { try { ctx.close(); } catch (e) {} }, 300);
    } catch (e) {
      // Web Audio bloqueado — silencia
    }
  }

  function vibrarBreve() {
    try {
      if (navigator.vibrate) navigator.vibrate(40);
    } catch (e) { /* ignora */ }
  }

  function mostrarTimestamp() {
    if (!captureTimestamp) return;
    const agora = new Date();
    const hh = String(agora.getHours()).padStart(2, "0");
    const mm = String(agora.getMinutes()).padStart(2, "0");
    const ss = String(agora.getSeconds()).padStart(2, "0");
    captureTimestamp.textContent = "Capturada às " + hh + ":" + mm + ":" + ss;
    captureTimestamp.removeAttribute("hidden");
    captureTimestamp.classList.add("aparece");

    setTimeout(function () {
      captureTimestamp.classList.remove("aparece");
      setTimeout(() => captureTimestamp.setAttribute("hidden", ""), 300);
    }, 1500);
  }

  // =====================================================
  // 16) THUMBNAIL — mostra a última foto no canto
  // =====================================================

  function atualizarThumbnail(dataURL) {
    if (!thumbnailImg) return;
    thumbnailImg.src = dataURL;
    thumbnailImg.removeAttribute("hidden");
  }

  // Carrega thumbnail da última foto ao abrir a página
  if (window.LensLabPhotos) {
    const ultima = LensLabPhotos.listar()[0];
    if (ultima) atualizarThumbnail(ultima.dataURL);
  }

  // =====================================================
  // 17) MODE-SELECTOR INFERIOR (Foto / Vídeo / Retrato / Noturno)
  // =====================================================
  // "Vídeo" não está implementado — mostramos um aviso suave.
  // "Foto", "Retrato" e "Noturno" mapeiam pros modos correspondentes.

  document.querySelectorAll(".mode-item").forEach(function (item) {
    item.addEventListener("click", function () {
      const texto = item.textContent.trim().toLowerCase();
      document.querySelectorAll(".mode-item").forEach(i => i.classList.remove("active"));
      item.classList.add("active");

      if (texto === "foto")          ativarModo("foto");
      else if (texto === "retrato")  ativarModo("portrait");
      else if (texto === "noturno")  ativarModo("night");
      else if (texto === "vídeo") {
        // Não implementado nesta versão
        alert("🎬 Modo Vídeo: em breve!");
      }
    });
  });

  // =====================================================
  // 18) MODO DEMO — testar sem webcam
  // =====================================================
  // Para quem não tem câmera (ou negou permissão), o usuário
  // pode escolher uma cena pré-renderizada ou carregar uma
  // imagem do dispositivo. O fluxo de captura, filtros,
  // ajustes e salvamento funciona normalmente.
  // =====================================================

  // Paletas de cores das cenas (gradiente vertical do topo p/ base)
  const CENAS = {
    sunset:   { nome: "Pôr do sol",     cores: ["#FF6B6B", "#FFA75A", "#FFE08A"] },
    ocean:    { nome: "Oceano",         cores: ["#0F3460", "#1B4F8C", "#3BA0E8"] },
    forest:   { nome: "Floresta",       cores: ["#0D3B22", "#1F7A3D", "#5BD37D"] },
    city:     { nome: "Cidade noturna", cores: ["#0B0B1F", "#1B1B3A", "#6C5CE7"] },
    food:     { nome: "Comida",         cores: ["#3A1E0E", "#A04522", "#E17055"] },
    document: { nome: "Documento",      cores: ["#FFFFFF", "#F4F2EE", "#E8E5DD"] }
  };

  function renderizarCena(slug) {
    const cena = CENAS[slug];
    if (!cena || !demoCanvas) return;

    const w = 1280;
    const h = 720;
    demoCanvas.width  = w;
    demoCanvas.height = h;

    const ctx = demoCanvas.getContext("2d");

    // Gradiente base
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    cena.cores.forEach(function (cor, i) {
      grad.addColorStop(i / (cena.cores.length - 1), cor);
    });
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Detalhes característicos por cena (ajudam a identificar o modo certo)
    if (slug === "sunset") {
      ctx.fillStyle = "rgba(255, 220, 100, 0.85)";
      ctx.beginPath();
      ctx.arc(w / 2, h * 0.55, 95, 0, Math.PI * 2);
      ctx.fill();
    } else if (slug === "ocean") {
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 2;
      for (let y = h * 0.5; y < h; y += 28) {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 20) {
          const yy = y + Math.sin(x / 38 + y / 30) * 8;
          if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
    } else if (slug === "forest") {
      for (let i = 0; i < 14; i++) {
        const x = (i + 0.5) * (w / 14) + (Math.random() - 0.5) * 30;
        const baseY = h * 0.95;
        const altura = 90 + Math.random() * 110;
        ctx.fillStyle = "rgba(20, 60, 30, 0.75)";
        ctx.beginPath();
        ctx.moveTo(x, baseY - altura);
        ctx.lineTo(x - 38, baseY);
        ctx.lineTo(x + 38, baseY);
        ctx.closePath();
        ctx.fill();
      }
    } else if (slug === "city") {
      for (let i = 0; i < 80; i++) {
        ctx.fillStyle = "rgba(255, 220, " + (100 + Math.random() * 100) + ", " + (0.4 + Math.random() * 0.6) + ")";
        ctx.fillRect(Math.random() * w, h * 0.55 + Math.random() * h * 0.4, 3, 3);
      }
    } else if (slug === "food") {
      ctx.fillStyle = "rgba(255, 240, 200, 0.65)";
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 220, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(180, 60, 40, 0.85)";
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 140, 0, Math.PI * 2);
      ctx.fill();
    } else if (slug === "document") {
      ctx.fillStyle = "#2A2A2A";
      for (let y = 90; y < h - 70; y += 34) {
        const largura = w * 0.76 - Math.random() * 120;
        ctx.fillRect(w * 0.12, y, largura, 6);
      }
    }
  }

  function entrarDemo(tipo, payload) {
    pararCamera();
    if (blocoErro) blocoErro.setAttribute("hidden", "");

    estado.demo.ativo = true;
    estado.demo.fonte = tipo;

    if (elementoVideo) elementoVideo.setAttribute("hidden", "");

    if (tipo === "upload" && demoImg) {
      if (demoCanvas) demoCanvas.setAttribute("hidden", "");
      demoImg.src = payload.dataURL;
      demoImg.removeAttribute("hidden");
      estado.demo.nomeFonte = payload.nome ? "Arquivo: " + payload.nome : "Imagem carregada";
    } else if (tipo === "scene" && demoCanvas) {
      if (demoImg) demoImg.setAttribute("hidden", "");
      renderizarCena(payload.slug);
      demoCanvas.removeAttribute("hidden");
      const dadosCena = CENAS[payload.slug];
      estado.demo.nomeFonte = "Cena: " + (dadosCena ? dadosCena.nome : payload.slug);
    }

    if (demoBanner) {
      if (demoSourceName) demoSourceName.textContent = estado.demo.nomeFonte;
      demoBanner.removeAttribute("hidden");
    }

    aplicarFiltroNoVideo();
  }

  function sairDemo() {
    estado.demo.ativo = false;
    estado.demo.fonte = null;
    estado.demo.nomeFonte = "";

    if (demoImg)    demoImg.setAttribute("hidden", "");
    if (demoCanvas) demoCanvas.setAttribute("hidden", "");
    if (demoBanner) demoBanner.setAttribute("hidden", "");
    if (elementoVideo) elementoVideo.removeAttribute("hidden");

    iniciarCamera();
  }

  // Botão "Usar modo demo" da tela de erro
  if (botaoEntrarDemo) {
    botaoEntrarDemo.addEventListener("click", function () {
      abrirOverlay("demo-picker");
    });
  }

  // Botão "Carregar do dispositivo" do picker
  if (demoUploadTrigger && demoFileInput) {
    demoUploadTrigger.addEventListener("click", function () {
      demoFileInput.click();
    });

    demoFileInput.addEventListener("change", function (evento) {
      const arquivo = evento.target.files && evento.target.files[0];
      if (!arquivo) return;

      if (!arquivo.type.startsWith("image/")) {
        alert("⚠️ Selecione um arquivo de imagem (JPG, PNG, etc).");
        return;
      }

      const leitor = new FileReader();
      leitor.onload = function (e) {
        entrarDemo("upload", { dataURL: e.target.result, nome: arquivo.name });
        const overlay = document.getElementById("demo-picker");
        if (overlay) fecharOverlay(overlay);
      };
      leitor.onerror = function () {
        alert("⚠️ Não foi possível ler a imagem selecionada.");
      };
      leitor.readAsDataURL(arquivo);

      // Limpa o input pra permitir selecionar o mesmo arquivo de novo depois
      demoFileInput.value = "";
    });
  }

  // Cenas pré-renderizadas
  document.querySelectorAll("[data-scene]").forEach(function (botao) {
    botao.addEventListener("click", function () {
      entrarDemo("scene", { slug: botao.dataset.scene });
      const overlay = botao.closest(".overlay");
      if (overlay) fecharOverlay(overlay);
    });
  });

  // Ações do banner de demo: trocar fonte / sair
  document.querySelectorAll("[data-demo-action]").forEach(function (botao) {
    botao.addEventListener("click", function () {
      const acao = botao.dataset.demoAction;
      if (acao === "picker")     abrirOverlay("demo-picker");
      else if (acao === "exit")  sairDemo();
    });
  });

  // =====================================================
  // 19) CADERNO DIGITAL — pergunta a matéria após capturar
  //     em modo Documento ou Caderno
  // =====================================================

  // Mostra a bottom-sheet de seleção de matéria. Devolve Promise<string|null>.
  // - Lista as matérias já cadastradas (clique seleciona, lixeira apaga do histórico)
  // - Permite digitar uma nova matéria
  // - Botão "Pular" / clicar fora resolve com null
  function perguntarMateria() {
    return new Promise(function (resolve) {
      const overlay = document.getElementById("materia-overlay");
      const lista   = document.getElementById("materiaList");
      const form    = document.getElementById("materiaNewForm");
      const input   = document.getElementById("materiaNewInput");

      if (!overlay || !lista || !form || !input) {
        resolve(null);
        return;
      }

      let resolvido = false;
      const ctrl = new AbortController();   // remove todos listeners ao fechar

      function fechar(valor) {
        if (resolvido) return;
        resolvido = true;
        ctrl.abort();
        overlay.classList.remove("aberto");
        setTimeout(function () {
          overlay.setAttribute("hidden", "");
          document.body.style.overflow = "";
        }, 300);
        resolve(valor);
      }

      function renderLista() {
        const materias = (window.LensLabPhotos && LensLabPhotos.materiasUsadas)
          ? LensLabPhotos.materiasUsadas()
          : [];

        if (materias.length === 0) {
          lista.innerHTML =
            '<p class="materia-vazio">Nenhuma matéria cadastrada ainda. ' +
            'Adicione a primeira abaixo.</p>';
          return;
        }

        lista.innerHTML = materias.map(function (m) {
          const seguro = String(m).replace(/"/g, "&quot;");
          return ""
            + '<div class="materia-item">'
            +   '<button type="button" class="materia-pick" data-materia="' + seguro + '">'
            +     '<span class="materia-pick-icon">📚</span>'
            +     '<span class="materia-pick-name">' + m + '</span>'
            +   '</button>'
            +   '<button type="button" class="materia-del" data-materia-del="' + seguro + '" '
            +     'aria-label="Apagar &quot;' + seguro + '&quot;">🗑</button>'
            + '</div>';
        }).join("");
      }

      // Delegação no container da lista (selecionar OU apagar)
      lista.addEventListener("click", function (evento) {
        const pickBtn = evento.target.closest("[data-materia]");
        if (pickBtn) {
          fechar(pickBtn.dataset.materia);
          return;
        }
        const delBtn = evento.target.closest("[data-materia-del]");
        if (delBtn) {
          const nome = delBtn.dataset.materiaDel;
          const ok = confirm(
            'Apagar "' + nome + '" do histórico?\n\n' +
            "Fotos antigas com essa matéria perdem o vínculo, " +
            "mas as imagens em si ficam preservadas. Você pode " +
            "cadastrar de novo com o nome corrigido."
          );
          if (ok && window.LensLabPhotos && LensLabPhotos.removerMateria) {
            const n = LensLabPhotos.removerMateria(nome);
            if (n > 0) {
              alert("✓ Matéria removida (" + n + " foto" +
                    (n === 1 ? "" : "s") + " atualizada" +
                    (n === 1 ? "" : "s") + ").");
            }
            renderLista();
          }
        }
      }, { signal: ctrl.signal });

      // Submeter nova matéria
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        const valor = input.value.trim();
        if (!valor) return;

        // Se a matéria já existe (case-insensitive), reaproveita o nome canônico
        const existentes = LensLabPhotos.materiasUsadas();
        const match = existentes.find(function (m) {
          return m.toLowerCase() === valor.toLowerCase();
        });
        fechar(match || valor);
      }, { signal: ctrl.signal });

      // Pular (botões e backdrop)
      document.querySelectorAll("[data-materia-skip]").forEach(function (el) {
        el.addEventListener("click", function () { fechar(null); }, { signal: ctrl.signal });
      });

      // ESC fecha
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") fechar(null);
      }, { signal: ctrl.signal });

      // Estado inicial
      renderLista();
      input.value = "";

      // Abre o overlay (reusa as classes já existentes do .overlay)
      overlay.removeAttribute("hidden");
      setTimeout(function () { overlay.classList.add("aberto"); }, 10);
      document.body.style.overflow = "hidden";

      // Foca no input só se não houver matérias (pra acelerar primeiro cadastro)
      setTimeout(function () {
        if (lista.querySelectorAll(".materia-pick").length === 0) {
          input.focus();
        }
      }, 350);
    });
  }

  // =====================================================
  // 20) SUGESTÕES ADAPTATIVAS — aprende sua rotina
  // =====================================================
  // A cada captura registramos { modo, hora, diaSemana }.
  // Ao abrir a câmera, se nesta mesma faixa de horário e
  // dia da semana o mesmo modo já foi usado >= 3 vezes,
  // mostramos um banner sugerindo ativá-lo.

  const CHAVE_PADROES = "lenslab:padroesUso";
  const CHAVE_DISPENSAS = "lenslab:padroesDispensados";

  function registrarUsoModo(modo) {
    if (!modo || modo === "foto") return;
    try {
      const lista = JSON.parse(localStorage.getItem(CHAVE_PADROES) || "[]");
      const agora = new Date();
      lista.push({
        modo:       modo,
        hora:       agora.getHours(),
        diaSemana:  agora.getDay(),
        quando:     agora.toISOString()
      });
      // Limita a 100 registros (mantém os mais recentes)
      if (lista.length > 100) lista.splice(0, lista.length - 100);
      localStorage.setItem(CHAVE_PADROES, JSON.stringify(lista));
    } catch (e) {
      console.warn("[padrão] Falha ao registrar uso:", e);
    }
  }

  function detectarPadrao() {
    let lista;
    try {
      lista = JSON.parse(localStorage.getItem(CHAVE_PADROES) || "[]");
    } catch (e) { return null; }
    if (!Array.isArray(lista) || lista.length < 3) return null;

    const agora = new Date();
    const horaAtual = agora.getHours();
    const diaAtual  = agora.getDay();

    // Conta usos no MESMO dia da semana e dentro de ±1h
    const contagem = {};
    lista.forEach(function (uso) {
      if (uso.diaSemana !== diaAtual) return;
      if (Math.abs(uso.hora - horaAtual) > 1) return;
      contagem[uso.modo] = (contagem[uso.modo] || 0) + 1;
    });

    let modoTop = null, max = 0;
    Object.keys(contagem).forEach(function (m) {
      if (contagem[m] > max) { max = contagem[m]; modoTop = m; }
    });

    return (max >= 3 && modoTop) ? { modo: modoTop, contagem: max } : null;
  }

  function jaFoiDispensadoHoje(modo) {
    try {
      const dispensas = JSON.parse(localStorage.getItem(CHAVE_DISPENSAS) || "{}");
      const hoje = new Date().toISOString().slice(0, 10); // "2026-04-30"
      return dispensas[hoje] && dispensas[hoje].includes(modo);
    } catch (e) { return false; }
  }

  function dispensarPadraoHoje(modo) {
    try {
      const dispensas = JSON.parse(localStorage.getItem(CHAVE_DISPENSAS) || "{}");
      const hoje = new Date().toISOString().slice(0, 10);
      if (!dispensas[hoje]) dispensas[hoje] = [];
      if (!dispensas[hoje].includes(modo)) dispensas[hoje].push(modo);
      localStorage.setItem(CHAVE_DISPENSAS, JSON.stringify(dispensas));
    } catch (e) { /* ignora */ }
  }

  function diaDaSemanaTexto(d) {
    return ["domingos","segundas","terças","quartas","quintas","sextas","sábados"][d] || "";
  }

  function mostrarBannerAdaptativo(padrao) {
    const banner = document.getElementById("adaptiveBanner");
    const texto  = document.getElementById("adaptiveText");
    if (!banner || !texto) return;

    const nomeModo = (MODOS[padrao.modo] && MODOS[padrao.modo].nome) || padrao.modo;
    const dia = diaDaSemanaTexto(new Date().getDay());
    texto.innerHTML =
      "💡 Toda " + dia + " neste horário você usa <strong>" + nomeModo + "</strong>.";

    banner.dataset.modo = padrao.modo;
    banner.removeAttribute("hidden");
  }

  // Wire up botões do banner adaptativo
  document.querySelectorAll("[data-adaptive-action]").forEach(function (botao) {
    botao.addEventListener("click", function () {
      const banner = document.getElementById("adaptiveBanner");
      if (!banner) return;
      const acao = botao.dataset.adaptiveAction;
      const modo = banner.dataset.modo;

      if (acao === "ativar" && modo) {
        ativarModo(modo);
      } else if (acao === "dispensar" && modo) {
        dispensarPadraoHoje(modo);
      }
      banner.setAttribute("hidden", "");
    });
  });

  // Roda na carga: detecta padrão e mostra banner
  (function inicializarSugestaoAdaptativa() {
    const padrao = detectarPadrao();
    if (!padrao) return;
    if (jaFoiDispensadoHoje(padrao.modo)) return;
    if (estado.modoAtual === padrao.modo) return; // já está nesse modo
    // Mostra com pequeno atraso pra não competir com a animação de entrada
    setTimeout(function () { mostrarBannerAdaptativo(padrao); }, 800);
  })();

  // =====================================================
  // 21) MODO SILENCIOSO POR CONTEXTO
  // =====================================================
  // Ativa automaticamente entre 22h e 7h (biblioteca, cinema,
  // dormitório). Pode ser alternado manualmente pelo usuário.

  function deveSerSilencioso() {
    const h = new Date().getHours();
    return (h >= 22 || h < 7);
  }

  function aplicarSilencioso(ativar, motivo) {
    estado.silencioso = !!ativar;
    const badge = document.getElementById("silentBadge");
    if (!badge) return;

    if (ativar) {
      const motivoTxt = motivo || "horário noturno";
      badge.innerHTML =
        '<span class="silent-icon">🔇</span>' +
        '<span class="silent-text">Modo silencioso</span>' +
        '<span class="silent-reason">· ' + motivoTxt + '</span>';
      badge.removeAttribute("hidden");
      badge.classList.add("ativo");
    } else {
      badge.setAttribute("hidden", "");
      badge.classList.remove("ativo");
    }
  }

  // Inicializa: liga sozinho se for noite
  if (deveSerSilencioso()) {
    aplicarSilencioso(true, "noite");
  }

  // Toggle ao clicar no badge
  const silentBadge = document.getElementById("silentBadge");
  if (silentBadge) {
    silentBadge.addEventListener("click", function () {
      aplicarSilencioso(!estado.silencioso, "manual");
    });
  }

  console.log("✓ camera.js carregado");
});
