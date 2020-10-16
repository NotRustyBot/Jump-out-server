//#region věci
function Vector(x, y) {
  this.x = x;
  this.y = y;

  this.length = function () {
      return Math.sqrt(this.x * this.x + this.y * this.y);
  };

  this.distance = function (vector) {
      let v = new Vector(
          Math.abs(this.x - vector.x),
          Math.abs(this.y - vector.y)
      );
      return v.length();
  };

  this.add = function (vector) {
      this.x = this.x + vector.x;
      this.y = this.y + vector.y;
      return this;
  };

  this.sub = function (vector) {
      this.x = this.x - vector.x;
      this.y = this.y - vector.y;
      return this;
  };

  this.mult = function (magnitude) {
      this.x = this.x * magnitude;
      this.y = this.y * magnitude;
      return this;
  };

  this.normalize = function (length) {
      length = length || 1;
      let total = this.length();
      this.x = (this.x / total) * length;
      this.y = (this.y / total) * length;
      return this;
  };
  this.result = function () {
      return new Vector(this.x, this.y);
  };
}
Vector.zero = function () {
  return new Vector(0, 0);
};
Vector.fromAngle = function (r) {
  return new Vector(Math.cos(r), Math.sin(r));
};

function ShipType() {
  this.name = "ShipTypeName";
  this.speed = 5;
  this.accel = 1;
  this.revAccel = 0.5;
  this.rotSpeed = 1;
  this.afterBonus = 3;
  this.afterCapacity = 60;
}

ShipType.init = function () {
  ShipType.types = [];
  let debugShip = new ShipType();
  debugShip.name = "Debug";
  debugShip.speed = 150;
  debugShip.accel = 5;
  debugShip.revAccel = 3;
  debugShip.rotSpeed = 1;
  debugShip.afterBonus = 3;
  debugShip.afterCapacity = 60;
  ShipType.types["Debug"] = debugShip;
};
ShipType.init();


function Ship() {
  this.stats;
  this.pos = new Vector(0, 0);
  this.velocity = new Vector(0, 0);
  this.rot = 0;
  this.control = new Vector(0, 0);

  this.setup = function (type) {
      this.stats = type;
  };

  this.update = function (dt) {
      let stats = this.stats;

      if (this.control.x != 0) { // rotace
          this.rot += stats.rotSpeed * this.control.x * dt;
      }

      if (this.control.y != 0) { // zrychlení / brždění
          let pointing = Vector.fromAngle(this.rot).mult(this.control.y);
          pointing.mult(dt);
          if (this.control.y > 0) {
              pointing.normalize(stats.accel);
          } else {
              pointing.normalize(stats.revAccel);
          }
          this.velocity.add(pointing);
      }

      if (this.velocity.length() >= stats.speed) {
          this.velocity.normalize(stats.speed);
      }

      this.pos.add(this.velocity.result().mult(dt));
  };
}

function Player(connection) {
  this.nick = "nick";
  this.ship;
  this.connection = connection;
  this.id = Player.players.length;
  this.send = function(data){
      this.connection.send(data);
  }
  this.init = function () {
    this.ship = new Ship(ShipType.types["Debug"]);
  }
  Player.players[this.id] = this;
}
Player.players = [];

//#endregion

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
  
  let p = new Player(connection);
  p.init();

  console.log((new Date()) + "New connection, ID: "+p.id);

    connection.on('message', message => {
      onMessage(message, p);
    });
    connection.on('close', e => {
      onClose(e, p);
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

function cont(p) { // delete this
  var index = 0;
  const buffer = new ArrayBuffer(9);
  const view = new DataView(buffer);
  view.setUint8(index,1);
  index+=1;
  view.setFloat32(index,p.ship.control.x);
  index+=4;
  view.setFloat32(index,p.ship.control.y);
  return buffer;
}

function sendAll(data){
  connections.forEach(c => {
    c.send(data);
  });
}

function onMessage(message, player){
  console.log("Message from "+player.id+" : ",message);
  let receiveBuffer = message.buffer.slice(message.byteOffset,message.byteOffset+message.byteLength);
  parseMessage(receiveBuffer, player);
}

function onClose(event, player){
  console.log("Closed connection "+player+" Reason: "+event);
}

function parseMessage(buffer, player) {
  const view = new DataView(buffer);
  let index = 0;
  
  while (index < view.byteLength) {
    let head = view.getUint8(index);
    index+=1;
    switch (head) {
      case 1:
        player.ship.control = parseInput(view,index);
        break;
    
      default:
        break;
    }
  }

}

function parseInput(view, index) {
  let controlVector = new Vector(0,0);
  controlVector.x = view.getFloat32(index);
  index+=4;
  controlVector.y = view.getFloat32(index);
  index+=4;
  console.log("Parsing to: ",controlVector);

  return controlVector;
}

