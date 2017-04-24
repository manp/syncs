"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SyncsClientBase_1 = require("./SyncsClientBase");
const SyncsBase_1 = require("./SyncsBase");
const SyncsSharedObject_1 = require("./SyncsSharedObject");
/**
 * @class
 * extends GroupClientBase to add real-time functionality
 */
class SyncsClient extends SyncsClientBase_1.SyncsClientBase {
    constructor(clientWebSocket, syncsServer) {
        super(clientWebSocket, syncsServer);
        this.sharedObjects = new Map();
        this.rmiResultCallbacks = new Map();
    }
    /**
     * publish an event to with data to client
     * @param event
     * @param data
     */
    publish(event, data) {
        if (this.online) {
            SyncsBase_1.SyncsBase.sendCommand({ type: 'event', event: event.toString(), data: data }, this);
            return true;
        }
        return false;
    }
    /**
     * get shared variable
     * this variable is write-able for client
     * @param name
     * @returns {any}
     */
    shared(name, readOnly = false) {
        if (!this.sharedObjects.has(name)) {
            this.sharedObjects.set(name, SyncsSharedObject_1.SyncsSharedObject.clientLevel(name, this, {}, readOnly));
        }
        return this.sharedObjects.get(name).data;
    }
    /**
     * set incoming sync data
     * @param name
     * @param key
     * @param value
     */
    setSyncData(name, key, value) {
        if (this.sharedObjects.has(name)) {
            this.sharedObjects.get(name).setClientData(key, value);
        }
    }
    /**
     * get remote object that enables webServer to call remote methods
     * @returns {any}
     */
    get remote() {
        return new Proxy({}, {
            get: (target, property, receiver) => this.onGetRemoteMethod(target, property, receiver)
        });
    }
    /**
     * this method calls when webServer tries to call remote method
     * @param target
     * @param property
     * @param receiver
     * @returns {()=>undefined}
     */
    onGetRemoteMethod(target, property, receiver) {
        let client = this;
        let id = this.generateRMIRequestUID();
        return function () {
            let args = [];
            for (let name in arguments) {
                args[name] = arguments[name];
            }
            client.sendRMICommand(property, args, id);
            return new Promise((resolve, reject) => {
                client.rmiResultCallbacks.set(id, [resolve, reject]);
            });
        };
    }
    generateRMIRequestUID() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    }
    /**
     * send RMI command to client
     * @param name
     * @param args
     */
    sendRMICommand(name, args, id) {
        if (!this.online) {
            return;
        }
        SyncsBase_1.SyncsBase.sendCommand({
            type: "rmi",
            id: id,
            name: name,
            args: args
        }, this);
    }
    handleRmiResult(command) {
        let callbacks = this.rmiResultCallbacks.get(command.id);
        if (command.error) {
            callbacks[1].call(this, command.error);
        }
        else {
            callbacks[0].call(this, command.result);
        }
        this.rmiResultCallbacks.delete(command.id);
    }
}
exports.SyncsClient = SyncsClient;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3luY3NDbGllbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJTeW5jc0NsaWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLHVEQUFrRDtBQUVsRCwyQ0FBc0M7QUFDdEMsMkRBQXNEO0FBR3REOzs7R0FHRztBQUNILGlCQUF5QixTQUFRLGlDQUFlO0lBSzVDLFlBQVksZUFBeUIsRUFBQyxXQUF1QjtRQUN6RCxLQUFLLENBQUMsZUFBZSxFQUFDLFdBQVcsQ0FBQyxDQUFDO1FBTC9CLGtCQUFhLEdBQStCLElBQUksR0FBRyxFQUFFLENBQUM7UUFDdEQsdUJBQWtCLEdBQW9DLElBQUksR0FBRyxFQUFFLENBQUM7SUFLeEUsQ0FBQztJQUdEOzs7O09BSUc7SUFDSSxPQUFPLENBQUMsS0FBWSxFQUFDLElBQVE7UUFDaEMsRUFBRSxDQUFBLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBLENBQUM7WUFDWixxQkFBUyxDQUFDLFdBQVcsQ0FBQyxFQUFDLElBQUksRUFBQyxPQUFPLEVBQUMsS0FBSyxFQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsRUFBQyxJQUFJLEVBQUMsSUFBSSxFQUFDLEVBQUMsSUFBSSxDQUFDLENBQUM7WUFDNUUsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNoQixDQUFDO1FBQ0QsTUFBTSxDQUFDLEtBQUssQ0FBQztJQUNqQixDQUFDO0lBR0Q7Ozs7O09BS0c7SUFDSSxNQUFNLENBQUMsSUFBVyxFQUFDLFFBQVEsR0FBQyxLQUFLO1FBQ3BDLEVBQUUsQ0FBQSxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQSxDQUFDO1lBQzlCLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksRUFBQyxxQ0FBaUIsQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFDLElBQUksRUFBQyxFQUFFLEVBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUN0RixDQUFDO1FBQ0Qs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