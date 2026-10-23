import "./style.css";
import { Loop } from "./engine/loop";
import { ParticleSystem } from "./simulation/particles";
import { Input, type Tool } from "./input";
import { Renderer } from "./renderer";
const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
  document.querySelector<T>(selector)!;
const canvas = $<HTMLCanvasElement>("#space"),
  system = new ParticleSystem(innerWidth, innerHeight),
  renderer = new Renderer(canvas);
const tools: Tool[] = ["connect", "move", "add", "erase"];
const help: Record<Tool, string> = {
  connect: "Scegli due punti per collegarli.",
  move: "Trascina un punto. I suoi legami lo seguiranno.",
  add: "Tocca lo spazio per aggiungere un punto.",
  erase: "Tocca una linea per rimuovere il legame.",
};
let started = false;
let input: Input;
function sync() {
  if (!input) return;
  $("#point-count").textContent = String(system.particles.length).padStart(
    3,
    "0",
  );
  $("#edge-count").textContent = String(system.links.length).padStart(2, "0");
  $<HTMLInputElement>("#density").value = String(system.particles.length);
  $<HTMLButtonElement>("#clear").disabled = system.links.length === 0;
  $("#selection-hint").textContent =
    system.selected !== null
      ? matchMedia("(pointer:coarse)").matches
        ? "Scegli il secondo punto. Ritocca il primo per annullare."
        : "Primo punto scelto. Scegli il secondo. · Esc per annullare"
      : "";
  if (
    !started &&
    (system.selected !== null ||
      system.links.length > 0 ||
      input.tool !== "connect")
  ) {
    started = true;
    document.body.classList.add("started");
    $("#welcome").setAttribute("aria-hidden", "true");
  }
  $("#tool-help").textContent = help[input.tool];
  document
    .querySelectorAll<HTMLButtonElement>("[data-tool]")
    .forEach((button) => {
      const active = button.dataset.tool === input.tool;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
}
input = new Input(canvas, system, sync);
function pause() {
  system.paused = !system.paused;
  const button = $<HTMLButtonElement>("#pause");
  button.setAttribute("aria-pressed", String(system.paused));
  button.setAttribute(
    "aria-label",
    system.paused ? "Riprendi movimento" : "Metti in pausa",
  );
  $("#pause-icon").innerHTML = system.paused
    ? '<path d="m8 5 11 7-11 7z"/>'
    : '<path d="M8 5v14M16 5v14"/>';
  $("#live").innerHTML = system.paused
    ? "<i></i> IN PAUSA"
    : "<i></i> IN MOVIMENTO";
  $("#live").classList.toggle("paused", system.paused);
}
$("#pause").onclick = pause;
document
  .querySelectorAll<HTMLButtonElement>("[data-tool]")
  .forEach(
    (button) =>
      (button.onclick = () => input.setTool(button.dataset.tool as Tool)),
  );
$("#clear").onclick = () => {
  system.clearLinks();
  sync();
};
$("#reset").onclick = () => {
  input.cancel();
  system.reset();
  sync();
};
$<HTMLInputElement>("#density").oninput = (e) => {
  system.setCount(Number((e.target as HTMLInputElement).value));
  sync();
};
$<HTMLInputElement>("#speed").oninput = (e) => {
  system.speed = Number((e.target as HTMLInputElement).value);
  $("#speed-value").textContent = system.speed.toFixed(1) + "×";
};
function settings(open: boolean) {
  $("#settings").hidden = !open;
  $("#settings-toggle").setAttribute("aria-expanded", String(open));
  $("#settings-toggle").setAttribute(
    "aria-label",
    open ? "Chiudi impostazioni" : "Apri impostazioni",
  );
}
$("#settings-toggle").onclick = () => settings($("#settings").hidden);
if (innerWidth < 700) settings(false);
if (matchMedia("(prefers-reduced-motion: reduce)").matches) pause();
const abort = new AbortController();
window.addEventListener(
  "keydown",
  (e) => {
    if (e.target instanceof HTMLInputElement) return;
    if (e.code === "Space" && !(e.target instanceof HTMLButtonElement)) {
      e.preventDefault();
      pause();
    }
    if (e.key === "Escape") {
      input.cancel();
      sync();
    }
    if (["1", "2", "3", "4"].includes(e.key))
      input.setTool(tools[Number(e.key) - 1]);
  },
  { signal: abort.signal },
);
window.addEventListener(
  "resize",
  () => {
    system.resize(innerWidth, innerHeight);
    renderer.resize();
  },
  { signal: abort.signal },
);
const loop = new Loop(
  (dt) => system.update(dt),
  (alpha) => {
    input.refreshHover();
    renderer.draw(system, input, system.paused ? 1 : alpha);
  },
);
loop.start();
sync();
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    loop.stop();
    input.dispose();
    abort.abort();
  });
