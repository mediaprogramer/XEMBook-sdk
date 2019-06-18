/*
 * Copyright 2018 NEM
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/*
import charMapping from './charMapping';
*/

const charMapping = {

	/**
	 * Creates a builder for building a character map.
	 * @returns {module:coders/charMapping~CharacterMapBuilder} A character map builder.
	 */
	createBuilder: () => {
		const map = {};
		return {
			map,

			/**
			 * Adds a range mapping to the map.
			 * @param {string} start The start character.
			 * @param {string} end The end character.
			 * @param {number} base The value corresponding to the start character.
			 * @memberof module:utils/charMapping~CharacterMapBuilder
			 * @instance
			 */
			addRange: (start, end, base) => {
				const startCode = start.charCodeAt(0);
				const endCode = end.charCodeAt(0);

				for (let code = startCode; code <= endCode; ++code)
					map[String.fromCharCode(code)] = code - startCode + base;
			}
		};
	}
};

function getHasher(length = 64) {
	return { 32: sha3_256, 64: sha3_512 }[length];
}

const sha3Hasher  = {

	func: (dest, data, length) => {
		const hasher = getHasher(length);
		const hash = hasher.arrayBuffer(data);
		array.copy(dest, array.uint8View(hash));
	},

	createHasher: length => {
		let hash;
		return {
			reset: () => {
				hash = getHasher(length).create();
			},
			update: data => {
				if (data instanceof Uint8Array)
					hash.update(data);
				else if ('string' === typeof data)
					hash.update(convert.hexToUint8(data));
				else
					throw Error('unsupported data type');
			},
			finalize: result => {
				array.copy(result, array.uint8View(hash.arrayBuffer()));
			}
		};
	}

}

const Char_To_Nibble_Map = (function () {
	const builder = charMapping.createBuilder();
	builder.addRange('0', '9', 0);
	builder.addRange('a', 'f', 10);
	builder.addRange('A', 'F', 10);
	return builder.map;
})();

const Char_To_Digit_Map = (function () {
	const builder = charMapping.createBuilder();
	builder.addRange('0', '9', 0);
	return builder.map;
})();

const Nibble_To_Char_Map = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];

function tryParseByte(char1, char2) {
	const nibble1 = Char_To_Nibble_Map[char1];
	const nibble2 = Char_To_Nibble_Map[char2];
	return undefined === nibble1 || undefined === nibble2
		? undefined
		: (nibble1 << 4) | nibble2;
}

