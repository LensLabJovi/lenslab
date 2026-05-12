// =======================================================
// photos.js — Módulo de gerenciamento de fotos
// =======================================================
// Cuida de salvar, listar, comprimir e excluir fotos no
// localStorage. Exposto globalmente como LensLabPhotos.
//
// Cada foto guardada tem o formato:
//   {
//     id:        "foto_<timestamp>_<aleatorio>",
//     dataURL:   "data:image/jpeg;base64,...",
//     modo:      "doc" | "portrait" | "night" | ...,
//     ajustes:   { brilho, saturacao, contraste, ... } | null,
//     criadaEm:  "2026-04-29T14:32:11.123Z"
//   }
// =======================================================

(function () {

  // Chave usada pra guardar a lista no localStorage
  const CHAVE_LISTA   = "lenslab:photos";
  // Chave da última foto capturada (sessionStorage — só pra esta aba)
  const CHAVE_ULTIMA  = "lenslab:ultimaFoto";

  // Limites de qualidade pra não estourar a quota de 5MB
  const LARGURA_MAX   = 1280;   // px na maior dimensão
  const QUALIDADE_JPG = 0.85;   // 0 a 1

  // -----------------------------------------------------
  // LEITURA / ESCRITA NO localStorage
  // -----------------------------------------------------

  function lerLista() {
    try {
      const bruto = localStorage.getItem(CHAVE_LISTA);
      if (!bruto) return [];
      const lista = JSON.parse(bruto);
      return Array.isArray(lista) ? lista : [];
    } catch (erro) {
      console.warn("[photos] Falha ao ler lista:", erro);
      return [];
    }
  }

  function escreverLista(lista) {
    try {
      localStorage.setItem(CHAVE_LISTA, JSON.stringify(lista));
      return true;
    } catch (erro) {
      // Provavelmente QuotaExceededError — armazenamento cheio
      console.error("[photos] Falha ao salvar (quota):", erro);
      return false;
    }
  }

  // -----------------------------------------------------
  // COMPRESSÃO — reduz a imagem pra LARGURA_MAX e re-codifica em JPEG
  // -----------------------------------------------------

  function comprimir(dataURL) {
    return new Promise(function (resolve, reject) {
      const img = new Image();

      img.onload = function () {
        let largura = img.width;
        let altura  = img.height;

        // Mantém a proporção, limitando a maior dimensão
        const maior = Math.max(largura, altura);
        if (maior > LARGURA_MAX) {
          const fator = LARGURA_MAX / maior;
          largura = Math.round(largura * fator);
          altura  = Math.round(altura  * fator);
        }

        const canvas = document.createElement("canvas");
        canvas.width  = largura;
        canvas.height = altura;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, largura, altura);

        resolve(canvas.toDataURL("image/jpeg", QUALIDADE_JPG));
      };

      img.onerror = function () {
        reject(new Error("Falha ao carregar imagem para compressão"));
      };

      img.src = dataURL;
    });
  }

  // -----------------------------------------------------
  // API PÚBLICA
  // -----------------------------------------------------

  // Salva uma nova foto. Devolve o objeto salvo (com id).
  // extras (opcional): { materia, citacao, ... } — campos adicionais
  async function salvar(dataURL, modo, ajustes, extras) {
    if (!dataURL) throw new Error("dataURL obrigatório");

    // Comprime se a imagem ainda parecer grande (heurística simples)
    let final = dataURL;
    if (dataURL.length > 200000) {
      try {
        final = await comprimir(dataURL);
      } catch (erro) {
        console.warn("[photos] Compressão falhou, usando original:", erro);
      }
    }

    const foto = {
      id:       "foto_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
      dataURL:  final,
      modo:     modo || "foto",
      ajustes:  ajustes || null,
      materia:  (extras && extras.materia)  || null,
      citacao:  (extras && extras.citacao)  || null,
      criadaEm: new Date().toISOString()
    };

    const lista = lerLista();
    lista.unshift(foto); // mais recente primeiro

    // Tenta salvar; se a quota estourar, vai removendo as mais antigas
    if (!escreverLista(lista)) {
      let avisado = false;
      while (lista.length > 1) {
        lista.pop();
        if (escreverLista(lista)) {
          if (!avisado) {
            alert("⚠️ Memória cheia: algumas fotos antigas foram removidas para liberar espaço.");
          }
          break;
        }
      }
      if (!escreverLista(lista)) {
        throw new Error("Não foi possível salvar a foto: armazenamento cheio.");
      }
    }

    // Marca como última foto capturada (pra a tela pós-captura)
    try { sessionStorage.setItem(CHAVE_ULTIMA, foto.id); } catch (e) { /* ignora */ }

    return foto;
  }

  // Devolve a lista completa (mais recentes primeiro)
  function listar() {
    return lerLista();
  }

  // Busca uma foto pelo id
  function obter(id) {
    if (!id) return null;
    return lerLista().find(f => f.id === id) || null;
  }

  // Exclui uma foto pelo id. Devolve true se realmente removeu.
  function excluir(id) {
    const lista = lerLista();
    const novaLista = lista.filter(f => f.id !== id);
    if (novaLista.length === lista.length) return false;
    escreverLista(novaLista);
    return true;
  }

  // Quantidade total de fotos
  function contar() {
    return lerLista().length;
  }

  // Atualiza campos de uma foto existente (merge raso). Devolve a foto nova ou null.
  function atualizar(id, patch) {
    if (!id || !patch) return null;
    const lista = lerLista();
    const idx = lista.findIndex(f => f.id === id);
    if (idx < 0) return null;
    lista[idx] = Object.assign({}, lista[idx], patch);
    escreverLista(lista);
    return lista[idx];
  }

  // Lista única e ordenada das matérias já usadas (filtra null/vazio)
  function materiasUsadas() {
    const set = new Set();
    lerLista().forEach(function (f) {
      if (f.materia && typeof f.materia === "string" && f.materia.trim()) {
        set.add(f.materia.trim());
      }
    });
    return Array.from(set).sort(function (a, b) {
      return a.localeCompare(b, "pt-BR");
    });
  }

  // Remove uma matéria do "histórico": seta materia=null em todas as fotos
  // que tinham ela. Devolve quantas fotos foram afetadas.
  function removerMateria(nome) {
    if (!nome) return 0;
    const alvo = String(nome).trim();
    if (!alvo) return 0;
    const lista = lerLista();
    let alteradas = 0;
    lista.forEach(function (foto) {
      if (foto.materia === alvo) {
        foto.materia = null;
        alteradas++;
      }
    });
    if (alteradas > 0) escreverLista(lista);
    return alteradas;
  }

  // Renomeia uma matéria em todas as fotos (útil pra corrigir typos sem perder vínculo)
  function renomearMateria(antigo, novo) {
    if (!antigo || !novo) return 0;
    const a = String(antigo).trim();
    const n = String(novo).trim();
    if (!a || !n || a === n) return 0;
    const lista = lerLista();
    let alteradas = 0;
    lista.forEach(function (foto) {
      if (foto.materia === a) {
        foto.materia = n;
        alteradas++;
      }
    });
    if (alteradas > 0) escreverLista(lista);
    return alteradas;
  }

  // Última foto capturada nesta sessão (lida do sessionStorage)
  function ultimaCapturada() {
    try {
      const id = sessionStorage.getItem(CHAVE_ULTIMA);
      return id ? obter(id) : null;
    } catch (e) {
      return null;
    }
  }

  // -----------------------------------------------------
  // EXPÕE GLOBALMENTE
  // -----------------------------------------------------
  window.LensLabPhotos = {
    salvar:           salvar,
    listar:           listar,
    obter:            obter,
    excluir:          excluir,
    contar:           contar,
    ultimaCapturada:  ultimaCapturada,
    atualizar:        atualizar,
    materiasUsadas:   materiasUsadas,
    removerMateria:   removerMateria,
    renomearMateria:  renomearMateria
  };

  console.log("✓ photos.js carregado — " + contar() + " foto(s) na galeria");
})();
