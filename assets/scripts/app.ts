import '@shoelace-style/shoelace/dist/components/drawer/drawer.js'
import '@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js'
import '@shoelace-style/shoelace/dist/components/range/range.js'
import '@shoelace-style/shoelace/dist/components/input/input.js'
import '@shoelace-style/shoelace/dist/components/button/button.js'
import SlProgressBar from '@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js';
import Quill, { QuillOptions } from "quill";
import { ToolbarConfig } from "quill/modules/toolbar";
import SlRange from '@shoelace-style/shoelace/dist/components/range/range.js';
import TPClock from './clock'
import SlButton from '@shoelace-style/shoelace/dist/components/button/button.js'

customElements.define('tp-clock', TPClock, { extends: 'time' })

const toolbarOptions: ToolbarConfig = [
	['bold', 'italic', 'underline', 'strike'],        // toggled buttons
	['blockquote', 'code-block'],
	['link', 'image', 'video', 'formula'],

	[{ 'header': 1 }, { 'header': 2 }],               // custom button values
	[{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'list': 'check' }],
	[{ 'script': 'sub' }, { 'script': 'super' }],      // superscript/subscript
	[{ 'indent': '-1' }, { 'indent': '+1' }],          // outdent/indent
	[{ 'direction': 'rtl' }],                         // text direction

	[{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
	[{ 'header': [1, 2, 3, 4, 5, 6, false] }],

	[{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
	[{ 'font': [] }],
	[{ 'align': [] }],

	['clean']                                         // remove formatting button
];

const options: QuillOptions = {
	placeholder: "Bonjour, Le Telepromteur",
	theme: "snow",
	modules: {
		toolbar: toolbarOptions,
	},
}

const quill = new Quill('#editor', options)
let win: Window

const btnPop = document.querySelector("#btnPop")
btnPop?.addEventListener('click', e => {
	const innerWin = window.open("pop.html", "pop", "popup=true")
	if (!innerWin) {
		console.error("failed to open window")
		return
	}

	win = innerWin

	win.addEventListener('load', e => {
		updateMain()
	})
})

const root = <HTMLHtmlElement>document.querySelector(":root")

type messageWindow = {
	method: string,
	args: string | number[],
}

const prgSpeed = <SlProgressBar>document.querySelector("#prgSpeed")
prgSpeed.addEventListener('wheel', e => {
	// const r = root.style.getPropertyValue("--rotation")
	// let rot = 0
	// if (r) rot = parseInt(r, 10)
	// root.style.setProperty("--rotation", `${rot + e.deltaY}deg`)

	e.preventDefault()

	let speed = prgSpeed.value * 10 - 500
	let percent = prgSpeed.value + e.deltaY / 10

	if (e.deltaY > 0) {
		percent = Math.min(100, percent)
	}
	else {
		percent = Math.max(0, percent)
	}

	prgSpeed.value = percent
	prgSpeed.textContent = speed.toFixed(0) + "pps"

	if (!win) return

	console.log(`posting message son`)
	const msg: messageWindow = {
		method: 'scrollSpeed',
		args: [speed],
	}
	win.postMessage(msg)
}, { passive: false })

const rngScale = <SlRange>document.querySelector("#rngScale")
rngScale.addEventListener('sl-input', e => {
	const msg: messageWindow = {
		method: 'textScale',
		args: [rngScale.value],
	}

	console.log(msg)

	if (!win) return
	win.postMessage(msg)
})

function updateMain() {
	const editor = <HTMLDivElement>document.querySelector('#editor > .ql-editor')
	if (!editor) {
		return console.error("editor not found!")
	}

	const popMain = <HTMLDivElement>win.document.querySelector("#main")
	popMain.innerHTML = editor.innerHTML
}

// TODO: I should move all this into a class to manage the popup window state properly.
const btnStart = <SlButton>document.querySelector("#btnCountdownStart")
const btnStop = <SlButton>document.querySelector("#btnCountdownStop")
const btnReset = <SlButton>document.querySelector("#btnCountdownReset")
const clock = <TPClock>document.querySelector("#clock")
btnStart.addEventListener('click', e => {
	clock.start()
})

btnStop.addEventListener('click', e => {
	clock.stop()
})

btnReset.addEventListener('click', e => {
	clock.reset()
})

function updateContdownClock(time: string) {
	const popCountdownClock = <HTMLTimeElement>win.document.querySelector("countdownClock")
	popCountdownClock.textContent = time
}

globalThis.quill = quill
globalThis.update = updateMain
