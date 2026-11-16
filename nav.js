// Shared navigation. Add a week here and create its page in longhorn-silicon/.
const WEEKS = [
  ["2026-09-28", "Sep 28 – Oct 4"],
  ["2026-10-05", "Oct 5 – 11"],
  ["2026-10-12", "Oct 12 – 18"],
  ["2026-10-19", "Oct 19 – 25"],
  ["2026-10-26", "Oct 26 – Nov 1"],
  ["2026-11-02", "Nov 2 – 8"],
  ["2026-11-09", "Nov 9 – 15"],
];

const root = document.body.dataset.root || "";
const page = location.pathname.split("/").pop().replace(/\.html$/, "");
const inLhs = location.pathname.includes("/longhorn-silicon/");
const nav = document.querySelector("nav");
const i = WEEKS.findIndex(([slug]) => slug === page);

// Back link: week -> longhorn silicon -> home. Nothing on the home page.
if (i >= 0) nav.innerHTML = `<a href="index.html">← Longhorn Silicon</a>`;
else if (inLhs) nav.innerHTML = `<a href="${root}index.html">← Home</a>`;

// Previous / next week at the bottom of a week page.
if (i >= 0) {
  const prev = WEEKS[i - 1], next = WEEKS[i + 1];
  const pager = document.createElement("div");
  pager.className = "pager";
  pager.innerHTML =
    (prev ? `<a href="${prev[0]}.html">← ${prev[1]}</a>` : "<span></span>") +
    (next ? `<a href="${next[0]}.html">${next[1]} →</a>` : "<span></span>");
  document.querySelector(".notes").before(pager);
}

// The Longhorn Silicon index lists the weeks.
const list = document.getElementById("weeks");
if (list) list.innerHTML = WEEKS.map(([slug, label]) => `<a href="${slug}.html">${label}</a>`).join("");
