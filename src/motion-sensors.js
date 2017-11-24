// @ts-check
const slot = window["__sensor__"] = Symbol("__sensor__");

function defineProperties(target, descriptions) {
  for (const property in descriptions) {
    Object.defineProperty(target, property, {
      configurable: true,
      value: descriptions[property]
    });
  }
}

class EventTarget {
  constructor() {
    this[slot] = new WeakMap;
    const _listeners = {};

    const defineOnEventListener = type => {
      Object.defineProperty(this, `on${type}`, {
        set: value => {
          let listeners = _listeners[type] || (_listeners[type] = [ null ]);
          listeners[0] = { target: this, listener: value };
        },
        get: () => {
          let listeners = _listeners[type] || (_listeners[type] = [ null ]);
          return listeners[0];
        }
      });
    };

    const addEventListener = (type, listener, options) => {
      let listeners = _listeners[type] || (_listeners[type] = [ null ]);
      if (listeners.findIndex(entry => entry && entry.listener === listener) < 1) {
        listeners.push({ target: this, listener: listener, options: options });
      }
    };

    const removeEventListener = (type, listener, options) => {
      let listeners = _listeners[type];
      if (listeners) {
        const index = listeners.findIndex(entry => entry && entry.listener === listener);
        if (index > 0) {
          listeners.splice(index, 1);
        }
      }
    };

    const dispatchEvent = (event) => {
      const listeners = _listeners[event.type];
      if (listeners) {
        defineProperties(event, { currentTarget: this, target: this });

        for (const { target, listener, options } of listeners) {
          if (options && options.once) {
            removeEventListener.call(target, event.type, listener, options);
          }
          if (typeof listener === 'function') {
            listener.call(target, event);
          } else {
            listener.handleEvent(event);
          }
        }

        defineProperties(event, { currentTarget: null, target: null });
      }
      return true;
    }

    defineProperties(this, {
      addEventListener: addEventListener,
      removeEventListener: removeEventListener,
      dispatchEvent: dispatchEvent
    });

    this[slot].defineOnEventListener = defineOnEventListener
  }
}

function defineReadonlyProperties(target, slot, descriptions) {
  const propertyBag = target[slot] || (target[slot] = new WeakMap);
  for (const property in descriptions) {
    propertyBag[property] = descriptions[property];
    Object.defineProperty(target, property, {
      get: () => propertyBag[property]
    });
  }
}

export class Sensor extends EventTarget {
  constructor(options) {
    super();
    this[slot].defineOnEventListener("reading");
    this[slot].defineOnEventListener("activate");
    this[slot].defineOnEventListener("error");

    defineReadonlyProperties(this, slot, {
      activated: false,
      hasReading: false,
      timestamp: 0
    })

    this[slot].frequency = null;

    if (window && window.parent != window.top) {
      throw new DOMException("Only instantiable in a top-level browsing context", "SecurityError");
    }

    if (options && typeof(options.frequency) == "number") {
      if (options.frequency > 60) {
        this.frequency = options.frequency;
      }
    }
  }

  start() { }
  stop() { }
}

const DeviceOrientationMixin = (superclass, eventName) => class extends superclass {
  constructor(...args) {
    super(args);
  }

  start() {
    super.start();

    let activate = new Event("activate");
    window.addEventListener(eventName, this[slot].handleEvent, false);
    this[slot].activated = true;
    this.dispatchEvent(activate);
  }

  stop() {
    super.stop();

    window.removeEventListener(eventName, this[slot].handleEvent, false);
    this[slot].activated = false;
  }
};

// Tait-Bryan angles of type Z-X'-Y'' (alpha, beta, gamma)

function toQuaternionFromMat(mat) {
  const w = Math.sqrt(1.0 + mat[0] + mat[5] + mat[10]) / 2.0;
  const w4 = (4.0 * w);
  const x = (mat[9] - mat[6]) / w4;
  const y = (mat[2] - mat[8]) / w4;
  const z = (mat[4] - mat[1]) / w4;

  return [x, y, z, w];
}

function toQuaternionFromEuler(alpha, beta, gamma) {
  const degToRad = Math.PI / 180

  const x = (beta || 0) * degToRad;
  const y = (gamma || 0) * degToRad;
  const z = (alpha || 0) * degToRad;

  const cZ = Math.cos(z * 0.5);
  const sZ = Math.sin(z * 0.5);
  const cY = Math.cos(y * 0.5);
  const sY = Math.sin(y * 0.5);
  const cX = Math.cos(x * 0.5);
  const sX = Math.sin(x * 0.5);

  const qx = sX * cY * cZ - cX * sY * sZ;
  const qy = cX * sY * cZ + sX * cY * sZ;
  const qz = cX * cY * sZ + sX * sY * cZ;
  const qw = cX * cY * cZ - sX * sY * sZ;

  return [qx, qy, qz, qw];
}

