let Vector;

function init(vec){
    Vector = vec;
}

exports.init = init;

function Datagram() {
    this.structure = [];

    this.size = 0;
    this.add = function (type, name) {
        this.structure.push({ type: type, name: name });
        this.size += Datagram._sizes[type];
    };

    this.sizeOf = function (obj) {
        let size = this.size;
        for (let i = 0; i < this.structure.length; i++) {
            const data = this.structure[i];
            if (data.type == Datagram.types.string) {
                size += obj[data.name].length * 2;
            }
        }
        return size;
    };

    this.transferData = function (target, data) {
        for (let i = 0; i < this.structure.length; i++) {
            const info = this.structure[i];
            target[info.name] = data[info.name];
        }
    }
}

Datagram.types = {
    int8: 0,
    uint8: 1,
    int16: 2,
    uint16: 3,
    int32: 4,
    uint32: 5,
    int64: 6,
    uint64: 7,
    float32: 8,
    float64: 9,
    string: 10,
    vector32: 11,
    vector64: 11,
};
Datagram._sizes = [1, 1, 2, 2, 4, 4, 8, 8, 4, 8, 2, 8, 16];

Datagram._Get = [
    (auto) => {
        auto.index += 1;
        return auto.view.getInt8(auto.index - 1);
    },
    (auto) => {
        auto.index += 1;
        return auto.view.getUint8(auto.index - 1);
    },
    (auto) => {
        auto.index += 2;
        return auto.view.getInt16(auto.index - 2);
    },
    (auto) => {
        auto.index += 2;
        return auto.view.getUint16(auto.index - 2);
    },
    (auto) => {
        auto.index += 4;
        return auto.view.getInt32(auto.index - 4);
    },
    (auto) => {
        auto.index += 4;
        return auto.view.getUint32(auto.index - 4);
    },
    (auto) => {
        auto.index += 8;
        return auto.view.getInt64(auto.index - 8);
    },
    (auto) => {
        auto.index += 8;
        return auto.view.getUint64(auto.index - 8);
    },
    (auto) => {
        auto.index += 4;
        return auto.view.getFloat32(auto.index - 4);
    },
    (auto) => {
        auto.index += 8;
        return auto.view.getFloat64(auto.index - 8);
    },
    (auto) => {
        let length = auto.view.getInt16(auto.index);
        auto.index += 2;
        let array = [];
        for (let i = 0; i < length; i++) {
            array[i] = String.fromCharCode(auto.view.getUint16(auto.index));
            auto.index += 2;
        }
        return array.join("");
    },
    (auto) => {
        auto.index += 8;
        return new Vector(auto.view.getFloat32(auto.index - 8), auto.view.getFloat32(auto.index - 4));
    },
    (auto) => {
        auto.index += 16;
        return new Vector(auto.view.getFloat64(auto.index - 16), auto.view.getFloat64(auto.index - 8));
    },
];
Datagram._Set = [
    (auto, data) => {
        auto.view.setInt8(auto.index, data);
        auto.index += 1;
    },
    (auto, data) => {
        auto.view.setUint8(auto.index, data);
        auto.index += 1;
    },
    (auto, data) => {
        auto.view.setInt16(auto.index, data);
        auto.index += 2;
    },
    (auto, data) => {
        auto.view.setUint16(auto.index, data);
        auto.index += 2;
    },
    (auto, data) => {
        auto.view.setInt32(auto.index, data);
        auto.index += 4;
    },
    (auto, data) => {
        auto.view.setUint32(auto.index, data);
        auto.index += 4;
    },
    (auto, data) => {
        auto.view.setInt64(auto.index, data);
        auto.index += 8;
    },
    (auto, data) => {
        auto.view.setUint64(auto.index, data);
        auto.index += 8;
    },
    (auto, data) => {
        auto.view.setFloat32(auto.index, data);
        auto.index += 4;
    },
    (auto, data) => {
        auto.view.setFloat64(auto.index, data);
        auto.index += 8;
    },
    (auto, data) => {
        auto.view.setInt16(auto.index, data.length);
        auto.index += 2;
        for (let i = 0; i < data.length; i++) {
            auto.view.setUint16(auto.index, data.charCodeAt(i));
            auto.index += 2;
        }
    },
    (auto, data) => {
        auto.view.setFloat32(auto.index, data.x);
        auto.index += 4;
        auto.view.setFloat32(auto.index, data.y);
        auto.index += 4;
    },
    (auto, data) => {
        auto.view.setFloat64(auto.index, data.x);
        auto.index += 8;
        auto.view.setFloat64(auto.index, data.y);
        auto.index += 8;
    },
];

