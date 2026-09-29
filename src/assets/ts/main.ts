class UIController {
  private readonly headerElement: HTMLElement | null = document.querySelector<HTMLElement>("header");
  private headerPast: number = window.scrollY;
  private headerActive: boolean = false;
  private headerHiddenOnLoad: boolean = false;
  private readonly headerDeadZoneTop: number = 100;
  private readonly headerHideClass: string = "hide";
  private readonly isMobileSafari: boolean =
    !CSS.supports("user-select: none") && !window.matchMedia("(hover: hover)").matches;

  /**
   * Set initial header state and track scrolling
   * @method init
   * @returns {void}
   */
  public init(): void {
    const header: HTMLElement | null = this.headerElement;
    if (!header) {
      console.error("Header missing — suspending header UI controller");
      return;
    }

    this.header(header);
    window.addEventListener("scroll", (): void => this.header(header), { passive: true });
  }

  /**
   * Controls header state based on scroll position
   * @method header
   * @param header {HTMLElement} Header element
   * @returns {void}
   */
  private header(header: HTMLElement): void {
    if (this.overscrollDeadZone()) return;

    const y: number = window.scrollY;
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
    } else if (!this.headerHiddenOnLoad && !this.headerActive && y > 0) {
      // Hide header on initial scroll after page load
      this.headerHiddenOnLoad = true;
      header.classList.add(this.headerHideClass);
    }

    this.headerPast = y;
  }

  /**
   * Smooth scroll back to the top of the page
   * @method scrollToTop
   * @param event {Event} Event data
   * @returns {void}
   */
  public scrollToTop(event: Event): void {
    event.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion)").matches ? "instant" : "smooth",
    });
  }

  /**
   * Determine if overscroll should be prevented (Safari mobile specific quirk)
   * @method overscrollDeadZone
   * @returns {boolean} true if overscroll should be prevented
   */
  private overscrollDeadZone(): boolean {
    const deadZone: number = this.isMobileSafari ? 110 : 0;
    const scrollable: number = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    return scrollable - window.scrollY <= deadZone;
  }
}

const uiController: UIController = new UIController();

class DialogController {
  /**
   * Dialog box element selection
   * @method dialog
   * @returns {HTMLDialogElement | null}
   */
  private get dialog(): HTMLDialogElement | null {
    return document.querySelector<HTMLDialogElement>("dialog");
  }

  /**
   * Compose a dialog box
   * @method open
   * @param title {string} Title of dialog
   * @param body {string} Body of dialog
   * @returns {void}
   */
  open(title: string, body: string): void {
    const dialogElement: HTMLDialogElement | null = this.dialog;
    if (!dialogElement) {
      console.error("Cannot build message without dialog being present");
      return;
    }

    const bodyHtml: string = body.replaceAll("\n", "<br>");
    dialogElement.querySelector<HTMLElement>(".header")!.innerHTML = title;
    dialogElement.querySelector<HTMLElement>(".body")!.innerHTML = bodyHtml;
    dialogElement.showModal();
    dialogElement.querySelector<HTMLElement>(".close")?.blur();
  }

  /**
   * Close dialog box
   * @method close
   * @param event {MouseEvent} Mouse event
   * @returns {void}
   */
  close(event: MouseEvent): void {
    event.preventDefault();

    const dialogElement: HTMLDialogElement | null = this.dialog;
    if (!dialogElement) {
      console.error("Dialog not present while attempting to close");
      return;
    }

    dialogElement.close();
    [".header", ".body"].forEach((sel: string): void => {
      const el: HTMLElement | null = dialogElement.querySelector<HTMLElement>(sel);
      if (el) el.innerHTML = "";
    });
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

  /**
   * Generate audio tone
   * @method playTone
   * @returns {void}
   */
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
  }

  /**
   * Run payload
   * @method payload
   * @returns {void}
   */
  private payload(): void {
    dialogController.open("egg", "Here is some audio.");
    this.playTone();

    const audio: HTMLAudioElement = new Audio(this.audioFile);
    audio.volume = 0.6;
    setTimeout((): void => {
      audio.play().catch((e: unknown): void => console.warn("Audio playback failed:", e));
    }, this.initAudioDuration);
  }

  /**
   * Handle keyboard input for payload
   * @method initiate
   * @returns {void}
   */
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

document.addEventListener("DOMContentLoaded", (): void => {
  document.addEventListener("click", (event: PointerEvent): void => {
    const target: HTMLElement = event.target as HTMLElement;

    // Handle header scroll
    if (target.closest("header .title")) uiController.scrollToTop(event);
    // Handle dialog close
    if (target.matches("dialog .close")) dialogController.close(event);
  });

  uiController.init();

  document.addEventListener("keydown", egg.initiate);
});
