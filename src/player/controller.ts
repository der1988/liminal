import * as THREE from "three";
import { walk } from "./movement";
import { clamp } from "../simulation/math";
export class Controller {
  readonly position = { x: 2, z: 21 };
  private previous = { ...this.position };
  yaw = -0.04;
  pitch = 0.12;
  private step = 0;
  private previousStep = 0;
  private keys = new Set<string>();
  private touchMove = { x: 0, y: 0 };
  private left: { id: number; x: number; y: number } | null = null;
  private right: { id: number; x: number; y: number } | null = null;
  private mouseDrag = false;
  private abort = new AbortController();
  active = false;
  constructor(
    private canvas: HTMLCanvasElement,
    private camera: THREE.PerspectiveCamera,
    private onPause: () => void,
  ) {
    const opts = { signal: this.abort.signal };
    document.addEventListener(
      "keydown",
      (e) => {
        if (
          [
            "KeyW",
            "KeyA",
            "KeyS",
            "KeyD",
            "ArrowUp",
            "ArrowDown",
            "ArrowLeft",
            "ArrowRight",
            "Space",
          ].includes(e.code) &&
          this.active
        ) {
          e.preventDefault();
          this.keys.add(e.code);
        }
        if (e.code === "Escape" && this.active) this.onPause();
      },
      opts,
    );
    document.addEventListener("keyup", (e) => this.keys.delete(e.code), opts);
    document.addEventListener(
      "mousemove",
      (e) => {
        if (
          this.active &&
          (document.pointerLockElement === canvas || this.mouseDrag)
        ) {
          this.yaw -= e.movementX * 0.0018;
          this.pitch = clamp(this.pitch - e.movementY * 0.0018, -1.25, 1.25);
        }
      },
      opts,
    );
    canvas.addEventListener(
      "pointerdown",
      () => {
        if (this.active) this.mouseDrag = true;
      },
      opts,
    );
    window.addEventListener(
      "pointerup",
      () => {
        this.mouseDrag = false;
      },
      opts,
    );
    document.addEventListener(
      "pointerlockchange",
      () => {
        if (
          this.active &&
          !document.pointerLockElement &&
          !matchMedia("(pointer:coarse)").matches
        )
          this.onPause();
      },
      opts,
    );
    window.addEventListener(
      "blur",
      () => {
        this.clear();
        if (this.active) this.onPause();
      },
      opts,
    );
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden && this.active) this.onPause();
      },
      opts,
    );
    const touch = document.querySelector<HTMLElement>("#touch-controls")!;
    touch.addEventListener(
      "touchstart",
      (e) => {
        if (!this.active) return;
        e.preventDefault();
        for (const t of Array.from(e.changedTouches)) {
          if (t.clientX < innerWidth * 0.5 && !this.left)
            this.left = { id: t.identifier, x: t.clientX, y: t.clientY };
          else if (!this.right)
            this.right = { id: t.identifier, x: t.clientX, y: t.clientY };
        }
      },
      { ...opts, passive: false },
    );
    touch.addEventListener(
      "touchmove",
      (e) => {
        if (!this.active) return;
        e.preventDefault();
        for (const t of Array.from(e.changedTouches)) {
          if (this.left && t.identifier === this.left.id) {
            this.touchMove.x = clamp((t.clientX - this.left.x) / 42, -1, 1);
            this.touchMove.y = clamp((this.left.y - t.clientY) / 42, -1, 1);
            document.querySelector<HTMLElement>("#stick")!.style.transform =
              `translate(${this.touchMove.x * 23}px,${-this.touchMove.y * 23}px)`;
          } else if (this.right && t.identifier === this.right.id) {
            this.yaw -= (t.clientX - this.right.x) * 0.004;
            this.pitch = clamp(
              this.pitch - (t.clientY - this.right.y) * 0.004,
              -1.25,
              1.25,
            );
            this.right.x = t.clientX;
            this.right.y = t.clientY;
          }
        }
      },
      { ...opts, passive: false },
    );
    const end = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (this.left && t.identifier === this.left.id) {
          this.left = null;
          this.touchMove = { x: 0, y: 0 };
          document.querySelector<HTMLElement>("#stick")!.style.transform = "";
        }
        if (this.right && t.identifier === this.right.id) this.right = null;
      }
    };
    touch.addEventListener("touchend", end, opts);
    touch.addEventListener("touchcancel", end, opts);
    this.camera.rotation.order = "YXZ";
  }
  activate() {
    this.active = true;
    if (!matchMedia("(pointer:coarse)").matches) {
      try {
        const result = this.canvas.requestPointerLock();
        result?.catch(() => {
          /* Drag to look remains available if pointer lock is denied. */
        });
      } catch {
        /* Drag fallback. */
      }
    }
  }
  deactivate() {
    this.active = false;
    this.clear();
    if (document.pointerLockElement === this.canvas) document.exitPointerLock();
  }
  private clear() {
    this.keys.clear();
    this.mouseDrag = false;
    this.left = null;
    this.right = null;
    this.touchMove = { x: 0, y: 0 };
    document.querySelector<HTMLElement>("#stick")!.style.transform = "";
  }
  update(dt: number) {
    this.previous = { ...this.position };
    this.previousStep = this.step;
    if (!this.active) return;
    const f =
      Number(this.keys.has("KeyW") || this.keys.has("ArrowUp")) -
      Number(this.keys.has("KeyS") || this.keys.has("ArrowDown")) +
      this.touchMove.y;
    const s =
      Number(this.keys.has("KeyD") || this.keys.has("ArrowRight")) -
      Number(this.keys.has("KeyA") || this.keys.has("ArrowLeft")) +
      this.touchMove.x;
    const next = walk(this.position, this.yaw, f, s, dt);
    this.step +=
      Math.hypot(next.x - this.position.x, next.z - this.position.z) * 5;
    Object.assign(this.position, next);
  }
  render(alpha: number, time: number, preview: boolean) {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const x = THREE.MathUtils.lerp(this.previous.x, this.position.x, alpha),
      z = THREE.MathUtils.lerp(this.previous.z, this.position.z, alpha),
      step = THREE.MathUtils.lerp(this.previousStep, this.step, alpha);
    this.camera.position.set(
      x,
      1.72 + (reduced ? 0 : Math.sin(step) * 0.018),
      z,
    );
    this.camera.rotation.set(
      this.pitch + (preview && !reduced ? Math.sin(time * 0.08) * 0.006 : 0),
      this.yaw + (preview && !reduced ? Math.sin(time * 0.04) * 0.025 : 0),
      reduced ? 0 : Math.sin(step * 0.5) * 0.0015,
    );
  }
  dispose() {
    this.deactivate();
    this.abort.abort();
  }
}
