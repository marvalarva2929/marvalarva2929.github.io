// Article helpers: the code panel on the right, and the DTCM maps.

// ---- Code panel -------------------------------------------------------------
// <a class="code" data-src="e2e-linear.cc" data-lines="70-108">linear.cc</a>
// opens code/<src>.txt in a pop-out box on the right, scrolled to and highlighting the lines.
// The link's href is the same lines on GitHub, so it still works without JS.
const REPO = "https://github.com/LonghornSilicon/reef/blob/";
const SOURCES = {
  rtl: "5fb006c8d19a0ba9241a8156c07e2cd3d75829e2/inference-engine/src/csrc/src/simulations/",
  e2e: "83f7152304ad9c0f5286432d800f548e7ffc34db/inference-engine/coral/kernels/",
};

const panel = document.createElement("aside");
panel.className = "code-panel";
panel.innerHTML = `
  <header>
    <div><div class="code-title"></div><div class="code-sub"></div></div>
    <a class="code-gh" target="_blank" rel="noopener">GitHub ↗</a>
    <button class="code-close" aria-label="Close">×</button>
  </header>
  <pre><code></code></pre>`;
document.body.append(panel);
const cache = {};

function githubUrl(src, lines) {
  const [tree, ...rest] = src.split("-");
  const range = lines ? `#L${lines.replace("-", "-L")}` : "";
  return REPO + SOURCES[tree] + rest.join("-") + range;
}

async function openCode(link) {
  const { src, lines } = link.dataset;
  const [from, to] = (lines || "0-0").split("-").map(Number);
  panel.querySelector(".code-title").textContent = link.dataset.title || src.replace(/^(rtl|e2e)-/, "");
  panel.querySelector(".code-sub").textContent =
    (src.startsWith("rtl") ? "RTL-era kernels" : "End-to-end firmware (PR #57)") + (lines ? ` · lines ${from}–${to}` : "");
  panel.querySelector(".code-gh").href = githubUrl(src, lines);

  const code = panel.querySelector("code");
  code.textContent = "Loading…";
  document.body.classList.add("code-open");
  try {
    cache[src] ??= await fetch(`code/${src}.txt`).then((r) => r.text());
  } catch {
    code.textContent = "Couldn't load the file. Use the GitHub link above.";
    return;
  }
  code.innerHTML = "";
  cache[src].replace(/\n$/, "").split("\n").forEach((text, i) => {
    const row = document.createElement("span");
    row.className = "ln" + (i + 1 >= from && i + 1 <= to ? " hl" : "");
    row.dataset.n = i + 1;
    row.textContent = text + "\n";
    code.append(row);
  });
  const first = code.querySelector(".hl");
  const pre = panel.querySelector("pre");
  pre.scrollTop = first ? first.offsetTop - 24 : 0;
}

const closeCode = () => document.body.classList.remove("code-open");
panel.querySelector(".code-close").addEventListener("click", closeCode);
addEventListener("keydown", (e) => e.key === "Escape" && closeCode());

document.querySelectorAll("a.code").forEach((link) => {
  link.href = githubUrl(link.dataset.src, link.dataset.lines);
  link.addEventListener("click", (e) => {
    if (e.metaKey || e.ctrlKey) return; // let cmd-click open GitHub
    e.preventDefault();
    openCode(link);
  });
});

// ---- DTCM maps --------------------------------------------------------------
// The firmware's 32 KB DTCM (struct Dtcm in common.hpp, 8-token blocks).
// <div class="dtcm" data-use="residual=reads|normed=writes|shared=…|scratch=…"></div>
// Regions named in data-use are drawn as in use, with that label; the rest are dimmed.
const REGIONS = [
  ["residual", "Residual stream", 4112],
  ["normed", "Normed", 4112],
  ["shared", "Shared", 16400],
  ["scratch", "Scratch", 4608],
  ["small", "Tables", 704],
  ["free", "Stack", 2832],
];
// What each region is for, whichever kernel is running.
const ROLES = {
  residual: "residual stream",
  normed: "LayerNorm output, then attention output",
  shared: "reused by each kernel",
  scratch: "weight buffers or softmax state",
  small: "exp and GeLU tables, running sums",
  free: "mailbox and stack",
};
const TOTAL = 32768;
const kib = (bytes) => `${(bytes / 1024).toFixed(1)} KiB`;

