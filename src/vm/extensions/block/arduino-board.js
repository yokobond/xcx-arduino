/**
 * Arduino board communication.
 */

// import log from '../../util/log';

import {EventEmitter} from 'events';
import bindTransport from 'firmata-io';
import SerialPort from '@serialport/stream';
import WSABinding from 'web-serial-binding';

const Firmata = bindTransport.Firmata;

/**
 * Returns a Promise which will reject after the delay time passed.
 * @param {number} delay - waiting time to reject in milliseconds
 * @returns {Promise<string>} Promise which will reject with reason after the delay.
 */
const timeoutReject =
    delay => new Promise(
        (_, reject) =>
            setTimeout(() => reject(new Error(`timeout ${delay}ms`)), delay));

// eslint-disable-next-line prefer-const
export let DEBUG = false;

const MODES = {
    INPUT: 0x00,
    OUTPUT: 0x01,
    ANALOG: 0x02,
    PWM: 0x03,
    SERVO: 0x04,
    SHIFT: 0x05,
    I2C: 0x06,
    ONEWIRE: 0x07,
    STEPPER: 0x08,
    SERIAL: 0x0A,
    PULLUP: 0x0B,
    IGNORE: 0x7F,
    PING_READ: 0x75,
    UNKNOWN: 0x10
};

/**
 * This represents an Arduino board.
 */
class ArduinoBoard extends EventEmitter{

    /**
     * Event name for reporting that this board has been released.
     * @const {string}
     */
    static get RELEASED () {
        return 'RELEASED';
    }

    /**
     * Construct a Arduino board object.
     * @param {Runtime} runtime - the Scratch 3.0 runtime
     * @param {string} extensionId - the id of the extension
     */
    constructor (runtime) {
        super();

        this.name = 'ArduinoBoard';

        /**
         * The Scratch runtime to register event listeners.
         * @type {Runtime}
         * @private
         */
        this.runtime = runtime;

        /**
         * ID of the extension which requested to open port.
         * @type {string}
         */
        this.extensionId = null;

        /**
         * State of this board
         * @type {string}
         */
        this.state = 'disconnect';

        /**
         * The Firmata for reading/writing peripheral data.
         * @type {Firmata}
         * @private
         */
        this.firmata = null;

        /**
         * Port information of the connected serial port.
         * @type {object}
         */
        this.portInfo = null;

        /**
         * shortest interval time between digital input readings
         * @type {number}
         */
        this.digitalReadInterval = 20;

        /**
         * Waiting time to connect the board in milliseconds.
         * @type {number}
         */
        this.connectingWaitingTime = 1000;

        /**
         * shortest interval time between analog input readings
         * @type {number}
         */
        this.analogReadInterval = 20;

        /**
         * shortest interval time between message sending
         * @type {number}
         */
        this.sendingInterval = 10;

        /**
         * Waiting time for response of digital input reading in milliseconds.
         * @type {number}
         */
        this.updateDigitalInputWaitingTime = 100;

        /**
         * Waiting time for response of analog input reading in milliseconds.
         * @type {number}
         */
        this.updateAnalogInputWaitingTime = 100;

    }

    /**
     * Setup default settings for Firmata
     * @param {Firmata} firmata set it up
     */
    setupFirmata (firmata) {
        // Setup firmata
        firmata.once('open', () => {
            if (this.firmata !== firmata) return;
            this.state = 'connect';
        });
        firmata.once('close', () => {
            if (this.firmata !== firmata) return;
            if (this.state === 'disconnect') return;
            this.releaseBoard();
        });
        firmata.once('disconnect', error => {
            if (this.firmata !== firmata) return;
            if (this.state === 'disconnect') return;
            this.handleDisconnectError(error);
        });
        firmata.once('error', error => {
            if (this.firmata !== firmata) return;
            if (this.state === 'disconnect') return;
            this.handleDisconnectError(error);
        });
        if (DEBUG) {
            if (this.firmata !== firmata) return;
            firmata.transport.addListener('data', data => {
                console.log(data);
            });
        }
        this.firmata = firmata;
    }

