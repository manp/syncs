import {Server} from "http";
import * as WebSocket from "ws";
import * as EventEmitter from "events";
import {SyncsGroup} from "./SyncsGroup";
import {SyncsClientBase} from "./SyncsClientBase";
import {SyncsClient} from "./SyncsClient";

/**
 * @class
 * SyncsBase class
 */
export class SyncsBase<T extends SyncsClientBase> extends EventEmitter{

    /************** PROPERTIES ****************/
    private webServer: Server;
    private configs: SyncsConfig = {};
    private webSocketServer: WebSocket.Server;
    private clientScriptData: string ;
    public clients: Map<string,SyncsClientBase> = new Map();
    public groups: Map<string,SyncsGroup> = new Map();



    /**
     * SyncsBasic Constructor
     * @constructor
     * @param {Server} server
     * @param {SyncsConfig} configs
     */
    constructor(server: Server, configs: SyncsConfig = {}) {
        super();
        this.webServer = server;
        this.initializeConfigs(configs);
        this.initializeWebSocketServer();
        this.initializeOnConnection();
    }




    /**
     * initialize configuration with user inputs or default configurations
     * @param {SyncsConfig} configs
     */
    private initializeConfigs(configs: SyncsConfig) {
        this.configs.path = configs.path || '/syncs';
        this.configs.closeTimeout = configs.closeTimeout || 10000;
        this.configs.debug = configs.debug || false;
    }


    /**
     * initialize WebSocket server
     */
    private initializeWebSocketServer() {
        this.webSocketServer = new WebSocket.Server({
            perMessageDeflate: false,
            server: this.webServer,
            path: this.configs.path
        });
    }


    /**
     * set on client connection
     * setting onMessage handler and starting handshake
     */
    private initializeOnConnection() {
        this.webSocketServer.on('connection', (clientWebSocket: WebSocket) => {
            let client = this.getClient(clientWebSocket);
            this.initializeOnMessage(client);
            this.sendHandShakeRequestCommand(client);
        });
    }

    /**
     * Generates SyncsClientBase instance
     * @param clientWebSocket
     * @return {SyncsClientBase}
     */
    protected getClient(clientWebSocket:WebSocket):SyncsClientBase{
        return new SyncsClientBase(clientWebSocket,this);
    }

    /**
     * set on message handler
     * routing to onCommand or emitting to message event
     * @param {SyncsClientBase} client
     */
    private initializeOnMessage(client: SyncsClientBase) {
        client.clientWebSocket.on('message', (message) => {
            let parsedMessage = SyncsBase.parseMessage(message);
            if (parsedMessage) {
                if(parsedMessage.command && parsedMessage.type){
                    this.onCommand(parsedMessage, client);
                }else if(client.socketId){
                    this.emit("message",parsedMessage, client);
                }else{
                    this.sendHandShakeRequestCommand(client);
                }

            }
        });
    }

    private static parseMessage(message: string): (boolean|any) {
        try {
            return JSON.parse(decodeURI(message));
        } catch (e) {
            return false;
        }
    }

    /**
     * send handshake request command
     * @param client
     */
    private sendHandShakeRequestCommand(client: SyncsClientBase) {
        SyncsBase.sendCommand({type: "getSocketId"}, client);
    }

    /**
     * @param {Object} message
     * @param {SyncsClientBase} client
     */
    public static sendCommand(message: any, client: SyncsClientBase) {
        message.command=true;
        if(client.syncsServer.configs.debug){
            console.log('OUTPUT COMMAND:',message);
        }

            client.clientWebSocket.send(encodeURI(JSON.stringify(message)));
    }

    /**
     * close and remove client from lists
     * @param {SyncsClientBase} client
     */
    public removeClient(client: SyncsClientBase) {
        client.clientWebSocket.close();
        this.clients.delete(client.socketId);
        client.groups().forEach(group => {
            group.remove(client);
        });
    }

    /**
     * make client available when handshake done
     * @param {SyncsClientBase} client
     */
    protected onHandShacked(client: SyncsClientBase) {
        let existClient = this.clients.get(client.socketId);
        if (existClient) {
            existClient.clientWebSocket = client.clientWebSocket;
            existClient.online = true;
            client = existClient;
            this.emit('re-connection', client);
        } else {
            client.online=true;
            this.clients.set(client.socketId, client);
            this.emit('connection', client);
        }
        this.setCloseEvents(client);
    }

