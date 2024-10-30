type duration = {
	hours?: number
	minutes?: number
	seconds?: number
}

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

export default TPClock
