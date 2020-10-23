const { Vector, ShipType, Ship, Player, Entity } = require("./gameobjects.js");
const { Datagram, Datagrams, AutoView, serverHeaders, clientHeaders } = require("./datagram.js");

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


function onMessage(message, player) {
  let receiveBuffer = message.buffer.slice(message.byteOffset, message.byteOffset + message.byteLength);
  //console.log("Message from "+player+" : "+receiveBuffer);
  parseMessage(receiveBuffer, player);
}

function onClose(event, player) {
  console.log("Closed connection " + player.id + " Reason: " + event);
  player.open = false;
  Player.players.delete(player.id);
}


const fps = 30;

setInterval(() => {
  update();
}, 1000 / fps);

let last = Date.now();

function update() {
  dt = (Date.now() - last) / 1000;
  last = Date.now();
  let msg = updateMessage();
  Entity.list.forEach(e =>{
    e.update(dt);
  });

  Player.players.forEach(p => {
    if (p.initialised) {
      p.send(msg);
      p.ship.update(dt);
    }
  });
}


var buffer = new ArrayBuffer(1000);


function updateMessage() {
  const view = new AutoView(buffer);

  //MESSAGE TYPE 1 (SHIP UPDATE)

  Player.players.forEach(p => {
    if (p.initialised) {
      view.view.setUint8(view.index, serverHeaders.update);
      view.index += 1;
      view.view.setUint16(view.index, p.id);
      view.index += 2;
      view.serialize(p.ship, Datagrams.shipUpdate);
    }
  });

  //MESSAGE TYPE 2 (NEW PLAYER)

  if (Player.newPlayers.length > 0) {
    view.view.setUint8(view.index, serverHeaders.newPlayers);
    view.index += 1;
    view.view.setUint8(view.index, Player.newPlayers.length);
    view.index += 1;
    Player.newPlayers.forEach(player => {
      view.serialize(player, Datagrams.initPlayer);
    });
    Player.newPlayers = [];
  }

  return buffer.slice(0, view.index);
}

function initMessage(p) {
  const view = new AutoView(buffer);

  view.view.setUint8(view.index, serverHeaders.initResponse);
  view.index += 1;
  view.view.setUint16(view.index, p.id);
  view.index += 2;
  let sizeGoesHere = view.index;
  
  view.index += 1;
  let count = 0;
  Player.players.forEach(player => {
    if (player.id != p.id && p.initialised) {
      view.serialize(player, Datagrams.initPlayer);
      count++;
    }
  });
  view.view.setUint8(sizeGoesHere, count);
  return buffer.slice(0, view.index);
}

function EntitySetupMessage(){
  const view = new AutoView(buffer);
  view.view.setUint8(view.index, serverHeaders.entitySetup);
  view.index += 1;
  let sizeGoesHere = view.index;
  view.index += 2;
  let count = 0;  
  Entity.list.forEach(e => {
    view.serialize(e, Datagrams.EntitySetup);
    count++;
  });
  view.view.setUint16(sizeGoesHere, count);
}


function sendAll(data) {
  connections.forEach(c => {
    if (c.readyState == 1) {
      c.send(data);
    }
  });
}


function parseMessage(buffer, player) {
  const view = new AutoView(buffer);
  while (view.index < view.view.byteLength) {
    let head = view.view.getUint8(view.index);
    view.index += 1;
    switch (head) {
      case clientHeaders.init:
        parseInit(view, player);

        break;
      case clientHeaders.control:
        parseInput(view, player);
        break;

      default:
        break;
    }
  }

}

function parseInput(view, player) {
  let ship = player.ship;
  view.deserealize(ship, Datagrams.input);
  //console.log("Parsing to: ",controlVector);
}

function parseInit(view, player) {
  view.deserealize(player, Datagrams.playerSettings);

  player.initialised = true;
  player.send(initMessage(player));
  Player.newPlayers.push(player);
}
