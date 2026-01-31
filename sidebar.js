(function(){
  const mount = document.getElementById("sidebar-mount");
  if (!mount) return;

  const applyActive = (root) => {
    const path = (location.pathname.split("/").pop() || "inicio.html").toLowerCase();
    root.querySelectorAll(".nav-item").forEach(a => {
      const route = (a.getAttribute("data-route") || a.getAttribute("href") || "").toLowerCase();
      const href = (a.getAttribute("href") || "").toLowerCase();
      const isActive = (route && route === path) || (href && href === path);
      if (isActive) a.classList.add("active");
      else a.classList.remove("active");
    });
  };

  const setCollapsed = (sidebar, collapsed) => {
    sidebar.setAttribute("data-collapsed", collapsed ? "1" : "0");
    document.body.classList.toggle("sidebar-collapsed", !!collapsed);
    // guardar estado apenas durante a sessão (aba/janela atual)
    try {
      sessionStorage.setItem("sidebar-collapsed", collapsed ? "1" : "0");
    } catch (e) {
      // ignore storage errors (modo privado, etc.)
    }
  };

  fetch("sidebar.html", { cache: "no-store" })
    .then(r => r.text())
    .then(html => {
      mount.innerHTML = html;

      const sidebar = mount.querySelector(".sidebar");
      const toggle = mount.querySelector(".sidebar-toggle");
      if (!sidebar || !toggle) return;

      // restaurar estado para esta aba (sessão); por defeito, recolhido
      let collapsed = true;
      try {
        const saved = sessionStorage.getItem("sidebar-collapsed");
        if (saved === "0") collapsed = false;
        else if (saved === "1") collapsed = true;
      } catch (e) {
        collapsed = true;
      }
      setCollapsed(sidebar, collapsed);

      toggle.addEventListener("click", () => {
        const now = sidebar.getAttribute("data-collapsed") === "1";
        setCollapsed(sidebar, !now);
      });

      applyActive(mount);
    })
    .catch(() => {
      // em caso de erro ao carregar a sidebar, falha silenciosamente
    });

  // feedback visual da masthead "colada" no topo ao fazer scroll
  const masthead = document.querySelector(".with-sidebar .masthead");
  const sentinel = document.querySelector(".masthead-sentinel");
  if (masthead && sentinel && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        masthead.classList.toggle("is-stuck", !entry.isIntersecting);
      });
    }, { root: null, threshold: 0 });
    io.observe(sentinel);
  }
})();