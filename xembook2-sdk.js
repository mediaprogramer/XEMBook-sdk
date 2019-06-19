
//NEM標準時
let NEM_EPOCH = Date.UTC(2015, 2, 29, 0, 6, 25, 0);
var HEX = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];


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


		const readInt32 = (offset, bytes) => {
			return bytes[offset] | bytes[offset + 1] << 8 | bytes[offset + 2] << 16 | bytes[offset + 3] << 24;
		};

		const readInt16 = (offset, bytes) => {
			return bytes[offset] | bytes[offset + 1] << 8;
		};

		// region flatbuffers region
		const __offset = (val0, fieldPos, bytes) => {
			const vtable = val0 - readInt32(val0, bytes);
			return fieldPos < readInt16(vtable, bytes) ? readInt16(vtable + fieldPos, bytes) : 0;
		};

		let __vector_length = (offset, bytes) => {
			return readInt32(offset + readInt32(offset, bytes), bytes);
		};

		let __indirect = (offset, bytes) => {
			return offset + readInt32(offset, bytes);
		};

		let __vector = (offset, bytes) => {
			return offset + readInt32(offset, bytes) + 4;
		};

		let findVector = (val0, fieldPos, bytes, size) => {
			let offset = __offset(val0, fieldPos, bytes);
			let offsetLong = offset + val0;
			let vecStart = __vector(offsetLong, bytes);
			let vecLength = __vector_length(offsetLong, bytes) * (size ? size : 1);
			return offset ? bytes.slice(vecStart, vecStart + vecLength) : 0;
		};

		const findParam = (val0, fieldPos, bytes, numBytes) => {
			let offset = __offset(val0, fieldPos, bytes);
			return offset ? bytes.slice(offset + val0, offset + val0 + numBytes) : 0;
		};

		const findObjectStartPosition = (val0, fieldPos, bytes) => {
			let offset = __offset(val0, fieldPos, bytes);
			return __indirect(offset + val0, bytes);
		};

		let findArrayLength = (val0, fieldPos, bytes) => {
			const offset = __offset(val0, fieldPos, bytes);
			return offset ? __vector_length(val0 + offset, bytes) : 0;
		};

		let findObjectArrayElementStartPosition = (val0, fieldPos, bytes, index) => {
			const offset = __offset(val0, fieldPos, bytes);
			let vector = __vector(val0 + offset, bytes);
			return __indirect(vector + index * 4, bytes);
		};
		// endregion

	//to XEMBook-sdk
	function publicKeyToAddress(publicKey, networkIdentifier){

		let xembook = require("/main.js");

		const decodedAddress = new Uint8Array(25);
		decodedAddress[0] = networkIdentifier;

		const publicKeyHash = sha3_256.arrayBuffer(publicKey);// publicKey:uint8
		const ripemdHash = xembook.getRipemdHash(publicKeyHash);
		array.copy(decodedAddress, ripemdHash, 20, 1);

		const hash = sha3_256.arrayBuffer(decodedAddress.subarray(0, 20 + 1));
		array.copy(decodedAddress, array.uint8View(hash), 4, 20 + 1);

		return base32.encode(decodedAddress);
	}


	function stringToAddress(encoded){
		console.log(encoded);
		if (40 !== encoded.length){
			console.log("Error!!");
		}

		return base32.decode(encoded);
	}

	function aliasToRecipient( namespaceId ){
		// 0x91 | namespaceId on 8 bytes | 16 bytes 0-pad = 25 bytes
		const padded = new Uint8Array(1 + 8 + 16);
		padded.set([0x91], 0);
		padded.set(namespaceId.reverse(), 1);
		padded.set(convert.hexToUint8('00'.repeat(16)), 9);
		return padded;
	}

	function derivePassSha(password, seed,count) {
	    // Errors
		if(!password) throw new Error('Missing argument !');
		if(!seed) throw new Error('Missing argument !');
	    if(!count || count <= 0) throw new Error('Please provide a count number above 0');

		let uint8seed = convert.hexToUint8(convert.utf8ToHex(seed))
		for (let i = 0; i < count; ++i) {
			uint8seed = array.uint8View(sha3_256.arrayBuffer(uint8seed))// in uint8 out arrayBuffer
	    }

	    let uint8password = convert.hexToUint8(password + convert.uint8ToHex(uint8seed));
		for (let i = 0; i < count; ++i) {

			uint8password = array.uint8View(sha3_256.arrayBuffer(uint8password))// in uint8 out arrayBuffer
	    }

		return uint8password;
	};

		function createTransactionHash(transactionPayload) {
			const byteBuffer = Array.from(convert.hexToUint8(transactionPayload));
			const signingBytes = byteBuffer
				.slice(4, 36)
				.concat(byteBuffer.slice(4 + 64, 4 + 64 + 32))
				.concat(byteBuffer.splice(4 + 64 + 32, byteBuffer.length));

			const hash = new Uint8Array(32);
			sha3Hasher.func(hash, signingBytes, 32);
			return convert.uint8ToHex(hash);
		}



		function deadline(deadlineParam) {

			const networkTimeStamp = (new Date()).getTime();
	        const timeStampDateTime = JSJoda.LocalDateTime.ofInstant(JSJoda.Instant.ofEpochMilli(networkTimeStamp), JSJoda.ZoneId.SYSTEM);
	        const deadlineDateTime = timeStampDateTime.plus(2, JSJoda.ChronoUnit.HOURS);
			console.log("deadlineDateTime");
			var timevalue = uint64.fromUint(
			            (deadlineDateTime.atZone(JSJoda.ZoneId.SYSTEM).toInstant().toEpochMilli() - 1459468800 * 1000));
			console.log(uint64.compact(timevalue));
			return 	timevalue;

/*
			const NetworkTime = (new Date()).getTime() - 1459468800000;
			console.log(NetworkTime);
			const deadlineValue = deadlineParam || 60 * 60 * 1000 * 2;

			console.log(deadlineValue);

			return 	uint64.compact(timevalue);



			const NetworkTime = (new Date()).getTime() - 1459468800000;
			console.log(NetworkTime);
			const deadlineValue = deadlineParam || 60 * 60 * 1000;
			console.log(deadlineValue);

			return uint64.fromUint(deadlineValue + NetworkTime);
*/
		}

		function tableSerialize(bytes, position, val0 = undefined) {
			let result = [];
			let messageStartPosition = findObjectStartPosition(val0 ? val0 : bytes[0], position, bytes);
			let i = 0;

			console.log(findParam(messageStartPosition, 4 + i * 2, bytes, 1 ));
			result = result.concat(findParam(messageStartPosition, 4 + i * 2, bytes, 1));i++;

			console.log(findVector( messageStartPosition, 4 + i * 2, bytes, 1));
			console.log(convert.uint8ToHex(findVector(messageStartPosition, 4 + i * 2, bytes, 1)));
			result = result.concat(findVector(messageStartPosition, 4 + i * 2, bytes, 1));
			return result;
		}

		function tableArraySerialize(bytes, position, val0 = undefined) {
			let result = [];
			const arrayLength = findArrayLength(val0 ? val0 : bytes[0], position, bytes);
			for (let i = 0; i < arrayLength; ++i) {

				let startArrayPosition = findObjectArrayElementStartPosition(val0 ? val0 : bytes[0], position, bytes, i);
				let j=0;

				console.log(findVector( startArrayPosition, 4 + j * 2, bytes, 4));
				console.log(convert.uint8ToHex(findVector(startArrayPosition, 4 + j * 2, bytes, 4)));
				result = result.concat(findVector(startArrayPosition, 4 + j * 2, bytes, 4));j++;

				console.log(findVector( startArrayPosition, 4 + j * 2, bytes, 4));
				console.log(convert.uint8ToHex(findVector(startArrayPosition, 4 + j * 2, bytes, 4)));
				result = result.concat(findVector(startArrayPosition, 4 + j * 2, bytes, 4));j++;
			}
			return result;
		};

		function createVector(builder,size, data  , alignment,func) {
			builder.startVector(size, data.length, alignment);
			for (var i = data.length - 1; i >= 0; i--) {
				switch(func){
					case 'addOffset':builder.addOffset(data[i]);break;
					case 'addInt8'  :builder.addInt8(  data[i]);break;
					case 'addInt32' :builder.addInt32( data[i]);break;
				}
			}
			return builder.endVector();
		};


		function date_format(num) {
			return ( num < 10 ) ? '0' + num  : num;
		};

