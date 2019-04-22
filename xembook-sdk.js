
//NEM標準時
let NEM_EPOCH = Date.UTC(2015, 2, 29, 0, 6, 25, 0);
var HEX = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];

let transfer = 0x101; // 257
let importanceTransfer = 0x801; // 2049
let multisigModification = 0x1001; // 4097
let multisigSignature = 0x1002; // 4098
let multisigTransaction = 0x1004; // 4100
let provisionNamespace = 0x2001; // 8193
let mosaicDefinition = 0x4001; // 16385
let mosaicSupply = 0x4002; // 16386
let CURRENT_NETWORK_ID = 104;
var isHashAccess = false;
var targetNode = "";
var lastHash = "";

var currentFeeFactor = 0.05;

let hex2a = function(hexx) {
	let hex = hexx.toString();
	let str = '';
	for (let i = 0; i < hex.length; i += 2)
		str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
	return str;
};

let hashfunc = function(dest, data, dataLength) {
	let convertedData = ua2words(data, dataLength);
	let hash = CryptoJS.SHA3(convertedData, { outputLength: 512 });
	words2ua(dest, hash);
}

let hashobj = function() {
	this.sha3 = CryptoJS.algo.SHA3.create({ outputLength: 512 });
	this.reset = function() {
		this.sha3 = CryptoJS.algo.SHA3.create({ outputLength: 512 });
	}
	this.update = function(data) {
		if (data instanceof BinaryKey) {
			let converted = ua2words(data.data, data.data.length);
			let result = CryptoJS.enc.Hex.stringify(converted);
			this.sha3.update(converted);

		} else if (data instanceof Uint8Array) {
			let converted = ua2words(data, data.length);
			this.sha3.update(converted);

		} else if (typeof data === "string") {
			let converted = CryptoJS.enc.Hex.parse(data);
			this.sha3.update(converted);

		} else {
			throw new Error("unhandled argument");
		}
	}
	this.finalize = function(result) {
		let hash = this.sha3.finalize();
		words2ua(result, hash);
	};
}

let ua2words = function(ua, uaLength) {
	let temp = [];
	for (let i = 0; i < uaLength; i += 4) {
		let x = ua[i]*0x1000000 + (ua[i+1] || 0)*0x10000 + (ua[i+2] || 0)* 0x100 + (ua[i+3] || 0);
		temp.push( (x > 0x7fffffff) ?  x - 0x100000000 : x );
	}
	return CryptoJS.lib.WordArray.create(temp, uaLength);
}

let words2ua = function(destUa, cryptowords) {
	for (let i = 0; i < destUa.length; i += 4) {
		let v = cryptowords.words[i / 4];
		if (v < 0) v += 0x100000000;
		destUa[i] = (v >>> 24);
		destUa[i+1] = (v >>> 16) & 0xff;
		destUa[i+2] = (v  >>> 8) & 0xff;
		destUa[i+3] = v & 0xff;
	}
}


let BinaryKey = function(keyData) {
	this.data = keyData;
	this.toString = function() {
		return ua2hex(this.data);
	}
}

let ua2hex = function(ua) {
	var s = '';
	for (var i = 0; i < ua.length; i++) {
		var code = ua[i];
		s += HEX[code >>> 4];
		s += HEX[code & 0x0F];
	}
	return s;
};

let hex2ua = function(hexx) {
	let hex = hexx.toString();//force conversion
	let ua = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) {
		ua[i / 2] = parseInt(hex.substr(i, 2), 16);
	}
	return ua;
};

let toAddress = function(publicKey, networkId) {
	let binPubKey = CryptoJS.enc.Hex.parse(publicKey);
	let hash = CryptoJS.SHA3(binPubKey, {
		outputLength: 256
	});
	let hash2 = CryptoJS.RIPEMD160(hash);
	// 98 is for testnet
	let networkPrefix = id2Prefix(104);
	let versionPrefixedRipemd160Hash = networkPrefix + CryptoJS.enc.Hex.stringify(hash2);
	let tempHash = CryptoJS.SHA3(CryptoJS.enc.Hex.parse(versionPrefixedRipemd160Hash), {
		outputLength: 256
	});
	let stepThreeChecksum = CryptoJS.enc.Hex.stringify(tempHash).substr(0, 8);
	let concatStepThreeAndStepSix = hex2a(versionPrefixedRipemd160Hash + stepThreeChecksum);
	let ret = b32encode(concatStepThreeAndStepSix);
	return ret;
};