function toMat4FromQuat(mat, q) {
  const typed = mat instanceof Float32Array || mat instanceof Float64Array;

  const m11 = 1 - 2 * (q[1] ** 2 + q[2] ** 2);
  const m12 = 2 * (q[0] * q[1] - q[2] * q[3]);
  const m13 = 2 * (q[0] * q[2] + q[1] * q[3]);

  const m21 = 2 * (q[0] * q[1] + q[2] * q[3]);
  const m22 = 1 - 2 * (q[0] ** 2 + q[2] ** 2);
  const m23 = 2 * (q[1] * q[2] - q[0] * q[3]);

  const m31 = 2 * (q[0] * q[2] - q[1] * q[3]);
  const m32 = 2 * (q[1] * q[2] + q[0] * q[3]);
  const m33 = 1 - 2 * (q[0] ** 2 + q[1] ** 2);

  if (typed && mat.length >= 16) {
    mat.set([m11, m12, m13, 0], 0);
    mat.set([m21, m22, m23, 0], 4);
    mat.set([m31, m32, m33, 0], 8);
    mat.set([0, 0, 0, 1], 12);
  } else if (mat instanceof DOMMatrix) {
    mat.m11 = m11; mat.m12 = m12; mat.m13 = m13; mat.m14 = 0;
    mat.m21 = m21; mat.m22 = m22; mat.m23 = m23; mat.m24 = 0;
    mat.m31 = m31; mat.m32 = m32; mat.m33 = m33; mat.m34 = 0;
    mat.m41 = 0; mat.m42 = 0; mat.m43 = 0; mat.m44 = 1;
  }

  return mat;
}

// from: https://w3c.github.io/deviceorientation/spec-source-orientation.html#worked-example-2
function toMat4FromEuler(mat, alpha, beta, gamma) {
  const degToRad = Math.PI / 180

  const x = (beta || 0) * degToRad;
  const y = (gamma || 0) * degToRad;
  const z = (alpha || 0) * degToRad;

  var cX = Math.cos(x);
  var cY = Math.cos(y);
  var cZ = Math.cos(z);
  var sX = Math.sin(x);
  var sY = Math.sin(y);
  var sZ = Math.sin(z);

  const typed = mat instanceof Float32Array || mat instanceof Float64Array;

  const m11 = cZ * cY - sZ * sX * sY;
  const m12 = - cX * sZ;
  const m13 = cY * sZ * sX + cZ * sY;

  const m21 = cY * sZ + cZ * sX * sY;
  const m22 = cZ * cX;
  const m23 = sZ * sY - cZ * cY * sX;

  const m31 = - cX * sY;
  const m32 = sX;
  const m33 = cX * cY;

  if (typed && mat.length >= 16) {
    mat.set([m11, m12, m13, 0], 0);
    mat.set([m21, m22, m23, 0], 4);
    mat.set([m31, m32, m33, 0], 8);
    mat.set([0, 0, 0, 1], 12);
  } else if (mat instanceof DOMMatrix) {
    mat.m11 = m11; mat.m12 = m12; mat.m13 = m13; mat.m14 = 0;
    mat.m21 = m21; mat.m22 = m22; mat.m23 = m23; mat.m24 = 0;
    mat.m31 = m31; mat.m32 = m32; mat.m33 = m33; mat.m34 = 0;
    mat.m41 = 0; mat.m42 = 0; mat.m43 = 0; mat.m44 = 1;
  }

  return mat;
};

