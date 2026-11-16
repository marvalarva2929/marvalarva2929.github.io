// Calvin and Hobbes walk left to right along the bottom of the page, leaving footprints that fade.
const stage = document.querySelector(".walk");
const img = stage.querySelector(".walkers");

// Where each one's feet are, as a fraction of the image width, and how they step.
const FEET = [
  { at: 0.52, step: 34, w: 11, h: 6, gap: 7 }, // Hobbes
  { at: 0.79, step: 22, w: 8, h: 5, gap: 5 },  // Calvin
];
const SPEED = 38; // px per second
const GROUND = 10; // px from the bottom of the strip

function print(x, foot, left, still) {
  const p = document.createElement("div");
  p.className = still ? "print still" : "print";
  p.style.left = `${x}px`;
  p.style.bottom = `${GROUND + (left ? foot.gap : 0)}px`;
  p.style.width = `${foot.w}px`;
  p.style.height = `${foot.h}px`;
  if (!still) p.addEventListener("animationend", () => p.remove());
  stage.insertBefore(p, img);
}

function start() {
  const width = img.getBoundingClientRect().width;

  // No motion: stand them at 60% with a trail behind them.
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const x = innerWidth * 0.6 - width / 2;
    img.style.transform = `translateX(${x}px)`;
    for (const foot of FEET) {
      let left = false;
      for (let fx = x + foot.at * width - foot.step; fx > 0; fx -= foot.step) print(fx, foot, (left = !left), true);
    }
    return;
  }

  let x = -width, last = null, t = 0;
  const steps = FEET.map(() => ({ next: 0, left: false }));
  const reset = () => FEET.forEach((foot, i) => (steps[i].next = x + foot.at * width));
  reset();

  function frame(now) {
    const dt = last === null ? 0 : Math.min((now - last) / 1000, 0.1);
    last = now;
    t += dt;
    x += SPEED * dt;
    if (x > innerWidth) { x = -width; reset(); }

    FEET.forEach((foot, i) => {
      const s = steps[i];
      const fx = x + foot.at * width;
      while (fx >= s.next) {
        // drop the print a little behind the foot so it appears once they've stepped off it
        print(s.next - foot.step * 0.6, foot, (s.left = !s.left), false);
        s.next += foot.step;
      }
    });

    const bob = -Math.abs(Math.sin(t * 5)) * 3;
    img.style.transform = `translate(${x}px, ${bob}px)`;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

if (img.complete) start();
else img.addEventListener("load", start);