    /**
     * Ask user to open serial port for firmata and return it.
     * @param {object} options - serial port options
     * @returns {SerialPort} opened serial port
     */
    async openSerialPort (options) {
        let nativePort = null;
        nativePort = await navigator.serial.requestPort(options);
        // const permittedPorts = await navigator.serial.getPorts();
        // if ((permittedPorts !== null) && (Array.isArray(permittedPorts)) && (permittedPorts.length > 0)) {
        //     nativePort = permittedPorts[0];
        // } else {
        //     nativePort = await navigator.serial.requestPort(options);
        // }
        SerialPort.Binding = WSABinding;
        const port = new SerialPort(nativePort, {
            baudRate: 57600, // default baud rate for firmata
            autoOpen: true
        });
        this.portInfo = port.path.getInfo();
        return port;
    }

    /**
     * Return connected Arduino board using WebSerial
     * @param {object} options - serial port options
     * @returns {Promise<ArduinoBoard>} a Promise which resolves a connected Arduino board or reject with reason
     */
    connectSerial (options) {
        if (this.firmata) return Promise.resolve(this); // already opened
        this.state = 'portRequesting';
        const request = this.openSerialPort(options)
            .then(port => {
                const firmata = new Firmata(port, {reportVersionTimeout: 0});
                this.setupFirmata(firmata);
                return new Promise(resolve => {
                    firmata.once('ready', () => {
                        if (this.firmata !== firmata) return;
                        this.onBoarReady();
                        resolve(this);
                    });
                });
            });
        // return Promise.race([request, timeoutReject(this.connectingWaitingTime)])
        return request
            .catch(reason => {
                this.releaseBoard();
                return Promise.reject(reason);
            });
    }

    /**
     * Called when a board was ready.
     */
    onBoarReady () {
        const firmInfo = this.firmata.firmware;
        console.log(
            `${firmInfo.name}` +
            `-${String(firmInfo.version.major)}.${String(firmInfo.version.minor)}` +
            ` on: ${JSON.stringify(this.portInfo)}`
        );
        this.firmata.i2cConfig();
        this.state = 'ready';
    }

    /**
     * Whether a board is connected.
     * @returns {boolean} true if a board is connected
     */
    isConnected () {
        return (this.state === 'connect' || this.state === 'ready');
    }

    /**
     * Whether the board is ready to operate.
     * @returns {boolean} true if the board is ready
     */
    isReady () {
        return this.state === 'ready';
    }

    /**
     * Release resources of the board then emit released-event.
     */
    releaseBoard () {
        this.state = 'disconnect';
        if (this.firmata) {
            try {
                if (this.firmata.transport && this.firmata.isOpen) {
                    this.firmata.transport.close();
                }
                this.firmata.removeAllListeners();
            } catch (error) {
                console.error(error);
            }
            this.firmata = null;
        }
        this.extensionId = null;
        this.emit(ArduinoBoard.RELEASED);
    }

    /**
     * Disconnect current connected board.
     */
    disconnect () {
        if (this.state === 'disconnect') return;
        if (this.firmata) {
            this.firmata.reset(); // notify disconnection to board
        }
        this.releaseBoard();
    }

    /**
     * Handle an error resulting from losing connection to a peripheral.
     * This could be due to:
     * - unplug the connector
     * - being powered down
     *
     * Disconnect the device, and if the extension using this object has a
     * reset callback, call it.
     *
     * @param {string} error - cause of the error
     * @returns {undefined}
     */
    handleDisconnectError (error) {
        if (this.state === 'disconnect') return;
        error = error ? error : 'Firmata was disconnected by device';
        console.error(error);
        this.runtime.emit(this.runtime.constructor.PERIPHERAL_CONNECTION_LOST_ERROR, {
            message: `Scratch lost connection to`,
            extensionId: this.extensionId
        });
        this.disconnect();
    }


