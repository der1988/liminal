import "./style.css";
import * as THREE from "three";
import { Loop } from "./engine/loop";
import { World } from "./scene";
import { Controller } from "./player/controller";
import { Post } from "./effects/post";
import { Ambience } from "./effects/audio";
const canvas = document.querySelector<HTMLCanvasElement>("#world")!;
function start() {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: "high-performance",
    });
  } catch {
    document.body.classList.add("failed");
    document.querySelector<HTMLElement>("#error")!.hidden = false;
    return;
  }
  const dpr = Math.min(
    devicePixelRatio || 1,
    matchMedia("(pointer:coarse)").matches ? 1.25 : 1.5,
  );
  renderer.setPixelRatio(dpr);
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  const camera = new THREE.PerspectiveCamera(
      69,
      innerWidth / innerHeight,
      0.1,
      220,
    ),
    world = new World();
  const post = new Post(renderer, world.scene, camera),
    audio = new Ambience();
  const intro = document.querySelector<HTMLElement>("#intro")!,
    hud = document.querySelector<HTMLElement>("#ingame")!,
    enter = document.querySelector<HTMLButtonElement>("#enter")!;
  let entered = false;
  const controller = new Controller(canvas, camera, pause);
  const loop = new Loop(
    (dt) => {
      controller.update(dt);
      world.update(dt);
    },
    (alpha) => {
      controller.render(alpha, world.time, !controller.active);
      post.render(world.time);
    },
  );
  function pause() {
    if (!controller.active) return;
    controller.deactivate();
    loop.paused = true;
    intro.hidden = false;
    hud.hidden = true;
    document.body.classList.remove("exploring");
    enter.innerHTML = "TORNA NELLA PIAZZA <span>↗</span>";
    audio.pause(true);
    enter.focus();
  }
  enter.onclick = () => {
    entered = true;
    intro.hidden = true;
    hud.hidden = false;
    document.body.classList.add("exploring");
    loop.paused = false;
    controller.activate();
    audio.pause(false);
  };
  document.querySelector<HTMLButtonElement>("#pause")!.onclick = pause;
  const audioButton = document.querySelector<HTMLButtonElement>("#audio")!;
  audioButton.onclick = async () => {
    try {
      const on = await audio.toggle();
      audioButton.setAttribute("aria-pressed", String(on));
      audioButton.querySelector("span")!.textContent = on ? "ON" : "OFF";
      if (entered && !controller.active) audio.pause(true);
    } catch {
      audioButton.querySelector("span")!.textContent = "NON DISPONIBILE";
    }
  };
  const resize = () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    post.resize(innerWidth, innerHeight);
  };
  window.addEventListener("resize", resize);
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    controller.deactivate();
    loop.stop();
    document.querySelector<HTMLElement>("#error")!.hidden = false;
  });
  loop.start();
  if (import.meta.hot)
    import.meta.hot.dispose(() => {
      loop.stop();
      controller.dispose();
      audio.dispose();
      window.removeEventListener("resize", resize);
      world.scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const materials = Array.isArray(o.material)
            ? o.material
            : [o.material];
          for (const m of materials) m.dispose();
        }
      });
      post.composer.dispose();
      renderer.dispose();
    });
}
start();
