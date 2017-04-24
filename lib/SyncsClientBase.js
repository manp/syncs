"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Created by manp on 3/19/17.
 */
const EventEmitter = require("events");
/**
 * @class
 * SyncsClientBase as an instance for each online user
 */
class SyncsClientBase extends EventEmitter {
    /**
     *
     * @param {WebSocket} clientWebSocket
     * @param {SyncsBase} syncsServer
     */
    constructor(clientWebSocket, syncsServer) {
        super();
        this.memberGroups = new Set();
        this.online = false;
        this.data = {};
        this.handledClose = false;
        this.clientWebSocket = clientWebSocket;
        this.syncsServer = syncsServer;
    }
    /**
     * send message to client
     * @param {any} message
     * @returns {boolean}
     */
    send(message) {
        if (this.online) {
            this.clientWebSocket.send(encodeURI(JSON.stringify(message)));
            return true;
        }
        return false;
    }
    /**
     * get groups that this client is members in
     * @returns {Set<SyncsGroup>}
     */
    groups() {
        return this.memberGroups;
    }
    /**
     * close client and remove it from list of online client
     */
    close() {
        this.handledClose = true;
        this.syncsServer.removeClient(this);
    }
    /**
     * event handler for client disconnect
     * @param listener
     */
    onDisconnect(listener) {
        this.on('disconnect', listener);
    }
    /**
     * event handler for client close
     * client close will happen after closeTimeout config in SyncsServer constructor
     * @param listener
     */
    onClose(listener) {
        this.on('close', listener);
    }
}
exports.SyncsClientBase = SyncsClientBase;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3luY3NDbGllbnRCYXNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiU3luY3NDbGllbnRCYXNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7O0dBRUc7QUFDSCx1Q0FBdUM7QUFNdkM7OztHQUdHO0FBQ0gscUJBQTZCLFNBQVEsWUFBWTtJQVU3Qzs7OztPQUlHO0lBQ0gsWUFBbUIsZUFBeUIsRUFBQyxXQUFzQztRQUMvRSxLQUFLLEVBQUUsQ0FBQztRQWJMLGlCQUFZLEdBQWlCLElBQUksR0FBRyxFQUFFLENBQUM7UUFFdkMsV0FBTSxHQUFDLEtBQUssQ0FBQztRQUNiLFNBQUksR0FBSyxFQUFFLENBQUM7UUFFWixpQkFBWSxHQUFDLEtBQUssQ0FBQztRQVN0QixJQUFJLENBQUMsZUFBZSxHQUFDLGVBQWUsQ0FBQztRQUNyQyxJQUFJLENBQUMsV0FBVyxHQUFDLFdBQVcsQ0FBQztJQUNqQyxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNJLElBQUksQ0FBQyxPQUFXO1FBQ25CLEVBQUUsQ0FBQSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQSxDQUFDO1lBQ1osSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzlELE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDaEIsQ0FBQztRQUNELE1BQU0sQ0FBQyxLQUFLLENBQUM7SUFDakIsQ0FBQztJQUVEOzs7T0FHRztJQUNJLE1BQU07UUFDVCxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQztJQUM3QixDQUFDO0lBRUQ7O09BRUc7SUFDSSxLQUFLO1FBQ1IsSUFBSSxDQUFDLFlBQVksR0FBQyxJQUFJLENBQUM7UUFDdkIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDeEMsQ0FBQztJQUVEOzs7T0FHRztJQUNILFlBQVksQ0FBQyxRQUF1QztRQUNoRCxJQUFJLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBQyxRQUFRLENBQUMsQ0FBQztJQUNuQyxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILE9BQU8sQ0FBQyxRQUF1QztRQUMzQyxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBQyxRQUFRLENBQUMsQ0FBQztJQUM5QixDQUFDO0NBQ0o7QUFsRUQsMENBa0VDIn0=