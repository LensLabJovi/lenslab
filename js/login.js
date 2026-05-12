

document.addEventListener("DOMContentLoaded", function () {

 
  const formulario = document.getElementById("loginForm");
  const campoEmail = document.getElementById("email");
  const campoSenha = document.getElementById("password");

  
  const erroEmail = document.getElementById("email-error");
  const erroSenha = document.getElementById("password-error");

  
  if (!formulario) return;

  
  function emailValido(texto) {
    const padrao = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return padrao.test(texto);
  }

  
  function validarEmail() {
    const valor = campoEmail.value.trim(); 

    if (valor === "") {
      mostrarErro(campoEmail, erroEmail, "Por favor, digite seu e-mail");
      return false;
    }

    if (!emailValido(valor)) {
      mostrarErro(campoEmail, erroEmail, "E-mail inválido (ex: nome@dominio.com)");
      return false;
    }

    limparErro(campoEmail, erroEmail);
    return true;
  }

  
  function validarSenha() {
    const valor = campoSenha.value;

    if (valor === "") {
      mostrarErro(campoSenha, erroSenha, "Por favor, digite sua senha");
      return false;
    }

    if (valor.length < 6) {
      mostrarErro(campoSenha, erroSenha, "A senha deve ter no mínimo 6 caracteres");
      return false;
    }

    limparErro(campoSenha, erroSenha);
    return true;
  }



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


  campoEmail.addEventListener("blur", validarEmail);
  campoSenha.addEventListener("blur", validarSenha);

  
  campoEmail.addEventListener("input", function () {
    if (campoEmail.classList.contains("error")) {
      validarEmail();
    }
  });

  campoSenha.addEventListener("input", function () {
    if (campoSenha.classList.contains("error")) {
      validarSenha();
    }
  });



  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();

    
    const emailOk = validarEmail();
    const senhaOk = validarSenha();

    if (!emailOk || !senhaOk) {
     
      alert("⚠️ Por favor, corrija os erros antes de continuar.");
      return;
    }

    const email = campoEmail.value.trim();

    
    const botaoEntrar = formulario.querySelector('button[type="submit"]');
    const textoOriginal = botaoEntrar.textContent;
    botaoEntrar.textContent = "Entrando...";
    botaoEntrar.disabled = true;

    
     setTimeout(function () {
     
      const nomeUsuario = email.split("@")[0]
        .replace(/[^a-zA-Z\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      
      const nomeFormatado = nomeUsuario
        .split(" ")
        .map(p => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" ");

      Auth.salvarUsuario({
        nome: nomeFormatado || "Usuário LensLab",
        email: email,
        dataLogin: new Date().toISOString()
      });

      alert("✅ Bem-vindo(a), " + nomeFormatado + "!");
      window.location.href = "home.html";
    }, 1200);
  });


  const linkEsqueci    = document.getElementById("forgotPasswordLink");
  const modal          = document.getElementById("forgotPasswordModal");
  const botaoFechar    = document.getElementById("forgotClose");
  const formEsqueci    = document.getElementById("forgotForm");
  const campoEmailModal = document.getElementById("forgotEmail");
  const erroEmailModal  = document.getElementById("forgotEmail-error");
  const blocoSucesso   = document.getElementById("forgotSuccess");
  const mensagemSucesso = document.getElementById("forgotSuccessMsg");

  function abrirModal() {
    modal.removeAttribute("hidden");
    document.body.classList.add("modal-open");


    formEsqueci.removeAttribute("hidden");
    blocoSucesso.setAttribute("hidden", "");
    campoEmailModal.value = "";
    campoEmailModal.classList.remove("error", "success");
    erroEmailModal.textContent = "";


    setTimeout(function () {
      campoEmailModal.focus();
    }, 50);
  }

  function fecharModal() {
    modal.setAttribute("hidden", "");
    document.body.classList.remove("modal-open");
  }

  if (linkEsqueci && modal) {
    linkEsqueci.addEventListener("click", function (evento) {
      evento.preventDefault();
      abrirModal();
    });

    botaoFechar.addEventListener("click", fecharModal);


    modal.addEventListener("click", function (evento) {
      if (evento.target === modal) {
        fecharModal();
      }
    });


    document.addEventListener("keydown", function (evento) {
      if (evento.key === "Escape" && !modal.hasAttribute("hidden")) {
        fecharModal();
      }
    });

    formEsqueci.addEventListener("submit", function (evento) {
      evento.preventDefault();

      const valor = campoEmailModal.value.trim();

      if (valor === "") {
        mostrarErro(campoEmailModal, erroEmailModal, "Digite seu e-mail");
        return;
      }

      if (!emailValido(valor)) {
        mostrarErro(campoEmailModal, erroEmailModal, "E-mail inválido (ex: nome@dominio.com)");
        return;
      }

      limparErro(campoEmailModal, erroEmailModal);


      const botaoEnviar = formEsqueci.querySelector('button[type="submit"]');
      botaoEnviar.textContent = "Enviando...";
      botaoEnviar.disabled = true;

      setTimeout(function () {

        formEsqueci.setAttribute("hidden", "");
        blocoSucesso.removeAttribute("hidden");

        const emailMascarado = mascararEmail(valor);
        mensagemSucesso.textContent =
          "Enviamos um link de recuperação para " + emailMascarado + ". Verifique sua caixa de entrada.";

        botaoEnviar.textContent = "Enviar link";
        botaoEnviar.disabled = false;


        setTimeout(fecharModal, 3500);
      }, 1000);
    });

    campoEmailModal.addEventListener("input", function () {
      if (campoEmailModal.classList.contains("error")) {
        const valor = campoEmailModal.value.trim();
        if (valor !== "" && emailValido(valor)) {
          limparErro(campoEmailModal, erroEmailModal);
        }
      }
    });
  }


  function mascararEmail(email) {
    const partes = email.split("@");
    if (partes.length !== 2) return email;

    const usuario = partes[0];
    const dominio = partes[1];

    if (usuario.length <= 2) {
      return usuario.charAt(0) + "***@" + dominio;
    }

    const inicio = usuario.substring(0, 2);
    const fim = usuario.charAt(usuario.length - 1);
    return inicio + "***" + fim + "@" + dominio;
  }

  console.log("✓ login.js carregado");
});