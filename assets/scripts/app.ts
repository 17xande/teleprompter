import '@shoelace-style/shoelace/dist/components/drawer/drawer.js'
import '@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js'
import '@shoelace-style/shoelace/dist/components/range/range.js'
import '@shoelace-style/shoelace/dist/components/input/input.js'
import '@shoelace-style/shoelace/dist/components/button/button.js'
import SlProgressBar from '@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js';
import Quill, { QuillOptions } from "quill";
import { ToolbarConfig } from "quill/modules/toolbar";
import SlRange from '@shoelace-style/shoelace/dist/components/range/range.js';
import { registerClockComponent, registerClockControlComponent, TPClock, TPClockControl } from './clock'

registerClockComponent()
registerClockControlComponent()

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
	const innerWin = window.open("pop.html", "pop", "popup=true,width=300,height=320")
	if (!innerWin) {
		console.error("failed to open window")
		return
	}

	win = innerWin
	win.addEventListener('load', e => {
		updateMain()

		const tpPopClock = <TPClock>innerWin.document.querySelector('#timeCountdown')
		const tpClockControl = <TPClockControl>document.querySelector('#countdowncontrol')
		if (!tpPopClock) {
			throw new Error("tp-clock not found on popup")
		}

		tpClockControl.popCountdown = tpPopClock

		win.startSmoothScroll()
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

	// TODO: don't use postMessage, declare the method on the window, and call it directly.

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

	// TODO: don't use postMessage, declare the method on the window, and call it directly.
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

globalThis.quill = quill
globalThis.update = updateMain
