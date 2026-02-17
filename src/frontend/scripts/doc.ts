import WaButton from "@awesome.me/webawesome/dist/components/button/button.js";
import WaDropdown from "@awesome.me/webawesome/dist/components/dropdown/dropdown.js";
import WaDialog from "@awesome.me/webawesome/dist/components/dialog/dialog.js";
import WaInput from "@awesome.me/webawesome/dist/components/input/input.js";
import WaDropdownItem from "@awesome.me/webawesome/dist/components/dropdown-item/dropdown-item.js";
import WaIcon from "@awesome.me/webawesome/dist/components/icon/icon.js";
import type { WaSelectEvent } from "@awesome.me/webawesome";

export class Doc {
  name: string;
  content: string;

  constructor(name: string, content: string) {
    this.name = name;
    this.content = content;
  }
}

export class DocStorage {
  // TODO: Possible sync issue with current doc vs docs[currentdocname]. Consider storing only the docname here.
  private currentDoc: Doc;
  // Use a Map for more efficient additions/deletions and less possible weirdness with objects.
  // TODO: NO, don't use a map, serializing maps to/from JSON requires hoop-jumping + performance penalty. Use a TypeScript Record<>.
  private docs: Map<string, Doc>;

  constructor() {
    const jsonDocs = localStorage.getItem("documents");
    if (!jsonDocs) {
      console.warn("no documents collection in localStorage. Creating one");
      this.docs = new Map<string, Doc>();
      this.currentDoc = new Doc(Utils.formatDateTime(), "New Document");
      this.setDoc(this.currentDoc);
      this.save();
      return;
    }

    this.docs = new Map(Object.entries(JSON.parse(jsonDocs)));

    let currentDocName = localStorage.getItem("currentDocument");
    if (!currentDocName) {
      console.warn(
        "no currentDocument in localStorage. Setting it to the first document",
      );
      const first = this.docs.keys().next().value;
      if (!first) {
        throw new Error("no keys in document map, something has gone wrong.");
      }
      currentDocName = first;
    }
    this.currentDoc = this.docs.get(currentDocName)!;
    this.save();

    // TODO: Emit event that DocStorage is loaded.
  }

  load() {
    const jsonDocs = localStorage.getItem("documents");
    if (!jsonDocs) {
      throw new Error("localstorage corrupted");
    }

    this.docs = new Map(Object.entries(JSON.parse(jsonDocs)));

    const currentDocName = localStorage.getItem("currentDocument");
    if (!currentDocName) {
      throw new Error("localstorage corrupted");
    }
    this.setCurrent(this.docs.get(currentDocName)!);
  }

  getCurrent(): Doc {
    return this.currentDoc;
  }

  setCurrent(doc: Doc) {
    this.currentDoc = doc;
  }

  setCurrentContent(content: string) {
    this.currentDoc.content = content;
    this.setDoc(this.currentDoc);
  }

  getDoc(docName: string): Doc | undefined {
    return this.docs.get(docName);
  }

  setDoc(doc: Doc) {
    this.docs.set(doc.name, doc);
  }

  save() {
    localStorage.setItem("currentDocument", this.currentDoc.name);
    localStorage.setItem(
      "documents",
      JSON.stringify(Object.fromEntries(this.docs.entries())),
    );
  }

  rename(doc: Doc, newName: string) {
    const oldName = doc.name;
    doc.name = newName;
    this.currentDoc = doc;
    this.setDoc(doc);
    this.remove(oldName);
  }

  remove(docName: string) {
    this.docs.delete(docName);
  }

  // TODO: figure out how to create an iterator to return docs. For now, just return the whole map.
  // *docIterate() {
  // for (const [_, doc] of this.docs) {
  //   yield doc
  // }

  getDocs(): Map<string, Doc> {
    return this.docs;
  }
}

export class DocControls {
  btnNew: WaButton;
  drpDocuments: WaDropdown;
  dlgSave: WaDialog;
  dlgDelete: WaDialog;
  // TODO: make this private?
  docStorage: DocStorage;

  constructor() {
    // Class Selectors
    this.btnNew = document.querySelector("#btnNew")!;
    this.drpDocuments = document.querySelector("#drpDocuments")!;
    this.dlgSave = document.querySelector("#dlgRename")!;
    this.dlgDelete = document.querySelector("#dlgDelete")!;

    this.docStorage = new DocStorage();
    this.loadDocument(this.docStorage.getCurrent().name);
    this.populateDropdown();

    // Dialog Selectors
    const btnSave: WaButton = this.dlgSave.querySelector(
      "wa-button[name=save]",
    )!;
    const btnCancel: WaButton = this.dlgSave.querySelector(
      "wa-button[name=cancel]",
    )!;
    const btnDelete: WaButton = this.dlgDelete.querySelector(
      "wa-button[name=delete]",
    )!;
    const btnDelCancel: WaButton = this.dlgDelete.querySelector(
      "wa-button[name=cancel]",
    )!;

    // Bind event Listeners
    this.btnNew.addEventListener("click", this.new.bind(this));
    this.drpDocuments.addEventListener(
      "wa-select",
      this.listenDropSelect.bind(this),
    );
    this.drpDocuments.addEventListener(
      "click",
      this.listenDropClick.bind(this),
    );

    btnCancel.addEventListener("click", () => this.dlgSave.open = false);
    btnSave.addEventListener("click", () => {
      const input: WaInput = this.dlgSave.querySelector("wa-input")!;
      const hidden = <HTMLInputElement> this.dlgSave.querySelector(
        "input",
      )!;
      // TODO: Have a better default value for below.
      this.nameSave(hidden.value, input.value || "");
      this.dlgSave.open = false;
    });

    btnDelCancel.addEventListener("click", () => this.dlgDelete.open = false);
    btnDelete.addEventListener("click", () => {
      const hidden = <HTMLInputElement> this.dlgDelete.querySelector(
        "input",
      );
      const docName = hidden.value;
      this.remove(docName);
      this.dlgDelete.open = false;
    });

    // TODO: Listen to dockstorage load event and populate dropdown.
  }

