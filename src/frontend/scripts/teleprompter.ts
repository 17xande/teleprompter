import { ToolbarConfig } from "quill/modules/toolbar";
import Quill, { QuillOptions } from "quill";
import "@shoelace-style/shoelace/dist/components/drawer/drawer.js";
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
  btnNew: SlButton;
  btnPop: SlButton;
  btnMessage: SlButton;
  quill: Quill;
  rngSpeed: SlRange;
  rngScale: SlRange;
  drpDocuments: SlDropdown;
  mnuDocuments: SlMenu;
  dlgSave: SlDialog;
  dlgDelete: SlDialog;
  viewerWindow: Window | null = null;
  viewer: Viewer | null = null;
  previewer: Viewer | null = null;
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
    this.btnNew = <SlButton> document.querySelector("#btnNew");
    this.rngSpeed = <SlRange> document.querySelector("#rngSpeed");
    this.rngScale = <SlRange> document.querySelector("#rngScale");
    this.controls = <HTMLDivElement> document.querySelector("#controls");
    this.drpDocuments = <SlDropdown> document.querySelector("#drpDocuments");
    this.mnuDocuments = <SlMenu> document.querySelector("#mnuDocuments");
    this.dlgSave = <SlDialog> document.querySelector("#dlgRename");
    this.dlgDelete = <SlDialog> document.querySelector("#dlgDelete");

    const ifrmPreview = <HTMLIFrameElement> document.querySelector(
      "#ifrmPreview",
    );
    this.btnNew.addEventListener("click", this.newDocument.bind(this));
    this.btnPop.addEventListener("click", this.listenPop.bind(this));
    this.btnMessage.addEventListener("click", this.listenMessage.bind(this));
    this.rngSpeed.addEventListener("wheel", this.listenSpeedWheel.bind(this), {
      passive: false,
    });
    this.rngScale.addEventListener("wheel", this.listenScaleWheel.bind(this), {
      passive: false,
    });
    this.rngSpeed.addEventListener("input", this.listenRangeSpeed.bind(this));
    this.rngScale.addEventListener("input", this.listenRangeScale.bind(this));
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

    const btnSave = <SlButton> this.dlgSave.querySelector(
      "sl-button[name=save]",
    );
    const btnCancel = <SlButton> this.dlgSave.querySelector(
      "sl-button[name=cancel]",
    );
    btnCancel.addEventListener("click", () => this.dlgSave.hide());
    btnSave.addEventListener("click", () => {
      const input = <SlInput> this.dlgSave.querySelector("sl-input");
      const hidden = <HTMLInputElement> this.dlgSave.querySelector(
        "input",
      );
      this.nameSave(hidden.value, input.value);
      this.dlgSave.hide();
    });

    const btnDelete = <SlButton> this.dlgDelete.querySelector(
      "sl-button[name=delete]",
    );
    const btnDelCancel = <SlButton> this.dlgDelete.querySelector(
      "sl-button[name=cancel]",
    );
    btnDelCancel.addEventListener("click", () => this.dlgDelete.hide());
    btnDelete.addEventListener("click", () => {
      const hidden = <HTMLInputElement> this.dlgDelete.querySelector(
        "input",
      );
      const docName = hidden.value;
      this.docDelete(docName);
      this.dlgDelete.hide();
    });

    this.quill = new Quill("#editor", options);
    this.quill.on("text-change", () => {
      this.saveDocument();
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

    this.loadDocument(this.currentDocument, true);

    globalThis.addEventListener("keyup", this.listenKey.bind(this));
    ifrmPreview.addEventListener("load", () => {
      if (!ifrmPreview.contentWindow?.viewer) {
        throw new Error("no viewer on preview.");
      }
      this.previewer = ifrmPreview.contentWindow?.viewer;
      if (!ifrmPreview.contentDocument) {
        throw new Error("no iframe content document");
      }
      ifrmPreview.contentDocument.body.style.overflow = "hidden";
      this.updateMain();
    });
  }

  loadDocument(docName: string, firstLoad = false) {
    if (this.documents[docName]) {
      const strDoc = this.documents[docName];
      const parsedDoc = JSON.parse(strDoc);
      if (parsedDoc) {
        if (!firstLoad) {
          this.saveDocument();
        }
        this.currentDocument = docName;
        this.quill.setContents(parsedDoc);
      }
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

  listenDropClick(e: PointerEvent) {
    if (!(e.target instanceof SlMenuItem)) {
      const icon = <SlIconButton> e.target;
      const menuItem = <SlMenuItem> icon.closest("sl-menu-item");
      switch (icon.name) {
        case "pencil":
          this.nameEdit(menuItem);
          break;
        case "trash": {
          this.dlgDelete.show();
          const hidden = <HTMLInputElement> this.dlgDelete.querySelector(
            "input",
          );
          hidden.value = menuItem.value;
          break;
        }
          // case "check":
          //   this.nameSave(menuItem);
          //   break;
          // case "x":
          //   this.nameEditCancel(menuItem);
          //   break;
      }
      return;
    } else {
      const selected = e.target.value;
      this.loadDocument(selected);
    }
  }

  nameEdit(mi: SlMenuItem) {
    // make a popup
    this.dlgSave.show();
    const input = <SlInput> this.dlgSave.querySelector("sl-input");
    const hidden = <HTMLInputElement> this.dlgSave.querySelector("input");
    hidden.value = mi.value;
    input.value = mi.value;
    input.select();
  }

  nameSave(previousName: string, newName: string) {
    const doc = this.documents[previousName];
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
    this.nameDelete(previousName);
    this.addMenuItem(newName);
    this.saveDB();
  }

  saveDocument() {
    const content = this.quill.getContents();
    this.documents[this.currentDocument] = JSON.stringify(content);
  }

  saveDB() {
    localStorage.setItem("currentDocument", this.currentDocument);
    localStorage.setItem("documents", JSON.stringify(this.documents));
  }

  nameDelete(docName: string) {
    const items = Array.from(
      this.drpDocuments.querySelectorAll("sl-menu-item"),
    );
    const mi = items.find((e) => e.value === docName);
    if (!mi) {
      throw new Error("menu item does not exist");
    }
    mi.remove();
  }

  docDelete(docName: string) {
    const doc = this.documents[docName];
    if (!doc) {
      throw new Error(`Document ${docName} doesn't exist`);
    }
    delete (this.documents[docName]);
    this.nameDelete(docName);
    this.saveDB();
  }

  listenDropSelect(_e: SlSelectEvent) {
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

  listenSpeedWheel(e: WheelEvent) {
    e.preventDefault();

    this.rngSpeed.value += e.deltaY;
    this.viewerWindow?.viewer.setSpeed(this.rngSpeed.value);
  }

  listenRangeSpeed() {
    this.viewerWindow?.viewer.setSpeed(this.rngSpeed.value);
  }

  listenScaleWheel(e: WheelEvent) {
    e.preventDefault();

    this.rngScale.value += e.deltaY / 30;
    this.viewerWindow?.viewer.setTextScale(this.rngScale.value / 10);
  }

  listenRangeScale() {
    this.viewerWindow?.viewer.setTextScale(this.rngScale.value / 10);
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

  newDocument() {
    this.saveDB();
    const newName = `document_${this.formatDateTime()}`;
    this.currentDocument = newName;
    this.addMenuItem(newName);
    this.quill.setText("");
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
    const editor = <HTMLDivElement> document.querySelector(
      "#editor > .ql-editor",
    );
    if (!editor) {
      return console.error("editor not found!");
    }
    if (!this.previewer) return;
    this.previewer.setContent(editor.innerHTML);
    if (!this.viewerWindow) return;
    this.viewer = this.viewerWindow.viewer;
    this.viewer.setContent(editor.innerHTML);
  }

  formatDateTime(d: Date = new Date()): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");

    return `${yyyy}${mm}${dd}-${hh}${min}${ss}`;
  }

  listenResize() {
    console.log("got resize call");
  }

  listenScroll() {
    console.log("got scroll call");
  }
}
