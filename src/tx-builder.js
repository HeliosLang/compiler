//@ts-check
// Tx types

import {
	config
} from "./config.js";

import {
    assert,
    assertDefined,
    bytesToHex,
    eq,
    hexToBytes
} from "./utils.js";

/**
 * @typedef {import("./utils.js").hexstring} hexstring
 */

import {
    Site,
    UserError
} from "./tokens.js";

import {
    Crypto
} from "./crypto.js";

/**
 * @typedef {import("./crypto.js").NumberGenerator} NumberGenerator
 */

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
	ByteArray,
    DatumHash,
	HeliosData,
	HInt,
    MintingPolicyHash,
	PubKey,
    PubKeyHash,
    StakeKeyHash,
    StakingValidatorHash,
    TxId,
	TxOutputId,
	ValidatorHash,
	Value
} from "./helios-data.js";

/**
 * @typedef {import("./helios-data.js").ByteArrayProps} ByteArrayProps
 */

/**
 * @typedef {import("./helios-data.js").HIntProps} HIntProps
 */

/**
 * @typedef {import("./helios-data.js").MintingPolicyHashProps} MintingPolicyHashProps
 */

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

import {
	NativeContext,
	NativeScript
} from "./native.js";

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
	 * @type {null | bigint | Date} 
	 */
	#validTo;

	/**
	 * Upon finalization the slot is calculated and stored in the body 
	 *  @type {null | bigint | Date} 
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
	 * @param {number[] | string} raw
	 * @returns {Tx}
	 */
	static fromCbor(raw) {
		let bytes = (typeof raw == "string") ? hexToBytes(raw) : raw;

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
	 * Used by bundler for macro finalization
	 * @param {UplcData} data
	 * @param {NetworkParams} networkParams
	 * @param {Address} changeAddress
	 * @param {UTxO[]} spareUtxos
	 * @param {{[name: string]: UplcProgram}} scripts
	 * @returns {Promise<Tx>}
	 */
	static async finalizeUplcData(data, networkParams, changeAddress, spareUtxos, scripts) {
		const fields = data.fields;

		assert(fields.length == 12);

		const inputs = fields[0].list.map(d => TxInput.fromUplcData(d));
		const refInputs = fields[1].list.map(d => TxInput.fromUplcData(d));
		const outputs = fields[2].list.map(d => TxOutput.fromUplcData(d));
		//txBody.#fee = Value.fromUplcData(fields[3]).lovelace.value;
		const minted = Value.fromUplcData(fields[4]).assets;
		//txBody.#dcerts = fields[5].list.map(d => DCert.fromUplcData(d));
		//txBody.#withdrawals = new Map(fields[6].map.map(([key, value]) => {
		//	return [Address.fromUplcData(key), value.int];
		//}));
		// validity
		const signers = fields[8].list.map(d => PubKeyHash.fromUplcData(d));
		const redeemers = fields[9].map.map(([key, value]) => {
			if (key.index == 1) {
				assert(key.fields.length == 1);
				const outputId = TxOutputId.fromUplcData(key.fields[0]);
				const i = inputs.findIndex(input => input.txId.eq(outputId.txId) && input.utxoIdx == outputId.utxoIdx);
				assert(i != -1);
				return new SpendingRedeemer(inputs[i], i, value);
			} else if (key.index == 0) {
				assert(key.fields.length == 1);
				const mph = MintingPolicyHash.fromUplcData(key.fields[0]);
				const i = minted.mintingPolicies.findIndex(m => m.eq(mph));
				assert(i != -1);
				return new MintingRedeemer(mph, i, value);
			} else {
				throw new Error("unhandled redeemer constr index");
			}
		});

		// build the tx from scratch
		const tx = new Tx();

		// TODO: automatically added any available scripts
		inputs.forEach((input, i) => {
			const redeemer = redeemers.find(r => (r instanceof SpendingRedeemer) && r.inputIndex == i) ?? null;

			if (redeemer instanceof SpendingRedeemer) {
				tx.addInput(input.utxo, redeemer.data);

				if (input.address.validatorHash) {
					if  (input.address.validatorHash.hex in scripts) {
						tx.attachScript(scripts[input.address.validatorHash.hex]);
					} else {
						throw new Error(`script for SpendingRedeemer (vh:${input.address.validatorHash.hex}) not found in ${Object.keys(scripts)}`);
					}
				} else {
					throw new Error("unexpected (expected a validator address");
				}
			} else {
				assert(redeemer === null);
				tx.addInput(input.utxo);
			}
		});

		refInputs.forEach(refInput => {
			tx.addRefInput(new TxRefInput(refInput.txId, refInput.utxoIdx, refInput.origOutput));
		});

		// filter out spareUtxos that are already used as inputs
		spareUtxos = spareUtxos.filter(utxo => {
			return inputs.every(input => !input.eq(utxo)) && 
				refInputs.every(input => !input.eq(utxo));
		});

		outputs.forEach(output => {
			tx.addOutput(output);
		});

		minted.mintingPolicies.forEach((mph, i) => {
			const redeemer = redeemers.find(r => (r instanceof MintingRedeemer) && r.mphIndex == i) ?? null;

			if (redeemer instanceof MintingRedeemer) {
				tx.mintTokens(mph, minted.getTokens(mph), redeemer.data);

				if (mph.hex in scripts) {
					tx.attachScript(scripts[mph.hex]);
				} else {
					throw new Error(`policy for mph ${mph.hex} not found in ${Object.keys(scripts)}`);
				}
			} else {
				throw new Error("missing MintingRedeemer");
			}
		});

		signers.forEach(pk => {
			tx.addSigner(pk);
		});

		return await tx.finalize(networkParams, changeAddress, spareUtxos);
	}

	/**
	 * @param {NetworkParams} networkParams
	 * @returns {UplcData}
	 */
	toTxData(networkParams) {
		return this.#body.toTxData(networkParams, this.witnesses.redeemers, this.witnesses.datums, this.id());
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
	 * @param {bigint | Date } slotOrTime
	 * @returns {Tx}
	 */
	validFrom(slotOrTime) {
		assert(!this.#valid);

		this.#validFrom = slotOrTime;

		return this;
	}

	/**
	 * @param {bigint | Date } slotOrTime
	 * @returns {Tx}
	 */
	validTo(slotOrTime) {
		assert(!this.#valid);

		this.#validTo = slotOrTime;

		return this;
	}

	/**
	 * Throws error if assets of given mph are already being minted in this transaction
	 * @param {MintingPolicyHash | MintingPolicyHashProps} mph 
	 * @param {[ByteArray | ByteArrayProps, HInt | HIntProps][]} tokens - list of pairs of [tokenName, quantity], tokenName can be list of bytes or hex-string
	 * @param {UplcDataValue | UplcData | null} redeemer
	 * @returns {Tx}
	 */
	mintTokens(mph, tokens, redeemer) {
		const mph_ = MintingPolicyHash.fromProps(mph);

		assert(!this.#valid);

		this.#body.addMint(mph_, tokens);

		if (!redeemer) {
			if (!this.#witnesses.isNativeScript(mph_)) {
				throw new Error("no redeemer specified for minted tokens (hint: if this policy is a NativeScript, attach that script before calling tx.mintTokens())");
			}
		} else {
			this.#witnesses.addMintingRedeemer(mph_, UplcDataValue.unwrap(redeemer));
		}
		

		return this;
	}

	/**
	 * @param {UTxO} input
	 * @param {null | UplcDataValue | UplcData | HeliosData} rawRedeemer
	 * @returns {Tx}
	 */
	addInput(input, rawRedeemer = null) {
		assert(!this.#valid);

		if (input.origOutput === null) {
			throw new Error("TxInput.origOutput must be set when building transaction");
		} else {
			void this.#body.addInput(input.asTxInput);

			if (rawRedeemer !== null) {
				assert(input.origOutput.address.validatorHash !== null, "input isn't locked by a script");

				const redeemer = rawRedeemer instanceof HeliosData ? rawRedeemer._toUplcData() : UplcDataValue.unwrap(rawRedeemer);

				this.#witnesses.addSpendingRedeemer(input.asTxInput, redeemer);

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
				if (input.origOutput.address.pubKeyHash === null) {
					if (!this.#witnesses.isNativeScript(assertDefined(input.origOutput.address.validatorHash))) {
						throw new Error("input is locked by a script, but redeemer isn't specified (hint: if this is a NativeScript, attach that script before calling tx.addInput())");
					}
				}
			}
		}

		return this;
	}

	/**
	 * @param {UTxO[]} inputs
	 * @param {?(UplcDataValue | UplcData | HeliosData)} redeemer
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
			this.#witnesses.attachPlutusScript(refScript, true);
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
	 * @param {UplcProgram | NativeScript} program
	 * @returns {Tx}
	 */
	attachScript(program) {
		assert(!this.#valid);

		if (program instanceof NativeScript) { 
			this.#witnesses.attachNativeScript(program);
		} else {
			this.#witnesses.attachPlutusScript(program);
		}

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

		/**
		 * @type {Set<hexstring>}
		 */
		const currentScripts = new Set();

		scripts.forEach(script => {
			currentScripts.add(bytesToHex(script.hash()))
		})

		/** 
		 * @type {Map<string, number>} 
		 */
		let wantedScripts = new Map();

		this.#body.collectScriptHashes(wantedScripts);

		if (wantedScripts.size < scripts.length) {
			throw new Error("too many scripts included, not all are needed");
		} else if (wantedScripts.size > scripts.length) {
			wantedScripts.forEach((value, key) => {
				if (!currentScripts.has(key)) {
					if (value >= 0) {
						console.error(JSON.stringify(this.dump(), null, "  "));
						throw new Error(`missing script for input ${value}`);
					} else if (value < 0) {
						console.error(JSON.stringify(this.dump(), null, "  "));
						throw new Error(`missing script for minting policy ${-value-1}`);
					}
				}
			});
		}

		currentScripts.forEach((key) => {
			if (!wantedScripts.has(key)) {
				console.log(wantedScripts, currentScripts)
				throw new Error("detected unused script");
			}
		});
	}

	/**
	 * @param {NetworkParams} networkParams 
	 * @param {Address} changeAddress
	 * @returns {Promise<void>}
	 */
	async executeRedeemers(networkParams, changeAddress) {
		await this.#witnesses.executeScripts(networkParams, this.#body, changeAddress);
	}

	/**
	 * @param {NetworkParams} networkParams 
	 * @returns {Promise<void>}
	 */
	async checkExecutionBudgets(networkParams) {
		await this.#witnesses.checkExecutionBudgets(networkParams, this.#body);
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
	 * Calculate the base fee which will be multiplied by the required min collateral percentage 
	 * @param {NetworkParams} networkParams 
	 * @param {Address} changeAddress 
	 * @param {UTxO[]} spareUtxos 
	 */
	estimateCollateralBaseFee(networkParams, changeAddress, spareUtxos) {
		assert(config.N_DUMMY_INPUTS == 1 || config.N_DUMMY_INPUTS == 2, "expected N_DUMMY_INPUTs == 1 or N_DUMMY_INPUTS == 2");

		// create the collateral return output (might not actually be added if there isn't enough lovelace)
		const dummyOutput = new TxOutput(changeAddress, new Value(0n));
		dummyOutput.correctLovelace(networkParams);

		// some dummy UTxOs on to be able to correctly calculate the collateral (assuming it uses full body fee)
		const dummyCollateral = spareUtxos.map(spare => spare.asTxInput).concat(this.#body.inputs).slice(0, 3);
		dummyCollateral.forEach(input => {
			this.#body.collateral.push(input);
		});

		const dummyInputs = dummyCollateral.slice(0, config.N_DUMMY_INPUTS);

		this.#body.setCollateralReturn(dummyOutput);
		dummyInputs.forEach(dummyInput => this.#body.addInput(dummyInput, false));
		this.#body.addOutput(dummyOutput);

		const baseFee = this.estimateFee(networkParams);

		// remove the dummy inputs and outputs
		while(this.#body.collateral.length) {
			this.#body.collateral.pop();
		}
		this.#body.setCollateralReturn(null);
		dummyInputs.forEach(dummyInput => this.#body.removeInput(dummyInput));
		this.#body.removeOutput(dummyOutput);

		return baseFee;
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

		const baseFee = this.estimateCollateralBaseFee(networkParams, changeAddress, spareUtxos);

		const minCollateral = ((baseFee*BigInt(networkParams.minCollateralPct)) + 100n)/100n; // integer division that rounds up

		let collateral = 0n;
		/**
		 * @type {TxInput[]}
		 */
		const collateralInputs = [];

		/**
		 * @param {TxInput[]} inputs 
		 */
		function addCollateralInputs(inputs) {
			// first try using the UTxOs that already form the inputs, but are locked at script
			const cleanInputs = inputs.filter(utxo => (!utxo.address.validatorHash) && utxo.value.assets.isZero()).sort((a, b) => Number(a.value.lovelace - b.value.lovelace));

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
		
		addCollateralInputs(this.#body.inputs.slice());

		addCollateralInputs(spareUtxos.map(utxo => utxo.asTxInput));

		// create the collateral return output if there is enough lovelace
		const changeOutput = new TxOutput(changeAddress, new Value(0n));
		changeOutput.correctLovelace(networkParams);

		if (collateral < minCollateral) {
			throw new Error("unable to find enough collateral input");
		} else {
			if (collateral > minCollateral + changeOutput.value.lovelace) {
				changeOutput.setValue(new Value(0n));

				changeOutput.correctLovelace(networkParams);

				if (collateral > minCollateral + changeOutput.value.lovelace) {
					changeOutput.setValue(new Value(collateral - minCollateral));
					this.#body.setCollateralReturn(changeOutput);
				} else {
					console.log(`not setting collateral return: collateral input too low (${collateral})`);
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
		// don't include the changeOutput in this value
		let nonChangeOutputValue = this.#body.sumOutputValue();

		// assume a change output is always needed
		const changeOutput = new TxOutput(changeAddress, new Value(0n));

		changeOutput.correctLovelace(networkParams);

		this.#body.addOutput(changeOutput);
		
		const minLovelace = changeOutput.value.lovelace;

		let fee = this.setFee(networkParams, this.estimateFee(networkParams));
		
		let inputValue = this.#body.sumInputAndMintedValue();

		let feeValue = new Value(fee);

		nonChangeOutputValue = feeValue.add(nonChangeOutputValue);

		spareUtxos = spareUtxos.filter(utxo => utxo.value.assets.isZero());
		
		// use some spareUtxos if the inputValue doesn't cover the outputs and fees

		while (!inputValue.ge(nonChangeOutputValue.add(changeOutput.value))) {
			let spare = spareUtxos.pop();

			if (spare === undefined) {
				throw new Error("transaction doesn't have enough inputs to cover the outputs + fees + minLovelace");
			} else {
				this.#body.addInput(spare.asTxInput);

				inputValue = inputValue.add(spare.value);
			}
		}

		// use to the exact diff, which is >= minLovelace
		let diff = inputValue.sub(nonChangeOutputValue);

		assert(diff.assets.isZero(), "unexpected unbalanced assets");
		assert(diff.lovelace >= minLovelace, `diff.lovelace=${diff.lovelace} ${typeof diff.lovelace} vs minLovelace=${minLovelace} ${typeof minLovelace}`);

		changeOutput.setValue(diff);

		// we can mutate the lovelace value of 'changeOutput' until we have a balanced transaction with precisely the right fee

		let oldFee = fee;
		fee = this.estimateFee(networkParams);

		while (fee != oldFee) {
			this.#body.setFee(fee);

			let diffFee = fee - oldFee;

			// use some more spareUtxos
			while (diffFee  > (changeOutput.value.lovelace - minLovelace)) {
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

			// changeOutput.value.lovelace should still be >= minLovelace at this point

			oldFee = fee;

			fee = this.estimateFee(networkParams);
		}
	}

	/**
	 * Shouldn't be used directly
	 * @param {NetworkParams} networkParams
	 */
	syncScriptDataHash(networkParams) {
		const hash = this.#witnesses.calcScriptDataHash(networkParams);

		this.#body.setScriptDataHash(hash);
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

			// only use the exBudget 

			const fee = this.#body.fee;

			this.#body.checkCollateral(networkParams, BigInt(Math.ceil(minCollateralPct*Number(fee)/100.0)));
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
	 * @param {NetworkParams} networkParams 
	 */
	finalizeValidityTimeRange(networkParams) {
		if (this.#witnesses.anyScriptCallsTxTimeRange() && this.#validFrom === null && this.#validTo === null) {
			const now = new Date();
			const currentSlot = networkParams.liveSlot;

			if (config.VALIDITY_RANGE_START_OFFSET !== null) {
				if (currentSlot !== null) {
					this.#validFrom = currentSlot;
				} else {
					this.#validFrom = new Date(now.getTime() - 1000*config.VALIDITY_RANGE_START_OFFSET);
				}
			}

			if (config.VALIDITY_RANGE_END_OFFSET !== null) {
				if (currentSlot !== null) {
					this.#validTo = currentSlot+1n;
				} else {
					this.#validTo = new Date(now.getTime() + 1000*config.VALIDITY_RANGE_END_OFFSET);
				}
			}

			if (!config.AUTO_SET_VALIDITY_RANGE) {
				console.error("Warning: validity interval is unset but detected usage of tx.time_range in one of the scripts.\nSetting the tx validity interval to a sane default\m(hint: set helios.config.AUTO_SET_VALIDITY_RANGE to true to avoid this warning)");
			}
		}

		if (this.#validTo !== null) {
			this.#body.validTo(
				(typeof this.#validTo === "bigint") ? 
					this.#validTo : 
					networkParams.timeToSlot(BigInt(this.#validTo.getTime()))
			);
		}

		if (this.#validFrom !== null) {
			this.#body.validFrom(
				(typeof this.#validFrom === "bigint") ?
					this.#validFrom :
					networkParams.timeToSlot(BigInt(this.#validFrom.getTime()))
			);
		}
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

		// initially dummy for more correct body size, recalculated later
		if (this.#witnesses.redeemers.length > 0) {
			this.#body.setScriptDataHash(new Hash((new Array(32)).fill(0)));
		}

		// auto set the validity time range if the script call tx.time_range
		//  and translate the time range dates to slots
		this.finalizeValidityTimeRange(networkParams);

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
		await this.executeRedeemers(networkParams, changeAddress);

		// balance collateral (if collateral wasn't already set manually)
		this.balanceCollateral(networkParams, changeAddress, spareUtxos.slice());

		// balance the lovelace
		this.balanceLovelace(networkParams, changeAddress, spareUtxos.slice());

		// run updateRedeemerIndices again because new inputs may have been added and sorted
		this.#witnesses.updateRedeemerIndices(this.#body);

		// we can only sync scriptDataHash after the redeemer execution costs have been estimated, and final redeemer indices have been determined
		this.syncScriptDataHash(networkParams);

		// a bunch of checks
		this.#body.checkOutputs(networkParams);

		this.checkCollateral(networkParams);

		await this.checkExecutionBudgets(networkParams);

		this.#witnesses.checkExecutionBudgetLimits(networkParams);

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

	/** @type {null | bigint} */
	#lastValidSlot;

	/** @type {DCert[]} */
	#dcerts;

	/**
	 * Withdrawals must be sorted by address
	 * Stake rewarding redeemers must point to the sorted withdrawals
	 * @type {Map<Address, bigint>} 
	 */
	#withdrawals;

	/** @type {null | bigint} */
	#firstValidSlot;

	/**
	 * Internally the assets must be sorted by mintingpolicyhash
	 * Minting redeemers must point to the sorted minted assets
	 * @type {Assets} 
	 */
	#minted;

	/** @type {null | Hash} */
	#scriptDataHash;

	/** @type {TxInput[]} */
	#collateral;

	/** @type {PubKeyHash[]} */
	#signers;

	/** @type {null | TxOutput} */
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
		this.#dcerts = [];
		this.#withdrawals = new Map();
		this.#firstValidSlot = null;
		this.#minted = new Assets(); // starts as zero value (i.e. empty map)
		this.#scriptDataHash = null; 
		this.#collateral = [];
		this.#signers = [];
		this.#collateralReturn = null;
		this.#totalCollateral = 0n; // doesn't seem to be used anymore
		this.#refInputs = [];
		this.#metadataHash = null;
	}

	/**
	 * @type {TxInput[]}
	 */
	get inputs() {
		return this.#inputs;
	}

	/**
	 * @type {TxOutput[]}
	 */
	get outputs() {
		return this.#outputs;
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
	 * @type {bigint | null}
	 */
	get firstValidSlot() {
		return this.#firstValidSlot;
	}

	/**
	 * @type {bigint | null}
	 */
	get lastValidSlot() {
		return this.#lastValidSlot;
	}

	/**
	 * @type {PubKeyHash[]}
	 */
	get signers() {
		return this.#signers.slice();
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

		if (this.#dcerts.length != 0) {
			object.set(4, CborData.encodeDefList(this.#dcerts));
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
		const txBody = new TxBody();

		const done = CborData.decodeObject(bytes, (i, fieldBytes) => {
			switch(i) {
				case 0:
					CborData.decodeList(fieldBytes, (_, itemBytes) => {
						txBody.#inputs.push(TxInput.fromCbor(itemBytes));
					});
					break;
				case 1:
					CborData.decodeList(fieldBytes, (_, itemBytes) => {
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
					CborData.decodeList(fieldBytes, (_, itemBytes) => {
						txBody.#dcerts.push(DCert.fromCbor(itemBytes));
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
					CborData.decodeList(fieldBytes, (_, itemBytes) => {
						txBody.#collateral.push(TxInput.fromCbor(itemBytes));
					});
					break;
				case 14:
					CborData.decodeList(fieldBytes, (_, itemBytes) => {
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
			collateralReturn: this.#collateralReturn === null ? null : this.#collateralReturn.dump(),
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
				new ConstrData(0, []), // false
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
			new ListData(this.#dcerts.map(cert => cert.toData())),
			new MapData(Array.from(this.#withdrawals.entries()).map(w => [w[0].toStakingData(), new IntData(w[1])])),
			this.toValidTimeRangeData(networkParams),
			new ListData(this.#signers.map(rs => new ByteArrayData(rs.bytes))),
			new MapData(redeemers.map(r => [r.toScriptPurposeData(this), r.data])),
			new MapData(datums.list.map(d => [
				new ByteArrayData(Crypto.blake2b(d.toCbor())), 
				d
			])),
			new ConstrData(0, [new ByteArrayData(txId.bytes)])
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
	 * @param {MintingPolicyHash | MintingPolicyHashProps} mph - minting policy hash
	 * @param {[ByteArray | ByteArrayProps, HInt | HIntProps][]} tokens
	 */
	addMint(mph, tokens) {
		this.#minted.addTokens(mph, tokens);
	}

	/**
	 * @param {TxInput} input 
	 * @param {boolean} checkUniqueness
	 */
	addInput(input, checkUniqueness = true) {
		if (input.origOutput === null) {
			throw new Error("TxInput.origOutput must be set when building transaction");
		}

		input.origOutput.value.assertAllPositive();

		if (checkUniqueness) {
			assert(this.#inputs.every(prevInput => {
				return  !prevInput.txId.eq(input.txId) || prevInput.utxoIdx != input.utxoIdx
			}), "input already added before");
		}

		// push, then sort immediately
		this.#inputs.push(input);
		this.#inputs.sort(TxInput.comp);
	}

	/**
	 * Used to remove dummy inputs
	 * Dummy inputs are needed to be able to correctly estimate fees
	 * Throws an error if input doesn't exist in list of inputs
	 * Internal use only!
	 * @param {TxInput} input
	 */
	removeInput(input) {
		let idx = -1;

		// search from end, so removal is exact inverse of addition
		for (let i = this.#inputs.length - 1; i >= 0; i--) {
			if (this.#inputs[i] == input) {
				idx = i;
				break;
			}
		}

		const n = this.#inputs.length;

		assert(idx != -1, "input not found");

		this.#inputs = this.#inputs.filter((_, i) => i != idx);

		assert(this.#inputs.length == n - 1, "input not removed");
	}

	/**
	 * @param {TxInput} input 
	 * @param {boolean} checkUniqueness
	 */
	addRefInput(input, checkUniqueness = true) {
		if (input.origOutput === null) {
			throw new Error("TxInput.origOutput must be set when building transaction");
		}

		input.origOutput.value.assertAllPositive();

		if (checkUniqueness) {
			assert(this.#refInputs.every(prevInput => {
				return  !prevInput.txId.eq(input.txId) || prevInput.utxoIdx != input.utxoIdx
			}), "refInput already added before");
		}

		// push, then sort immediately
		this.#refInputs.push(input);
		this.#refInputs.sort(TxInput.comp);
	}

	/**
	 * @param {TxOutput} output
	 */
	addOutput(output) {
		output.value.assertAllPositive();

		this.#outputs.push(output);
	}

	/**
	 * Used to remove dummy outputs
	 * Dummy outputs are needed to be able to correctly estimate fees
	 * Throws an error if the output doesn't exist in list of outputs
	 * Internal use only!
	 * @param {TxOutput} output 
	 */
	removeOutput(output) {
		let idx = -1;

		// search from end, so removal is exact inverse of addition
		for (let i = this.#outputs.length - 1; i >= 0; i--) {
			if (this.#outputs[i] == output) {
				idx = i;
				break;
			}
		}

		const n = this.#outputs.length;

		assert(idx != -1, "output not found");

		this.#outputs = this.#outputs.filter((_, i) => i != idx);

		assert(this.#outputs.length == n - 1, "output not removed");
	}

	/**
	 * @param {PubKeyHash} hash 
	 * @param {boolean} checkUniqueness
	 */
	addSigner(hash, checkUniqueness = true) {
		if (checkUniqueness) {
			assert(this.#signers.every(prevSigner => {
				return  !prevSigner.eq(hash);
			}), "signer already added before");
		}


		this.#signers.push(hash);
		this.#signers.sort(Hash.compare);
	}

	/**
	 * @param {TxInput} input 
	 */
	addCollateral(input) {
		this.#collateral.push(input);
	}
	
	/**
	 * @param {Hash | null} scriptDataHash
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
	 * @param {TxOutput | null} output 
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
	 * @param {Map<hexstring, number>} set - hashes in hex format
	 */
	collectScriptHashes(set) {
		for (let i = 0; i < this.#inputs.length; i++) {
			const input = this.#inputs[i];

			if (input.origOutput !== null) {
				let scriptHash = input.origOutput.address.validatorHash;

				if (scriptHash !== null) {
					const hash = bytesToHex(scriptHash.bytes);

					if (!set.has(hash)) { 
						set.set(hash, i);
					}
				}
			}
		}

		let mphs = this.#minted.mintingPolicies;

		for (let i = 0; i < mphs.length; i++) {
			const mph = mphs[i];

			const hash = bytesToHex(mph.bytes);

			if (!set.has(hash)) {
				set.set(hash, -i-1);
			}
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
	 * @param {null | bigint} minCollateral 
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
		// inputs should've been added in sorted manner, so this is just a check
		this.#inputs.forEach((input, i) => {
			if (i > 0) {
				const prev = this.#inputs[i-1];

				// can be less than -1 if utxoIds aren't consecutive
				assert(TxInput.comp(prev, input) <= -1, "inputs not sorted");
			}
		});

		// same for ref inputs
		this.#refInputs.forEach((input, i) => {
			if (i > 0) {
				const prev = this.#refInputs[i-1];

				// can be less than -1 if utxoIds aren't consecutive
				assert(TxInput.comp(prev, input) <= -1, "refInputs not sorted");
			}
		});

		// TODO: also add withdrawals in sorted manner
		this.#withdrawals = new Map(Array.from(this.#withdrawals.entries()).sort((a, b) => {
			return Address.compStakingHashes(a[0], b[0]);
		}));

		// minted assets should've been added in sorted manner, so this is just a check
		this.#minted.assertSorted();
	}

	/**
	 * Used by (indirectly) by emulator to check if slot range is valid.
	 * Note: firstValidSlot == lastValidSlot is allowed
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

	/** @type {NativeScript[]} */
	#nativeScripts;

	constructor() {
		super();
		this.#signatures = [];
		this.#datums = new ListData([]);
		this.#redeemers = [];
		this.#scripts = []; // always plutus v2
		this.#refScripts = [];
		this.#nativeScripts = [];
	}

	/**
	 * @type {Signature[]}
	 */
	get signatures() {
		return this.#signatures;
	}

	/**
	 * Returns all the scripts, including the reference scripts
	 * @type {(UplcProgram | NativeScript)[]}
	 */
	get scripts() {
		/**
		 * @type {(UplcProgram | NativeScript)[]}
		 */
		let allScripts = this.#scripts.slice().concat(this.#refScripts.slice())
		
		allScripts = allScripts.concat(this.#nativeScripts.slice());

		return allScripts;
	}

	/**
	 * @type {Redeemer[]}
	 */
	get redeemers() {
		return this.#redeemers;
	}

	/**
	 * @type {ListData}
	 */
	get datums() {
		return this.#datums;
	}

	/**
	 * @param {ValidatorHash | MintingPolicyHash} h 
	 * @returns {boolean}
	 */
	isNativeScript(h) {
		return this.#nativeScripts.some(s => eq(s.hash(), h.bytes));
	}

	/**
	 * @returns {boolean}
	 */
	anyScriptCallsTxTimeRange() {
		return this.scripts.some(s => (s instanceof UplcProgram) && s.properties.callsTxTimeRange);
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		/**
		 * @type {Map<number, number[]>}
		 */
		let object = new Map();

		if (this.#signatures.length > 0) {
			object.set(0, CborData.encodeDefList(this.#signatures));
		}
		
		if (this.#nativeScripts.length > 0) {
			object.set(1, CborData.encodeDefList(this.#nativeScripts));
		}

		if (this.#datums.list.length > 0) {
			object.set(4, this.#datums.toCbor());
		}

		if (this.#redeemers.length > 0) {
			object.set(5, CborData.encodeDefList(this.#redeemers));
		}

		if (this.#scripts.length > 0) {
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
					CborData.decodeList(fieldBytes, (_, itemBytes) => {
						txWitnesses.#signatures.push(Signature.fromCbor(itemBytes));
					});
					break;
				case 1:
					CborData.decodeList(fieldBytes, (_, itemBytes) => {
						txWitnesses.#nativeScripts.push(NativeScript.fromCbor(itemBytes));
					});
					break;
				case 2:
				case 3:
					throw new Error(`unhandled TxWitnesses field ${i}`);
				case 4:
					txWitnesses.#datums = ListData.fromCbor(fieldBytes);
					break;
				case 5:
					CborData.decodeList(fieldBytes, (_, itemBytes) => {
						txWitnesses.#redeemers.push(Redeemer.fromCbor(itemBytes));
					});
					break;
				case 6:
					CborData.decodeList(fieldBytes, (_, itemBytes) => {
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
			nativeScripts: this.#nativeScripts.map(script => script.toJson()),
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
	 * @param {NativeScript} script 
	 */
	attachNativeScript(script) {
		const h = script.hash();

		if (this.#nativeScripts.some(other => eq(h, other.hash()))) {
			return;
		} else {
			this.#nativeScripts.push(script);
		}
	}

	/**
	 * Throws error if script was already added before
	 * @param {UplcProgram} program 
	 * @param {boolean} isRef
	 */
	attachPlutusScript(program, isRef = false) {
		const h = program.hash();

		if (isRef) {
			assert(this.#scripts.every(s => !eq(s.hash(), h)));

			if (this.#refScripts.some(s => eq(s.hash(), h))) {
				return;
			} else {
				this.#refScripts.push(program);
			}
		} else {
			assert(this.#refScripts.every(s => !eq(s.hash(), h)));

			if (this.#scripts.some(s => eq(s.hash(), h))) {
				return;
			} else {
				this.#scripts.push(program);
			}
		}
	}

	/**
	 * Retrieves either a regular script or a reference script
	 * @param {Hash} scriptHash - can be ValidatorHash or MintingPolicyHash
	 * @returns {UplcProgram}
	 */
	getUplcProgram(scriptHash) {
		const p = this.scripts.find(s => eq(s.hash(), scriptHash.bytes));

		if (!(p instanceof UplcProgram)) {
			throw new Error("not a uplc program");
		}

		return p;
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
	 * @returns {Hash | null} - returns null if there are no redeemers
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
	 * 
	 * @param {NetworkParams} networkParams 
	 * @param {TxBody} body
	 * @param {Redeemer} redeemer 
	 * @param {UplcData} scriptContext
	 * @returns {Promise<Cost>} 
	 */
	async executeRedeemer(networkParams, body, redeemer, scriptContext) {
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
					const script = this.getUplcProgram(validatorHash);

					const args = [
						new UplcDataValue(Site.dummy(), datumData), 
						new UplcDataValue(Site.dummy(), redeemer.data), 
						new UplcDataValue(Site.dummy(), scriptContext),
					];

					const profile = await script.profile(args, networkParams);

					profile.messages.forEach(m => console.log(m));

					if (profile.result instanceof UserError) {	
						profile.result.context["Datum"] = bytesToHex(datumData.toCbor());
						profile.result.context["Redeemer"] = bytesToHex(redeemer.data.toCbor());
						profile.result.context["ScriptContext"] = bytesToHex(scriptContext.toCbor());
						throw profile.result;
					} else {
						return {mem: profile.mem, cpu: profile.cpu};
					}
				}
			}
		} else if (redeemer instanceof MintingRedeemer) {
			const mph = body.minted.mintingPolicies[redeemer.mphIndex];

			const script = this.getUplcProgram(mph);

			const args = [
				new UplcDataValue(Site.dummy(), redeemer.data),
				new UplcDataValue(Site.dummy(), scriptContext),
			];

			const profile = await script.profile(args, networkParams);

			profile.messages.forEach(m => console.log(m));

			if (profile.result instanceof UserError) {
				profile.result.context["Redeemer"] = bytesToHex(redeemer.data.toCbor());
				profile.result.context["ScriptContext"] = bytesToHex(scriptContext.toCbor());
				throw profile.result;
			} else {
				return {mem: profile.mem, cpu: profile.cpu};
			}
		} else {
			throw new Error("unhandled redeemer type");
		}
	}

	/**
	 * Executes the redeemers in order to calculate the necessary ex units
	 * @param {NetworkParams} networkParams 
	 * @param {TxBody} body - needed in order to create correct ScriptContexts
	 * @param {Address} changeAddress - needed for dummy input and dummy output
	 * @returns {Promise<void>}
	 */
	async executeScripts(networkParams, body, changeAddress) {
		await this.executeRedeemers(networkParams, body, changeAddress);

		this.executeNativeScripts(body);
	}
	
	/**
	 * @param {TxBody} body
	 */
	executeNativeScripts(body) {
		const ctx = new NativeContext(body.firstValidSlot, body.lastValidSlot, body.signers);

		this.#nativeScripts.forEach(s => {
			if (!s.eval(ctx)) {
				throw new Error("native script execution returned false");
			}
		});
	}

	/**
	 * Executes the redeemers in order to calculate the necessary ex units
	 * @param {NetworkParams} networkParams 
	 * @param {TxBody} body - needed in order to create correct ScriptContexts
	 * @param {Address} changeAddress - needed for dummy input and dummy output
	 * @returns {Promise<void>}
	 */
	async executeRedeemers(networkParams, body, changeAddress) {
		assert(config.N_DUMMY_INPUTS == 1 || config.N_DUMMY_INPUTS == 2, "expected N_DUMMY_INPUTS==1 or N_DUMMY_INPUTS==2");
		const twoDummyInputs = config.N_DUMMY_INPUTS == 2;

		const fee = networkParams.maxTxFee;

		// Additional 2 dummy inputs and 1 dummy output to compensate for balancing inputs and outputs that might be added later
		// The reason for needing 2 dummy inputs is that one needs to be at the beginning of the body.inputs list (TxId 0000...), and the other needs TxId ffffff (at the end of the list)
		// TxId ffffff overestimates the cost of printing the TxIds, and the dummy TxId 00000 overestimates iterating over body.inputs
		// We can't just prepend a dummy input with TxId ffffff, because some scripts might be relying on the order of the inputs (eg. counting votes in DAOs)

		// 1000 ADA should be enough as a dummy input/output
		const dummyInput1 = new TxInput(
			TxId.dummy(0),
			0n,
			new TxOutput(
				changeAddress,
				new Value(fee + 1000_000_000n)
			)
		);
		
		const dummyInput2 = new TxInput(
			TxId.dummy(255),
			999n,
			new TxOutput(
				changeAddress,
				new Value(1000_000_000n)
			)
		);

		const dummyOutput = new TxOutput(
			changeAddress,
			new Value(twoDummyInputs ? 2000_000_000n : 1000_000_000n)
		);

		body.setFee(fee);
		body.addInput(dummyInput1, false);
		if (twoDummyInputs) {
			body.addInput(dummyInput2, false);
		}
		body.addOutput(dummyOutput);

		this.updateRedeemerIndices(body);

		for (let i = 0; i < this.#redeemers.length; i++) {
			const redeemer = this.#redeemers[i];

			const scriptContext = body.toScriptContextData(networkParams, this.#redeemers, this.#datums, i);

			const cost = await this.executeRedeemer(networkParams, body, redeemer, scriptContext);

			redeemer.setCost(cost);
		}

		body.removeInput(dummyInput1);
		if (twoDummyInputs) {
			body.removeInput(dummyInput2);
		}
		body.removeOutput(dummyOutput);

		this.updateRedeemerIndices(body);
	}

	/**
	 * Reruns all the redeemers to make sure the ex budgets are still correct (can change due to outputs added during rebalancing)
	 * @param {NetworkParams} networkParams 
	 * @param {TxBody} body 
	 */
	async checkExecutionBudgets(networkParams, body) {
		for (let i = 0; i < this.#redeemers.length; i++) {
			const redeemer = this.#redeemers[i];

			const scriptContext = body.toScriptContextData(networkParams, this.#redeemers, this.#datums, i);

			const cost = await this.executeRedeemer(networkParams, body, redeemer, scriptContext);

			if (redeemer.memCost < cost.mem) {
				throw new Error("internal finalization error, redeemer mem budget too low");
			} else if (redeemer.cpuCost < cost.cpu) {
				throw new Error("internal finalization error, redeemer cpu budget too low");
			}
		}
	}

	/**
	 * Throws error if execution budget is exceeded
	 * @param {NetworkParams} networkParams
	 */
	checkExecutionBudgetLimits(networkParams) {
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
export class TxInput extends CborData {
	/** 
	 * @type {TxId} 
	 */
	#txId;

	/** 
	 * @type {bigint} 
	 */
	#utxoIdx;

	/** 
	 * @type {null | TxOutput} 
	 */
	#origOutput;

	/**
	 * @param {TxId} txId 
	 * @param {number | bigint} utxoIdx 
	 * @param {null | TxOutput} origOutput - used during building, not part of serialization
	 */
	constructor(txId, utxoIdx, origOutput = null) {
		super();
		this.#txId = txId;
		this.#utxoIdx = BigInt(utxoIdx);
		this.#origOutput = origOutput;
	}
	
	/**
	 * @type {TxId}
	 */
	get txId() {
		return this.#txId;
	}

	/**
	 * @type {number}
	 */
	get utxoIdx() {
		return Number(this.#utxoIdx);
	}

	/**
	 * 
	 * @param {UTxO | TxInput} other 
	 * @returns {boolean}
	 */
	eq(other) {
		return other.txId.eq(this.txId) && other.utxoIdx == this.utxoIdx;
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
	 * @type {UTxO}
	 */
	get utxo() {
		if (this.#origOutput === null) {
			throw new Error("origOutput not set");
		} else {
			return new UTxO(this.#txId, this.#utxoIdx, this.#origOutput);
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
	 * @param {UplcData} data 
	 * @returns {TxInput}
	 */
	static fromUplcData(data) {
		assert(data.index == 0);
		const fields = data.fields;

		const outputId = TxOutputId.fromUplcData(fields[0]);

		return new TxInput(
			outputId.txId,
			outputId.utxoIdx,
			TxOutput.fromUplcData(fields[1])
		);
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
	 * @param {number | bigint} utxoIdx 
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
	 * @type {number}
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
	 * 
	 * @param {UTxO | TxInput} other 
	 * @returns {boolean}
	 */
	eq(other) {
		return other.txId.eq(this.txId) && other.utxoIdx == this.utxoIdx;
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

	/**
	 * @returns {any}
	 */
	dump() {
		return this.asTxInput.dump()
	}
}

export class TxRefInput extends TxInput {
	/**
	 * @param {TxId} txId 
	 * @param {number | bigint} utxoId
	 * @param {TxOutput} origOutput
	 */
	constructor(txId, utxoId, origOutput) {
		super(txId, utxoId, origOutput);
	}
}

export class TxOutput extends CborData {
	/** 
	 * @type {Address} 
	 */
	#address;

	/** 
	 * @type {Value} 
	 */
	#value;

	/** 
	 * @type {null | Datum} 
	 */
	#datum;

	/**
	 * @type {null | UplcProgram} 
	 */
	#refScript;

	/**
	 * @param {Address} address 
	 * @param {Value} value 
	 * @param {null | Datum} datum 
	 * @param {null | UplcProgram} refScript 
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
		if ((this.#datum === null || this.#datum instanceof HashedDatum) && this.#refScript === null && !config.STRICT_BABBAGE) {
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
		/** 
		 * @type {null | Address} 
		 */
		let address = null;

		/** 
		 * @type {null | Value} 
		 */
		let value = null;

		/** 
		 * @type {null | Datum} 
		 */
		let outputDatum = null;

		/** 
		 * @type {null | UplcProgram} 
		 */
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
	 * @param {UplcData} data 
	 * @returns {TxOutput}
	 */
	static fromUplcData(data) {
		assert(data.index == 0);
		assert(data.fields.length == 4);

		return new TxOutput(
			Address.fromUplcData(data.fields[0]),
			Value.fromUplcData(data.fields[1]),
			Datum.fromUplcData(data.fields[2])
		);
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
	 * @param {UplcData} data 
	 * @returns {DCert}
	 */
	static fromUplcData(data) {
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
export class StakeAddress {
	#bytes;

	/**
	 * @param {number[]} bytes 
	 */
	constructor(bytes) {
		assert(bytes.length == 29);

		this.#bytes = bytes;
	}

	/**
	 * @type {number[]}
	 */
	get bytes() {
		return this.#bytes;
	}

	/**
	 * @param {StakeAddress} sa
	 * @returns {boolean}
	 */
	static isForTestnet(sa) {
		return Address.isForTestnet(new Address(sa.bytes));
	}

	/**
	 * Convert regular Address into StakeAddress.
	 * Throws an error if the given Address doesn't have a staking part.
	 * @param {Address} addr 
	 * @returns {StakeAddress}
	 */
	static fromAddress(addr) {
		const sh = addr.stakingHash;

		if (sh === null) {
			throw new Error("address doesn't have a staking part");
		} else {
			return StakeAddress.fromHash(Address.isForTestnet(addr), sh);
		}
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return CborData.encodeBytes(this.#bytes);
	}

	/**
	 * @param {number[]} bytes
	 * @returns {StakeAddress}
	 */
	static fromCbor(bytes) {
		return new StakeAddress(CborData.decodeBytes(bytes));
	}

	/**
	 * @returns {string}
	 */
	toBech32() {
		return Crypto.encodeBech32(
			StakeAddress.isForTestnet(this) ? "stake_test" : "stake",
			this.bytes
		);
	}

	/**
	 * @param {string} str
	 * @returns {StakeAddress}
	 */
	static fromBech32(str) {
		let [prefix, bytes] = Crypto.decodeBech32(str);

		let result = new StakeAddress(bytes);

		assert(prefix == (StakeAddress.isForTestnet(result) ? "stake_test" : "stake"), "invalid StakeAddress prefix");

		return result;
	}

	/**
	 * Returns the raw StakeAddress bytes as a hex encoded string
	 * @returns {string}
	 */
	toHex() {
		return bytesToHex(this.#bytes);
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
	 * @param {boolean} isTestnet
	 * @param {StakeKeyHash | StakingValidatorHash} hash
	 * @returns {StakeAddress}
	 */
	static fromHash(isTestnet, hash) {
		if (hash instanceof StakeKeyHash) {
			return StakeAddress.fromStakeKeyHash(isTestnet, hash);
		} else {
			return StakeAddress.fromStakingValidatorHash(isTestnet, hash);
		}
	}

	/**
	 * @returns {StakeKeyHash | StakingValidatorHash}
	 */
	get stakingHash() {
		const type = this.bytes[0];

		if (type == 0xe0 || type == 0xe1) {
			return new StakeKeyHash(this.bytes.slice(1));
		} else if (type == 0xf0 || type == 0xf1) {
			return new StakingValidatorHash(this.bytes.slice(1));
		} else {
			throw new Error("bad StakeAddress header");
		}
	}
}

export class Signature extends CborData {
	/**
	 * @type {PubKey} 
	 */
	#pubKey;

	/** @type {number[]} */
	#signature;

	/**
	 * @param {number[] | PubKey} pubKey 
	 * @param {number[]} signature 
	 */
	constructor(pubKey, signature) {
		super();
		this.#pubKey = (pubKey instanceof PubKey) ? pubKey : new PubKey(pubKey);
		this.#signature = signature;
	}

	/**
	 * @type {PubKey}
	 */
	get pubKey() {
		return this.#pubKey;
	}

	/**
	 * @type {PubKeyHash}
	 */
	get pubKeyHash() {
		return this.pubKey.hash();
	}

	/**
	 * @returns {Signature}
	 */
	static dummy() {
		return new Signature(PubKey.dummy(), (new Array(64)).fill(0));
	}

	/**
	 * @returns {boolean}
	 */
	isDummy() {
		return this.#pubKey.isDummy() && this.#signature.every(b => b == 0);
	}

	/**
	 * @returns {number[]}
	 */
	toCbor() {
		return CborData.encodeTuple([
			this.#pubKey.toCbor(),
			CborData.encodeBytes(this.#signature),
		]);
	}

	/**
	 * @param {number[]} bytes 
	 * @returns {Signature}
	 */
	static fromCbor(bytes) {
		/** @type {null | PubKey} */
		let pubKey = null;

		/** @type {null | number[]} */
		let signature = null;

		let n = CborData.decodeTuple(bytes, (i, fieldBytes) => {
			switch(i) {
				case 0:
					pubKey = PubKey.fromCbor(fieldBytes);
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
			pubKey: this.#pubKey.dump,
			pubKeyHash: this.pubKeyHash.dump(),
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
				if (!Crypto.Ed25519.verify(this.#signature, msg, this.#pubKey.bytes)) {
					throw new Error("incorrect signature");
				}
			}
		}
	}
}

export class PrivateKey extends HeliosData {
	/**
	 * @type {number[]}
	 */
	#bytes;

	/**
	 * cache the derived pubKey
	 * @type {null | PubKey}
	 */
	#pubKey

	/**
	 * @param {string | number[]} bytes
	 */
	constructor(bytes) {
		super();
		this.#bytes = Array.isArray(bytes) ? bytes : hexToBytes(bytes);
		this.#pubKey = null;
	}

 	/**
     * Generate a private key from a random number generator.
	 * This is not cryptographically secure, only use this for testing purpose
     * @param {NumberGenerator} random 
     * @returns {PrivateKey} - Ed25519 private key is 32 bytes long
     */
	static random(random) {
		const key = [];

        for (let i = 0; i < 32; i++) {
            key.push(Math.floor(random()*256)%256);
        }

        return new PrivateKey(key);
	}

	/**
	 * @type {number[]}
	 */
	get bytes() {
		return this.#bytes;
	}

	/**
	 * @type {string}
	 */
	get hex() {
		return bytesToHex(this.#bytes);
	}

	/**
	 * @returns {PrivateKey}
	 */
	extend() {
		return new PrivateKey(Crypto.sha2_512(this.#bytes));
	}

	/**
	 * @returns {PubKey}
	 */
	derivePubKey() {
		if (this.#pubKey) {
			return this.#pubKey;
		} else {
			this.#pubKey = new PubKey(Crypto.Ed25519.derivePublicKey(this.#bytes));
			
			return this.#pubKey;
		}
	}

	/**
	 * @param {number[] | string} message 
	 * @returns {Signature}
	 */
	sign(message) {
		return new Signature(
			this.derivePubKey(),
			Crypto.Ed25519.sign(Array.isArray(message) ? message : hexToBytes(message), this.#bytes)
		);
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
		/** @type {null | number} */
		let type = null;

		/** @type {null | Datum} */
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
	 * @param {UplcData} data
	 * @returns {null | Datum}
	 */
	static fromUplcData(data) {
		if (data.index == 0) {
			assert(data.fields.length == 0);
			return null;
		} else if (data.index == 1) {
			assert(data.fields.length == 1);
			return new HashedDatum(DatumHash.fromUplcData(data.fields[0]));
		} else if (data.index == 2) {
			assert(data.fields.length == 1);
			return new InlineDatum(data.fields[0]);
		} else {
			throw new Error("unhandled constr index");
		}
	}

	/**
	 * @param {UplcDataValue | UplcData | HeliosData} data
	 * @returns {HashedDatum}
	 */
	static hashed(data) {
		if (data instanceof HeliosData) {
			return HashedDatum.fromData(data._toUplcData());
		} else {
			return HashedDatum.fromData(UplcDataValue.unwrap(data));
		}
	}

	/**
	 * @param {UplcDataValue | UplcData | HeliosData} data
	 * @returns {InlineDatum}
	 */
	static inline(data) {
		if (data instanceof HeliosData) {
			return new InlineDatum(data._toUplcData());
		} else {
			return new InlineDatum(UplcDataValue.unwrap(data));
		}
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

		CborData.decodeList(bytes, (_, itemBytes) => {
			items.push(decodeMetadata(itemBytes));
		});

		return items;
	} else if (CborData.isMap(bytes)) {
		/**
		 * @type {[Metadata, Metadata][]}
		 */
		let pairs = [];

		CborData.decodeMap(bytes, (_, pairBytes) => {
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

		CborData.decodeMap(data, (_, pairBytes) => {
			txMetadata.add(
				Number(CborData.decodeInteger(pairBytes)), 
				decodeMetadata(pairBytes)
			);
		});

		return txMetadata;
	}
}