export class Camera {
  x = 800;
  y = 500;
  zoom = 1;
  target: { x: number; y: number } | null = null;
  follow: string | null = null;
  constructor(
    public width: number,
    public height: number,
  ) {
    this.zoom =
      (width < 600
        ? Math.max(width / 1600, height / 1000)
        : Math.min(width / 1600, height / 1000)) * 0.92;
  }
  screen(x: number, y: number) {
    return {
      x: (x - this.x) * this.zoom + this.width / 2,
      y: (y - this.y) * this.zoom + this.height / 2,
    };
  }
  world(x: number, y: number) {
    return {
      x: (x - this.width / 2) / this.zoom + this.x,
      y: (y - this.height / 2) / this.zoom + this.y,
    };
  }
  pan(dx: number, dy: number) {
    this.x -= dx / this.zoom;
    this.y -= dy / this.zoom;
    this.follow = null;
    this.target = null;
  }
  zoomAt(factor: number, x: number, y: number) {
    const before = this.world(x, y);
    this.zoom = Math.min(4, Math.max(0.2, this.zoom * factor));
    const after = this.world(x, y);
    this.x += before.x - after.x;
    this.y += before.y - after.y;
  }
  update(dt: number) {
    if (this.target) {
      const f = 1 - Math.exp(-dt * 2.2);
      this.x += (this.target.x - this.x) * f;
      this.y += (this.target.y - this.y) * f;
    }
  }
}
