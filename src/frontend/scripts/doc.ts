import WaButton from "@awesome.me/webawesome/dist/components/button/button.js";
import WaDropdown from "@awesome.me/webawesome/dist/components/dropdown/dropdown.js";
import WaDialog from "@awesome.me/webawesome/dist/components/dialog/dialog.js";
import WaInput from "@awesome.me/webawesome/dist/components/input/input.js";
import WaDropdownItem from "@awesome.me/webawesome/dist/components/dropdown-item/dropdown-item.js";
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
  currentDoc: Doc;
  // Use a Map for more efficient additions/deletions and less possible weirdness with objects.
  // TODO: NO, don't use a map, maps to serialise/deserialise to/from JSON. Use an object.
  docs: Map<string, Doc>;

  constructor() {
    // Initialise this here so LSP stops crying.
    this.currentDoc = new Doc("newDocument", "");
    // Check localStorage for data and load to memory.
    const currentDocName = localStorage.getItem("currentDocument") ||
      "newDocument";
    const jsonDocs = localStorage.getItem("documents");
    if (!jsonDocs) {
      this.docs = new Map<string, Doc>();
      this.currentDoc = new Doc("newDocument", "");
      return;
    }

    this.docs = new Map(Object.entries(JSON.parse(jsonDocs)));
    this.setCurrent(currentDocName);
  }

  setCurrent(docName: string): Doc {
    let doc = this.docs.get(docName);
    if (!doc) {
      console.warn(
        `document ${docName} not found in storage. Creating empty document`,
      );
      this.currentDoc = new Doc(docName, "");
      doc = this.currentDoc;
    } else {
      this.currentDoc = doc;
    }
    return doc;
  }

  saveDoc(doc: Doc) {
    this.docs.set(doc.name, doc);
    this.save();
  }

  save() {
    localStorage.setItem("currentDocument", this.currentDoc.name);
    localStorage.setItem(
      "documents",
      JSON.stringify(Object.fromEntries(this.docs.entries())),
    );
  }

  rename(doc: Doc, newName: string) {
    doc.name = newName;
    this.currentDoc = doc;
    this.saveDoc(doc);
  }
  remove(docName: string) {
    this.docs.delete(docName);
    this.save();
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
    this.docStorage = new DocStorage();
    this.populateDropdown();

    // Class Selectors
    this.btnNew = document.querySelector("#btnNew")!;
    this.drpDocuments = document.querySelector("#drpDocuments")!;
    this.dlgSave = document.querySelector("#dlgRename")!;
    this.dlgDelete = document.querySelector("#dlgDelete")!;

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
  }

  populateDropdown() {
    for (const [name, _] of this.docStorage.docs) {
      this.addMenuItem(name);
    }
  }

  listenDropSelect(e: WaSelectEvent) {
    console.log(e);
    const item = e.detail.item as WaDropdownItem;
    const action = item.value;
    const docID = (item.parentElement as WaDropdownItem).value;

    const selectMap = {
      open: null,
      rename: null,
      delete: null,
    };
  }

  // loadDocument loads a document from storage, based on the document name.
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

  listenDropClick(e: PointerEvent) {
    if (!(e.target instanceof WaDropdownItem)) {
      const icon = <WaIcon> e.target;
      const menuItem: WaDropdownItem = icon.closest("wa-dropdown-item")!;
      switch (icon.name) {
        case "pencil":
          this.nameEdit(menuItem);
          break;
        case "trash": {
          this.dlgDelete.open = false;
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

  nameEdit(mi: WaDropdownItem) {
    // make a popup
    this.dlgSave.open = true;
    const input: WaInput = this.dlgSave.querySelector("wa-input")!;
    const hidden: HTMLInputElement = this.dlgSave.querySelector("input")!;
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
      <wa-dropdown-item slot="submenu" value="Open">Open
        <wa-icon slot="icon" name="folder-open" label="Open"></wa-icon>
      </wa-dropdown-item>
      <wa-dropdown-item slot="submenu" value="rename">Rename
        <wa-icon slot="icon" name="pencil" label="Rename"></wa-icon>
      </wa-dropdown-item>
      <wa-dropdown-item slot="submenu" value="delete" variant="danger">Delete
        <wa-icon slot="icon" name="trash" label="Delete"></wa-icon>
      </wa-dropdown-item>
    `;
    const m = <WaDropdownItem> mnuItem.cloneNode(true);
    m.value = docName;
    this.drpDocuments.appendChild(m);
  }

  new() {
    this.saveDB();
    const newName = `document_${this.formatDateTime()}`;
    this.currentDocument = newName;
    this.addMenuItem(newName);
    this.quill.setText("");
  }

  open() {}

  rename() {}

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
