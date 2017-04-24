/// <reference types="node" />
/// <reference types="ws" />
import { Server } from "http";
import * as WebSocket from "ws";
import * as EventEmitter from "events";
import { SyncsGroup } from "./SyncsGroup";
import { SyncsClientBase } from "./SyncsClientBase";
/**
 * @class
 * SyncsBase class
 */
export declare class SyncsBase<T extends SyncsClientBase> extends EventEmitter {
    /************** PROPERTIES ****************/
    private webServer;
    private configs;
    private webSocketServer;
    private clientScriptData;
    clients: Map<string, SyncsClientBase>;
    groups: Map<string, SyncsGroup>;
    /**
     * SyncsBasic Constructor
     * @constructor
     * @param {Server} server
     * @param {SyncsConfig} configs
     */
    constructor(server: Server, configs?: SyncsConfig);
    /**
     * initialize configuration with user inputs or default configurations
     * @param {SyncsConfig} configs
     */
    private initializeConfigs(configs);
    /**
     * initialize WebSocket server
     */
    private initializeWebSocketServer();
    /**
     * set on client connection
     * setting onMessage handler and starting handshake
     */
    private initializeOnConnection();
    /**
     * Generates SyncsClientBase instance
     * @param clientWebSocket
     * @return {SyncsClientBase}
     */
    protected getClient(clientWebSocket: WebSocket): SyncsClientBase;
    /**
     * set on message handler
     * routing to onCommand or emitting to message event
     * @param {SyncsClientBase} client
     */
    private initializeOnMessage(client);
    private static parseMessage(message);
    /**
     * send handshake request command
     * @param client
     */
    private sendHandShakeRequestCommand(client);
    /**
     * @param {Object} message
     * @param {SyncsClientBase} client
     */
    static sendCommand(message: any, client: SyncsClientBase): void;
    /**
     * close and remove client from lists
     * @param {SyncsClientBase} client
     */
    removeClient(client: SyncsClientBase): void;
    /**
     * make client available when handshake done
     * @param {SyncsClientBase} client
     */
    protected onHandShacked(client: SyncsClientBase): void;
    /**
     * set close event and actions
     * client connection will be close after config.closeTime ms
     * @param {SyncsClientBase} client
     */
    private setCloseEvents(client);
    /**
     * add listener to message event callback list
     * onMessage is available after handshake process
     * @param {(data:any,client:SyncsClientBase)=>void} listener
     */
    onMessage(listener: (data: any, client: SyncsClientBase) => void): void;
    /**
     * add listener to connection event callback list
     * onConnection is available after handshake process
     * @param {(data:any,client:SyncsClientBase)=>void} listener
     */
    onConnection(listener: (client: T) => void): void;
    /**
     * add listener to re-connection event callback list
     * onReConnection is available after handshake process
     * @param listener
     */
    onReConnection(listener: (client: T) => void): void;
    /**
     * add listener to client-disconnect event callback list
     * client will be close after config.closeTime if re-handshaking does not happen
     * @param {(client)=>void} listener
     */
    onClientDisconnect(listener: (client: T) => void): void;
    /**
     * add listener to client-close event callback list
     * @param {(client)=>void} listener
     */
    onClientClose(listener: (client: T) => void): void;
    /**
     * handle commands here
     * abstracted classes should override this method
     * @param {Object} command
     * @param {SyncsClientBase} client
     */
    protected onCommand(command: any, client: SyncsClientBase): void;
    /**
     * allow user to create or access created client group
     * @param {string} name
     * @returns {SyncsGroup}
     */
    group(name: string): SyncsGroup;
    /**
     * client socketId report handler
     * @param {string} socketId
     * @param {SyncsClientBase} client
     */
    private onReportSocketId(socketId, client);
    /**
     * create and set new socketId to client
     * @param {SyncsClientBase} client
     */
    private setNewSocketId(client);
    /**
     * send simple message to clients
     * @param message
     * @return {SyncsClientBase[]} offline clients
     */
    send(message: any): SyncsClientBase[];
    /**
     * fetch client side script
     * @returns {string} client script text
     */
    readonly clientScript: string;
    /**
     * enables debug mode
     */
    enableDebugMode(): void;
    /**
     * disables debug mode
     */
    disableDebugMode(): void;
}
export interface SyncsConfig {
    /**
     * Web Socket serving path
     * default is '/syncs'
     */
    path?: string;
    /**
     * time to destroy client after disconnect
     * default is 10,000 ms
     */
    closeTimeout?: number;
    /**
     * enables debug mode
     */
    debug?: boolean;
}