var id2Prefix = function id2Prefix(id) {
	if (	   id ===  104) { return "68";
	} else if (id === -104) { return "98";
	} else {				  return "60"; }
};
var b32encode = function(s) {
	var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
	var parts = [];
	var quanta = Math.floor(s.length / 5);
	var leftover = s.length % 5;

	if (leftover != 0) {
		for (var i = 0; i < 5 - leftover; i++) {
			s += '\x00';
		}
		quanta += 1;
	}

	for (var _i = 0; _i < quanta; _i++) {
		parts.push(alphabet.charAt(s.charCodeAt(_i * 5) >> 3));
		parts.push(alphabet.charAt((s.charCodeAt(_i * 5) & 0x07) << 2 | s.charCodeAt(_i * 5 + 1) >> 6));
		parts.push(alphabet.charAt((s.charCodeAt(_i * 5 + 1) & 0x3F) >> 1));
		parts.push(alphabet.charAt((s.charCodeAt(_i * 5 + 1) & 0x01) << 4 | s.charCodeAt(_i * 5 + 2) >> 4));
		parts.push(alphabet.charAt((s.charCodeAt(_i * 5 + 2) & 0x0F) << 1 | s.charCodeAt(_i * 5 + 3) >> 7));
		parts.push(alphabet.charAt((s.charCodeAt(_i * 5 + 3) & 0x7F) >> 2));
		parts.push(alphabet.charAt((s.charCodeAt(_i * 5 + 3) & 0x03) << 3 | s.charCodeAt(_i * 5 + 4) >> 5));
		parts.push(alphabet.charAt(s.charCodeAt(_i * 5 + 4) & 0x1F));
	}

	var replace = 0;
	if (leftover == 1) replace = 6;else if (leftover == 2) replace = 4;else if (leftover == 3) replace = 3;else if (leftover == 4) replace = 1;

	for (var _i2 = 0; _i2 < replace; _i2++) {
		parts.pop();
	}
	for (var _i3 = 0; _i3 < replace; _i3++) {
		parts.push("=");
	}
	return parts.join("");
};




var rstr2utf8 = function rstr2utf8(input) {
	var output = "";

	for (var n = 0; n < input.length; n++) {
		var c = input.charCodeAt(n);

		if (c < 128) {
			output += String.fromCharCode(c);
		} else if (c > 127 && c < 2048) {
			output += String.fromCharCode(c >> 6 | 192);
			output += String.fromCharCode(c & 63 | 128);
		} else {
			output += String.fromCharCode(c >> 12 | 224);
			output += String.fromCharCode(c >> 6 & 63 | 128);
			output += String.fromCharCode(c & 63 | 128);
		}
	}

	return output;
};

var utf8ToHex = function utf8ToHex(str) {
	var rawString = rstr2utf8(str);
	var hex = "";
	for (var i = 0; i < rawString.length; i++) {
		hex += strlpad(rawString.charCodeAt(i).toString(16), "0", 2);
	}
	return hex;
};

// Padding helper for above function
var strlpad = function strlpad(str, pad, len) {
	while (str.length < len) {
		str = pad + str;
	}
	return str;
};


var _serializeSafeString = function _serializeSafeString(str) {
	var r = new ArrayBuffer(132);
	var d = new Uint32Array(r);
	var b = new Uint8Array(r);

	var e = 4;
	if (str === null) {
		d[0] = 0xffffffff;
	} else {
		d[0] = str.length;
		for (var j = 0; j < str.length; ++j) {
			b[e++] = str.charCodeAt(j);
		}
	}
	return new Uint8Array(r, 0, e);
};

var _serializeUaString = function _serializeUaString(str) {
	var r = new ArrayBuffer(516);
	var d = new Uint32Array(r);
	var b = new Uint8Array(r);

	var e = 4;
	if (str === null) {
		d[0] = 0xffffffff;
	} else {
		d[0] = str.length;
		for (var j = 0; j < str.length; ++j) {
			b[e++] = str[j];
		}
	}
	return new Uint8Array(r, 0, e);
};

