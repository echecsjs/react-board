import '@testing-library/jest-dom';

// jsdom does not implement PointerEvent — polyfill it so pointer event
// tests work. We extend MouseEvent to preserve clientX/clientY support.
class PointerEventPolyfill extends MouseEvent {
  height: number;
  isPrimary: boolean;
  pointerId: number;
  pointerType: string;
  pressure: number;
  tangentialPressure: number;
  tiltX: number;
  tiltY: number;
  twist: number;
  width: number;

  constructor(type: string, parameters: PointerEventInit = {}) {
    super(type, parameters);
    this.pointerId = parameters.pointerId ?? 0;
    this.pointerType = parameters.pointerType ?? 'mouse';
    this.isPrimary = parameters.isPrimary ?? true;
    this.pressure = parameters.pressure ?? 0;
    this.tangentialPressure = parameters.tangentialPressure ?? 0;
    this.tiltX = parameters.tiltX ?? 0;
    this.tiltY = parameters.tiltY ?? 0;
    this.twist = parameters.twist ?? 0;
    this.width = parameters.width ?? 1;
    this.height = parameters.height ?? 1;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).PointerEvent = PointerEventPolyfill;

// jsdom does not implement ResizeObserver — provide a no-op stub
globalThis.ResizeObserver = class ResizeObserver {
  disconnect(): void {
    // noop
  }

  observe(): void {
    // noop
  }

  unobserve(): void {
    // noop
  }
};
