// Calvin and Hobbes stand in the middle of the bottom of the page, with their footprints trailing in from the left.
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
  const x = innerWidth / 2 - width / 2;
  img.style.transform = `translateX(${x}px)`;

  for (const foot of FEET) {
    const end = x + foot.at * width;
    let left = false;
    for (let fx = end - foot.step * 0.6; fx > -foot.w; fx -= foot.step) {
      const p = document.createElement("div");
      p.className = "print";
      p.style.left = `${fx}px`;
      p.style.bottom = `${GROUND + ((left = !left) ? foot.gap : 0)}px`;
      p.style.width = `${foot.w}px`;
      p.style.height = `${foot.h}px`;
      p.style.opacity = Math.max(0.15, fx / end); // fainter the older they are
      stage.insertBefore(p, img);
    }
  }
}

if (img.complete) draw();
else img.addEventListener("load", draw);
addEventListener("resize", draw);
