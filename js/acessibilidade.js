/* ============================================
   ACESSIBILIDADE — LensLab
   US-05: Modo Simples por Voz (idoso)
   US-06: Audiodescrição (baixa visão)

   Usa as APIs nativas do navegador:
   - SpeechRecognition  (escuta de comandos)
   - SpeechSynthesis    (leitura em voz alta)

   Sem bibliotecas externas. JavaScript puro.
   ============================================ */

const Acessibilidade = {

  CHAVE_VOZ:   "lenslab_modo_voz",
  CHAVE_AUDIO: "lenslab_audiodescricao",


  reconhecedor: null,
  vozAtiva: false,
  audioAtivo: false,
  ultimaFalaTimestamp: 0,


  COMANDOS: [
    { palavras: ["tirar foto", "tira foto", "foto", "capturar", "fotografar", "clique"], acao: "capturar" },
    { palavras: ["abrir galeria", "galeria", "ver fotos", "minhas fotos"],               acao: "galeria"  },
    { palavras: ["abrir câmera", "câmera", "camera", "abrir camera"],                    acao: "camera"   },
    { palavras: ["abrir modos", "modos", "ver modos"],                                   acao: "modos"    },
    { palavras: ["início", "inicio", "home", "página inicial"],                          acao: "home"     },
    { palavras: ["voltar", "volta"],                                                     acao: "voltar"   },
    { palavras: ["sair", "desligar voz", "parar", "desativar"],                          acao: "sair"     },
    { palavras: ["ajuda", "comandos", "o que posso falar"],                              acao: "ajuda"    }
  ],


  init: function () {

    this.vozAtiva   = localStorage.getItem(this.CHAVE_VOZ)   === "true";
    this.audioAtivo = localStorage.getItem(this.CHAVE_AUDIO) === "true";

    this.montarUI();
    this.ligarEventos();


    if (this.vozAtiva)   this.aplicarClasseBody("modo-simples-voz", true);
    if (this.audioAtivo) this.aplicarClasseBody("audiodescricao", true);


    const togVoz   = document.getElementById("toggleVoz");
    const togAudio = document.getElementById("toggleAudio");
    if (togVoz)   togVoz.checked   = this.vozAtiva;
    if (togAudio) togAudio.checked = this.audioAtivo;


    if (this.vozAtiva)   this.iniciarReconhecimento();
    if (this.audioAtivo) this.anunciarPagina();
  },


  montarUI: function () {

    if (document.getElementById("a11yFab")) return;

    const html = `
      <button type="button" class="a11y-fab" id="a11yFab"
              aria-label="Abrir menu de acessibilidade"
              aria-expanded="false" aria-controls="a11yPanel"
              title="Acessibilidade">♿</button>

      <div class="a11y-panel" id="a11yPanel" role="dialog"
           aria-label="Recursos de acessibilidade" hidden>
        <header class="a11y-panel-head">
          <h3>Acessibilidade</h3>
          <button class="a11y-close" id="a11yClose" aria-label="Fechar">✕</button>
        </header>

        <div class="a11y-option">
          <div class="a11y-option-text">
            <strong>🎤 Modo Simples por Voz</strong>
            <small>Controle por voz e botões maiores</small>
          </div>
          <label class="a11y-switch">
            <input type="checkbox" id="toggleVoz">
            <span class="a11y-slider"></span>
          </label>
        </div>

        <div class="a11y-option">
          <div class="a11y-option-text">
            <strong>🔊 Audiodescrição</strong>
            <small>Lê botões e links em voz alta</small>
          </div>
          <label class="a11y-switch">
            <input type="checkbox" id="toggleAudio">
            <span class="a11y-slider"></span>
          </label>
        </div>

        <button class="a11y-help" id="a11yHelp" type="button">
          Ver comandos de voz disponíveis
        </button>
      </div>

      <div class="voice-indicator" id="voiceIndicator" hidden>
        <span class="voice-pulse"></span>
        <span class="voice-text" id="voiceText">Diga um comando...</span>
      </div>
    `;

    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);
  },


  ligarEventos: function () {
    const fab        = document.getElementById("a11yFab");
    const painel     = document.getElementById("a11yPanel");
    const botaoFechar = document.getElementById("a11yClose");
    const togVoz     = document.getElementById("toggleVoz");
    const togAudio   = document.getElementById("toggleAudio");
    const botaoAjuda = document.getElementById("a11yHelp");

    if (!fab) return;


    fab.addEventListener("click", () => this.alternarPainel());
    botaoFechar.addEventListener("click", () => this.fecharPainel());


    document.addEventListener("click", (evento) => {
      if (painel.hasAttribute("hidden")) return;
      if (painel.contains(evento.target)) return;
      if (fab.contains(evento.target)) return;
      this.fecharPainel();
    });


    togVoz.addEventListener("change", (e) => {
      if (e.target.checked) this.ativarVoz();
      else this.desativarVoz();
    });

    togAudio.addEventListener("change", (e) => {
      if (e.target.checked) this.ativarAudio();
      else this.desativarAudio();
    });

    botaoAjuda.addEventListener("click", () => this.mostrarAjuda());
  },


  alternarPainel: function () {
    const painel = document.getElementById("a11yPanel");
    const fab    = document.getElementById("a11yFab");

    if (painel.hasAttribute("hidden")) {
      painel.removeAttribute("hidden");
      fab.setAttribute("aria-expanded", "true");
    } else {
      this.fecharPainel();
    }
  },

  fecharPainel: function () {
    const painel = document.getElementById("a11yPanel");
    const fab    = document.getElementById("a11yFab");
    painel.setAttribute("hidden", "");
    fab.setAttribute("aria-expanded", "false");
  },



  ativarVoz: function () {
    this.vozAtiva = true;
    localStorage.setItem(this.CHAVE_VOZ, "true");
    this.aplicarClasseBody("modo-simples-voz", true);
    this.atualizarFab();

    const ok = this.iniciarReconhecimento();
    if (ok) {
      this.falar("Modo simples por voz ativado. Diga ajuda para ver os comandos disponíveis.");
    }
  },

  desativarVoz: function () {
    this.vozAtiva = false;
    localStorage.setItem(this.CHAVE_VOZ, "false");
    this.aplicarClasseBody("modo-simples-voz", false);
    this.pararReconhecimento();
    this.atualizarFab();
    this.falar("Modo por voz desativado.");
  },

  iniciarReconhecimento: function () {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SR) {
      alert(
        "⚠️ Seu navegador não suporta reconhecimento de voz.\n\n" +
        "Use o Google Chrome ou Microsoft Edge para essa funcionalidade."
      );
      document.getElementById("toggleVoz").checked = false;
      this.vozAtiva = false;
      localStorage.setItem(this.CHAVE_VOZ, "false");
      return false;
    }

    this.reconhecedor = new SR();
    this.reconhecedor.lang = "pt-BR";
    this.reconhecedor.continuous     = true;
    this.reconhecedor.interimResults = true;

    this.reconhecedor.onstart = () => {
      this.mostrarIndicadorVoz("Ouvindo... diga um comando");
    };

    this.reconhecedor.onresult = (evento) => {
      let textoFinal = "";
      let textoParcial = "";

      for (let i = evento.resultIndex; i < evento.results.length; i++) {
        const transcricao = evento.results[i][0].transcript;
        if (evento.results[i].isFinal) textoFinal += transcricao;
        else                            textoParcial += transcricao;
      }

      if (textoParcial) {
        this.atualizarIndicadorVoz("Ouvindo: " + textoParcial.trim() + "...");
      }

      if (textoFinal) {
        const normalizado = textoFinal.toLowerCase().trim();
        this.atualizarIndicadorVoz("Você disse: " + normalizado, true);
        this.processarComando(normalizado);
      }
    };

    this.reconhecedor.onerror = (evento) => {
      console.warn("Reconhecimento de voz — erro:", evento.error);

      if (evento.error === "not-allowed" || evento.error === "service-not-allowed") {
        alert("⚠️ Permissão do microfone negada. Libere o acesso ao microfone para usar o modo por voz.");
        document.getElementById("toggleVoz").checked = false;
        this.desativarVoz();
      }
    };

    this.reconhecedor.onend = () => {

      if (this.vozAtiva) {
        try { this.reconhecedor.start(); } catch (e) { /* já iniciado */ }
      } else {
        this.esconderIndicadorVoz();
      }
    };

    try {
      this.reconhecedor.start();
    } catch (e) {
      console.warn("Não foi possível iniciar reconhecimento:", e);
    }

    return true;
  },

  pararReconhecimento: function () {
    if (this.reconhecedor) {
      try { this.reconhecedor.stop(); } catch (e) { /* nop */ }
      this.reconhecedor = null;
    }
    this.esconderIndicadorVoz();
  },


  processarComando: function (texto) {

    for (let i = 0; i < this.COMANDOS.length; i++) {
      const cmd = this.COMANDOS[i];
      for (let j = 0; j < cmd.palavras.length; j++) {
        if (texto.includes(cmd.palavras[j])) {
          this.executarAcao(cmd.acao);
          return;
        }
      }
    }


    this.atualizarIndicadorVoz("Comando não reconhecido. Diga 'ajuda'.");
  },

  executarAcao: function (acao) {
    switch (acao) {

      case "capturar": {
        const botao = document.getElementById("captureButton");
        if (botao) {
          this.falar("Capturando foto.");
          botao.click();
        } else {
          this.falar("A câmera não está aberta. Diga 'abrir câmera' primeiro.");
        }
        break;
      }

      case "galeria":
        this.falar("Abrindo galeria.");
        setTimeout(() => { window.location.href = "galeria.html"; }, 600);
        break;

      case "camera":
        this.falar("Abrindo câmera.");
        setTimeout(() => { window.location.href = "camera.html"; }, 600);
        break;

      case "modos":
        this.falar("Abrindo modos.");
        setTimeout(() => { window.location.href = "modos.html"; }, 600);
        break;

      case "home":
        this.falar("Voltando para o início.");
        setTimeout(() => { window.location.href = "home.html"; }, 600);
        break;

      case "voltar":
        this.falar("Voltando.");
        setTimeout(() => { window.history.back(); }, 600);
        break;

      case "sair":
        document.getElementById("toggleVoz").checked = false;
        this.desativarVoz();
        break;

      case "ajuda":
        this.mostrarAjuda();
        break;
    }
  },


  mostrarAjuda: function () {
    const texto =
      "🎤 COMANDOS DE VOZ DISPONÍVEIS:\n\n" +
      "• \"Tirar foto\" — captura uma foto\n" +
      "• \"Abrir galeria\" — vai para a galeria\n" +
      "• \"Abrir câmera\" — vai para a câmera\n" +
      "• \"Abrir modos\" — vê os modos da câmera\n" +
      "• \"Início\" — volta para a página inicial\n" +
      "• \"Voltar\" — volta para a página anterior\n" +
      "• \"Ajuda\" — mostra esta lista\n" +
      "• \"Sair\" — desliga o modo por voz";

    alert(texto);
    this.falar("Você pode dizer: tirar foto, abrir galeria, abrir câmera, abrir modos, início, voltar, ajuda ou sair.");
  },



  ativarAudio: function () {
    this.audioAtivo = true;
    localStorage.setItem(this.CHAVE_AUDIO, "true");
    this.aplicarClasseBody("audiodescricao", true);
    this.falar("Audiodescrição ativada. Vou ler os botões e links ao passar o foco.");
    this.anunciarPagina();
  },

  desativarAudio: function () {
    this.audioAtivo = false;
    localStorage.setItem(this.CHAVE_AUDIO, "false");
    this.aplicarClasseBody("audiodescricao", false);
    this.falar("Audiodescrição desativada.");
  },

  anunciarPagina: function () {
    const titulo = document.title || "LensLab";
    const nomePagina = titulo.split("—")[0].trim() || titulo;


    let resumo = "";
    const h1 = document.querySelector("h1");
    if (h1) resumo = h1.textContent.trim();

    const mensagem = "Página " + nomePagina + ". " + (resumo ? resumo + "." : "");
    this.falar(mensagem);
  },


  configurarLeituraFoco: function () {
    let temporizador = null;

    document.addEventListener("focusin", (evento) => {
      if (!this.audioAtivo) return;

      const alvo = evento.target;
      if (!this.elementoLegivel(alvo)) return;


      clearTimeout(temporizador);
      temporizador = setTimeout(() => {
        const texto = this.descreverElemento(alvo);
        if (texto) this.falar(texto);
      }, 200);
    });
  },

  elementoLegivel: function (el) {
    const tag = el.tagName;
    return tag === "BUTTON" || tag === "A" || tag === "INPUT" || tag === "LABEL" || tag === "SELECT" || tag === "TEXTAREA";
  },

  descreverElemento: function (el) {
    const aria = el.getAttribute("aria-label");
    if (aria) return aria;

    const tag = el.tagName;

    if (tag === "INPUT") {
      const tipo = el.type;
      const placeholder = el.placeholder || "";
      const label = this.acharLabel(el);
      const prefixo = label ? "Campo " + label : "Campo " + tipo;
      const valor = el.value ? ", preenchido com " + el.value : ", vazio";
      return prefixo + valor + (placeholder && !label ? ". Exemplo: " + placeholder : "");
    }

    const texto = (el.textContent || "").trim().replace(/\s+/g, " ");
    if (!texto) return "";

    const prefixo = tag === "BUTTON" ? "Botão " : (tag === "A" ? "Link " : "");
    return prefixo + texto;
  },

  acharLabel: function (input) {
    if (input.id) {
      const label = document.querySelector('label[for="' + input.id + '"]');
      if (label) return label.textContent.trim();
    }
    return "";
  },



  falar: function (texto) {
    if (!texto) return;
    if (!window.speechSynthesis) return;


    window.speechSynthesis.cancel();

    const fala = new SpeechSynthesisUtterance(texto);
    fala.lang = "pt-BR";
    fala.rate = 1.0;
    fala.pitch = 1.0;
    fala.volume = 1.0;

    window.speechSynthesis.speak(fala);
  },



  mostrarIndicadorVoz: function (texto) {
    const indicador = document.getElementById("voiceIndicator");
    const span      = document.getElementById("voiceText");
    if (!indicador) return;

    indicador.removeAttribute("hidden");
    span.textContent = texto;
    span.classList.remove("heard");
  },

  atualizarIndicadorVoz: function (texto, ouvido) {
    const span = document.getElementById("voiceText");
    if (!span) return;
    span.textContent = texto;
    if (ouvido) span.classList.add("heard");
    else        span.classList.remove("heard");
  },

  esconderIndicadorVoz: function () {
    const indicador = document.getElementById("voiceIndicator");
    if (indicador) indicador.setAttribute("hidden", "");
  },


  aplicarClasseBody: function (classe, ativar) {
    if (ativar) document.body.classList.add(classe);
    else        document.body.classList.remove(classe);
  },

  atualizarFab: function () {
    const fab = document.getElementById("a11yFab");
    if (!fab) return;
    if (this.vozAtiva || this.audioAtivo) fab.classList.add("is-active");
    else                                  fab.classList.remove("is-active");
  }
};


document.addEventListener("DOMContentLoaded", function () {
  Acessibilidade.init();
  Acessibilidade.configurarLeituraFoco();
  Acessibilidade.atualizarFab();
  console.log("✓ acessibilidade.js carregado");
});