var _serializeLong = function _serializeLong(value) {
	var r = new ArrayBuffer(8);
	var d = new Uint32Array(r);
	d[0] = value;
	d[1] = Math.floor(value / 0x100000000);
	return new Uint8Array(r, 0, 8);
};

var _serializeMosaicId = function _serializeMosaicId(mosaicId) {
	var r = new ArrayBuffer(264);
	var serializedNamespaceId = _serializeSafeString(mosaicId.namespaceId);
	var serializedName = _serializeSafeString(mosaicId.name);

	var b = new Uint8Array(r);
	var d = new Uint32Array(r);
	d[0] = serializedNamespaceId.length + serializedName.length;
	var e = 4;
	for (var j = 0; j < serializedNamespaceId.length; ++j) {
		b[e++] = serializedNamespaceId[j];
	}
	for (var j = 0; j < serializedName.length; ++j) {
		b[e++] = serializedName[j];
	}
	return new Uint8Array(r, 0, e);
};

var _serializeMosaicAndQuantity = function _serializeMosaicAndQuantity(mosaic) {
	var r = new ArrayBuffer(4 + 264 + 8);
	var serializedMosaicId = _serializeMosaicId(mosaic.mosaicId);
	var serializedQuantity = _serializeLong(mosaic.quantity);

	//$log.info(convert.ua2hex(serializedQuantity), serializedMosaicId, serializedQuantity);

	var b = new Uint8Array(r);
	var d = new Uint32Array(r);
	d[0] = serializedMosaicId.length + serializedQuantity.length;
	var e = 4;
	for (var j = 0; j < serializedMosaicId.length; ++j) {
		b[e++] = serializedMosaicId[j];
	}
	for (var j = 0; j < serializedQuantity.length; ++j) {
		b[e++] = serializedQuantity[j];
	}
	return new Uint8Array(r, 0, e);
};
var _serializeMosaics = function _serializeMosaics(entity) {
	var r = new ArrayBuffer(276 * 10 + 4);
	var d = new Uint32Array(r);
	var b = new Uint8Array(r);

	var i = 0;
	var e = 0;

	d[i++] = entity.length;
	e += 4;

	var temporary = [];
	for (var j = 0; j < entity.length; ++j) {
		temporary.push({
			'entity': entity[j],
			'value': mosaicIdToName(entity[j].mosaicId) + " : " + entity[j].quantity
		});
	}
	temporary.sort(function (a, b) {
		return a.value < b.value ? -1 : a.value > b.value;
	});

	for (var j = 0; j < temporary.length; ++j) {
		var entity = temporary[j].entity;
		var serializedMosaic = _serializeMosaicAndQuantity(entity);
		for (var k = 0; k < serializedMosaic.length; ++k) {
			b[e++] = serializedMosaic[k];
		}
	}

	return new Uint8Array(r, 0, e);
};

var _serializeProperty = function _serializeProperty(entity) {
	var r = new ArrayBuffer(1024);
	var d = new Uint32Array(r);
	var b = new Uint8Array(r);
	var serializedName = _serializeSafeString(entity['name']);
	var serializedValue = _serializeSafeString(entity['value']);
	d[0] = serializedName.length + serializedValue.length;
	var e = 4;
	for (var j = 0; j < serializedName.length; ++j) {
		b[e++] = serializedName[j];
	}
	for (var j = 0; j < serializedValue.length; ++j) {
		b[e++] = serializedValue[j];
	}
	return new Uint8Array(r, 0, e);
};

var _serializeProperties = function _serializeProperties(entity) {
	var r = new ArrayBuffer(1024);
	var d = new Uint32Array(r);
	var b = new Uint8Array(r);

	var i = 0;
	var e = 0;

	d[i++] = entity.length;
	e += 4;

	var temporary = entity;

	var temporary = [];
	for (var j = 0; j < entity.length; ++j) {
		temporary.push(entity[j]);
	}

	var helper = {
		'divisibility': 1,
		'initialSupply': 2,
		'supplyMutable': 3,
		'transferable': 4
	};
	temporary.sort(function (a, b) {
		return helper[a.name] < helper[b.name] ? -1 : helper[a.name] > helper[b.name];
	});

	for (var j = 0; j < temporary.length; ++j) {
		var entity = temporary[j];
		var serializedProperty = _serializeProperty(entity);
		for (var k = 0; k < serializedProperty.length; ++k) {
			b[e++] = serializedProperty[k];
		}
	}
	return new Uint8Array(r, 0, e);
};