    // Methods for accessing firmata


    /**
     * State of the all pins
     */
    get pins () {
        return this.firmata.pins;
    }

    /**
     * All pin mode types
     * @types {object<string, number>}
     */
    get MODES () {
        return this.firmata.MODES;
    }

    /**
     * Value for hight in digital signal
     * @types {number}
     */
    get HIGH () {
        return this.firmata.HIGH;
    }

    /**
     * Value for low in digital signal
     * @types {number}
     */
    get LOW () {
        return this.firmata.LOW;
    }

    /**
     * Resolution values for ADC, DAC, PWA.
     * @types {object<string, number>}
     */
    get RESOLUTION () {
        return this.firmata.RESOLUTION;
    }

    getAllPinIndex () {
        if (!this.firmata) return [];
        return Object.keys(this.firmata.pins)
            .map(key => parseInt(key, 10));
    }


    /**
     * Return Array of pin index excluding analog inputs.
     * @returns {Array.<number>} - index of pins not analog input.
     */
    getDigitalPinIndex () {
        const pinIndex = [];
        if (!this.firmata) return pinIndex;
        this.firmata.pins.forEach((pin, index) => {
            if (pin.supportedModes.length > 0 && !pin.supportedModes.includes(MODES.ANALOG)) {
                pinIndex.push(index);
            }
        });
        return pinIndex;
    }


    /**
     * Return Array of pin index for PWM mode excluding analog inputs.
     * @returns {Array.<number>} - index of pins for PWM mode.
     */
    getPWMPinIndex () {
        const pinIndex = [];
        if (!this.firmata) return pinIndex;
        this.firmata.pins.forEach((pin, index) => {
            if (pin.supportedModes.includes(MODES.PWM) && !pin.supportedModes.includes(MODES.ANALOG)) {
                pinIndex.push(index);
            }
        });
        return pinIndex;
    }

    /**
     * Return Array of pin index for servo mode excluding analog inputs.
     * @returns {Array.<number>} - index of pins for servo mode.
     */
    getServoPinIndex () {
        const pinIndex = [];
        if (!this.firmata) return pinIndex;
        this.firmata.pins.forEach((pin, index) => {
            if (pin.supportedModes.includes(MODES.SERVO) && !pin.supportedModes.includes(MODES.ANALOG)) {
                pinIndex.push(index);
            }
        });
        return pinIndex;
    }


    /**
     * Asks the board to set the pin to a certain mode.
     * @param {number} pin - The pin you want to change the mode of.
     * @param {number} mode - The mode you want to set. Must be one of board.MODES
     * @returns {undefined}
     */
    pinMode (pin, mode) {
        return this.firmata.pinMode(pin, mode);
    }

    /**
     * Update pin value as a digital input when the last update was too old.
     * @param {number} pin - pin number to read
     * @returns {Promise<boolean>} a Promise which resolves boolean when the response was returned
     */
    updateDigitalInput (pin) {
        if (
            typeof this.pins[pin].mode !== 'undefined' &&
            this.pins[pin].mode !== this.firmata.MODES.INPUT &&
            this.pins[pin].mode !== this.firmata.MODES.PULLUP
        ) {
            return Promise.resolve(this.pins[pin].value);
        }
        if (this.pins[pin].updating ||
             (this.pins[pin].updateTime &&
                ((Date.now() - this.pins[pin].updateTime) < this.digitalReadInterval))) {
            return Promise.resolve(this.pins[pin].value);
        }
        this.pins[pin].updating = true;
        const request = new Promise(resolve => {
            if (this.pins[pin].inputBias !== this.firmata.MODES.PULLUP) {
                this.pins[pin].inputBias = this.firmata.MODES.INPUT;
            }
            this.firmata.pinMode(pin, this.pins[pin].inputBias);
            this.firmata.reportDigitalPin(pin, 1);
            this.firmata.once(`digital-read-${pin}`,
                value => {
                    this.pins[pin].value = value;
                    this.pins[pin].updateTime = Date.now();
                    this.firmata.reportDigitalPin(pin, 0);
                    resolve(this.pins[pin].value);
                });
        });
        return Promise.race([request, timeoutReject(this.updateDigitalInputWaitingTime)])
            .catch(reason => {
                this.pins[pin].value = 0;
                return Promise.reject(reason);
            })
            .finally(() => {
                this.pins[pin].updating = false;
            });
    }

