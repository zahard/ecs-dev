
declare var window: any;

type KeyStatus = {
  isPressed: boolean,
  wasPressed: boolean,
}

export const UserIO = {
  keys: {},

  init() {
    window.addEventListener('keydown', (e) => {
      this.onKeyDown(e.code)
    })
    window.addEventListener('keyup', (e) => {
      this.onKeyUp(e.code)
    })
  },

  keyPressStatus() {
    return ({
      isPressed: true,
      wasPressed: false,
    })
  },
  keyUpStatus() {
    return ({
      isPressed: false,
      wasPressed: true,
    })
  },

  afterTick() {

    Object.values(this.keys).forEach((v: KeyStatus) => v.wasPressed = false);
    
    // Clear keys statuses
  },

  onKeyDown(code: string) {
    this.keys[code] = this.keyPressStatus();
  },

  onKeyUp(code: string) {
    this.keys[code] = this.keyUpStatus();
  },

  keyPressed(code: string) {
    return this.keys[code]?.isPressed || false;
  },

  keyReleased(code: string) {
    return !this.keys[code]?.isPressed;
  },

  keyWasPressed(code: string) {
    if (!this.keys[code]) {
      return false;
    }
    return this.keys[code].wasPressed;
  }
}