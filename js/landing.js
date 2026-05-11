

document.addEventListener("DOMContentLoaded", function () {

  if (typeof Auth !== "undefined" && Auth.estaLogado()) {
    const usuario = Auth.pegarUsuario();
    console.log("Usuário já logado: " + usuario.nome + " — redirecionando...");
    window.location.href = "pages/home.html";
    return;
  }

  console.log("✓ landing.js carregado (visitante)");
});