"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SyncsBase_1 = require("./SyncsBase");
const SyncsSharedObject_1 = require("./SyncsSharedObject");
const SyncsClient_1 = require("./SyncsClient");
/**
 * @class
 * extends SyncsBase to add abstraction layers
 */
class SyncsServer extends SyncsBase_1.SyncsBase {
    /**
     * @constructor
     * @param {Server} server
     * @param {SyncsConfig} configs
     */
    constructor(server, configs = {}) {
        super(server, configs);
        this.subscriptions = new Map();
        this.sharedObjects = new Map();
        this.rmiFunctions = {};
    }
    getClient(clientWebSocket) {
        return new SyncsClient_1.SyncsClient(clientWebSocket, this);
    }
    /**
     * send global shared data to hand-shacked clients
     * @param client
     */
    onHandShacked(client) {
        super.onHandShacked(client);
        this.sharedObjects.forEach(sharedObject => {
            sharedObject.sendSyncCommand(client);
        });
    }
    /**
     * after handshaking each command enters in this method
     * @param {any} command
     * @param {SyncsClientBase} client
     */
    onCommand(command, client) {
        super.onCommand(command, client);
        switch (command.type) {
            case 'event':
                this.handleEventCommand(command, client);
                break;
            case 'sync':
                this.handleSyncCommand(command, client);
                break;
            case 'rmi':
                this.handleRMICommand(command, client);
                break;
            case 'rmi-result':
                this.handleRmiResultCommand(command, client);
        }
    }
    ///////////// EVENT ABSTRACTION LAYER ////////////////////////
    /**
     * handle event command
     * @param {any} command
     * @param {SyncsClientBase} client
     */
    handleEventCommand(command, client) {
        if (command.event) {
            let subscription = this.subscriptions.get(command.event);
            if (subscription) {
                subscription.forEach((callback) => {
                    callback(command.data, client);
                });
            }
        }
    }
    /**
     * developer can subscribe to events
     * @param {any} event
     * @param {SyncsClient} callback
     */
    subscribe(event, callback) {
        if (!this.subscriptions.has(event)) {
            this.subscriptions.set(event, new Set());
        }
        this.subscriptions.get(event).add(callback);
    }
    /**
     * developer can unSubscribe from event
     * @param {any} event
     * @param {(data:any, client:SyncsClient)=>void} callback
     */
    unSubscribe(event, callback) {
        if (!this.subscriptions.has(event)) {
            return;
        }
        this.subscriptions.get(event).delete(callback);
    }
    ///////////// SHARED VARIABLE ABSTRACTION LAYER ////////////////////////
    /**
     * handle incomming share object command
     * @param command
     * @param client
     */
    handleSyncCommand(command, client) {
        client.setSyncData(command.name, command.key, command.value);
    }
    /**
     * developer can access shared object, or create a new shared object
     * this method creates global shared object
     * only webServer can change value of variable and it's readonly for client
     * @param name
     * @returns {any}
     */
    shared(name) {
        if (!this.sharedObjects.has(name)) {
            this.sharedObjects.set(name, SyncsSharedObject_1.SyncsSharedObject.globalLevel(name, this, {}, true));
        }
        return this.sharedObjects.get(name).data;
    }
    ///////////// RMI ABSTRACTION LAYER ////////////////////////
    /**
     * handle incomming remote method call
     * @param {any} command
     * @param {SyncsClient} client
     */
    handleRMICommand(command, client) {
        if (command.name in this.functions) {
            let result = this.functions[command.name].call(client, ...command.args);
            if (result instanceof Promise) {
                result.then(promiseResult => {
                    this.sendRmiResultCommand(promiseResult, null, command.id, client);
                }).catch(error => {
                    this.sendRmiResultCommand(null, 'function error', command.id, client);
                });
            }
            else {
                this.sendRmiResultCommand(result, null, command.id, client);
            }
        }
        else {
            this.sendRmiResultCommand(null, 'undefined', command.id, client);
        }
    }
    /**
     * using this method,developer can declare remote invokable functions
     * @returns {any}
     */
    get functions() {
        if (!this.functionProxy) {
            this.functionProxy = new Proxy(this.rmiFunctions, {
                set: (target, property, value, receiver) => {
                    this.rmiFunctions[property] = value;
                    return true;
                }
            });
        }
        return this.functionProxy;
    }
    /**
     * handle rmi result received from client
     * @param command
     * @param client
     */
    handleRmiResultCommand(command, client) {
        client.handleRmiResult(command);
    }
    /**
     * send rmi result to client
     * @param result
     * @param error
     * @param id
     * @param client
     */
    sendRmiResultCommand(result, error, id, client) {
        SyncsBase_1.SyncsBase.sendCommand({
            type: "rmi-result",
            id: id,
            result: result,
            error: error
        }, client);
    }
    /**
     * publish event to all clients
     * @param event
     * @param data
     */
    publish(event, data) {
        let rejected = [];
        this.clients.forEach(client => {
            if (!client.publish(event, data)) {
                rejected.push(client);
            }
        });
        return rejected;
    }
}
exports.SyncsServer = SyncsServer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3luY3NTZXJ2ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJTeW5jc1NlcnZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDJDQUFtRDtBQUluRCwyREFBc0Q7QUFDdEQsK0NBQTBDO0FBRzFDOzs7R0FHRztBQUNILGlCQUF5QixTQUFRLHFCQUFzQjtJQVFuRDs7OztPQUlHO0lBQ0gsWUFBWSxNQUFhLEVBQUMsVUFBb0IsRUFBRTtRQUM1QyxLQUFLLENBQUMsTUFBTSxFQUFDLE9BQU8sQ0FBQyxDQUFDO1FBWmxCLGtCQUFhLEdBQTRELElBQUksR0FBRyxFQUFFLENBQUM7UUFDbkYsa0JBQWEsR0FBK0IsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUV0RCxpQkFBWSxHQUFLLEVBQUUsQ0FBQztJQVU1QixDQUFDO0lBR1MsU0FBUyxDQUFDLGVBQTBCO1FBQzFDLE1BQU0sQ0FBQyxJQUFJLHlCQUFXLENBQUMsZUFBZSxFQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2pELENBQUM7SUFFRDs7O09BR0c7SUFDSCxhQUFhLENBQUMsTUFBbUI7UUFDN0IsS0FBSyxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUU1QixJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxZQUFZO1lBQ25DLFlBQVksQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDekMsQ0FBQyxDQUFDLENBQUE7SUFDTixDQUFDO0lBR0Q7Ozs7T0FJRztJQUNPLFNBQVMsQ0FBQyxPQUFZLEVBQUUsTUFBbUI7UUFDakQsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDakMsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFBLENBQUM7WUFDbEIsS0FBSyxPQUFPO2dCQUNSLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3hDLEtBQUssQ0FBQztZQUNWLEtBQUss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