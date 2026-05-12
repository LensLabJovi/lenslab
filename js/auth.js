
const Auth = {

  
  CHAVE: "lenslab_usuario",

  
  salvarUsuario: function (dados) {
    
    localStorage.setItem(this.CHAVE, JSON.stringify(dados));
  },

  pegarUsuario: function () {
    const dados = localStorage.getItem(this.CHAVE);
    if (!dados) return null;

    try {
      return JSON.parse(dados);
    } catch (e) {
      
      this.logout();
      return null;
    }
  },

  estaLogado: function () {
    return this.pegarUsuario() !== null;
  },

  
  logout: function () {
    localStorage.removeItem(this.CHAVE);
  },

  protegerPagina: function (caminhoLogin) {
    if (!this.estaLogado()) {
      alert("⚠️ Você precisa estar logado para acessar esta página.");
      window.location.href = caminhoLogin || "login.html";
    }
  },

  gerarIniciais: function (nome) {
    if (!nome) return "?";
    const partes = nome.trim().split(" ");
    if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
    return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
  },

  
  gerarCorAvatar: function (nome) {
    if (!nome) return "#6C5CE7";
    const cores = [
      "linear-gradient(135deg, #6C5CE7, #A29BFE)",
      "linear-gradient(135deg, #00D2D3, #55EFC4)",
      "linear-gradient(135deg, #FD79A8, #E056C1)",
      "linear-gradient(135deg, #FDCB6E, #E17055)",
      "linear-gradient(135deg, #74B9FF, #A29BFE)",
      "linear-gradient(135deg, #00B894, #00D2D3)"
    ];
    
    let soma = 0;
    for (let i = 0; i < nome.length; i++) {
      soma += nome.charCodeAt(i);
    }
    return cores[soma % cores.length];
  }
};

document.addEventListener("DOMContentLoaded", function () {
  const botoesOlho = document.querySelectorAll(".password-toggle");

  botoesOlho.forEach(function (botao) {
    botao.addEventListener("click", function () {
      const idAlvo = botao.getAttribute("data-target");
      const campo = document.getElementById(idAlvo);
      if (!campo) return;

      const visivel = campo.type === "text";

      if (visivel) {
        campo.type = "password";
        botao.textContent = "👁";
        botao.setAttribute("aria-label", "Mostrar senha");
        botao.classList.remove("is-visible");
      } else {
        campo.type = "text";
        botao.textContent = "🙈";
        botao.setAttribute("aria-label", "Ocultar senha");
        botao.classList.add("is-visible");
      }
    });
  });
});

console.log("✓ auth.js carregado");