export { }

declare global {
  namespace globalThis {
    var quill: any;
    var update: () => void;
  }

}

declare global {
  namespace Window {
    var startSmoothScroll: () => void;
  }
}