document.querySelectorAll(".dtcm").forEach((el) => {
  const use = Object.fromEntries(
    (el.dataset.use || "").split("|").filter(Boolean).map((pair) => pair.split("="))
  );
  // Names go on the segments wide enough to hold them; the legend covers every region.
  const bar = REGIONS.map(([id, name, bytes]) => {
    const label = bytes / TOTAL > 0.07 ? name : "";
    return `<span class="seg ${id}${use[id] ? " on" : ""}" style="flex-grow:${bytes}">${label}</span>`;
  }).join("");
  const axis = [0, 8, 16, 24, 32].map((k) =>
    `<span style="left:${(k / 32) * 100}%">${k}${k === 32 ? " KiB" : ""}</span>`).join("");
  const rows = REGIONS.map(([id, name, bytes]) => `
    <tr class="${use[id] ? "on" : "off"}">
      <td><span class="swatch ${id}${use[id] ? " on" : ""}"></span>${name}</td>
      <td>${kib(bytes)}</td>
      <td>${use[id] || `idle: ${ROLES[id]}`}</td>
    </tr>`).join("");
  const caption = el.dataset.name ? `<p>How the 32 KiB is split up during ${el.dataset.name}:</p>` : "";
  el.innerHTML = `${caption}<div class="bar">${bar}</div><div class="axis">${axis}</div>
    <table class="legend"><tr><th>Region</th><th>Size</th><th>Used for</th></tr>${rows}</table>`;
});

// ---- Charts -----------------------------------------------------------------
// <figure class="chart" data-kind="stack|bars"><figcaption/><script type="application/json">…</script></figure>
// stack: one stacked bar per row. bars: one or more thin bars per row (grouped).
const SERIES = ["#257de0", "#f47230", "#00b894", "#f2a600"];
const RAMP = ["#a8cbf3", "#5b9ce8", "#1d5fae"]; // one hue, light → dark, for ordered series

document.querySelectorAll("figure.chart").forEach((fig) => {
  const spec = JSON.parse(fig.querySelector("script").textContent);
  const colors = spec.ramp ? RAMP : SERIES;
  const fmt = (v) => v.toLocaleString("en-US", { maximumFractionDigits: spec.decimals ?? 1 });
  const unit = spec.unit === "%" ? "%" : ` ${spec.unit}`;
  const pct = (v) => `${(v / spec.max) * 100}%`;

  if (fig.dataset.kind === "columns") { // vertical bars, left to right; row.series picks the color
    const cols = spec.rows.map((row) => {
      const v = row.values[0], i = row.series || 0;
      return `<div class="col" title="${row.label}: ${fmt(v)} ${spec.unit}${row.change ? ` (${row.change})` : ""}">
        <div class="col-plot"><span class="col-val">${i ? "~" : ""}${fmt(v)}${row.change ? `<small>${row.change}</small>` : ""}</span>
        <span class="col-bar" style="height:${pct(v)};background:${colors[i]}"></span></div>
        <div class="col-label">${row.label}</div></div>`;
    }).join("");
    const legend = spec.series.length > 1 ? `<div class="legend">${spec.series.map((s, i) =>
      `<span><i style="background:${colors[i]}"></i>${s}</span>`).join("")}</div>` : "";
    fig.insertAdjacentHTML("beforeend", `${legend}<div class="columns">${cols}</div>`);
    return;
  }

  const rows = spec.rows.map((row) => {
    let track;
    if (fig.dataset.kind === "stack") {
      const total = row.values.reduce((a, b) => a + b, 0);
      const segs = row.values.map((v, i) => v ? `<span class="seg" style="width:${pct(v)};background:${colors[i]}"
          title="${spec.series[i]}: ${fmt(v)}${unit}">${v / spec.max > 0.09 ? fmt(v) : ""}</span>` : "").join("");
      const marker = spec.marker ? `<span class="marker" style="left:${pct(spec.marker.at)}"></span>` : "";
      track = `<div class="track">${segs}${marker}<span class="total">${fmt(total)}</span></div>`;
    } else {
      track = row.values.map((v, i) => `<div class="track thin"><span class="seg" style="width:${pct(v)};background:${colors[i]}"
          title="${spec.series[i]}: ${fmt(v)}${unit}"></span><span class="val">${fmt(v)}${unit}</span></div>`).join("");
    }
    return `<div class="row"><div class="label">${row.label}</div><div class="tracks">${track}</div></div>`;
  }).join("");

  const legend = spec.series.length > 1 ? `<div class="legend">${spec.series.map((s, i) =>
    `<span><i style="background:${colors[i]}"></i>${s}</span>`).join("")}</div>` : "";
  const note = spec.marker ? `<div class="note"><i class="marker-key"></i>${spec.marker.label}</div>` : "";
  fig.insertAdjacentHTML("beforeend", `${legend}<div class="plot">${rows}</div>${note}`);
});
