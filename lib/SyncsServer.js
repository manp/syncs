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
        this.interfereRMI(command.name, command.args, client).then(intfResult => {
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
    interfereRMI(name, args, client) {
        let interferes = this.getInterferersFunctions(name);
        return new Promise((resolve, reject) => {
            checkNext();
            function checkNext() {
                let callback = interferes.shift();
                if (callback == undefined) {
                    resolve(undefined);
                    return;
                }
                let result = callback(client, name, args);
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