exports.Datagram = Datagram;

function AutoView(buffer, index) {
    this.view = new DataView(buffer);
    this.index = index || 0;
    this.deserealize = function (obj, datagram) {
        let dg = datagram.structure;
        for (let i = 0; i < dg.length; i++) {
            const data = dg[i];
            obj[data.name] = Datagram._Get[data.type](this);
        }
    };

    this.serialize = function (obj, datagram) {
        let dg = datagram.structure;
        for (let i = 0; i < dg.length; i++) {
            const data = dg[i];
            Datagram._Set[data.type](
                this,
                obj[data.name]
            );
        }
    };

    this.getInt8 = function () {
        this.index += 1;
        return this.view.getInt8(this.index - 1);
    }
    this.getUint8 = function () {
        this.index += 1;
        return this.view.getUint8(this.index - 1);
    }
    this.getInt16 = function () {
        this.index += 2;
        return this.view.getInt16(this.index - 2);
    }
    this.getUint16 = function () {
        this.index += 2;
        return this.view.getUint16(this.index - 2);
    }
    this.getInt32 = function () {
        this.index += 4;
        return this.view.getInt32(this.index - 4);
    }
    this.getUint32 = function () {
        this.index += 4;
        return this.view.getUint32(this.index - 4);
    }
    this.getBigInt64 = function () {
        this.index += 8;
        return this.view.getBigInt64(this.index - 8);
    }
    this.getBigUint64 = function () {
        this.index += 8;
        return this.view.getBigUint64(this.index - 4);
    }
    this.setFloat32 = function () {
        this.index += 4;
        return this.view.setFloat32(this.index - 4);
    }
    this.setFloat64 = function () {
        this.index += 8;
        return this.view.setFloat64(this.index - 4);
    }

    this.setInt8 = function (value) {
        this.view.setUint8(this.index, value);
        this.index += 1;
    }
    this.setUint8 = function (value) {
        this.view.setUint8(this.index, value);
        this.index += 1;
    }
    this.setInt16 = function (value) {
        this.view.setInt16(this.index, value);
        this.index += 2;
    }
    this.setUint16 = function (value) {
        this.view.setUint16(this.index, value);
        this.index += 2;
    }
    this.setInt32 = function (value) {
        this.view.setInt32(this.index, value);
        this.index += 4;
    }
    this.setUint32 = function (value) {
        this.view.setUint32(this.index, value);
        this.index += 4;
    }
    this.setBigInt64 = function (value) {
        this.view.setBigInt64(this.index, value);
        this.index += 8;
    }
    this.setBigUint64 = function (value) {
        this.view.setBigUint64(this.index, value);
        this.index += 8;
    }
    this.setFloat32 = function (value) {
        this.view.setFloat32(this.index, value);
        this.index += 4;
    }
    this.setFloat64 = function (value) {
        this.view.setFloat64(this.index, value);
        this.index += 8;
    }
}

exports.AutoView = AutoView;

//#region datagramy

let Datagrams = {};

let types = Datagram.types;

let input = new Datagram();

input.add(types.vector32, "control");
input.add(types.int8, "afterBurnerActive");
input.add(types.int8, "action");
Datagrams.input = input;


let shipUpdate = new Datagram();

shipUpdate.add(types.vector32, "position");
shipUpdate.add(types.vector32, "velocity");
shipUpdate.add(types.float32, "rotation");
shipUpdate.add(types.vector32, "control");
shipUpdate.add(types.uint8, "afterBurnerUsed");
shipUpdate.add(types.float32, "afterBurnerFuel");
Datagrams.shipUpdate = shipUpdate;

let initPlayer = new Datagram();
initPlayer.add(types.uint16, "id");
initPlayer.add(types.string, "nick");
Datagrams.initPlayer = initPlayer;

