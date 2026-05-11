

document.addEventListener("DOMContentLoaded", function () {

  atualizarHeader();

  
  const caminhoAtual = window.location.pathname;
  const arquivoAtual = caminhoAtual.split("/").pop() || "index.html";

  const linksMenu = document.querySelectorAll(".site-nav a");

  linksMenu.forEach(function (link) {
    const hrefLink = link.getAttribute("href");
    if (hrefLink && hrefLink.endsWith(arquivoAtual)) {
      linksMenu.forEach(l => l.classList.remove("active"));
      link.classList.add("active");
    }
  });

  
  const linksAncora = document.querySelectorAll('a[href^="#"]');

  linksAncora.forEach(function (link) {
    link.addEventListener("click", function (evento) {
      const destino = link.getAttribute("href");
      if (destino === "#") return;

      const elementoDestino = document.querySelector(destino);
      if (elementoDestino) {
        evento.preventDefault();
        elementoDestino.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  console.log("✓ main.js carregado");
});


function atualizarHeader() {
  const navUl = document.querySelector(".site-nav ul");
  if (!navUl) return;

 
  const itemFinal = navUl.querySelector("li:last-child");
  if (!itemFinal) return;


  const naPasta = window.location.pathname.includes("/pages/");
  const prefixo = naPasta ? "" : "pages/";

  if (Auth.estaLogado()) {
   
    const usuario = Auth.pegarUsuario();
    const iniciais = Auth.gerarIniciais(usuario.nome);
    const cor = Auth.gerarCorAvatar(usuario.nome);

    itemFinal.innerHTML = `
      <div class="user-menu">
        <button class="user-trigger" id="userTrigger">
          <span class="user-avatar" style="background: ${cor};">${iniciais}</span>
          <span class="user-name">${usuario.nome.split(" ")[0]}</span>
          <span class="user-arrow">▾</span>
        </button>

        <div class="user-dropdown" id="userDropdown" hidden>
          <div class="user-info">
            <span class="user-avatar large" style="background: ${cor};">${iniciais}</span>
            <div>
              <strong>${usuario.nome}</strong>
              <small>${usuario.email}</small>
            </div>
          </div>
          <hr>
          <a href="${prefixo}galeria.html" class="dropdown-item">
            <span>🖼️</span> Minha Galeria
          </a>
          <a href="${prefixo}camera.html" class="dropdown-item">
            <span>📸</span> Abrir Câmera
          </a>
          <hr>
          <button class="dropdown-item logout" id="logoutBtn">
            <span>🚪</span> Sair
          </button>
        </div>
      </div>
    `;


    setTimeout(ligarDropdown, 50);

  } else {
    
    itemFinal.innerHTML = `<a href="${prefixo}login.html" class="btn-primary">Entrar</a>`;
  }
}


function ligarDropdown() {
  const trigger = document.getElementById("userTrigger");
  const dropdown = document.getElementById("userDropdown");
  const logoutBtn = document.getElementById("logoutBtn");

  if (!trigger || !dropdown) return;

  
  trigger.addEventListener("click", function (e) {
    e.stopPropagation();
    if (dropdown.hasAttribute("hidden")) {
      dropdown.removeAttribute("hidden");
    } else {
      dropdown.setAttribute("hidden", "");
    }
  });

  
  document.addEventListener("click", function (e) {
    if (!dropdown.contains(e.target) && !trigger.contains(e.target)) {
      dropdown.setAttribute("hidden", "");
    }
  });

 
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      const confirmar = confirm("Deseja realmente sair?");
      if (!confirmar) return;

      Auth.logout();

     
      const naPasta = window.location.pathname.includes("/pages/");
      window.location.href = naPasta ? "../index.html" : "index.html";
    });
  }
}