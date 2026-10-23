import type { ParticleSystem } from "./simulation/particles";
export type Tool = "connect" | "move" | "add" | "erase";
export class Input {
  tool: Tool = "connect";
  edgeRadius = 8;
  private radius = 14;
  hover: number | null = null;
  pointer = { x: 0, y: 0, active: false };
  private pointerId: number | null = null;
  private selectionAtDown: number | null = null;
  private controller = new AbortController();
  constructor(
    private canvas: HTMLCanvasElement,
    private system: ParticleSystem,
    private notify: () => void,
  ) {
    const opts = { signal: this.controller.signal };
    const position = (e: PointerEvent) => {
      this.radius = e.pointerType === "touch" ? 25 : 14;
      this.edgeRadius = e.pointerType === "touch" ? 18 : 8;
      const r = canvas.getBoundingClientRect();
      this.pointer = {
        x: e.clientX - r.left,
        y: e.clientY - r.top,
        active: true,
      };
      return this.pointer;
    };
    const hit = (e: PointerEvent) =>
      system.nearest(
        this.pointer.x,
        this.pointer.y,
        e.pointerType === "touch" ? 25 : 14,
      );
    canvas.addEventListener(
      "pointerdown",
      (e) => {
        if (e.button !== 0 || this.pointerId !== null) return;
        position(e);
        this.pointerId = e.pointerId;
        this.selectionAtDown = system.selected;
        canvas.setPointerCapture(e.pointerId);
        const p = hit(e);
        if (this.tool === "connect" && system.selected === null && p)
          system.selected = p.id;
        if (this.tool === "move" && p) system.held = p.id;
        if (this.tool === "add") {
          system.add(this.pointer.x, this.pointer.y);
        }
        this.notify();
      },
      opts,
    );
    canvas.addEventListener(
      "pointermove",
      (e) => {
        position(e);
        this.hover = hit(e)?.id ?? null;
        if (
          this.pointerId === e.pointerId &&
          this.tool === "move" &&
          system.held !== null
        )
          system.move(system.held, this.pointer.x, this.pointer.y);
        this.cursor();
      },
      opts,
    );
    canvas.addEventListener(
      "pointerup",
      (e) => {
        if (e.pointerId !== this.pointerId) return;
        position(e);
        const p = hit(e);
        if (
          this.tool === "connect" &&
          system.selected !== null &&
          p &&
          p.id !== system.selected
        ) {
          system.connect(system.selected, p.id);
          system.selected = null;
        }
        if (
          this.tool === "connect" &&
          p &&
          p.id === system.selected &&
          this.selectionAtDown === system.selected
        )
          system.selected = null;
        if (this.tool === "erase") {
          const index = system.nearestLink(
            this.pointer.x,
            this.pointer.y,
            e.pointerType === "touch" ? 18 : 8,
          );
          if (index >= 0) {
            system.removeLink(index);
          }
        }
        system.held = null;
        this.pointerId = null;
        if (e.pointerType !== "mouse") {
          this.pointer.active = false;
          this.hover = null;
        }
        this.notify();
      },
      opts,
    );
    canvas.addEventListener("pointercancel", () => this.cancel(), opts);
    canvas.addEventListener(
      "lostpointercapture",
      () => {
        if (this.pointerId !== null) this.cancel();
      },
      opts,
    );
    canvas.addEventListener(
      "pointerleave",
      () => {
        if (this.pointerId === null) {
          this.pointer.active = false;
          this.hover = null;
        }
      },
      opts,
    );
    window.addEventListener("blur", () => this.cancel(), opts);
  }
  refreshHover() {
    this.hover = this.pointer.active
      ? (this.system.nearest(this.pointer.x, this.pointer.y, this.radius)?.id ??
        null)
      : null;
  }
  setTool(tool: Tool) {
    this.cancel();
    this.tool = tool;
    this.cursor();
    this.notify();
  }
  cancel() {
    this.pointerId = null;
    this.system.held = null;
    this.system.selected = null;
    this.hover = null;
    this.notify();
  }
  private cursor() {
    this.canvas.style.cursor =
      this.tool === "add"
        ? "crosshair"
        : this.tool === "move"
          ? this.system.held !== null
            ? "grabbing"
            : this.hover !== null
              ? "grab"
              : "default"
          : this.tool === "erase"
            ? "crosshair"
            : this.hover !== null
              ? "pointer"
              : "default";
  }
  dispose() {
    this.controller.abort();
  }
}