/** @exports coders/convert */
const convert = {
	/**
	 * Decodes two hex characters into a byte.
	 * @param {string} char1 The first hex digit.
	 * @param {string} char2 The second hex digit.
	 * @returns {number} The decoded byte.
	 */
	toByte: (char1, char2) => {
		const byte = tryParseByte(char1, char2);
		if (undefined === byte)
			throw Error(`unrecognized hex char '${char1}${char2}'`);

		return byte;
	},

	/**
	 * Determines whether or not a string is a hex string.
	 * @param {string} input The string to test.
	 * @returns {boolean} true if the input is a hex string, false otherwise.
	 */
	isHexString: input => {
		if (0 !== input.length % 2)
			return false;

		for (let i = 0; i < input.length; i += 2) {
			if (undefined === tryParseByte(input[i], input[i + 1]))
				return false;
		}

		return true;
	},

	/**
	 * Converts a hex string to a uint8 array.
	 * @param {string} input A hex encoded string.
	 * @returns {Uint8Array} A uint8 array corresponding to the input.
	 */
	hexToUint8: input => {
		if (0 !== input.length % 2)
			throw Error(`hex string has unexpected size '${input.length}'`);

		const output = new Uint8Array(input.length / 2);
		for (let i = 0; i < input.length; i += 2)
			output[i / 2] = convert.toByte(input[i], input[i + 1]);

		return output;
	},

	/**
	 * Reversed convertion hex string to a uint8 array.
	 * @param {string} input A hex encoded string.
	 * @returns {Uint8Array} A uint8 array corresponding to the input.
	 */
	hexToUint8Reverse: input => {
		if (0 !== input.length % 2)
			throw Error(`hex string has unexpected size '${input.length}'`);

		const output = new Uint8Array(input.length / 2);
		for (let i = 0; i < input.length; i += 2)
			output[output.length - 1 - (i / 2)] = convert.toByte(input[i], input[i + 1]);

		return output;
	},

	/**
	 * Converts a uint8 array to a hex string.
	 * @param {Uint8Array} input A uint8 array.
	 * @returns {string} A hex encoded string corresponding to the input.
	 */
	uint8ToHex: input => {
		let s = '';
		for (const byte of input) {
			s += Nibble_To_Char_Map[byte >> 4];
			s += Nibble_To_Char_Map[byte & 0x0F];
		}

		return s;
	},

	/**
	 * Tries to parse a string representing an unsigned integer.
	 * @param {string} str The string to parse.
	 * @returns {number} The number represented by the input or undefined.
	 */
	tryParseUint: str => {
		if ('0' === str)
			return 0;

		let value = 0;
		for (const char of str) {
			const digit = Char_To_Digit_Map[char];
			if (undefined === digit || (0 === value && 0 === digit))
				return undefined;

			value *= 10;
			value += digit;

			if (value > Number.MAX_SAFE_INTEGER)
				return undefined;
		}

		return value;
	},

	/**
	 * Converts a uint8 array to a uint32 array.
	 * @param {Uint8Array} input A uint8 array.
	 * @returns {Uint32Array} A uint32 array created from the input.
	 */
	uint8ToUint32: input => new Uint32Array(input.buffer),

	/**
	 * Converts a uint32 array to a uint8 array.
	 * @param {Uint32Array} input A uint32 array.
	 * @returns {Uint8Array} A uint8 array created from the input.
	 */
	uint32ToUint8: input => new Uint8Array(input.buffer),

	/** Converts an unsigned byte to a signed byte with the same binary representation.
	 * @param {number} input An unsigned byte.
	 * @returns {number} A signed byte with the same binary representation as the input.
	 * */
	uint8ToInt8: input => {
		if (0xFF < input)
			throw Error(`input '${input}' is out of range`);

		return input << 24 >> 24;
	},

	/** Converts a signed byte to an unsigned byte with the same binary representation.
	 * @param {number} input A signed byte.
	 * @returns {number} An unsigned byte with the same binary representation as the input.
	 * */
	int8ToUint8: input => {
		if (127 < input || -128 > input)
			throw Error(`input '${input}' is out of range`);

		return input & 0xFF;
	},

	/**
	 * Convert UTF-8 to hex
	 * @param {string} str - An UTF-8 string
	 * @return {string}
	 */
	utf8ToHex: str => {
		const rawString = convert.rstr2utf8(str);
		let result = '';
		for (let i = 0; i < rawString.length; i++)
			result += rawString.charCodeAt(i).toString(16);


		return result;
	},
	hexToUtf8 : hexx => {
		var hex = hexx.toString();
		var str = '';
		for (var i = 0; i < hex.length; i += 2) {
				str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
		}
		return str;
	},
	/**
	 * Converts a raw javascript string into a string of single byte characters using utf8 encoding.
	 * This makes it easier to perform other encoding operations on the string.
	 *
	 * @param {string} input - A raw string
	 *
	 * @return {string} - UTF-8 string
	 */
	rstr2utf8: input => {
		let output = '';

		for (let n = 0; n < input.length; n++) {
			const c = input.charCodeAt(n);

			if (128 > c) {
				output += String.fromCharCode(c);
			} else if ((127 < c) && (2048 > c)) {
				output += String.fromCharCode((c >> 6) | 192);
				output += String.fromCharCode((c & 63) | 128);
			} else {
				output += String.fromCharCode((c >> 12) | 224);
				output += String.fromCharCode(((c >> 6) & 63) | 128);
				output += String.fromCharCode((c & 63) | 128);
			}
		}

		return output;
	}
};

//export default convert;

