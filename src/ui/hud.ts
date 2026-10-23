import type { World } from "../model/world";
import { ageOf, stageOf } from "../model/types";
import { type Speed, type Clock } from "../model/clock";
import type { Camera } from "../view/camera";
import { renderPerson } from "./person";
export class Hud {
  private key = "";
  private pendingKey = "";
  private archiveKey = "";
  private noticeTimer = 0;
  private abort = new AbortController();
  private $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
    document.querySelector<T>(selector)!;
  constructor(
    private world: World,
    private clock: Clock,
    private camera: Camera,
    private navigate: (id: string | null) => void,
    private getSelected: () => string | null,
    private save: () => void,
  ) {
    const $ = this.$,
      dialog = $<HTMLDialogElement>("#birth-dialog");
    $("#birth").onclick = () => {
      dialog.showModal();
      $<HTMLInputElement>("#birth-name").focus();
    };
    $("#cancel-name").onclick = () => dialog.close();
    $("#birth-form").onsubmit = (e) => {
      e.preventDefault();
      const field = $<HTMLInputElement>("#birth-name");
      if (world.requestBirth(field.value)) {
        field.value = "";
        dialog.close();
        this.refresh();
        this.save();
      } else
        this.notice(
          "Il nome è vuoto oppure ci sono già sei richieste in attesa.",
        );
    };
    $("#close").onclick = () => this.navigate(null);
    $("#follow").onclick = () => {
      const id = getSelected();
      camera.follow = camera.follow === id ? null : id;
      this.refresh();
    };
    const zoom = $<HTMLInputElement>("#zoom");
    zoom.oninput = () => {
      camera.zoomAt(
        Number(zoom.value) / camera.zoom,
        camera.width / 2,
        camera.height / 2,
      );
      this.refreshZoom();
    };
    zoom.onchange = () => this.save();
    document.querySelectorAll<HTMLButtonElement>("[data-speed]").forEach(
      (b) =>
        (b.onclick = () => {
          clock.speed = Number(b.dataset.speed) as Speed;
          this.refresh();
          this.save();
        }),
    );
    $("#search").onclick = () => {
      const panel = $("#archive");
      panel.hidden = !panel.hidden;
      $("#search").setAttribute("aria-expanded", String(!panel.hidden));
      if (!panel.hidden) {
        $<HTMLInputElement>("#query").focus();
        this.refreshArchive();
      }
    };
    $("#close-search").onclick = () => {
      $("#archive").hidden = true;
      $("#search").setAttribute("aria-expanded", "false");
    };
    $<HTMLInputElement>("#query").oninput = () => this.refreshArchive(true);
    window.addEventListener(
      "keydown",
      (e) => {
        if (e.target instanceof HTMLInputElement) return;
        if (e.key === "Escape") {
          this.navigate(null);
          $("#archive").hidden = true;
        }
        if (e.code === "Space" && !(e.target instanceof HTMLButtonElement)) {
          e.preventDefault();
          clock.speed = clock.speed === 0 ? 1 : 0;
          this.refresh();
          this.save();
        }
      },
      { signal: this.abort.signal },
    );
  }
  private refreshZoom() {
    const value = this.camera.zoom;
    const text = value.toLocaleString("it-IT", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }) + "×";
    const slider = this.$<HTMLInputElement>("#zoom");
    slider.value = String(value);
    slider.setAttribute("aria-valuetext", text);
    this.$("#zoom-value").textContent = text;
  }
  notice(text: string, persistent = false) {
    const output = this.$("#notice");
    output.textContent = text;
    clearTimeout(this.noticeTimer);
    if (!persistent)
      this.noticeTimer = window.setTimeout(() => {
        output.textContent = "";
      }, 6000);
  }
  refresh() {
    this.refreshZoom();
    const $ = this.$,
      id = this.getSelected(),
      s = id ? this.world.souls.get(id) : null;
    $("#year").textContent = "anno " + Math.floor(this.world.year);
    document
      .querySelectorAll<HTMLButtonElement>("[data-speed]")
      .forEach((b) =>
        b.setAttribute(
          "aria-pressed",
          String(Number(b.dataset.speed) === this.clock.speed),
        ),
      );
    $("#person").hidden = !s;
    if (s) {
      $("#name").textContent = s.name;
      $("#named-badge").hidden = !s.named;
      $("#age").textContent =
        s.deathYear === null
          ? Math.floor(ageOf(s, this.world.year)) +
            " anni · " +
            stageOf(ageOf(s, this.world.year))
          : "Scomparsa a " +
            Math.floor(ageOf(s, this.world.year)) +
            " anni · " +
            s.birthYear.toFixed(1) +
            " — " +
            s.deathYear.toFixed(1);
      $("#follow").hidden = s.deathYear !== null;
      if (s.deathYear !== null && this.camera.follow === s.id)
        this.camera.follow = null;
      $("#follow").textContent =
        this.camera.follow === s.id ? "Smetti di seguire" : "Segui";
      $("#follow").setAttribute(
        "aria-pressed",
        String(this.camera.follow === s.id),
      );
      const key =
        s.id + "|" + this.world.nextEvent + "|" + Math.floor(this.world.year);
      if (this.key !== key) {
        renderPerson($("#person-body"), this.world, s, (id) =>
          this.navigate(id),
        );
        this.key = key;
      }
    } else this.key = "";
    const pendingKey =
      this.world.pending.map((r) => r.id).join("|") + "|" + this.clock.speed;
    if (pendingKey !== this.pendingKey) {
      this.pendingKey = pendingKey;
      $("#pending").replaceChildren(
        ...this.world.pending.map((r) => {
          const row = document.createElement("div"),
            text = document.createElement("span"),
            cancel = document.createElement("button");
          text.textContent =
            r.name +
            " · in attesa " +
            (this.clock.speed === 0
              ? "(tempo in pausa)"
              : "di due genitori idonei");
          cancel.textContent = "×";
          cancel.setAttribute("aria-label", "Annulla richiesta per " + r.name);
          cancel.onclick = () => {
            this.world.cancelBirth(r.id);
            this.refresh();
            this.save();
          };
          row.append(text, cancel);
          return row;
        }),
      );
    }
    if (!$("#archive").hidden) this.refreshArchive();
  }
  private refreshArchive(force = false) {
    const $ = this.$,
      q = $<HTMLInputElement>("#query").value.toLocaleLowerCase("it").trim(),
      key = q + "|" + this.world.nextSoul + "|" + this.world.nextEvent;
    if (!force && key === this.archiveKey) return;
    this.archiveKey = key;
    const found = [...this.world.souls.values()]
      .filter((s) => s.named && s.name.toLocaleLowerCase("it").includes(q))
      .sort((a, b) => b.birthYear - a.birthYear);
    const list = $("#results");
    list.replaceChildren();
    if (!found.length) {
      const p = document.createElement("p");
      p.className = "muted";
      p.textContent = q
        ? "Nessun nome corrispondente."
        : "I nomi affidati compariranno qui, anche dopo la scomparsa.";
      list.append(p);
    }
    for (const s of found) {
      const row = document.createElement("button");
      row.className = "search-result";
      const name = document.createElement("span"),
        date = document.createElement("small");
      name.textContent = s.name;
      date.textContent =
        s.deathYear === null
          ? Math.floor(ageOf(s, this.world.year)) + " anni"
          : s.birthYear.toFixed(1) + " — " + s.deathYear.toFixed(1);
      row.append(name, date);
      row.onclick = () => {
        this.navigate(s.id);
        $("#archive").hidden = true;
      };
      list.append(row);
    }
  }
  dispose() {
    clearTimeout(this.noticeTimer);
    this.abort.abort();
  }
}
