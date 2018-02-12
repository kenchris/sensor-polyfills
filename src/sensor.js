// @ts-check

function defineProperties(target, descriptions) {
  for (const property in descriptions) {
    Object.defineProperty(target, property, {
      configurable: true,
      value: descriptions[property]
    });
  }
}

export const EventTargetMixin = (superclass, ...eventNames) => class extends superclass {
  constructor(...args) {
    // @ts-ignore
    super(args);
    const eventTarget = document.createDocumentFragment();

    this.addEventListener = (type, ...args) => {
      return eventTarget.addEventListener(type, ...args);
    }

    this.removeEventListener = (...args) => {
      // @ts-ignore
      return eventTarget.removeEventListener(...args);
    }

    this.dispatchEvent = (event) => {
      defineProperties(event, { currentTarget: this });
      if (!event.target) {
        defineProperties(event, { target: this });
      }

      const methodName = `on${event.type}`;
      if (typeof this[methodName] == "function") {
          this[methodName](event);
      }

      const retValue = eventTarget.dispatchEvent(event);

      if (retValue && this.parentNode) {
        this.parentNode.dispatchEvent(event);
      }

      defineProperties(event, { currentTarget: null, target: null });

      return retValue;
    }
  }
};

export class EventTarget extends EventTargetMixin(Object) {};

export function defineReadonlyProperties(target, slot, descriptions) {
  const propertyBag = target[slot];
  for (const property in descriptions) {
    propertyBag[property] = descriptions[property];
    Object.defineProperty(target, property, {
      get: () => propertyBag[property]
    });
  }
}

class SensorErrorEvent extends Event {
  constructor(type, errorEventInitDict) {
    super(type, errorEventInitDict);

    if (!errorEventInitDict || !(errorEventInitDict.error instanceof DOMException)) {
      throw TypeError(
        "Failed to construct 'SensorErrorEvent':" +
        "2nd argument much contain 'error' property"
      );
    }

    Object.defineProperty(this, "error", {
      configurable: false,
      writable: false,
      value: errorEventInitDict.error
    });
  }
};

function defineOnEventListener(target, name) {
  Object.defineProperty(target, `on${name}`, {
    enumerable: true,
    configurable: false,
    writable: true,
    value: null
  });
}

const SensorState = {
  IDLE: 1,
  ACTIVATING: 2,
  ACTIVE: 3,
}

export const __sensor__ = Symbol("__sensor__");
const slot = __sensor__;

export const notifyError = Symbol("Sensor.notifyError");
export const notifyActivatedState = Symbol("Sensor.notifyActivatedState");

export const activateCallback = Symbol("Sensor.activateCallback");
export const deactivateCallback = Symbol("Sensor.deactivateCallback");

export class Sensor extends EventTarget {
  [__sensor__] = {
    // Internal slots
    state: SensorState.IDLE,
    frequency: null,

    // Property backing
    activated: false,
    hasReading: false,
    timestamp: null
  };

  [activateCallback]() {}
  [deactivateCallback]() {}

  [notifyError](message, name) {
    let error = new SensorErrorEvent("error", {
      error: new DOMException(message, name)
    });
    this.dispatchEvent(error);
    this.stop();
  }

  [notifyActivatedState]() {
    let activate = new Event("activate");
    this[slot].activated = true;
    this.dispatchEvent(activate);
    this[slot].state = SensorState.ACTIVE;
  }

  constructor(options) {
    super();

    defineOnEventListener(this, "reading");
    defineOnEventListener(this, "activate");
    defineOnEventListener(this, "error");

    Object.defineProperty(this, "activated", {
      get: () => this[slot].activated
    });
    Object.defineProperty(this, "hasReading", {
      get: () => this[slot].hasReading
    });
    Object.defineProperty(this, "timestamp", {
      get: () => this[slot].timestamp
    });

    if (window && window.parent != window.top) {
      throw new DOMException(
        "Only instantiable in a top-level browsing context",
        "SecurityError"
      );
    }

    if (options && typeof(options.frequency) == "number") {
      if (options.frequency > 60) {
        this.frequency = options.frequency;
      }
    }
  }

  start() {
    if (this[slot].state === SensorState.ACTIVATING
        || this[slot].state === SensorState.ACTIVE) {
      return;
    }
    this[slot].state = SensorState.ACTIVATING;
    this[activateCallback]();
  }

  stop() {
    if (this[slot].state === SensorState.IDLE) {
      return;
    }
    this[slot].activated = false;
    this[slot].hasReading = false;
    this[slot].timestamp = null;
    this[deactivateCallback]();

    this[slot].state = SensorState.IDLE;
  }
}