require("./gameobjects.js");


//#region INIT
let http = require('http');
let server = http.createServer(function (request, response) {
});
let WebSocketServer = require('ws').Server;
let port = process.env.PORT;
server.listen(port, function () {
  console.log((new Date()) + " WS Server is listening on port " + port);
});

/*wsServer = new WebSocketServer({
  httpServer: server,
  keepaliveInterval: 5000,
  keepaliveGracePeriod: 1000,
  closeTimeout: 1000
});*/
wsServer = new WebSocketServer({ server });
wsServer.on('connection', onConnection);
//#endregion

let connections = [];

function onConnection(connection){
  
  let id = connections.push(connection);

  console.log((new Date()) + "New connection, ID: "+id);

    connection.on('message', message => {
      onMessage(message, id);
    });
    connection.on('close', e => {
      onClose(e, id);
    });



}

const fps = 1;

setInterval(() => {
  update();
}, 1000 / fps);

function update(){
  Player.players.forEach(p => {
    p.send(cont(p));
  });
}

function cont(ply) {
  var ptr = 0;
  const buffer = new ArrayBuffer(9);
  const view = new DataView(buffer);
  view.setUint8(ptr,1);
  ptr+=1;
  view.setFloat32(ptr,ply.control.x);
  ptr+=4;
  view.setFloat32(ptr,ply.control.y);
  return buffer;
}

function sendAll(data){
  connections.forEach(c => {
    c.send(data);
  });
}

function onMessage(message, user){
  let receiveBuffer = message.buffer.slice(message.byteOffset,message.byteOffset+message.byteLength);
  console.log("Message from "+user+" : "+receiveBuffer);
  parseMessage(receiveBuffer, user);
}

function onClose(event, user){
  console.log("Closed connection "+user+" Reason: "+event);
}

function parseMessage(buffer, player) {
  const view = new DataView(buffer);
  let ptr = 0;
  
  while (ptr < view.byteLength) {
    let head = view.getUint8(ptr);
    ptr+=1;
    switch (head) {
      case 1:
        Player.players[player].ship.control = parseInput(view,ptr);
        break;
    
      default:
        break;
    }
  }

}

function parseInput(view, ptr) {
  let controlVector = new Vector(0,0);
  controlVector.x = view.setFloat32(ptr);
  ptr+=4;
  controlVector.y = view.setFloat32(ptr);
  ptr+=4;

  return controlVector;
}

