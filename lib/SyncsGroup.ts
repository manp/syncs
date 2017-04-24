import {SyncsClient} from "./SyncsClient";
import {SyncsClientBase} from "./SyncsClientBase";
import {SyncsSharedObject} from "./SyncsSharedObject";

/**
 * @class
 * this class represents as a group of client
 * it enables developer to add client to group or send group messages
 */
export class SyncsGroup{
    public name:string="";
    public clients:Set<SyncsClientBase>=new Set();
    private sharedObjects:Map<string,SyncsSharedObject>=new Map();

    /**
     * create a group with given name
     * @param name
     */
    constructor(name: string) {
        this.name = name;
    }

    /**
     * add client to group
     * @param client
     */
    public add(client:SyncsClientBase):SyncsGroup{
        this.clients.add(client);
        client.memberGroups.add(this);
        this.publishSharedData(client);
        return this;
    }

    /**
     * send group shared data to client
     * @param client
     */
    protected publishSharedData(client:SyncsClientBase){
        this.sharedObjects.forEach(sharedObject=>{
            sharedObject.sendSyncCommand(client);
        })
    }
    /**
     * remove client from group
     * @param client
     */
    public remove(client:SyncsClientBase):SyncsGroup{
        this.clients.delete(client);
        client.memberGroups.delete(this);
        return this;
    }


    /**
     * get list of client in this group except given array of client
     * @param clients
     * @returns {SyncsGroup}
     */
    public except(...clients:SyncsClient[]):SyncsGroup{
         let result=new SyncsGroup(this.name+"_excluded");
         result.clients=new Set(this.clients);
         for(let client of clients){
                result.clients.delete(client);
         }
         return result;
    }

    /**
     * send message to group clients
     * @param message
     * @returns {boolean}
     */
    public send(message:any):boolean{
        this.clients.forEach((client)=>{
            client.send(message);
            return true;
        });
        return false;
    }

    /**
     * get shared variable for group
     * this variable is readonly by clients
     * @param name
     * @returns {any}
     */
    public shared(name:string):any{
        if(!this.sharedObjects.has(name)){
            this.sharedObjects.set(name,SyncsSharedObject.groupLevel(name,this,{},true));
        }
        return this.sharedObjects.get(name).data;
    }




    public publish(event:string,data:any):SyncsGroup{
        this.clients.forEach(client=>{
            (client as SyncsClient).publish(event,data);
        });
        return this;
    }
}