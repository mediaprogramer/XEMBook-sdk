
let BinaryKey = function(keyData) {
	this.data = keyData;
	this.toString = function() {
		return ua2hex(this.data);
	}
}

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

let KeyPair = function(privkey) {
	this.publicKey = new BinaryKey(new Uint8Array(nacl.lowlevel.crypto_sign_PUBLICKEYBYTES));
	this.secretKey = hex2ua_reversed(privkey);
	nacl.lowlevel.crypto_sign_keypair_hash(this.publicKey.data, this.secretKey, hashfunc);

	this.sign = function(data) {
		let sig = new Uint8Array(64);
		let hasher = new hashobj();
		let r = nacl.lowlevel.crypto_sign_hash(sig, this, data, hasher);
		if (!r) {
			alert("couldn't sign the tx, generated invalid signature");
			throw new Error("couldn't sign the tx, generated invalid signature");
		}
		return new BinaryKey(sig);
	}

};

KeyPair.verifySignature = function(publicKey, data, signature) {
	// Errors
	if(!publicKey || !data || !signature) throw new Error('Missing argument !');
	if (!Helpers.isPublicKeyValid(publicKey)) throw new Error('Public key is not valid !');

	if (!Helpers.isHexadecimal(signature)) {
		//console.error('Signature must be hexadecimal only !');
		return false;
	}
	if (signature.length !== 128) {
		//console.error('Signature length is incorrect !')
		return false;
	}

	let hasher = new hashobj();
	let _pk = hex2ua(publicKey);
	let _signature = hex2ua(signature);

	const c = nacl;
	const p = [c.gf(), c.gf(), c.gf(), c.gf()];
	const q = [c.gf(), c.gf(), c.gf(), c.gf()];

	if (c.unpackneg(q, _pk)) return false;

	const h = new Uint8Array(64);
	hasher.reset();
	hasher.update(_signature.subarray(0, 64/2));
	hasher.update(_pk);
	hasher.update(data);
	hasher.finalize(h);

	c.reduce(h);
	c.scalarmult(p, q, h);

	const t = new Uint8Array(64);
	c.scalarbase(q, _signature.subarray(64/2));
	c.add(p, q);
	c.pack(t, p);

	return 0 === nacl.lowlevel.crypto_verify_32(_signature, 0, t, 0);
}


KeyPair.create = function(hexdata) {
	let r = new KeyPair(hexdata);
	return r;
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

let hex2ua_reversed = function(hexx) {
	var hex = hexx.toString();//force conversion
	var ua = new Uint8Array(hex.length / 2);
	for (var i = 0; i < hex.length; i += 2) {
		ua[ua.length - 1 - (i / 2)] = parseInt(hex.substr(i, 2), 16);
	}
	return ua;
};

let ua2hex = function(ua) {
	var s = '';
	for (var i = 0; i < ua.length; i++) {
		var code = ua[i];
		s += _hexEncodeArray[code >>> 4];
		s += _hexEncodeArray[code & 0x0F];
	}
	return s;
};

let hex2ua = function(hexx) {
	var hex = hexx.toString();//force conversion
	var ua = new Uint8Array(hex.length / 2);
	for (var i = 0; i < hex.length; i += 2) {
		ua[i / 2] = parseInt(hex.substr(i, 2), 16);
	}
	return ua;
};
