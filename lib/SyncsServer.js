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
        this.rmiInterferers = [];
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
        this.interfereRMI(command.name, command.args).then(intfResult => {
            if (intfResult == undefined) {
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
            else {
                this.sendRmiResultCommand(intfResult, null, command.id, client);
            }
        });
    }
    /**
     * starts the process of interfering
     * @param {string} name
     * @param {any[]} args
     * @returns {Promise<any>}
     */
    interfereRMI(name, args) {
        let interferes = this.getInterferersFunctions(name);
        return new Promise((resolve, reject) => {
            checkNext();
            function checkNext() {
                let callback = interferes.shift();
                if (callback == undefined) {
                    resolve(undefined);
                    return;
                }
                let result = callback(name, args);
                if (result == undefined) {
                    checkNext();
                }
                else {
                    Promise.resolve(result).then(res => {
                        if (res == undefined) {
                            checkNext();
                        }
                        else {
                            resolve(res);
                        }
                    }, () => checkNext());
                }
            }
        });
    }
    /**
     * get list of callbacks which can be interfered in this call
     * @param {string} name
     * @returns {Function[]}
     */
    getInterferersFunctions(name) {
        let result = [];
        for (let intf of this.rmiInterferers) {
            if (new RegExp(intf.name).test(name)) {
                result.push(intf.callback);
            }
        }
        return result;
    }
    onRMI(name, callback) {
        this.rmiInterferers.push({ name: name, callback: callback });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3luY3NTZXJ2ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJTeW5jc1NlcnZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDJDQUFtRDtBQUluRCwyREFBc0Q7QUFDdEQsK0NBQTBDO0FBSTFDOzs7R0FHRztBQUNILGlCQUF5QixTQUFRLHFCQUFzQjtJQVVuRDs7OztPQUlHO0lBQ0gsWUFBWSxNQUFhLEVBQUMsVUFBb0IsRUFBRTtRQUM1QyxLQUFLLENBQUMsTUFBTSxFQUFDLE9BQU8sQ0FBQyxDQUFDO1FBZGxCLGtCQUFhLEdBQTRELElBQUksR0FBRyxFQUFFLENBQUM7UUFDbkYsa0JBQWEsR0FBK0IsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUV0RCxpQkFBWSxHQUFLLEVBQUUsQ0FBQztRQUNwQixtQkFBYyxHQUFtQyxFQUFFLENBQUM7SUFXNUQsQ0FBQztJQUdTLFNBQVMsQ0FBQyxlQUEwQjtRQUMxQyxNQUFNLENBQUMsSUFBSSx5QkFBVyxDQUFDLGVBQWUsRUFBQyxJQUFJLENBQUMsQ0FBQztJQUNqRCxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsYUFBYSxDQUFDLE1BQW1CO1FBQzdCLEtBQUssQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFNUIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFBLEVBQUU7WUFDckMsWUFBWSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN6QyxDQUFDLENBQUMsQ0FBQTtJQUNOLENBQUM7SUFHRDs7OztPQUlHO0lBQ08sU0FBUyxDQUFDLE9BQVksRUFBRSxNQUFtQjtRQUNqRCxLQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNqQyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUEsQ0FBQztZQUNsQixLQUFLLE9BQU87Z0JBQ1IsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sRUFBQyxNQUFN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