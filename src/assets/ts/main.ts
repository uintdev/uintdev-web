class UIController {
  private headerElement: HTMLElement | null = document.querySelector<HTMLElement>("header");
  private headerPast: number = window.scrollY;
  private headerActive: boolean = false;
  private headerHiddenOnLoad: boolean = false;
  private headerPresent: boolean = true;
  private readonly headerDeadZoneTop: number = 100;
  private readonly headerHideClass: string = "hide";
  private readonly isMobileSafari: boolean =
    !CSS.supports("user-select: none") && !window.matchMedia("(hover: hover)").matches;

  /**
   * Controls header state based on scroll position
   * @method header
   * @returns {void}
   */
  public header(): void {
    if (!this.headerPresent || this.overscrollDeadZone()) return;

    if (!this.headerElement) {
      console.error("Header missing — suspending header UI controller");
      this.headerPresent = false;
      return;
    }

    const y: number = window.scrollY;
    const scrollingUp: boolean = y < this.headerPast;
    const scrollingDownPastThreshold: boolean = y > this.headerDeadZoneTop && y > this.headerPast;

    if (!this.headerActive && scrollingUp) {
      // Show header when scrolling up
      this.headerElement.classList.remove(this.headerHideClass);
      this.headerActive = true;
    } else if (this.headerActive && scrollingDownPastThreshold) {
      // Hide header when scrolling down past threshold
      this.headerElement.classList.add(this.headerHideClass);
      this.headerActive = false;
    } else if (!this.headerHiddenOnLoad && !this.headerActive && y > 0) {
      // Hide header on initial scroll after page load
      this.headerHiddenOnLoad = true;
      this.headerElement.classList.add(this.headerHideClass);
    }

    this.headerPast = y;
  }

  /**
   * Smooth scroll transition
   * @method scroll
   * @param selector {string} HTML element ID or query selector
   * @returns {void}
   */
  public scroll(selector: string): void {
    const el: HTMLElement | null =
      document.getElementById(selector) ?? document.querySelector<HTMLElement>(selector);
    if (!el) {
      console.error(`Cannot scroll to nonexistent element: ${selector}`);
      return;
    }

    window.scrollTo({
      top: el.offsetTop,
      behavior: window.matchMedia("(prefers-reduced-motion)").matches ? "instant" : "smooth",
    });
  }

  /**
   * Scroll event handler
   * @method scrollHandler
   * @param event {Event} Event data
   * @returns {void}
   */
  public scrollHandler(event: Event): void {
    event.preventDefault();
    this.scroll("body");
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
  private keysPressed: string[] = [];
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
    setTimeout(async (): Promise<void> => {
      try {
        await audio.play();
      } catch (e: unknown) {
        console.warn("Audio playback failed:", e);
      }
    }, this.initAudioDuration);
  }

  /**
   * Handle keyboard input for payload
   * @method initiate
   * @returns {void}
   */
  initiate = (event: KeyboardEvent): void => {
    const key: string = event.key.length === 1 ? event.key.toUpperCase() : event.key;
    this.keysPressed.push(key);

    const expected: string | undefined = this.keysCombo[this.keysPressed.length - 1];
    if (!expected || key !== expected) {
      this.keysPressed = [];
      return;
    }

    if (this.keysPressed.length === this.keysCombo.length) {
      this.keysPressed = [];
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
    if (target.closest("header .title")) uiController.scrollHandler(event);
    // Handle dialog close
    if (target.matches("dialog .close")) dialogController.close(event);
  });

  try {
    uiController.header();
    window.addEventListener("scroll", (): void => uiController.header(), { passive: true });
  } catch (error: unknown) {
    console.error("Failed to initialize UI components:", error);
  }

  document.addEventListener("keydown", egg.initiate);
});
