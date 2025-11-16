import { SlButton, SlInput } from "@shoelace-style/shoelace";
/**
 * Teleprompter countdown clock control component.
 *
 * Usage:
 * <tp-clock-control id="countdowncontrol" countdown="00:00:00"></tp-clock-control>
 */
class TPClockControl extends HTMLElement {
  inHour: SlInput;
  inMinute: SlInput;
  inSecond: SlInput;
  btnStart: SlButton;
  btnStop: SlButton;
  btnReset: SlButton;
  countdown: TPClock;
  popCountdown: TPClock | null = null;

  constructor() {
    // TODO: don't think I need this when extending HTMLElement.
    super();
    this.inHour = <SlInput> this.querySelector("#inHour");
    this.inMinute = <SlInput> this.querySelector("#inMinute");
    this.inSecond = <SlInput> this.querySelector("#inSecond");
    this.btnStart = <SlButton> this.querySelector("#btnCountdownStart");
    this.btnStop = <SlButton> this.querySelector("#btnCountdownStop");
    this.btnReset = <SlButton> this.querySelector("#btnCountdownReset");
    this.countdown = <TPClock> this.querySelector("#timeCountdown");
  }

  connectedCallback() {
    // TODO: import that html template literal function from the vanilla website.
    this.innerHTML = `
    <h3>Timer Control</h3>
    <div class="wrapper">
    <sl-input id="inHour" type="number" value="00"></sl-input><span>:</span>
    <sl-input id="inMinute" type="number" value="00"></sl-input><span>:</span>
    <sl-input id="inSecond" type="number" value="00"></sl-input>
    </div>
		<sl-button id="btnCountdownReset">Reset</sl-button>
		<sl-button id="btnCountdownStart">Start</sl-button>
		<sl-button id="btnCountdownStop">Stop</sl-button>
		<time is="tp-clock" id="timeCountdown" type="timer" timer="00:00:00"></time>
`;

    this.update();
  }

  disconnectedCallback() {
    throw new Error("not implemented");
  }

  attributeChangedCallback(
    _name: string,
    _oldValue: string,
    _newValue: string,
  ) {
    throw new Error("not implemented");
  }

  update() {
    this.inHour = <SlInput> this.querySelector("#inHour");
    this.inMinute = <SlInput> this.querySelector("#inMinute");
    this.inSecond = <SlInput> this.querySelector("#inSecond");
    this.btnStart = <SlButton> this.querySelector("#btnCountdownStart");
    this.btnStop = <SlButton> this.querySelector("#btnCountdownStop");
    this.btnReset = <SlButton> this.querySelector("#btnCountdownReset");
    this.countdown = <TPClock> this.querySelector("#timeCountdown");

    this.btnStart.addEventListener("click", () => {
      this.countdown?.start();
      if (this.popCountdown) {
        this.popCountdown.start();
      }
    });

    this.btnStop.addEventListener("click", () => {
      this.countdown?.stop();
      if (this.popCountdown) {
        this.popCountdown.stop();
      }
    });

    this.btnReset.addEventListener("click", () => {
      this.countdown?.setAttribute("timer", this.value());
      this.countdown?.reset();
      if (this.popCountdown) {
        this.popCountdown.setAttribute("timer", this.value());
        this.popCountdown.reset();
      }
    });
  }

  value(): string {
    return `${this.inHour.value}:${this.inMinute.value}:${this.inSecond.value}`;
  }
}

function registerClockControlComponent() {
  customElements.define("tp-clock-control", TPClockControl);
}

const dateOptions: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
};

/**
 * Teleprompter Countdown clock component. Extends HTMLTimeElement.
 *
 * Usage:
 * <time is="tp-clock" type="clock" countdown="01:02:03"></time>
 * countdown="hh:mm:ss" to countdown from.
 */
class TPClock extends HTMLTimeElement {
  // TODO: is this actually a good case for inheritance?
  // Each differenty type of clock having the same methods by slightly different implementations?
  static observedAttributes = ["countdown"];

  // TODO: should this be an enum?
  type: string = "clock";
  interval: number = -1;
  targetDate: Date = new Date();
  negative: boolean = false;

  constructor() {
    super();
  }

  tick() {
    let diff = 1;
    let locStr = this.targetDate.toLocaleTimeString("en-ZA", dateOptions);
    switch (this.type) {
      case "clock":
        this.textContent = new Date().toLocaleTimeString("en-ZA", dateOptions);
        return;
      case "timer":
        if (this.negative) {
          break;
        }
        if (locStr == "00:00:00") {
          this.negative = true;
          this.classList.add("negative");
          break;
        }
        diff = -1;
        break;
    }
    this.targetDate.setSeconds(this.targetDate.getSeconds() + diff);
    if (this.negative) {
      this.textContent = "-";
    } else {
      this.textContent = "";
    }
    // Remove hour zeroes:
    if (this.targetDate.getHours() === 0) {
      locStr = locStr.substring(3);
    }
    this.textContent += locStr;
  }

  start() {
    if (this.interval !== -1) return;
    this.tick();
    this.interval = setInterval(() => {
      this.tick();
    }, 1000);
  }

  stop() {
    clearInterval(this.interval);
    this.interval = -1;
  }

  reset() {
    this.stop();
    this.parseTimer();
  }

  parseTimer() {
    const timer = this.getAttribute("timer");
    if (!timer) {
      throw new Error("timer attribute is required for timer type");
    }
    const [hours, minutes, seconds] = timer.split(":");
    this.targetDate = new Date();
    this.targetDate.setHours(parseInt(hours, 10));
    this.targetDate.setMinutes(parseInt(minutes, 10));
    this.targetDate.setSeconds(parseInt(seconds, 10));
    this.textContent = this.targetDate.toLocaleTimeString("en-ZA", dateOptions);
    this.negative = false;
    this.classList.remove("negative");
  }

  connectedCallback() {
    const clockType = this.getAttribute("type");
    if (!clockType) {
      throw Error("type attribute is required");
    }
    this.type = clockType;
    switch (clockType) {
      case "clock":
        this.start();
        break;
      case "timer":
        this.parseTimer();
        break;
      case "timerUp":
        this.targetDate = new Date(0, 0);
        // this.start()
        break;
      case "countdown":
        break;
      default:
        throw new Error(`Unknown clock type: ${clockType}`);
    }
  }

  disconnectedCallback() {
    this.stop();
  }

  adoptedCallback() {
    throw new Error("Not implemented");
  }

  attributeChangedCallback(name: string, _oldValue: string, _newValue: string) {
    if (this.type === "countdown" && name === "countdown") {
      this.parseTimer();
    }
  }
}

function registerClockComponent() {
  customElements.define("tp-clock", TPClock, { extends: "time" });
}

export {
  registerClockComponent,
  registerClockControlComponent,
  TPClock,
  TPClockControl,
};
