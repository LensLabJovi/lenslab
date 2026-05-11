

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

  console.log("✓ login.js carregado");
});