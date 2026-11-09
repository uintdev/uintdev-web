class UIController {
  private readonly headerElement: HTMLElement | null = document.querySelector<HTMLElement>("header");
  private headerPast: number = window.scrollY;
  private headerActive: boolean = true;
  private readonly headerDeadZoneTop: number = 100;
  private readonly headerHideClass: string = "hide";
  private readonly isMobileSafari: boolean = CSS.supports("-webkit-touch-callout: none");

  public init(): void {
    const header: HTMLElement | null = this.headerElement;
    if (!header) {
      console.error("Header missing — suspending header UI controller");
      return;
    }

    this.header(header);
    window.addEventListener("scroll", (): void => this.header(header), { passive: true });
  }

  private header(header: HTMLElement): void {
    const y: number = window.scrollY;

    if (this.overscrollDeadZone()) {
      this.headerPast = y;
      return;
    }

    const scrollingUp: boolean = y < this.headerPast;
    const scrollingDownPastThreshold: boolean = y > this.headerDeadZoneTop && y > this.headerPast;

    if (!this.headerActive && scrollingUp) {
      // Show header when scrolling up
      header.classList.remove(this.headerHideClass);
      this.headerActive = true;
    } else if (this.headerActive && scrollingDownPastThreshold) {
      // Hide header when scrolling down past threshold
      header.classList.add(this.headerHideClass);
      this.headerActive = false;
    }

    this.headerPast = y;
  }

  public scrollToTop(event: Event): void {
    event.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion)").matches ? "instant" : "smooth",
    });
  }

  private overscrollDeadZone(): boolean {
    const deadZone: number = this.isMobileSafari ? 110 : 0;
    const scrollable: number = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    return scrollable - window.scrollY <= deadZone;
  }
}

const uiController: UIController = new UIController();

class DialogController {
  private get dialog(): HTMLDialogElement | null {
    return document.querySelector<HTMLDialogElement>("dialog");
  }

  open(title: string, body: string): void {
    const dialogElement: HTMLDialogElement | null = this.dialog;
    if (!dialogElement) {
      console.error("Cannot build message without dialog being present");
      return;
    }

    dialogElement.querySelector<HTMLElement>(".header")!.textContent = title;
    dialogElement.querySelector<HTMLElement>(".body")!.textContent = body;
    dialogElement.showModal();
    dialogElement.querySelector<HTMLElement>(".close")?.blur();
  }
}

const dialogController: DialogController = new DialogController();

class Egg {
  private readonly audioFile: string = "data/bg_audio.mp3";
  private readonly initAudioDuration: number = 1000;
  private keysMatched: number = 0;
  private readonly keysCombo: string[] = [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "B",
    "A",
  ];

  private playTone(): void {
    const ctx: AudioContext = new AudioContext();
    const oscillator: OscillatorNode = ctx.createOscillator();
    const gain: GainNode = ctx.createGain();
    const end: number = ctx.currentTime + this.initAudioDuration / 1000;

    oscillator.type = "triangle";
    oscillator.frequency.value = 90;
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start();
    gain.gain.exponentialRampToValueAtTime(0.00001, end);
    oscillator.stop(end + 0.1);
    oscillator.onended = (): void => void ctx.close();
  }

  private payload(): void {
    dialogController.open("egg", "Here is some audio.");
    this.playTone();

    const audio: HTMLAudioElement = new Audio(this.audioFile);
    audio.volume = 0.6;
    setTimeout((): void => {
      audio.play().catch((e: unknown): void => console.warn("Audio playback failed:", e));
    }, this.initAudioDuration);
  }

  initiate = (event: KeyboardEvent): void => {
    const key: string = event.key.length === 1 ? event.key.toUpperCase() : event.key;
    this.keysMatched = key === this.keysCombo[this.keysMatched] ? this.keysMatched + 1 : 0;

    if (this.keysMatched === this.keysCombo.length) {
      document.removeEventListener("keydown", this.initiate);
      this.payload();
    }
  };
}

const egg: Egg = new Egg();

document.querySelector("header .title")?.addEventListener("click", (event: Event): void => uiController.scrollToTop(event));
uiController.init();
document.addEventListener("keydown", egg.initiate);
// Re-enable transitions once the first styled frame has been drawn
requestAnimationFrame((): void => {
  requestAnimationFrame((): void => document.documentElement.classList.remove("loading"));
});
