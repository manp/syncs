/// <reference types="node" />
/// <reference types="ws" />
import { SyncsBase, SyncsConfig } from "./SyncsBase";
import * as WebSocket from "ws";
import { Server } from "http";
import { SyncsClientBase } from "./SyncsClientBase";
import { SyncsClient } from "./SyncsClient";
/**
 * @class
 * extends SyncsBase to add abstraction layers
 */
export declare class SyncsServer extends SyncsBase<SyncsClient> {
    private subscriptions;
    private sharedObjects;
    private functionProxy;
    private rmiFunctions;
    private rmiInterferers;
    /**
     * @constructor
     * @param {Server} server
     * @param {SyncsConfig} configs
     */
    constructor(server: Server, configs?: SyncsConfig);
    protected getClient(clientWebSocket: WebSocket): SyncsClientBase;
    /**
     * send global shared data to hand-shacked clients
     * @param client
     */
    onHandShacked(client: SyncsClient): void;
    /**
     * after handshaking each command enters in this method
     * @param {any} command
     * @param {SyncsClientBase} client
     */
    protected onCommand(command: any, client: SyncsClient): void;
    /**
     * handle event command
     * @param {any} command
     * @param {SyncsClientBase} client
     */
    private handleEventCommand(command, client);
    /**
     * developer can subscribe to events
     * @param {any} event
     * @param {SyncsClient} callback
     */
    subscribe(event: string, callback: (data: any, client: SyncsClient) => void): void;
    /**
     * developer can unSubscribe from event
     * @param {any} event
     * @param {(data:any, client:SyncsClient)=>void} callback
     */
    unSubscribe(event: string, callback: (data: any, client: SyncsClient) => void): void;
    /**
     * handle incomming share object command
     * @param command
     * @param client
     */
    private handleSyncCommand(command, client);
    /**
     * developer can access shared object, or create a new shared object
     * this method creates global shared object
     * only webServer can change value of variable and it's readonly for client
     * @param name
     * @returns {any}
     */
    shared(name: string): any;
    /**
     * handle incomming remote method call
     * @param {any} command
     * @param {SyncsClient} client
     */
    private handleRMICommand(command, client);
    /**
     * starts the process of interfering
     * @param {string} name
     * @param {any[]} args
     * @returns {Promise<any>}
     */
    private interfereRMI(name, args, client);
    /**
     * get list of callbacks which can be interfered in this call
     * @param {string} name
     * @returns {Function[]}
     */
    private getInterferersFunctions(name);
    onRMI(name: string, callback: (client: SyncsClient, name: string, args: any[]) => void | any | Promise<any>): void;
    /**
     * using this method,developer can declare remote invokable functions
     * @returns {any}
     */
    readonly functions: any;
    /**
     * handle rmi result received from client
     * @param command
     * @param client
     */
    private handleRmiResultCommand(command, client);
    /**
     * send rmi result to client
     * @param result
     * @param error
     * @param id
     * @param client
     */
    private sendRmiResultCommand(result, error, id, client);
    /**
     * publish event to all clients
     * @param event
     * @param data
     */
    publish(event: string, data: any): SyncsClient[];
}
