const { Vector, ShipType, Ship, Player, Entity, CollisionEvent, Universe, Area, SmartAction, Datagram, Datagrams, AutoView, serverHeaders, clientHeaders, SmartActionData, ActionId, ReplyData } = require("./worldgen");

//#region INIT
let http = require('http');
const { Console } = require("console");
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
    p.send(Universe.gasBuffer);

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
    Player.leftPlayers.push(player);
    Player.players.delete(player.id);
}


const fps = 30;

setInterval(() => {
    update();
}, 1000 / fps);

let last = Date.now();

let mspt = 0;
let msptavg = [];

for (let i = 0; i < fps; i++) { msptavg[i] = 0; }

function update() {
    dt = (Date.now() - last) / 1000;
    last = Date.now();
    let msg = updateMessage();
    let sameIndex = msg.index;


    Entity.list.forEach(e => {
        e.update(dt);
    });


    Player.players.forEach(p => {
        if (p.initialised) {

            p.debug = "   MSPT: " + mspt.toFixed(2) + "\n";
            p.ship.update(dt);
            prepareReplies(msg, p);
            let toSend = AreaInfo(msg, p);
            msg.index = sameIndex;
            p.send(toSend);
        }
    });
    if (NetworkTimer % 3 == 0) {
        SendDebugPackets();
    }
    mspt = Date.now() - last;
    msptavg.unshift(mspt);
    msptavg.pop();
    mspt = average(msptavg);
}

/**
 * 
 * @param {number[]} array 
 * @returns {number}
 */
function average(array) {
    let total = 0;
    array.forEach(e => {
        total += e;
    });
    return total / array.length;
}


var buffer = new ArrayBuffer(5000000);

let NetworkTimer = 0;


function updateMessage() {
    const view = new AutoView(buffer);
    NetworkTimer++;
    if (NetworkTimer > 12000) {
        NetworkTimer = 0;
    }

    //MESSAGE TYPE 2 (NEW PLAYER)

    if (Player.newPlayers.length > 0) {
        view.setUint8(serverHeaders.newPlayers);
        view.setUint8(Player.newPlayers.length);
        Player.newPlayers.forEach(player => {
            view.serialize(player, Datagrams.initPlayer);
        });
        Player.newPlayers = [];
    }

    //MESSAGE TYPE 1 (SHIP UPDATE)

    Player.players.forEach(p => {
        if (p.initialised) {
            view.setUint8(serverHeaders.update);
            view.setUint16(p.id);
            view.serialize(p.ship, Datagrams.shipUpdate);
        }
    });


    //MESSAGE TYPE 3 (LEFT PLAYER)

    if (Player.leftPlayers.length > 0) {
        view.setUint8(serverHeaders.playerLeft);
        view.setUint8(Player.leftPlayers.length);
        Player.leftPlayers.forEach(player => {
            view.setUint16(player.id);
        });
        Player.leftPlayers = [];
    }

    CollisionEvent.list.forEach(c => {
        view.setUint8(serverHeaders.collisionEvent);
        view.serialize(c, Datagrams.CollisionEvent);
    });

    CollisionEvent.list = [];

    return view;
    //return buffer.slice(0, view.index);
}


/**
 * 
 * @param {Player} p 
 */
function initMessage(p) {
    const view = new AutoView(buffer);

    view.setUint8(serverHeaders.initResponse);
    view.setUint16(p.id);
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


/**
 * 
 * @param {AutoView} inView 
 * @param {Player} player 
 */
function prepareReplies(inView, player) {
    if (player.replies == 0) return;
    inView.setUint8(serverHeaders.actionReply);
    player.replies.forEach(r => {
        inView.serialize(r, ReplyData[r.id]);
    });

    player.replies = [];
}


/**
 * 
 * @param {AutoView} inView 
 * @param {Player} player 
 */
function AreaInfo(inView, player) {
    inView.setUint8(serverHeaders.proximity);
    let entities = player.proximity();
    inView.setUint16(entities.length);
    entities.forEach(entity => {
        entity.serialize(inView);
    });

    return buffer.slice(0, inView.index);
}

function EntitySetupMessage(inView) {
    const view = inView || new AutoView(buffer);
    view.setUint8(serverHeaders.entitySetup);
    let sizeGoesHere = view.index;
    view.index += 2;
    let count = 0;
    Entity.list.forEach(e => {
        view.serialize(e, Datagrams.EntitySetup);
        count++;
    });
    view.view.setUint16(sizeGoesHere, count);
    return buffer.slice(0, view.index);
}


function SendDebugPackets() {
    Player.players.forEach(p => {
        if (p.debug.length > 0) {
            let toSend = { data: p.debug };
            const view = new AutoView(buffer);
            view.setUint8(serverHeaders.debugPacket);
            view.serialize(toSend, Datagrams.DebugPacket);
            p.send(buffer.slice(0, view.index));
        }
    })
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
        let head = view.getUint8();
        switch (head) {
            case clientHeaders.init:
                parseInit(view, player);

                break;
            case clientHeaders.control:
                parseInput(view, player);
                break;

            case clientHeaders.smartAction:
                parseSmartAction(view, player);
                break;

            default:
                break;
        }
    }

}

/**
 * 
 * @param {AutoView} view 
 * @param {Player} player 
 */
function parseInput(view, player) {
    let ship = player.ship;
    view.deserealize(ship, Datagrams.input);
}

function parseInit(view, player) {
    view.deserealize(player, Datagrams.playerSettings);

    player.initialised = true;
    player.send(initMessage(player));
    player.send(EntitySetupMessage());
    Player.newPlayers.push(player);
}

/**
 * 
 * @param {AutoView} view 
 * @param {Player} player 
 */
function parseSmartAction(view, player) {
    let action = new SmartAction(player);
    view.deserealize(action, Datagrams.SmartAction);
    view.deserealize(action, SmartActionData[action.actionId]);
}
