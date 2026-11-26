// Dev-only writing tools. Loaded by nav.js only on localhost with dev/server.py running.
// Edit: the whole article becomes editable; changes are saved when you click Done editing. Comment: select text (or click an element) and leave a note.
// Both are saved to dev/notes.json for Claude to review and apply to the real HTML.
(() => {
  const page = location.pathname;
  const TEXT = "p, li, h1, h2, h3, h4, td, th, figcaption, figure.todo";
  const article = document.querySelector("article") || document.body;
  let mode = null;

  const style = document.createElement("style");
  style.textContent = `
    .dev-bar { position: fixed; right: 16px; bottom: 16px; z-index: 99; display: flex; gap: 6px; font: 13px system-ui;
      background: #fff; border: 1px solid #111; border-radius: 6px; padding: 6px; box-shadow: 0 2px 10px #0002; }
    .dev-bar button { font: inherit; border: 1px solid #ccc; background: #fff; border-radius: 4px; padding: 4px 10px; cursor: pointer; }
    .dev-bar button.on { background: #111; color: #fff; border-color: #111; }
    .dev-bar span { align-self: center; color: #666; padding: 0 4px; }
    body.dev-edit article, body.dev-edit article:focus { outline: 2px dashed #2563eb; outline-offset: 8px; }
    body.dev-comment article :is(${TEXT}):hover { outline: 1px dashed #c2410c; cursor: crosshair; }
    .dev-edited { background: #dbeafe; }
    .dev-noted { box-shadow: inset 3px 0 0 #c2410c; }`;
  document.head.append(style);

  const bar = document.createElement("div");
  bar.className = "dev-bar";
  bar.innerHTML = `<button data-m="edit">Edit</button><button data-m="comment">Comment</button><span></span>`;
  document.body.append(bar);
  const count = bar.querySelector("span");

  const save = (note) => fetch("/__notes", { method: "POST", body: JSON.stringify({ page, ...note }) })
    .then(refresh);

  // Where an element is: its section id and the first words of its text.
  const where = (el) => ({ section: el.closest("section[id]")?.id || "", tag: el.tagName.toLowerCase() });
  const snippet = (s) => s.replace(/\s+/g, " ").trim();

  bar.addEventListener("click", (e) => {
    const m = e.target.dataset.m;
    if (!m) return;
    if (mode === "edit") saveEdits();
    mode = mode === m ? null : m;
    document.body.classList.toggle("dev-edit", mode === "edit");
    document.body.classList.toggle("dev-comment", mode === "comment");
    bar.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.m === mode));
    bar.querySelector('[data-m="edit"]').textContent = mode === "edit" ? "Done editing" : "Edit";
    if (mode === "edit") startEditing();
  });

  // Edit mode makes the whole article editable. Every text block is snapshotted on the way in,
  // and on the way out (Done editing, or leaving the page) each changed, added or deleted block is saved.
  let snap = new Map();
  function startEditing() {
    snap = new Map([...article.querySelectorAll(TEXT)].map((el) => [el, el.innerHTML]));
    article.contentEditable = "true";
    article.querySelectorAll(".chart, .dtcm, .toc").forEach((el) => (el.contentEditable = "false"));
    article.focus();
  }
  function collectEdits() {
    article.contentEditable = "false";
    const notes = [];
    for (const [el, before] of snap) {
      if (!el.isConnected) notes.push({ type: "delete", ...where(el), before: before.trim() });
      else if (el.innerHTML !== before) {
        el.classList.add("dev-edited");
        notes.push({ type: "edit", ...where(el), before: before.trim(), after: el.innerHTML.trim() });
      }
    }
    article.querySelectorAll(TEXT).forEach((el) => {
      if (snap.has(el) || !snippet(el.textContent)) return;
      el.classList.add("dev-edited");
      const prev = el.previousElementSibling;
      notes.push({ type: "add", ...where(el), afterBlock: prev ? snippet(prev.textContent).slice(0, 160) : "", html: el.outerHTML });
    });
    snap = new Map();
    return notes;
  }
  async function saveEdits() {
    for (const note of collectEdits()) await save(note);
  }
  addEventListener("pagehide", () => {
    if (mode !== "edit") return;
    collectEdits().forEach((n) => navigator.sendBeacon("/__notes", JSON.stringify({ page, ...n })));
  });

  // Comments: on the selected text if there is a selection, otherwise on the clicked element.
  article.addEventListener("click", (e) => {
    if (mode !== "comment") return;
    const el = e.target.closest(TEXT) || e.target;
    e.preventDefault();
    const selected = snippet(String(getSelection()));
    const text = prompt(`Comment on: "${(selected || snippet(el.textContent)).slice(0, 80)}…"`);
    if (!text) return;
    el.classList.add("dev-noted");
    save({ type: "comment", ...where(el), on: selected || snippet(el.textContent).slice(0, 160), comment: text });
  }, true);

  async function refresh() {
    const notes = (await fetch("/__notes").then((r) => r.json())).filter((n) => n.page === page);
    const open = notes.filter((n) => n.status === "open");
    count.textContent = `${open.length} open`;
    article.querySelectorAll(TEXT).forEach((el) => {
      const t = snippet(el.textContent);
      const mine = open.filter((n) => n.type === "comment" && t.includes(n.on.slice(0, 60)));
      if (mine.length) { el.classList.add("dev-noted"); el.title = mine.map((n) => n.comment).join("\n"); }
    });
  }
  refresh();
})();
