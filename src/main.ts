import "./style.css";
import { Loop } from "./engine/loop";
import { World } from "./model/world";
import { Clock } from "./model/clock";
import { Camera } from "./view/camera";
import { ObserverInput } from "./view/input";
import { Renderer } from "./renderer";
import { echoesFor } from "./model/memory";
import { Persistence, encode, type ObserverState } from "./model/persistence";
import { Hud } from "./ui/hud";
async function start() {
  const persistence = new Persistence(),
    loaded = await persistence.load(),
    world = loaded.data?.world ?? new World(),
    clock = new Clock(world),
    camera = new Camera(innerWidth, innerHeight);
  let selected = loaded.data?.observer.selected ?? null,
    seenBirth = world.lastNamedBirth?.id ?? null;
  if (loaded.data) {
    const saved = loaded.data.observer;
    clock.speed = saved.speed;
    clock.accumulator = saved.accumulator;
    camera.x = saved.camera.x;
    camera.y = saved.camera.y;
    camera.zoom = saved.camera.zoom;
    camera.follow = saved.camera.follow;
  } else if (matchMedia("(prefers-reduced-motion: reduce)").matches)
    clock.speed = 0;
  const canvas = document.querySelector<HTMLCanvasElement>("#space")!,
    renderer = new Renderer(canvas);
  const observer = (): ObserverState => ({
    speed: clock.speed,
    accumulator: clock.accumulator,
    camera: {
      x: camera.x,
      y: camera.y,
      zoom: camera.zoom,
      follow: camera.follow,
    },
    selected,
  });
  let saving = false;
  async function save() {
    if (saving) return;
    saving = true;
    try {
      await persistence.save(encode(world, observer()));
    } catch {
      hud.notice(
        "Le modifiche restano in questa scheda: salvataggio locale non disponibile.",
        true,
      );
    } finally {
      saving = false;
    }
  }
  function select(id: string | null) {
    selected = id;
    camera.follow = null;
    if (id) {
      const s = world.souls.get(id);
      if (s)
        camera.target = {
          x: s.x,
          y: s.y + (innerWidth < 600 ? (innerHeight * 0.22) / camera.zoom : 0),
        };
    }
    hud.refresh();
  }
  const hud = new Hud(
    world,
    clock,
    camera,
    select,
    () => selected,
    () => {
      void save();
    },
  );
  if (loaded.warning) hud.notice(loaded.warning, true);
  const input = new ObserverInput(canvas, world, camera, select, () =>
    echoesFor(world, selected).map((m) => m.person),
  );
  const abort = new AbortController();
  window.addEventListener(
    "resize",
    () => {
      camera.width = innerWidth;
      camera.height = innerHeight;
      renderer.resize();
    },
    { signal: abort.signal },
  );
  const journal = () => {
    const envelope = encode(world, observer());
    if (!persistence.journal(envelope)) void save();
  };
  window.addEventListener("pagehide", journal, { signal: abort.signal });
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) journal();
    },
    { signal: abort.signal },
  );
  let uiTime = 0,
    saveTime = 0;
  const loop = new Loop(
    (dt) => {
      clock.advance(dt);
      if (world.lastNamedBirth && world.lastNamedBirth.id !== seenBirth) {
        seenBirth = world.lastNamedBirth.id;
        select(seenBirth);
        const s = world.souls.get(seenBirth)!;
        camera.target = {
          x: s.x,
          y: s.y + (innerWidth < 600 ? (innerHeight * 0.22) / camera.zoom : 0),
        };
        hud.notice(s.name);
        void save();
      }
      if (camera.follow) {
        const s = world.souls.get(camera.follow);
        if (s && s.deathYear === null)
          camera.target = {
            x: s.x,
            y:
              s.y + (innerWidth < 600 ? (innerHeight * 0.22) / camera.zoom : 0),
          };
        else camera.follow = null;
      }
      camera.update(dt);
      uiTime += dt;
      saveTime += dt;
      if (uiTime > 0.25) {
        hud.refresh();
        uiTime = 0;
      }
      if (saveTime > 12) {
        void save();
        saveTime = 0;
      }
    },
    () => renderer.draw(world, camera, selected, clock.alpha),
  );
  loop.start();
  hud.refresh();
  if (import.meta.hot)
    import.meta.hot.dispose(() => {
      journal();
      loop.stop();
      input.dispose();
      hud.dispose();
      abort.abort();
      persistence.close();
    });
}
void start().catch((error) => {
  console.error(error);
  const notice = document.querySelector("#notice");
  if (notice)
    notice.textContent =
      "L’universo non è disponibile. Ricarica la pagina per riprovare.";
});
