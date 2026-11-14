// Sidebar, shared by every page. Add a week here and create its page in longhorn-silicon/.
const WEEKS = [
  ["2026-09-28", "sep 28 – oct 4"],
  ["2026-10-05", "oct 5 – 11"],
  ["2026-10-12", "oct 12 – 18"],
  ["2026-10-19", "oct 19 – 25"],
  ["2026-10-26", "oct 26 – nov 1"],
  ["2026-11-02", "nov 2 – 8"],
  ["2026-11-09", "nov 9 – 15"],
];

const root = document.body.dataset.root || "";
const here = location.pathname.replace(/\/index\.html$/, "/").replace(/\.html$/, "");
const inLhs = here.includes("/longhorn-silicon");

const link = (href, text, active) =>
  `<a href="${root}${href}"${active ? ' class="active"' : ""}>${text}</a>`;

let html = link("index.html", "home", !inLhs);
html += link("longhorn-silicon/index.html", "longhorn silicon", inLhs && here.endsWith("/longhorn-silicon/"));
if (inLhs) {
  html += '<div class="sub">' +
    WEEKS.map(([slug, label]) => link(`longhorn-silicon/${slug}.html`, label, here.endsWith(slug))).join("") +
    "</div>";
}

document.querySelector("nav").innerHTML = html;

// The Longhorn Silicon index lists the weeks too.
const list = document.getElementById("weeks");
if (list) list.innerHTML = WEEKS.map(([slug, label]) => `<a href="${slug}.html">${label}</a>`).join("");
