// =======================================================
// galeria.js — Slideshow + Grid dinâmico de fotos reais
// =======================================================

document.addEventListener("DOMContentLoaded", function () {

  // =====================================================
  // SLIDESHOW (mantido — usa cards estáticos do HTML)
  // =====================================================
  const slides       = document.querySelectorAll(".slide");
  const indicadores  = document.querySelectorAll(".indicator");
  const botaoAnt     = document.querySelector(".slide-arrow.prev");
  const botaoProx    = document.querySelector(".slide-arrow.next");
  const container    = document.querySelector(".slideshow-container");

  if (slides.length > 0) {
    let slideAtual    = 0;
    let intervaloAuto = null;
    const TEMPO_AUTO  = 5000;

    function irParaSlide(indice) {
      if (indice >= slides.length) indice = 0;
      if (indice < 0)              indice = slides.length - 1;

      slides.forEach(s => s.classList.remove("active"));
      indicadores.forEach(i => i.classList.remove("active"));
      slides[indice].classList.add("active");
      if (indicadores[indice]) indicadores[indice].classList.add("active");
      slideAtual = indice;
    }
    function proximoSlide()  { irParaSlide(slideAtual + 1); }
    function slideAnterior() { irParaSlide(slideAtual - 1); }

    function iniciarAuto() {
      pararAuto();
      intervaloAuto = setInterval(proximoSlide, TEMPO_AUTO);
    }
    function pararAuto() {
      if (intervaloAuto) { clearInterval(intervaloAuto); intervaloAuto = null; }
    }
    function reiniciarAuto() { pararAuto(); iniciarAuto(); }

    if (botaoProx) botaoProx.addEventListener("click", function () { proximoSlide();  reiniciarAuto(); });
    if (botaoAnt)  botaoAnt.addEventListener("click",  function () { slideAnterior(); reiniciarAuto(); });

    indicadores.forEach(function (indicador) {
      indicador.addEventListener("click", function () {
        irParaSlide(parseInt(indicador.dataset.target, 10));
        reiniciarAuto();
      });
    });

    if (container) {
      container.addEventListener("mouseenter", pararAuto);
      container.addEventListener("mouseleave", iniciarAuto);
    }

    document.addEventListener("keydown", function (evento) {
      if (evento.key === "ArrowRight") { proximoSlide();  reiniciarAuto(); }
      else if (evento.key === "ArrowLeft") { slideAnterior(); reiniciarAuto(); }
    });

    iniciarAuto();
  }

  // =====================================================
  // GRID DE FOTOS REAIS — renderizado a partir de LensLabPhotos
  // =====================================================

  const grid        = document.getElementById("photoGrid");
  const estadoVazio = document.getElementById("emptyState");
  const contador    = document.getElementById("contadorFotos");
  const filtros     = document.querySelectorAll(".filter-btn");

  // Mapa modo → categoria do filtro do grid
  // (a galeria expõe filtros em "doc/portrait/night/landscape", mas
  //  internamente temos 13 modos; aqui agrupamos os similares)
  const CATEGORIAS = {
    foto:      "outras",
    doc:       "doc",
    caderno:   "doc",
    lousa:     "doc",
    qrcode:    "doc",
    portrait:  "portrait",
    selfie:    "portrait",
    night:     "night",
    panorama:  "landscape",
    macro:     "landscape",
    comida:    "outras",
    slowmo:    "outras",
    timelapse: "outras",
    hdr:       "outras"
  };

  const NOMES_MODO = {
    foto: "Foto",         doc: "Documento",   portrait: "Retrato",   night: "Noturno",
    caderno: "Caderno",   qrcode: "QR Code",  comida: "Comida",      panorama: "Panorama",
    macro: "Macro",       slowmo: "Câmera Lenta", timelapse: "Time-lapse",
    hdr: "HDR",           lousa: "Lousa",     selfie: "Selfie+"
  };

  // Filtro atualmente selecionado
  let filtroAtual         = "all";   // categoria do filtro principal
  let materiaAtual        = null;    // matéria filtrada (null = todas)
  let visualizacaoAtual   = "grid";  // "grid" ou "diary"

  // -----------------------------------------------------
  // CARD HTML — usado nas duas visualizações
  // -----------------------------------------------------
  function htmlCard(foto) {
    const dataAmigavel = formatarData(foto.criadaEm);
    const nomeModo     = NOMES_MODO[foto.modo] || "Foto";
    const tagMateria   = foto.materia
      ? '<span class="photo-materia">📚 ' + foto.materia + "</span>"
      : "";
    return ""
      + "<article class=\"photo-card\" data-id=\"" + foto.id + "\">"
      +   "<div class=\"photo-thumb-wrap\">"
      +     "<img class=\"photo-thumb-img\" src=\"" + foto.dataURL + "\" alt=\"Foto " + nomeModo + "\">"
      +     tagMateria
      +   "</div>"
      +   "<div class=\"photo-info\">"
      +     "<strong>" + nomeModo + "</strong>"
      +     "<small>" + dataAmigavel + "</small>"
      +   "</div>"
      + "</article>";
  }

  // -----------------------------------------------------
  // FORMATA O HEADER DO DIA NO DIÁRIO
  // -----------------------------------------------------
  function formatarDiaHeader(isoString) {
    const d = new Date(isoString);
    const hoje = new Date();
    const ontem = new Date(); ontem.setDate(hoje.getDate() - 1);

    const sameDay = (a, b) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    if (sameDay(d, hoje))  return "Hoje";
    if (sameDay(d, ontem)) return "Ontem";

    const dias  = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
    const meses = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
    return dias[d.getDay()] + " · " + d.getDate() + " " + meses[d.getMonth()];
  }

  function chaveDoDia(isoString) {
    return new Date(isoString).toISOString().slice(0, 10); // "2026-04-30"
  }

  // -----------------------------------------------------
  // RENDERIZA AS CHIPS DE MATÉRIA (aparecem só se houver)
  // -----------------------------------------------------
  function renderizarMaterias() {
    const wrap   = document.getElementById("materiaFilter");
    const chips  = document.getElementById("materiaChips");
    if (!wrap || !chips || !LensLabPhotos.materiasUsadas) return;

    const materias = LensLabPhotos.materiasUsadas();
    if (materias.length === 0) {
      wrap.setAttribute("hidden", "");
      return;
    }

    wrap.removeAttribute("hidden");
    const html = ['<button class="materia-chip' +
      (materiaAtual === null ? " active" : "") + '" data-materia="">Todas</button>'];
    materias.forEach(function (m) {
      const isActive = materiaAtual === m;
      html.push('<button class="materia-chip' + (isActive ? " active" : "") +
                '" data-materia="' + m.replace(/"/g, "&quot;") + '">' + m + '</button>');
    });
    chips.innerHTML = html.join("");

    chips.querySelectorAll(".materia-chip").forEach(function (b) {
      b.addEventListener("click", function () {
        materiaAtual = b.dataset.materia ? b.dataset.materia : null;
        renderizar();
      });
    });
  }

  // -----------------------------------------------------
  // RENDERIZA O GRID
  // -----------------------------------------------------

  function renderizar() {
    if (!grid || !window.LensLabPhotos) return;

    const fotos = LensLabPhotos.listar();

    // Atualiza contador
    if (contador) {
      contador.textContent = fotos.length === 0
        ? "Você ainda não capturou fotos"
        : fotos.length + (fotos.length === 1 ? " foto" : " fotos");
    }

    // Atualiza chips de matéria
    renderizarMaterias();

    // Estado vazio
    if (fotos.length === 0) {
      grid.innerHTML = "";
      if (estadoVazio) estadoVazio.removeAttribute("hidden");
      return;
    } else {
      if (estadoVazio) estadoVazio.setAttribute("hidden", "");
    }

    // Filtra por categoria + matéria
    const visiveis = fotos.filter(function (foto) {
      if (filtroAtual !== "all") {
        const categoria = CATEGORIAS[foto.modo] || "outras";
        if (categoria !== filtroAtual) return false;
      }
      if (materiaAtual && foto.materia !== materiaAtual) return false;
      return true;
    });

    if (visiveis.length === 0) {
      grid.innerHTML =
        "<div class=\"filter-empty\">" +
        "<span style=\"font-size:36px;\">🔍</span>" +
        "<strong>Nenhuma foto neste filtro</strong>" +
        "<small>Tente outro filtro ou capture uma foto desse modo</small>" +
        "</div>";
      grid.classList.remove("diary-mode");
      return;
    }

    // Decide qual visualização usar
    if (visualizacaoAtual === "diary") {
      grid.classList.add("diary-mode");
      // Agrupa por dia preservando ordem (fotos já vêm mais recentes primeiro)
      const grupos = [];
      const indice = {};
      visiveis.forEach(function (foto) {
        const chave = chaveDoDia(foto.criadaEm);
        if (indice[chave] === undefined) {
          indice[chave] = grupos.length;
          grupos.push({ chave: chave, header: formatarDiaHeader(foto.criadaEm), fotos: [] });
        }
        grupos[indice[chave]].fotos.push(foto);
      });

      grid.innerHTML = grupos.map(function (g) {
        return ""
          + "<section class=\"diary-day\">"
          +   "<header class=\"diary-day-header\">"
          +     "<span class=\"diary-day-title\">" + g.header + "</span>"
          +     "<span class=\"diary-day-count\">" + g.fotos.length +
                  (g.fotos.length === 1 ? " foto" : " fotos") + "</span>"
          +   "</header>"
          +   "<div class=\"diary-day-photos\">"
          +     g.fotos.map(htmlCard).join("")
          +   "</div>"
          + "</section>";
      }).join("");
    } else {
      grid.classList.remove("diary-mode");
      grid.innerHTML = visiveis.map(htmlCard).join("");
    }

    // Liga clique pra abrir o modal
    grid.querySelectorAll(".photo-card").forEach(function (card) {
      card.addEventListener("click", function () {
        abrirModal(card.dataset.id);
      });
    });
  }

  // -----------------------------------------------------
  // TOGGLE DE VISUALIZAÇÃO (Grade ↔ Diário)
  // -----------------------------------------------------
  document.querySelectorAll("[data-view]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      visualizacaoAtual = btn.dataset.view;
      document.querySelectorAll("[data-view]").forEach(function (b) {
        b.classList.toggle("active", b === btn);
      });
      renderizar();
    });
  });

  // -----------------------------------------------------
  // FILTROS
  // -----------------------------------------------------

  filtros.forEach(function (botao) {
    botao.addEventListener("click", function () {
      filtros.forEach(b => b.classList.remove("active"));
      botao.classList.add("active");
      filtroAtual = botao.dataset.filter;
      renderizar();
    });
  });

  // Roda do mouse vertical → rolagem horizontal nos chips de filtro.
  // Sem isso, no desktop, o scroll do mouse rola só a página e fica
  // impossível ver os chips que sobram fora da viewport.
  const tiraFiltros = document.querySelector(".gallery-filters");
  if (tiraFiltros) {
    tiraFiltros.addEventListener("wheel", function (evento) {
      // Se já existe componente horizontal (touchpad), deixa o navegador cuidar
      if (Math.abs(evento.deltaX) > Math.abs(evento.deltaY)) return;

      // Só intercepta se de fato há overflow horizontal pra rolar
      if (tiraFiltros.scrollWidth <= tiraFiltros.clientWidth) return;

      evento.preventDefault();
      tiraFiltros.scrollLeft += evento.deltaY;
    }, { passive: false });
  }

  // =====================================================
  // MODAL DE FOTO EM TELA CHEIA
  // =====================================================

  const modal         = document.getElementById("photoModal");
  const modalImg      = document.getElementById("photoModalImg");
  const modalTitle    = document.getElementById("photoModalTitle");
  const modalDate     = document.getElementById("photoModalDate");
  const modalDownload = document.getElementById("photoModalDownload");
  const modalDelete   = document.getElementById("photoModalDelete");

  let fotoAbertaNoModal = null;

  function abrirModal(id) {
    const foto = LensLabPhotos.obter(id);
    if (!foto || !modal) return;

    fotoAbertaNoModal = foto;
    if (modalImg)   modalImg.src = foto.dataURL;
    if (modalTitle) modalTitle.textContent = "Modo " + (NOMES_MODO[foto.modo] || "Foto");
    if (modalDate)  modalDate.textContent  = formatarData(foto.criadaEm);

    modal.removeAttribute("hidden");
    setTimeout(() => modal.classList.add("aberto"), 10);
    document.body.style.overflow = "hidden";
  }

  function fecharModal() {
    if (!modal) return;
    modal.classList.remove("aberto");
    setTimeout(function () {
      modal.setAttribute("hidden", "");
      document.body.style.overflow = "";
      fotoAbertaNoModal = null;
    }, 300);
  }

  // Fecha clicando no backdrop ou no X
  document.querySelectorAll("[data-modal-close]").forEach(function (el) {
    el.addEventListener("click", fecharModal);
  });

  // Fecha com ESC
  document.addEventListener("keydown", function (evento) {
    if (evento.key === "Escape" && modal && modal.classList.contains("aberto")) {
      fecharModal();
    }
  });

  // Botão baixar (no modal)
  if (modalDownload) {
    modalDownload.addEventListener("click", function () {
      if (!fotoAbertaNoModal) return;
      const link = document.createElement("a");
      link.href = fotoAbertaNoModal.dataURL;
      link.download = "lenslab_" + fotoAbertaNoModal.id + ".jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  // Botão excluir (no modal)
  if (modalDelete) {
    modalDelete.addEventListener("click", function () {
      if (!fotoAbertaNoModal) return;
      const ok = confirm(
        "⚠️ Excluir esta foto da galeria?\n\nEsta ação não pode ser desfeita."
      );
      if (!ok) return;

      LensLabPhotos.excluir(fotoAbertaNoModal.id);
      fecharModal();
      renderizar();
    });
  }

  // =====================================================
  // HELPERS
  // =====================================================

  function formatarData(iso) {
    if (!iso) return "—";
    const data  = new Date(iso);
    const agora = new Date();
    const diff  = (agora - data) / 1000;

    if (diff < 60)   return "agora mesmo";
    if (diff < 3600) return "há " + Math.floor(diff / 60) + " min";

    const hh = String(data.getHours()).padStart(2, "0");
    const mm = String(data.getMinutes()).padStart(2, "0");
    const mesmoDia = data.toDateString() === agora.toDateString();
    if (mesmoDia) return "Hoje · " + hh + ":" + mm;

    const ontem = new Date(agora);
    ontem.setDate(agora.getDate() - 1);
    if (data.toDateString() === ontem.toDateString()) {
      return "Ontem · " + hh + ":" + mm;
    }

    return data.toLocaleDateString("pt-BR") + " · " + hh + ":" + mm;
  }

  // =====================================================
  // RENDER INICIAL
  // =====================================================
  renderizar();

  // =====================================================
  // STATS DO PAINEL LATERAL (desktop)
  // =====================================================
  function atualizarStatsLaterais() {
    if (!window.LensLabPhotos) return;

    const elTotal    = document.getElementById("statTotal");
    const elModos    = document.getElementById("statModos");
    const elMaterias = document.getElementById("statMaterias");
    if (!elTotal && !elModos && !elMaterias) return;

    const fotos = LensLabPhotos.listar();
    const modosUsados = new Set();
    fotos.forEach(function (f) { if (f.modo) modosUsados.add(f.modo); });

    const materias = (typeof LensLabPhotos.materiasUsadas === "function")
      ? LensLabPhotos.materiasUsadas()
      : [];

    if (elTotal)    elTotal.textContent    = fotos.length;
    if (elModos)    elModos.textContent    = modosUsados.size;
    if (elMaterias) elMaterias.textContent = materias.length;
  }

  atualizarStatsLaterais();

  console.log("✓ galeria.js carregado");
});
