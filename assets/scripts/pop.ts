let lastScrollTime = 0
let accumulatedScroll = 0
let scrollSpeed = 0

// Function to automatically scroll down the page smoothly, even at low speeds
function smoothScroll(timestamp) {
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

startSmoothScroll()

type messageScrollSpeed = {
	scrollSpeed: number,
}

window.addEventListener('message', e => {
	if (e.origin !== window.origin) return
	const msg: messageScrollSpeed = e.data
	scrollSpeed = msg.scrollSpeed
})