    /**
     * Set input bias of the connector.
     * @param {number} pin - number of the pin
     * @param {boolean} pullUp - input bias of the pin [none | pullUp]
     * @returns {Promise} a Promise which resolves when the message was sent
     */
    setInputBias (pin, pullUp) {
        this.pins[pin].inputBias = (pullUp ? this.MODES.PULLUP : this.MODES.INPUT);
        return new Promise(resolve => {
            this.pinMode(pin, this.pins[pin].inputBias);
            setTimeout(() => resolve(), this.sendingInterval);
        });
    }

    /**
     * Update pin value as a analog input when the last update was too old.
     * @param {number} analogPin - pin number to read
     * @returns {Promise<number>} resolves analog value when the response was returned
     */
    updateAnalogInput (analogPin) {
        const pin = this.firmata.analogPins[analogPin];
        if (this.pins[pin].updating ||
             (this.pins[pin].updateTime &&
                ((Date.now() - this.pins[pin].updateTime) < this.analogReadInterval))) {
            return Promise.resolve(this.pins[pin].value);
        }
        this.pins[pin].updating = true;
        const request = new Promise(resolve => {
            this.firmata.pinMode(analogPin, this.MODES.ANALOG);
            this.firmata.reportAnalogPin(analogPin, 1);
            this.firmata.once(`analog-read-${analogPin}`,
                value => {
                    this.pins[pin].value = value;
                    this.pins[pin].updateTime = Date.now();
                    this.firmata.reportAnalogPin(analogPin, 0);
                    resolve(this.pins[pin].value);
                });
        });
        return Promise.race([request, timeoutReject(this.updateAnalogInputWaitingTime)])
            .catch(reason => {
                this.pins[pin].value = 0;
                return Promise.reject(reason);
            })
            .finally(() => {
                this.pins[pin].updating = false;
            });
    }

    /**
     * Asks the board to write a value to a digital pin
     * @param {number} pin - The pin you want to write a value to.
     * @param {number} value - The value you want to write. Must be board.HIGH or board.LOW
     * @param {boolean} enqueue - When true, the local state is updated but the command is not sent to the board
     * @returns {Promise} a Promise which resolves when the message was sent
     */
    digitalWrite (pin, value, enqueue) {
        return new Promise(resolve => {
            this.firmata.digitalWrite(pin, value, enqueue);
            setTimeout(() => resolve(), this.sendingInterval);
        });
    }

    /**
     * Set PWM to the value on the pin
     * @param {number} pin - pin number to set
     * @param {number} value - PWM level
     * @returns {Promise} a Promise which resolves when the message was sent
     */
    pwmWrite (pin, value) {
        return new Promise(resolve => {
            this.firmata.pwmWrite(pin, value);
            setTimeout(() => resolve(), this.sendingInterval);
        });
    }

    /**
     * Asks the board to move a servo
     * @param {number} pin - the pin the servo is connected to
     * @param {number} value - the degrees to move the servo to.
     * @returns {Promise} a Promise which resolves when the message was sent
     */
    servoWrite (...args) {
        return new Promise(resolve => {
            this.firmata.servoWrite(...args);
            setTimeout(() => resolve(), this.sendingInterval);
        });
    }

}

export default ArduinoBoard;