class SensorErrorEvent extends Event {
  constructor(type, errorEventInitDict) {
    super(type, errorEventInitDict);

    if (!errorEventInitDict || !errorEventInitDict.error instanceof DOMException) {
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

export class RelativeOrientationSensor extends DeviceOrientationMixin(Sensor, "deviceorientation") {
  constructor(options) {
    super(options);
    this[slot].handleEvent = event => {
      // If there is no sensor we will get values equal to null.
      if (event.absolute || event.alpha === null) {
        // Spec: The implementation can still decide to provide
        // absolute orientation if relative is not available or
        // the resulting data is more accurate. In either case,
        // the absolute property must be set accordingly to reflect
        // the choice.

        let error = new SensorErrorEvent("error", {
          error: new DOMException("Could not connect to a sensor")
        });
        this.dispatchEvent(error);

        this.stop();
        return;
      }

      this[slot].timestamp = performance.now();

      this[slot].alpha = event.alpha;
      this[slot].beta = event.beta;
      this[slot].gamma = event.gamma;
      this[slot].quaternion = toQuaternionFromEuler(event.alpha, event.beta, event.gamma);

      this[slot].hasReading = true;
      this.dispatchEvent(new Event("reading"));
    }

    defineReadonlyProperties(this, slot, {
      quaternion: null
    });

    Object.defineProperty(this, "__quaternionQMatrix", {
      get: () => {
        let mat = new Float32Array(16);
        this.populateMatrix(mat);
        return toQuaternionFromMat(mat);
      }
    });
    Object.defineProperty(this, "__quaternionEMatrix", {
      get: () => {
        let mat = new Float32Array(16);
        this.__populateMatrixEuler(mat);
        return toQuaternionFromMat(mat);
      }
    });
  }

  populateMatrix(mat) {
    toMat4FromQuat(mat, this[slot].quaternion);
  }

  __populateMatrixEuler(mat) {
    toMat4FromEuler(mat, this[slot].alpha, this[slot].beta, this[slot].gamma);
  }
}

export class AbsoluteOrientationSensor extends DeviceOrientationMixin(Sensor, "deviceorientationabsolute") {
  constructor(options) {
    super(options);
    this[slot].handleEvent = event => {
      // If there is no sensor or we cannot get absolute values,
      // we will get values equal to null.
      if (!event.absolute || event.alpha === null) {
        // Spec: If an implementation can never provide absolute
        // orientation information, the event should be fired with
        // the alpha, beta and gamma attributes set to null.

        let error = new SensorErrorEvent("error", {
          error: new DOMException("Could not connect to a sensor")
        });
        this.dispatchEvent(error);

        this.stop();
        return;
      }

      this[slot].timestamp = performance.now();

      this[slot].alpha = event.alpha;
      this[slot].beta = event.beta;
      this[slot].gamma = event.gamma;
      this[slot].quaternion = toQuaternionFromEuler(event.alpha, event.beta, event.gamma);

      this[slot].hasReading = true;
      this.dispatchEvent(new Event("reading"));
    }

    defineReadonlyProperties(this, slot, {
      quaternion: null
    });
  }

  populateMatrix(mat) {
    toMat4FromQuat(mat, this[slot].quaternion);
  }
}

export class Gyroscope extends DeviceOrientationMixin(Sensor, "devicemotion") {
  constructor(options) {
    super(options);
    this[slot].handleEvent = event => {
      // If there is no sensor we will get values equal to null.
      if (false && event.rotationRate.alpha === null) {
        let error = new SensorErrorEvent("error", {
          error: new DOMException("Could not connect to a sensor")
        });
        this.dispatchEvent(error);

        this.stop();
        return;
      }

      this[slot].timestamp = performance.now();

      this[slot].alpha = event.rotationRate.alpha;
      this[slot].beta = event.rotationRate.beta;
      this[slot].gamma = event.rotationRate.gamma;

      this[slot].hasReading = true;
      this.dispatchEvent(new Event("reading"));
    }

    defineReadonlyProperties(this, slot, {
      alpha: null,
      beta: null,
      gamma: null
    });
  }
}

export class Accelerometer extends DeviceOrientationMixin(Sensor, "devicemotion") {
  constructor(options) {
    super(options);
    this[slot].handleEvent = event => {
      // If there is no sensor we will get values equal to null.
      if (event.accelerationIncludingGravity.x === null) {
        let error = new SensorErrorEvent("error", {
          error: new DOMException("Could not connect to a sensor")
        });
        this.dispatchEvent(error);

        this.stop();
        return;
      }

      this[slot].timestamp = performance.now();

      this[slot].x = event.accelerationIncludingGravity.x;
      this[slot].y = event.accelerationIncludingGravity.y;
      this[slot].z = event.accelerationIncludingGravity.z;

      this[slot].hasReading = true;
      this.dispatchEvent(new Event("reading"));
    }

    defineReadonlyProperties(this, slot, {
      alpha: null,
      beta: null,
      gamma: null
    });
  }
}

export class LinearAccelerationSensor extends DeviceOrientationMixin(Sensor, "devicemotion") {
  constructor(options) {
    super(options);
    this[slot].handleEvent = event => {
      // If there is no sensor we will get values equal to null.
      if (event.acceleration.x === null) {
        let error = new SensorErrorEvent("error", {
          error: new DOMException("Could not connect to a sensor")
        });
        this.dispatchEvent(error);

        this.stop();
        return;
      }

      this[slot].timestamp = performance.now();

      this[slot].x = event.acceleration.x;
      this[slot].y = event.acceleration.y;
      this[slot].z = event.acceleration.z;

      this[slot].hasReading = true;
      this.dispatchEvent(new Event("reading"));
    }

    defineReadonlyProperties(this, slot, {
      alpha: null,
      beta: null,
      gamma: null
    });
  }
}

export class GravitySensor extends DeviceOrientationMixin(Sensor, "devicemotion") {
  constructor(options) {
    super(options);
    this[slot].handleEvent = event => {
      // If there is no sensor we will get values equal to null.
      if (event.acceleration.x === null || event.accelerationIncludingGravity.x === null) {
        let error = new SensorErrorEvent("error", {
          error: new DOMException("Could not connect to a sensor")
        });
        this.dispatchEvent(error);

        this.stop();
        return;
      }

      this[slot].timestamp = performance.now();

      this[slot].x = event.accelerationIncludingGravity.x - event.acceleration.x;
      this[slot].y = event.accelerationIncludingGravity.y - event.acceleration.y;
      this[slot].z = event.accelerationIncludingGravity.z - event.acceleration.z;

      this[slot].hasReading = true;
      this.dispatchEvent(new Event("reading"));
    }

    defineReadonlyProperties(this, slot, {
      alpha: null,
      beta: null,
      gamma: null
    });
  }
}