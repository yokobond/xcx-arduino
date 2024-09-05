import {EventEmitter} from 'events';
import ArduinoBoard from './arduino-board';

/**
 * Manager object which serves Arduino boards.
 */
export class ArduinoConnector extends EventEmitter {

    /**
     * Event name for reporting that a board removed.
     * @const {string}
     */
    static get BOARD_REMOVED () {
        return 'BOARD_REMOVED';
    }

    /**
     * Event name for reporting that a board added.
     * @const {string}
     */
    static get BOARD_ADDED () {
        return 'BOARD_ADDED';
    }

    /**
     * Constructor of this instance.
     * @param {Runtime} runtime - Scratch runtime object
     */
    constructor (runtime) {
        super();
        
        /**
         * The Scratch 3.0 runtime.
         * @type {Runtime}
         */
        this.runtime = runtime;

        /**
         * Available boards
         * @type {Array<ArduinoBoard>}
         */
        this.boards = [];

        /**
         * Settings for WebSerial
         */
        this.serialPortOptions = {
            // filters: [
            //     {usbVendorId: 0x04D8, usbProductId: 0xE83A}, // Licensed for AkaDako
            //     {usbVendorId: 0x04D8, usbProductId: 0x000A}, // Dev board
            //     {usbVendorId: 0x04D9, usbProductId: 0xB534} // Use in the future
            // ]
        };
    }

    /**
     * Return connected board which is confirmed with the options.
     * @param {object} options serial port options
     * @param {Array<{usbVendorId, usbProductId}>} options.filters allay of filters
     * @returns {ArduinoBoard?} first board which confirmed with options
     */
    findBoard (options) {
        if (this.boards.length === 0) return;
        if (!options || !options.filters) return this.boards[0];
        return this.boards.find(aBoard => (aBoard.isConnected() && options.filters.some(filter =>
            ((filter.usbVendorId === aBoard.portInfo.usbVendorId) &&
                    (filter.usbProductId === aBoard.portInfo.usbProductId)))));
    }

    /**
     * Add a board to the boards holder.
     * @param {ArduinoBoard} newBoard the board to be added
     */
    addBoard (newBoard) {
        this.boards.push(newBoard);
        this.emit(ArduinoConnector.BOARD_ADDED, newBoard);
    }

    /**
     * Remove a board from the boards holder.
     * @param {ArduinoBoard} removal the board to be removed
     */
    removeBoard (removal) {
        const indexOfRemoval = this.boards.indexOf(removal);
        if (indexOfRemoval < 0) return; // not found
        this.boards.splice(indexOfRemoval, 1);
        this.emit(ArduinoConnector.BOARD_ADDED, removal);
    }

    /**
     * Return a connected Arduino board
     * @param {string} extensionId - ID of the extension which is requesting
     * @returns {Promise<ArduinoBoard>} a Promise which resolves a connected Arduino board or reject with reason
     */
    connectedBoard (extensionId) {
        const connectedBoard = this.findBoard();
        if (connectedBoard) {
            // share a board object
            return Promise.resolve(connectedBoard);
        }
        return this.connectSerial(extensionId);
    }

    connectSerial (extensionId) {
        if (!('serial' in navigator)) {
            return Promise.reject(new Error('This browser does not support Web Serial API.'));
        }
        const newBoard = new ArduinoBoard(this.runtime);
        newBoard.extensionId = extensionId;
        return newBoard.connectSerial(this.serialPortOptions)
            .then(connected => {
                this.addBoard(connected);
                connected.once(ArduinoBoard.RELEASED, () => {
                    this.removeBoard(connected);
                    this.runtime.emit(this.runtime.constructor.PERIPHERAL_DISCONNECTED, {
                        name: connected.name,
                        path: connected.portInfo
                    });
                });
                return connected;
            });
    }

}

/**
 * Return a shared Arduino connector object
 * @param {Runtime} runtime - Scratch runtime object
 * @returns {ArduinoConnector} a Arduino connector object
 */
export const getArduinoConnector = runtime => {
    if (!runtime.arduinoConnector) {
        runtime.arduinoConnector = new ArduinoConnector(runtime);
    }
    return runtime.arduinoConnector;
};
