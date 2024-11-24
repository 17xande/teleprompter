import { registerClockComponent } from "./clock";

registerClockComponent()

let lastScrollTime = 0
let accumulatedScroll = 0
let scrollSpeed = 0

// Function to automatically scroll down the page smoothly, even at low speeds
function smoothScroll(timestamp: DOMHighResTimeStamp) {
	// Calculate the time difference since the last scroll
	if (lastScrollTime === 0) lastScrollTime = timestamp;
	const timeElapsed = timestamp - lastScrollTime;

	// Calculate how many pixels we need to scroll based on the speed
	const pixelsToScroll = (scrollSpeed / 1000) * timeElapsed; // Pixels per millisecond
	accumulatedScroll += pixelsToScroll;  // Accumulate fractional scroll

	// Scroll the page by the integer part of accumulatedScroll
	const pixelsToScrollNow = Math.floor(accumulatedScroll);
	window.scrollBy(0, pixelsToScrollNow);

	// Keep the fractional part for the next frame
	accumulatedScroll -= pixelsToScrollNow;

	lastScrollTime = timestamp;

	// Continue scrolling as long as we have space to scroll
	if ((window.innerHeight + window.scrollY) < document.body.offsetHeight) {
		requestAnimationFrame(smoothScroll);
	}
}

// Start the smooth scrolling
function startSmoothScroll() {
	lastScrollTime = 0;  // Reset last scroll time
	accumulatedScroll = 0;  // Reset accumulated scroll
	requestAnimationFrame(smoothScroll);
}

// Function to update the scroll speed dynamically
function updateSpeed(speed: number) {
	scrollSpeed = speed  // Update speed in pixels per second
}

type messageWindow = {
	method: string,
	args: string | number[],
}

let sourceWindow: WindowProxy

window.addEventListener('message', e => {
	if (e.origin !== window.origin) return
	if (!e.source) return
	// TODO: check properly if e.source is a WindowProxy.
	sourceWindow = <WindowProxy>e.source
	const msg: messageWindow = e.data
	switchMessage(msg)
})

function switchMessage(msg: messageWindow) {
	console.log(`message { ${msg.method}: ${msg.args} }`)

	switch (msg.method) {
		case 'scrollSpeed':
			scrollSpeed = <number>msg.args[0]
			break
		case 'textScale':
			updateTextScale(<number>msg.args[0])
			break
		default:
			console.error("Invalid message: ${msg}")
	}
}

const root = <HTMLHtmlElement>document.querySelector(":root")

function updateTextScale(scale: number) {
	root.style.setProperty("--textScale", `${scale}rem`)
}

// const displayMediaOptions: DisplayMediaStreamOptions = {
// 	monitorTypeSurfaces: "exclude",
// 	preferCurrentTab: true,
// 	selfBrowserSurface: "include",
// 	surfaceSwitching: "exclude",
// 	systemAudio: "exclude",
// 	monitorTypeSurface: "exclude",
// }

async function startCapture() {
	const captureStream = await navigator.mediaDevices.getDisplayMedia().catch(e => console.error(e))
	if (!captureStream) return
	let peerConnection = new RTCPeerConnection()

	// Add the captured stream to the WebRTC connection.
	captureStream.getTracks().forEach(track => peerConnection.addTrack(track, captureStream))

	// Create and send the offer to the receiver.
	const offer = await peerConnection.createOffer()
	await peerConnection.setLocalDescription(offer)
	const offerSDP = peerConnection.localDescription

	// Send to offer to the receiver.
	const msg = {
		event: "displayCaptureStream",
		offer: "",
	}
	sourceWindow.postMessage("")

}

globalThis.startSmoothScroll = startSmoothScroll