let playerSettingsDatagram = new Datagram();
playerSettingsDatagram.add(types.string, "nick");
Datagrams.playerSettings = playerSettingsDatagram;

let EntitySetup = new Datagram();
EntitySetup.add(types.uint16, "id");
EntitySetup.add(types.int16, "type");
EntitySetup.add(types.vector32, "position");
EntitySetup.add(types.float32, "rotation");
EntitySetup.add(types.float32, "rotationSpeed");
Datagrams.EntitySetup = EntitySetup;

let EnitiyRemove = new Datagram();
EnitiyRemove.add(types.uint16, "id");
Datagrams.EnitiyRemove = EnitiyRemove;

let CollisionEvent = new Datagram();
CollisionEvent.add(types.uint16, "shipId");
CollisionEvent.add(types.uint16, "entityId");
CollisionEvent.add(types.vector32, "position");
Datagrams.CollisionEvent = CollisionEvent;

let DebugPacket = new Datagram();
DebugPacket.add(types.string, "data");
Datagrams.DebugPacket = DebugPacket;

let SmartAction = new Datagram();
SmartAction.add(types.uint8, "handle");
SmartAction.add(types.uint16, "actionId");
Datagrams.SmartAction = SmartAction;

let GasUpdate = new Datagram();
GasUpdate.add(types.vector32, "position");
GasUpdate.add(types.uint8, "value");
Datagrams.GasUpdate = GasUpdate;

exports.Datagrams = Datagrams;

let SmartActionData = [];

let PlaceObject = new Datagram();
PlaceObject.add(types.int8, "structure");
SmartActionData.push(PlaceObject);
exports.SmartActionData = SmartActionData;

let MineRock = new Datagram();
SmartActionData.push(MineRock);
exports.SmartActionData = SmartActionData;

const ActionId = { placeObject: 0, MineRock: 1};
exports.ActionId = ActionId;


let ReplyData = [];

let ActionSuccess = new Datagram();
ActionSuccess.add(types.uint8, "id");
ActionSuccess.add(types.uint8, "handle");
ReplyData.push(ActionSuccess);

let InvalidAction = new Datagram();
InvalidAction.add(types.uint8, "id");
InvalidAction.add(types.uint8, "handle");
ReplyData.push(InvalidAction);

let Cooldown = new Datagram();
Cooldown.add(types.uint8, "id");
Cooldown.add(types.uint8, "handle");
Cooldown.add(types.float32, "time");
ReplyData.push(Cooldown);

exports.ReplyData = ReplyData;

const ReplyId = { success: 0, invalidAction: 1, cooldown: 2 };
exports.ReplyId = ReplyId;

const serverHeaders = { initResponse: 0, update: 1, newPlayers: 2, playerLeft: 3, entitySetup: 4, collisionEvent: 5, debugPacket: 6, gasData: 7, proximity: 8, actionReply: 9, entityRemove: 10, gasUpdate: 11 };
exports.serverHeaders = serverHeaders;
const clientHeaders = { init: 0, control: 1, smartAction: 2 };
exports.clientHeaders = clientHeaders;



//#endregion


/*

var type = Datagram.types;

let toSend = { x: 5.3, y: -6.6, id: 1, name: "doe" };
let toSend2 = { x: 0, y: 0, id: 0, name: "Doe Sntmatter" };

let Recvive = { id: 3, name: "Staysa Me" };
let Recvive2 = {};

let testDg = new Datagram();
testDg.add(type.uint8, "id");
testDg.add(type.float32, "x");
testDg.add(type.float32, "y");
testDg.add(type.string, "name");


console.log(testDg.sizeOf(toSend));

let buffer = new ArrayBuffer(testDg.sizeOf(toSend) + testDg.sizeOf(toSend2));
let sendView = new AutoView(buffer);

sendView.serialize(toSend, testDg);
sendView.serialize(toSend2, testDg);
//.send(buffer);

let recviveView = new AutoView(buffer);
recviveView.deserealize(Recvive, testDg);
recviveView.deserealize(Recvive2, testDg);

console.log(Recvive);
console.log(Recvive2);

*/