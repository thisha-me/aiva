/**
 * Aiva - VS Code Theme Extension
 * Copyright (c) 2025 thisha-me
 * Licensed under the MIT License
 * https://github.com/thisha-me/aiva
 */

// Declare VS Code API
declare function acquireVsCodeApi(): {
  getState: () => Record<string, unknown>;
  setState: (state: Record<string, unknown>) => void;
  postMessage: (message: unknown) => void;
};

interface Poses {
  [key: string]: string;
}

const poses: Poses = {
  default: "circle half-up circle",
  happy: "half-down half-up half-down",
  disappointed: "half-up bar-bottom half-up",
  shocked: "circle-stroke bar circle-stroke",
  grumpy: "bar-top half-down bar-top",
  sad: "circle half-down-bottom circle",
  cry: "half-down square half-down",
  wink: "circle half-up bar",
};

const eyes: string[] = [
  "circle",
  "half-down",
  "circle-small",
  "circle-small",
  "square",
  "circle-stroke",
];

const mouths: string[] = [
  "circle-small",
  "square",
  "square-small",
  "bar",
  "circle-small",
  "square-small",
];

const randBetween = (from: number, to: number): number => from + Math.floor(Math.random() * to);
const lerp = (start: number, end: number, amt: number): number => (1 - amt) * start + amt * end;

class HeyAiva extends HTMLElement {
  private _rect!: DOMRect;
  private _handle?: ReturnType<typeof setTimeout>;

  constructor() {
    super();
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onResize();
  }

  connectedCallback(): void {
    window.addEventListener("resize", this.onResize);
    window.addEventListener("pointermove", this.onPointerMove);
  }

  disconnectedCallback(): void {
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("pointermove", this.onPointerMove);
  }

  onPointerMove(event: PointerEvent): void {
    const x = (event.clientX - this._rect.x) / this._rect.width - 0.5;
    const y = (event.clientY - this._rect.y) / this._rect.height - 0.5;
    const deltaX = 0 - x;
    const deltaY = 0 - y;
    const rad = Math.atan2(deltaY, deltaX);
    let deg = rad * (180 / Math.PI);
    deg = deg < 0 ? Math.abs(deg) : deg;

    this.style.setProperty("--x", `${x.toPrecision(2)}`);
    this.style.setProperty("--y", `${y.toPrecision(2)}`);
    this.style.setProperty("--deg", `${lerp(0, -35, Math.abs(deg / 180))}deg`);
  }

  onResize(): void {
    this._rect = document.documentElement.getBoundingClientRect();
  }

  static get observedAttributes(): string[] {
    return ["shapes", "pose"];
  }

  get eye0(): HTMLElement | null {
    return this.querySelector(".eye:first-child");
  }

  get mouth(): HTMLElement | null {
    return this.querySelector(".mouth");
  }

  get eye1(): HTMLElement | null {
    return this.querySelector(".eye:last-child");
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string): void {
    if (name === "shapes") {
      this.updateShapes(newValue);
    }
    if (name === "pose") {
      const shapes = poses[newValue] ?? poses.default;
      this.updateShapes(shapes);
    }
  }

  reset(): void {
    if (this._handle) {
      clearTimeout(this._handle);
    }
    this.updateShapes(poses[this.getAttribute("pose") ?? "default"]);
  }

  updateShapes(value: string): void {
    const [eye0, mouth, eye1] = value.split(" ");
    if (this.eye0) this.eye0.dataset.shape = eye0;
    if (this.mouth) this.mouth.dataset.shape = mouth;
    if (this.eye1) this.eye1.dataset.shape = eye1;
  }

  emote(name: string): void {
    const shapes = poses[name] ?? poses.default;
    this.updateShapes(shapes);
    this._handle = setTimeout(() => {
      this.reset();
    }, randBetween(1000, 1750));
  }

  talk(): { stop: () => void } {
    const shapes = poses.default;
    this.updateShapes(shapes);

    let i = 0;
    let pace = randBetween(3, 5);
    const loop = (): void => {
      i++;
      if (i === pace) {
        const eye = eyes[randBetween(0, eyes.length - 1)];
        if (this.eye0) this.eye0.dataset.shape = eye;
        if (this.eye1) this.eye1.dataset.shape = eye;
        pace = randBetween(3, 5);
        i = 0;
      }
      if (this.mouth) this.mouth.dataset.shape = mouths[randBetween(0, mouths.length - 1)];
      this._handle = setTimeout(() => loop(), randBetween(100, 300));
    };

    loop();

    return {
      stop: () => this.reset(),
    };
  }

  think(): { stop: () => void } {
    this.classList.add("loading");
    return {
      stop: () => {
        this.classList.remove("loading");
      },
    };
  }
}

customElements.define("hey-aiva", HeyAiva);

const aiva = document.querySelector('hey-aiva') as HeyAiva | null;
const vscode = acquireVsCodeApi();

const _oldState = vscode.getState() || { colors: [] };

window.addEventListener("message", (event: MessageEvent) => {
  const message = event.data;
  switch (message.type) {
    case "pose": {
      aiva?.setAttribute('pose', message.pose);
      break;
    }
    case "theme": {
      if (aiva) {
        // Remove existing theme classes and add new one
        aiva.classList.remove('theme-mint', 'theme-neon');
        if (message.theme === 'mint') {
          aiva.classList.add('theme-mint');
        }
        // 'neon' is the default, no class needed
      }
      break;
    }
  }
});
