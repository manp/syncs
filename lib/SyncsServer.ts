import {SyncsBase, SyncsConfig} from "./SyncsBase";
import * as WebSocket from "ws";
import {Server} from "http";
import {SyncsClientBase} from "./SyncsClientBase";
import {SyncsSharedObject} from "./SyncsSharedObject";
import {SyncsClient} from "./SyncsClient";
import {type} from "os";


/**
 * @class
 * extends SyncsBase to add abstraction layers
 */
export class SyncsServer extends SyncsBase<SyncsClient>{

    private subscriptions:Map< string,Set<(data:any,client:SyncsClientBase)=>void> >=new Map();
    private sharedObjects:Map<string,SyncsSharedObject>=new Map();
    private functionProxy:any;
    private rmiFunctions:any={};
    private rmiInterferers:{name:string,callback:Function}[]=[];



    /**
     * @constructor
     * @param {Server} server
     * @param {SyncsConfig} configs
     */
    constructor(server:Server,configs:SyncsConfig={}){
        super(server,configs);
    }


    protected getClient(clientWebSocket: WebSocket): SyncsClientBase {
        return new SyncsClient(clientWebSocket,this);
    }

    /**
     * send global shared data to hand-shacked clients
     * @param client
     */
    onHandShacked(client: SyncsClient){
        super.onHandShacked(client);

        this.sharedObjects.forEach(sharedObject=>{
            sharedObject.sendSyncCommand(client);
        })
    }


    /**
     * after handshaking each command enters in this method
     * @param {any} command
     * @param {SyncsClientBase} client
     */
    protected onCommand(command: any, client: SyncsClient) {
        super.onCommand(command, client);
        switch (command.type){
            case 'event':
                this.handleEventCommand(command,client);
                break;
            case 'sync':
                this.handleSyncCommand(command,client);
                break;
            case 'rmi':
                this.handleRMICommand(command,client);
                break;
            case 'rmi-result':
                this.handleRmiResultCommand(command,client);
        }
    }

    ///////////// EVENT ABSTRACTION LAYER ////////////////////////

    /**
     * handle event command
     * @param {any} command
     * @param {SyncsClientBase} client
     */
    private handleEventCommand(command:any, client:SyncsClientBase){
        if(command.event){
            let subscription=this.subscriptions.get(command.event);
            if(subscription){
                subscription.forEach((callback)=>{
                    callback(command.data,client);
                })
            }

        }
    }

    /**
     * developer can subscribe to events
     * @param {any} event
     * @param {SyncsClient} callback
     */
    public subscribe(event:string,callback:(data:any,client:SyncsClient)=>void){
        if(!this.subscriptions.has(event)){
            this.subscriptions.set(event,new Set());
        }
        this.subscriptions.get(event).add(callback);
    }

    /**
     * developer can unSubscribe from event
     * @param {any} event
     * @param {(data:any, client:SyncsClient)=>void} callback
     */
    public unSubscribe(event:string, callback:(data:any, client:SyncsClient)=>void){
        if(!this.subscriptions.has(event)){
            return;
        }
        this.subscriptions.get(event).delete(callback);
    }


    ///////////// SHARED VARIABLE ABSTRACTION LAYER ////////////////////////

    /**
     * handle incomming share object command
     * @param command
     * @param client
     */
    private handleSyncCommand(command:any,client:SyncsClientBase){
        (client as SyncsClient).setSyncData(command.name,command.key,command.value);
    }
    /**
     * developer can access shared object, or create a new shared object
     * this method creates global shared object
     * only webServer can change value of variable and it's readonly for client
     * @param name
     * @returns {any}
     */
    public shared(name:string):any{
        if(!this.sharedObjects.has(name)){
            this.sharedObjects.set(name,SyncsSharedObject.globalLevel(name,this,{},true));
        }
        return this.sharedObjects.get(name).data;
    }


    ///////////// RMI ABSTRACTION LAYER ////////////////////////

    /**
     * handle incomming remote method call
     * @param {any} command
     * @param {SyncsClient} client
     */
    private  handleRMICommand(command:any,client:SyncsClientBase){
        this.interfereRMI(command.name,command.args,client as SyncsClient).then(intfResult=>{

            if(intfResult==undefined){
                if(command.name in this.functions){
                    let result=this.functions[command.name].call(client,...command.args);
                    if(result instanceof Promise){
                        result.then(promiseResult=>{
                            this.sendRmiResultCommand(promiseResult,null,command.id,client);
                        }).catch(error=>{
                            this.sendRmiResultCommand(null,'function error',command.id,client);
                        })
                    }else{
                        this.sendRmiResultCommand(result,null,command.id,client);
                    }
                }else{
                    this.sendRmiResultCommand(null,'undefined',command.id,client);
                }
            }else{
                this.sendRmiResultCommand(intfResult,null,command.id,client);
            }
        });

    }
    /**
     * starts the process of interfering
     * @param {string} name
     * @param {any[]} args
     * @returns {Promise<any>}
     */
    private interfereRMI(name:string,args:any[],client:SyncsClient):Promise<any>{
        let interferes=this.getInterferersFunctions(name);

        return new Promise((resolve,reject)=>{
            checkNext();
            function checkNext(){
                let callback=interferes.shift();
                if(callback==undefined){
                    resolve(undefined);
                    return;
                }
                let result=callback(client,name,args);
                if(result==undefined){
                    checkNext();
                }else{
                    Promise.resolve(result).then(res=>{
                        if(res==undefined){
                            checkNext();
                        }else{
                            resolve(res);
                        }
                    },()=>checkNext());
                }



            }
        })



    }

    /**
     * get list of callbacks which can be interfered in this call
     * @param {string} name
     * @returns {Function[]}
     */
    private getInterferersFunctions(name:string):Function[]{
        let result:Function[]=[];
        for(let intf of this.rmiInterferers){
            if(new RegExp(intf.name).test(name)){
                result.push(intf.callback);
            }
        }
        return result;
    }

    public onRMI(name:string,callback:(client:SyncsClient,name:string,args:any[])=>void|any|Promise<any>){
        this.rmiInterferers.push({name:name,callback:callback});
    }
    /**
     * using this method,developer can declare remote invokable functions
     * @returns {any}
     */
    public get functions(){
        if(!this.functionProxy){
            this.functionProxy=new Proxy(this.rmiFunctions,{
                set:(target, property, value, receiver)=>{
                    this.rmiFunctions[property]=value;
                    return true;
                }
            })
        }
        return this.functionProxy;
    }


    /**
     * handle rmi result received from client
     * @param command
     * @param client
     */
    private handleRmiResultCommand(command:any,client:SyncsClient){
        client.handleRmiResult(command);
    }

    /**
     * send rmi result to client
     * @param result
     * @param error
     * @param id
     * @param client
     */
    private sendRmiResultCommand(result:any,error:any,id:string,client:SyncsClientBase){
        SyncsBase.sendCommand({
            type: "rmi-result",
            id:id,
            result: result,
            error:error
        },client);
    }

    /**
     * publish event to all clients
     * @param event
     * @param data
     */
    public publish(event:string,data:any):SyncsClient[]{
        let rejected:SyncsClient[]=[];
        this.clients.forEach(client=>{
            if(!(client as SyncsClient).publish(event,data)){
                rejected.push(client as SyncsClient);
            }
        });
        return rejected;
    }



}