var _serializeLevy = function _serializeLevy(entity) {
	var r = new ArrayBuffer(1024);
	var d = new Uint32Array(r);

	if (entity === null) {
		d[0] = 0;
		return new Uint8Array(r, 0, 4);
	}

	var b = new Uint8Array(r);
	d[1] = entity['type'];

	var e = 8;
	var temp = _serializeSafeString(entity['recipient']);
	for (var j = 0; j < temp.length; ++j) {
		b[e++] = temp[j];
	}

	var serializedMosaicId = _serializeMosaicId(entity['mosaicId']);
	for (var j = 0; j < serializedMosaicId.length; ++j) {
		b[e++] = serializedMosaicId[j];
	}

	var serializedFee = _serializeLong(entity['fee']);
	for (var j = 0; j < serializedFee.length; ++j) {
		b[e++] = serializedFee[j];
	}

	d[0] = 4 + temp.length + serializedMosaicId.length + 8;

	return new Uint8Array(r, 0, e);
};

var _serializeMosaicDefinition = function _serializeMosaicDefinition(entity) {
	var r = new ArrayBuffer(40 + 264 + 516 + 1024 + 1024);
	var d = new Uint32Array(r);
	var b = new Uint8Array(r);

	var temp = hex2ua(entity['creator']);
	d[0] = temp.length;
	var e = 4;
	for (var j = 0; j < temp.length; ++j) {
		b[e++] = temp[j];
	}

	var serializedMosaicId = _serializeMosaicId(entity.id);
	for (var j = 0; j < serializedMosaicId.length; ++j) {
		b[e++] = serializedMosaicId[j];
	}

	var utf8ToUa =hex2ua(utf8ToHex(entity['description']));
	var temp = _serializeUaString(utf8ToUa);
	for (var j = 0; j < temp.length; ++j) {
		b[e++] = temp[j];
	}

	var temp = _serializeProperties(entity['properties']);
	for (var j = 0; j < temp.length; ++j) {
		b[e++] = temp[j];
	}

	var levy = _serializeLevy(entity['levy']);
	for (var j = 0; j < levy.length; ++j) {
		b[e++] = levy[j];
	}
	return new Uint8Array(r, 0, e);
};


