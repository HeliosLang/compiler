//@ts-check
// Tx types

import {
    STRICT_BABBAGE
} from "./constants.js";

import {
    assert,
    assertDefined,
    bytesToHex,
    eq,
    hexToBytes
} from "./utils.js";

import {
    Site,
    UserError
} from "./tokens.js";

import {
    Crypto
} from "./crypto.js";

import {
    CborData
} from "./cbor.js";

import {
    ByteArrayData,
    ConstrData,
    IntData,
    ListData,
    MapData,
    UplcData
} from "./uplc-data.js";

import {
	Address,
	Assets,
    DatumHash,
    MintingPolicyHash,
    PubKeyHash,
    StakeKeyHash,
    StakingValidatorHash,
    TxId,
	Value
} from "./helios-data.js";

/**
 * @typedef {import("./uplc-costmodels.js").Cost} Cost
 */

import {
    Hash
} from "./helios-data.js";

import {
    NetworkParams
} from "./uplc-costmodels.js";

import {
    UplcDataValue
} from "./uplc-ast.js";

import {
    UplcProgram
} from "./uplc-program.js";

export class Tx extends CborData {
	/**
	 * @type {TxBody}
	 */
	#body;

	/**
	 * @type {TxWitnesses}
	 */
	#witnesses;

	/**
	 * @type {boolean}
	 */
	#valid;

	/** 
	 * @type {?TxMetadata} 
	 */
	#metadata;

	// the following field(s) aren't used by the serialization (only for building)
	/**
	 * Upon finalization the slot is calculated and stored in the body
	 * @type {?Date} 
	 */
	#validTo;

	/**
	 * Upon finalization the slot is calculated and stored in the body 
	 *  @type {?Date} 
	 */
	#validFrom;

	constructor() {
		super();
		this.#body = new TxBody();
		this.#witnesses = new TxWitnesses();
		this.#valid = false; // building is only possible if valid==false
		this.#metadata = null;
		this.#validTo = null;
		this.#validFrom = null;
	}

	/**
	 * @type {TxBody}
	 */
	get body() {
		return this.#body;
	}

