

document.addEventListener("DOMContentLoaded", function () {

  const formulario = document.getElementById("signupForm");
  if (!formulario) return;


  const campoNome    = document.getElementById("name");
  const campoEmail   = document.getElementById("email");
  const campoSenha   = document.getElementById("password");
  const campoConfirm = document.getElementById("confirm");
  const checkboxTermos = formulario.querySelector('input[name="terms"]');


  const erroNome    = document.getElementById("name-error");
  const erroEmail   = document.getElementById("email-error");
  const erroSenha   = document.getElementById("password-error");
  const erroConfirm = document.getElementById("confirm-error");


  const barraForca   = document.querySelector(".strength-bar span");
  const textoForca   = document.querySelector(".password-strength small");

  

  function validarNome() {
    const valor = campoNome.value.trim();

    if (valor === "") {
      mostrarErro(campoNome, erroNome, "Digite seu nome completo");
      return false;
    }

    if (valor.length < 3) {
      mostrarErro(campoNome, erroNome, "Nome muito curto (mínimo 3 letras)");
      return false;
    }

  
    if (!valor.includes(" ")) {
      mostrarErro(campoNome, erroNome, "Digite nome e sobrenome");
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
      mostrarErro(campoEmail, erroEmail, "E-mail inválido (ex: nome@dominio.com)");
      return false;
    }

    limparErro(campoEmail, erroEmail);
    return true;
  }

  function validarSenha() {
    const valor = campoSenha.value;

    if (valor === "") {
      mostrarErro(campoSenha, erroSenha, "Digite uma senha");
      return false;
    }

    if (valor.length < 6) {
      mostrarErro(campoSenha, erroSenha, "Mínimo 6 caracteres");
      return false;
    }

    limparErro(campoSenha, erroSenha);
    return true;
  }

  function validarConfirmacao() {
    const senha = campoSenha.value;
    const confirmacao = campoConfirm.value;

    if (confirmacao === "") {
      mostrarErro(campoConfirm, erroConfirm, "Confirme sua senha");
      return false;
    }

    if (senha !== confirmacao) {
      mostrarErro(campoConfirm, erroConfirm, "As senhas não coincidem");
      return false;
    }

    limparErro(campoConfirm, erroConfirm);
    return true;
  }



  function calcularForcaSenha(senha) {
    let pontos = 0;

    if (senha.length >= 8)       pontos++;
    if (/[A-Z]/.test(senha))     pontos++;  
    if (/[0-9]/.test(senha))     pontos++;  
    if (/[^A-Za-z0-9]/.test(senha)) pontos++; 

    return pontos; 
  }

  function atualizarBarraForca() {
    const senha = campoSenha.value;

    if (!barraForca || !textoForca) return;

    
    if (senha === "") {
      barraForca.style.width = "0%";
      barraForca.style.background = "var(--danger)";
      textoForca.textContent = "Use letras, números e símbolos";
      textoForca.style.color = "var(--text-muted)";
      return;
    }

    const forca = calcularForcaSenha(senha);

    
    const niveis = [
      { largura: "20%", cor: "#E74C3C", texto: "Muito fraca" },        
      { largura: "40%", cor: "#FF7675", texto: "Fraca" },             
      { largura: "60%", cor: "#FDCB6E", texto: "Razoável" },          
      { largura: "80%", cor: "#74B9FF", texto: "Boa" },                
      { largura: "100%", cor: "#00B894", texto: "Forte!" }             
    ];

    const nivelAtual = niveis[forca];

    barraForca.style.width = nivelAtual.largura;
    barraForca.style.background = nivelAtual.cor;
    textoForca.textContent = nivelAtual.texto;
    textoForca.style.color = nivelAtual.cor;
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


  campoNome.addEventListener("blur", validarNome);
  campoEmail.addEventListener("blur", validarEmail);
  campoSenha.addEventListener("blur", validarSenha);
  campoConfirm.addEventListener("blur", validarConfirmacao);

 
  campoSenha.addEventListener("input", atualizarBarraForca);

  campoSenha.addEventListener("input", function () {
    if (campoConfirm.value !== "") {
      validarConfirmacao();
    }
  });

  
  campoNome.addEventListener("input", function () {
    if (campoNome.classList.contains("error")) validarNome();
  });
  campoEmail.addEventListener("input", function () {
    if (campoEmail.classList.contains("error")) validarEmail();
  });
  campoConfirm.addEventListener("input", function () {
    if (campoConfirm.classList.contains("error")) validarConfirmacao();
  });



  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();

    
    const nomeOk    = validarNome();
    const emailOk   = validarEmail();
    const senhaOk   = validarSenha();
    const confirmOk = validarConfirmacao();
    const termosOk  = checkboxTermos.checked;

    if (!termosOk) {
      alert("⚠️ Você precisa aceitar os termos de uso para continuar.");
      return;
    }

   
    if (!nomeOk || !emailOk || !senhaOk || !confirmOk) {
      alert("⚠️ Por favor, corrija os erros antes de continuar.");
      return;
    }

   
    const forca = calcularForcaSenha(campoSenha.value);
    if (forca < 2) {
      const continuar = confirm(
        "⚠️ Sua senha é fraca.\n\n" +
        "Recomendamos usar pelo menos 8 caracteres, com maiúsculas, " +
        "números e símbolos.\n\n" +
        "Deseja continuar mesmo assim?"
      );
      if (!continuar) return;
    }

   
    const nome = campoNome.value.trim().split(" ")[0]; 

    const botaoCriar = formulario.querySelector('button[type="submit"]');
    botaoCriar.textContent = "Criando conta...";
    botaoCriar.disabled = true;

    setTimeout(function () {
     
      Auth.salvarUsuario({
        nome: campoNome.value.trim(),
        email: campoEmail.value.trim(),
        dataLogin: new Date().toISOString()
      });

      alert(
        "🎉 Conta criada com sucesso!\n\n" +
        "Bem-vindo(a) ao LensLab, " + nome + "!"
      );
      window.location.href = "home.html";
    }, 1500);
  });

  console.log("✓ cadastro.js carregado");
});