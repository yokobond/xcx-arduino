# Arduino
An Arduino extension for [Xcratch](https://xcratch.github.io/)

This extension adds blocks to interact with Arduino boards connected via USB, allowing you to read sensor values and control actuators directly from Xcratch projects.

## ✨ What You Can Do With This Extension

*   **Read Analog Inputs:** Get values from analog sensors connected to pins A0-A5.
*   **Read Digital Inputs:** Detect if a digital pin is HIGH or LOW.
*   **Control Digital Outputs:** Set digital pins HIGH or LOW to control LEDs, relays, etc.
*   **Set Input Bias:** Configure digital input pins with internal pull-up resistors.
*   **Control PWM Outputs:** Set the duty cycle of PWM pins to control motor speed or LED brightness.
*   **Control Servo Motors:** Set the angle of standard servo motors connected to digital pins.

Play [Example Project](https://xcratch.github.io/editor/#https://yokobond.github.io/xcx-arduino/projects/example.sb3) to look at what you can do with the "Arduino" extension.
<iframe src="https://xcratch.github.io/editor/player#https://yokobond.github.io/xcx-arduino/projects/example.sb3" width="540px" height="460px"></iframe>

## How to Use in Xcratch

This extension can be used with other extension in [Xcratch](https://xcratch.github.io/). 
1. Open [Xcratch Editor](https://xcratch.github.io/editor)
2. Click 'Add Extension' button
3. Select 'Extension Loader' extension
4. Type the module URL in the input field 
```
https://yokobond.github.io/xcx-arduino/dist/xcxArduino.mjs
```
5. Click 'OK' button
6. Now you can use the blocks of this extension


## Development

## Arduino Firmware
make sure that it is on a Firmata firmware. To flash it, go to the Arduino IDE.
Go to `Examples > Firmata > StandardFirmata` and upload it to your board.

Confirm the baud rate of your board. Default is 57600, but modern boards may be set to 115200. To change it, go to line 186-189 in arduino-board.js
```js
const port = new SerialPort(nativePort, {
    baudRate: 57600, // default baud rate for firmata
    autoOpen: true
});
```

### Install Dependencies

```sh
npm install
```

### Setup Development Environment

Change ```vmSrcOrg``` to your local ```scratch-vm``` directory in ```./scripts/setup-dev.js``` then run setup-dev script to setup development environment.

```sh
npm run setup-dev
```

### Bundle into a Module

Run build script to bundle this extension into a module file which could be loaded on Xcratch.

```sh
npm run build
```

If you get a babel warning, you may have to run
```sh
npm install @babel/runtime --save
```

### Watch and Bundle

Run watch script to watch the changes of source files and bundle automatically.

```sh
npm run watch
```

### Test

Run test script to test this extension.

```sh
npm run test
```


## 🏠 Home Page

Open this page from [https://yokobond.github.io/xcx-arduino/](https://yokobond.github.io/xcx-arduino/)


## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/yokobond/xcx-arduino/issues).
