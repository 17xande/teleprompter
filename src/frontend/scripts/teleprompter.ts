import { ToolbarConfig } from "quill/modules/toolbar";
import Quill, { QuillOptions } from "quill";
import SlRange from "@shoelace-style/shoelace/dist/components/range/range.js";
import "@shoelace-style/shoelace/dist/components/drawer/drawer.js";
import "@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js";
import "@shoelace-style/shoelace/dist/components/range/range.js";
import "@shoelace-style/shoelace/dist/components/input/input.js";
import "@shoelace-style/shoelace/dist/components/button/button.js";
import SlProgressBar from "@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js";
import {
  registerClockComponent,
  registerClockControlComponent,
  TPClock,
  TPClockControl,
} from "./clock.ts";

import { Viewer } from "./viewer.ts";

const toolbarOptions: ToolbarConfig = [
  ["bold", "italic", "underline", "strike"], // toggled buttons
  ["blockquote", "code-block"],
  ["link", "image", "video", "formula"],

  [{ "header": 1 }, { "header": 2 }], // custom button values
  [{ "list": "ordered" }, { "list": "bullet" }, { "list": "check" }],
  [{ "script": "sub" }, { "script": "super" }], // superscript/subscript
  [{ "indent": "-1" }, { "indent": "+1" }], // outdent/indent
  [{ "direction": "rtl" }], // text direction

  [{ "size": ["small", false, "large", "huge"] }], // custom dropdown
  [{ "header": [1, 2, 3, 4, 5, 6, false] }],

  [{ "color": [] }, { "background": [] }], // dropdown with defaults from theme
  [{ "font": [] }],
  [{ "align": [] }],

  ["clean"], // remove formatting button
];

const options: QuillOptions = {
  placeholder: "Bonjour, Le Telepromteur",
  theme: "snow",
  modules: {
    toolbar: toolbarOptions,
  },
};

export class Teleprompter {
  btnPop: HTMLButtonElement;
  quill: Quill;
  prgSpeed: SlProgressBar;
  rngScale: SlRange;
  viewerWindow: Window | null = null;
  viewer: Viewer | null = null;

  constructor() {
    registerClockComponent();
    registerClockControlComponent();
    this.btnPop = <HTMLButtonElement> document.querySelector("#btnPop");
    this.prgSpeed = <SlProgressBar> document.querySelector("#prgSpeed");
    this.rngScale = <SlRange> document.querySelector("#rngScale");
    this.btnPop.addEventListener("click", this.listenPop.bind(this));
    this.prgSpeed.addEventListener("wheel", this.listenWheel.bind(this), {
      passive: false,
    });
    this.rngScale.addEventListener("sl-input", this.listenRange.bind(this));

    this.quill = new Quill("#editor", options);
    this.quill.on("text-change", () => {
      const content = this.quill.getContents();
      localStorage.setItem("quill-content", JSON.stringify(content));
    });

    const storedContent = localStorage.getItem("quill-content");
    if (storedContent) {
      this.quill.setContents(JSON.parse(storedContent));
    }
  }

  listenPop() {
    const v = this.viewer;
    const width = v?.width || 500;
    const height = v?.height || 600;
    const x = v?.x || 100;
    const y = v?.y || 100;
    const win = globalThis.open(
      "pop.html",
      "pop",
      `popup=true,width=${width},height=${height},screenX=${x},screenY=${y}`,
    );
    if (!win) {
      throw new Error("can't open window");
    }

    this.viewerWindow = win;
  }

  listenWheel(e: WheelEvent) {
    // const r = root.style.getPropertyValue("--rotation")
    // let rot = 0
    // if (r) rot = parseInt(r, 10)
    // root.style.setProperty("--rotation", `${rot + e.deltaY}deg`)

    e.preventDefault();

    const speed = this.prgSpeed.value * 10 - 500;
    let percent = this.prgSpeed.value + e.deltaY / 10;

    if (e.deltaY > 0) {
      percent = Math.min(100, percent);
    } else {
      percent = Math.max(0, percent);
    }

    this.prgSpeed.value = percent;
    this.prgSpeed.textContent = speed.toFixed(0) + "pps";

    if (!this.viewerWindow) return;

    this.viewerWindow.viewer.setSpeed(speed);
  }

  listenRange() {
    if (!this.viewerWindow) return;
    this.viewerWindow.viewer.setTextScale(this.rngScale.value);
  }

  updateMain() {
    if (!this.viewerWindow) return;
    const editor = <HTMLDivElement> document.querySelector(
      "#editor > .ql-editor",
    );
    if (!editor) {
      return console.error("editor not found!");
    }
    this.viewerWindow.viewer.setContent(editor.innerHTML);
  }
}
