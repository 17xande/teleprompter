import { Teleprompter } from "./teleprompter.ts";

declare global {
  var teleprompter: Teleprompter;
  // interface globalThis {
  //   teleprompter: Teleprompter;
  // }
}

export {};
