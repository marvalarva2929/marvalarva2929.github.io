// Calvin and Hobbes stand at the bottom right of the window, with their footprints trailing in from the left.
const stage = document.querySelector(".walk");
const img = stage.querySelector(".walkers");

// Where each one's feet are, as a fraction of the image width, and how they step.
const FEET = [
  { at: 0.52, step: 34, w: 11, h: 6, gap: 7 }, // Hobbes
  { at: 0.79, step: 22, w: 8, h: 5, gap: 5 },  // Calvin
];
const GROUND = 10; // px from the bottom of the strip

function draw() {
  stage.querySelectorAll(".print").forEach((p) => p.remove());
  const width = img.getBoundingClientRect().width;
  const wide = innerWidth > 700;
  // wide screens: right edge 15% of the window in from the right. Phones: centered.
  const x = wide ? innerWidth * 0.85 - width : innerWidth / 2 - width / 2;
  img.style.transform = `translateX(${x}px)`;

  // the trail comes in from the left, starting past the text column so it never runs under the text
  const start = wide ? document.querySelector(".layout").getBoundingClientRect().right : -10;

  for (const foot of FEET) {
    const end = x + foot.at * width;
    let left = false;
    for (let fx = end - foot.step * 0.6; fx > start; fx -= foot.step) {
      const p = document.createElement("div");
      p.className = "print";
      p.style.left = `${fx}px`;
      p.style.bottom = `${GROUND + ((left = !left) ? foot.gap : 0)}px`;
      p.style.width = `${foot.w}px`;
      p.style.height = `${foot.h}px`;
      p.style.opacity = Math.max(0.1, (fx - start) / (end - start)); // fainter the older they are
      stage.insertBefore(p, img);
    }
  }
}

if (img.complete) draw();
else img.addEventListener("load", draw);
addEventListener("resize", draw);
