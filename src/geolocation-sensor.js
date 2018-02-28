// @ts-check
import {
  __sensor__,
  Sensor,
  SensorErrorEvent,
  activateCallback,
  deactivateCallback,
  notifyActivatedState,
  notifyError,
  AbortController,
  AbortSignal
} from "./sensor.js";

const slot = __sensor__;

async function obtainPermission() {
  let state = "prompt"; // Default for geolocation.
  // @ts-ignore
  if (navigator.permissions) {
    // @ts-ignore
    const permission = await navigator.permissions.query({ name:"geolocation"});
    state = permission.state;
  }

  return new Promise(resolve => {
    if (state === "granted") {
      return resolve(state);
    }

    const successFn = _ => {
      resolve("granted");
    }

    const errorFn = err => {
      if (err.code === err.PERMISSION_DENIED) {
        resolve("denied");
      } else {
        resolve(state);
      }
    }

    const options = { maximumAge: Infinity, timeout: 0 };
    navigator.geolocation.getCurrentPosition(successFn, errorFn, options);
  });
}

async function register(options, onreading, onerror, onactivated) {
  const permission = await obtainPermission();
  if (permission !== "granted") {
    onerror("Permission denied.", "NowAllowedError");
    return;
  }

  const handleEvent = position => {
    const timestamp = position.timestamp - performance.timing.navigationStart;
    const coords = position.coords;

    onreading(timestamp, coords);
  }

  const handleError = error => {
    let type;
    switch(error.code) {
      case error.TIMEOUT:
        type = "TimeoutError";
        break;
      case error.PERMISSION_DENIED:
        type = "NotAllowedError";
        break;
      case error.POSITION_UNAVAILABLE:
        type = "NotReadableError";
        break;
      default:
        type = "UnknownError";
    }
    onerror(error.message, type);
  }

  const watchOptions = {
    enableHighAccuracy: false,
    maximumAge: 0,
    timeout: Infinity
  }

  if (onactivated) {
    onactivated();
  }

  const watchId = navigator.geolocation.watchPosition(
    handleEvent, handleError, watchOptions
  );
  return watchId;
}

function deregister(watchId) {
  navigator.geolocation.clearWatch(watchId);
}

// @ts-ignore
export const GeolocationSensor = window.GeolocationSensor ||
class GeolocationSensor extends Sensor {

  static read(options = {}) {
    return new Promise(async (resolve, reject) => {
      const onerror = (message, name) => {
        let error = new SensorErrorEvent("error", {
          error: new DOMException(message, name)
        });
        deregister(watchId);
        reject(error);
      }

      const onreading = (timestamp, coords) => {
        const reading = {
          timestamp,
          accuracy: coords.accuracy,
          altitude: coords.altitude,
          altitudeAccuracy: coords.altitudeAccuracy,
          heading: coords.heading,
          latitude: coords.latitude,
          longitude: coords.longitude,
          speed: coords.speed
        }
        deregister(watchId);
        resolve(reading);
      }

      const signal = options.signal;
      if (signal && signal.aborted) {
        return reject(new DOMException("Read was cancelled", "AbortError"));
      }

      const watchId = await register(options, onreading, onerror);

      if (signal) {
        signal.addEventListener("abort", () => {
          deregister(watchId);
          reject(new DOMException("Read was cancelled", "AbortError"));
        })
      }
    });
  }

  constructor(options = {}) {
    super(options);

    this[slot].options = options;

    const props = {
      latitude: null,
      longitude: null,
      altitude: null,
      accuracy: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null
    }

    const propertyBag = this[slot];
    for (const propName in props) {
      propertyBag[propName] = props[propName];
      Object.defineProperty(this, propName, {
        get: () => propertyBag[propName]
      });
    }
  }

  [activateCallback]() {
    const onreading = (timestamp, coords) => {
      this[slot].timestamp = timestamp;

      this[slot].accuracy = coords.accuracy;
      this[slot].altitude = coords.altitude;
      this[slot].altitudeAccuracy = coords.altitudeAccuracy;
      this[slot].heading = coords.heading;
      this[slot].latitude = coords.latitude;
      this[slot].longitude = coords.longitude;
      this[slot].speed = coords.speed;

      this[slot].hasReading = true;
      this.dispatchEvent(new Event("reading"));
    };

    const onerror = (message, type) => {
      this[notifyError](message, type);
    };

    const onactivated = () => {
      if (!this[slot].activated) {
        this[notifyActivatedState]();
      }
    }

    register(this[slot].options,
      onreading, onerror, onactivated
    ).then(watchId => this[slot].watchId = watchId);
  };

  [deactivateCallback]() {
    deregister(this[slot].watchId);
    this[slot].timestamp = null;

    this[slot].accuracy = null;
    this[slot].altitude = null;
    this[slot].altitudeAccuracy = null;
    this[slot].heading = null;
    this[slot].latitude = null;
    this[slot].longitude = null;
    this[slot].speed = null;

    this[slot].hasReading = false;
  };
}