/// <reference types="node" />
/// <reference types="ws" />
/**
 * Created by manp on 3/19/17.
 */
import * as EventEmitter from 'events';
import * as WebSocket from "ws";
import { SyncsGroup } from "./SyncsGroup";
import { SyncsBase } from "./SyncsBase";
/**
 * @class
 * SyncsClientBase as an instance for each online user
 */
export declare class SyncsClientBase extends EventEmitter {
    clientWebSocket: WebSocket;
    memberGroups: Set<SyncsGroup>;
    socketId: string;
    online: boolean;
    data: any;
    syncsServer: SyncsBase<SyncsClientBase>;
    handledClose: boolean;
    /**
     *
     * @param {WebSocket} clientWebSocket
     * @param {SyncsBase} syncsServer
     */
    constructor(clientWebSocket: WebSocket, syncsServer: SyncsBase<SyncsClientBase>);
    /**
     * send message to client
     * @param {any} message
     * @returns {boolean}
     */
    send(message: any): boolean;
    /**
     * get groups that this client is members in
     * @returns {Set<SyncsGroup>}
     */
    groups(): Set<SyncsGroup>;
    /**
     * close client and remove it from list of online client
     */
    close(): void;
    /**
     * event handler for client disconnect
     * @param listener
     */
    onDisconnect(listener: (client: SyncsClientBase) => void): void;
    /**
     * event handler for client close
     * client close will happen after closeTimeout config in SyncsServer constructor
     * @param listener
     */
    onClose(listener: (client: SyncsClientBase) => void): void;
}
