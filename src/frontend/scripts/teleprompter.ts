import { ToolbarConfig } from "quill/modules/toolbar";
import Quill, { QuillOptions } from "quill";
import SlRange from "@shoelace-style/shoelace/dist/components/range/range.js";
import SlProgressBar from "@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js";
import {
  registerClockComponent,
  registerClockControlComponent,
  TPClock,
  TPClockControl,
} from "./clock.ts";

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
  viewerWindow: Window | null;

  constructor() {
    this.viewerWindow = null;
    registerClockComponent();
    registerClockControlComponent();
    this.btnPop = <HTMLButtonElement> document.querySelector("#btnPop");
    this.prgSpeed = <SlProgressBar> document.querySelector("#prgSpeed");
    this.rngScale = <SlRange> document.querySelector("#rngScale");
    this.btnPop.onclick = this.listenPop;
    this.prgSpeed.addEventListener("wheel", this.listenWheel, {
      passive: false,
    });
    this.rngScale.addEventListener("sl-input", this.listenRange);

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
    const win = globalThis.open(
      "pop.html",
      "pop",
      "popup=true,width=300,height=320",
    );
    if (!win) {
      throw new Error("can't open window");
    }

    this.viewerWindow = win;
    win.addEventListener("load", () => {
      this.updateMain();

      const tpPopClock = <TPClock> win.document.querySelector(
        "#timeTimer",
      );
      const tpClockControl = <TPClockControl> document.querySelector(
        "#countdowncontrol",
      );
      if (!tpPopClock) {
        throw new Error("tp-clock not found on popup");
      }

      if (!tpClockControl) {
        throw new Error("tp-clock-control not found on main");
      }

      tpClockControl.popCountdown = tpPopClock;

      win.viewer.startSmoothScroll();
    });
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

    // TODO: don't use postMessage, declare the method on the window, and call it directly.

    console.log(`posting message son`);
    const msg: messageWindow = {
      method: "scrollSpeed",
      args: [speed],
    };
    this.viewerWindow.postMessage(msg);
  }

  listenRange() {
    const msg: messageWindow = {
      method: "textScale",
      args: [this.rngScale.value],
    };

    console.log(msg);

    // TODO: don't use postMessage, declare the method on the window, and call it directly.
    if (!this.viewerWindow) return;
    this.viewerWindow.postMessage(msg);
  }

  updateMain() {
    const editor = <HTMLDivElement> document.querySelector(
      "#editor > .ql-editor",
    );
    if (!editor) {
      return console.error("editor not found!");
    }

    const popMain = <HTMLDivElement> this.viewerWindow.document.querySelector(
      "#main",
    );
    popMain.innerHTML = editor.innerHTML;
  }
}