	/**
	 * @type {number[]}
	 */
	get bodyHash() {
		return Crypto.blake2b(this.#body.toCbor());
	}

	/**
	 * @type {TxWitnesses}
	 */
	get witnesses() {
		return this.#witnesses;
	}

	/**
	 * Used by emulator to check if tx is valid.
	 * @param {bigint} slot
	 * @returns {boolean}
	 */
	isValid(slot) {
		if (!this.#valid) {
			return false;
		} else {
			return this.#body.isValid(slot);
		}
	}

	/** 
	 * @returns {number[]}
	 */
	toCbor() {
		return CborData.encodeTuple([
			this.#body.toCbor(),
			this.#witnesses.toCbor(),
			CborData.encodeBool(this.#valid),
			this.#metadata === null ? CborData.encodeNull() : this.#metadata.toCbor(),
		]);
	}

	/**
	 * @param {number[]} bytes 
	 * @returns {Tx}
	 */
	static fromCbor(bytes) {
		bytes = bytes.slice();

		let tx = new Tx();

		let n = CborData.decodeTuple(bytes, (i, fieldBytes) => {
			switch(i) {
				case 0:
					tx.#body = TxBody.fromCbor(fieldBytes);
					break;
				case 1:
					tx.#witnesses = TxWitnesses.fromCbor(fieldBytes);
					break;
				case 2:
					tx.#valid = CborData.decodeBool(fieldBytes);
					break;
				case 3:
					if (CborData.isNull(fieldBytes)) {
						CborData.decodeNull(fieldBytes);

						tx.#metadata = null;
					} else {
						tx.#metadata = TxMetadata.fromCbor(fieldBytes);
					}
					break;
				default:
					throw new Error("bad tuple size");
			}
		});

		assert(n == 4);
		assert(bytes.length == 0);

		return tx;
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		return {
			body: this.#body.dump(),
			witnesses: this.#witnesses.dump(),
			valid: this.#valid,
			metadata: this.#metadata !== null ? this.#metadata.dump() : null
		};
	}

	/**
	 * @param {Date} t
	 * @returns {Tx}
	 */
	validFrom(t) {
		assert(!this.#valid);

		this.#validFrom = t;

		return this;
	}

	/**
	 * @param {Date} t
	 * @returns {Tx}
	 */
	validTo(t) {
		assert(!this.#valid);

		this.#validTo = t;

		return this;
	}

	/**
	 * Throws error if assets of given mph are already being minted in this transaction
	 * @param {MintingPolicyHash} mph 
	 * @param {[number[] | string, bigint][]} tokens - list of pairs of [tokenName, quantity], tokenName can be list of bytes or hex-string
	 * @param {UplcDataValue | UplcData} redeemer
	 * @returns {Tx}
	 */
	mintTokens(mph, tokens, redeemer) {
		assert(!this.#valid);

		this.#body.addMint(mph, tokens.map(([name, amount]) => {
			if (typeof name == "string" ) {
				return [hexToBytes(name), amount];
			} else {
				return [name, amount];
			}
		}));

		this.#witnesses.addMintingRedeemer(mph, UplcDataValue.unwrap(redeemer));

		return this;
	}

	/**
	 * @param {UTxO} input
	 * @param {?(UplcDataValue | UplcData)} redeemer
	 * @returns {Tx}
	 */
	addInput(input, redeemer = null) {
		assert(!this.#valid);

		if (input.origOutput === null) {
			throw new Error("TxInput.origOutput must be set when building transaction");
		} else {
			void this.#body.addInput(input.asTxInput);

			if (redeemer !== null) {
				assert(input.origOutput.address.validatorHash !== null, "input isn't locked by a script");

				this.#witnesses.addSpendingRedeemer(input.asTxInput, UplcDataValue.unwrap(redeemer));

				if (input.origOutput.datum === null) {
					throw new Error("expected non-null datum");
				} else {
					let datum = input.origOutput.datum;

					if (datum instanceof HashedDatum) {
						let datumData = datum.data;
						if (datumData === null) {
							throw new Error("expected non-null datum data");
						} else {
							this.#witnesses.addDatumData(datumData);
						}
					}
				}
			} else {
				assert(input.origOutput.address.pubKeyHash !== null, "input is locked by a script, but redeemer isn't specified");
			}
		}

		return this;
	}

	/**
	 * @param {UTxO[]} inputs
	 * @param {?(UplcDataValue | UplcData)} redeemer
	 * @returns {Tx}
	 */
	addInputs(inputs, redeemer = null) {
		for (let input of inputs) {
			this.addInput(input, redeemer);
		}

		return this;
	}

	/**
	 * @param {TxRefInput} input
	 * @param {?UplcProgram} refScript
	 * @returns {Tx}
	 */
	addRefInput(input, refScript = null) {
		assert(!this.#valid);

		this.#body.addRefInput(input);

		if (refScript !== null) {
			this.#witnesses.attachScript(refScript, true);
		}

		return this;
	}

	/**
	 * @param {TxRefInput[]} inputs
	 * @returns {Tx}
	 */
	addRefInputs(inputs) {
		for (let input of inputs) {
			this.addRefInput(input);
		}

		return this;
	}

	/**
	 * @param {TxOutput} output 
	 * @returns {Tx}
	 */
	addOutput(output) {
		assert(!this.#valid);
		
		// min lovelace is checked during build, because 
		this.#body.addOutput(output);

		return this;
	}

	/**
	 * @param {TxOutput[]} outputs 
	 * @returns {Tx}
	 */
	addOutputs(outputs) {
		for (let output of outputs) {
			this.addOutput(output);
		}

		return this;
	}

	/**
	 * @param {PubKeyHash} hash
	 * @returns {Tx}
	 */
	addSigner(hash) {
		assert(!this.#valid);

		this.#body.addSigner(hash);

		return this;
	}

	/**
	 * Unused scripts are detected during finalize(), in which case an error is thrown
	 * Throws error if script was already added before
	 * @param {UplcProgram} program
	 * @returns {Tx}
	 */
	attachScript(program) {
		assert(!this.#valid);

		this.#witnesses.attachScript(program);

		return this;
	}

	/**
	 * Usually adding only one collateral input is enough
	 * Must be less than the limit in networkParams (eg. 3), or else an error is thrown during finalization
	 * @param {UTxO} input 
	 * @returns {Tx}
	 */
	addCollateral(input) {
		assert(!this.#valid);

		this.#body.addCollateral(input.asTxInput);

		return this;
	}

	/**
	 * Calculates tx fee (including script execution)
	 * Shouldn't be used directly
	 * @param {NetworkParams} networkParams
	 * @returns {bigint}
	 */
	estimateFee(networkParams) {
		let [a, b] = networkParams.txFeeParams;

		if (!this.#valid) {
			// add dummy signatures
			let nUniquePubKeyHashes = this.#body.countUniqueSigners();
			
			this.#witnesses.addDummySignatures(nUniquePubKeyHashes);
		}

		let size = this.toCbor().length;

		if (!this.#valid) {
			// clean up the dummy signatures
			this.#witnesses.removeDummySignatures();
		}

		let sizeFee = BigInt(a) + BigInt(size)*BigInt(b);

		let exFee = this.#witnesses.estimateFee(networkParams);

		return sizeFee + exFee;
	}

	/**
	 * Iterates until fee is exact
	 * Shouldn't be used directly
	 * @param {NetworkParams} networkParams
	 * @param {bigint} fee
	 * @returns {bigint}
	 */
	setFee(networkParams, fee) {
		let oldFee = this.#body.fee;

		while (oldFee != fee) {
			this.#body.setFee(fee);

			oldFee = fee;

			fee = this.estimateFee(networkParams);
		}

		return fee;
	}

	/**
	 * Checks that all necessary scripts are included, and that all included scripts are used
	 * Shouldn't be used directly
	 */
	checkScripts() {
		let scripts = this.#witnesses.scripts;

		/** @type {Set<string>} */
		let scriptHashSet = new Set();

		this.#body.collectScriptHashes(scriptHashSet);

		if (scriptHashSet.size < scripts.length) {
			throw new Error("too many scripts included");
		} else if (scriptHashSet.size > scripts.length) {
			throw new Error("missing scripts");
		}

		for (let script of scripts) {
			assert(scriptHashSet.has(bytesToHex(script.hash())), "missing script");
		}
	}

	/**
	 * @param {NetworkParams} networkParams 
	 * @returns {Promise<void>}
	 */
	async executeRedeemers(networkParams) {
		await this.#witnesses.executeRedeemers(networkParams, this.#body);
	}

	/**
	 * @param {Address} changeAddress 
	 */
	balanceAssets(changeAddress) {
		const inputAssets = this.#body.sumInputAndMintedAssets();

		const outputAssets = this.#body.sumOutputAssets();

		if (inputAssets.eq(outputAssets)) {
			return;
		} else if (outputAssets.ge(inputAssets)) {
			throw new Error("not enough input assets");
		} else {
			const diff = inputAssets.sub(outputAssets);

			const changeOutput = new TxOutput(changeAddress, new Value(0n, diff));

			this.#body.addOutput(changeOutput);
		}
	}

	/**
	 * @param {NetworkParams} networkParams
	 * @param {Address} changeAddress
	 * @param {UTxO[]} spareUtxos
	 */
	balanceCollateral(networkParams, changeAddress, spareUtxos) {
		// don't do this step if collateral was already added explicitly
		if (this.#body.collateral.length > 0 || !this.isSmart()) {
			return;
		}

		const minCollateral = ((this.#witnesses.estimateFee(networkParams)*BigInt(networkParams.minCollateralPct)) + 100n - 1n)/100n; // integer division that rounds up

		let collateral = 0n;
		/**
		 * @type {TxInput[]}
		 */
		const collateralInputs = [];

		/**
		 * @param {TxInput[]} inputs 
		 */
		function addInputs(inputs) {
			// first try using the UTxOs that already form the inputs
			const cleanInputs = inputs.filter(utxo => utxo.value.assets.isZero()).sort((a, b) => Number(a.value.lovelace - b.value.lovelace));

			for (let input of cleanInputs) {
				if (collateral > minCollateral) {
					break;
				}

				while (collateralInputs.length >= networkParams.maxCollateralInputs) {
					collateralInputs.shift();
				}
	
				collateralInputs.push(input);
				collateral += input.value.lovelace;
			}
		}
		
		addInputs(this.#body.inputs.slice());

		addInputs(spareUtxos.map(utxo => utxo.asTxInput));

		// create the collateral return output if there is enough lovelace
		const changeOutput = new TxOutput(changeAddress, new Value(0n));

		changeOutput.correctLovelace(networkParams);

		if (collateral < minCollateral) {
			throw new Error("unable to find enough collateral input");
		} else {
			if (collateral > minCollateral + changeOutput.value.lovelace) {
				changeOutput.setValue(new Value(collateral - minCollateral));

				changeOutput.correctLovelace(networkParams);

				if (collateral > minCollateral + changeOutput.value.lovelace) {
					this.#body.setCollateralReturn(changeOutput);
				}
			}
		}

		collateralInputs.forEach(utxo => {
			this.#body.addCollateral(utxo);
		});
	}

	/**
	 * Calculates fee and balances transaction by sending an output back to changeAddress
	 * First assumes that change output isn't needed, and if that assumption doesn't result in a balanced transaction the change output is created.
	 * Iteratively increments the fee because the fee increase the tx size which in turn increases the fee (always converges within two steps though).
	 * Throws error if transaction can't be balanced.
	 * Shouldn't be used directly
	 * @param {NetworkParams} networkParams 
	 * @param {Address} changeAddress
	 * @param {UTxO[]} spareUtxos - used when there are yet enough inputs to cover everything (eg. due to min output lovelace requirements, or fees)
	 */
	balanceLovelace(networkParams, changeAddress, spareUtxos) {
		let fee = this.setFee(networkParams, this.estimateFee(networkParams));
		
		let inputValue = this.#body.sumInputAndMintedValue();

		let outputValue = this.#body.sumOutputValue();

		let feeValue = new Value(fee);

		let totalOutputValue = feeValue.add(outputValue);

		spareUtxos = spareUtxos.filter(utxo => utxo.value.assets.isZero());

		// check if transaction is already perfectly balanced (very unlikely though)
		if (totalOutputValue.eq(inputValue)) {
			return;
		}
		
		// if transaction isn't balanced there must be a change address
		if (changeAddress === null) {
			throw new Error("change address not specified");
		}

		// use some spareUtxos if the inputValue doesn't cover the outputs and fees
		while (!inputValue.ge(totalOutputValue)) {
			let spare = spareUtxos.pop();

			if (spare === undefined) {
				throw new Error("transaction outputs more than it inputs");
			} else {
				this.#body.addInput(spare.asTxInput);

				inputValue = inputValue.add(spare.value);
			}
		}

		// use the change address to create a change utxo
		let diff = inputValue.sub(totalOutputValue);

		let changeOutput = new TxOutput(changeAddress, diff); // also includes any minted change

		this.#body.addOutput(changeOutput);

		// we can mutate the lovelace value of 'changeOutput' until we have a balanced transaction with precisely the right fee

		let oldFee = fee;
		fee = this.estimateFee(networkParams);

		while (fee != oldFee) {
			this.#body.setFee(fee);

			let diffFee = fee - oldFee;

			// use some more spareUtxos
			while (diffFee  > changeOutput.value.lovelace) {
				let spare = spareUtxos.pop();

				if (spare === undefined) {
					throw new Error("not enough clean inputs to cover fees");
				} else {
					this.#body.addInput(spare.asTxInput);

					inputValue = inputValue.add(spare.value);

					diff = diff.add(spare.value);

					changeOutput.setValue(diff);
				}
			}

			changeOutput.value.setLovelace(changeOutput.value.lovelace - diffFee);

			oldFee = fee;

			fee = this.estimateFee(networkParams);
		}
	}

	/**
	 * Shouldn't be used directly
	 * @param {NetworkParams} networkParams
	 */
	syncScriptDataHash(networkParams) {
		let hash = this.#witnesses.calcScriptDataHash(networkParams);

		if (hash !== null) {
			this.#body.setScriptDataHash(hash);
		}
	}

	/**
	 * @returns {boolean}
	 */
	isSmart() {
		return this.#witnesses.scripts.length > 0;
	}

	/**
	 * Throws an error if there isn't enough collateral
	 * Also throws an error if the script doesn't require collateral, but collateral was actually included
	 * Shouldn't be used directly
	 * @param {NetworkParams} networkParams 
	 */
	checkCollateral(networkParams) {
		if (this.isSmart()) {
			let minCollateralPct = networkParams.minCollateralPct;

			this.#body.checkCollateral(networkParams, BigInt(Math.ceil(minCollateralPct*Number(this.#body.fee)/100.0)));
		} else {
			this.#body.checkCollateral(networkParams, null);
		}
	}

	/**
	 * Throws error if tx is too big
	 * Shouldn't be used directly
	 * @param {NetworkParams} networkParams 
	 */
	checkSize(networkParams) {
		let size = this.toCbor().length;

		if (size > networkParams.maxTxSize) {
			throw new Error("tx too big");
		}
	}

	/**
	 * Final check that fee is big enough
	 * @param {NetworkParams} networkParams 
	 */
	checkFee(networkParams) {
		assert(this.estimateFee(networkParams) <= this.#body.fee, "fee too small");
	}

	/**
	 * Assumes transaction hasn't yet been signed by anyone (i.e. witnesses.signatures is empty)
	 * Mutates 'this'
	 * Note: this is an async function so that a debugger can optionally be attached in the future
	 * @param {NetworkParams} networkParams
	 * @param {Address}       changeAddress
	 * @param {UTxO[]}        spareUtxos - might be used during balancing if there currently aren't enough inputs
	 * @returns {Promise<Tx>}
	 */
	async finalize(networkParams, changeAddress, spareUtxos = []) {
		assert(!this.#valid);

		if (this.#metadata !== null) {
			// Calculate the Metadata hash and add to the TxBody
			this.#body.setMetadataHash(
				new Hash(Crypto.blake2b(this.#metadata.toCbor()))
			);
		}

		if (this.#validTo !== null) {
			this.#body.validTo(
				networkParams.timeToSlot(BigInt(this.#validTo.getTime()))
			);
		}

		if (this.#validFrom !== null) {
			this.#body.validFrom(networkParams.timeToSlot(BigInt(this.#validFrom.getTime())));
		}

		// inputs, minted assets, and withdrawals must all be in a particular order
		this.#body.sort();

		// after inputs etc. have been sorted we can calculate the indices of the redeemers referring to those inputs
		this.#witnesses.updateRedeemerIndices(this.#body);

		this.checkScripts();

		// balance the non-ada assets
		this.balanceAssets(changeAddress)

		// make sure that each output contains the necessary minimum amount of lovelace	
		this.#body.correctOutputs(networkParams);

		// the scripts executed at this point will not see the correct txHash nor the correct fee
		await this.executeRedeemers(networkParams);

		// we can only sync scriptDataHash after the redeemer execution costs have been estimated
		this.syncScriptDataHash(networkParams);

		// balance collateral (if collateral wasn't already set manually)
		this.balanceCollateral(networkParams, changeAddress, spareUtxos.slice());

		// balance the lovelace
		this.balanceLovelace(networkParams, changeAddress, spareUtxos.slice());

		// a bunch of checks
		this.#body.checkOutputs(networkParams);

		this.checkCollateral(networkParams);

		this.#witnesses.checkExecutionBudget(networkParams);

		this.checkSize(networkParams);

		this.checkFee(networkParams);

		this.#valid = true;

		return this;
	}

	/**
	 * Throws an error if verify==true and signature is invalid 
	 * Adding many signatures might be a bit slow
	 * @param {Signature} signature 
	 * @param {boolean} verify
	 * @returns {Tx}
	 */
	addSignature(signature, verify = true) {
		assert(this.#valid);

		if (verify) {
			signature.verify(this.bodyHash);
		}

		this.#witnesses.addSignature(signature);

		return this;
	}

	/**
	 * Throws an error if verify==true and any of the signatures is invalid
	 * Adding many signatures might be a bit slow
	 * @param {Signature[]} signatures 
	 * @param {boolean} verify 
	 * @returns {Tx}
	 */
	addSignatures(signatures, verify = true) {
		for (let s of signatures) {
			this.addSignature(s, verify);
		}

		return this;
	}

	/**
	 * @param {number} tag
	 * @param {Metadata} data
	 * @returns {Tx}
	 */
	addMetadata(tag, data) {
		if (this.#metadata === null) {
			this.#metadata = new TxMetadata();
		}

		this.#metadata.add(tag, data);

		return this;
	}

	/**
	 * @returns {TxId}
	 */
	id() {
		assert(this.#valid, "can't get TxId of unfinalized Tx");
		return new TxId(this.bodyHash);
	}
}

/**
 * inputs, minted assets, and withdrawals need to be sorted in order to form a valid transaction
 */
class TxBody extends CborData {
	/**
	 * Inputs must be sorted before submitting (first by TxId, then by utxoIndex)
	 * Spending redeemers must point to the sorted inputs
	 * @type {TxInput[]} 
	 */
	#inputs;

	/** @type {TxOutput[]} */
	#outputs;

	/** @type {bigint} in lovelace */
	#fee;

	/** @type {?bigint} */
	#lastValidSlot;

	/** @type {DCert[]} */
	#certs;

	/**
	 * Withdrawals must be sorted by address
	 * Stake rewarding redeemers must point to the sorted withdrawals
	 * @type {Map<Address, bigint>} 
	 */
	#withdrawals;

	/** @type {?bigint} */
	#firstValidSlot;

	/**
	 * Internally the assets must be sorted by mintingpolicyhash
	 * Minting redeemers must point to the sorted minted assets
	 * @type {Assets} 
	 */
	#minted;

	/** @type {?Hash} */
	#scriptDataHash;

	/** @type {TxInput[]} */
	#collateral;

	/** @type {PubKeyHash[]} */
	#signers;

	/** @type {?TxOutput} */
	#collateralReturn;

	/** @type {bigint} */
	#totalCollateral;

	/** @type {TxInput[]} */
	#refInputs;

	/** @type {?Hash} */
	#metadataHash;

	constructor() {
		super();

		this.#inputs = [];
		this.#outputs = [];
		this.#fee = 0n;
		this.#lastValidSlot = null;
		this.#certs = [];
		this.#withdrawals = new Map();
		this.#firstValidSlot = null;
		this.#minted = new Assets(); // starts as zero value (i.e. empty map)
		this.#scriptDataHash = null; // calculated upon finalization
		this.#collateral = [];
		this.#signers = [];
		this.#collateralReturn = null; // doesn't seem to be used anymore
		this.#totalCollateral = 0n; // doesn't seem to be used anymore
		this.#refInputs = [];
		this.#metadataHash = null;
	}

	get inputs() {
		return this.#inputs.slice();
	}

	get outputs() {
		return this.#outputs.slice();
	}

	get fee() {
		return this.#fee;
	}

	/**
	 * @param {bigint} fee
	 */
	setFee(fee) {
		this.#fee = fee;
	}

	/**
	 * @type {Assets}
	 */
	get minted() {
		return this.#minted;
	}

	/**
	 * @type {TxInput[]}
	 */
	get collateral() {
		return this.#collateral;
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		/**
		 * @type {Map<number, number[]>}
		 */
		let object = new Map();

		object.set(0, CborData.encodeDefList(this.#inputs));
		object.set(1, CborData.encodeDefList(this.#outputs));
		object.set(2, CborData.encodeInteger(this.#fee));
		
		if (this.#lastValidSlot !== null) {
			object.set(3, CborData.encodeInteger(this.#lastValidSlot));
		}

		if (this.#certs.length != 0) {
			object.set(4, CborData.encodeDefList(this.#certs));
		}

		if (this.#withdrawals.size != 0) {
			throw new Error("not yet implemented");
		}

		if (this.#metadataHash !== null) {
			object.set(7, this.#metadataHash.toCbor());
		}

		if (this.#firstValidSlot !== null) {
			object.set(8, CborData.encodeInteger(this.#firstValidSlot));
		}

		if (!this.#minted.isZero()) {
			object.set(9, this.#minted.toCbor());
		}

		if (this.#scriptDataHash !== null) {
			object.set(11, this.#scriptDataHash.toCbor());
		}

		if (this.#collateral.length != 0) {
			object.set(13, CborData.encodeDefList(this.#collateral));
		}

		if (this.#signers.length != 0) {
			object.set(14, CborData.encodeDefList(this.#signers));
		}

		// what is NetworkId used for?
		//object.set(15, CborData.encodeInteger(2n));

		if (this.#collateralReturn !== null) {
			object.set(16, this.#collateralReturn.toCbor());
		}

		if (this.#totalCollateral > 0n) {
			object.set(17, CborData.encodeInteger(this.#totalCollateral));
		}

		if (this.#refInputs.length != 0) {
			object.set(18, CborData.encodeDefList(this.#refInputs));
		}

		return CborData.encodeObject(object);
	}

	/**
	 * @param {number[]} bytes
	 * @returns {TxBody}
	 */
	static fromCbor(bytes) {
		let txBody = new TxBody();

		let done = CborData.decodeObject(bytes, (i, fieldBytes) => {
			switch(i) {
				case 0:
					CborData.decodeList(fieldBytes, itemBytes => {
						txBody.#inputs.push(TxInput.fromCbor(itemBytes));
					});
					break;
				case 1:
					CborData.decodeList(fieldBytes, itemBytes => {
						txBody.#outputs.push(TxOutput.fromCbor(itemBytes));
					})
					break;
				case 2:
					txBody.#fee = CborData.decodeInteger(fieldBytes);
					break;
				case 3:
					txBody.#lastValidSlot = CborData.decodeInteger(fieldBytes);
					break;
				case 4:
					CborData.decodeList(fieldBytes, itemBytes => {
						txBody.#certs.push(DCert.fromCbor(itemBytes));
					});
					break;
				case 5:
					throw new Error("not yet implemented");
				case 6:
					throw new Error("not yet implemented");
				case 7:
					txBody.#metadataHash = Hash.fromCbor(fieldBytes);
					break;
				case 8:
					txBody.#firstValidSlot = CborData.decodeInteger(fieldBytes);
					break;
				case 9:
					txBody.#minted = Assets.fromCbor(fieldBytes);
					break;
				case 10:
					throw new Error("unhandled field");
				case 11:
					txBody.#scriptDataHash = Hash.fromCbor(fieldBytes);
					break;
				case 12:
					throw new Error("unhandled field");
				case 13:
					CborData.decodeList(fieldBytes, itemBytes => {
						txBody.#collateral.push(TxInput.fromCbor(itemBytes));
					});
					break;
				case 14:
					CborData.decodeList(fieldBytes, itemBytes => {
						txBody.#signers.push(PubKeyHash.fromCbor(itemBytes));
					});
					break;
				case 15:
					assert(CborData.decodeInteger(fieldBytes) == 2n);
					break;
				case 16:
					txBody.#collateralReturn = TxOutput.fromCbor(fieldBytes);
					break;
				case 17:
					txBody.#totalCollateral = CborData.decodeInteger(fieldBytes);
					break;
				case 18:
					CborData.decodeList(fieldBytes, itemBytes => {
						txBody.#refInputs.push(TxInput.fromCbor(fieldBytes));
					});
					break;
				default:
					throw new Error("unrecognized field");
			}
		});

		assert(done.has(0) && done.has(1) && done.has(2));

		return txBody;
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		return {
			inputs: this.#inputs.map(input => input.dump()),
			outputs: this.#outputs.map(output => output.dump()),
			fee: this.#fee.toString(),
			lastValidSlot: this.#lastValidSlot === null ? null : this.#lastValidSlot.toString(),
			firstValidSlot: this.#firstValidSlot === null ? null : this.#firstValidSlot.toString(),
			minted: this.#minted.isZero() ? null : this.#minted.dump(),
			metadataHash: this.#metadataHash === null ? null : this.#metadataHash.dump(),
			scriptDataHash: this.#scriptDataHash === null ? null : this.#scriptDataHash.dump(),
			collateral: this.#collateral.length == 0 ? null : this.#collateral.map(c => c.dump()),
			signers: this.#signers.length == 0 ? null : this.#signers.map(rs => rs.dump()),
			//collateralReturn: this.#collateralReturn === null ? null : this.#collateralReturn.dump(), // doesn't seem to be used anymore
			//totalCollateral: this.#totalCollateral.toString(), // doesn't seem to be used anymore
			refInputs: this.#refInputs.map(ri => ri.dump()),
		};
	}

	/**
	 * For now simply returns minus infinity to plus infinity (WiP)
	 * @param {NetworkParams} networkParams
	 * @returns {ConstrData}
	 */
	toValidTimeRangeData(networkParams) {
		return new ConstrData(0, [
			new ConstrData(0, [ // LowerBound
				this.#firstValidSlot === null ? new ConstrData(0, []) : new ConstrData(1, [new IntData(networkParams.slotToTime(this.#firstValidSlot))]), // NegInf
				new ConstrData(1, []), // true
			]),
			new ConstrData(0, [ // UpperBound
				this.#lastValidSlot === null ? new ConstrData(2, []) : new ConstrData(1, [new IntData(networkParams.slotToTime(this.#lastValidSlot))]), // PosInf
				new ConstrData(1, []), // true
			]),
		]);
	}

	/**
	 * @param {NetworkParams} networkParams
	 * @param {Redeemer[]} redeemers
	 * @param {ListData} datums 
	 * @param {TxId} txId
	 * @returns {ConstrData}
	 */
	toTxData(networkParams, redeemers, datums, txId) {
		return new ConstrData(0, [
			new ListData(this.#inputs.map(input => input.toData())),
			new ListData(this.#refInputs.map(input => input.toData())),
			new ListData(this.#outputs.map(output => output.toData())),
			(new Value(this.#fee))._toUplcData(),
			// NOTE: all other Value instances in ScriptContext contain some lovelace, but #minted can never contain any lovelace, yet cardano-node always prepends 0 lovelace to the #minted MapData
			(new Value(0n, this.#minted))._toUplcData(true), 
			new ListData(this.#certs.map(cert => cert.toData())),
			new MapData(Array.from(this.#withdrawals.entries()).map(w => [w[0].toStakingData(), new IntData(w[1])])),
			this.toValidTimeRangeData(networkParams),
			new ListData(this.#signers.map(rs => new ByteArrayData(rs.bytes))),
			new MapData(redeemers.map(r => [r.toScriptPurposeData(this), r.data])),
			new MapData(datums.list.map(d => [
				new ByteArrayData(Crypto.blake2b(d.toCbor())), 
				d
			])),
			// DEBUG extra data to see if it influences the ex budget
			new ConstrData(0, [new ByteArrayData(txId.bytes)]),
		]);
	}

	/**
	 * @param {NetworkParams} networkParams 
	 * @param {Redeemer[]} redeemers
	 * @param {ListData} datums
	 * @param {number} redeemerIdx
	 * @returns {UplcData}
	 */
	toScriptContextData(networkParams, redeemers, datums, redeemerIdx) {		
		return new ConstrData(0, [
			// tx (we can't know the txId right now, because we don't know the execution costs yet, but a dummy txId should be fine)
			this.toTxData(networkParams, redeemers, datums, TxId.dummy()),
			redeemers[redeemerIdx].toScriptPurposeData(this),
		]);
	}

	/**
	 * @returns {Value}
	 */
	sumInputValue() {
		let sum = new Value();

		for (let input of this.#inputs) {
			if (input.origOutput !== null) {
				sum = sum.add(input.origOutput.value);
			}
		}

		return sum;
	}

	/**
	 * Throws error if any part of the sum is negative (i.e. more is burned than input)
	 * @returns {Value}
	 */
	sumInputAndMintedValue() {
		return this.sumInputValue().add(new Value(0n, this.#minted)).assertAllPositive();
	}

	/**
	 * @returns {Assets}
	 */
	sumInputAndMintedAssets() {
		return this.sumInputAndMintedValue().assets;
	}

	/**
	 * @returns {Value}
	 */
	sumOutputValue() {
		let sum = new Value();

		for (let output of this.#outputs) {
			sum = sum.add(output.value);
		}

		return sum;
	}

	/**
	 * @returns {Assets}
	 */
	sumOutputAssets() {
		return this.sumOutputValue().assets;
	}

	/**
	 * @param {bigint} slot
	 */
	validFrom(slot) {
		this.#firstValidSlot = slot;
	}

	/**
	 * @param {bigint} slot
	 */
	validTo(slot) {
		this.#lastValidSlot = slot;
	}

	/**
	 * Throws error if this.#minted already contains mph
	 * @param {MintingPolicyHash} mph - minting policy hash
	 * @param {[number[], bigint][]} tokens
	 */
	addMint(mph, tokens) {
		this.#minted.addTokens(mph, tokens);
	}

	/**
	 * @param {TxInput} input 
	 */
	addInput(input) {
		if (input.origOutput === null) {
			throw new Error("TxInput.origOutput must be set when building transaction");
		} else {
			input.origOutput.value.assertAllPositive();
		}

		this.#inputs.push(input);
	}

	/**
	 * @param {TxInput} input 
	 */
	addRefInput(input) {
		this.#refInputs.push(input);
	}

	/**
	 * @param {TxOutput} output
	 */
	addOutput(output) {
		output.value.assertAllPositive();

		this.#outputs.push(output);
	}

	/**
	 * @param {PubKeyHash} hash 
	 */
	addSigner(hash) {
		this.#signers.push(hash);
	}

	/**
	 * @param {TxInput} input 
	 */
	addCollateral(input) {
		this.#collateral.push(input);
	}
	
	/**
	 * @param {Hash} scriptDataHash
	 */
	setScriptDataHash(scriptDataHash) {
		this.#scriptDataHash = scriptDataHash;
	}

	/**
	 * @param {Hash} metadataHash
	 */
	setMetadataHash(metadataHash) {
		this.#metadataHash = metadataHash;
	}

	/**
	 * @param {TxOutput} output 
	 */
	setCollateralReturn(output) {
		this.#collateralReturn = output;
	}

	/**
	 * Calculates the number of dummy signatures needed to get precisely the right tx size
	 * @returns {number}
	 */
	countUniqueSigners() {
		/** @type {Set<PubKeyHash>} */
		let set = new Set();

		const inputs = this.#inputs.concat(this.#collateral);

		for (let input of inputs) {
			let origOutput = input.origOutput;

			if (origOutput !== null) {
				let pubKeyHash = origOutput.address.pubKeyHash;

				if (pubKeyHash !== null) {
					set.add(pubKeyHash);
				}
			}
		}

		for (let rs of this.#signers) {
			set.add(rs);
		}

		return set.size;
	}

	/**
	 * Script hashes are found in addresses of TxInputs and hashes of the minted MultiAsset
	 * @param {Set<string>} set - hashes in hex format
	 */
	collectScriptHashes(set) {
		for (let input of this.#inputs) {
			if (input.origOutput !== null) {
				let scriptHash = input.origOutput.address.validatorHash;

				if (scriptHash !== null) {
					set.add(bytesToHex(scriptHash.bytes));
				}
			}
		}

		let mphs = this.#minted.mintingPolicies;

		for (let mph of mphs) {
			set.add(bytesToHex(mph.bytes));
		}
	}

	/**
	 * Makes sure each output contains the necessary min lovelace
	 * @param {NetworkParams} networkParams
	 */
	correctOutputs(networkParams) {
		for (let output of this.#outputs) {
			output.correctLovelace(networkParams);
		}
	}

	/**
	 * Checks that each output contains enough lovelace
	 * @param {NetworkParams} networkParams
	 */
	checkOutputs(networkParams) {
		for (let output of this.#outputs) {
			let minLovelace = output.calcMinLovelace(networkParams);

			assert(minLovelace <= output.value.lovelace, `not enough lovelace in output (expected at least ${minLovelace.toString()}, got ${output.value.lovelace})`);
		}
	}
	
	/**
	 * @param {NetworkParams} networkParams
	 * @param {?bigint} minCollateral 
	 */
	checkCollateral(networkParams, minCollateral) {
		assert(this.#collateral.length <= networkParams.maxCollateralInputs);

		if (minCollateral === null) {
			assert(this.#collateral.length == 0, "unnecessary collateral included");
		} else {
			let sum = new Value();

			for (let col of this.#collateral) {
				if (col.origOutput === null) {
					throw new Error("expected collateral TxInput.origOutput to be set");
				} else if (!col.origOutput.value.assets.isZero()) {
					throw new Error("collateral can only contain lovelace");
				} else {
					sum = sum.add(col.origOutput.value);
				}
			}

			if (this.#collateralReturn != null) {
				sum = sum.sub(this.#collateralReturn.value);
			}

			assert(sum.lovelace >= minCollateral, "not enough collateral");

			if (sum.lovelace > minCollateral*5n){
				console.error("Warning: way too much collateral");
			}
		}
	}

	/**
	 * Makes sore inputs, withdrawals, and minted assets are in correct order
	 * Mutates
	 */
	sort() {
		this.#inputs.sort(TxInput.comp);

		this.#withdrawals = new Map(Array.from(this.#withdrawals.entries()).sort((a, b) => {
			return Address.compStakingHashes(a[0], b[0]);
		}));

		this.#minted.sort();
	}

	/**
	 * Used by (indirectly) by emulator to check if slot range is valid.
	 * @param {bigint} slot
	 */
	isValid(slot) {
		if (this.#lastValidSlot != null) {
			if (slot > this.#lastValidSlot) {
				return false;
			}
		}

		if (this.#firstValidSlot != null) {
			if (slot < this.#firstValidSlot) {
				return false;
			}
		}

		return true;
	}
}

export class TxWitnesses extends CborData {
	/** @type {Signature[]} */
	#signatures;

	/** @type {ListData} */
	#datums;

	/** @type {Redeemer[]} */
	#redeemers;

	/** @type {UplcProgram[]} */
	#scripts;

	/** @type {UplcProgram[]} */
	#refScripts;

	constructor() {
		super();
		this.#signatures = [];
		this.#datums = new ListData([]);
		this.#redeemers = [];
		this.#scripts = [];
		this.#refScripts = [];
	}

	/**
	 * @type {Signature[]}
	 */
	get signatures() {
		return this.#signatures;
	}

	/**
	 * Returns all the scripts, including the reference scripts
	 * @type {UplcProgram[]}
	 */
	get scripts() {
		return this.#scripts.slice().concat(this.#refScripts.slice());
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		/**
		 * @type {Map<number, number[]>}
		 */
		let object = new Map();

		if (this.#signatures.length != 0) {
			object.set(0, CborData.encodeDefList(this.#signatures));
		}

		if (this.#datums.list.length != 0) {
			object.set(4, this.#datums.toCbor());
		}

		if (this.#redeemers.length != 0) {
			object.set(5, CborData.encodeDefList(this.#redeemers));
		}

		if (this.#scripts.length != 0) {
			/**
			 * @type {number[][]}
			 */
			let scriptBytes = this.#scripts.map(s => s.toCbor());

			object.set(6, CborData.encodeDefList(scriptBytes));
		}

		return CborData.encodeObject(object);
	}

	/**
	 * @param {number[]} bytes 
	 * @returns {TxWitnesses}
	 */
	static fromCbor(bytes) {
		let txWitnesses = new TxWitnesses();

		CborData.decodeObject(bytes, (i, fieldBytes) => {
			switch(i) {
				case 0:
					CborData.decodeList(fieldBytes, itemBytes => {
						txWitnesses.#signatures.push(Signature.fromCbor(itemBytes));
					});
					break;
				case 1:
				case 2:
				case 3:
					throw new Error("unhandled field");
				case 4:
					txWitnesses.#datums = ListData.fromCbor(fieldBytes);
					break;
				case 5:
					CborData.decodeList(fieldBytes, itemBytes => {
						txWitnesses.#redeemers.push(Redeemer.fromCbor(itemBytes));
					});
					break;
				case 6:
					CborData.decodeList(fieldBytes, itemBytes => {
						txWitnesses.#scripts.push(UplcProgram.fromCbor(itemBytes));
					});
					break;
				default:
					throw new Error("unrecognized field");
			}
		});

		return txWitnesses;
	}

	/**
	 * Throws error if signatures are incorrect
	 * @param {number[]} bodyBytes 
	 */
	verifySignatures(bodyBytes) {
		for (let signature of this.#signatures) {
			signature.verify(Crypto.blake2b(bodyBytes));
		}
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		return {
			signatures: this.#signatures.map(pkw => pkw.dump()),
			datums: this.#datums.list.map(datum => datum.toString()),
			redeemers: this.#redeemers.map(redeemer => redeemer.dump()),
			scripts: this.#scripts.map(script => bytesToHex(script.toCbor())),
			refScripts: this.#refScripts.map(script => bytesToHex(script.toCbor())),
		};
	}

	/**
	 * @param {NetworkParams} networkParams
	 * @returns {bigint}
	 */
	estimateFee(networkParams) {
		let sum = 0n;

		for (let redeemer of this.#redeemers) {
			sum += redeemer.estimateFee(networkParams);
		}

		return sum;
	}

	/**
	 * @param {Signature} signature 
	 */
	addSignature(signature) {
		this.#signatures.push(signature);
	}

	/**
	 * @param {number} n
	 */
	addDummySignatures(n) {
		for (let i = 0 ; i < n; i++) {
			this.#signatures.push(Signature.dummy());
		}
	}

	removeDummySignatures() {
		this.#signatures = this.#signatures.filter(pkw => !pkw.isDummy());
	}

	/**
	 * Index is calculated later
	 * @param {TxInput} input
	 * @param {UplcData} redeemerData 
	 */
	addSpendingRedeemer(input, redeemerData) {
		this.#redeemers.push(new SpendingRedeemer(input, -1, redeemerData)); // actual input index is determined later
	}

	/**
	 * @param {MintingPolicyHash} mph
	 * @param {UplcData} redeemerData
	 */
	addMintingRedeemer(mph, redeemerData) {
		this.#redeemers.push(new MintingRedeemer(mph, -1, redeemerData));
	}

	/**
	 * @param {UplcData} data 
	 */
	addDatumData(data) {
		// check that it hasn't already been included
		for (let prev of this.#datums.list) {
			if (eq(prev.toCbor(), data.toCbor())) {
				return;
			}
		}

		let lst = this.#datums.list;
		lst.push(data);

		this.#datums = new ListData(lst);
	}

	/**
	 * Throws error if script was already added before
	 * @param {UplcProgram} program 
	 * @param {boolean} isRef
	 */
	attachScript(program, isRef = false) {
		let h = program.hash();

		assert(this.#scripts.every(s => !eq(s.hash(), h)));
		assert(this.#refScripts.every(s => !eq(s.hash(), h)));

		if (isRef) {
			this.#refScripts.push(program);
		} else {
			this.#scripts.push(program);
		}
	}

	/**
	 * Retrieves either a regular script or a reference script
	 * @param {Hash} scriptHash - can be ValidatorHash or MintingPolicyHash
	 * @returns {UplcProgram}
	 */
	getScript(scriptHash) {
		return assertDefined(this.scripts.find(s => eq(s.hash(), scriptHash.bytes)));
	}

	/**
	 * @param {TxBody} body
	 */
	updateRedeemerIndices(body) {
		for (let redeemer of this.#redeemers) {
			redeemer.updateIndex(body);
		}
	}

	/**
	 * @param {NetworkParams} networkParams 
	 * @returns {?Hash} - returns null if there are no redeemers
	 */
	calcScriptDataHash(networkParams) {
		if (this.#redeemers.length > 0) {
			let bytes = CborData.encodeDefList(this.#redeemers);

			if (this.#datums.list.length > 0) {
				bytes = bytes.concat(this.#datums.toCbor());
			}

			// language view encodings?
			let sortedCostParams = networkParams.sortedCostParams;

			bytes = bytes.concat(CborData.encodeMap([[
				CborData.encodeInteger(1n), 
				CborData.encodeDefList(sortedCostParams.map(cp => CborData.encodeInteger(BigInt(cp)))),
			]]));

			return new Hash(Crypto.blake2b(bytes));
		} else {
			return null;
		}
	}

	/**
	 * Executes the redeemers in order to calculate the necessary ex units
	 * @param {NetworkParams} networkParams 
	 * @param {TxBody} body - needed in order to create correct ScriptContexts
	 * @returns {Promise<void>}
	 */
	async executeRedeemers(networkParams, body) {
		body.setFee(networkParams.maxTxFee);

		for (let i = 0; i < this.#redeemers.length; i++) {
			const redeemer = this.#redeemers[i];

			const scriptContext = body.toScriptContextData(networkParams, this.#redeemers, this.#datums, i);

			if (redeemer instanceof SpendingRedeemer) {
				const idx = redeemer.inputIndex;

				const origOutput = body.inputs[idx].origOutput;

				if (origOutput === null) {
					throw new Error("expected origOutput to be non-null");
				} else {
					const datumData = origOutput.getDatumData();

					const validatorHash = origOutput.address.validatorHash;

					if (validatorHash === null || validatorHash === undefined) {
						throw new Error("expected validatorHash to be non-null");
					} else {
						const script = this.getScript(validatorHash);

						const args = [
							new UplcDataValue(Site.dummy(), datumData), 
							new UplcDataValue(Site.dummy(), redeemer.data), 
							new UplcDataValue(Site.dummy(), scriptContext),
						];

						const profile = await script.profile(args, networkParams);

						if (profile.result instanceof UserError) {
							profile.messages.forEach(m => console.log(m));
							throw profile.result;
						} else {
							redeemer.setCost({mem: profile.mem, cpu: profile.cpu});
						}
					}
				}
			} else if (redeemer instanceof MintingRedeemer) {
				const mph = body.minted.mintingPolicies[redeemer.mphIndex];

				const script = this.getScript(mph);

				const args = [
					new UplcDataValue(Site.dummy(), redeemer.data),
					new UplcDataValue(Site.dummy(), scriptContext),
				];

				const profile = await script.profile(args, networkParams);

				if (profile.result instanceof UserError) {
					profile.messages.forEach(m => console.log(m));
					throw profile.result;
				} else {
					const cost = {mem: profile.mem, cpu: profile.cpu};
					redeemer.setCost(cost);
				}
			} else {
				throw new Error("unhandled redeemer type");
			}
		}
	}

	/**
	 * Throws error if execution budget is exceeded
	 * @param {NetworkParams} networkParams
	 */
	checkExecutionBudget(networkParams) {
		let totalMem = 0n;
		let totalCpu = 0n;

		for (let redeemer of this.#redeemers) {
			totalMem += redeemer.memCost;
			totalCpu += redeemer.cpuCost;
		}

		let [maxMem, maxCpu] = networkParams.maxTxExecutionBudget;

		if (totalMem >= BigInt(maxMem)) {
			throw new Error("execution budget exceeded for mem");
		}

		if (totalCpu >= BigInt(maxCpu)) {
			throw new Error("execution budget exceeded for cpu");
		}
	}
}

/**
 * @package
 */
class TxInput extends CborData {
	/** @type {TxId} */
	#txId;

	/** @type {bigint} */
	#utxoIdx;

	/** @type {?TxOutput} */
	#origOutput;

	/**
	 * @param {TxId} txId 
	 * @param {bigint} utxoIdx 
	 * @param {?TxOutput} origOutput - used during building, not part of serialization
	 */
	constructor(txId, utxoIdx, origOutput = null) {
		super();
		this.#txId = txId;
		this.#utxoIdx = utxoIdx;
		this.#origOutput = origOutput;
	}
	
	/**
	 * @type {TxId}
	 */
	get txId() {
		return this.#txId;
	}

	/**
	 * @type {bigint}
	 */
	get utxoIdx() {
		return this.#utxoIdx;
	}

	/**
	 * @type {TxOutput}
	 */
	get origOutput() {
		if (this.#origOutput === null) {
			throw new Error("origOutput not set");
		} else {
			return this.#origOutput;
		}
	}

	/**
	 * Shortcut
	 * @type {Value}
	 */
	get value() {
		return this.origOutput.value;
	}

	/**
	 * Shortcut
	 * @type {Address}
	 */
	get address() {
		return this.origOutput.address;
	}

	/**
	 * @returns {ConstrData}
	 */
	toOutputIdData() {
		return new ConstrData(0, [
			new ConstrData(0, [new ByteArrayData(this.#txId.bytes)]),
			new IntData(this.#utxoIdx),
		]);
	}

	/**
	 * @returns {ConstrData}
	 */
	toData() {
		if (this.#origOutput === null) {
			throw new Error("expected to be non-null");
		} else {
			return new ConstrData(0, [
				this.toOutputIdData(),
				this.#origOutput.toData(),
			]);
		}
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return CborData.encodeTuple([
			this.#txId.toCbor(),
			CborData.encodeInteger(this.#utxoIdx),
		]);
	}

	/**
	 * @param {number[]} bytes 
	 * @returns {TxInput}
	 */
	static fromCbor(bytes) {
		/** @type {?TxId} */
		let txId = null;

		/** @type {?bigint} */
		let utxoIdx = null;

		CborData.decodeTuple(bytes, (i, fieldBytes) => {
			switch(i) {
				case 0:
					txId = TxId.fromCbor(fieldBytes);
					break;
				case 1:
					utxoIdx = CborData.decodeInteger(fieldBytes);
					break;
				default:
					throw new Error("unrecognized field");
			}
		});

		if (txId === null || utxoIdx === null) {
			throw new Error("unexpected");
		} else {
			return new TxInput(txId, utxoIdx);
		}
	}

	/**
	 * Tx inputs must be ordered. 
	 * The following function can be used directly by a js array sort
	 * @param {TxInput} a
	 * @param {TxInput} b
	 * @returns {number}
	 */
	static comp(a, b) {
		let res = ByteArrayData.comp(a.#txId.bytes, b.#txId.bytes);

		if (res == 0) {
			return Number(a.#utxoIdx - b.#utxoIdx);
		} else {
			return res;
		}
	} 

	/**
	 * @returns {Object}
	 */
	dump() {
		return {
			txId: this.#txId.dump(),
			utxoIdx: this.#utxoIdx.toString(),
			origOutput: this.#origOutput !== null ? this.#origOutput.dump() : null,
		};
	}
}

/**
 * UTxO wraps TxInput
 */
export class UTxO {
	#input;

	/**
	 * @param {TxId} txId 
	 * @param {bigint} utxoIdx 
	 * @param {TxOutput} origOutput
	 */
	constructor(txId, utxoIdx, origOutput) {
		this.#input = new TxInput(txId, utxoIdx, origOutput);
	}

	/**
	 * @type {TxId}
	 */
	get txId() {
		return this.#input.txId;
	}

	/**
	 * @type {bigint}
	 */
	get utxoIdx() {
		return this.#input.utxoIdx;
	}

	/**
	 * @type {TxInput}
	 */
	get asTxInput() {
		return this.#input;
	}

	/**
	 * @type {Value}
	 */
	get value() {
		return this.#input.value;
	}

	/**
	 * @type {TxOutput}
	 */
	get origOutput() {
		return this.#input.origOutput;
	}

	/**
	 * Deserializes UTxO format used by wallet connector
	 * @param {number[]} bytes
	 * @returns {UTxO}
	 */
	static fromCbor(bytes) {
		/** @type {?TxInput} */
		let maybeTxInput = null;

		/** @type {?TxOutput} */
		let origOutput = null;

		CborData.decodeTuple(bytes, (i, fieldBytes) => {
			switch(i) {
				case 0:
					maybeTxInput = TxInput.fromCbor(fieldBytes);
					break;
				case 1:
					origOutput = TxOutput.fromCbor(fieldBytes);
					break;
				default:
					throw new Error("unrecognized field");
			}
		});

		if (maybeTxInput !== null && origOutput !== null) {
            /** @type {TxInput} */
            const txInput = maybeTxInput;
            
			return new UTxO(txInput.txId, txInput.utxoIdx, origOutput);
		} else {
			throw new Error("unexpected");
		}
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return CborData.encodeTuple([
			this.#input.toCbor(),
			this.#input.origOutput.toCbor()
		]);
	}

	/**
	 * @param {UTxO[]} utxos
	 * @returns {Value}
	 */
	static sumValue(utxos) {
		let sum = new Value();

		for (let utxo of utxos) {
			sum = sum.add(utxo.value);
		}

		return sum;
	}
}

export class TxRefInput extends TxInput {
	/**
	 * @param {TxId} txId 
	 * @param {bigint} utxoId
	 * @param {TxOutput} origOutput
	 */
	constructor(txId, utxoId, origOutput) {
		super(txId, utxoId, origOutput);
	}
}

export class TxOutput extends CborData {
	/** @type {Address} */
	#address;

	/** @type {Value} */
	#value;

	/** @type {?Datum} */
	#datum;

	/** @type {?UplcProgram} */
	#refScript;

	/**
	 * @param {Address} address 
	 * @param {Value} value 
	 * @param {?Datum} datum 
	 * @param {?UplcProgram} refScript 
	 */
	constructor(address, value, datum = null, refScript = null) {
		assert(datum === null || datum instanceof Datum); // check this explicitely because caller might be using this constructor without proper type-checking
		super();
		this.#address = address;
		this.#value = value;
		this.#datum = datum;
		this.#refScript = refScript;
	}

	get address() {
		return this.#address;
	}

	/**
	 * Mutation is handy when correctin the quantity of lovelace in a utxo
	 * @param {Address} addr
	 */
	setAddress(addr) {
		this.#address = addr;
	}

	get value() {
		return this.#value;
	}

	/**
	 * Mutation is handy when correcting the quantity of lovelace in a utxo
	 * @param {Value} val
	 */
	setValue(val) {
		this.#value = val;
	}

	get datum() {
		return this.#datum;
	}

	/**
	 * Mutation is handy when correctin the quantity of lovelace in a utxo 
	 * @param {Datum} datum 
	 */
	setDatum(datum) {
		this.#datum = datum;
	}

	/**
	 * @returns {UplcData}
	 */
	getDatumData() {
		if (this.#datum === null) {
			throw new Error("no datum data available");
		} else {
			let data = this.#datum.data;
			if (data === null) {
				throw new Error("no datum data available");
			} else {
				return data;
			}
		}
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		if ((this.#datum === null || this.#datum instanceof HashedDatum) && this.#refScript === null && !STRICT_BABBAGE) {
			// this is needed to match eternl wallet (de)serialization (annoyingly eternl deserializes the tx and then signs its own serialization)
			// hopefully cardano-cli signs whatever serialization we choose (so we use the eternl variant in order to be compatible with both)

			let fields = [
				this.#address.toCbor(),
				this.#value.toCbor()
			];

			if (this.#datum !== null) {
				if (this.#datum instanceof HashedDatum) {
					fields.push(this.#datum.hash.toCbor());
				} else {
					throw new Error("unexpected");
				}
			}

			return CborData.encodeTuple(fields);
		} else {
			/** @type {Map<number, number[]>} */
			let object = new Map();

			object.set(0, this.#address.toCbor());
			object.set(1, this.#value.toCbor());

			if (this.#datum !== null) {
				object.set(2, this.#datum.toCbor());
			}

			if (this.#refScript !== null) {
				object.set(3, CborData.encodeTag(24n).concat(CborData.encodeBytes(
					CborData.encodeTuple([
						CborData.encodeInteger(BigInt(this.#refScript.versionTag())),
						this.#refScript.toCbor()
					])
				)));
			}

			return CborData.encodeObject(object);
		}
	}

	/**
	 * @param {number[]} bytes 
	 * @returns {TxOutput}
	 */
	static fromCbor(bytes) {
		/** @type {?Address} */
		let address = null;

		/** @type {?Value} */
		let value = null;

		/** @type {?Datum} */
		let outputDatum = null;

		/** @type {?UplcProgram} */
		let refScript = null;

		if (CborData.isObject(bytes)) {
			CborData.decodeObject(bytes, (i, fieldBytes) => {
				switch(i) { 
					case 0:
						address = Address.fromCbor(fieldBytes);
						break;
					case 1:
						value = Value.fromCbor(fieldBytes);
						break;
					case 2:
						outputDatum = Datum.fromCbor(fieldBytes);
						break;
					case 3:
						assert(CborData.decodeTag(fieldBytes) == 24n);

						let tupleBytes = CborData.decodeBytes(fieldBytes);

						CborData.decodeTuple(tupleBytes, (tupleIdx, innerTupleBytes) => {
							assert(refScript === null);

							switch(tupleIdx) {
								case 0:
									throw new Error("native refScript unhandled");
								case 1:
									throw new Error("plutuScriptV1 as refScript unhandled");
								case 2:
									refScript = UplcProgram.fromCbor(innerTupleBytes);
								default:
									throw new Error("unhandled script type for refScript");
							}
						});

						break;
					default:
						throw new Error("unrecognized field");
				}
			});
		} else if (CborData.isTuple(bytes)) {
			// this is the pre-vasil format, which is still sometimes returned by wallet connector functions
			CborData.decodeTuple(bytes, (i, fieldBytes) => {
				switch(i) { 
					case 0:
						address = Address.fromCbor(fieldBytes);
						break;
					case 1:
						value = Value.fromCbor(fieldBytes);
						break;
					case 2:
						outputDatum = new HashedDatum(DatumHash.fromCbor(fieldBytes));
						break;
					default:
						throw new Error("unrecognized field");
				}
			});
		} else {
			throw new Error("expected object or tuple for TxOutput");
		}

		if (address === null || value === null) {
			throw new Error("unexpected");
		} else {
			return new TxOutput(address, value, outputDatum, refScript);
		}
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		return {
			address: this.#address.dump(),
			value: this.#value.dump(),
			datum: this.#datum === null ? null : this.#datum.dump(),
			refScript: this.#refScript === null ? null : bytesToHex(this.#refScript.toCbor()),
		};
	}

	/**
	 * @returns {ConstrData}
	 */
	toData() {
		let datum = new ConstrData(0, []); // none
		if (this.#datum !== null) {
			datum = this.#datum.toData();
		}

		return new ConstrData(0, [
			this.#address._toUplcData(),
			this.#value._toUplcData(),
			datum,
			new ConstrData(1, []), // TODO: how to include the ref script
		]);
	}

	/**
	 * Each UTxO must contain some minimum quantity of lovelace to avoid that the blockchain is used for data storage
	 * @param {NetworkParams} networkParams
	 * @returns {bigint}
	 */
	calcMinLovelace(networkParams) {
		let lovelacePerByte = networkParams.lovelacePerUTXOByte;

		let correctedSize = this.toCbor().length + 160; // 160 accounts for some database overhead?

		return BigInt(correctedSize)*BigInt(lovelacePerByte);
	}

	/**
	 * Mutates. Makes sure the output contains at least the minimum quantity of lovelace.
	 * Other parts of the output can optionally also be mutated
	 * @param {NetworkParams} networkParams 
	 * @param {?((output: TxOutput) => void)} updater
	 */
	correctLovelace(networkParams, updater = null) {
		let minLovelace = this.calcMinLovelace(networkParams);

		while (this.#value.lovelace < minLovelace) {
			this.#value.setLovelace(minLovelace);

			if (updater != null) {
				updater(this);
			}

			minLovelace = this.calcMinLovelace(networkParams);
		}
	}
}

// TODO: enum members
class DCert extends CborData {
	constructor() {
		super();
	}

	/**
	 * @param {number[]} bytes 
	 * @returns {DCert}
	 */
	static fromCbor(bytes) {
		throw new Error("not yet implemented");
	}

	/**
	 * @returns {ConstrData}
	 */
	toData() {
		throw new Error("not yet implemented");
	}
}

/**
 * Convenience address that is used to query all assets controlled by a given StakeHash (can be scriptHash or regular stakeHash)
 */
export class StakeAddress extends Address {
	/**
	 * @param {number[]} bytes
	 * @returns {StakeAddress}
	 */
	static fromCbor(bytes) {
		return new StakeAddress(CborData.decodeBytes(bytes));
	}

	/**
	 * @param {string} str
	 * @returns {StakeAddress}
	 */
	static fromBech32(str) {
		let [prefix, bytes] = Crypto.decodeBech32(str);

		let result = new StakeAddress(bytes);

		assert(prefix == (result.isForTestnet() ? "stake_test" : "stake"), "invalid StakeAddress prefix");

		return result;
	}

	/**
	 * Doesn't check validity
	 * @param {string} hex
	 * @returns {StakeAddress}
	 */
	static fromHex(hex) {
		return new StakeAddress(hexToBytes(hex));
	}

	/**
	 * Address with only staking part (regular StakeKeyHash)
	 * @param {boolean} isTestnet
	 * @param {StakeKeyHash} hash
	 * @returns {StakeAddress}
	 */
	static fromStakeKeyHash(isTestnet, hash) {
		return new StakeAddress(
			[isTestnet ? 0xe0 : 0xe1].concat(hash.bytes)
		);
	}

	/**
	 * Address with only staking part (script StakingValidatorHash)
	 * @param {boolean} isTestnet
	 * @param {StakingValidatorHash} hash
	 * @returns {StakeAddress}
	 */
	static fromStakingValidatorHash(isTestnet, hash) {
		return new StakeAddress(
			[isTestnet ? 0xf0 : 0xf1].concat(hash.bytes)
		);
	}

	/**
	 * @returns {string}
	 */
	toBech32() {
		return Crypto.encodeBech32(
			this.isForTestnet() ? "stake_test" : "stake",
			this.bytes
		);
	}
}

export class Signature extends CborData {
	/** @type {number[]} */
	#pubKey;

	/** @type {number[]} */
	#signature;

	/**
	 * @param {number[]} pubKey 
	 * @param {number[]} signature 
	 */
	constructor(pubKey, signature) {
		super();
		this.#pubKey = pubKey;
		this.#signature = signature;
	}

	/**
	 * @returns {Signature}
	 */
	static dummy() {
		return new Signature((new Array(32)).fill(0), (new Array(64)).fill(0));
	}

	/**
	 * @returns {boolean}
	 */
	isDummy() {
		return this.#pubKey.every(b => b == 0) && this.#signature.every(b => b == 0);
	}

	toCbor() {
		return CborData.encodeTuple([
			CborData.encodeBytes(this.#pubKey),
			CborData.encodeBytes(this.#signature),
		]);
	}

	/**
	 * @param {number[]} bytes 
	 * @returns {Signature}
	 */
	static fromCbor(bytes) {
		/** @type {?number[]} */
		let pubKey = null;

		/** @type {?number[]} */
		let signature = null;

		let n = CborData.decodeTuple(bytes, (i, fieldBytes) => {
			switch(i) {
				case 0:
					pubKey = CborData.decodeBytes(fieldBytes);
					break;
				case 1:
					signature = CborData.decodeBytes(fieldBytes);
					break;
				default:
					throw new Error("unrecognized field");
			}
		});

		assert(n == 2);

		if (pubKey === null || signature === null) {
			throw new Error("unexpected");
		} else {
			return new Signature(pubKey, signature);
		}
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		return {
			pubKey: bytesToHex(this.#pubKey),
			pubKeyHash: bytesToHex(Crypto.blake2b(this.#pubKey, 28)),
			signature: bytesToHex(this.#signature),
		};
	}

	/**
	 * Throws error if incorrect
	 * @param {number[]} msg
	 */
	verify(msg) {
		if (this.#signature === null) {
			throw new Error("signature can't be null");
		} else {
			if (this.#pubKey === null) {
				throw new Error("pubKey can't be null");
			} else {
				if (!Crypto.Ed25519.verify(this.#signature, msg, this.#pubKey)) {
					throw new Error("incorrect signature");
				}
			}
		}
	}
}

class Redeemer extends CborData {
	/** @type {UplcData} */
	#data;

	/** @type {Cost} */
	#exUnits;

	/**
	 * @param {UplcData} data 
	 * @param {Cost} exUnits 
	 */
	constructor(data, exUnits = {mem: 0n, cpu: 0n}) {
		super();
		this.#data = data;
		this.#exUnits = exUnits;
	}

	/**
	 * @type {UplcData}
	 */
	get data() {
		return this.#data;
	}

	/**
	 * @type {bigint}
	 */
	get memCost() {
		return this.#exUnits.mem;
	}

	/**
	 * @type {bigint}
	 */
	get cpuCost() {
		return this.#exUnits.cpu;
	}

	/**
	 * type:
	 *   0 -> spending
	 *   1 -> minting 
	 *   2 -> certifying
	 *   3 -> rewarding
	 * @param {number} type 
	 * @param {number} index 
	 * @returns {number[]}
	 */
	toCborInternal(type, index) {
		return CborData.encodeTuple([
			CborData.encodeInteger(BigInt(type)),
			CborData.encodeInteger(BigInt(index)),
			this.#data.toCbor(),
			CborData.encodeTuple([
				CborData.encodeInteger(this.#exUnits.mem),
				CborData.encodeInteger(this.#exUnits.cpu),
			]),
		]);
	}

	/**
	 * @param {number[]} bytes 
	 * @returns {Redeemer}
	 */
	static fromCbor(bytes) {
		/** @type {?number} */
		let type = null;

		/** @type {?number} */
		let index = null;

		/** @type {?UplcData} */
		let data = null;

		/** @type {?Cost} */
		let cost = null;

		let n = CborData.decodeTuple(bytes, (i, fieldBytes) => {
			switch(i) {
				case 0:
					type = Number(CborData.decodeInteger(fieldBytes));
					break;
				case 1:
					index = Number(CborData.decodeInteger(fieldBytes));
					break;
				case 2:
					data = UplcData.fromCbor(fieldBytes);
					break;
				case 3: 
					/** @type {?bigint} */
					let mem = null;

					/** @type {?bigint} */
					let cpu = null;

					let m = CborData.decodeTuple(fieldBytes, (j, subFieldBytes) => {
						switch (j) {
							case 0:
								mem = CborData.decodeInteger(subFieldBytes);
								break;
							case 1:
								cpu = CborData.decodeInteger(subFieldBytes);
								break;
							default:
								throw new Error("unrecognized field");
						}
					});

					assert(m == 2);

					if (mem === null || cpu === null) {
						throw new Error("unexpected");
					} else {
						cost = {mem: mem, cpu: cpu};
					}
					break;
				default:
					throw new Error("unrecognized field");
			}
		});

		assert(n == 4);

		if (type === null || index === null || data === null || cost === null) {
			throw new Error("unexpected");
		} else {

			switch(type) {
				case 0:
					return new SpendingRedeemer(null, index, data, cost);
				case 1:
					return new MintingRedeemer(null, index, data, cost);
				default:
					throw new Error("unhandled redeemer type (Todo)");	
			}
		}
	}

	/**
	 * @returns {Object}
	 */
	dumpInternal() {
		return {
			data: this.#data.toString(),
			exUnits: {
				mem: this.#exUnits.mem.toString(),
				cpu: this.#exUnits.cpu.toString(),
			},
		}
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		throw new Error("not yet implemented");
	}

	/**
	 * @param {TxBody} body 
	 * @returns {ConstrData}
	 */
	toScriptPurposeData(body) {
		throw new Error("not yet implemented");
	}

	/**
	 * @param {TxBody} body 
	 */
	updateIndex(body) {
		throw new Error("not yet implemented");
	}

	/**
	 * @param {Cost} cost 
	 */
	setCost(cost) {
		this.#exUnits = cost;
	}

	/**
	 * @param {NetworkParams} networkParams 
	 * @returns {bigint}
	 */
	estimateFee(networkParams) {
		// this.#exUnits.mem and this.#exUnits can be 0 if we are estimating the fee for an initial balance
		
		let [memFee, cpuFee] = networkParams.exFeeParams;

		return BigInt(Math.ceil(Number(this.#exUnits.mem)*memFee + Number(this.#exUnits.cpu)*cpuFee));
	}
}

class SpendingRedeemer extends Redeemer {
	#input;
	#inputIndex;

	/**
	 * @param {?TxInput} input
	 * @param {number} inputIndex
	 * @param {UplcData} data 
	 * @param {Cost} exUnits 
	 */
	constructor(input, inputIndex, data, exUnits = {mem: 0n, cpu: 0n}) {
		super(data, exUnits);

		this.#input = input
		this.#inputIndex = inputIndex;
	}

	/**
	 * @type {number}
	 */
	get inputIndex() {
		return this.#inputIndex;
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return this.toCborInternal(0, this.#inputIndex);
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		let obj = super.dumpInternal();

		obj["type"] = 0;
		obj["typeName"] = "spending";
		obj["inputIndex"] = this.#inputIndex;

		return obj;
	}

	/**
	 * @param {TxBody} body 
	 * @returns {ConstrData}
	 */
	toScriptPurposeData(body) {
		return new ConstrData(1, [
			body.inputs[this.#inputIndex].toOutputIdData(),
		]);
	}

	/**
	 * @param {TxBody} body
	 */
	updateIndex(body) {
		if (this.#input == null) {
			throw new Error("input can't be null");
		} else {
			this.#inputIndex = body.inputs.findIndex(i => {
				return i.txId.eq(assertDefined(this.#input).txId) && (i.utxoIdx == assertDefined(this.#input).utxoIdx)
			});

			assert(this.#inputIndex != -1);
		}
	}
}

class MintingRedeemer extends Redeemer {
	#mph;
	#mphIndex;

	/**
	 * @param {?MintingPolicyHash} mph
	 * @param {number} mphIndex
	 * @param {UplcData} data
	 * @param {Cost} exUnits
	 */
	constructor(mph, mphIndex, data, exUnits = {mem: 0n, cpu: 0n}) {
		super(data, exUnits);

		this.#mph = mph;
		this.#mphIndex = mphIndex;
	}

	/**
	 * @type {number}
	 */
	get mphIndex() {
		return this.#mphIndex;
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return this.toCborInternal(1, this.#mphIndex);
	}

	/** 
	 * @returns {Object}
	 */
	dump() {
		let obj = super.dumpInternal();

		obj["type"] = 1;
		obj["typeName"] = "minting";
		obj["mphIndex"] = this.#mphIndex;

		return obj;
	}

	/**
	 * @param {TxBody} body 
	 * @returns {ConstrData}
	 */
	toScriptPurposeData(body) {
		let mph = body.minted.mintingPolicies[this.#mphIndex];

		return new ConstrData(0, [
			new ByteArrayData(mph.bytes),
		]);
	}

	/**
	 * @param {TxBody} body 
	 */
	updateIndex(body) {
		if (this.#mph === null) {
			throw new Error("can't have null mph at this point");
		} else {
			this.#mphIndex = body.minted.mintingPolicies.findIndex(mph => mph.eq(assertDefined(this.#mph)));

			assert(this.#mphIndex != -1);
		}
	}
}

/**
 * Inside helios this type is named OutputDatum in order to distinguish it from the user defined Datum,
 * but outside helios scripts there isn't much sense to keep using the name 'OutputDatum' instead of Datum
 */
export class Datum extends CborData {
	constructor() {
		super();
	}

	/**
	 * @param {number[]} bytes 
	 * @returns {Datum}
	 */
	static fromCbor(bytes) {
		/** @type {?number} */
		let type = null;

		/** @type {?Datum} */
		let res = null;

		let n = CborData.decodeTuple(bytes, (i, fieldBytes) => {
			switch(i) {
				case 0:
					type = Number(CborData.decodeInteger(fieldBytes));
					break;
				case 1:
					if (type == 0) {
						res = new HashedDatum(DatumHash.fromCbor(fieldBytes));
					} else if (type == 1) {
						assert(CborData.decodeTag(fieldBytes) == 24n);

						let dataBytes = CborData.decodeBytes(fieldBytes);
						let data = UplcData.fromCbor(dataBytes);

						res = new InlineDatum(data);
					}
					break;
				default:
					throw new Error("unrecognized field label");
			}
		});

		assert(n == 2);

		if (type === null || res === null) {
			throw new Error("unexpected");
		} else {
			return res;
		}
	}

	/**
	 * @param {UplcDataValue | UplcData} data
	 * @returns {HashedDatum}
	 */
	static hashed(data) {
		return HashedDatum.fromData(UplcDataValue.unwrap(data));
	}

	/**
	 * @param {UplcDataValue | UplcData} data
	 * @returns {InlineDatum}
	 */
	static inline(data) {
		return new InlineDatum(UplcDataValue.unwrap(data))
	}

	/**
	 * @returns {boolean}
	 */
	isInline() {
		throw new Error("not yet implemented");
	}

	/**
	 * @returns {boolean}
	 */
	isHashed() {
		throw new Error("not yet implemented");
	}

	/**
	 * @type {DatumHash}
	 */
	get hash() {
		throw new Error("not yet implemented");
	}

	/**
	 * @type {?UplcData}
	 */
	get data() {
		throw new Error("not yet implemented");
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		throw new Error("not yet implemented");
	}

	/**
	 * @returns {ConstrData}
	 */
	toData() {
		throw new Error("not yet implemented");
	}
}

/**
 * Inside helios this type is named OutputDatum::Hash in order to distinguish it from the user defined Datum,
 * but outside helios scripts there isn't much sense to keep using the name 'OutputDatum' instead of Datum
 */
export class HashedDatum extends Datum {
	/** @type {DatumHash} */
	#hash;

	/** @type {?UplcData} */
	#origData;

	/**
	 * @param {DatumHash} hash 
	 * @param {?UplcData} origData
	 */
	constructor(hash, origData = null) {
		super();
		this.#hash = hash;
		this.#origData = origData;

		if (this.#origData !== null) {
			assert(eq(this.#hash.bytes, Crypto.blake2b(this.#origData.toCbor())));
		}
	}

	/**
	 * @returns {boolean}
	 */
	isInline() {
		return false;
	}

	/**
	 * @returns {boolean}
	 */
	isHashed() {
		return true;
	}

	/**
	 * @type {DatumHash}
	 */
	get hash() {
		return this.#hash;
	}

	/**
	 * @type {?UplcData}
	 */
	get data() {
		return this.#origData;
	}

	/**
	 * Used by script context emulation
	 * @returns {ConstrData}
	 */
	toData() {
		return new ConstrData(1, [new ByteArrayData(this.#hash.bytes)]);
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return CborData.encodeTuple([
			CborData.encodeInteger(0n),
			this.#hash.toCbor(),
		]);
	}

	/**
	 * @param {UplcData} data 
	 * @returns {HashedDatum}
	 */
	static fromData(data) {
		return new HashedDatum(new Hash(Crypto.blake2b(data.toCbor())), data);
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		return {
			hash: this.#hash.dump(),
			cbor: this.#origData === null ? null : bytesToHex(this.#origData.toCbor()),
			schema: this.#origData === null ? null : JSON.parse(this.#origData.toSchemaJson())
		};
	}
}

/**
 * Inside helios this type is named OutputDatum::Inline in order to distinguish it from the user defined Datum,
 * but outside helios scripts there isn't much sense to keep using the name 'OutputDatum' instead of Datum
 */
class InlineDatum extends Datum {
	/** @type {UplcData} */
	#data;

	/**
	 * @param {UplcData} data
	 */
	constructor(data) {
		super();
		this.#data = data;
	}

	/**
	 * @returns {boolean}
	 */
	isInline() {
		return true;
	}

	/**
	 * @returns {boolean}
	 */
	isHashed() {
		return false;
	}

	/**
	 * @type {DatumHash}
	 */
	get hash() {
		return new DatumHash(Crypto.blake2b(this.#data.toCbor()));
	}

	/**
	 * @type {UplcData}
	 */
	get data() {
		return this.#data;
	}

	/**
	 * Used by script context emulation
	 * @returns {ConstrData}
	 */
	toData() {
		return new ConstrData(2, [this.#data]);
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return CborData.encodeTuple([
			CborData.encodeInteger(1n),
			CborData.encodeTag(24n).concat(CborData.encodeBytes(this.#data.toCbor()))
		]);
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		return {
			inlineCbor: bytesToHex(this.#data.toCbor()),
			inlineSchema: JSON.parse(this.#data.toSchemaJson())
		};
	}
}

/**
 * The inner 'any' is also Metadata, but jsdoc doesn't allow declaring recursive types
 * Metadata is essentially a JSON schema object
 * @typedef {{map: [any, any][]} | any[] | string | number} Metadata
 */

/**
 * @param {Metadata} metadata 
 * @returns {number[]}
 */
function encodeMetadata(metadata) {
	if (typeof metadata === 'string') {
		return CborData.encodeUtf8(metadata, true);
	} else if (typeof metadata === 'number') {
		assert(metadata % 1.0 == 0.0);

		return CborData.encodeInteger(BigInt(metadata));
	} else if (Array.isArray(metadata)) {
		return CborData.encodeDefList(metadata.map(item => encodeMetadata(item)));
	} else if (metadata instanceof Object && "map" in metadata && Object.keys(metadata).length == 1) {
		let pairs = metadata["map"];

		if (Array.isArray(pairs)) {
			return CborData.encodeMap(pairs.map(pair => {
				if (Array.isArray(pair) && pair.length == 2) {
					return [
						encodeMetadata(pair[0]),
						encodeMetadata(pair[1])
					];
				} else {
					throw new Error("invalid metadata schema");		
				}
			}));
		} else {
			throw new Error("invalid metadata schema");
		}
	} else {
		throw new Error("invalid metadata schema");
	}
}

/**
 * Shifts bytes to next Cbor element
 * @param {number[]} bytes 
 * @returns {Metadata}
 */
function decodeMetadata(bytes) {
	if (CborData.isUtf8(bytes)) {
		return CborData.decodeUtf8(bytes);
	} else if (CborData.isList(bytes)) {
		/**
		 * @type {Metadata[]}
		 */
		let items = [];

		CborData.decodeList(bytes, itemBytes => {
			items.push(decodeMetadata(itemBytes));
		});

		return items;
	} else if (CborData.isMap(bytes)) {
		/**
		 * @type {[Metadata, Metadata][]}
		 */
		let pairs = [];

		CborData.decodeMap(bytes, pairBytes => {
			pairs.push([
				decodeMetadata(pairBytes),
				decodeMetadata(pairBytes)
			]);
		});

		return {"map": pairs};
	} else {
		return Number(CborData.decodeInteger(bytes));
	}
}

class TxMetadata {
	/**
	 * @type {Object.<number, Metadata>} 
	 */
	#metadata;

	constructor() {
		this.#metadata = {};
	}

	/**
	 *
	 * @param {number} tag
	 * @param {Metadata} data
	 */
	add(tag, data) {
		this.#metadata[tag] = data;
	}

	/**
	 * @type {number[]}
	 */
	get keys() {
		return Object.keys(this.#metadata).map(key => parseInt(key)).sort();
	}

	/**
	 * @returns {Object}
	 */
	dump() {
		let obj = {};

		for (let key of this.keys) {
			obj[key] =this.#metadata[key];
		}

		return obj;
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		/**
		 * @type {[number[], number[]][]}
		 */
		const pairs = this.keys.map(key => [
			CborData.encodeInteger(BigInt(key)),
			encodeMetadata(this.#metadata[key])
		]);
		
		return CborData.encodeMap(pairs);
	}

	/**
	* Decodes a TxMetadata instance from Cbor
	* @param {number[]} data
	* @returns {TxMetadata}
	*/
	static fromCbor(data) {
		const txMetadata = new TxMetadata();

		CborData.decodeMap(data, (pairBytes) => {
			txMetadata.add(
				Number(CborData.decodeInteger(pairBytes)), 
				decodeMetadata(pairBytes)
			);
		});

		return txMetadata;
	}
}