function dispTimeStamp(timeStamp){

		var NEM_EPOCH = Date.UTC(2016, 3, 1, 0, 0, 0, 0);
		var timestampNemesisBlock = 1459468800;

//		var d = new Date(timeStamp + timestampNemesisBlock * 1000);
		var d = new Date(timeStamp + NEM_EPOCH);
//		var strDate = d.getFullYear()%100
		var strDate = d.getFullYear()
			+ "-" + date_format( d.getMonth() + 1 )
			+ '-' + date_format( d.getDate() )
			+ ' ' + date_format( d.getHours() )
			+ ':' + date_format( d.getMinutes() )
			+ ':' + date_format( d.getSeconds() ) ;
		return 	strDate;
}

function dispPayload(payload,type){
	var plain_text = "";
	if(type == '1'){
		plain_text = "[encrypted]";

	}else if (payload && payload.length > 2 && payload[0] === 'f' && payload[1] === 'e') {
		plain_text = "HEX:" + payload;
		console.log("HEX: " + payload);
	}else{
		try {

			plain_text = escape_html(decodeURIComponent( escape(convert.hexToUtf8(payload))));

		} catch (e) {
			console.log(e);
			console.log('invalid text input: ' + payload);
		}
	}
	return plain_text;
}

function escape_html (string) {
	if(typeof string !== 'string') {
		return string;
	}
	return string.replace(/[&'`"<>]/g, function(match) { //'
		return {
			'&': '&amp;',
			"'": '&#x27;',
			'`': '&#x60;',
			'"': '&quot;',
			'<': '&lt;',
			'>': '&gt;',
		}[match]
	});
}

