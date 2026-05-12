// =======================================================
// post-captura.js — Tela exibida logo após uma captura
// =======================================================
// Carrega a foto real do localStorage (passada via ?id=...)
// e oferece ações reais: excluir, baixar, compartilhar.
// =======================================================

document.addEventListener("DOMContentLoaded", function () {

  // -----------------------------------------------------
  // MAPA DE MODOS — pra mostrar nome amigável e emoji
  // -----------------------------------------------------
  const MODOS = {
    foto:      { nome: "Foto",         emoji: "📸" },
    doc:       { nome: "Documento",    emoji: "📄" },
    portrait:  { nome: "Retrato",      emoji: "👤" },
    night:     { nome: "Noturno",      emoji: "🌙" },
    caderno:   { nome: "Caderno",      emoji: "📓" },
    qrcode:    { nome: "QR Code",      emoji: "🔲" },
    comida:    { nome: "Comida",       emoji: "🍔" },
    panorama:  { nome: "Panorama",     emoji: "🏞️" },
    macro:     { nome: "Macro",        emoji: "🔬" },
    slowmo:    { nome: "Câmera Lenta", emoji: "🐢" },
    timelapse: { nome: "Time-lapse",   emoji: "⏱️" },
    hdr:       { nome: "HDR",          emoji: "✨" },
    lousa:     { nome: "Lousa",        emoji: "📋" },
    selfie:    { nome: "Selfie+",      emoji: "🤳" }
  };

  // -----------------------------------------------------
  // CARREGA A FOTO
  // -----------------------------------------------------
  // O id é passado pela URL: pos-captura.html?id=foto_xyz

  const params = new URLSearchParams(window.location.search);
  const idFoto = params.get("id");

  // Tenta primeiro pelo id da URL; senão, pega a última capturada
  let fotoAtual = null;
  if (window.LensLabPhotos) {
    fotoAtual = idFoto
      ? LensLabPhotos.obter(idFoto)
      : LensLabPhotos.ultimaCapturada();
  }

  const elementoImg     = document.getElementById("previewImg");
  const fallbackTexto   = document.getElementById("previewFallback");
  const banner          = document.getElementById("detectBanner");
  const bannerIcon      = document.getElementById("detectIcon");
  const bannerTitle     = document.getElementById("detectTitle");
  const bannerSubtitle  = document.getElementById("detectSubtitle");

  if (fotoAtual) {
    if (elementoImg) {
      elementoImg.src = fotoAtual.dataURL;
      elementoImg.removeAttribute("hidden");
    }
    if (fallbackTexto) fallbackTexto.style.display = "none";

    // Mostra banner com info do modo (+ matéria, se houver)
    const dadosModo = MODOS[fotoAtual.modo] || MODOS.foto;
    if (banner && bannerIcon && bannerTitle && bannerSubtitle) {
      bannerIcon.textContent  = dadosModo.emoji;
      const tituloBase = "Modo " + dadosModo.nome;
      bannerTitle.textContent = fotoAtual.materia
        ? tituloBase + " · 📚 " + fotoAtual.materia
        : tituloBase;
      bannerSubtitle.textContent = formatarDataAmigavel(fotoAtual.criadaEm);
      banner.removeAttribute("hidden");
    }

    // Mostra ação extra de citação ABNT só em modos de estudo
    const ehModoEstudo = (fotoAtual.modo === "doc" || fotoAtual.modo === "caderno");
    const extras = document.getElementById("postExtras");
    if (extras && ehModoEstudo) {
      extras.removeAttribute("hidden");
      // Reduz o padding inferior da ação principal pra não ter folga dupla
      const acoesEl = document.querySelector(".post-actions");
      if (acoesEl) acoesEl.classList.add("with-extras");
    }
  } else {
    if (fallbackTexto) {
      fallbackTexto.textContent = "Nenhuma foto encontrada";
    }
  }

  // -----------------------------------------------------
  // TOAST — notificação animada (mantida do código antigo)
  // -----------------------------------------------------

  function mostrarToast(mensagem, tipo) {
    if (!tipo) tipo = "success";
    const cores  = { success: "#00B894", info: "#6C5CE7", error: "#E74C3C" };
    const icones = { success: "✓",       info: "ℹ",       error: "✕" };

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = "<span class=\"toast-icon\">" + icones[tipo] + "</span>"
                    + "<span class=\"toast-msg\">" + mensagem + "</span>";
    toast.style.background = cores[tipo];

    (document.querySelector(".camera-app") || document.body).appendChild(toast);
    setTimeout(() => toast.classList.add("visivel"), 10);
    setTimeout(function () {
      toast.classList.remove("visivel");
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  // -----------------------------------------------------
  // AÇÕES — escutando os botões pelo data-action
  // -----------------------------------------------------

  document.querySelectorAll(".action-btn").forEach(function (botao) {
    botao.addEventListener("click", function () {
      const acao = botao.dataset.action;

      if (!fotoAtual && acao !== "voltar") {
        mostrarToast("Nenhuma foto carregada", "error");
        return;
      }

      switch (acao) {
        case "excluir":      executarExcluir();      break;
        case "melhorar":     executarMelhorar();     break;
        case "compartilhar": executarCompartilhar(); break;
        case "baixar":       executarBaixar();       break;
        case "citacao":      abrirCitacao();         break;
        default:
          mostrarToast("Ação não reconhecida", "error");
      }
    });
  });

  // -----------------------------------------------------
  // CITAÇÃO ABNT — modal com formulário
  // -----------------------------------------------------

  const citacaoModal   = document.getElementById("citacaoModal");
  const citacaoForm    = document.getElementById("citacaoForm");
  const citacaoResult  = document.getElementById("citacaoResult");
  const citacaoTexto   = document.getElementById("citacaoTexto");
  const citacaoCopiar  = document.getElementById("citacaoCopiar");
  const citacaoNova    = document.getElementById("citacaoNova");

  function abrirCitacao() {
    if (!citacaoModal) return;
    citacaoModal.removeAttribute("hidden");
    setTimeout(() => citacaoModal.classList.add("aberto"), 10);
    document.body.style.overflow = "hidden";

    // Pré-preenche se já tiver citação salva
    if (fotoAtual && fotoAtual.citacao && citacaoForm) {
      Object.keys(fotoAtual.citacao).forEach(function (campo) {
        const input = citacaoForm.elements.namedItem(campo);
        if (input) input.value = fotoAtual.citacao[campo] || "";
      });
    }
  }

  function fecharCitacao() {
    if (!citacaoModal) return;
    citacaoModal.classList.remove("aberto");
    setTimeout(function () {
      citacaoModal.setAttribute("hidden", "");
      document.body.style.overflow = "";
      // Reset visual do form
      if (citacaoResult) citacaoResult.setAttribute("hidden", "");
    }, 250);
  }

  document.querySelectorAll("[data-citacao-close]").forEach(function (el) {
    el.addEventListener("click", fecharCitacao);
  });

  // Fecha com ESC
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && citacaoModal && !citacaoModal.hasAttribute("hidden")) {
      fecharCitacao();
    }
  });

  // Formata uma referência ABNT a partir dos campos
  function formatarABNT(dados) {
    // SOBRENOME, Nome. Título. Cidade: Editora, Ano. p. X-Y.
    const sobrenome = (dados.sobrenome || "").toUpperCase().trim();
    const nome      = (dados.nome      || "").trim();
    const titulo    = (dados.titulo    || "").trim();
    const cidade    = (dados.cidade    || "").trim();
    const editora   = (dados.editora   || "").trim();
    const ano       = (dados.ano       || "").trim();
    const paginas   = (dados.paginas   || "").trim();

    let ref = sobrenome + ", " + nome + ". ";
    ref += "<i>" + titulo + "</i>. ";

    // Local: Editora, Ano.
    const partes = [];
    if (cidade)            partes.push(cidade);
    if (editora && cidade) partes[0] = cidade + ": " + editora;
    else if (editora)      partes.push(editora);
    if (ano)               partes.push(ano);
    if (partes.length)     ref += partes.join(", ") + ".";

    if (paginas) ref += " p. " + paginas + ".";

    // Versão pra copiar (sem itálico HTML — usa _texto_ markdown style)
    const refTexto = ref.replace(/<\/?i>/g, "");

    return { html: ref, texto: refTexto };
  }

  if (citacaoForm) {
    citacaoForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const dados = {
        sobrenome: citacaoForm.elements.namedItem("sobrenome").value,
        nome:      citacaoForm.elements.namedItem("nome").value,
        titulo:    citacaoForm.elements.namedItem("titulo").value,
        cidade:    citacaoForm.elements.namedItem("cidade").value,
        editora:   citacaoForm.elements.namedItem("editora").value,
        ano:       citacaoForm.elements.namedItem("ano").value,
        paginas:   citacaoForm.elements.namedItem("paginas").value
      };

      // Validação mínima
      if (!dados.sobrenome.trim() || !dados.nome.trim() || !dados.titulo.trim()) {
        alert("⚠️ Preencha pelo menos sobrenome, nome e título.");
        return;
      }

      const ref = formatarABNT(dados);
      if (citacaoTexto) citacaoTexto.value = ref.texto;
      if (citacaoResult) citacaoResult.removeAttribute("hidden");

      // Salva no objeto da foto
      if (fotoAtual && LensLabPhotos.atualizar) {
        LensLabPhotos.atualizar(fotoAtual.id, { citacao: dados });
        fotoAtual.citacao = dados;
      }
    });
  }

  if (citacaoCopiar && citacaoTexto) {
    citacaoCopiar.addEventListener("click", async function () {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(citacaoTexto.value);
        } else {
          // Fallback: seleção + execCommand
          citacaoTexto.select();
          document.execCommand("copy");
        }
        mostrarToast("Citação copiada!", "success");
      } catch (e) {
        mostrarToast("Não foi possível copiar", "error");
      }
    });
  }

  if (citacaoNova && citacaoForm && citacaoResult) {
    citacaoNova.addEventListener("click", function () {
      citacaoResult.setAttribute("hidden", "");
      citacaoForm.reset();
      citacaoForm.elements.namedItem("sobrenome").focus();
    });
  }

  // -----------------------------------------------------
  // EXCLUIR — remove do localStorage e volta pra câmera
  // -----------------------------------------------------

  function executarExcluir() {
    const confirmar = confirm(
      "⚠️ Tem certeza que deseja excluir esta foto?\n\n" +
      "Esta ação não pode ser desfeita."
    );

    if (!confirmar) {
      mostrarToast("Exclusão cancelada", "info");
      return;
    }

    const removeu = LensLabPhotos.excluir(fotoAtual.id);
    if (removeu) {
      mostrarToast("Foto excluída", "error");
      setTimeout(() => { window.location.href = "camera.html"; }, 1500);
    } else {
      mostrarToast("Não foi possível excluir", "error");
    }
  }

  // -----------------------------------------------------
  // MELHORAR — simulação visual (não altera a foto real)
  // -----------------------------------------------------

  function executarMelhorar() {
    mostrarToast("Aplicando melhorias com IA...", "info");

    // Anima a foto pra dar feedback visual
    if (elementoImg) {
      elementoImg.style.transition = "filter 1.2s ease";
      elementoImg.style.filter = "saturate(1.2) contrast(1.1) brightness(1.05)";
    }

    setTimeout(function () {
      mostrarToast("Foto melhorada com sucesso!", "success");
    }, 1500);
  }

  // -----------------------------------------------------
  // COMPARTILHAR — Web Share API real (com fallback)
  // -----------------------------------------------------

  async function executarCompartilhar() {
    // Tenta usar a Web Share API com arquivo
    if (navigator.canShare && navigator.share) {
      try {
        const arquivo = await dataURLparaArquivo(fotoAtual.dataURL, "lenslab.jpg");
        if (navigator.canShare({ files: [arquivo] })) {
          await navigator.share({
            files: [arquivo],
            title: "Foto LensLab",
            text:  "Tirada com o modo " + (MODOS[fotoAtual.modo] || MODOS.foto).nome
          });
          mostrarToast("Compartilhado!", "success");
          return;
        }
      } catch (err) {
        // Usuário cancelou ou erro — cai pro fallback
        if (err.name === "AbortError") return;
        console.warn("[compartilhar] Web Share falhou, usando fallback:", err);
      }
    }

    // Fallback simulado (igual ao antigo)
    const opcoes =
      "Para onde deseja compartilhar?\n\n" +
      "1 - WhatsApp\n" +
      "2 - E-mail\n" +
      "3 - Copiar link\n\n" +
      "Digite o número da opção:";

    const escolha = prompt(opcoes, "1");
    if (escolha === null) return;

    const destinos = {
      "1": "WhatsApp",
      "2": "E-mail",
      "3": "Link copiado para a área de transferência"
    };
    const destino = destinos[escolha.trim()];

    if (!destino) {
      alert("⚠️ Opção inválida. Digite 1, 2 ou 3.");
      return;
    }
    mostrarToast("Compartilhado: " + destino, "success");
  }

  // -----------------------------------------------------
  // BAIXAR — download real do JPEG
  // -----------------------------------------------------

  function executarBaixar() {
    const nomeSugerido = "lenslab_" + gerarDataAtual() + ".jpg";
    const nomeArquivo  = prompt("Como deseja chamar o arquivo?", nomeSugerido);

    if (nomeArquivo === null) {
      mostrarToast("Download cancelado", "info");
      return;
    }
    if (nomeArquivo.trim() === "") {
      alert("⚠️ Nome do arquivo não pode ficar vazio");
      return;
    }

    let nomeLimpo = nomeArquivo
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^\w\-.]/g, "");

    // Garante extensão
    if (!/\.(jpe?g|png)$/i.test(nomeLimpo)) {
      nomeLimpo += ".jpg";
    }

    // Cria um link de download e clica nele
    const link = document.createElement("a");
    link.href = fotoAtual.dataURL;
    link.download = nomeLimpo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    mostrarToast("Baixando \"" + nomeLimpo + "\"", "success");
  }

  // -----------------------------------------------------
  // HELPERS
  // -----------------------------------------------------

  function gerarDataAtual() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    const hh  = String(hoje.getHours()).padStart(2, "0");
    const mm  = String(hoje.getMinutes()).padStart(2, "0");
    return ano + mes + dia + "_" + hh + mm;
  }

  function formatarDataAmigavel(iso) {
    if (!iso) return "Capturada agora";
    const data  = new Date(iso);
    const agora = new Date();
    const diff  = (agora - data) / 1000; // segundos

    if (diff < 60)     return "Capturada agora";
    if (diff < 3600)   return "Há " + Math.floor(diff / 60) + " min";

    const hh = String(data.getHours()).padStart(2, "0");
    const mm = String(data.getMinutes()).padStart(2, "0");
    const mesmoDia = data.toDateString() === agora.toDateString();
    return mesmoDia ? "Hoje · " + hh + ":" + mm : data.toLocaleDateString("pt-BR") + " · " + hh + ":" + mm;
  }

  // Converte dataURL em File (pra Web Share API)
  async function dataURLparaArquivo(dataURL, nome) {
    const resp = await fetch(dataURL);
    const blob = await resp.blob();
    return new File([blob], nome, { type: blob.type });
  }

  console.log("✓ post-captura.js carregado");
});
