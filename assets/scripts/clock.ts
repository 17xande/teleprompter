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
		const now = new Date()
		const diff = new Date(this.targetDate - now)
		this.textContent = diff.toLocaleTimeString()
	}

	connectedCallback() {
		// this.setAttribute('datetime', this.getAttribute('countdown'))
		this.interval = setInterval(() => {
			this.tick()
		}, 1000)
	}

	disconnectedCallback() {
		clearInterval(this.interval)
	}

	adoptedCallback() {
		throw new Error('Not implemented')
	}

	attributeChangedCallback(name: string, oldValue: string, newValue: string) {
		if (name === 'countdown') {
			const [hours, minutes, seconds] = newValue.split(":")
			this.targetDate = new Date()
			this.targetDate.setHours(parseInt(hours, 10))
			this.targetDate.setMinutes(parseInt(minutes, 10))
			this.targetDate.setSeconds(parseInt(seconds, 10))
		}
	}
}

customElements.define('tp-clock', TPClock, { extends: 'time' })

export default TPClock