let serializeTransaction = function(entity) {
	var r = new ArrayBuffer(512 + 2764);
	var d = new Uint32Array(r);
	var b = new Uint8Array(r);
	d[0] = entity['type'];
	d[1] = entity['version'];
	d[2] = entity['timeStamp'];

	var temp = hex2ua(entity['signer']);
	d[3] = temp.length;
	var e = 16;
	for (var j = 0; j < temp.length; ++j) {
		b[e++] = temp[j];
	}

	// Transaction
	var i = e / 4;
	d[i++] = entity['fee'];
	d[i++] = Math.floor((entity['fee'] / 0x100000000));
	d[i++] = entity['deadline'];
	e += 12;

	// TransferTransaction
	if (d[0] === transfer) {
		d[i++] = entity['recipient'].length;
		e += 4;
		// TODO: check that entity['recipient'].length is always 40 bytes
		for (var j = 0; j < entity['recipient'].length; ++j) {
			b[e++] = entity['recipient'].charCodeAt(j);
		}
		i = e / 4;
		d[i++] = entity['amount'];
		d[i++] = Math.floor((entity['amount'] / 0x100000000));
		e += 8;

		if (entity['message']['type'] === 1 || entity['message']['type'] === 2) {
			var temp = hex2ua(entity['message']['payload']);
			if (temp.length === 0) {
				d[i++] = 0;
				e += 4;
			} else {
				// length of a message object
				d[i++] = 8 + temp.length;
				// object itself
				d[i++] = entity['message']['type'];
				d[i++] = temp.length;
				e += 12;
				for (var j = 0; j < temp.length; ++j) {
					b[e++] = temp[j];
				}
			}
		}

		var entityVersion = d[1] & 0xffffff;
		console.log(entityVersion);
		if (entityVersion >= 2) {
			var temp = _serializeMosaics(entity['mosaics']);
			for (var j = 0; j < temp.length; ++j) {
				b[e++] = temp[j];
			}
		}

	// Provision Namespace transaction
	} else if (d[0] === provisionNamespace) {
		d[i++] = entity['rentalFeeSink'].length;
		e += 4;
		// TODO: check that entity['rentalFeeSink'].length is always 40 bytes
		for (var j = 0; j < entity['rentalFeeSink'].length; ++j) {
			b[e++] = entity['rentalFeeSink'].charCodeAt(j);
		}
		i = e / 4;
		d[i++] = entity['rentalFee'];
		d[i++] = Math.floor((entity['rentalFee'] / 0x100000000));
		e += 8;

		var temp = _serializeSafeString(entity['newPart']);
		for (var j = 0; j < temp.length; ++j) {
			b[e++] = temp[j];
		}

		var temp = _serializeSafeString(entity['parent']);
		for (var j = 0; j < temp.length; ++j) {
			b[e++] = temp[j];
		}

	// Mosaic Definition Creation transaction
	} else if (d[0] === mosaicDefinition) {
		var temp = _serializeMosaicDefinition(entity['mosaicDefinition']);
		d[i++] = temp.length;
		e += 4;
		for (var j = 0; j < temp.length; ++j) {
			b[e++] = temp[j];
		}

		temp = _serializeSafeString(entity['creationFeeSink']);
		for (var j = 0; j < temp.length; ++j) {
			b[e++] = temp[j];
		}

		temp = _serializeLong(entity['creationFee']);
		for (var j = 0; j < temp.length; ++j) {
			b[e++] = temp[j];
		}

	// Mosaic Supply Change transaction
	} else if (d[0] === mosaicSupply) {
		var serializedMosaicId = _serializeMosaicId(entity['mosaicId']);
		for (var j = 0; j < serializedMosaicId.length; ++j) {
			b[e++] = serializedMosaicId[j];
		}

		var temp = new ArrayBuffer(4);
		d = new Uint32Array(temp);
		d[0] = entity['supplyType'];
		var serializeSupplyType = new Uint8Array(temp);
		for (var j = 0; j < serializeSupplyType.length; ++j) {
			b[e++] = serializeSupplyType[j];
		}

		var serializedDelta = _serializeLong(entity['delta']);
		for (var j = 0; j < serializedDelta.length; ++j) {
			b[e++] = serializedDelta[j];
		}

	// Signature transaction
	} else if (d[0] === multisigSignature) {
		var temp = hex2ua(entity['otherHash']['data']);
		// length of a hash object....
		d[i++] = 4 + temp.length;
		// object itself
		d[i++] = temp.length;
		e += 8;
		for (var j = 0; j < temp.length; ++j) {
			b[e++] = temp[j];
		}
		i = e / 4;

		temp = entity['otherAccount'];
		d[i++] = temp.length;
		e += 4;
		for (var j = 0; j < temp.length; ++j) {
			b[e++] = temp.charCodeAt(j);
		}

	// Multisig wrapped transaction
	} else if (d[0] === multisigTransaction) {
		var temp = serializeTransaction(entity['otherTrans']);
		d[i++] = temp.length;
		e += 4;
		for (var j = 0; j < temp.length; ++j) {
			b[e++] = temp[j];
		}

	// Aggregate Modification transaction
	} else if (d[0] === multisigModification) {


		// Number of modifications
		var temp = entity['modifications'];
		temp.sort(function(a, b) {return a.cosignatoryAddress < b.cosignatoryAddress ? -1 : a.cosignatoryAddress > b.cosignatoryAddress;});

		d[i++] = temp.length;
		e += 4;

		for (var j = 0; j < temp.length; ++j) {
			// Length of modification structure
			d[i++] = 0x28;
			e += 4;
			// Modification type
			if (temp[j]['modificationType'] == 1) {
				d[i++] = 0x01;
			} else {
				d[i++] = 0x02;
			}
			e += 4;
			// Length of public key
			d[i++] = 0x20;
			e += 4;

			var key2bytes = hex2ua(entity['modifications'][j]['cosignatoryAccount']);

			// Key to Bytes
			for (var k = 0; k < key2bytes.length; ++k) {
				b[e++] = key2bytes[k];
			}
			i = e / 4;
		}

		var entityVersion = d[1] & 0xffffff;
		if (entityVersion >= 2) {
			d[i++] = 0x04;
			e += 4;
			// Relative change
			d[i++] = entity['minCosignatories']['relativeChange'].toString(16);
			e += 4;
		} else {
			// Version 1 has no modifications
		}

	} else if (d[0] === importanceTransfer) {
		d[i++] = entity['mode'];
		e += 4;
		d[i++] = 0x20;
		e += 4;
		var key2bytes = hex2ua(entity['remoteAccount']);

		//Key to Bytes
		for (var k = 0; k < key2bytes.length; ++k) {
			b[e++] = key2bytes[k];
		}
	}

	return new Uint8Array(r, 0, e);
};

