// synopsis: Plutus core deserializer
// author: Christian Schmitz
// email: cschmitz398@gmail.com
// example usage: 
//   PCD.deserializePlutusCoreCborHexString(<string>) -> string

var PCD = PCD || {};

(function(ns) {
	const VERSIONS = {
		"11.22.33": { // dummy version from example in plutus-core-spec document
			widths: {
				term:      4,
				type:      3,
				constType: 4,
				builtin:   5, // later becomes 7
				constant:  4,
				kind:      1,
			},
			builtins: [
				"addInteger",
				"subtractInteger",
				"multiplyInteger",
				"divideInteger",
				"remainderInteger",
				"lessThanInteger",
				"lessThanEqInteger",
				"greaterThanInteger",
				"greaterThanEqInteger",
				"eqInteger",
				"concatenate",
				"takeByteString",
				"dropByteString",
				"sha2_256",
				"sha3_256",
				"verifySignature",
				"eqByteString",
				"quotientInteger",
				"modInteger",
				"ltByteString",
				"gtByteString",
				"ifThenElse",
				"charToString",
				"append",
				"trace",
			],
		},
		"1.0.0": { // real-world version of plutus-core
			widths: {
				term:      4,
				type:      3,
				constType: 4, 
				builtin:   7,
				constant:  4,
				kind:      1,
			},
			builtins: [
				"addInteger", // 0
				"subtractInteger",
				"multiplyInteger",
				"divideInteger",
				"quotientInteger",
				"remainderInteger",
				"modInteger",
				"equalsInteger",
				"lessThanInteger",
				"lessThanEqualsInteger",
				"appendByteString", // 10
				"consByteString",
				"sliceByteString",
				"lengthOfByteString",
				"indexByteString",
				"equalsByteString",
				"lessThanByteString",
				"lessThanEqualsByteString",
				"sha2_256",
				"sha3_256",
				"blake2b_256", // 20
				"verifySignature",
				"appendString",
				"equalsString",
				"encodeUtf8",
				"decodeUtf8",
				"ifThenElse",
				"chooseUnit",
				"trace",
				"fstPair",
				"sndPair", // 30
				"chooseList",
				"mkCons",
				"headList",
				"tailList",
				"nullList",
				"chooseData",
				"constrData",
				"mapData",
				"listData",
				"iData", // 40
				"bData",
				"unConstrData",
				"unMapData",
				"unListData",
				"unIData",
				"unBData",
				"equalsData",
				"mkPairData",
				"mkNilData",
				"mkNilPairData", // 50
				"serialiseData",
				"verifyEcdsaSecp256k1Signature",
				"verifySchnorrSecp256k1Signature",
			],
		},
	};


	////////////////////
	// utility functions
	////////////////////

	// integer division
	// assumes a and b are whole numbers
	function idiv(a, b) {
		return Math.floor(a/b);
		// alternatively: (a - a%b)/b
	}

	// 2^p for bigints
	function pow2(p) {
		return (p <= 0n) ? 1n : 2n<<(p-1n);
	}

	const MASKS = [
		0b11111111,
		0b01111111,
		0b00111111,
		0b00011111,
		0b00001111,
		0b00000111,
		0b00000011,
		0b00000001,
	];

	function byteToBitString(b, n = 8) {
		let s = b.toString(2);

		if (s.length < n) {
			s = (new Array(n - s.length)).fill('0').join('') + s;
		}

		s = "0b" + s;

		return s;
	}

	function imask(b, i0, i1) {
		assert(i0 < i1);

		// mask with 0 from 

		return (b & MASKS[i0]) >> (8 - i1);
	}

	// hex: string
	// return value: list of integers
	function assert(cond, msg = "unexpected") {
		if (!cond) {
			throw new Error(msg);
		}
	};

	function assertDefined(val, msg = "unexpected undefined value") {
		if (val == undefined) {
			throw new Error(msg);
		}

		return val;
	};

	function hexToBytes(hex) {
		let bytes = [];

		for (let i = 0; i < hex.length; i += 2) {
			bytes.push(parseInt(hex.substr(i, 2), 16));
		}

		return bytes;
	};

	// Very rudimentary cbor parser which unwraps the cbor text envelopes of the example scripts 
	// in github.com/chris-moreton/plutus-scripts and github.com/input-output-hk/plutus-apps
	// This function unwraps one level, so must be called twice 
	//  (for some reason the text envelopes is cbor wrapped in cbor)
	function unwrapPlutusCoreCbor(bytes) { 
		if (bytes == null || bytes == undefined || bytes.length == 0) {
			throw new Error("expected at least one cbor byte");
		}

		let tag = assertDefined(bytes.shift());

		switch(tag) {
			case 0x4d:
			case 0x4e:
				return bytes;
			case 0x58: {
				// byte array
				let n = assertDefined(bytes.shift());

				assert(n == bytes.length, "bad or unhandled cbor encoding");

				return bytes;
			}
			case 0x59: {
				let n = assertDefined(bytes.shift())*256 + assertDefined(bytes.shift());

				assert(n == bytes.length, "bad or unhandled cbor encoding");

				return bytes;
			}
			default:
				throw new Error("unhandled cbor tag 0x" + tag.toString(16));
		}
	}


	////////////////////////
	// Primitive value types
	////////////////////////

	class Integer {
		// value is BigInt, which is supposed to be arbitrary precision
		constructor(value, signed = false) {
			this.value_  = value;
			this.signed_ = signed;
		}

		static parseRawByte(b) {
			return b & 0b01111111;
		}

		static rawByteIsLast(b) {
			return (b & 0b10000000) == 0;
		}


		static bytesToBigInt(bytes) {
			let value = BigInt(0);

			let n = bytes.length;

			for (let i = 0; i < n; i++) {
				let b = bytes[i];

				// 7 (not 8), because leading bit isn't used here
				value = value + BigInt(b)*pow2(BigInt(i)*7n);
			}

			return value;
		};

		// apply zigzag encoding
		toUnsigned() {
			if (this.signed_) {
				if (this.value_ < 0n) {
					return new Integer(1n - this.value_*2n, false);
				} else {
					return new Integer(this.value_*2n, false);
				}
			} else {
				return this;
			}
		}

		// unapply zigZag encoding
		toSigned() {
			if (this.signed_) {
				return this;
			} else {
				if (this.value_%2n == 0n) {
					return new Integer(this.value_/2n, true);
				} else {
					return new Integer(-(this.value_+1n)/2n, true);
				}
			}
		}

		toString() {
			return this.value_.toString();
	    }
	};

	class PlutusCoreString {
		constructor(value, encoding = 'ascii') {
			this.value_ = value;
			this.encoding_ = encoding;
		}

		toString() {
			return "\"" + this.value_ + "\"";
		}
	};

	class Unit {
		constructor() {
		}

		toString() {
			return "()";
		}
	};

	class Bool {
		constructor(value) {
			this.value_ = value;
		}

		toString() {
			return this.value_ ? "true" : "false";
		}
	};


	////////
	// Terms
	////////

	class Term {
		constructor(type) {
			this.type_ = type;
		}

		toString() {
			return "(Term " + this.type_.toString() + ")";
		}
	};

	class Variable extends Term {
		// TODO: generate globally unique names from the DeBruijn indices
		constructor(name) {
			super(0);
			this.name_ = name;
		}

		toString() {
			return "x" + this.name_.toString();
		}
	};

	class Delay extends Term {
		constructor(expr) {
			super(1);
			this.expr_ = expr;
		}

		toString() {
			return "(delay " + this.expr_.toString() + ")";
		}
	};

	class Lambda extends Term {
		constructor(rhs) {
			super(2);
			this.rhs_  = rhs;
		}

		toString() {
			return "(\u039b " + this.rhs_.toString() + ")";
		}
	};

	class Application extends Term {
		constructor(a, b) {
			super(3);
			this.a_ = a;
			this.b_ = b;
		}

		toString() {
			return "[" + this.a_.toString() + " " + this.b_.toString() + "]";
		}
	};

	class Force extends Term {
		constructor(expr) {
			super(5);
			this.expr_ = expr;
		}

		toString() {
			return "(force " + this.expr_.toString() + ")";
		}
	};

	// Error is already used by builtin javascript class
	class PlutusError extends Term {
		constructor() {
			super(6);
		}

		toString() {
			return "(error)";
		}
	};

	class Builtin extends Term {
		constructor(name) {
			super(7);
			this.name_ = name;
		}

		toString() {
			return "(builtin " + this.name_ + ")";
		}
	};

	class Program {
		constructor(version, expr) {
			this.version_ = version;
			this.expr_    = expr;
		}

		toString(pretty = true) {
			return "(program " + 
				this.version_.map(v => v.toString()).join(".") + " " + 
				this.expr_.toString() + ")";
		}
	};


	///////////////////
	// Parser singleton
	///////////////////

	class Reader {
		constructor(bytes, version = "1.0.0") {
			this.view_    = new Uint8Array(bytes);
			this.pos_     = 0; // bit position, not byte position
			this.version_ = version;
		}

		tagWidth(category) {
			assert(category in VERSIONS[this.version_].widths, "unknown tag category " + category.toString());

			return VERSIONS[this.version_].widths[category];
		}

		builtinName(id) {
			let all = VERSIONS[this.version_].builtins;

			assert(id >= 0 && id < all.length, "builtin id " + id.toString() + " out of range");

			return all[id];
		}

		eof() {
			return idiv(this.pos_, 8) >= this.view_.length;
		}

		// n is number of bits to be read
		readBits(n) {
			assert(n <= 8, "reading more than 1 byte");
			assert(this.pos_ + n <= this.view_.length*8, "eof");

			// it is assumed we don't need to be at the byte boundary

			let res =  0;
			let i0  = this.pos_;
			let old = this.pos_;

			for (let i = this.pos_ + 1; i <= this.pos_ + n; i++) {
				if (i%8 == 0) {
					let nPart = i - i0;

					res += imask(this.view_[idiv(i, 8)-1], i0%8, 8) << (n - nPart);

					i0 = i;
				} else if (i == this.pos_ + n) {
					res += imask(this.view_[idiv(i, 8)], i0%8, i%8);
				}
			}

			this.pos_ += n;

			return res;
		}

		moveToByteBoundary() {
			if (this.pos_%8 != 0) {
				let n = 8 - this.pos_%8;

				let b = this.readBits(n);
			}
		}

		readByte() {
			return this.readBits(8);
		}

		readLinkedList(elemSize) {
			// Cons and Nil constructors come from Lisp/Haskell
			//  cons 'a' creates a linked list node,
			//  nil      creates an empty linked list
			let nilOrCons = this.readBits(1);

			if (nilOrCons == 0) {
				return [];
			} else {
				return [this.readBits(elemSize)].concat(this.readLinkedList(elemSize));
			}
		}

		dumpRemainingBits() {
			if (!this.eof()) {
				console.log("remaining bytes:");
				for (let first = true, i = idiv(this.pos_, 8); i < this.view_.length; first = false, i++) {
					if (first && this.pos_%8 != 0) {
						console.log(byteToBitString(imask(this.view_[i], this.pos_%8, 8) << 8 - this.pos%7));
					} else {
						console.log(byteToBitString(this.view_[i]));
					}
				}
			} else {
				console.log("eof");
			}
		}

		readTerm() {
			let tag = this.readBits(this.tagWidth("term"));

			switch(tag) {
				case 0:
					return this.readVariable();
				case 1:
					return this.readDelay();
				case 2:
					return this.readLambda();
				case 3:
					return this.readApplication();
				case 4:
					return this.readConstant();
				case 5:
					return this.readForce();
				case 6:
					return new PlutusError();
				case 7:
					return this.readBuiltin();
				default:
					throw new Error("term tag " + tag.toString() + " unhandled");
			}
		}

		readTypeList() {
			return this.readLinkedList(this.tagWidth("constType"));
		}

		readConstant() {
			let typeList = this.readTypeList();

			let res = this.readTypedConstant(typeList);

			assert(typeList.length == 0);

			return res;
		}

		readInteger(signed = false) {
			let bytes = [];

			let b = this.readByte();
			bytes.push(b);

			while (!Integer.rawByteIsLast(b)) {
				b = this.readByte();
				bytes.push(b);
			}

			// strip the leading bit
			let res = new Integer(Integer.bytesToBigInt(bytes.map(b => Integer.parseRawByte(b))));

			if (signed) {
				res = res.toSigned();
			}

			return res;
		}

		readVariable() {
			let name = this.readInteger()

			return new Variable(name);
		}

		readLambda() {
			let rhs  = this.readTerm();

			return new Lambda(rhs);
		}

		readApplication() {
			let a = this.readTerm();
			let b = this.readTerm();

			return new Application(a, b);
		}

		readDelay() {
			let expr = this.readTerm();

			return new Force(expr);
		}

		readForce() {
			let expr = this.readTerm();

			return new Force(expr);
		}

		readBuiltin() {
			let id = this.readBits(this.tagWidth("builtin"));

			let name = this.builtinName(id);

			return new Builtin(name);
		}

		readTypedConstant(typeList) {
			let type = assertDefined(typeList.shift());

			let res;

			assert(typeList.length == 0, "recursive types not yet handled");

			switch(type) {
				case 0: // signed Integer
					res = this.readInteger(true);
					break;
				case 1: // bytestring
					res = this.readByteString();
					break;
				case 2: // utf8-string
					res = this.readUtf8String();
					break;
				case 3:
					res = new Unit(); // no reading needed
					break;
				case 4: // Bool
					res = new Bool(this.readBits(1) == 1);
					break;
				default:
					throw new Error("unhandled constant type " + type.toString());
			}

			return res;
		}

		readChars() {
			this.moveToByteBoundary();

			let bytes = [];

			let n = this.readByte();

			for (let i = 0; i < n; i++) {
				bytes.push(this.readByte());
			}

			assert(this.readByte() == 0, "expected final byte of bytestring to be 0");

			return bytes;
		}

		// how I assumed byteString would be implemented
		readByteString_() {
			let bytes = [];

			let b = this.readByte();
			bytes.push(Integer.parseRawByte(b));

			while (!Integer.rawByteIsLast(b)) {
				b = this.readByte();
				bytes.push(Integer.parseRawByte(b));
			}

			return new ByteString(bytes.map(b => String.fromCharCode(b)).join(''));
		}

		// how byteString is really implemented
		readByteString() {
			let bytes = this.readChars();

			return new PlutusCoreString(bytes.map(b => String.fromCharCode(b)).join(''), "ascii");
		}

		readUtf8String() {
			let bytes = this.readChars();

			let s = (new TextDecoder()).decode((new Uint8Array(bytes)).buffer);

			return new PlutusCoreString(s, "utf8");
		}

		finalize() {
			this.moveToByteBoundary();
			//this.dumpRemainingBits();
		}
	};

	// arg 1: list of (unsigned) integers
	// return value: a Program instance
	function deserializePlutusCoreBytes(bytes) {
		let reader = new Reader(bytes, "1.0.0");

		//reader.dumpRemainingBits();

		let version = [
			reader.readInteger(),
			reader.readInteger(),
			reader.readInteger(),
		];

		let versionKey = version.map(v => v.toString()).join(".");

		assert(versionKey in VERSIONS, "unsupported plutus-core version: " + versionKey);

		let expr = reader.readTerm();

		reader.finalize();

		return new Program(version, expr);
	};


	/////////////////////////////////////////
	// Deserialization and analysis functions
	/////////////////////////////////////////

	function deserializePlutusCoreCborBytes(cborBytes) {
		// expects a double nested cbor list (so called 'text-envelope' format)
		let data = unwrapPlutusCoreCbor(unwrapPlutusCoreCbor(cborBytes));

		return deserializePlutusCoreBytes(data);
	};

	function deserializePlutusCoreCborHexString(hexString) {
		return deserializePlutusCoreCborBytes(hexToBytes(hexString));
	};

	function dumpPlutusCoreCborBytes(cborBytes) {
		let data = unwrapPlutusCoreCbor(unwrapPlutusCoreCbor(cborBytes));

		let chars = [];
		for (let b of data) {
			if (b >= 32 && b <= 126) {
				chars.push(String.fromCharCode(b));
			}
		}

		console.log(chars.join(''));
	};

	function dumpPlutusCoreCborHexString(hexString) {
		return dumpPlutusCoreCborBytes(hexToBytes(hexString));
	};


	//////////
	// exports
	//////////
	export_ = function(obj) {
		ns[obj.name] = obj; // both classes and functions have names
	};

	export_(Program);
	export_(deserializePlutusCoreBytes);
	export_(deserializePlutusCoreCborBytes);
	export_(deserializePlutusCoreCborHexString);
	export_(dumpPlutusCoreCborBytes);
	export_(dumpPlutusCoreCborHexString);
})(PCD);
