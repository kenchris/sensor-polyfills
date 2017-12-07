W3C Generic Sensor API polyfills
===

*Beware, we're still under active development. Expect rough edges.*

This is a polyfill for [Generic Sensor](https://w3c.github.io/sensors/)-based [motions sensors](https://w3c.github.io/motion-sensors/) to make migration from the old [DeviceOrientationEvent](https://w3c.github.io/deviceorientation/spec-source-orientation.html#deviceorientation)/[DeviceMotionEvent](https://w3c.github.io/deviceorientation/spec-source-orientation.html#devicemotion) to the new APIs a smoother experience.

In particular, this polyfill will allow the users of modern browsers to get a feel of the new API shape before it ships ([Chrome 63 has a native implementation](https://developers.google.com/web/updates/2017/09/sensors-for-the-web)).

`src/motion-sensors.js` implements the following interfaces:

- [`Sensor`](https://w3c.github.io/sensors/#the-sensor-interface)
- [`Accelerometer`](https://w3c.github.io/accelerometer/#accelerometer-interface)
- [`LinearAccelerationSensor`](https://w3c.github.io/accelerometer/#linearaccelerationsensor-interface)
- [`GravitySensor`](https://w3c.github.io/accelerometer/#gravitysensor-interface)
- [`Gyroscope`](https://w3c.github.io/gyroscope/#gyroscope-interface)
- [`RelativeOrientationSensor`](https://w3c.github.io/orientation-sensor/#relativeorientationsensor-interface)
- [`AbsoluteOrientationSensor`](https://w3c.github.io/orientation-sensor/#absoluteorientationsensor-interface)

How to use
===

- Copy  [`src/motion-sensors.js`](https://raw.githubusercontent.com/kenchris/sensor-polyfills/master/src/motion-sensors.js) ([source](https://github.com/kenchris/sensor-polyfills/blob/master/src/motion-sensors.js)) into your project, or install via npm (`$ npm i motion-sensors-polyfill`).
- Import the motion sensor objects in your HTML (see [`<script type="module">` browser support](https://caniuse.com/#feat=es6-module) or use a [polyfill](https://github.com/ModuleLoader/es-module-loader) to load this polyfill!):
```
<script type="module">
// Import the objects you need.
import {
  Gyroscope,
  AbsoluteOrientationSensor
} from './src/motion-sensors.js';

// And they're ready for use!
let gyroscope = new Gyroscope({ frequency: 15 });
let orientation = new AbsoluteOrientationSensor({ frequency: 60 });
</script>
```
- That's it. See [Orientation phone demo](https://intel.github.io/generic-sensor-demos/orientation-phone/) ([code](https://github.com/intel/generic-sensor-demos/blob/master/orientation-phone/index.html)) for an example.

