/**
 * Created by manp on 3/19/17.
 */
import * as EventEmitter from 'events';
import * as WebSocket from "ws";
import {SyncsGroup} from "./SyncsGroup";
import {SyncsBase} from "./SyncsBase";


/**
 * @class
 * SyncsClientBase as an instance for each online user
 */
export class SyncsClientBase extends EventEmitter{
    public clientWebSocket:WebSocket;

    public memberGroups:Set<SyncsGroup>=new Set();
    public socketId:string;
    public online=false;
    public data:any={};
    public syncsServer:SyncsBase<SyncsClientBase>;
    public handledClose=false;

    /**
     *
     * @param {WebSocket} clientWebSocket
     * @param {SyncsBase} syncsServer
     */
    public constructor(clientWebSocket:WebSocket,syncsServer:SyncsBase<SyncsClientBase>){
        super();
        this.clientWebSocket=clientWebSocket;
        this.syncsServer=syncsServer;
    }

    /**
     * send message to client
     * @param {any} message
     * @returns {boolean}
     */
    public send(message:any):boolean {
        if(this.online){
            this.clientWebSocket.send(encodeURI(JSON.stringify(message)));
            return true;
        }
        return false;
    }

    /**
     * get groups that this client is members in
     * @returns {Set<SyncsGroup>}
     */
    public groups():Set<SyncsGroup>{
        return this.memberGroups;
    }

    /**
     * close client and remove it from list of online client
     */
    public close(){
        this.handledClose=true;
        this.syncsServer.removeClient(this);
    }

    /**
     * event handler for client disconnect
     * @param listener
     */
    onDisconnect(listener:(client:SyncsClientBase)=>void){
        this.on('disconnect',listener);
    }

    /**
     * event handler for client close
     * client close will happen after closeTimeout config in SyncsServer constructor
     * @param listener
     */
    onClose(listener:(client:SyncsClientBase)=>void){
        this.on('close',listener);
    }
}