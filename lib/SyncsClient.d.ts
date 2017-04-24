/// <reference types="ws" />
import { SyncsClientBase } from "./SyncsClientBase";
import * as WebSocket from "ws";
import { SyncsServer } from "./SyncsServer";
/**
 * @class
 * extends GroupClientBase to add real-time functionality
 */
export declare class SyncsClient extends SyncsClientBase {
    private sharedObjects;
    private rmiResultCallbacks;
    constructor(clientWebSocket: WebSocket, syncsServer: SyncsServer);
    /**
     * publish an event to with data to client
     * @param event
     * @param data
     */
    publish(event: string, data: any): boolean;
    /**
     * get shared variable
     * this variable is write-able for client
     * @param name
     * @returns {any}
     */
    shared(name: string, readOnly?: boolean): any;
    /**
     * set incoming sync data
     * @param name
     * @param key
     * @param value
     */
    setSyncData(name: string, key: string, value: any): void;
    /**
     * get remote object that enables webServer to call remote methods
     * @returns {any}
     */
    readonly remote: any;
    /**
     * this method calls when webServer tries to call remote method
     * @param target
     * @param property
     * @param receiver
     * @returns {()=>undefined}
     */
    private onGetRemoteMethod(target, property, receiver);
    private generateRMIRequestUID();
    /**
     * send RMI command to client
     * @param name
     * @param args
     */
    private sendRMICommand(name, args, id);
    handleRmiResult(command: any): void;
}
