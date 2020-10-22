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

    this.transferData = function(target, data){
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
        return {x: auto.view.getFloat32(auto.index - 8), y: auto.view.getFloat32(auto.index - 4)};
    },
    (auto) => {
        auto.index += 16;
        return {x: auto.view.getFloat64(auto.index - 16), y: auto.view.getFloat64(auto.index - 8)};
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
}

exports.AutoView = AutoView;

//#region datagramy

let Datagrams = {};

let types = Datagram.types;

let input = new Datagram();

input.add(types.vector32, "control");
input.add(types.int8, "afterBurnerActive");
Datagrams.input = input;


let shipUpdate = new Datagram();

shipUpdate.add(types.vector32, "position");
shipUpdate.add(types.vector32, "velocity");
shipUpdate.add(types.float32, "rotation");
shipUpdate.add(types.vector32, "control");
shipUpdate.add(types.uint8, "afterBurnerActive");
shipUpdate.add(types.float32, "afterBurnerFuel");
Datagrams.shipUpdate = shipUpdate;

exports.Datagrams = Datagrams;

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