var calculateMinimum = function calculateMinimum(numNem) {
  var fee = Math.floor(Math.max(1, numNem / 10000));
  return fee > 25 ? 25 : fee;
};

var mosaicIdToName = function mosaicIdToName(mosaicId) {
	if (!mosaicId) return mosaicId;
	return mosaicId.namespaceId + ":" + mosaicId.name;
};

var calculateXemEquivalent = function calculateXemEquivalent(multiplier, q, sup, divisibility) {
	if (sup === 0) {
	return 0;
	}
	// TODO: can this go out of JS (2^54) bounds? (possible BUG)
	return 8999999999 * q * multiplier / sup / Math.pow(10, divisibility + 6);
};


var calculateMosaics = function calculateMosaics(multiplier, mosaics) {

	var totalFee = 0;
	var fee = 0;
	var supplyRelatedAdjustment = 0;

	for (var i = 0; i < mosaics.length; i++) {

		var m = mosaics[i];
		var mosaicName = mosaicIdToName(m.mosaicId);

		var divisibility = m.divisibility;
		var supply = m.supply; //
		var quantity = m.quantity;

		if (supply <= 10000 && divisibility === 0) {
		  // Small business mosaic fee
		  fee = currentFeeFactor;

		} else {

			var maxMosaicQuantity = 9000000000000000;
			var totalMosaicQuantity = supply * Math.pow(10, divisibility);
			supplyRelatedAdjustment = Math.floor(0.8 * Math.log(Math.floor(maxMosaicQuantity / totalMosaicQuantity)));
			var numNem = calculateXemEquivalent(multiplier, quantity, supply, divisibility);
			// Using Math.ceil below because xem equivalent returned is sometimes a bit lower than it should
			// Ex: 150'000 of nem:xem gives 149999.99999999997
			fee = calculateMinimum(Math.ceil(numNem));

		}
		totalFee += currentFeeFactor * Math.max(1, fee - supplyRelatedAdjustment);
		console.log("sub:" + totalFee);
	}

	return totalFee;
};

var getFee = function(amount,message,mosaics){

//	let msgFee = message.payload.length ? Math.max(1, Math.floor(message.payload.length / 2 / 16)) * 2 : 0;
	let msgFee = message.payload.length ? 0.05*Math.max(1, Math.floor(message.payload.length / 2 / 32) + 1) : 0;
	console.log("================");

	console.log(msgFee);
	let fee = mosaics ? calculateMosaics(amount,mosaics) : calculateMinimum(amount / 1000000) * currentFeeFactor;
	console.log(calculateMinimum(amount / 1000000));

	console.log(fee);
	return  (msgFee + fee) * 1000000;

}

var getTimestamp = function(diff){
	return Math.floor((Date.now() / 1000) - (NEM_EPOCH / 1000)) + diff;
}

var getVersion = function getVersion( network,val) {
	if (network === 104) {
		return 0x68000000 | val;
	} else if (network === -104) {
		return 0x98000000 | val;
	}
	return 0x60000000 | val;
};

function getNodes(){

	var d = $.Deferred();
	$.ajax({url: "https://s3-ap-northeast-1.amazonaws.com/xembook.net/data/v3/node.json" ,type: 'GET',timeout: 1000}).then(
		function(res){
			var nodes;
			if(isHashAccess){
				nodes = res["apostille"];
			}else{
				nodes = res["http"];
			}
			d.resolve(nodes);
		},
		function(res){
			d.resolve(["alice2.nem.ninja","alice3.nem.ninja","alice4.nem.ninja","alice8.nem.ninja"]);
//			d.resolve(["alice2.nem.ninja","alice99.nem.ninja"]);
		}
	);
	return d.promise();
}

