// Store theme color data
let themeOriginalColors: string[] = [];

enum ThemeType {
  LIGHT = "light",
  DARK = "dark",
}

class Theme {
  public readonly themeMeta: string = 'meta[name="theme-color"]';
  private readonly themeOverride: string = "color-scheme";
  private readonly themeDefault: ThemeType = ThemeType.DARK;

  private schemeType(scheme: ThemeType): string {
    return `(prefers-color-scheme: ${scheme})`;
  }

  /**
   * Get current theme
   * @method get
   * @returns {ThemeType} Current theme value
   */
  private get(): ThemeType {
    const override: string | null = document.documentElement.getAttribute(
      this.themeOverride,
    );
    if (override) return override as ThemeType;

    if (window.matchMedia) {
      if (window.matchMedia(this.schemeType(ThemeType.DARK)).matches)
        return ThemeType.DARK;
      if (window.matchMedia(this.schemeType(ThemeType.LIGHT)).matches)
        return ThemeType.LIGHT;
    }

    return this.themeDefault;
  }

  /**
   * Toggle between light and dark themes
   * @method set
   */
  set(): void {
    const next: ThemeType =
      this.get() === ThemeType.DARK ? ThemeType.LIGHT : ThemeType.DARK;

    if (window.matchMedia?.(this.schemeType(next)).matches) {
      document.documentElement.removeAttribute(this.themeOverride);
      const metaTheme: NodeListOf<HTMLElement> =
        document.querySelectorAll<HTMLElement>(this.themeMeta);
      themeOriginalColors.forEach((color, i) =>
        metaTheme[i]?.setAttribute("content", color),
      );
    } else {
      document.documentElement.setAttribute(this.themeOverride, next);
      const colorIndex: number = next === ThemeType.DARK ? 0 : 1;
      document
        .querySelectorAll<HTMLElement>(this.themeMeta)
        .forEach((el) =>
          el.setAttribute("content", themeOriginalColors[colorIndex]),
        );
    }
  }

  private readonly toggleRate: number = 250;
  private toggleLast: number = 0;

  /**
   * Throttle theme toggle
   * @returns {boolean
   */
  public rateLimit(): boolean {
    const now: number = Date.now();
    if (now - this.toggleLast <= this.toggleRate) return true;
    this.toggleLast = now;
    return false;
  }
}

const theme: Theme = new Theme();

// Header state types
enum HeaderState {
  SHOW,
  HIDE,
  ONLOAD,
}

class UIController {
  // Manage header state
  private headerPast: number = window.scrollY;
  private headerActive: boolean = false;
  private headerState: HeaderState = HeaderState.ONLOAD;
  private headerPresent: boolean = true;
  private headerDeadZoneTop: number = 100;
  private readonly headerHideClass: string = "hide";
  private readonly isMobileSafari: boolean =
    !CSS.supports("user-select: none") &&
    !window.matchMedia("(hover: hover)").matches;

