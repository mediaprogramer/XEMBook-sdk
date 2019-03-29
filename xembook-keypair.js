let KeyPair = function(ua) {

	let pk = '';
	for (let i = 0; i < ua.length; i++) {
		let code = ua[i];
		pk += HEX[code >>> 4];
		pk += HEX[code & 0x0F];
	}

	pk =  ("0000000000000000000000000000000000000000000000000000000000000000" + pk.replace(/^00/, '')).slice(-64);
	this.secretKey = new Uint8Array(pk.length / 2);
	
	for (let i = 0; i < pk.length; i += 2) {
		this.secretKey[this.secretKey.length - 1 - (i / 2)] = parseInt(pk.substr(i, 2), 16);
	}
	delete pk;

	this.publicKey = new BinaryKey(new Uint8Array(nacl.lowlevel.crypto_sign_PUBLICKEYBYTES));
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

KeyPair.create = function(ua) {
	return new KeyPair(ua);
}

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