  populateDropdown() {
    const docs = this.docStorage.getDocs();
    for (const [name, _] of docs) {
      this.addMenuItem(name);
    }
  }

  listenDropSelect(e: WaSelectEvent) {
    console.log(e);
    const item = e.detail.item as WaDropdownItem;
    const docName = item.value;
    const icon = <WaIcon> item.firstElementChild;
    const action = icon.name;

    switch (action) {
      case "folder-open":
        this.docStorage.save();
        this.loadDocument(docName);
        break;
      case "pencil":
        throw new Error("unimplemented");
      case "trash":
        throw new Error("unimplemented");
    }
  }

  loadDocument(docName: string, firstLoad = false) {
    const doc = this.docStorage.getDoc(docName);
    if (!doc) {
      console.warn(
        `failed to load document "${docName}" because it doesn't exist`,
      );
      return;
    }

    // if (!firstLoad) {
    //   this.docStorage.setDoc(doc);
    // }
    this.docStorage.setCurrent(doc);

    const loadEvent = new CustomEvent<Doc>("load", {
      detail: doc,
      bubbles: true,
      composed: true,
    });

    this.drpDocuments.dispatchEvent(loadEvent);
  }

  // TODO: remove this, use the web awesome DropSelect event
  listenDropClick(_e: PointerEvent) {
    return;
    // if (!(e.target instanceof WaDropdownItem)) {
    //   const icon = <WaIcon> e.target;
    //   const menuItem: WaDropdownItem = icon.closest("wa-dropdown-item")!;
    //   switch (icon.name) {
    //     case "pencil":
    //       this.editPopup(menuItem);
    //       break;
    //     case "trash": {
    //       this.dlgDelete.open = false;
    //       const hidden = <HTMLInputElement> this.dlgDelete.querySelector(
    //         "input",
    //       );
    //       hidden.value = menuItem.value;
    //       break;
    //     }
    //       // case "check":
    //       //   this.nameSave(menuItem);
    //       //   break;
    //       // case "x":
    //       //   this.nameEditCancel(menuItem);
    //       //   break;
    //   }
    //   return;
    // } else {
    //   const selected = e.target.value;
    //   this.loadDocument(selected);
    // }
  }

  editPopup(mi: WaDropdownItem) {
    // make a popup
    this.dlgSave.open = true;
    const input: WaInput = this.dlgSave.querySelector("wa-input")!;
    const hidden: HTMLInputElement = this.dlgSave.querySelector("input")!;
    hidden.value = mi.value;
    input.value = mi.value;
    input.select();
  }

  nameSave(previousName: string, newName: string) {
    const doc = this.docStorage.getDoc(previousName);
    if (!doc) {
      throw new Error("can't rename document that doesn't exist?");
    }
    doc.name = newName;
    this.docStorage.setDoc(doc);
    if (this.docStorage.getCurrent().name === previousName) {
      this.docStorage.setCurrent(doc);
    }
    const items = Array.from(
      this.drpDocuments.querySelectorAll("wa-dropdown-item"),
    );
    const mi = items.find((e) => e.value === previousName);
    if (!mi) {
      throw new Error("menu item does not exist");
    }
    this.remove(previousName);
    this.addMenuItem(newName);
    this.docStorage.save();
  }

  addMenuItem(docName: string) {
    const mnuItem = new WaDropdownItem();

    mnuItem.innerHTML = `${docName}
      <wa-dropdown-item slot="submenu" value="${docName}">Open
        <wa-icon slot="icon" name="folder-open" label="Open"></wa-icon>
      </wa-dropdown-item>
      <wa-dropdown-item slot="submenu" value="${docName}">Rename
        <wa-icon slot="icon" name="pencil" label="Rename"></wa-icon>
      </wa-dropdown-item>
      <wa-dropdown-item slot="submenu" value="${docName}" variant="danger">Delete
        <wa-icon slot="icon" name="trash" label="Delete"></wa-icon>
      </wa-dropdown-item>
    `;
    const m = <WaDropdownItem> mnuItem.cloneNode(true);
    m.value = docName;
    this.drpDocuments.appendChild(m);
  }

  new() {
    this.docStorage.setDoc(this.docStorage.getCurrent());
    const newName = `document_${Utils.formatDateTime()}`;
    const newDoc = new Doc(newName, "");
    this.docStorage.setCurrent(newDoc);
    this.addMenuItem(newName);
    const newEvent = new CustomEvent("new", {
      detail: { name: newName },
      bubbles: true,
      composed: true,
    });

    // TODO: When this becomes a web component, dispatch the event from this component.
    this.drpDocuments.dispatchEvent(newEvent);
    this.docStorage.setDoc(newDoc);
  }

  open() {
    throw new Error("unimplemented");
  }

  rename() {
    throw new Error("unimplemented");
  }

  remove(docName: string) {
    const items = Array.from(
      this.drpDocuments.querySelectorAll("wa-dropdown-item"),
    );
    const mi = items.find((e) => e.value === docName);
    if (!mi) {
      throw new Error("menu item does not exist");
    }
    mi.remove();

    this.docStorage.remove(docName);
  }
}

// Utility collection
const Utils = {
  formatDateTime(d: Date = new Date()): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");

    return `${yyyy}${mm}${dd}-${hh}${min}${ss}`;
  },
};
