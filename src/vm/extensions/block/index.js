import BlockType from '../../extension-support/block-type';
import ArgumentType from '../../extension-support/argument-type';
import Cast from '../../util/cast';
import log from '../../util/log';
import translations from './translations.json';
import blockIcon from './block-icon.png';
import {ArduinoConnector, getArduinoConnector} from './arduino-connector';

/**
 * Formatter which is used for translation.
 * This will be replaced which is used in the runtime.
 * @param {object} messageData - format-message object
 * @returns {string} - message for the locale
 */
let formatMessage = messageData => messageData.default;

/**
 * Setup format-message for this extension.
 */
const setupTranslations = () => {
    const localeSetup = formatMessage.setup();
    if (localeSetup && localeSetup.translations[localeSetup.locale]) {
        Object.assign(
            localeSetup.translations[localeSetup.locale],
            translations[localeSetup.locale]
        );
    }
};

const EXTENSION_ID = 'xcxArduino';

/**
 * URL to get this extension as a module.
 * When it was loaded as a module, 'extensionURL' will be replaced a URL which is retrieved from.
 * @type {string}
 */
let extensionURL = 'https://yokobond.github.io/xcx-arduino/dist/xcxArduino.mjs';

/**
 * Xcratch blocks for Arduino.
 */
class ArduinoBlocks {
    /**
     * A translation object which is used in this class.
     * @param {FormatObject} formatter - translation object
     */
    static set formatMessage (formatter) {
        formatMessage = formatter;
        if (formatMessage) setupTranslations();
    }

    /**
     * @return {string} - the name of this extension.
     */
    static get EXTENSION_NAME () {
        return formatMessage({
            id: 'xcxArduino.name',
            default: 'Arduino',
            description: 'name of the extension'
        });
    }

    /**
     * @return {string} - the ID of this extension.
     */
    static get EXTENSION_ID () {
        return EXTENSION_ID;
    }

    /**
     * URL to get this extension.
     * @type {string}
     */
    static get extensionURL () {
        return extensionURL;
    }

    /**
     * Set URL to get this extension.
     * The extensionURL will be changed to the URL of the loading server.
     * @param {string} url - URL
     */
    static set extensionURL (url) {
        extensionURL = url;
    }

    /**
     * Construct a set of blocks for Arduino.
     * @param {Runtime} runtime - the Scratch 3.0 runtime.
     */
    constructor (runtime) {
        /**
         * The Scratch 3.0 runtime.
         * @type {Runtime}
         */
        this.runtime = runtime;

        if (runtime.formatMessage) {
            // Replace 'formatMessage' to a formatter which is used in the runtime.
            formatMessage = runtime.formatMessage;
        }

        /**
         * Current connected Arduino board.
         * @type {ArduinoBoard}
         */
        this.board = null;
        
        /**
         * Manager of Arduino boards
         * @type {ArduinoConnector}
         */
        this.boardConnector = getArduinoConnector(runtime);
        this.boardConnector.addListener(ArduinoConnector.BOARD_ADDED, () => this.updateBoard());
        this.boardConnector.addListener(ArduinoConnector.BOARD_REMOVED, () => this.updateBoard());

        // register to call scan()/connect()
        this.runtime.registerPeripheralExtension(EXTENSION_ID, this);

        // eslint-disable-next-line no-unused-vars
        window.addEventListener('beforeunload', e => {
            this.disconnectBoard();
        });
    }


    /**
     * Update connected board
     */
    updateBoard () {
        if (this.board && this.board.isConnected()) return;
        const prev = this.board;
        this.board = this.boardConnector.findBoard();
        if (prev === this.board) return;
    }

    /**
     * Called by the runtime when user wants to scan for a peripheral.
     * @returns {Promise} - a Promise which resolves when a board was connected
     */
    scan () {
        return this.connectBoard();
    }

    /**
     * Called by the runtime when user wants to cancel scanning or the peripheral was disconnected.
     */
    disconnect () {
        this.disconnectBoard();
    }

    /**
     * Return whether the board is ready to use or not.
     * @returns {boolean} true if the board is connected
     */
    isConnected () {
        if (!this.board) return false;
        return this.board.isReady();
    }

