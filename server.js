const { Vector, ShipType, Ship, Player } = require("./gameobjects.js");

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
  p.send(makeMessageInicialization(p)); // send stats
  Player.players.forEach(player => {
    if(p != player){
      makeMessageNewPlayer(player,p);
    }
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
    p.send(makeMessagePositions(p));
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

const MESSAGE_TYPE = {position: 1, allStats: 2, stats: 3};
function makeMessagePositions(p){ //MESSAGE TYPE 1 (PLAYER POSITIONS)
  let index = { i: 0 };
  let buffer = new ArrayBuffer(1 + 2 + (2+ (2 + 8 + 8 + 4 + 8 + 1 + 4)) * Player.players.length);
  let view = new DataView(buffer);
  view.setUint8(0, MESSAGE_TYPE.position);
  index.i += 1;  

  addPlayerToMessage(view, index, p);
  view.setUint16(index.i, Player.players.length - 1);
  index.i += 2;
  Player.players.forEach(pl => {
    if(p != pl){
      view.setUint16(index.i, pl.id);
      index.i += 2;
      addPlayerToMessage(view, index, pl);
    }
  });

  return buffer;
}

function makeMessageInicialization(p){ //MESSAGE TYPE 2 (PLAYER STATS + ANOTHER PLAYERS STATS)
  let index = { i: 0 };
  let buffer = new ArrayBuffer(1 + 2 + (1+4*9) * Player.players.length);
  let view = new DataView(buffer);
  view.setUint8(0, MESSAGE_TYPE.stats);
  index.i += 1;

  addShipStatsToMessage(view, index, p);
  view.setUint16(index.i, Player.players.length - 1);
  index.i += 2;
  Player.players.forEach(pl => {
    if(p != pl){
      addShipStatsToMessage(view, index, pl);
    }
  });
  
  return buffer;
}

function makeMessageNewPlayer(p, newP){ //MESSAGE TYPE 3 (NEW PLAYER CONNECTED - SEND HIS STATS)
  let index = { i: 0 };
  let buffer = new ArrayBuffer(1 + (2 + 8 + 8 + 4 + 8 + 1 + 4));
  let view = new DataView(buffer);
  view.setUint8(0, MESSAGE_TYPE.stats);
  index.i += 1;

  addShipStatsToMessage(view, index, newP);
  
  return buffer;
}

/* // OBSOLETE
function makeMessage(p, type) {
  let index = { i: 0 };
  let buffer;
  let view;
  index.i += 1;

  switch(type){
    case 1:   //MESSAGE TYPE 1 (PLAYER POSITIONS)
      buffer = new ArrayBuffer(1 + (2 + 8 + 8 + 4 + 8 + 1 + 4));
      view = new DataView(buffer);
      addPlayerToMessage(view, index, p);
      break;
    case 2:   //MESSAGE TYPE 2 (PLAYER STATS + ANOTHER PLAYERS STATS)
      buffer = new ArrayBuffer(1 + (1+4*9) * Player.players.lenght());
      view = new DataView(buffer);
      addShipStatsToMessage(view, index, p);
      Player.players.forEach(pl => {
        if(p != pl){
          addShipStatsToMessage(view, index, pl);
        }
      });
      break;
    case 3:   //MESSAGE TYPE 3 (NEW PLAYER CONNECTED - SEND HIS STATS)
      buffer = new ArrayBuffer(1 + (1+4*9));
      view = new DataView(buffer);
      addShipStatsToMessage(view, index, p); 
      break;
  }

  view.setUint8(0, type);
  
  return buffer;
}
*/

function addPlayerToMessage(view, index, p) {
  view.setInt16(index.i, p.id);
  index.i += 2;
  view.setFloat32(index.i, p.ship.position.x);
  index.i += 4;
  view.setFloat32(index.i, p.ship.position.y);
  index.i += 4;
  view.setFloat32(index.i, p.ship.velocity.x);
  index.i += 4;
  view.setFloat32(index.i, p.ship.velocity.y);
  index.i += 4;
  view.setFloat32(index.i, p.ship.rotation);
  index.i += 4;
  view.setFloat32(index.i, p.ship.control.x);
  index.i += 4;
  view.setFloat32(index.i, p.ship.control.y);
  index.i += 4;
  view.setUint8(index.i, p.ship.afterBurnerActive);
  index.i += 1;
  view.setFloat32(index.i, p.ship.afterBurnerFuel);
  index.i += 4;
}

function addShipStatsToMessage(view, index, p) {
  view.setUint8(index.i, p.ship.stats.name);
  index.i += 1;
  view.setFloat32(index.i, p.ship.stats.speed);
  index.i += 4;
  view.setFloat32(index.i, p.ship.stats.acceleration);
  index.i += 4;
  view.setFloat32(index.i, p.ship.stats.reverseAcceleration);
  index.i += 4;
  view.setFloat32(index.i, p.ship.stats.rotationSpeed);
  index.i += 4;
  view.setFloat32(index.i, p.ship.stats.afterBurnerSpeedBonus);
  index.i += 4;
  view.setFloat32(index.i, p.ship.stats.afterBurnerRotationBonus);
  index.i += 4;
  view.setFloat32(index.i, p.ship.stats.afterBurnerAccelerationBonus);
  index.i += 4;
  view.setFloat32(index.i, p.ship.stats.afterBurnerCapacity);
  index.i += 4;
  view.setFloat32(index.i, p.ship.stats.drag);
  index.i += 4;
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
  const view = new DataView(buffer);
  let index = {i:0};
  while (index.i < view.byteLength) {
    let head = view.getUint8(index);
    index.i += 1;
    switch (head) {
      case 1:
        parseInput(view, index, player);
        break;

      default:
        break;
    }
  }

}

function parseInput(view, index, player) {
  let ship = player.ship;
  ship.control.x = view.getFloat32(index.i);
  index.i += 4;
  ship.control.y = view.getFloat32(index.i);
  index.i += 4;
  ship.afterBurnerActive = view.getUint8(index.i);
  index.i += 1;
  //console.log("Parsing to: ",controlVector);
}

