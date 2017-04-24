import { SyncsGroup } from "./SyncsGroup";
import { SyncsClientBase } from "./SyncsClientBase";
import { SyncsServer } from "./SyncsServer";
/**
 * @class
 * this class adds shared object functionality to SyncsServer framework
 */
export declare class SyncsSharedObject {
    name: string;
    rawData: any;
    private type;
    private readOnly;
    private syncsServer;
    private groupObject;
    private clientObject;
    private onChangeHandler;
    private proxy;
    private constructor();
    /**
     * get global level shared variable
     * @param name
     * @param syncsServer
     * @param initializeData
     * @param readOnly
     * @returns {SyncsSharedObject}
     */
    static globalLevel(name: string, syncsServer: SyncsServer, initializeData?: {}, readOnly?: boolean): SyncsSharedObject;
    /**
     * get group level shared variable
     * @param name
     * @param group
     * @param initializeData
     * @param readOnly
     * @returns {SyncsSharedObject}
     */
    static groupLevel(name: string, group: SyncsGroup, initializeData?: {}, readOnly?: boolean): SyncsSharedObject;
    /**
     * get client level shared variable
     * @param name
     * @param client
     * @param initializeData
     * @param readOnly
     * @returns {SyncsSharedObject}
     */
    static clientLevel(name: string, client: SyncsClientBase, initializeData?: {}, readOnly?: boolean): SyncsSharedObject;
    /**
     * initialize shared variable
     */
    initialize(): void;
    /**
     * inner method to handle proxy in shared variable
     * by using this method proxy can watch changes in shared variable
     * @returns {{get: ((target:any, property:any, receiver:any)=>any|string|number), set: ((target:any, property:any, value:any, receiver:any)=>boolean), apply: ((target:any, thisArg:any, argumentsList:any)=>any)}}
     */
    private getHandler();
    /**
     * this handler call each time that anyone tries to get property inside shared variable
     * @param target
     * @param property
     * @param receiver
     * @returns {any}
     */
    private onGet(target, property, receiver);
    /**
     *  this handler call each time that anyone tries to set property inside shared variable
     * @param target
     * @param property
     * @param value
     * @param receiver
     * @returns {boolean}
     */
    private onSet(target, property, value, receiver);
    /**
     * this property used to handle onChange event on shared variable
     * using this method developers can register a handler to monitor changes on shared variable
     * @param target
     * @param thisArg
     * @param argumentsList
     * @returns {any}
     */
    private onApply(target, thisArg, argumentsList);
    /**
     * this method publishes change in shared variable to clients
     * @param property
     */
    private sync(property);
    /**
     * send sync command to clients
     * @param client
     * @param property
     */
    sendSyncCommand(client: SyncsClientBase, property?: any): void;
    /**
     * get list of clients who should know about changes in shared variable
     * @returns {any}
     */
    private getClients();
    /**
     * this method abstracts SharedVariable object to simple object
     * @returns {any}
     */
    readonly data: any;
    /**
     * set incoming changes from client
     * this method only handles client level shared data
     * @param key
     * @param value
     */
    setClientData(key: string, value: any): void;
}
