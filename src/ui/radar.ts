import { TRAIT_NAMES, type Traits } from "../model/types";
const ns = "http://www.w3.org/2000/svg";
export function radar(traits: Traits) {
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 260 230");
  svg.setAttribute("class", "radar");
  svg.setAttribute("role", "img");
  svg.setAttribute(
    "aria-label",
    traits.map((v, i) => TRAIT_NAMES[i] + ": " + Math.round(v)).join(", "),
  );
  const point = (i: number, r: number) => [
    130 + Math.cos(-Math.PI / 2 + (i * Math.PI) / 3) * r,
    113 + Math.sin(-Math.PI / 2 + (i * Math.PI) / 3) * r,
  ];
  const polygon = (r: number) =>
    Array.from({ length: 6 }, (_, i) => point(i, r).join(",")).join(" ");
  for (const radius of [19, 38, 57, 76]) {
    const ring = document.createElementNS(ns, "polygon");
    ring.setAttribute("points", polygon(radius));
    ring.setAttribute("fill", "none");
    ring.setAttribute("stroke", "#353535");
    ring.setAttribute("stroke-width", ".5");
    svg.append(ring);
  }
  for (let i = 0; i < 6; i++) {
    const p = point(i, 76),
      line = document.createElementNS(ns, "line");
    line.setAttribute("x1", "130");
    line.setAttribute("y1", "113");
    line.setAttribute("x2", String(p[0]));
    line.setAttribute("y2", String(p[1]));
    line.setAttribute("stroke", "#353535");
    line.setAttribute("stroke-width", ".5");
    svg.append(line);
    const label = document.createElementNS(ns, "text"),
      lp = point(i, 96);
    label.setAttribute("x", String(lp[0]));
    label.setAttribute("y", String(lp[1] + 3));
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("fill", "#888");
    label.setAttribute("font-size", "8");
    label.textContent = ["INT", "FAS", "SEN", "APE", "STA", "AUT"][i];
    svg.append(label);
  }
  const shape = document.createElementNS(ns, "polygon");
  shape.setAttribute(
    "points",
    traits.map((v, i) => point(i, (v / 100) * 76).join(",")).join(" "),
  );
  shape.setAttribute("fill", "#dddddd0d");
  shape.setAttribute("stroke", "#bbb");
  shape.setAttribute("stroke-width", ".8");
  svg.append(shape);
  return svg;
}
