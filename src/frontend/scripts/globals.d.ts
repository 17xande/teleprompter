import { Teleprompter } from "./teleprompter.ts";
import { Viewer } from "./viewer.ts";

declare global {
  var teleprompter: Teleprompter;
  var viewer: Viewer;
  interface Window {
    viewer: Viewer;
  }
}

export {};