  /**
   * Controls header state based on scroll position
   * @method header
   * @returns {void}
   */
  public header(): void {
    if (!this.headerPresent || this.overscrollDeadZone()) return;

    const el: HTMLElement | null =
      document.querySelector<HTMLElement>("header");
    if (!el) {
      console.error("Header missing — suspending header UI controller");
      this.headerPresent = false;
      return;
    }

    const y: number = window.scrollY;
    const scrollingUp: boolean = y <= this.headerPast;
    const scrollingDownPastThreshold: boolean =
      y > this.headerDeadZoneTop && y > this.headerPast;

    if (!this.headerActive && scrollingUp) {
      // Show header when scrolling up
      this.headerState = HeaderState.SHOW;
      el.classList.remove(this.headerHideClass);
      this.headerActive = true;
    } else if (this.headerActive && scrollingDownPastThreshold) {
      // Hide header when scrolling down past threshold
      this.headerState = HeaderState.HIDE;
      el.classList.add(this.headerHideClass);
      this.headerActive = false;
    } else if (
      !this.headerActive &&
      y > 0 &&
      this.headerState !== HeaderState.ONLOAD
    ) {
      // Hide header on initial scroll after page load
      this.headerState = HeaderState.ONLOAD;
      el.classList.add(this.headerHideClass);
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
      document.getElementById(selector) ??
      document.querySelector<HTMLElement>(selector);
    if (!el) {
      console.error(`Cannot scroll to nonexistent element: ${selector}`);
      return;
    }
    window.scrollTo({
      top: el.offsetTop,
      behavior: window.matchMedia?.("(prefers-reduced-motion)")?.matches
        ? "instant"
        : "smooth",
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
    const scrollable: number =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight;
    return scrollable - window.scrollY <= deadZone;
  }
}

const uiController: UIController = new UIController();

class EventController {
  public readonly selector: string = ".card, .button-link, .theme-invert-icon";

  /**
   * Handle click events on interactive elements
   * @method init
   * @param event {Event} Click event
   * @returns {void}
   */
  public init(event: Event): void {
    event.preventDefault();

    const buttonElement = event.target as HTMLElement;
    const firstClass: string | null = buttonElement.classList[0];

    if (!firstClass) return;

    switch (firstClass) {
      case "card":
      case "button-link": {
        const href: string | null = buttonElement.getAttribute("href");
        if (href) location.href = href;
        break;
      }
      case "theme-invert-icon": {
        if (!theme || theme.rateLimit()) return;
        theme.set();
        break;
      }
    }
  }
}

const eventController: EventController = new EventController();

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

    const sanitized: string = body
      .replaceAll('"', "&quot;")
      .replaceAll("\n", "<br>");
    dialogElement.querySelector<HTMLElement>(".header")!.innerHTML = title;
    dialogElement.querySelector<HTMLElement>(".body")!.innerHTML = sanitized;
    dialogElement.showModal();
    dialogElement.querySelector<HTMLElement>(".close")?.blur();
  }

  /**
   * Close dialog box
   * @method open
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
    for (const sel of [".header", ".body"]) {
      const el: HTMLElement | null =
        dialogElement.querySelector<HTMLElement>(sel);
      if (el) el.innerHTML = "";
    }
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
    "Enter",
  ];

  /**
   * Generate audio tone
   * @method playTone
   * @returns {void}
   */
  private playTone(): void {
    const ctx = new AudioContext();
    const oscillator: OscillatorNode = ctx.createOscillator();
    const gain: GainNode = ctx.createGain();

    oscillator.type = "triangle";
    oscillator.frequency.value = 90;
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start();

    const end: number = ctx.currentTime + this.initAudioDuration / 1000;
    gain.gain.exponentialRampToValueAtTime(0.00001, end);
    oscillator.stop(end + 0.1);
  }

  /**
   * Run payload
   * @method payload
   * @returns {void}
   */
  private payload(): void {
    dialogController.open("Egg", "Here is some audio.");
    this.playTone();

    const audio: HTMLAudioElement = new Audio(this.audioFile);
    audio.volume = 0.6;
    setTimeout(async () => {
      try {
        await audio.play();
      } catch (e) {
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
    const key: string =
      event.key.length === 1 ? event.key.toUpperCase() : event.key;
    this.keysPressed.push(key);

    const expected: string = this.keysCombo[this.keysPressed.length - 1];
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
  const revealToggle: HTMLElement | null =
    document.querySelector<HTMLElement>(".theme-invert");
  if (!revealToggle) {
    console.error("Unable to show theme toggle - element not found");
  } else {
    revealToggle.classList.remove("hide");
  }

  document.addEventListener("click", (event: PointerEvent): void => {
    const target = event.target as HTMLElement;

    // Handle theme toggle
    if (target.matches(eventController.selector)) eventController.init(event);

    // Handle header scroll
    if (target.matches("header .title")) uiController.scrollHandler(event);

    // Handle dialog close
    if (target.matches("dialog .close"))
      dialogController.close(event as MouseEvent);
  });

  try {
    document
      .querySelectorAll<HTMLElement>(theme.themeMeta)
      .forEach((element: Element) => {
        themeOriginalColors.push(element.getAttribute("content") ?? "");
      });
  } catch (error) {
    console.error("Failed to initialize theme metadata:", error);
  }

  try {
    uiController.header();
    window.onscroll = (): void => uiController.header();
  } catch (error) {
    console.error("Failed to initialize UI components:", error);
  }

  document.addEventListener("keydown", egg.initiate);
});
