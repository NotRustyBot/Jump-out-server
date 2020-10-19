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
};
Datagram._sizes = [1, 1, 2, 2, 4, 4, 8, 8, 4, 8, 2];

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
];

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

/* RUN */

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

/* */

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
