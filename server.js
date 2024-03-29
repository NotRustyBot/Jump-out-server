const { Vector, ShipType, Ship, Player, Buildings, Entity, CollisionEvent, Universe, Area, SmartAction, ItemDrop, Item, Inventory, Marker, Projectile, Action, Level, Room, Interactable } = require("./gameobjects");
const {serverHeaders, clientHeaders, Datagrams, Datagram, ActionId, AutoView, SmartActionData, ReplyData} = require("./datagram");
require("./worldgen");

ShipType.initTypes();

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

    console.log((new Date()) + " New connection, ID: " + p.id);

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
    Player.players.get(player.id).exit();
}


const fps = 30;

setInterval(() => {
    update();
}, 1000 / fps);

let last = Date.now();

let mspt = 0;
let msptavg = [];

let deltaTimeFactor = 1;

for (let i = 0; i < fps; i++) { msptavg[i] = 0; }
function update() {

    dt = (Date.now() - last) / 1000;
    last = Date.now();
    dt *= deltaTimeFactor;

    Player.players.forEach(p => {
        if (p.initialised) {
            p.debug = "   MSPT: " + mspt.toFixed(2) + "\n";
            //p.debug = "     DT: " + (dt*1000).toFixed(2) + "\n";
            p.ship.update(dt);
        }
    });
    Entity.list.forEach(e => {
        e.update(dt);
    });

    Universe.comms.markers.forEach(m => {
        m.update(dt);
    });

    Projectile.list.forEach(p => {
        p.update(dt);
    });

    let msg = updateMessage();
    let sameIndex = msg.index;

    Player.players.forEach(p => {
        if (p.initialised) {
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

    if (Projectile.created.length > 0) {
        Projectile.created.forEach(p => {
            view.setUint8(serverHeaders.createProjectile);
            view.serialize(p, Datagrams.CreateProjectile);
        });
        Projectile.created = [];
    }

    CollisionEvent.list.forEach(c => {
        view.setUint8(serverHeaders.collisionEvent);
        view.serialize(c, Datagrams.CollisionEvent);
    });

    CollisionEvent.list = [];

    view.setUint8(serverHeaders.entitySetup);
    view.setUint16(Entity.create.length);
    Entity.create.forEach(c => {
        view.serialize(c, Datagrams.EntitySetup);
    });

    Entity.create = [];

    Entity.remove.forEach(c => {
        view.setUint8(serverHeaders.entityRemove);
        let temp = { id: c };
        view.serialize(temp, Datagrams.EnitiyRemove);
    });

    Entity.remove = [];

    if (Universe.gasChange.length > 0) {
        view.setUint8(serverHeaders.gasUpdate);
        view.setUint16(Universe.gasChange.length);
        Universe.gasChange.forEach(e => {
            view.serialize(e, Datagrams.GasUpdate);
        });
        Universe.gasChange = [];
    }

    if (ItemDrop.create.length > 0) {
        ItemDrop.create.forEach(i => {
            view.setUint8(serverHeaders.itemCreate);
            let temp = { id: i.id, position: i.position, item: i.item.id, stack: i.item.stack, source: i.source, level: i.level };
            view.serialize(temp, Datagrams.ItemCreate);
        });
        ItemDrop.create = [];
    }

    if (ItemDrop.remove.length > 0) {
        ItemDrop.remove.forEach(i => {
            view.setUint8(serverHeaders.itemRemove);
            view.serialize(i, Datagrams.ItemRemove);
        });
        ItemDrop.remove = [];
    }

    if (Inventory.changes.length > 0) {
        Inventory.changes.forEach(i => {
            view.setUint8(serverHeaders.inventoryChange);
            view.serialize(i, Datagrams.InventoryChange);
        });
        Inventory.changes = [];
    }

    if (Universe.scanUpdate.length > 0) {
        view.setUint8(serverHeaders.gasScan);
        view.setUint16(Universe.scanUpdate.length);
        Universe.scanUpdate.forEach(i => {
            view.serialize(i, Datagrams.GasScan);
        });
        Universe.scanUpdate = [];
    }

    if (Universe.scanned.objects.size > 0) {
        view.setUint8(serverHeaders.objectScan);
        view.setUint16(Universe.scanned.objects.size);
        Universe.scanned.objects.forEach(i => {
            view.serialize(i, Datagrams.ObjectScan);
        });
        Universe.scanned.objects = new Map();
        Universe.scanned.mobile = [];
    }

    Universe.comms.markers.forEach(m => {
        if (!m.broadcasted) {
            if (m.remove) {
                view.setUint8(serverHeaders.markerRemove);
                view.setUint16(m.id);
                m.broadcasted = true;
            } else {
                view.setUint8(serverHeaders.markerCreate);
                view.serialize(m, Datagrams.MarkerCreate);
                m.broadcasted = true;
            }
        }
    });

    if (Projectile.removed.length > 0) {
        Projectile.removed.forEach(p => {
            view.setUint8(serverHeaders.removeProjectile);
            view.serialize(p, Datagrams.RemoveProjectile);
        });
        Projectile.removed = [];
    }

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
    view.setUint8(p.shipType);
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

    Scanned(view);

    return buffer.slice(0, view.index);
}


/**
 * 
 * @param {AutoView} inView 
 * @param {Player} player 
 */
function prepareReplies(inView, player) {
    if (player.replies.length == 0) return;
    player.replies.forEach(r => {
        inView.setUint8(serverHeaders.actionReply);
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
    inView.setUint8(player.ship.packet);
    let sizeGoesHere = inView.index;
    inView.setUint16(0);
    let count = 0;
    entities.forEach(entity => {
        if (!entity.noUpdate) {
            entity.serialize(inView);
            count++;
        }
    });
    inView.view.setUint16(sizeGoesHere, count);
    return buffer.slice(0, inView.index);
}


/**
 * 
 * @param {AutoView} inView 
 */
function EntitySetupMessage(inView) {
    const view = inView || new AutoView(buffer);
    view.setUint8(serverHeaders.entitySetup);
    let sizeGoesHere = view.index;
    view.index += 2;
    let count = 0;
    let items = [];
    Entity.list.forEach(e => {
        if (e.type != -1) {
            view.serialize(e, Datagrams.EntitySetup);
            count++;
        } else {
            items.push(e);
        }
    });
    view.view.setUint16(sizeGoesHere, count);
    items.forEach(i => {
        view.setUint8(serverHeaders.itemCreate);
        let temp = { id: i.id, position: i.position, item: i.item.id, stack: i.item.stack, source: i.source, level: i.level };
        view.serialize(temp, Datagrams.ItemCreate);
    });

    Level.list.forEach(l => {
        view.setUint8(serverHeaders.setupEnterance);
        let temp = {id: l.level, position: l.enterance};
        view.serialize(temp, Datagrams.SetupEnterance);
    });

    Room.list.forEach(r => {
        view.setUint8(serverHeaders.setupRoom);
        view.serialize(r, Datagrams.SetupRoom);
    });

    Interactable.list.forEach(i => {
        view.setUint8(serverHeaders.setupInteractable);
        view.serialize(i, Datagrams.SetupInteractable);
    });

    return buffer.slice(0, view.index);
}


function Scanned(view) {
    view.setUint8(serverHeaders.gasScan);
    view.setUint16(Universe.scanned.gas.length);
    Universe.scanned.gas.forEach(e => {
        view.serialize(e, Datagrams.GasScan);
    });

    if (Universe.scanned.allObjects.size > 0) {
        view.setUint8(serverHeaders.objectScan);
        view.setUint16(Universe.scanned.allObjects.size);
        Universe.scanned.allObjects.forEach(i => {
            view.serialize(i, Datagrams.ObjectScan);
        });
    }


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
    try {
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

                case clientHeaders.serverConsole:
                    let temp = {};
                    view.deserealize(temp, Datagrams.ServerConsole);
                    console.log("executing: " + temp.command);
                    try {
                        eval(temp.command);
                    } catch (error) {
                        console.log(error);
                    }
                    break;

                default:
                    break;
            }
        }
    } catch (error) {
        console.warn("parse error: " + error);
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
