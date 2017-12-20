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

How to use the polyfill
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
- That's it. See [AbsoluteOrientationSensor demo](https://intel.github.io/generic-sensor-demos/orientation-phone/) and [RelativeOrientationSensor demo](https://intel.github.io/generic-sensor-demos/orientation-phone/?relative=1) ([code](https://github.com/intel/generic-sensor-demos/blob/master/orientation-phone/index.html)) for examples.

How to enable the native implementation in Chrome
===

There are two ways: *Origin Trial* and *Enable via `chrome://flags`*.

## Origin Trial


Generic Sensor APIs are currently available as an [Origin Trial](https://bit.ly/OriginTrials) in Chrome 63+.

To enable native Generic Sensor API implementation for all Chrome users on your site:

1. Go to https://bit.ly/OriginTrialsSignup to get a token.
2. Add the token to your web page as follows (replace `...` with your token):
```
<!-- Origin Trial Token, feature = Generic Sensors, origin = https://example.org, expires ="2018-01-18" -->
<meta http-equiv="origin-trial" data-feature="Generic Sensors" data-expires="2018-01-18" content="...">
```
3. Optional: add `motion-sensors.js` polyfill to cater for non-Chrome users (see [How to use the polyfill](#how-to-use-the-polyfill)).

## Enable via `chrome://flags`

The native implementation is behind the following feature flags in Chrome 63+:

Generic Sensor (`chrome://flags/#enable-generic-sensor`):
- `Accelerometer`
- `Gyroscope`
- `LinearAccelerationSensor`
- `AbsoluteOrientationSensor`
- `RelativeOrientationSensor`

Generic Sensor Extra Classes (`chrome://flags/#enable-generic-sensor-extra-classes`):
- `AmbientLightSensor`
- `Magnetometer`

Test suite
===

Run [web-platform-tests](https://github.com/w3c/web-platform-tests/) with this polyfill enabled [here](https://kenchris.github.io/sensor-polyfills/run-tests.html).


Known issues
===

- `GravitySensor` and `LinearAccelerationSensor` polyfills do not work on Android with Pixel 2, since [`DeviceMotionEvent`](http://w3c.github.io/deviceorientation/spec-source-orientation.html#devicemotion_event)`.acceleration` returns only null values, see [Chromium bug 796518](https://crbug.com/796518).
- `AbsoluteOrientationSensor` on iOS uses non-standard [`webkitCompassHeading`](https://developer.apple.com/documentation/webkitjs/deviceorientationevent/1804777-webkitcompassheading) that reports wrong readings if the device is held in its [`portrait-secondary`](https://w3c.github.io/screen-orientation/#dom-orientationtype-portrait-secondary) orientation. Specifically, the `webkitCompassHeading` flips by 180 degrees when tilted only slightly.