// Back link on every page except home. On an article, a sticky breadcrumb that follows the section you're reading.
const root = document.body.dataset.root || "";
const nav = document.querySelector("nav");
const article = document.querySelector("article");

if (article) {
  const title = article.dataset.crumb || document.title;
  nav.className = "crumbs";
  nav.innerHTML = `<a href="${root}index.html">Home</a><span>/</span><a href="#">${title}</a><span class="here-sep">/</span><span class="here"></span>`;

  // Contents list under the title.
  const sections = [...article.querySelectorAll("section[id]")];
  const toc = article.querySelector(".toc");
  if (toc) toc.innerHTML = sections.map((s) => `<li><a href="#${s.id}">${s.querySelector("h2").textContent}</a></li>`).join("");

  // The current section is the last one whose heading has scrolled past the breadcrumb.
  const here = nav.querySelector(".here");
  const update = () => {
    const line = nav.getBoundingClientRect().bottom + 48; // past the jump-to offset (scroll-margin-top)
    let current = null;
    for (const s of sections) if (s.getBoundingClientRect().top <= line) current = s;
    here.textContent = current ? current.querySelector("h2").textContent : "";
    nav.classList.toggle("deep", !!current);
  };
  addEventListener("scroll", update, { passive: true });
  update();
} else if (root) {
  nav.innerHTML = `<a href="${root}index.html">← Home</a>`;
}

// Dev-only writing tools (edit in place + comments), only when served by dev/server.py on localhost.
if (["localhost", "127.0.0.1"].includes(location.hostname)) {
  fetch("/__notes").then((r) => r.ok && document.head.append(Object.assign(document.createElement("script"), { src: "/dev/dev.js" })), () => {});
}
