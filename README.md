W3C Generic Sensor API polyfills
===

This is a polyfill for [Generic Sensor](https://w3c.github.io/sensors/)-based [motions sensors](https://w3c.github.io/motion-sensors/) to make migration from the old [DeviceOrientationEvent](https://w3c.github.io/deviceorientation/spec-source-orientation.html#deviceorientation)/[DeviceMotionEvent](https://w3c.github.io/deviceorientation/spec-source-orientation.html#devicemotion) to the new APIs a smoother experience.

In particular, this polyfill will allow the users of modern browsers to get a feel of the new API shape before it ships more broadly.

`src/motion-sensors.js` implements the following interfaces:

- [`Sensor`](https://w3c.github.io/sensors/#the-sensor-interface)
- [`Accelerometer`](https://w3c.github.io/accelerometer/#accelerometer-interface)
- [`LinearAccelerationSensor`](https://w3c.github.io/accelerometer/#linearaccelerationsensor-interface)
- [`GravitySensor`](https://w3c.github.io/accelerometer/#gravitysensor-interface)
- [`Gyroscope`](https://w3c.github.io/gyroscope/#gyroscope-interface)
- [`RelativeOrientationSensor`](https://w3c.github.io/orientation-sensor/#relativeorientationsensor-interface)
- [`AbsoluteOrientationSensor`](https://w3c.github.io/orientation-sensor/#absoluteorientationsensor-interface)

`src/geolocation.js` implements the following interface:

- [`GeolocationSensor`](https://w3c.github.io/geolocation-sensor/#geolocationsensor-interface)

How to use the polyfill
===

- Copy [`src/motion-sensors.js`](https://raw.githubusercontent.com/kenchris/sensor-polyfills/master/src/motion-sensors.js) ([source](https://github.com/kenchris/sensor-polyfills/blob/master/src/motion-sensors.js)) into your project, or install via [npm](https://www.npmjs.com/package/motion-sensors-polyfill ) (`$ npm i motion-sensors-polyfill`).
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
- That's it. See [AbsoluteOrientationSensor demo](https://intel.github.io/generic-sensor-demos/orientation-phone/) and [RelativeOrientationSensor demo](https://intel.github.io/generic-sensor-demos/orientation-phone/?relative=1) ([code](https://github.com/intel/generic-sensor-demos/blob/master/orientation-phone/index.html)) for examples.

How to enable the native implementation in Chrome
===

*Chrome 67 or later:* the native implementation is enabled by default.

The Generic Sensor Extra Classes (`chrome://flags/#enable-generic-sensor-extra-classes`) feature flag can be activated to enable a few additional sensor types:
- `AmbientLightSensor`
- `Magnetometer`

Test suite
===

Run [web-platform-tests](https://github.com/w3c/web-platform-tests/) with this polyfill enabled [here](https://kenchris.github.io/sensor-polyfills/run-tests.html).

Known issues
===

- `AbsoluteOrientationSensor` on iOS uses non-standard [`webkitCompassHeading`](https://developer.apple.com/documentation/webkitjs/deviceorientationevent/1804777-webkitcompassheading) that reports wrong readings if the device is held in its [`portrait-secondary`](https://w3c.github.io/screen-orientation/#dom-orientationtype-portrait-secondary) orientation. Specifically, the `webkitCompassHeading` flips by 180 degrees when tilted only slightly.

Learn more
===

- [Sensors For The Web article on Google's Web Fundaments](https://developers.google.com/web/updates/2017/09/sensors-for-the-web) - a web developer-oriented article explaining how to use the Generic Sensor-based APIs.

Reporting a security issue
===
If you have information about a security issue or vulnerability with an Intel-maintained open source project on https://github.com/intel, please send an e-mail to secure@intel.com. Encrypt sensitive information using our PGP public key. For issues related to Intel products, please visit https://security-center.intel.com.
