import { registerClockComponent } from "./clock.ts";
import { TPClock, TPClockControl } from "./clock.ts";

export class Viewer {
  lastScrollTime: number = 0;
  accumulatedScroll: number = 0;
  scrollSpeed: number = 0;
  root = <HTMLHtmlElement> document.querySelector(":root");
  scroll = false;

  constructor() {
    registerClockComponent();
    this.root = <HTMLHtmlElement> document.querySelector(":root");

    globalThis.addEventListener("load", () => {
      globalThis.opener.teleprompter.updateMain();

      const tpPopClock = <TPClock> document.querySelector(
        "#timeTimer",
      );
      const tpClockControl = <TPClockControl> globalThis.opener.document
        .querySelector(
          "#countdowncontrol",
        );
      if (!tpPopClock) {
        throw new Error("tp-clock not found on popup");
      }

      if (!tpClockControl) {
        throw new Error("tp-clock-control not found on main");
      }

      tpClockControl.popCountdown = tpPopClock;

      this.startSmoothScroll();
    });
  }

  startSmoothScroll() {
    this.lastScrollTime = 0; // Reset last scroll time
    this.accumulatedScroll = 0; // Reset accumulated scroll
    this.scroll = true;
    requestAnimationFrame(this.smoothScroll.bind(this));
  }

  stopSmoothScroll() {
    this.scroll = false;
  }

  smoothScroll(timestamp: DOMHighResTimeStamp) {
    if (!this.scroll) {
      return;
    }
    const windowHeight = globalThis.innerHeight + globalThis.scrollY;
    if (this.scrollSpeed > 0 && windowHeight > document.body.offsetHeight) {
      // if we're at the bottom of the page, don't continue scrolling.
      requestAnimationFrame(this.smoothScroll.bind(this));
      return;
    }
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

    // Continue the animation.
    requestAnimationFrame(this.smoothScroll.bind(this));
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