    /**
     * Connect a Arduino board.
     * @returns {Promise<string>} a promise which resolves the result of this command
     */
    connectBoard () {
        if (this.board && this.board.isConnected()) return; // Already connected
        return this.boardConnector.connectedBoard(EXTENSION_ID)
            .then(connectedBoard => {
                this.runtime.emit(this.runtime.constructor.PERIPHERAL_CONNECTED, {
                    name: connectedBoard.name,
                    path: connectedBoard.portInfo
                });
                return `connected to ${JSON.stringify(connectedBoard.portInfo)}`;
            })
            .catch(reason => {
                if (reason) {
                    console.log(reason);
                } else {
                    console.log(`fail to connect Arduino Board`);
                }
                return;
            });
    }

    /**
     * Disconnect from the current connected board.
     * @returns {undefined}
     */
    disconnectBoard () {
        if (!this.board) return;
        return this.board.disconnect();
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        setupTranslations();
        return {
            id: ArduinoBlocks.EXTENSION_ID,
            name: ArduinoBlocks.EXTENSION_NAME,
            extensionURL: ArduinoBlocks.extensionURL,
            blockIconURI: blockIcon,
            showStatusButton: true,
            blocks: [
                {
                    opcode: 'a0',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'xcxArduino.A0',
                        default: 'A0',
                        description: 'Arduino Analog Input 0'
                    })
                },
                {
                    opcode: 'a1',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'xcxArduino.A1',
                        default: 'A1',
                        description: 'Arduino Analog Input 1'
                    })
                },
                {
                    opcode: 'a2',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'xcxArduino.A2',
                        default: 'A2',
                        description: 'Arduino Analog Input 2'
                    })
                },
                {
                    opcode: 'a3',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'xcxArduino.A3',
                        default: 'A3',
                        description: 'Arduino Analog Input 3'
                    })
                },
                {
                    opcode: 'a4',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'xcxArduino.A4',
                        default: 'A4',
                        description: 'Arduino Analog Input 4'
                    })
                },
                {
                    opcode: 'a5',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'xcxArduino.A5',
                        default: 'A5',
                        description: 'Arduino Analog Input 5'
                    })
                },
                '---',
                {
                    opcode: 'getDigitalLevel',
                    blockType: BlockType.BOOLEAN,
                    disableMonitor: true,
                    text: formatMessage({
                        id: 'xcxArduino.getDigitalLevel',
                        default: 'D[PIN]',
                        description: 'Arduino Digital Input value of the pin'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            menu: 'digitalPinIndexMenu'
                        }
                    }
                },
                {
                    opcode: 'setInputBias',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'xcxArduino.setInputBias',
                        default: 'Set D[PIN] input bias [BIAS] ',
                        description: 'Set the Arduino pin to Digital Input pullup/none'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            menu: 'digitalPinIndexMenu'
                        },
                        BIAS: {
                            type: ArgumentType.STRING,
                            menu: 'inputBiasMenu'
                        }
                    }
                },
                {
                    opcode: 'setDigitalLevel',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'xcxArduino.setDigitalLevel',
                        default: 'Set D[PIN] to [LEVEL]',
                        description: 'Set the Arduino pin to Digital Output'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            menu: 'digitalPinIndexMenu'
                        },
                        LEVEL: {
                            type: ArgumentType.STRING,
                            menu: 'digitalLevelMenu'
                        }
                    }
                },
                {
                    opcode: 'setAnalogLevel',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'xcxArduino.setAnalogLevel',
                        default: 'PWM [PIN] set duty cycle [LEVEL] %',
                        description: 'set analog level of the pin'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            menu: 'pwmPinIndexMenu'
                        },
                        LEVEL: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 100
                        }
                    }
                },
                {
                    opcode: 'servoTurn',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'xcxArduino.servoTurn',
                        default: 'Servo [PIN] turn [ANGLE] degrees',
                        description: 'turn servo motor'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            menu: 'servoPinIndexMenu'
                        },
                        ANGLE: {
                            type: ArgumentType.ANGLE
                        }
                    }
                }
            ],
            menus: {
                digitalPinIndexMenu: {
                    acceptReporters: true,
                    items: 'getDigitalPinIndexMenu'
                },
                pwmPinIndexMenu: {
                    acceptReporters: true,
                    items: 'getPWMPinIndexMenu'
                },
                servoPinIndexMenu: {
                    acceptReporters: true,
                    items: 'getServoPinIndexMenu'
                },
                digitalLevelMenu: {
                    acceptReporters: true,
                    items: 'getDigitalLevelMenu'
                },
                inputBiasMenu: {
                    acceptReporters: false,
                    items: 'getInputBiasMenu'
                }
            }
        };
    }

    /**
     * Returns menu items to set digital level.
     * @returns {Array<object>} menu items
     */
    getDigitalLevelMenu () {
        return [
            {
                text: formatMessage({
                    id: 'xcxArduino.digitalValueMenu.Low',
                    default: '0',
                    description: 'label for low value in digital output menu for Arduino extension'
                }),
                value: '0'
            },
            {
                text: formatMessage({
                    id: 'xcxArduino.digitalValueMenu.High',
                    default: '1',
                    description: 'label for high value in digital output menu for Arduino extension'
                }),
                value: '1'}
        ];
    }

    /**
     * Returns menu items to set input bias.
     * @returns {Array<object>} menu items
     */
    getInputBiasMenu () {
        return [
            {
                text: formatMessage({
                    id: 'xcxArduino.inputBiasMenu.none',
                    default: 'none',
                    description: 'label for none in input bias menu for xcxArduino'
                }),
                value: 'none'
            },
            {
                text: formatMessage({
                    id: 'xcxArduino.inputBiasMenu.pullUp',
                    default: 'pull up',
                    description: 'label for pull up in input bias menu for xcxArduino'
                }),
                value: 'pullUp'
            }
        ];
    }

    /**
     * Returns menu items to set digital pin.
     * @returns {Array<object>} menu items
     */
    getDigitalPinIndexMenu () {
        if (!this.isConnected()) return [''];
        const menu = this.board.getDigitalPinIndex()
            .map(value => ({value: value.toString(10), text: value.toString(10)}));
        if (menu.length === 0) menu.push(''); // Avoid to break menu
        return menu;
    }

    /**
     * Returns menu items to set pwm pin.
     * @returns {Array<object>} menu items
     */
    getPWMPinIndexMenu () {
        if (!this.isConnected()) return [''];
        const menu = this.board.getPWMPinIndex()
            .map(value => ({value: value.toString(10), text: value.toString(10)}));
        if (menu.length === 0) menu.push(''); // Avoid to break menu
        return menu;
    }

    /**
     * Returns menu items to set servo pin.
     * @returns {Array<object>} menu items
     */
    getServoPinIndexMenu () {
        if (!this.isConnected()) return [''];
        const menu = this.board.getServoPinIndex()
            .map(value => ({value: value.toString(10), text: value.toString(10)}));
        if (menu.length === 0) menu.push(''); // Avoid to break menu
        return menu;
    }

    /**
     * The level of the pin as analog input.
     * @param {number} analogPin - pin number of the connector
     * @returns {Promise} - resolves analog level(%)
     */
    getAnalogLevel (analogPin) {
        if (!this.isConnected()) return Promise.resolve(0);
        return this.board.updateAnalogInput(analogPin)
            .then(raw => Math.round((raw / 1023) * 1000) / 10)
            .catch(reason => {
                console.log(`analogRead(${analogPin}) was rejected by ${reason}`);
                return 0;
            });
    }

    /**
     * The level of the pin as analog input.
     * @returns {Promise} - resolves analog level(%)
     */
    a0 () {
        if (!this.isConnected()) return 0;
        return this.getAnalogLevel(0);
    }

    /**
     * The level of the pin as analog input.
     * @returns {Promise} - resolves analog level(%)
     */
    a1 () {
        if (!this.isConnected()) return 0;
        return this.getAnalogLevel(1);
    }

    /**
     * The level of the pin as analog input.
     * @returns {Promise} - resolves analog level(%)
     */
    a2 () {
        if (!this.isConnected()) return 0;
        return this.getAnalogLevel(2);
    }

    /**
     * The level of the pin as analog input.
     * @returns {Promise} - resolves analog level(%)
     */
    a3 () {
        if (!this.isConnected()) return 0;
        return this.getAnalogLevel(3);
    }

    /**
     * The level of the pin as analog input.
     * @returns {Promise} - resolves analog level(%)
     */
    a4 () {
        if (!this.isConnected()) return 0;
        return this.getAnalogLevel(4);
    }

    /**
     * The level of the pin as analog input.
     * @returns {Promise} - resolves analog level(%)
     */
    a5 () {
        if (!this.isConnected()) return 0;
        return this.getAnalogLevel(5);
    }

    /**
     * The level of the pin as digital input.
     * @param {object} args - the block's arguments.
     * @param {number} args.PIN - pin number of the connector
     * @returns {Promise<boolean>} - resolves digital level(boolean)
     */
    getDigitalLevel (args) {
        if (!this.isConnected()) return Promise.resolve(false);
        if (args.PIN === '') return Promise.resolve(false);
        const pin = parseInt(Cast.toNumber(args.PIN), 10);
        return this.board.updateDigitalInput(pin)
            .then(value => {
                if (value === 0) return false;
                return true;
            })
            .catch(reason => {
                console.log(`digitalRead(${pin}) was rejected by ${reason}`);
                return false;
            });
    }

    /**
     * Set the connector to the level as digital output.
     * @param {object} args - the block's arguments.
     * @param {number} args.PIN - pin number of the connector
     * @param {boolean | number | string} args.LEVEL - level to be set
     * @returns {Promise} a Promise which resolves when the message was sent
     */
    setDigitalLevel (args) {
        if (!this.isConnected()) return 'not connected';
        if (args.PIN === '') return Promise.resolve('pin not assigned');
        const pin = parseInt(Cast.toNumber(args.PIN), 10);
        let value;
        if (Cast.toBoolean(args.LEVEL) ||
            Cast.toNumber(args.LEVEL) > 0 ||
            Cast.toString(args.LEVEL).toLowerCase === 'high' ||
            Cast.toString(args.LEVEL).toLowerCase === 'h'
        ) {
            value = this.board.HIGH;
        } else {
            value = this.board.LOW;
        }
        this.board.pinMode(pin, this.board.MODES.OUTPUT);
        return this.board.digitalWrite(pin, value);
    }

    /**
     * Set the connector to power [%] as PWM.
     * @param {object} args - the block's arguments.
     * @param {number} args.CONNECTOR - pin number of the connector
     * @param {string | number} args.LEVEL - power (%) of PWM
     * @returns {Promise} a Promise which resolves when the message was sent
     */
    setAnalogLevel (args) {
        if (!this.isConnected()) return 'not connected';
        if (args.PIN === '') return Promise.resolve('pin not assigned');
        const pin = parseInt(args.PIN, 10);
        const percent = Math.min(Math.max(Cast.toNumber(args.LEVEL), 0), 100);
        const value = Math.round(this.board.RESOLUTION.PWM * (percent / 100));
        this.board.pinMode(pin, this.board.MODES.PWM);
        return this.board.pwmWrite(pin, value);
    }

    setPinValuePwm (args) {
        if (!this.isConnected()) return 'not connected';
        if (args.PIN === '') return Promise.resolve('pin not assigned');
        const pin = parseInt(Cast.toNumber(args.PIN), 10);
        const value = Cast.toNumber(args.VALUE);
        log.debug(`setPinValuePwm(arg.PIN=${args.PIN}, arg.VALUE=${args.VALUE}) => setPinValuePwm(${pin}, ${value})`);
        return this.board.setPinValuePwm(pin, value);
    }

    /**
     * Set input bias of the connector.
     * @param {object} args - the block's arguments.
     * @param {string} args.PIN - number of the pin
     * @param {string} args.BIAS - input bias of the pin [none | pullUp]
     * @returns {Promise} a Promise which resolves when the message was sent
     */
    setInputBias (args) {
        if (!this.isConnected()) return 'not connected';
        if (args.PIN === '') return Promise.resolve('pin not assigned');
        const pin = parseInt(args.PIN, 10);
        const pullUp = args.BIAS === 'pullUp';
        return this.board.setInputBias(pin, pullUp);
    }

    /**
     * Turn the servo motor to the degrees (-90...90).
     * @param {object} args - the block's arguments.
     * @param {number} args.CONNECTOR - pin number of the connector
     * @param {number} args.ANGLE - degrees to the servo to turn
     * @returns {Promise} a Promise which resolves when the message was sent
     */
    servoTurn (args) {
        if (!this.isConnected()) return 'not connected';
        if (args.PIN === '') return Promise.resolve('pin not assigned');
        const pin = parseInt(args.PIN, 10);
        const angle = Cast.toNumber(args.ANGLE);
        let servoValue = 90 - angle; // = 180 - (angle + 90)
        servoValue = Math.min(180, Math.max(0, servoValue));
        this.board.pinMode(pin, this.board.MODES.SERVO);
        return this.board.servoWrite(pin, servoValue);
    }
}

export {ArduinoBlocks as default, ArduinoBlocks as blockClass};
