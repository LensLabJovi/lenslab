

(function () {

  if (typeof Auth === "undefined") {
    console.error("⚠️ auth.js precisa ser carregado antes de protect.js");
    return;
  }

  if (!Auth.estaLogado()) {
    alert("⚠️ Você precisa estar logado para acessar esta página.");
    
    const naPasta = window.location.pathname.includes("/pages/");
    window.location.href = naPasta ? "login.html" : "pages/login.html";
  }
})();