const array = {

	/**
	 * Creates a Uint8Array view on top of input.
	 * @param {ArrayBuffer|Uint8Array} input The input array.
	 * @returns {Uint8Array} A Uint8Array view on top of input.
	 */
	uint8View: input => {
		if (ArrayBuffer === input.constructor)
			return new Uint8Array(input); // note that wrapping an ArrayBuffer in an Uint8Array does not make a copy
		else if (Uint8Array === input.constructor)
			return input;

		throw Error('unsupported type passed to uint8View');
	},

	/**
	 * Copies elements from a source array to a destination array.
	 * @param {Array} dest The destination array.
	 * @param {Array} src The source array.
	 * @param {number} [numElementsToCopy=undefined] The number of elements to copy.
	 * @param {number} [destOffset=0] The first index of the destination to write.
	 * @param {number} [srcOffset=0] The first index of the source to read.
	 */
	copy: (dest, src, numElementsToCopy, destOffset = 0, srcOffset = 0) => {
		const length = undefined === numElementsToCopy ? dest.length : numElementsToCopy;
		for (let i = 0; i < length; ++i){

			dest[destOffset + i] = src[srcOffset + i];
		}
	},

	/**
	 * Determines whether or not an array is zero-filled.
	 * @param {Array} array The array to check.
	 * @returns {boolean} true if the array is zero-filled, false otherwise.
	 */
	isZero: array => array.every(value => 0 === value),

	/**
	 * Deeply checks the equality of two arrays.
	 * @param {Array} lhs First array to compare.
	 * @param {Array} rhs Second array to compare.
	 * @param {number} [numElementsToCompare=undefined] The number of elements to compare.
	 * @returns {boolean} true if all compared elements are equal, false otherwise.
	 */
	deepEqual: (lhs, rhs, numElementsToCompare) => {
		let length = numElementsToCompare;
		if (undefined === length) {
			if (lhs.length !== rhs.length)
				return false;

			length = lhs.length;
		}

		if (length > lhs.length || length > rhs.length)
			return false;

		for (let i = 0; i < length; ++i) {
			if (lhs[i] !== rhs[i])
				return false;
		}

		return true;
	}
};

const Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const Decoded_Block_Size = 5;
const Encoded_Block_Size = 8;

// region encode

function encodeBlock(input, inputOffset, output, outputOffset) {
	output[outputOffset + 0] = Alphabet[input[inputOffset + 0] >> 3];
	output[outputOffset + 1] = Alphabet[((input[inputOffset + 0] & 0x07) << 2) | (input[inputOffset + 1] >> 6)];
	output[outputOffset + 2] = Alphabet[(input[inputOffset + 1] & 0x3E) >> 1];
	output[outputOffset + 3] = Alphabet[((input[inputOffset + 1] & 0x01) << 4) | (input[inputOffset + 2] >> 4)];
	output[outputOffset + 4] = Alphabet[((input[inputOffset + 2] & 0x0F) << 1) | (input[inputOffset + 3] >> 7)];
	output[outputOffset + 5] = Alphabet[(input[inputOffset + 3] & 0x7F) >> 2];
	output[outputOffset + 6] = Alphabet[((input[inputOffset + 3] & 0x03) << 3) | (input[inputOffset + 4] >> 5)];
	output[outputOffset + 7] = Alphabet[input[inputOffset + 4] & 0x1F];
}

// endregion

// region decode

const Char_To_Decoded_Char_Map = (function () {
	const builder = charMapping.createBuilder();
	builder.addRange('A', 'Z', 0);
	builder.addRange('2', '7', 26);
	return builder.map;
})();

function decodeChar(c) {
	const decodedChar = Char_To_Decoded_Char_Map[c];
	if (undefined !== decodedChar)
		return decodedChar;

	throw Error(`illegal base32 character ${c}`);
}

function decodeBlock(input, inputOffset, output, outputOffset) {
	const bytes = new Uint8Array(Encoded_Block_Size);
	for (let i = 0; i < Encoded_Block_Size; ++i)
		bytes[i] = decodeChar(input[inputOffset + i]);

	output[outputOffset + 0] = (bytes[0] << 3) | (bytes[1] >> 2);
	output[outputOffset + 1] = ((bytes[1] & 0x03) << 6) | (bytes[2] << 1) | (bytes[3] >> 4);
	output[outputOffset + 2] = ((bytes[3] & 0x0F) << 4) | (bytes[4] >> 1);
	output[outputOffset + 3] = ((bytes[4] & 0x01) << 7) | (bytes[5] << 2) | (bytes[6] >> 3);
	output[outputOffset + 4] = ((bytes[6] & 0x07) << 5) | bytes[7];
}

// endregion

