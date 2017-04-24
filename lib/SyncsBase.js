"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WebSocket = require("ws");
const EventEmitter = require("events");
const SyncsGroup_1 = require("./SyncsGroup");
const SyncsClientBase_1 = require("./SyncsClientBase");
/**
 * @class
 * SyncsBase class
 */
class SyncsBase extends EventEmitter {
    /**
     * SyncsBasic Constructor
     * @constructor
     * @param {Server} server
     * @param {SyncsConfig} configs
     */
    constructor(server, configs = {}) {
        super();
        this.configs = {};
        this.clients = new Map();
        this.groups = new Map();
        this.webServer = server;
        this.initializeConfigs(configs);
        this.initializeWebSocketServer();
        this.initializeOnConnection();
    }
    /**
     * initialize configuration with user inputs or default configurations
     * @param {SyncsConfig} configs
     */
    initializeConfigs(configs) {
        this.configs.path = configs.path || '/syncs';
        this.configs.closeTimeout = configs.closeTimeout || 10000;
        this.configs.debug = configs.debug || false;
    }
    /**
     * initialize WebSocket server
     */
    initializeWebSocketServer() {
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
    initializeOnConnection() {
        this.webSocketServer.on('connection', (clientWebSocket) => {
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
    getClient(clientWebSocket) {
        return new SyncsClientBase_1.SyncsClientBase(clientWebSocket, this);
    }
    /**
     * set on message handler
     * routing to onCommand or emitting to message event
     * @param {SyncsClientBase} client
     */
    initializeOnMessage(client) {
        client.clientWebSocket.on('message', (message) => {
            let parsedMessage = SyncsBase.parseMessage(message);
            if (parsedMessage) {
                if (parsedMessage.command && parsedMessage.type) {
                    this.onCommand(parsedMessage, client);
                }
                else if (client.socketId) {
                    this.emit("message", parsedMessage, client);
                }
                else {
                    this.sendHandShakeRequestCommand(client);
                }
            }
        });
    }
    static parseMessage(message) {
        try {
            return JSON.parse(decodeURI(message));
        }
        catch (e) {
            return false;
        }
    }
    /**
     * send handshake request command
     * @param client
     */
    sendHandShakeRequestCommand(client) {
        SyncsBase.sendCommand({ type: "getSocketId" }, client);
    }
    /**
     * @param {Object} message
     * @param {SyncsClientBase} client
     */
    static sendCommand(message, client) {
        message.command = true;
        if (client.syncsServer.configs.debug) {
            console.log('OUTPUT COMMAND:', message);
        }
        client.clientWebSocket.send(encodeURI(JSON.stringify(message)));
    }
    /**
     * close and remove client from lists
     * @param {SyncsClientBase} client
     */
    removeClient(client) {
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
    onHandShacked(client) {
        let existClient = this.clients.get(client.socketId);
        if (existClient) {
            existClient.clientWebSocket = client.clientWebSocket;
            existClient.online = true;
            client = existClient;
            this.emit('re-connection', client);
        }
        else {
            client.online = true;
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
    setCloseEvents(client) {
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
        });
    }
    /**
     * add listener to message event callback list
     * onMessage is available after handshake process
     * @param {(data:any,client:SyncsClientBase)=>void} listener
     */
    onMessage(listener) {
        this.on("message", listener);
    }
    /**
     * add listener to connection event callback list
     * onConnection is available after handshake process
     * @param {(data:any,client:SyncsClientBase)=>void} listener
     */
    onConnection(listener) {
        this.on('connection', listener);
    }
    /**
     * add listener to re-connection event callback list
     * onReConnection is available after handshake process
     * @param listener
     */
    onReConnection(listener) {
        this.on('re-connection', listener);
    }
    /**
     * add listener to client-disconnect event callback list
     * client will be close after config.closeTime if re-handshaking does not happen
     * @param {(client)=>void} listener
     */
    onClientDisconnect(listener) {
        this.on('client-disconnect', listener);
    }
    /**
     * add listener to client-close event callback list
     * @param {(client)=>void} listener
     */
    onClientClose(listener) {
        this.on('client-close', listener);
    }
    /**
     * handle commands here
     * abstracted classes should override this method
     * @param {Object} command
     * @param {SyncsClientBase} client
     */
    onCommand(command, client) {
        if (this.configs.debug) {
            console.log('INPUT COMMAND:', command);
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
    group(name) {
        if (!this.groups.has(name)) {
            this.groups.set(name, new SyncsGroup_1.SyncsGroup(name));
        }
        return this.groups.get(name);
    }
    /**
     * client socketId report handler
     * @param {string} socketId
     * @param {SyncsClientBase} client
     */
    onReportSocketId(socketId, client) {
        if (socketId) {
            client.socketId = socketId;
            client.online = true;
        }
        else {
            this.setNewSocketId(client);
        }
        this.onHandShacked(client);
    }
    /**
     * create and set new socketId to client
     * @param {SyncsClientBase} client
     */
    setNewSocketId(client) {
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
        SyncsBase.sendCommand({ type: "setSocketId", socketId: client.socketId }, client);
    }
    /**
     * send simple message to clients
     * @param message
     * @return {SyncsClientBase[]} offline clients
     */
    send(message) {
        let rejected = [];
        this.clients.forEach(client => {
            if (!client.send(message)) {
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
    get clientScript() {
        let address = require.resolve('syncs-browser');
        if (!this.clientScriptData) {
            this.clientScriptData = require('fs').readFileSync(address, 'utf8');
        }
        return this.clientScriptData;
    }
    /**
     * enables debug mode
     */
    enableDebugMode() {
        this.configs.debug = true;
    }
    /**
     * disables debug mode
     */
    disableDebugMode() {
        this.configs.debug = false;
    }
}
exports.SyncsBase = SyncsBase;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3luY3NCYXNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiU3luY3NCYXNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EsZ0NBQWdDO0FBQ2hDLHVDQUF1QztBQUN2Qyw2Q0FBd0M7QUFDeEMsdURBQWtEO0FBR2xEOzs7R0FHRztBQUNILGVBQWtELFNBQVEsWUFBWTtJQVlsRTs7Ozs7T0FLRztJQUNILFlBQVksTUFBYyxFQUFFLFVBQXVCLEVBQUU7UUFDakQsS0FBSyxFQUFFLENBQUM7UUFmSixZQUFPLEdBQWdCLEVBQUUsQ0FBQztRQUczQixZQUFPLEdBQWdDLElBQUksR0FBRyxFQUFFLENBQUM7UUFDakQsV0FBTSxHQUEyQixJQUFJLEdBQUcsRUFBRSxDQUFDO1FBWTlDLElBQUksQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFDO1FBQ3hCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNoQyxJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQztRQUNqQyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztJQUNsQyxDQUFDO0lBS0Q7OztPQUdHO0lBQ0ssaUJBQWlCLENBQUMsT0FBb0I7UUFDMUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUksSUFBSSxRQUFRLENBQUM7UUFDN0MsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLEdBQUcsT0FBTyxDQUFDLFlBQVksSUFBSSxLQUFLLENBQUM7UUFDMUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEdBQUcsT0FBTyxDQUFDLEtBQUssSUFBSSxLQUFLLENBQUM7SUFDaEQsQ0FBQztJQUdEOztPQUVHO0lBQ0sseUJBQXlCO1FBQzdCLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxTQUFTLENBQUMsTUFBTSxDQUFDO1lBQ3hDLGlCQUFpQixFQUFFLEtBQUs7WUFDeEIsTUFBTSxFQUFFLElBQUksQ0FBQyxTQUFTO1lBQ3RCLElBQUksRUFBRSxJ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