import { registerClockComponent } from "./clock.ts";

export class Viewer {
  lastScrollTime: number = 0;
  accumulatedScroll: number = 0;
  scrollSpeed: number = 0;
  root = <HTMLHtmlElement> document.querySelector(":root");
  constructor() {
    registerClockComponent();
  }

  startSmoothScroll() {
    this.lastScrollTime = 0; // Reset last scroll time
    this.accumulatedScroll = 0; // Reset accumulated scroll
    requestAnimationFrame(this.smoothScroll);
  }

  smoothScroll(timestamp: DOMHighResTimeStamp) {
    // Calculate the time difference since the last scroll
    if (this.lastScrollTime === 0) this.lastScrollTime = timestamp;
    const timeElapsed = timestamp - this.lastScrollTime;

    // Calculate how many pixels we need to scroll based on the speed
    const pixelsToScroll = (this.scrollSpeed / 1000) * timeElapsed; // Pixels per millisecond
    this.accumulatedScroll += pixelsToScroll; // Accumulate fractional scroll

    // Scroll the page by the integer part of this.accumulatedScroll
    const pixelsToScrollNow = Math.floor(this.accumulatedScroll);
    globalThis.scrollBy(0, pixelsToScrollNow);

    // Keep the fractional part for the next frame
    this.accumulatedScroll -= pixelsToScrollNow;

    this.lastScrollTime = timestamp;

    // Continue scrolling as long as we have space to scroll
    if (
      (globalThis.innerHeight + globalThis.scrollY) < document.body.offsetHeight
    ) {
      requestAnimationFrame(this.smoothScroll);
    }
  }
  setSpeed(speed: number) {
    this.scrollSpeed = speed; // Update speed in pixels per second
  }
  setTextScale(scale: number) {
    this.root.style.setProperty("--textScale", `${scale}rem`);
  }
  setContent(content: string) {
    const popMain = <HTMLDivElement> document.querySelector(
      "#main",
    );
    popMain.innerHTML = content;
  }
}

// const displayMediaOptions: DisplayMediaStreamOptions = {
// 	monitorTypeSurfaces: "exclude",
// 	preferCurrentTab: true,
// 	selfBrowserSurface: "include",
// 	surfaceSwitching: "exclude",
// 	systemAudio: "exclude",
// 	monitorTypeSurface: "exclude",
// }

// async function startCapture() {
//   const captureStream = await navigator.mediaDevices.getDisplayMedia().catch(
//     (e) => console.error(e)
//   );
//   if (!captureStream) return;
//   let peerConnection = new RTCPeerConnection();
//
//   // Add the captured stream to the WebRTC connection.
//   captureStream.getTracks().forEach((track) =>
//     peerConnection.addTrack(track, captureStream)
//   );
//
//   // Create and send the offer to the receiver.
//   const offer = await peerConnection.createOffer();
//   await peerConnection.setLocalDescription(offer);
//   const offerSDP = peerConnection.localDescription;
//
//   // Send to offer to the receiver.
//   const msg = {
//     event: "displayCaptureStream",
//     offer: "",
//   };
//   sourceWindow.postMessage("");
// }
