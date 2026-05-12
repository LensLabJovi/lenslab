// =======================================================
// contato.js — Validação do formulário de contato
//               + contador de caracteres em tempo real
// =======================================================

document.addEventListener("DOMContentLoaded", function () {

  const formulario = document.getElementById("contactForm");
  if (!formulario) return;

  // Campos do formulário
  const campoNome     = document.getElementById("nome");
  const campoEmail    = document.getElementById("email-contato");
  const campoAssunto  = document.getElementById("assunto");
  const campoMensagem = document.getElementById("mensagem");

  // Elementos de erro
  const erroNome     = document.getElementById("nome-error");
  const erroEmail    = document.getElementById("email-contato-error");
  const erroAssunto  = document.getElementById("assunto-error");
  const erroMensagem = document.getElementById("mensagem-error");

  // Contador de caracteres
  const contador = document.querySelector(".char-counter");
  const LIMITE_CARACTERES = 500;

  // -----------------------------------------------------
  // VALIDAÇÕES
  // -----------------------------------------------------

  function validarNome() {
    const valor = campoNome.value.trim();

    if (valor === "") {
      mostrarErro(campoNome, erroNome, "Digite seu nome");
      return false;
    }

    if (valor.length < 3) {
      mostrarErro(campoNome, erroNome, "Nome muito curto");
      return false;
    }

    // Verifica se contém apenas letras e espaços
    // (regex: começa e termina com letras/acentos/espaços)
    const padraoLetras = /^[A-Za-zÀ-ÿ\s]+$/;
    if (!padraoLetras.test(valor)) {
      mostrarErro(campoNome, erroNome, "O nome deve conter apenas letras");
      return false;
    }

    limparErro(campoNome, erroNome);
    return true;
  }

  function validarEmail() {
    const valor = campoEmail.value.trim();
    const padrao = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (valor === "") {
      mostrarErro(campoEmail, erroEmail, "Digite seu e-mail");
      return false;
    }

    if (!padrao.test(valor)) {
      mostrarErro(campoEmail, erroEmail, "E-mail inválido");
      return false;
    }

    limparErro(campoEmail, erroEmail);
    return true;
  }

  function validarAssunto() {
    const valor = campoAssunto.value;

    // O <select> tem uma opção vazia ("") como placeholder
    if (valor === "") {
      mostrarErro(campoAssunto, erroAssunto, "Selecione um assunto");
      return false;
    }

    limparErro(campoAssunto, erroAssunto);
    return true;
  }

  function validarMensagem() {
    const valor = campoMensagem.value.trim();

    if (valor === "") {
      mostrarErro(campoMensagem, erroMensagem, "Digite sua mensagem");
      return false;
    }

    if (valor.length < 10) {
      mostrarErro(campoMensagem, erroMensagem, "Mensagem muito curta (mínimo 10 caracteres)");
      return false;
    }

    if (valor.length > LIMITE_CARACTERES) {
      mostrarErro(campoMensagem, erroMensagem, "Mensagem muito longa (máximo " + LIMITE_CARACTERES + ")");
      return false;
    }

    limparErro(campoMensagem, erroMensagem);
    return true;
  }

  // -----------------------------------------------------
  // CONTADOR DE CARACTERES (em tempo real)
  // -----------------------------------------------------
  // A cada tecla digitada, atualiza o "0 / 500 caracteres"
  // e muda a cor conforme se aproxima do limite.
  // -----------------------------------------------------

  function atualizarContador() {
    if (!contador) return;

    const quantidade = campoMensagem.value.length;
    contador.textContent = quantidade + " / " + LIMITE_CARACTERES + " caracteres";

    // Muda a cor conforme se aproxima do limite
    if (quantidade > LIMITE_CARACTERES) {
      contador.style.color = "var(--danger)";          // ultrapassou — vermelho
    } else if (quantidade > LIMITE_CARACTERES * 0.9) {
      contador.style.color = "var(--warning)";         // chegando perto — amarelo
    } else if (quantidade > LIMITE_CARACTERES * 0.7) {
      contador.style.color = "var(--accent)";          // metade pra cima — ciano
    } else {
      contador.style.color = "var(--text-muted)";      // tranquilo — cinza
    }
  }

  // -----------------------------------------------------
  // HELPERS DE ERRO
  // -----------------------------------------------------

  function mostrarErro(campo, elementoErro, mensagem) {
    campo.classList.add("error");
    campo.classList.remove("success");
    if (elementoErro) elementoErro.textContent = mensagem;
  }

  function limparErro(campo, elementoErro) {
    campo.classList.remove("error");
    campo.classList.add("success");
    if (elementoErro) elementoErro.textContent = "";
  }

  // -----------------------------------------------------
  // EVENTOS
  // -----------------------------------------------------

  // Validação ao sair do campo (blur)
  campoNome.addEventListener("blur", validarNome);
  campoEmail.addEventListener("blur", validarEmail);
  campoAssunto.addEventListener("change", validarAssunto); // select usa "change"
  campoMensagem.addEventListener("blur", validarMensagem);

  // Limpa erros enquanto digita (depois de errar uma vez)
  campoNome.addEventListener("input", function () {
    if (campoNome.classList.contains("error")) validarNome();
  });
  campoEmail.addEventListener("input", function () {
    if (campoEmail.classList.contains("error")) validarEmail();
  });
  campoMensagem.addEventListener("input", function () {
    if (campoMensagem.classList.contains("error")) validarMensagem();
  });

  // Contador atualiza A CADA TECLA digitada na mensagem
  campoMensagem.addEventListener("input", atualizarContador);

  // -----------------------------------------------------
  // SUBMIT — quando clica em "Enviar mensagem"
  // -----------------------------------------------------

  formulario.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    // Valida tudo
    const nomeOk     = validarNome();
    const emailOk    = validarEmail();
    const assuntoOk  = validarAssunto();
    const mensagemOk = validarMensagem();

    if (!nomeOk || !emailOk || !assuntoOk || !mensagemOk) {
      alert("⚠️ Por favor, corrija os campos destacados antes de enviar.");
      return;
    }

    // Pega os valores limpos
    const nome     = campoNome.value.trim();
    const email    = campoEmail.value.trim();
    const assunto  = campoAssunto.options[campoAssunto.selectedIndex].text;
    const mensagem = campoMensagem.value.trim();

    // Mostra confirmação de envio
    const confirmar = confirm(
      "Confirmar envio da mensagem?\n\n" +
      "Nome: " + nome + "\n" +
      "E-mail: " + email + "\n" +
      "Assunto: " + assunto + "\n" +
      "Caracteres: " + mensagem.length
    );

    if (!confirmar) return;

    const botaoEnviar = formulario.querySelector('button[type="submit"]');
    botaoEnviar.textContent = "Enviando...";
    botaoEnviar.disabled = true;

    // Envio real via Formspree (AJAX para manter o usuário na página)
    try {
      const dadosForm = new FormData(formulario);
      const resposta = await fetch(formulario.action, {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: dadosForm
      });

      if (resposta.ok) {
        alert(
          "✅ Mensagem enviada com sucesso!\n\n" +
          "Olá, " + nome.split(" ")[0] + "! Recebemos sua mensagem sobre \"" + assunto + "\".\n" +
          "Responderemos no e-mail " + email + " em breve."
        );

        formulario.reset();
        atualizarContador();
        [campoNome, campoEmail, campoAssunto, campoMensagem].forEach(function (campo) {
          campo.classList.remove("success", "error");
        });

      } else {
        // Tenta extrair mensagens de erro do JSON do Formspree
        let textoErro = "Não foi possível enviar agora. Tente novamente em instantes.";
        try {
          const json = await resposta.json();
          if (json && Array.isArray(json.errors) && json.errors.length) {
            textoErro = json.errors.map(function (e) { return e.message; }).join(", ");
          }
        } catch (e) { /* resposta não-JSON — usa texto padrão */ }
        alert("⚠️ Erro ao enviar:\n" + textoErro);
      }

    } catch (erro) {
      console.error("[contato] Falha ao enviar:", erro);
      alert("⚠️ Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      botaoEnviar.textContent = "Enviar mensagem";
      botaoEnviar.disabled = false;
    }
  });

  // Inicializa o contador (caso o navegador tenha auto-preenchido)
  atualizarContador();

  console.log("✓ contato.js carregado");
});