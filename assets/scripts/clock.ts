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
		<sl-input id="inTimeCountdown" type="time" value="00:00:00" step="1" pill clearable></sl-input>
		<sl-button id="btnCountdownReset">Reset</sl-button>
		<sl-button id="btnCountdownStart">Start</sl-button>
		<sl-button id="btnCountdownStop">Stop</sl-button>
		<time is="tp-clock" id="timeCountdown" type="timer" timer="00:00:00"></time>
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
			if (this.popCountdown) {
				this.popCountdown.start()
			}
		})

		this.btnStop.addEventListener('click', e => {
			this.countdown.stop()
			if (this.popCountdown) {
				this.popCountdown.stop()
			}
		})

		this.btnReset.addEventListener('click', e => {
			this.countdown.setAttribute('timer', this.inTimeCountdown.value)
			this.countdown.reset()
			if (this.popCountdown) {
				this.popCountdown.setAttribute('timer', this.inTimeCountdown.value)
				this.popCountdown.reset()
			}
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
	// TODO: is this actually a good case for inheritance?
	// Each differenty type of clock having the same methods by slightly different implementations?
	static observedAttributes = ['countdown']

	// TODO: should this be an enum?
	type: string
	interval: number
	targetDate: Date

	constructor() {
		super()
	}


	tick() {
		let diff = 1;
		switch (this.type) {
			case "clock":
				this.textContent = new Date().toLocaleTimeString()
				return
			case "timer":
				diff = -1
				break

		}
		this.targetDate.setSeconds(this.targetDate.getSeconds() + diff)
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
		this.parseTimer()
	}

	parseTimer() {
		const timer = this.getAttribute('timer')
		if (!timer) {
			throw new Error("timer attribute is required for timer type")
		}
		const [hours, minutes, seconds] = timer.split(':')
		this.targetDate = new Date()
		this.targetDate.setHours(parseInt(hours, 10))
		this.targetDate.setMinutes(parseInt(minutes, 10))
		this.targetDate.setSeconds(parseInt(seconds, 10))
		this.textContent = this.targetDate.toLocaleTimeString()
	}

	connectedCallback() {
		const clockType = this.getAttribute('type')
		if (!clockType) {
			throw Error("type attribute is required")
		}
		this.type = clockType
		switch (clockType) {
			case "clock":
				this.start();
				break
			case "timer":
				this.parseTimer()
				break
			case "timerUp":
				this.targetDate = new Date(0, 0)
				// this.start()
				break
			case "countdown":
				break
			default:
				throw new Error(`Unknown clock type: ${clockType}`)
		}

	}

	disconnectedCallback() {
		this.stop()
	}

	adoptedCallback() {
		throw new Error('Not implemented')
	}

	attributeChangedCallback(name: string, oldValue: string, newValue: string) {
		if (this.type === 'countdown' && name === 'countdown') {
			this.parseTimer()
		}
	}
}

function registerClockComponent() {
	customElements.define('tp-clock', TPClock, { extends: 'time' })
}

export { TPClock, TPClockControl, registerClockComponent, registerClockControlComponent }

