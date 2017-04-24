[![Syncs Logo](https://www.imageupload.co.uk/images/2017/04/24/logo.png)](https://www.npmjs.com/package/syncs)

[![npm](https://img.shields.io/npm/v/syncs.svg)](https://www.npmjs.com/package/syncs)
[![node](https://img.shields.io/node/v/syncs.svg)](https://nodejs.org/en/download/)
[![npm](https://img.shields.io/npm/dt/syncs.svg)](https://www.npmjs.com/package/syncs)
[![dependencies Status](https://david-dm.org/manp/syncs/status.svg)](https://david-dm.org/manp/syncs)
# Syncs
A JavaScript Library for Real-Time Web Applications


## Installation

```bash
npm install syncs --save
```

## Initialization

Syncs is easy to initialize. Syncs is developed with _typescript_ language.

Sample projects are avilable [here](https://github.com/manp/syncs-samples).
### Server Initialization
Syncs instance works with native nodejs _http_ server.

```typescript
import * as http from "http";
import syncs from "syncs";

let server=http.createServer()
let io=syncs(server);
server.listen(8080);
```

Developers are able to use light web frameworks like _express_.
```typescript
import * as http from "http";
import * as express from "express";
import syncs from "syncs";

let app=express();
let server=http.createServer(app);
let io=new syncs(server);

server.listen(8080);
```

#### Server Configuration
Sync module contains `SyncServer` class which acts as WebSocket server. With TypeScript language there is defualt module export to create `SyncServer` instance.
`SyncsServer` constructor has two parameter.

+ `Server`: an instance of NodeJs `http` server.
+ `config`: an instance of `SyncsConfig` interface:
    + `path : string` : real-time serving path. default value is `/syncs`.
    + `closeTimeout : number`: times in millisecond that server waits after client disconnect, then it will remove the client from list of clients and groups. default value is `10000`.
    + `debug : boolean`: enables debug mode to log input and output commands. default value is `false`.
    

```typescript
let io=new SyncsServer(server,{
    path:'/real-time',
    closeTimeout:5000,
    debug:true
})
```
It's also possible to enable debug mode using `io.enableDebugMode()` and disable it with `io.disableDebugMode()` methods.

### Client Initialization
Syncs clients are developed to run on both Browser and NodeJs :
+ [Syncs Client for Browser](https://github.com/manp/syncs-browser)
+ [Syncs Client for NodeJs](https://github.com/manp/syncs-node)

The rest of this documentation uses _Browser Client Script_.

 There is two way to setup the [Browser Client Script](https://github.com/manp/syncs-browser).
  
 1. Developers can download javascripts file from this [link](https://github.com/manp/syncs-browser/releases/tag/1.0) and add the `syncs.js` file to assets directory.
 2. On server side it's possible to access client script from `Syncs` instance:
    ```typescript
        app.get('/syncs.js',(req,res)=>{
            res.send(io.clientScript);
        })
    ```
    
 After serving client script, developers should include it in html page and create an instance of `Syncs` class.
 ```html
    <!doctype html>
    <html >
    <head>
    <meta charset="UTF-8">
         <script src="syncs.js"></script>        
    </head>
        <body>
          
        </body>
        <script>
            let io=new Syncs();
        </script>
    </html>
```
Client Script constructor has config parameter:
+ `path:string`: WebSocket url begins with `ws://` protocol. default value is `ws://domain/realtime` which domain name will sets automatically.
+ `autoConnect:boolean`: If `autoConnect` is `false` then the Syncs instance will not connect to server on creation. To connect manuly to server developers should call `io.connect()` method. default value is `true`.
+ `autoReconnect:boolean`: This config makes the connection presistent on connection drop. default value is `true`.
+ `reconnectDelay: number`: time to wait befor each reconnecting try. default value is `10000`.
+ `debug:bolean`: This parameter enables debug mode on client side. default value is `false`.

## Handling connections
On both server and client side it's easy to handle client connection status change.

#### Handling client connection on server side
using `onConnection` on server side developers can notify about client connection to Syncs Server.
```typescript
    //io as Syncs instance on server side
    io.onConnection(client=>{
        
    })
```
By any reason if client disconnects from Syncs Server, server waits for client connection. By using `onClientDisconnect` method of `SyncsServer` instance or `onDisconnect` method of `SyncsClient` instance developers can handle disconnect event.
```typescript
    io.onClientDisconnect(client=>{
        //handle client disconnection
    })
```
```typescript
    client.onDisconnect(()=>{
        //handle client disconnection
    })
```

After a specific time which developers can change with `closeTimeout`, `close` event will happen on server side. after this event client instance will be removed from clients list and groups.
 Developers can handle this event from both `SyncsServer` and `SyncsClient` instances.
  ```typescript
    io.onClientClose(client=>{
        //handle close event
    })
```
```typescript
    client.onClose(()=>{
        //handle close event
    })
```

Also server can disconnect and close client by calling `close`  
#### Handling client connection on client side
On client side when the connection is established and hand shaking process completes, developers can notify with `onOpen` event handler.
 ```typescript
    io.onOpen(()=>{
        // after first connection or reconnecting to server this function will be called
    })
```

Developers can handle _disconnect_ and _close_ event with `onDisconnect` and `onClose`  method.
```typescript
    io.onDisconnect(()=>{
            
    })
```
```typescript
    io.onClose(()=>{
            
    })
```

Also it's possible to disconnect from server using `disconnect` method.
```typescript
    io.disconnect();
```


## Client Groups on Server Side
It's possible to manage clients in groups. `SyncsGroup` class is responsible to manage group of clients. Using groups developers can send messages and access abstraction functions on group of clients.
 
 `group` method of `SyncsServer` instance will return named `SyncsGroup` instance.
 ```typescript
    let guestGroup=io.group('guests');
```
Developers can add,remove and exclude client from a group.
```typescript
    io.onConnection(client=>{
        io.group('guests').add(client);
    })
```
```typescript
    function addToVip(client:SyncsClient){
        io.group('guests').remove(client);
        io.group('vips').add(client);
    }
```
```typescript
    function broadCastEnterance(client:SyncsClient){
        io.group('vips').except(client).send({message:"new client"});
    }
```
When a client link closed, the instance of that client will remove from all groups.

## Abstraction Layers

Syncs provides four abstraction layer over its real-time functionality for developers.

### 1. onMessage Abstraction Layer
This type of real-time development is primary type between other solutions and uses fundamental functionality of WebSocket. If data and functionality around that in web is simple, onMessage as a simple messaging solution may fit developers need.
With Syncs it’s possible to access WebSocket functionality in low level mode. In this mode developer should handle all data transfer controls.

Developers can send messages using `send` method of `SyncsClient` instance on server side to send `JSON` message to the client. on client side, by using `onMessage` method of `Syncs` instance developers can recive all incoming messages.


```typescript
//server side
io.onConnection(client=>{
    client.send({text:"welcome"});
})
```

```typescript
//client side
io.onMessage(message=>{
    alert(message.text);
})
```

It's possible to send message from client to server.
```typescript
//client side
function setName(newName){
    io.send({name:newName});
}
```
```typescript
io.onMessage((message,client)=>{
    client.data.name=message.name;
})
```

On server side it's possible to send messages to group of clients
```typescript
//server side
function sendServerTime(){
    io.group('authenticated').send({time:new Date().toTimeString()})
}
```
Developers should add extra properties to distinguish between messages.



### 2. Publish and Subscribe Abstraction Layer
 With a Publish and Subscribe solution developers normally subscribe to data using a string identifier. This is normally called a Channel, Topic or Subject.
 
 Both server and client can publish or subscribe to event.
 `publish` method is accessible from `SyncsServer`, `SyncsGroup` and `SyncsClient` instances on server side.
 ```typescript
// server side
//sends time too all clients
function sendTime(){
    io.publish('time-report',{time:new Date})
}
//add client to group and report client entrance to group
function registerInGroup(groupName:string,client:SyncsClient){
    io.group(groupName).add(client).except(client).publish('new-member',{name:client.data.name});
}
//publish direct message to single client
function directMessage(client:SyncsClient,message:string,from:string){
    client.publish('direct-message',{from:from,message:message});
}

function waitForMessage(){
    io.subscribe('public-message',(data,client)=>{
        io.publish('public-message',{message:data.message,from:client.data.name})
    })
}
```
```typescript
io.subscribe('time-report',data=>{
    console.log(data.time);
})
io.subscribe('new-member',data=>{
    //update members list
})
io.subscribe('direct-message',data=>{
    //show direct message to user
})

function sendPublicMessage(message:string){
    io.publish('public-message',{message:message});
}
```

It's possible to disable subscription to event using `unSubscribe` method.
 
 
 ### 3. Shared Data Abstraction Layer
Syncs provides Shared Data functionality in form of variable sharing. Shared variables can be accessible in tree level: _Global Level_, _Group Level_ and _Client Level_.
Global Level and Group Level shared objects are readonly by client. Client Level shared object are write-able by client but server can make readonly client level shared object.
  
```typescript
//server side
// reporting online users to all clients
let info=io.shared('info');
info.onlineUsers=0;
io.onConnection(client=>{
    info.onlineUsers++;
});
io.onClientClose(client=>{
    info.onlineUsers--;
})
```

```typescript
//client side
let info=io.shared('info');

function logOnlineUsers(){
    console.log(info.onlineUsers);
}
```

It's possible to get shared variable in Group Level
```typescript
//server side
function setGroupTopic(groupName:string,topic:string){
    io.group(groupName).shared('settings').topic=topic;
}
```

Client Level shared object by default is write-able by client.
 ```typescript
    // server side
    function setName(client,name){
        client.shared('profile').name=name;
    }
```
```typescript
    //client side
    function setName(name){
        io.shared('profile').name=name;
    }
```

Developers can create read only variables by passing second parameter to `share` method.
 ```typescript
    //server side
    client.shared('session',true).id=getSessionId();
```

It's possible to add listener to check shared variable change.
shared variable object returned by `shared` method can bee called as a function to add listener.
Developers should pass a callback function to handle change event.

```typescript
// client side
let info=io.shared('info');

info((values,by)=>{
   //handle changes
});
```

The callback function has two argument.
+ `values:object`: an object that contains names of changed properties and new values.
+ `by:string` a string variable with two value ( `'server'` and `'client'`) which shows who changed these properties.


### 4. Remote Method Invocation (RMI) Abstraction Layer
With help of RMI developers can call and pass argument to remote function and make it easy to develop robust and web developed application. RMI may abstract things away too much and developers might forget that they are making calls _over the wire_.

Before calling remote method developer should declare the function on client or server script.

`functions` object in `io` is the place to declare functions.

```typescript
//clint side
io.functions.showMessage=function(message) {
  alert(message);
}
```
The caller side can access remote method using `remote` object.

```typescript
//server side
cliet.remote.showMessage('welcome...');
```


The remote side can return a result which is accessible using `Promise` object returned by caller side.

```typescript
//client side
io.functions.getUserVote=function(message:string,options:string[]){
    let userVote=askUser(message,options);
    return userVote;
}
```

```typescript
//server side
cliet.remote.getUserVote(
    "Which programming language is better?",
    ['C#','Java','Javascript','Python']).then(result=>{
        // handle result ...
    })
```

Remote side can return another Promise object if the result is not accessible yet.