//export default {
const base32 = {
	/**
	 * Base32 encodes a binary buffer.
	 * @param {Uint8Array} data The binary data to encode.
	 * @returns {string} The base32 encoded string corresponding to the input data.
	 */
	encode: data => {
		if (0 !== data.length % Decoded_Block_Size)
			throw Error(`decoded size must be multiple of ${Decoded_Block_Size}`);

		const output = new Array(data.length / Decoded_Block_Size * Encoded_Block_Size);
		for (let i = 0; i < data.length / Decoded_Block_Size; ++i)
			encodeBlock(data, i * Decoded_Block_Size, output, i * Encoded_Block_Size);

		return output.join('');
	},

	/**
	 * Base32 decodes a base32 encoded string.
	 * @param {string} encoded The base32 encoded string to decode.
	 * @returns {Uint8Array} The binary data corresponding to the input string.
	 */
	decode: encoded => {
		if (0 !== encoded.length % Encoded_Block_Size)
			throw Error(`encoded size must be multiple of ${Encoded_Block_Size}`);

		const output = new Uint8Array(encoded.length / Encoded_Block_Size * Decoded_Block_Size);
		for (let i = 0; i < encoded.length / Encoded_Block_Size; ++i)
			decodeBlock(encoded, i * Encoded_Block_Size, output, i * Decoded_Block_Size);

		return output;
	}
};


const readUint32At = (bytes, i) => (bytes[i] + (bytes[i + 1] << 8) + (bytes[i + 2] << 16) + (bytes[i + 3] << 24)) >>> 0;

/**
 * An exact uint64 representation composed of two 32bit values.
 * @typedef {Array} uint64
 * @property {number} 0 The low 32bit value.
 * @property {number} 1 The high 32bit value.
 */

const uint64 = {
	/**
	 * Tries to compact a uint64 into a simple numeric.
	 * @param {module:coders/uint64~uint64} uint64 A uint64 value.
	 * @returns {number|module:coders/uint64~uint64}
	 * A numeric if the uint64 is no greater than Number.MAX_SAFE_INTEGER or the original uint64 value otherwise.
	 */
	compact: uint64 => {
		const low = uint64[0];
		const high = uint64[1];

		// don't compact if the value is >= 2^53
		if (0x00200000 <= high)
			return uint64;

		// multiply because javascript bit operations operate on 32bit values
		return (high * 0x100000000) + low;
	},

	/**
	 * Converts a numeric unsigned integer into a uint64.
	 * @param {number} number The unsigned integer.
	 * @returns {module:coders/uint64~uint64} The uint64 representation of the input.
	 */
		fromUint: number => {
		const value = [(number & 0xFFFFFFFF) >>> 0, (number / 0x100000000) >>> 0];
		//if (0x00200000 <= value[1] || 0 > number || 0 !== (number % 1))
		//	throw Error(`number cannot be converted to uint '${number}'`);

		return value;
	},

	/**
	 * Converts a (64bit) uint8 array into a uint64.
	 * @param {Uint8Array} uint8Array A uint8 array.
	 * @returns {module:coders/uint64~uint64} The uint64 representation of the input.
	 */
	fromBytes: uint8Array => {
		if (8 !== uint8Array.length)
			throw Error(`byte array has unexpected size '${uint8Array.length}'`);

		return [readUint32At(uint8Array, 0), readUint32At(uint8Array, 4)];
	},

	/**
	 * Converts a (32bit) uint8 array into a uint64.
	 * @param {Uint8Array} uint8Array A uint8 array.
	 * @returns {module:coders/uint64~uint64} The uint64 representation of the input.
	 */
	fromBytes32: uint8Array => {
		if (4 !== uint8Array.length)
			throw Error(`byte array has unexpected size '${uint8Array.length}'`);

		return [readUint32At(uint8Array, 0), 0];
	},

	/**
	 * Parses a hex string into a uint64.
	 * @param {string} input A hex encoded string.
	 * @returns {module:coders/uint64~uint64} The uint64 representation of the input.
	 */
	fromHex: input => {
		if (16 !== input.length)
			throw Error(`hex string has unexpected size '${input.length}'`);

		let hexString = input;
		if (16 > hexString.length)
			hexString = '0'.repeat(16 - hexString.length) + hexString;

		const uint8Array = convert.hexToUint8(hexString);
		const view = new DataView(uint8Array.buffer);
		return [view.getUint32(4), view.getUint32(0)];
	},

	/**
	 * Converts a uint64 into a hex string.
	 * @param {module:coders/uint64~uint64} uint64 A uint64 value.
	 * @returns {string} A hex encoded string representing the uint64.
	 */
	toHex: uint64 => {
		const uint32Array = new Uint32Array(uint64);
		const uint8Array = convert.uint32ToUint8(uint32Array).reverse();
		return convert.uint8ToHex(uint8Array);
	},

	/**
	 * Returns true if a uint64 is zero.
	 * @param {module:coders/uint64~uint64} uint64 A uint64 value.
	 * @returns {boolean} true if the value is zero.
	 */
	isZero: uint64 => 0 === uint64[0] && 0 === uint64[1]
};
