
import {SyncsClientBase} from "./SyncsClientBase";
import * as WebSocket from "ws";
import {SyncsBase} from "./SyncsBase";
import {SyncsSharedObject} from "./SyncsSharedObject";
import {SyncsServer} from "./SyncsServer";

/**
 * @class
 * extends GroupClientBase to add real-time functionality
 */
export class SyncsClient extends SyncsClientBase{
    private sharedObjects:Map<string,SyncsSharedObject>=new Map();
    private rmiResultCallbacks:Map<string, [Function,Function] > =new Map();


    constructor(clientWebSocket:WebSocket,syncsServer:SyncsServer){
        super(clientWebSocket,syncsServer);
    }


    /**
     * publish an event to with data to client
     * @param event
     * @param data
     */
    public publish(event:string,data:any):boolean{
        if(this.online){
            SyncsBase.sendCommand({type:'event',event:event.toString(),data:data},this);
            return true;
        }
        return false;
    }


    /**
     * get shared variable
     * this variable is write-able for client
     * @param name
     * @returns {any}
     */
    public shared(name:string,readOnly=false):any{
        if(!this.sharedObjects.has(name)){
            this.sharedObjects.set(name,SyncsSharedObject.clientLevel(name,this,{},readOnly));
        }
        return this.sharedObjects.get(name).data;
    }



    /**
     * set incoming sync data
     * @param name
     * @param key
     * @param value
     */
    public setSyncData(name:string,key:string,value:any){
        if(this.sharedObjects.has(name)){
            this.sharedObjects.get(name).setClientData(key,value);
        }
    }


    /**
     * get remote object that enables webServer to call remote methods
     * @returns {any}
     */
    public get remote():any{
        return new Proxy({},{
            get:(target,property,receiver)=>this.onGetRemoteMethod(target,property,receiver)
        })
    }

    /**
     * this method calls when webServer tries to call remote method
     * @param target
     * @param property
     * @param receiver
     * @returns {()=>undefined}
     */
    private onGetRemoteMethod(target:any,property:any,receiver:any){
        let client=this;
        let id=this.generateRMIRequestUID();

        return function(){
            let args:any[]=[];
            for(let name in arguments){
                args[name]=arguments[name];
            }
            client.sendRMICommand(property,args,id);
            return new Promise((resolve,reject)=>{
                client.rmiResultCallbacks.set(id,[resolve,reject]);
            });
        }
    }

    private generateRMIRequestUID() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }

        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    }
    /**
     * send RMI command to client
     * @param name
     * @param args
     */
    private sendRMICommand(name:string,args:any,id:string){
        if(!this.online){
            return;
        }
        SyncsBase.sendCommand({
            type:"rmi",
            id:id,
            name:name,
            args:args

        },this);
    }
    public handleRmiResult(command:any){
        let callbacks=this.rmiResultCallbacks.get(command.id);
        if(command.error){
            callbacks[1].call(this,command.error);
        }else{
            callbacks[0].call(this,command.result);
        }
        this.rmiResultCallbacks.delete(command.id);
    }

}

