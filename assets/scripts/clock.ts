import { SlButton, SlInput } from "@shoelace-style/shoelace"
/**
 * Teleprompter countdown clock control component.
 */
class TPClockControl extends HTMLElement {
	inTimeCountdown: SlInput
	btnStart: SlButton
	btnStop: SlButton
	btnReset: SlButton
	countdown: TPClock
	popCountdown: TPClock

	constructor() {
		// TODO: don't think I need this when extending HTMLElement.
		super()
	}

	connectedCallback() {
		// TODO: import that html template literal function from the vanilla website.
		this.innerHTML = `
		<sl-input id="inTimeCountdown" type="time" defaultValue="00:00" step="1" pill clearable></sl-input>
		<sl-button id="btnCountdownReset">Reset</sl-button>
		<sl-button id="btnCountdownStart">Start</sl-button>
		<sl-button id="btnCountdownStop">Stop</sl-button>
		<time is="tp-clock" id="timeCountdown" countdown="01:02:03">00:00:00</time>
`


		this.update()
	}

	disconnectedCallback() {
		throw new Error("not implemented")
	}

	attributeChangedCallback(name: string, oldValue: string, newValue: string) {
		throw new Error("not implemented")
	}

	update() {
		this.inTimeCountdown = <SlInput>this.querySelector('#inTimeCountdown')
		this.btnStart = <SlButton>this.querySelector('#btnCountdownStart')
		this.btnStop = <SlButton>this.querySelector('#btnCountdownStop')
		this.btnReset = <SlButton>this.querySelector('#btnCountdownReset')
		this.countdown = <TPClock>this.querySelector('#timeCountdown')

		this.btnStart.addEventListener('click', e => {
			this.countdown.start()
		})

		this.btnStop.addEventListener('click', e => {
			this.countdown.stop()
		})

		this.btnReset.addEventListener('click', e => {
			this.countdown.setAttribute('countdown', this.inTimeCountdown.value)
			this.popCountdown.setAttribute('countdown', this.inTimeCountdown.value)
			this.popCountdown.reset()
			this.countdown.reset()
		})
	}
}

function registerClockControlComponent() {
	customElements.define('tp-clock-control', TPClockControl)
}

/**
	* Teleprompter Countdown clock component. Extends HTMLTimeElement.
	*
	* Usage:
	* <time is="tp-clock" countdown="01:02:03"></time>
	* countdown="hh:mm:ss" to countdown from.
	*/
class TPClock extends HTMLTimeElement {
	static observedAttributes = ['countdown']

	interval: number
	targetDate: Date

	constructor() {
		super()
	}

	tick() {
		this.targetDate.setSeconds(this.targetDate.getSeconds() - 1)
		this.textContent = this.targetDate.toLocaleTimeString()
	}

	start() {
		this.interval = setInterval(() => {
			this.tick()
		}, 1000)

	}

	stop() {
		clearInterval(this.interval)
	}

	reset() {
		this.stop()
		this.parseCountdown()
	}

	parseCountdown() {
		const countdown = this.getAttribute('countdown')
		if (!countdown) {
			return
		}
		const [hours, minutes, seconds] = countdown.split(':')
		this.targetDate = new Date()
		this.targetDate.setHours(parseInt(hours, 10))
		this.targetDate.setMinutes(parseInt(minutes, 10))
		this.targetDate.setSeconds(parseInt(seconds, 10))
		this.textContent = this.targetDate.toLocaleTimeString()
	}

	connectedCallback() {
		this.parseCountdown()
	}

	disconnectedCallback() {
		this.stop()
	}

	adoptedCallback() {
		throw new Error('Not implemented')
	}

	attributeChangedCallback(name: string, oldValue: string, newValue: string) {
		if (name === 'countdown') {
			this.parseCountdown()
		}
	}
}

function registerClockComponent() {
	customElements.define('tp-clock', TPClock, { extends: 'time' })
}

export { TPClock, TPClockControl, registerClockComponent, registerClockControlComponent }