    /**
     * set close event and actions
     * client connection will be close after config.closeTime ms
     * @param {SyncsClientBase} client
     */
    private setCloseEvents(client: SyncsClientBase) {
        client.clientWebSocket.on("close", () => {
            client.online = false;
            client.emit('disconnect', this);
            this.emit('client-disconnect', client);
            if (!client.handledClose) {
                setTimeout(() => {
                    if (!client.online) {
                        this.removeClient(client);
                        client.emit('close', client);
                        this.emit('client-close', client);
                    }
                }, this.configs.closeTimeout);
            }
        })
    }

    /**
     * add listener to message event callback list
     * onMessage is available after handshake process
     * @param {(data:any,client:SyncsClientBase)=>void} listener
     */
    public onMessage(listener: (data: any, client: SyncsClientBase) => void) {
        this.on("message", listener);
    }

    /**
     * add listener to connection event callback list
     * onConnection is available after handshake process
     * @param {(data:any,client:SyncsClientBase)=>void} listener
     */
    public onConnection(listener: (client: T) => void) {
        this.on('connection', listener);
    }


    /**
     * add listener to re-connection event callback list
     * onReConnection is available after handshake process
     * @param listener
     */
    public onReConnection(listener: (client: T) => void) {
        this.on('re-connection', listener);
    }

    /**
     * add listener to client-disconnect event callback list
     * client will be close after config.closeTime if re-handshaking does not happen
     * @param {(client)=>void} listener
     */
    public onClientDisconnect(listener: (client:T) => void) {
        this.on('client-disconnect', listener);
    }

    /**
     * add listener to client-close event callback list
     * @param {(client)=>void} listener
     */
    public onClientClose(listener: (client:T) => void) {
        this.on('client-close', listener);
    }


    /**
     * handle commands here
     * abstracted classes should override this method
     * @param {Object} command
     * @param {SyncsClientBase} client
     */
    protected onCommand(command: any, client: SyncsClientBase) {
        if(this.configs.debug){
            console.log('INPUT COMMAND:',command);
        }
        switch (command.type) {
            case 'reportSocketId':
                this.onReportSocketId(command.socketId, client);
                break;
        }
    }


    /**
     * allow user to create or access created client group
     * @param {string} name
     * @returns {SyncsGroup}
     */
    public group(name: string) {
        if (!this.groups.has(name)) {
            this.groups.set(name, new SyncsGroup(name));
        }
        return this.groups.get(name);
    }







    /**
     * client socketId report handler
     * @param {string} socketId
     * @param {SyncsClientBase} client
     */
    private onReportSocketId(socketId: string, client: SyncsClientBase) {
        if (socketId) {
            client.socketId = socketId;
            client.online = true;
        } else {
            this.setNewSocketId(client);

        }
        this.onHandShacked(client);
    }

    /**
     * create and set new socketId to client
     * @param {SyncsClientBase} client
     */
    private setNewSocketId(client: SyncsClientBase) {
        function generateGUID() {
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            }

            return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                s4() + '-' + s4() + s4() + s4();
        }

        client.socketId = generateGUID();
        SyncsBase.sendCommand({type: "setSocketId", socketId: client.socketId}, client);
    }

    /**
     * send simple message to clients
     * @param message
     * @return {SyncsClientBase[]} offline clients
     */
    send(message: any):SyncsClientBase[] {
        let rejected:SyncsClientBase[]=[];
        this.clients.forEach(client=>{
            if(!client.send(message)){
                rejected.push(client);
            }
        });
        return rejected;
    }







    // client script
    /**
     * fetch client side script
     * @returns {string} client script text
     */
    public get clientScript(): string {
        let address=require.resolve('syncs-browser');
        if (!this.clientScriptData) {
            this.clientScriptData = require('fs').readFileSync(address, 'utf8');
        }
        return this.clientScriptData;
    }


    /**
     * enables debug mode
     */
    public  enableDebugMode(){
        this.configs.debug=true;
    }

    /**
     * disables debug mode
     */
    public disableDebugMode(){
        this.configs.debug=false;
    }
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
    closeTimeout?: number

    /**
     * enables debug mode
     */
    debug?:boolean
}