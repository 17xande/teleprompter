
class TPClock extends HTMLTimeElement {
	static observedAttributes = ['countdown']

	constructor() {
		super()
	}

	tick(): number {
		let interval = setInterval(() => {
			this.textContent = new Date().toLocaleTimeString()
		}, 1000)


		return interval
	}

	connectedCallback() {
		// this.setAttribute('datetime', this.getAttribute('countdown'))
		let interval = this.tick()
		console.log(`interval: ${interval}`)
	}

	disconnectedCallback() {
		throw new Error('Not implemented')
	}

	adoptedCallback() {
		throw new Error('Not implemented')
	}

	attributeChangedCallback(name: string, oldValue: string, newValue: string) {
		throw new Error('Not implemented')
	}
}

customElements.define('tp-clock', TPClock, { extends: 'time' })

export default TPClock
