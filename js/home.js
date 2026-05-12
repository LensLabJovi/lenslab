// =======================================================
// home.js — Saudação personalizada + Memória Ativa
// =======================================================
// Memória Ativa: procura uma foto antiga (7, 30 ou 365 dias
// atrás, +/- 1 dia) e mostra um card. Cria laço emocional
// com o usuário e dá utilidade contínua à galeria.
// =======================================================

document.addEventListener("DOMContentLoaded", function () {

  // -----------------------------------------------------
  // 1) SAUDAÇÃO PERSONALIZADA
  // -----------------------------------------------------
  const elemento = document.getElementById("welcomeText");
  if (elemento && typeof Auth !== "undefined") {
    const usuario = Auth.pegarUsuario();
    if (usuario) {
      const hora = new Date().getHours();
      let saudacao = "Bem-vindo(a)";

      if (hora >= 5 && hora < 12)        saudacao = "Bom dia";
      else if (hora >= 12 && hora < 18)  saudacao = "Boa tarde";
      else                                saudacao = "Boa noite";

      const primeiroNome = usuario.nome.split(" ")[0];
      elemento.textContent = saudacao + ", " + primeiroNome + "!";
    }
  }

  // -----------------------------------------------------
  // 2) MEMÓRIA ATIVA — foto antiga reaparece na home
  // -----------------------------------------------------

  const card     = document.getElementById("memoryCard");
  const img      = document.getElementById("memoryImg");
  const titulo   = document.getElementById("memoryTitle");
  const subtit   = document.getElementById("memorySubtitle");
  const link     = document.getElementById("memoryLink");
  const fechar   = document.getElementById("memoryClose");

  // Chave pra lembrar que o usuário fechou a memória de hoje
  const CHAVE_MEM_FECHADA = "lenslab:memoriaFechada";

  function ehFechadaHoje() {
    try {
      const data = localStorage.getItem(CHAVE_MEM_FECHADA);
      const hoje = new Date().toISOString().slice(0, 10);
      return data === hoje;
    } catch (e) { return false; }
  }

  function fecharHoje() {
    try {
      const hoje = new Date().toISOString().slice(0, 10);
      localStorage.setItem(CHAVE_MEM_FECHADA, hoje);
    } catch (e) { /* ignora */ }
  }

  function diferencaEmDias(d1, d2) {
    const ms = Math.abs(d1.getTime() - d2.getTime());
    return Math.floor(ms / (1000 * 60 * 60 * 24));
  }

  function textoTempo(dias) {
    if (dias === 1)   return "Ontem mesmo";
    if (dias < 7)     return "Há " + dias + " dias";
    if (dias < 14)    return "Há 1 semana";
    if (dias < 30)    return "Há " + Math.round(dias / 7) + " semanas";
    if (dias < 60)    return "Há 1 mês";
    if (dias < 365)   return "Há " + Math.round(dias / 30) + " meses";
    if (dias < 730)   return "Há 1 ano";
    return "Há " + Math.round(dias / 365) + " anos";
  }

  function escolherFotoMemoria() {
    if (!window.LensLabPhotos) return null;

    const fotos = LensLabPhotos.listar();
    if (fotos.length === 0) return null;

    const agora = new Date();

    // Marcos: 7, 30, 365 dias atrás (com tolerância de ±1 dia)
    // Pega a primeira foto que bater em algum marco.
    const marcos = [
      { dias: 365, tolerancia: 3 },
      { dias: 30,  tolerancia: 2 },
      { dias: 7,   tolerancia: 1 }
    ];

    for (let i = 0; i < marcos.length; i++) {
      const m = marcos[i];
      const candidata = fotos.find(function (foto) {
        const d = new Date(foto.criadaEm);
        const diff = diferencaEmDias(agora, d);
        return Math.abs(diff - m.dias) <= m.tolerancia;
      });
      if (candidata) {
        return {
          foto: candidata,
          dias: diferencaEmDias(agora, new Date(candidata.criadaEm))
        };
      }
    }

    // Se não encontrou marco, mas tem alguma foto antiga (>3 dias),
    // mostra a mais antiga
    const maisAntiga = fotos[fotos.length - 1];
    const d = new Date(maisAntiga.criadaEm);
    const diff = diferencaEmDias(agora, d);
    if (diff >= 3) {
      return { foto: maisAntiga, dias: diff };
    }

    return null;
  }

  function mostrarMemoria() {
    if (!card) return;
    if (ehFechadaHoje()) return;

    const resultado = escolherFotoMemoria();
    if (!resultado) return;

    if (img)    img.src = resultado.foto.dataURL;
    if (titulo) titulo.textContent = textoTempo(resultado.dias);
    if (subtit) {
      const NOMES = {
        foto:"Foto", doc:"Documento", portrait:"Retrato", night:"Noturno",
        caderno:"Caderno", qrcode:"QR Code", comida:"Comida", panorama:"Panorama",
        macro:"Macro", slowmo:"Câmera Lenta", timelapse:"Time-lapse",
        hdr:"HDR", lousa:"Lousa", selfie:"Selfie+"
      };
      const modoNome = NOMES[resultado.foto.modo] || "Foto";
      const materia = resultado.foto.materia ? " · " + resultado.foto.materia : "";
      subtit.textContent = "Modo " + modoNome + materia;
    }

    card.removeAttribute("hidden");
    setTimeout(function () { card.classList.add("aparece"); }, 50);
  }

  if (fechar) {
    fechar.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      fecharHoje();
      if (card) {
        card.classList.remove("aparece");
        setTimeout(function () { card.setAttribute("hidden", ""); }, 300);
      }
    });
  }

  mostrarMemoria();

  // -----------------------------------------------------
  // 3) SLIDESHOW DO MOCKUP (hero)
  // -----------------------------------------------------
  const slides = document.querySelectorAll(".phone-slide");
  const modeLabel = document.getElementById("phoneModeLabel");

  if (slides.length > 1) {
    let atual = 0;
    setInterval(function () {
      slides[atual].classList.remove("is-active");
      atual = (atual + 1) % slides.length;
      slides[atual].classList.add("is-active");
      if (modeLabel) modeLabel.textContent = slides[atual].dataset.mode || "";
    }, 3000);
  }

  console.log("✓ home.js carregado");
});