function getNodes(){

	var d = $.Deferred();
	$.ajax({url: "https://s3-ap-northeast-1.amazonaws.com/xembook.net/data/v4/node.json" ,type: 'GET',timeout: 1000}).then(
		function(res){
			var nodes;
			if(isHashAccess){
				nodes = res["catapult_test"];
			}else{
				nodes = res["catapult_test"];
			}
			d.resolve(nodes);
		},
		function(res){
			d.resolve(["13.114.200.132","40.90.163.78","52.194.207.217","40.90.163.32","47.107.245.217","18.228.92.190"]);
//			d.resolve(["cow.48gh23s.xyz"]);
//					d.resolve(["13.114.200.132","52.194.207.217","47.107.245.217"]);
//			d.resolve(["alice2.nem.ninja","alice99.nem.ninja"]);
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

function connectNodeToPut(nodes,query,txString){

	setTargetNode(nodes);
	var obj = {
		url: "http://" + targetNode + query ,
		type: 'PUT',
		contentType:'application/json',
		data: txString  ,
		error: function(XMLHttpRequest) {
			console.log( XMLHttpRequest.responseText);
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
		targetNode = nodes[Math.floor(Math.random() * nodes.length)] + ":3000";
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
			targetNode = nodes[Math.floor(Math.random() * nodes.length)] + ":3000";
			obj.url = "http://" + targetNode + query;
//			return connectNode2(nodes,query,obj)
//			.then(function(res){
//				d.resolve(res);
//			});
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

var postNemInfo = function(query,payload){

	let txString = JSON.stringify({payload});
	return getNodes()
	.then(function(nodes){
		return connectNodeToPost(nodes,query,txString);
	});
}

var putNemInfo = function(query,payload){

	let txString = JSON.stringify({'payload':payload});
	return getNodes()
	.then(function(nodes){
		return connectNodeToPut(nodes,query,txString);
	});
}

function aggregateSerialize(transfer){

	let xembook = require("/main.js");
	var builder = xembook.getFlatbuffers();

	console.log("transactions");
	console.log(transfer.transactions);

//	var builder = new flatbuffers.Builder(1);

	// Create vectors

//	const signatureVector = AggregateTransactionBuffer.createSignatureVector(builder, Array(...Array(64)).map(Number.prototype.valueOf, 0));
	const signatureVector = createVector(builder, 1,Array(...Array(64)).map(Number.prototype.valueOf, 0),1,'addInt8');
//	const signerVector = AggregateTransactionBuffer.createSignerVector(builder, Array(...Array(32)).map(Number.prototype.valueOf, 0));
	const signerVector    = createVector(builder, 4,Array(...Array(32)).map(Number.prototype.valueOf, 0),4,'addInt8');
//	const deadlineVector = AggregateTransactionBuffer.createDeadlineVector(builder, this.deadline);
	const deadlineVector  = createVector(builder, 4,transfer.deadline         ,4,'addInt32');
//	const feeVector = AggregateTransactionBuffer.createFeeVector(builder, this.fee);
	const feeVector       = createVector(builder, 4,transfer.fee      ,4,'addInt32');

//	const modificationsVector = AggregateTransactionBuffer.createTransactionsVector(builder, this.transactions);
	let modifications = [];
	for (let i = 0; i < transfer.transactions.length; ++i){
		modifications = modifications.concat(transfer.transactions[i]);
	}



	const modificationsVector = createVector(builder,1,modifications,1,'addInt8')

	console.log("modificationsVector");
	console.log(modificationsVector);

/*
	AggregateTransactionBuffer.startAggregateTransactionBuffer(builder);
	AggregateTransactionBuffer.addSize(builder, 120 + 4 + this.transactions.length);
	AggregateTransactionBuffer.addSignature(builder, signatureVector);
	AggregateTransactionBuffer.addSigner(builder, signerVector);
	AggregateTransactionBuffer.addVersion(builder, this.version);
	AggregateTransactionBuffer.addType(builder, this.type);
	AggregateTransactionBuffer.addFee(builder, feeVector);
	AggregateTransactionBuffer.addDeadline(builder, deadlineVector);
	AggregateTransactionBuffer.addTransactionsSize(builder, 0 !== this.transactions.length ? this.transactions.length : 4294967296);
	AggregateTransactionBuffer.addTransactions(builder, modificationsVector);
*/
	builder.startObject(9);
	builder.addFieldInt32(0, 120 + 4  + modifications.length, 0);
	builder.addFieldOffset(1, signatureVector, 0);
	builder.addFieldOffset(2, signerVector, 0);
	builder.addFieldInt16( 3, transfer.version, 0);
	builder.addFieldInt16( 4, transfer.type, 0);
	builder.addFieldOffset(5, feeVector, 0);
	builder.addFieldOffset(6, deadlineVector, 0);//////
	builder.addFieldInt32(7, 0 !== modifications.length ? modifications.length : 4294967296, 0);//////
	builder.addFieldOffset(8, modificationsVector, 0);//////
	const codedAggregate = builder.endObject();

	// Calculate size
	builder.finish(codedAggregate);
	bytes = builder.asUint8Array();

	let i = 0;
	let resultBytes = [];
	let buffer = Array.from(bytes);

	console.log("size");
	console.log(findParam( buffer[0], 4 + (i * 2), buffer, 4));
	console.log(convert.uint8ToHex(findParam( buffer[0], 4 + (i * 2), buffer, 4)));
	resultBytes = resultBytes.concat(findParam( buffer[0], 4 + (i * 2), buffer, 4));i++;//uint('size'),


	console.log("signature");
	console.log(findVector( buffer[0], 4 + (i * 2), buffer, 1));
	console.log(convert.uint8ToHex(findVector( buffer[0], 4 + (i * 2), buffer, 1)));
	resultBytes = resultBytes.concat(findVector(buffer[0], 4 + (i * 2), buffer, 1));i++;//array('signature')


	console.log("signer");
	console.log(findVector( buffer[0], 4 + (i * 2), buffer, 1));
	console.log(convert.uint8ToHex(findVector( buffer[0], 4 + (i * 2), buffer, 1)));
	resultBytes = resultBytes.concat(findVector(buffer[0], 4 + (i * 2), buffer, 1));i++;//array('signer')


	console.log("version");
	console.log(findParam( buffer[0], 4 + (i * 2), buffer, 2));
	console.log(convert.uint8ToHex(findParam( buffer[0], 4 + (i * 2), buffer, 2)));
	resultBytes = resultBytes.concat(findParam( buffer[0], 4 + (i * 2), buffer, 2));i++;//ushort('version')


	console.log("type");
	console.log(findParam( buffer[0], 4 + (i * 2), buffer, 2));
	console.log(convert.uint8ToHex(findParam( buffer[0], 4 + (i * 2), buffer, 2)));
	resultBytes = resultBytes.concat(findParam( buffer[0], 4 + (i * 2), buffer, 2));i++;//ushort('type'),

	console.log("fee");
	console.log(findVector( buffer[0], 4 + (i * 2), buffer, 4));
	console.log(convert.uint8ToHex(findVector( buffer[0], 4 + (i * 2), buffer, 4)));
	resultBytes = resultBytes.concat(findVector(buffer[0], 4 + (i * 2), buffer, 4));i++;//array('fee', TypeSize.INT),

	console.log("deadline");
	console.log(findVector( buffer[0], 4 + (i * 2), buffer, 4));
	console.log(convert.uint8ToHex(findVector( buffer[0], 4 + (i * 2), buffer, 4)));
	resultBytes = resultBytes.concat(findVector(buffer[0], 4 + (i * 2), buffer, 4));i++;//array('deadline', TypeSize.INT)

	console.log("transactionsSize");
	console.log(findParam( buffer[0], 4 + (i * 2), buffer, 4));
	console.log(convert.uint8ToHex(findParam( buffer[0], 4 + (i * 2), buffer, 4)));
	resultBytes = resultBytes.concat(findParam( buffer[0], 4 + (i * 2), buffer, 4));i++;//uint('transactionsSize'),


	console.log("transactions");
	console.log(findVector( buffer[0], 4 + (i * 2), buffer, 1));
	console.log(convert.uint8ToHex(findVector( buffer[0], 4 + (i * 2), buffer, 1)));
	resultBytes = resultBytes.concat(findVector(buffer[0], 4 + (i * 2), buffer, 1));i++;//array('transactions')




	return resultBytes;



}
function serialize(transfer){

	let xembook = require("/main.js");
	var builder = xembook.getFlatbuffers();

	// Create message
	const bytePayload = convert.hexToUint8(convert.utf8ToHex(transfer.message.payload));
	const payload = createVector(builder, 1,bytePayload,1,'addInt8');

	builder.startObject(2);
	builder.addFieldInt8(0, transfer.message.type, 0);
	builder.addFieldOffset(1, payload, 0);
	const message = builder.endObject();

	// Create mosaics
	const mosaics = [];
	transfer.mosaics.forEach(mosaic => {
		const id     = createVector(builder, 4,mosaic.id    ,4,'addInt32');
		const amount = createVector(builder, 4,mosaic.amount,4,'addInt32');
		builder.startObject(2);
		builder.addFieldOffset(0, id, 0);
		builder.addFieldOffset(1, amount, 0);
		mosaics.push(builder.endObject());
	});

	const feeVector       = createVector(builder, 4,transfer.fee      ,4,'addInt32');
	const mosaicsVector   = createVector(builder, 4,mosaics           ,4,'addOffset');
	const signerVector    = createVector(builder, 4,Array(...Array(32)).map(Number.prototype.valueOf, 0),4,'addInt8');
	const deadlineVector  = createVector(builder, 4,transfer.deadline         ,4,'addInt32');
	console.log("transfer.recipient");
	console.log(transfer.recipient);
	const recipientVector = createVector(builder, 1,stringToAddress(transfer.recipient),1,'addInt8');
	const signatureVector = createVector(builder, 1,Array(...Array(64)).map(Number.prototype.valueOf, 0),1,'addInt8');

	builder.startObject(12);
	builder.addFieldInt32(0, 149 + (16 * transfer.mosaics.length) + bytePayload.length, 0);
	builder.addFieldOffset(1, signatureVector, 0);
	builder.addFieldOffset(2, signerVector, 0);
	builder.addFieldInt16( 3, transfer.version, 0);
	builder.addFieldInt16( 4, transfer.type, 0);
	builder.addFieldOffset(5, feeVector, 0);
	builder.addFieldOffset(6, deadlineVector, 0);//////
	builder.addFieldOffset(7, recipientVector, 0);
	builder.addFieldInt16( 8, bytePayload.length + 1, 0);
	builder.addFieldInt8(  9, transfer.mosaics.length, 0);
	builder.addFieldOffset(10, message, 0);
	builder.addFieldOffset(11, mosaicsVector, 0);
	const codedTransfer = builder.endObject();

	builder.finish(codedTransfer);
	bytes = builder.asUint8Array();


	let i = 0;
	let resultBytes = [];
	let buffer = Array.from(bytes);
	console.log("size");
	console.log(findParam( buffer[0], 4 + (i * 2), buffer, 4));
	console.log(convert.uint8ToHex(findParam( buffer[0], 4 + (i * 2), buffer, 4)));
	resultBytes = resultBytes.concat(findParam( buffer[0], 4 + (i * 2), buffer, 4));i++;//uint('size'),
	console.log("signature");
	console.log(findVector( buffer[0], 4 + (i * 2), buffer, 1));
	console.log(convert.uint8ToHex(findVector( buffer[0], 4 + (i * 2), buffer, 1)));
	resultBytes = resultBytes.concat(findVector(buffer[0], 4 + (i * 2), buffer, 1));i++;//array('signature')

	console.log("signer");
	console.log(findVector( buffer[0], 4 + (i * 2), buffer, 1));
	console.log(convert.uint8ToHex(findVector( buffer[0], 4 + (i * 2), buffer, 1)));
	resultBytes = resultBytes.concat(findVector(buffer[0], 4 + (i * 2), buffer, 1));i++;//array('signer')

	console.log("version");
	console.log(findParam( buffer[0], 4 + (i * 2), buffer, 2));
	console.log(convert.uint8ToHex(findParam( buffer[0], 4 + (i * 2), buffer, 2)));
	resultBytes = resultBytes.concat(findParam( buffer[0], 4 + (i * 2), buffer, 2));i++;//ushort('version')

	console.log("type");
	console.log(findParam( buffer[0], 4 + (i * 2), buffer, 2));
	console.log(convert.uint8ToHex(findParam( buffer[0], 4 + (i * 2), buffer, 2)));
	resultBytes = resultBytes.concat(findParam( buffer[0], 4 + (i * 2), buffer, 2));i++;//ushort('type'),

	console.log("fee");
	console.log(findVector( buffer[0], 4 + (i * 2), buffer, 4));
	console.log(convert.uint8ToHex(findVector( buffer[0], 4 + (i * 2), buffer, 4)));
	resultBytes = resultBytes.concat(findVector(buffer[0], 4 + (i * 2), buffer, 4));i++;//array('fee', TypeSize.INT),

	console.log("deadline");
	console.log(findVector( buffer[0], 4 + (i * 2), buffer, 4));
	console.log(convert.uint8ToHex(findVector( buffer[0], 4 + (i * 2), buffer, 4)));
	resultBytes = resultBytes.concat(findVector(buffer[0], 4 + (i * 2), buffer, 4));i++;//array('deadline', TypeSize.INT)


	console.log("recipient");
	console.log(findVector( buffer[0], 4 + (i * 2), buffer, 1));
	console.log(convert.uint8ToHex(findVector( buffer[0], 4 + (i * 2), buffer, 1)));
	resultBytes = resultBytes.concat(findVector(buffer[0], 4 + (i * 2), buffer, 1));i++;//array('recipient')

	console.log("recipient");
	console.log(findParam( buffer[0], 4 + (i * 2), buffer, 2));
	console.log(convert.uint8ToHex(findParam( buffer[0], 4 + (i * 2), buffer, 2)));
	resultBytes = resultBytes.concat(findParam( buffer[0], 4 + (i * 2), buffer, 2));i++;//ushort('messageSize')

	console.log("numMosaics");
	console.log(findParam( buffer[0], 4 + (i * 2), buffer, 1));
	console.log(convert.uint8ToHex(findParam( buffer[0], 4 + (i * 2), buffer, 1)));
	resultBytes = resultBytes.concat(findParam( buffer[0], 4 + (i * 2), buffer, 1));i++;//ubyte('numMosaics')

	console.log("message");
	resultBytes = resultBytes.concat(tableSerialize(     buffer, 4 + (i * 2)));i++;//table('message', [ubyte('type'),array('payload')]),

	console.log("mosaics");
	resultBytes = resultBytes.concat(tableArraySerialize(buffer, 4 + (i * 2)));i++;//tableArray('mosaics', [array('id', TypeSize.INT),array('amount', TypeSize.INT)])

	return resultBytes;
}

function signTransaction(keyPair,byteBuffer) {

	const signingBytes = byteBuffer.slice(4 + 64 + 32);
	//console.log(hashKey);
	console.log(keyPair.privateKey);

	const keyPairEncoded = KeyPair.createKeyPairFromPrivateKeyString(convert.uint8ToHex(keyPair.privateKey));
	const signature = Array.from(catapult.crypto.sign( new Uint8Array(signingBytes),keyPair.publicKey, keyPair.privateKey,catapult.hash.createHasher()));
	const signedTransactionBuffer = byteBuffer
		.splice(0, 4)
		.concat(signature)
		.concat(Array.from(keyPairEncoded.publicKey))
		.concat(byteBuffer.splice(64 + 32, byteBuffer.length));
	const payload = convert.uint8ToHex(signedTransactionBuffer);

	return {
		payload,
		hash: createTransactionHash(payload)
	};
}

function toAggregateTransaction(resultBytes,_signer) {

	resultBytes.splice(0, 4 + 64 + 32);// 0,100

	resultBytes = Array.from(_signer).concat(resultBytes);
	resultBytes.splice(32 + 2 + 2, 16); //deadlineと手数料を削る
	console.log(convert.uint8ToHex(resultBytes))
	return Array.from((new Uint8Array([
		(resultBytes.length + 4 & 0x000000ff),
		(resultBytes.length + 4 & 0x0000ff00) >> 8,
		(resultBytes.length + 4 & 0x00ff0000) >> 16,
		(resultBytes.length + 4 & 0xff000000) >> 24
	]))).concat(resultBytes);
}
