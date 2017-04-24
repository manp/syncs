import {SyncsBase} from "./SyncsBase";
import {SyncsGroup} from "./SyncsGroup";
import {SyncsClientBase} from "./SyncsClientBase";
import {SyncsServer} from "./SyncsServer";

/**
 * @class
 * this class adds shared object functionality to SyncsServer framework
 */
export class SyncsSharedObject{
    public name:string;
    public rawData:any=function(event:{values:any,by:string}){};
    private type:string;
    private readOnly=true;
    private syncsServer:SyncsServer;
    private groupObject:SyncsGroup;
    private clientObject:SyncsClientBase;
    private onChangeHandler:(event:{values:any,by:string})=>void;
    private proxy:any;
    private constructor(){
    }

    /**
     * get global level shared variable
     * @param name
     * @param syncsServer
     * @param initializeData
     * @param readOnly
     * @returns {SyncsSharedObject}
     */
    public static globalLevel(name:string,syncsServer:SyncsServer, initializeData={}, readOnly=true):SyncsSharedObject{
        let result=new SyncsSharedObject();
        result.name=name;
        result.syncsServer=syncsServer;
        result.type='GLOBAL';
        result.readOnly=readOnly;
        result.rawData.data=initializeData;
        result.initialize();
        return result;
    }

    /**
     * get group level shared variable
     * @param name
     * @param group
     * @param initializeData
     * @param readOnly
     * @returns {SyncsSharedObject}
     */
    public static groupLevel(name:string, group:SyncsGroup, initializeData={}, readOnly=true):SyncsSharedObject{
        let result=new SyncsSharedObject();
        result.name=name;
        result.groupObject=group;
        result.type='GROUP';
        result.readOnly=readOnly;
        result.rawData.data=initializeData;
        result.initialize();

        return result;
    }

    /**
     * get client level shared variable
     * @param name
     * @param client
     * @param initializeData
     * @param readOnly
     * @returns {SyncsSharedObject}
     */
    public static clientLevel(name:string, client:SyncsClientBase, initializeData={}, readOnly=false):SyncsSharedObject{
        let result=new SyncsSharedObject();
        result.name=name;
        result.clientObject=client;
        result.type='CLIENT';
        result.readOnly=readOnly;
        result.rawData.data=initializeData;
        result.initialize();

        return result;
    }

    /**
     * initialize shared variable
     */
    initialize(){
        this.proxy=new Proxy(this.rawData,this.getHandler());
    }

    /**
     * inner method to handle proxy in shared variable
     * by using this method proxy can watch changes in shared variable
     * @returns {{get: ((target:any, property:any, receiver:any)=>any|string|number), set: ((target:any, property:any, value:any, receiver:any)=>boolean), apply: ((target:any, thisArg:any, argumentsList:any)=>any)}}
     */
    private getHandler(){
        return {
            get:(target:any,property:any,receiver:any)=>this.onGet(target,property,receiver),
            set:(target:any, property:any, value:any, receiver:any)=>this.onSet(target, property, value, receiver),
            apply:(target:any, thisArg:any, argumentsList:any)=>this.onApply(target, thisArg, argumentsList)
        }
    }

    /**
     * this handler call each time that anyone tries to get property inside shared variable
     * @param target
     * @param property
     * @param receiver
     * @returns {any}
     */
    private onGet(target:any,property:any,receiver:any){
        if(property in this.rawData.data){
            return this.rawData.data[property];
        }
        return null;
    }

    /**
     *  this handler call each time that anyone tries to set property inside shared variable
     * @param target
     * @param property
     * @param value
     * @param receiver
     * @returns {boolean}
     */
    private onSet(target:any, property:any, value:any, receiver:any){
        this.rawData.data[property]=value;
        this.sync(property);
        let values:any={};
        values[property]=value;
        if(this.onChangeHandler){
            this.onChangeHandler({values:values,by:'webServer'})
        }
        return true;
    }

    /**
     * this property used to handle onChange event on shared variable
     * using this method developers can register a handler to monitor changes on shared variable
     * @param target
     * @param thisArg
     * @param argumentsList
     * @returns {any}
     */
    private onApply(target:any, thisArg:any, argumentsList:any){
        if(argumentsList.length>0){
            this.onChangeHandler=argumentsList[0];
        }
        return this.proxy;
    }

    /**
     * this method publishes change in shared variable to clients
     * @param property
     */
    private sync(property:string){
        let clients:SyncsClientBase[]=this.getClients();
        clients.forEach(client=>{
            this.sendSyncCommand(client,property);
        })
    }

    /**
     * send sync command to clients
     * @param client
     * @param property
     */
    sendSyncCommand(client:SyncsClientBase, property:any=null){
        if(!client.online){
            return;
        }
        let values:any={};
        if (property){
            values[property]=this.rawData.data[property];
        }
        else{
            values=this.rawData.data;
        }
        let command: {type: string; name: string; scope: string; values: any; group: string} = {
            type: 'sync',
            name: this.name,
            scope: this.type,
            values: values,
            group: null
        }
        if(this.type=='GROUP'){
            command.group=this.groupObject.name;
        }else{
            delete command.group;
        }
        SyncsBase.sendCommand(command,client);
    }

    /**
     * get list of clients who should know about changes in shared variable
     * @returns {any}
     */
    private getClients():SyncsClientBase[]{
        switch (this.type){
            case 'CLIENT':
                return [this.clientObject];
            case 'GROUP':
                return [...this.groupObject.clients.values()];
            case 'GLOBAL':
                return [...this.syncsServer.clients.values()];

        }
    }

    /**
     * this method abstracts SharedVariable object to simple object
     * @returns {any}
     */
    public get data():any{
        return this.proxy;
    }


    /**
     * set incoming changes from client
     * this method only handles client level shared data
     * @param key
     * @param value
     */
    setClientData(key:string,value:any){
        if(key in this.rawData.data && !this.readOnly){
            this.rawData.data[key]=value;
            if(this.onChangeHandler){
                let values:any={};
                values[key]=value;
                this.onChangeHandler({values:values,by:'client'})
            }
        }
    }

}