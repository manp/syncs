import { SyncsClient } from "./SyncsClient";
import { SyncsClientBase } from "./SyncsClientBase";
/**
 * @class
 * this class represents as a group of client
 * it enables developer to add client to group or send group messages
 */
export declare class SyncsGroup {
    name: string;
    clients: Set<SyncsClientBase>;
    private sharedObjects;
    /**
     * create a group with given name
     * @param name
     */
    constructor(name: string);
    /**
     * add client to group
     * @param client
     */
    add(client: SyncsClientBase): SyncsGroup;
    /**
     * send group shared data to client
     * @param client
     */
    protected publishSharedData(client: SyncsClientBase): void;
    /**
     * remove client from group
     * @param client
     */
    remove(client: SyncsClientBase): SyncsGroup;
    /**
     * get list of client in this group except given array of client
     * @param clients
     * @returns {SyncsGroup}
     */
    except(...clients: SyncsClient[]): SyncsGroup;
    /**
     * send message to group clients
     * @param message
     * @returns {boolean}
     */
    send(message: any): boolean;
    /**
     * get shared variable for group
     * this variable is readonly by clients
     * @param name
     * @returns {any}
     */
    shared(name: string): any;
    publish(event: string, data: any): SyncsGroup;
}
