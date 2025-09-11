import { ToolbarConfig } from "quill/modules/toolbar";
import Quill, { QuillOptions } from "quill";
import "@shoelace-style/shoelace/dist/components/drawer/drawer.js";
import "@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js";
import "@shoelace-style/shoelace/dist/components/range/range.js";
import "@shoelace-style/shoelace/dist/components/input/input.js";
import "@shoelace-style/shoelace/dist/components/button/button.js";
import "@shoelace-style/shoelace/dist/components/dropdown/dropdown.js";
import "@shoelace-style/shoelace/dist/components/menu/menu.js";
import "@shoelace-style/shoelace/dist/components/menu-item/menu-item.js";
import "@shoelace-style/shoelace/dist/components/divider/divider.js";
import "@shoelace-style/shoelace/dist/components/icon-button/icon-button.js";
import {
  registerClockComponent,
  registerClockControlComponent,
} from "./clock.ts";

import { Viewer } from "./viewer.ts";
import {
  SlButton,
  SlDialog,
  SlDropdown,
  SlIconButton,
  SlInput,
  SlMenu,
  SlMenuItem,
  SlProgressBar,
  SlRange,
  SlSelectEvent,
} from "@shoelace-style/shoelace/dist/shoelace.js";

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

interface DynamicObject {
  [key: string]: string;
}

export class Teleprompter {
  btnPop: SlButton;
  btnMessage: SlButton;
  quill: Quill;
  prgSpeed: SlProgressBar;
  rngSpeed: SlRange;
  rngScale: SlRange;
  drpDocuments: SlDropdown;
  mnuDocuments: SlMenu;
  saveDialog: SlDialog;
  viewerWindow: Window | null = null;
  viewer: Viewer | null = null;
  viewerScrollY = 0;
  popDimensions: PopupDimensions;
  controls: HTMLDivElement;
  currentDocument: string;
  documents: DynamicObject;
  editingName: string;

  constructor() {
    registerClockComponent();
    registerClockControlComponent();
    this.btnPop = <SlButton> document.querySelector("#btnPop");
    this.btnMessage = <SlButton> document.querySelector("#btnMessage");
    this.prgSpeed = <SlProgressBar> document.querySelector("#prgSpeed");
    this.rngSpeed = <SlRange> document.querySelector("#rngSpeed");
    this.rngScale = <SlRange> document.querySelector("#rngScale");
    this.controls = <HTMLDivElement> document.querySelector("#controls");
    this.drpDocuments = <SlDropdown> document.querySelector("#drpDocuments");
    this.mnuDocuments = <SlMenu> document.querySelector("#mnuDocuments");
    this.saveDialog = <SlDialog> document.querySelector("#dlgRename");
    this.btnPop.addEventListener("click", this.listenPop.bind(this));
    this.btnMessage.addEventListener("click", this.listenMessage.bind(this));
    this.prgSpeed.addEventListener("wheel", this.listenWheel.bind(this), {
      passive: false,
    });
    this.rngScale.addEventListener("sl-input", this.listenRange.bind(this));
    this.editingName = "";
    this.popDimensions = {
      width: 200,
      height: 150,
      x: 100,
      y: 100,
    };
    this.drpDocuments.addEventListener(
      "sl-select",
      this.listenDropSelect.bind(this),
    );
    this.drpDocuments.addEventListener(
      "click",
      this.listenDropClick.bind(this),
    );

    const btnSave = <SlButton> this.saveDialog.querySelector(
      "sl-button[name=save]",
    );
    const btnCancel = <SlButton> this.saveDialog.querySelector(
      "sl-button[name=cancel]",
    );
    btnCancel.addEventListener("click", () => this.saveDialog.hide());
    btnSave.addEventListener("click", () => {
      const input = <SlInput> this.saveDialog.querySelector("sl-input");
      const hidden = <HTMLInputElement> this.saveDialog.querySelector(
        "input",
      );
      this.nameSave(hidden.value, input.value);
      this.saveDialog.hide();
    });
    this.quill = new Quill("#editor", options);
    this.quill.on("text-change", () => {
      this.saveDB();
    });

    this.currentDocument = localStorage.getItem("currentDocument") ||
      "document";
    this.documents = {};
    const docs = localStorage.getItem("documents");
    if (docs) {
      this.documents = <DynamicObject> JSON.parse(docs);
      for (const name of Object.keys(this.documents)) {
        this.addMenuItem(name);
      }
    }

    if (this.currentDocument && this.documents[this.currentDocument]) {
      const strDoc = this.documents[this.currentDocument];
      const parsedDoc = JSON.parse(strDoc);
      if (parsedDoc) {
        this.quill.setContents(parsedDoc);
      }
    }
    globalThis.addEventListener("keyup", this.listenKey.bind(this));
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

  listenDropClick(e: PointerEvent) {
    if (!(e.target instanceof SlMenuItem)) {
      const icon = <SlIconButton> e.target;
      const menuItem = <SlMenuItem> icon.closest("sl-menu-item");
      switch (icon.name) {
        case "pencil":
          this.nameEdit(menuItem);
          break;
        case "trash":
          this.nameDelete(menuItem.value);
          menuItem.remove();
          break;
          // case "check":
          //   this.nameSave(menuItem);
          //   break;
          // case "x":
          //   this.nameEditCancel(menuItem);
          //   break;
      }
      return;
    }
    if (e.target.parentElement?.contentEditable) return;
    this.drpDocuments.hide();
  }

  nameEdit(mi: SlMenuItem) {
    // make a popup
    this.saveDialog.show();
    const input = <SlInput> this.saveDialog.querySelector("sl-input");
    const hidden = <HTMLInputElement> this.saveDialog.querySelector("input");
    hidden.value = mi.value;
    input.value = mi.value;
    input.select();
  }

  nameSave(previousName: string, newName: string) {
    const doc = this.documents[previousName];
    this.nameDelete(previousName);
    this.documents[newName] = doc;
    if (this.currentDocument === previousName) {
      this.currentDocument = newName;
    }
    const items = Array.from(
      this.drpDocuments.querySelectorAll("sl-menu-item"),
    );
    const mi = items.find((e) => e.value === previousName);
    if (!mi) {
      throw new Error("menu item does not exist");
    }
    mi.remove();
    this.addMenuItem(newName);
    this.saveDB();
  }

  saveDB() {
    const content = this.quill.getContents();
    this.documents[this.currentDocument] = JSON.stringify(content);
    localStorage.setItem("currentDocument", this.currentDocument);
    localStorage.setItem("documents", JSON.stringify(this.documents));
  }

  nameDelete(docName: string) {
    const doc = this.documents[docName];
    if (!doc) {
      throw new Error(`Document ${docName} doesn't exist`);
    }
    delete (this.documents[docName]);
  }

  listenDropSelect(e: SlSelectEvent) {
    console.log(e);
  }

  addMenuItem(docName: string) {
    const mnuItem = new SlMenuItem();

    mnuItem.innerHTML = `${docName}
      <sl-icon-button slot="suffix" name="pencil" label="Edit"></sl-icon-button>
      <sl-icon-button slot="suffix" name="trash" label="Delete"></sl-icon-button>
    `;
    const m = <SlMenuItem> mnuItem.cloneNode(true);
    m.value = docName;
    this.mnuDocuments.appendChild(m);
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