function connectNode_bk(nodes,query){

	if(targetNode == "" || isHashAccess){
		targetNode = nodes[Math.floor(Math.random() * nodes.length)] + ":7890";
	}

	var d = $.Deferred();
	console.log("connectNode:"+  "http://" + targetNode + query);
	$.ajax({url:  "http://" + targetNode + query ,type: "GET",timeout: 3000}).then(

		function(res){
			console.log(res);
			d.resolve(res);
		}

	).catch(
		function(res){
			console.log("catch!");
			targetNode = "";
			if(lastHash != ""){
				console.log("ハッシュアクセスモードに切り替えます。");
				isHashAccess = true;
			}
			return connectNode(nodes,query)
			.then(function(res){
				d.resolve(res);
			});
		}
	);
	return d.promise();
}

function connectNodeToPost_bk(nodes,query,txString){

	if(targetNode == "" || isHashAccess){
		targetNode = nodes[Math.floor(Math.random() * nodes.length)] + ":7890";
	}

	var d = $.Deferred();
	console.log("connectNode:"+  "http://" + targetNode + query);
	$.ajax({
		url: "http://" + targetNode + query  ,
		type: 'POST',
		contentType:'application/json',
		data: txString  ,
		error: function(XMLHttpRequest) {
			console.log( $.parseJSON(XMLHttpRequest.responseText));
		}
	}).then(

		function(res){
			console.log(res);
			d.resolve(res);
		}

	).catch(
		function(res){
			console.log("catch!");
			targetNode = "";
			if(lastHash != ""){
				console.log("ハッシュアクセスモードに切り替えます。");
				isHashAccess = true;
			}
			return connectNodeToPost(nodes,query,txString)
			.then(function(res){
				d.resolve(res);
			});
		}
	);
	return d.promise();
}

function connectNodeToPost(nodes,query,txString){

	setTargetNode(nodes);
	var obj = {
		url: "http://" + targetNode + query  ,
		type: 'POST',
		contentType:'application/json',
		data: txString  ,
		error: function(XMLHttpRequest) {
			console.log( $.parseJSON(XMLHttpRequest.responseText));
		}
	}
	return connectNode2(nodes,query,obj);

}

function connectNode(nodes,query){


	setTargetNode(nodes);
	var obj ={url:  "http://" + targetNode + query ,type: "GET",timeout: 3000};
	return connectNode2(nodes,query,obj);
}

function setTargetNode(nodes){
	if(targetNode == "" || isHashAccess){
		targetNode = nodes[Math.floor(Math.random() * nodes.length)] + ":7890";
	}

}
function connectNode2(nodes,query,obj){



	var d = $.Deferred();
	console.log("connectNode:"+  "http://" + targetNode + query);
	$.ajax(obj).then(

		function(res){
			console.log(res);
			d.resolve(res);
		}
	).catch(
		function(res){
			console.log("catch!");
			targetNode = "";
			if(lastHash != ""){
				console.log("ハッシュアクセスモードに切り替えます。");
				isHashAccess = true;
			}
			targetNode = nodes[Math.floor(Math.random() * nodes.length)] + ":7890";
			obj.url = "http://" + targetNode + query;
			return connectNode2(nodes,query,obj)
			.then(function(res){
				d.resolve(res);
			});
		}
	);
	return d.promise();
}

var multiConnect = function(api,num){
	var nodeIndex = num;

	Array.apply(1, {length: num}).reduce(
		function(promise){
			return promise.then(
				function(param){
//					nodeIndex--;
					return api();
				}
			);
		},
		$.Deferred().resolve()
	).then(
		function(){
			console.log("done!");
		}
	);
}

var getNemInfo = function(query){
	return getNodes()
	.then(function(nodes){
		return connectNode(nodes,query);
	});
}

var postNemSignedInfo = function(query,tx,signature){

	let txString = JSON.stringify({'data':ua2hex(tx), 'signature':signature.toString()});
	return getNodes()
	.then(function(nodes){
		return connectNodeToPost(nodes,query,txString);
	});
}
