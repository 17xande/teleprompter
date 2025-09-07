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
} from "./clock.ts";

import { Viewer } from "./viewer.ts";
import { SlButton, SlInput } from "@shoelace-style/shoelace/dist/shoelace.js";

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

type PopupDimensions = {
  width: number;
  height: number;
  x: number;
  y: number;
};

export class Teleprompter {
  btnPop: SlButton;
  btnMessage: SlButton;
  quill: Quill;
  prgSpeed: SlProgressBar;
  rngScale: SlRange;
  viewerWindow: Window | null = null;
  viewer: Viewer | null = null;
  viewerScrollY = 0;
  popDimensions: PopupDimensions;
  controls: HTMLDivElement;

  constructor() {
    registerClockComponent();
    registerClockControlComponent();
    this.btnPop = <SlButton> document.querySelector("#btnPop");
    this.btnMessage = <SlButton> document.querySelector("#btnMessage");
    this.prgSpeed = <SlProgressBar> document.querySelector("#prgSpeed");
    this.rngScale = <SlRange> document.querySelector("#rngScale");
    this.controls = <HTMLDivElement> document.querySelector("#controls");
    this.btnPop.addEventListener("click", this.listenPop.bind(this));
    this.btnMessage.addEventListener("click", this.listenMessage.bind(this));
    this.prgSpeed.addEventListener("wheel", this.listenWheel.bind(this), {
      passive: false,
    });
    this.rngScale.addEventListener("sl-input", this.listenRange.bind(this));
    this.popDimensions = {
      width: 200,
      height: 150,
      x: 100,
      y: 100,
    };

    this.quill = new Quill("#editor", options);
    this.quill.on("text-change", () => {
      const content = this.quill.getContents();
      localStorage.setItem("quill-content", JSON.stringify(content));
    });

    globalThis.addEventListener("keyup", this.listenKey.bind(this));

    const storedContent = localStorage.getItem("quill-content");
    if (storedContent) {
      this.quill.setContents(JSON.parse(storedContent));
    }
  }

  listenPop() {
    const win = globalThis.open(
      "/html/pop.html",
      "pop",
      `popup=true,width=${this.popDimensions.width},height=${this.popDimensions.height},screenX=${this.popDimensions.x},screenY=${this.popDimensions.y}`,
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

  listenKey(ke: KeyboardEvent) {
    if (this.quill.hasFocus()) return;

    switch (ke.code) {
      case "Space":
        ke.preventDefault();
        if (this.viewer?.scroll) {
          this.viewer?.stopSmoothScroll();
        } else {
          this.viewer?.startSmoothScroll();
        }
        break;
      default:
        // ignore for now
    }
  }

  listenRange() {
    if (!this.viewerWindow) return;
    this.viewerWindow.viewer.setTextScale(this.rngScale.value);
  }

  listenMessage() {
    // TODO: make this check in the constructor or something? Otherwise I have to keep checking this.
    if (!this.viewerWindow) return;
    const txtMessage = <SlInput> document.querySelector("#txtMessage");
    if (!txtMessage) {
      throw new Error("No Message input found.");
    }
    console.log(txtMessage.value);
    this.viewerWindow.viewer.setMessage(txtMessage.value);
  }

  updateMain() {
    if (!this.viewerWindow) return;
    const editor = <HTMLDivElement> document.querySelector(
      "#editor > .ql-editor",
    );
    if (!editor) {
      return console.error("editor not found!");
    }
    this.viewer = this.viewerWindow.viewer;
    this.viewer.setContent(editor.innerHTML);
  }
}
