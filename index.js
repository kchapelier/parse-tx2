"use strict";

var types = {
    DXT1: {
        name: 'dxt1',
        palette: false,
        bytesPerPixel: 0.5
    },
    DXT5: {
        name: 'dxt5',
        palette: false,
        bytesPerPixel: 1
    },
    BGRA8888: {
        name: 'BGRA8888',
        palette: false,
        bytesPerPixel: 4
    },
    PRGBA8888I4: {
        name: 'PRGBA8888I4',
        palette: true,
        bytesPerPixel: 0.5
    },
    PBGRA8888I4: {
        name: 'PBGRA8888I4',
        palette: true,
        bytesPerPixel: 0.5
    },
    PRGBA8888I8: {
        name: 'PRGBA8888I8',
        palette: true,
        bytesPerPixel: 1
    },
    PBGRA8888I8: {
        name: 'PBGRA8888I8',
        palette: true,
        bytesPerPixel: 1
    }
};

var typesMapping = {
    0: types.DXT1,
    2: types.DXT5,
    3: types.BGRA8888,
    16: types.PBGRA8888I4,
    17: types.PRGBA8888I4,
    256: types.PBGRA8888I8,
    257: types.PRGBA8888I8
};

var getPaletteData = function getPaletteData (arrayBuffer, length) {
    return new Uint8Array(arrayBuffer, 16, length);
};

/**
 * Parse the header of a tx2 file passed as an ArrayBuffer.
 * @param {ArrayBuffer} arrayBuffer
 * @returns {{shape: number[], flags: number, format: string, palette, images: {shape: number[], length: number, offset: number}[], cubemap: boolean}}
 */
var parseTx2 = function parseTx2 (arrayBuffer) {
    var dataView = new DataView(arrayBuffer),
        width = dataView.getUint16(0, true),
        height = dataView.getUint16(2, true),
        compressionType = dataView.getUint16(4, true),
        paletteColors = dataView.getUint16(8, true),
        headerLength = 16,
        paletteLength,
        imageLength,
        expectedFileSize,
        type;

    type = typesMapping[compressionType];

    if (!type) {
        throw new Error('Incorrect header : Unknown compression type : ' + compressionType);
    }

    paletteLength = type.palette ? paletteColors * 4 : 0;
    imageLength = width * height * type.bytesPerPixel;
    expectedFileSize = headerLength + paletteLength + imageLength;

    if (type.palette && paletteColors === 0) {
        throw new Error('Incorrect header : Empty palette for a paletted compression type');
    }

    if (expectedFileSize !== arrayBuffer.byteLength) {
        throw new Error('Incorrect file size : expected ' + expectedFileSize + ' bytes, actually ' + arrayBuffer.byteLength + ' bytes');
    }

    return {
        shape: [ width, height ],
        flags: 0,
        format: type.name,
        palette: type.palette ? getPaletteData(arrayBuffer, paletteLength) : null,
        images: [
            {
                shape: [ width, height ],
                length: imageLength,
                offset: headerLength + paletteLength
            }
        ],
        cubemap: false
    };

};

module.exports = parseTx2;
