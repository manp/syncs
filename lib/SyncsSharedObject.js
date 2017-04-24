"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SyncsBase_1 = require("./SyncsBase");
/**
 * @class
 * this class adds shared object functionality to SyncsServer framework
 */
class SyncsSharedObject {
    constructor() {
        this.rawData = function (event) { };
        this.readOnly = true;
    }
    /**
     * get global level shared variable
     * @param name
     * @param syncsServer
     * @param initializeData
     * @param readOnly
     * @returns {SyncsSharedObject}
     */
    static globalLevel(name, syncsServer, initializeData = {}, readOnly = true) {
        let result = new SyncsSharedObject();
        result.name = name;
        result.syncsServer = syncsServer;
        result.type = 'GLOBAL';
        result.readOnly = readOnly;
        result.rawData.data = initializeData;
        result.initialize();
        return result;
    }
    /**
     * get group level shared variable
     * @param name
     * @param group
     * @param initializeData
     * @param readOnly
     * @returns {SyncsSharedObject}
     */
    static groupLevel(name, group, initializeData = {}, readOnly = true) {
        let result = new SyncsSharedObject();
        result.name = name;
        result.groupObject = group;
        result.type = 'GROUP';
        result.readOnly = readOnly;
        result.rawData.data = initializeData;
        result.initialize();
        return result;
    }
    /**
     * get client level shared variable
     * @param name
     * @param client
     * @param initializeData
     * @param readOnly
     * @returns {SyncsSharedObject}
     */
    static clientLevel(name, client, initializeData = {}, readOnly = false) {
        let result = new SyncsSharedObject();
        result.name = name;
        result.clientObject = client;
        result.type = 'CLIENT';
        result.readOnly = readOnly;
        result.rawData.data = initializeData;
        result.initialize();
        return result;
    }
    /**
     * initialize shared variable
     */
    initialize() {
        this.proxy = new Proxy(this.rawData, this.getHandler());
    }
    /**
     * inner method to handle proxy in shared variable
     * by using this method proxy can watch changes in shared variable
     * @returns {{get: ((target:any, property:any, receiver:any)=>any|string|number), set: ((target:any, property:any, value:any, receiver:any)=>boolean), apply: ((target:any, thisArg:any, argumentsList:any)=>any)}}
     */
    getHandler() {
        return {
            get: (target, property, receiver) => this.onGet(target, property, receiver),
            set: (target, property, value, receiver) => this.onSet(target, property, value, receiver),
            apply: (target, thisArg, argumentsList) => this.onApply(target, thisArg, argumentsList)
        };
    }
    /**
     * this handler call each time that anyone tries to get property inside shared variable
     * @param target
     * @param property
     * @param receiver
     * @returns {any}
     */
    onGet(target, property, receiver) {
        if (property in this.rawData.data) {
            return this.rawData.data[property];
        }
        return null;
    }
    /**
     *  this handler call each time that anyone tries to set property inside shared variable
     * @param target
     * @param property
     * @param value
     * @param receiver
     * @returns {boolean}
     */
    onSet(target, property, value, receiver) {
        this.rawData.data[property] = value;
        this.sync(property);
        let values = {};
        values[property] = value;
        if (this.onChangeHandler) {
            this.onChangeHandler({ values: values, by: 'webServer' });
        }
        return true;
    }
    /**
     * this property used to handle onChange event on shared variable
     * using this method developers can register a handler to monitor changes on shared variable
     * @param target
     * @param thisArg
     * @param argumentsList
     * @returns {any}
     */
    onApply(target, thisArg, argumentsList) {
        if (argumentsList.length > 0) {
            this.onChangeHandler = argumentsList[0];
        }
        return this.proxy;
    }
    /**
     * this method publishes change in shared variable to clients
     * @param property
     */
    sync(property) {
        let clients = this.getClients();
        clients.forEach(client => {
            this.sendSyncCommand(client, property);
        });
    }
    /**
     * send sync command to clients
     * @param client
     * @param property
     */
    sendSyncCommand(client, property = null) {
        if (!client.online) {
            return;
        }
        let values = {};
        if (property) {
            values[property] = this.rawData.data[property];
        }
        else {
            values = this.rawData.data;
        }
        let command = {
            type: 'sync',
            name: this.name,
            scope: this.type,
            values: values,
            group: null
        };
        if (this.type == 'GROUP') {
            command.group = this.groupObject.name;
        }
        else {
            delete command.group;
        }
        SyncsBase_1.SyncsBase.sendCommand(command, client);
    }
    /**
     * get list of clients who should know about changes in shared variable
     * @returns {any}
     */
    getClients() {
        switch (this.type) {
            case 'CLIENT':
                return [this.clientObject];
            case 'GROUP':
                return [...this.groupObject.clients.values()];
            case 'GLOBAL':
                return [...this.syncsServer.clients.values()];
        }
    }
    /**
     * this method abstracts SharedVariable object to simple object
     * @returns {any}
     */
    get data() {
        return this.proxy;
    }
    /**
     * set incoming changes from client
     * this method only handles client level shared data
     * @param key
     * @param value
     */
    setClientData(key, value) {
        if (key in this.rawData.data && !this.readOnly) {
            this.rawData.data[key] = value;
            if (this.onChangeHandler) {
                let values = {};
                values[key] = value;
                this.onChangeHandler({ values: values, by: 'client' });
            }
        }
    }
}
exports.SyncsSharedObject = SyncsSharedObject;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3luY3NTaGFyZWRPYmplY3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJTeW5jc1NoYXJlZE9iamVjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDJDQUFzQztBQUt0Qzs7O0dBR0c7QUFDSDtJQVVJO1FBUk8sWUFBTyxHQUFLLFVBQVMsS0FBNEIsSUFBRSxDQUFDLENBQUM7UUFFcEQsYUFBUSxHQUFDLElBQUksQ0FBQztJQU90QixDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNJLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBVyxFQUFDLFdBQXVCLEVBQUUsY0FBYyxHQUFDLEVBQUUsRUFBRSxRQUFRLEdBQUMsSUFBSTtRQUMzRixJQUFJLE1BQU0sR0FBQyxJQUFJLGlCQUFpQixFQUFFLENBQUM7UUFDbkMsTUFBTSxDQUFDLElBQUksR0FBQyxJQUFJLENBQUM7UUFDakIsTUFBTSxDQUFDLFdBQVcsR0FBQyxXQUFXLENBQUM7UUFDL0IsTUFBTSxDQUFDLElBQUksR0FBQyxRQUFRLENBQUM7UUFDckIsTUFBTSxDQUFDLFFBQVEsR0FBQyxRQUFRLENBQUM7UUFDekIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEdBQUMsY0FBYyxDQUFDO1FBQ25DLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUNwQixNQUFNLENBQUMsTUFBTSxDQUFDO0lBQ2xCLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0ksTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFXLEVBQUUsS0FBZ0IsRUFBRSxjQUFjLEdBQUMsRUFBRSxFQUFFLFFBQVEsR0FBQyxJQUFJO1FBQ3BGLElBQUksTUFBTSxHQUFDLElBQUksaUJBQWlCLEVBQUUsQ0FBQztRQUNuQyxNQUFNLENBQUMsSUFBSSxHQUFDLElBQUksQ0FBQztRQUNqQixNQUFNLENBQUMsV0FBVyxHQUFDLEtBQUssQ0FBQztRQUN6QixNQUFNLENBQUMsSUFBSSxHQUFDLE9BQU8sQ0FBQztRQUNwQixNQUFNLENBQUMsUUFBUSxH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