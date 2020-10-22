const { Vector, ShipType, Ship, Player } = require("./gameobjects.js");
const { Datagram, Datagrams, AutoView} = require("./datagram.js");

//#region INIT
let http = require('http');
let server = http.createServer(function (request, response) {
});
let WebSocketServer = require('ws').Server;
let port = process.env.PORT || 20003;
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

function onConnection(connection) {

  let p = new Player(connection);
  p.init();
  p.open = true;

  console.log((new Date()) + "New connection, ID: " + p.id);

  connection.on('message', message => {
    onMessage(message, p);
  });
  connection.on('close', e => {
    onClose(e, p);
  });
}

const fps = 30;

setInterval(() => {
  update();
}, 1000 / fps);

let last = Date.now();

function update() {
  dt = (Date.now() - last) / 1000;
  last = Date.now();
  Player.players.forEach(p => {
    p.send(makeMessage(p));
    p.ship.update(dt);
  });
}

/*function cont(p) { // delete this
  var index = 0;
  const buffer = new ArrayBuffer(9);
  const view = new DataView(buffer);
  view.setUint8(index,1);
  index+=1;
  view.setFloat32(index,p.ship.control.x);
  index+=4;
  view.setFloat32(index,p.ship.control.y);
  return buffer;
}*/

function makeMessage(p) {
  const buffer = new ArrayBuffer(1 + Datagrams.shipUpdate.size);
  const view = new AutoView();

  //MESSAGE TYPE 1 (PLAYER POSITIONS)
  view.view.setUint8(view.index, 1);
  view.index += 1;
  addPlayerToMessage(view, p);


  return buffer;
}

function addPlayerToMessage(view, p) {
  view.view.setUint16(view.index, p.id);
  view.index += 2;
  view.serialize(p, Datagrams.shipUpdate);
}

function sendAll(data) {
  connections.forEach(c => {
    if (c.readyState == 1) {
      c.send(data);
    }
  });
}

function onMessage(message, player) {
  let receiveBuffer = message.buffer.slice(message.byteOffset, message.byteOffset + message.byteLength);
  //console.log("Message from "+player+" : "+receiveBuffer);
  parseMessage(receiveBuffer, player);
}

function onClose(event, player) {
  console.log("Closed connection " + player.id + " Reason: " + event);
  player.open = false;
}

function parseMessage(buffer, player) {
  const view = new AutoView(buffer);
  while (view.index < view.view.byteLength) {
    let head = view.view.getUint8(index);
    view.index += 1;
    switch (head) {
      case 1:
        parseInput(view, player);
        break;

      default:
        break;
    }
  }

}

function parseInput(view, player) {
  let ship = player.ship;
  view.deserealize(ship, Datagrams.input)
  //console.log("Parsing to: ",controlVector);
}

