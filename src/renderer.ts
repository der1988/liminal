import type { ParticleSystem } from "./simulation/particles";
import type { Input } from "./input";
export class Renderer {
  private context: CanvasRenderingContext2D;
  private dpr = 1;
  constructor(private canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Canvas 2D non disponibile");
    this.context = context;
    this.resize();
  }
  resize() {
    this.dpr = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(innerWidth * this.dpr);
    this.canvas.height = Math.round(innerHeight * this.dpr);
    this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }
  draw(system: ParticleSystem, input: Input, alpha: number) {
    const c = this.context;
    c.fillStyle = "#070707";
    c.fillRect(0, 0, system.width, system.height);
    const positions = new Map(
      system.particles.map((p) => [
        p.id,
        {
          x: p.previousX + (p.x - p.previousX) * alpha,
          y: p.previousY + (p.y - p.previousY) * alpha,
        },
      ]),
    );
    c.lineWidth = 0.7;
    c.strokeStyle = "#ffffff59";
    c.beginPath();
    for (const edge of system.links) {
      const a = positions.get(edge.a),
        b = positions.get(edge.b);
      if (!a || !b) continue;
      c.moveTo(a.x, a.y);
      c.lineTo(b.x, b.y);
    }
    c.stroke();
    if (input.tool === "erase" && input.pointer.active) {
      const index = system.nearestLink(input.pointer.x, input.pointer.y, input.edgeRadius);
      if (index >= 0) {
        const e = system.links[index],
          a = positions.get(e.a)!,
          b = positions.get(e.b)!;
        c.strokeStyle = "#ffffff";
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(a.x, a.y);
        c.lineTo(b.x, b.y);
        c.stroke();
      }
    }
    for (const p of system.particles) {
      const point = positions.get(p.id)!;
      c.fillStyle = `rgba(255,255,255,${p.brightness})`;
      c.fillRect(
        Math.round(point.x - p.size / 2),
        Math.round(point.y - p.size / 2),
        p.size,
        p.size,
      );
    }
    const selected =
      system.selected !== null ? positions.get(system.selected) : undefined;
    if (selected) {
      if (input.pointer.active) {
        c.setLineDash([3, 6]);
        c.lineWidth = 0.7;
        c.strokeStyle = "#ffffff50";
        c.beginPath();
        c.moveTo(selected.x, selected.y);
        c.lineTo(input.pointer.x, input.pointer.y);
        c.stroke();
        c.setLineDash([]);
      }
      this.mark(selected.x, selected.y, 8, "#ededed");
    }
    if (input.hover !== null && input.hover !== system.selected) {
      const p = positions.get(input.hover);
      if (p) this.mark(p.x, p.y, 7, "#ffffff70");
    }
  }
  private mark(x: number, y: number, r: number, color: string) {
    const c = this.context;
    x = Math.round(x) + 0.5;
    y = Math.round(y) + 0.5;
    c.lineWidth = 1;
    c.strokeStyle = color;
    c.beginPath();
    for (const sx of [-1, 1])
      for (const sy of [-1, 1]) {
        c.moveTo(x + sx * (r - 3), y + sy * r);
        c.lineTo(x + sx * r, y + sy * r);
        c.lineTo(x + sx * r, y + sy * (r - 3));
      }
    c.stroke();
  }
}
