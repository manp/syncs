"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SyncsSharedObject_1 = require("./SyncsSharedObject");
/**
 * @class
 * this class represents as a group of client
 * it enables developer to add client to group or send group messages
 */
class SyncsGroup {
    /**
     * create a group with given name
     * @param name
     */
    constructor(name) {
        this.name = "";
        this.clients = new Set();
        this.sharedObjects = new Map();
        this.name = name;
    }
    /**
     * add client to group
     * @param client
     */
    add(client) {
        this.clients.add(client);
        client.memberGroups.add(this);
        this.publishSharedData(client);
        return this;
    }
    /**
     * send group shared data to client
     * @param client
     */
    publishSharedData(client) {
        this.sharedObjects.forEach(sharedObject => {
            sharedObject.sendSyncCommand(client);
        });
    }
    /**
     * remove client from group
     * @param client
     */
    remove(client) {
        this.clients.delete(client);
        client.memberGroups.delete(this);
        return this;
    }
    /**
     * get list of client in this group except given array of client
     * @param clients
     * @returns {SyncsGroup}
     */
    except(...clients) {
        let result = new SyncsGroup(this.name + "_excluded");
        result.clients = new Set(this.clients);
        for (let client of clients) {
            result.clients.delete(client);
        }
        return result;
    }
    /**
     * send message to group clients
     * @param message
     * @returns {boolean}
     */
    send(message) {
        this.clients.forEach((client) => {
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
    shared(name) {
        if (!this.sharedObjects.has(name)) {
            this.sharedObjects.set(name, SyncsSharedObject_1.SyncsSharedObject.groupLevel(name, this, {}, true));
        }
        return this.sharedObjects.get(name).data;
    }
    publish(event, data) {
        this.clients.forEach(client => {
            client.publish(event, data);
        });
        return this;
    }
}
exports.SyncsGroup = SyncsGroup;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3luY3NHcm91cC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIlN5bmNzR3JvdXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFFQSwyREFBc0Q7QUFFdEQ7Ozs7R0FJRztBQUNIO0lBS0k7OztPQUdHO0lBQ0gsWUFBWSxJQUFZO1FBUmpCLFNBQUksR0FBUSxFQUFFLENBQUM7UUFDZixZQUFPLEdBQXNCLElBQUksR0FBRyxFQUFFLENBQUM7UUFDdEMsa0JBQWEsR0FBK0IsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQU8xRCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztJQUNyQixDQUFDO0lBRUQ7OztPQUdHO0lBQ0ksR0FBRyxDQUFDLE1BQXNCO1FBQzdCLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3pCLE1BQU0sQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzlCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMvQixNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFRDs7O09BR0c7SUFDTyxpQkFBaUIsQ0FBQyxNQUFzQjtRQUM5QyxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxZQUFZO1lBQ25DLFlBQVksQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDekMsQ0FBQyxDQUFDLENBQUE7SUFDTixDQUFDO0lBQ0Q7OztPQUdHO0lBQ0ksTUFBTSxDQUFDLE1BQXNCO1FBQ2hDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzVCLE1BQU0sQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2pDLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUdEOzs7O09BSUc7SUFDSSxNQUFNLENBQUMsR0FBRyxPQUFxQjtRQUNqQyxJQUFJLE1BQU0sR0FBQyxJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ2pELE1BQU0sQ0FBQyxPQUFPLEdBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3JDLEdBQUcsQ0FBQSxDQUFDLElBQUksTUFBTSxJQUFJLE9BQU8sQ0FBQyxDQUFBLENBQUM7WUFDcEIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDckMsQ0FBQztRQUNELE1BQU0sQ0FBQyxNQUFNLENBQUM7SUFDbkIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSSxJQUFJLENBQUMsT0FBVztRQUNuQixJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU07WUFDeEIsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNyQixNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2hCLENBQUMsQ0FBQyxDQUFDO1FBQ0gsTUFBTSxDQUFDLEtBQUssQ0FBQztJQUNqQixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSSxNQUFNLENBQUMsSUFBVztRQUNyQixFQUFFLENBQUEsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUEsQ0FBQztZQUM5QixJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUMscUNBQWlCLENBQUMsVUFBVSxDQUFDLElBQUksRUFBQyxJQUFJLEVBQUMsRUFBRSxFQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDakYsQ0FBQztRQUNELE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDN0MsQ0FBQztJQUtNLE9BQU8sQ0FBQyxLQUFZLEVBQUMsSUFBUTtRQUNoQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNO1lBQ3RCLE1BQXNCLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBQyxJQUFJLENBQUMsQ0FBQztRQUNoRCxDQUFDLENBQUMsQ0FBQztRQUNILE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDaEIsQ0FBQztDQUNKO0FBN0ZELGdDQTZGQyJ9