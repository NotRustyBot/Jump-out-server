//#region INIT
var http = require('http');
var server = http.createServer(function (request, response) {
});
var WebSocketServer = require('ws').Server;
var port = process.env.PORT;
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

var connections = [];

function onConnection(connection){
    console.log((new Date()) + connection);
    connections.push(connection);
}

const fps = 1;

setInterval(() => {
  update();
}, 1000 / fps);

function update(){
  sendAll(0);
}

function sendAll(data){
  connections.forEach(c => {
    c.send(data);
  });
}
