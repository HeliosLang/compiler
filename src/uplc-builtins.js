//@ts-check
// Uplc built-in functions

import {
    assert
} from "./utils.js";

/**
 * @typedef {import("./uplc-costmodels.js").Cost} Cost
 * @typedef {import("./uplc-costmodels.js").CostModelClass} CostModelClass
 */

import {
    Arg0SizeCost,
    Arg1SizeCost,
    Arg2SizeCost,
    ArgSizeDiagCost,
    ArgSizeDiffCost,
    ArgSizeProdCost,
    ConstCost,
    CostModel,
    MaxArgSizeCost,
    MinArgSizeCost,
    NetworkParams,
    SumArgSizesCost
} from "./uplc-costmodels.js";

/**
 * @internal
 */
export const BUILTIN_PREFIX = "__core__";

/**
 * Calls to builtins that are known not to throw errors (eg. tailList inside last branch of chooseList)
 * @internal
 */
export const SAFE_BUILTIN_SUFFIX = "__safe"; 

/**
 * Special off-chain builtins like network.get()
 * @internal
 */
export const MACRO_BUILTIN_PREFIX = "__core__macro";

/**
 * Cost-model configuration of UplcBuiltin.
 * Also specifies the number of times a builtin must be 'forced' before being callable.
 * @internal
 */
 export class UplcBuiltinConfig {
	#name;
	#forceCount;
	#nArgs;
	#allowAny;
	#memCostModelClass;
	#cpuCostModelClass;

	/**
	 * @param {string} name 
	 * @param {number} forceCount - number of type parameters of a Plutus-core builtin function (0, 1 or 2)
	 * @param {number} nArgs
	 * @param {boolean} allowAny
	 * @param {CostModelClass} memCostModelClass 
	 * @param {CostModelClass} cpuCostModelClass 
	 */
	constructor(name, forceCount, nArgs, allowAny, memCostModelClass, cpuCostModelClass) {
		this.#name = name;
		this.#forceCount = forceCount;
		this.#nArgs = nArgs;
		this.#allowAny = allowAny;
		this.#memCostModelClass = memCostModelClass;
		this.#cpuCostModelClass = cpuCostModelClass;
	}

	get name() {
		return this.#name;
	}

	get forceCount() {
		return this.#forceCount;
	}

	get nArgs() {
		return this.#nArgs;
	}

	get allowAny() {
		return this.#allowAny;
	}

	/**
	 * @param {NetworkParams} params
	 * @returns {[CostModel, CostModel]}
	 */
	instantiateCostModels(params) {
		if (this.#memCostModelClass !== null && this.#cpuCostModelClass !== null) {
			let memCostModel = this.#memCostModelClass.fromParams(params, `${this.#name}-memory-arguments`);
			let cpuCostModel = this.#cpuCostModelClass.fromParams(params, `${this.#name}-cpu-arguments`);

			return [memCostModel, cpuCostModel];
		} else {
			throw new Error(`cost model not yet implemented for builtin ${this.#name}`);
		}
	}

	/**
	 * @param {NetworkParams} params
	 * @param {number[]} argSizes
	 * @returns {Cost}
	 */
	calcCost(params, argSizes) {
		// Note: instantiating everytime might be slow. Should this be cached (eg. in the params object?)?
		const [memCostModel, cpuCostModel] = this.instantiateCostModels(params);

		const memCost = memCostModel.calc(argSizes);
		const cpuCost = cpuCostModel.calc(argSizes);

		return {mem: memCost, cpu: cpuCost};
	}

	/**
	 * @param {NetworkParams} params
	 */
	dumpCostModel(params) {
		const [memCostModel, cpuCostModel] = this.instantiateCostModels(params);

		console.log(`${this.name}-memory-arguments={${memCostModel.dump()},\n${this.name}-cpu-arguments={${cpuCostModel.dump()}}`);
	}
}

/** 
 * A list of all PlutusScript builins, with associated costmodels (actual costmodel parameters are loaded from NetworkParams during runtime)
 * @internal
 * @type {UplcBuiltinConfig[]} 
 */
export const UPLC_BUILTINS = (
	/**
	 * @returns {UplcBuiltinConfig[]}
	 */
	function () {
		/**
		 * Constructs a builtinInfo object
		 * @param {string} name 
		 * @param {number} forceCount 
		 * @param {number} nArgs
		 * @param {boolean} allowAny
		 * @param {CostModelClass} memCostModel
		 * @param {CostModelClass} cpuCostModel
		 * @returns {UplcBuiltinConfig}
		 */
		function builtinConfig(name, forceCount, nArgs, allowAny, memCostModel, cpuCostModel) {
			// builtins might need be wrapped in `force` a number of times if they are not fully typed
			return new UplcBuiltinConfig(name, forceCount, nArgs, allowAny, memCostModel, cpuCostModel);
		}

		return [
			builtinConfig("addInteger",               0, 2, false, MaxArgSizeCost, MaxArgSizeCost), // 0
			builtinConfig("subtractInteger",          0, 2, false, MaxArgSizeCost, MaxArgSizeCost),
			builtinConfig("multiplyInteger",          0, 2, false, SumArgSizesCost, SumArgSizesCost),
			builtinConfig("divideInteger",            0, 2, false, ArgSizeDiffCost, ArgSizeProdCost),
			builtinConfig("quotientInteger",          0, 2, false, ArgSizeDiffCost, ArgSizeProdCost), 
			builtinConfig("remainderInteger",         0, 2, false, ArgSizeDiffCost, ArgSizeProdCost),
			builtinConfig("modInteger",               0, 2, false, ArgSizeDiffCost, ArgSizeProdCost),
			builtinConfig("equalsInteger",            0, 2, false, ConstCost, MinArgSizeCost),
			builtinConfig("lessThanInteger",          0, 2, false, ConstCost, MinArgSizeCost),
			builtinConfig("lessThanEqualsInteger",    0, 2, false, ConstCost, MinArgSizeCost),
			builtinConfig("appendByteString",         0, 2, false, SumArgSizesCost, SumArgSizesCost), // 10
			builtinConfig("consByteString",           0, 2, false, SumArgSizesCost, Arg1SizeCost),
			builtinConfig("sliceByteString",          0, 3, false, Arg2SizeCost, Arg2SizeCost),
			builtinConfig("lengthOfByteString",       0, 1, false, ConstCost, ConstCost),
			builtinConfig("indexByteString",          0, 2, false, ConstCost, ConstCost),
			builtinConfig("equalsByteString",         0, 2, false, ConstCost, ArgSizeDiagCost),
			builtinConfig("lessThanByteString",       0, 2, false, ConstCost, MinArgSizeCost),
			builtinConfig("lessThanEqualsByteString", 0, 2, false, ConstCost, MinArgSizeCost),
			builtinConfig("sha2_256",                 0, 1, false, ConstCost, Arg0SizeCost),
			builtinConfig("sha3_256",                 0, 1, false, ConstCost, Arg0SizeCost),
			builtinConfig("blake2b_256",              0, 1, false, ConstCost, Arg0SizeCost), // 20
			builtinConfig("verifyEd25519Signature",   0, 3, false, ConstCost, Arg2SizeCost),
			builtinConfig("appendString",             0, 2, false, SumArgSizesCost, SumArgSizesCost),
			builtinConfig("equalsString",             0, 2, false, ConstCost, ArgSizeDiagCost),
			builtinConfig("encodeUtf8",               0, 1, false, Arg0SizeCost, Arg0SizeCost),
			builtinConfig("decodeUtf8",               0, 1, false, Arg0SizeCost, Arg0SizeCost),
			builtinConfig("ifThenElse",               1, 3, true , ConstCost, ConstCost),
			builtinConfig("chooseUnit",               1, 2, false, ConstCost, ConstCost),
			builtinConfig("trace",                    1, 2, true , ConstCost, ConstCost),
			builtinConfig("fstPair",                  2, 1, false, ConstCost, ConstCost),
			builtinConfig("sndPair",                  2, 1, false, ConstCost, ConstCost), // 30
			builtinConfig("chooseList",               2, 3, true , ConstCost, ConstCost),
			builtinConfig("mkCons",                   1, 2, false, ConstCost, ConstCost),
			builtinConfig("headList",                 1, 1, false, ConstCost, ConstCost),
			builtinConfig("tailList",                 1, 1, false, ConstCost, ConstCost),
			builtinConfig("nullList",                 1, 1, false, ConstCost, ConstCost),
			builtinConfig("chooseData",               1, 6, true , ConstCost, ConstCost),
			builtinConfig("constrData",               0, 2, false, ConstCost, ConstCost),
			builtinConfig("mapData",                  0, 1, false, ConstCost, ConstCost),
			builtinConfig("listData",                 0, 1, false, ConstCost, ConstCost),
			builtinConfig("iData",                    0, 1, false, ConstCost, ConstCost), // 40
			builtinConfig("bData",                    0, 1, false, ConstCost, ConstCost),
			builtinConfig("unConstrData",             0, 1, false, ConstCost, ConstCost),
			builtinConfig("unMapData",                0, 1, false, ConstCost, ConstCost),
			builtinConfig("unListData",               0, 1, false, ConstCost, ConstCost),
			builtinConfig("unIData",                  0, 1, false, ConstCost, ConstCost),
			builtinConfig("unBData",                  0, 1, false, ConstCost, ConstCost),
			builtinConfig("equalsData",               0, 2, false, ConstCost, MinArgSizeCost),
			builtinConfig("mkPairData",               0, 2, false, ConstCost, ConstCost),
			builtinConfig("mkNilData",                0, 1, false, ConstCost, ConstCost),
			builtinConfig("mkNilPairData",            0, 1, false, ConstCost, ConstCost), // 50
			builtinConfig("serialiseData",            0, 1, false, Arg0SizeCost, Arg0SizeCost),
			builtinConfig("verifyEcdsaSecp256k1Signature",   0, 3, false, ConstCost, ConstCost), // these parameters are from aiken, but the cardano-cli parameter file differ?
			builtinConfig("verifySchnorrSecp256k1Signature", 0, 3, false, ConstCost, Arg1SizeCost), // these parameters are from, but the cardano-cli parameter file differs?
		];
	}
)();

/**
 * @internal
 */
export const UPLC_MACROS_OFFSET = UPLC_BUILTINS.length;

/**
 * Index to helios-specific macro mapping
 * @internal
 */ 
export const UPLC_MACROS = [
	"compile",
	"finalize",
	"get_utxo",
	"now",
	"pick",
	"utxos_at"
];

/**
 * Use this function to check cost-model parameters
 * @internal
 * @param {NetworkParams} networkParams
 */
export function dumpCostModels(networkParams) {
	for (let builtin of UPLC_BUILTINS) {
		builtin.dumpCostModel(networkParams);
	}
}

/**
 * Returns index of a named builtin
 * Throws an error if builtin doesn't exist
 * @internal
 * @param {string} name 
 * @returns 
 */
export function findUplcBuiltin(name) {
	let i = UPLC_BUILTINS.findIndex(info => { return BUILTIN_PREFIX + info.name == name });
	assert(i != -1, `${name} is not a real builtin`);
	return i;
}

/**
 * Checks if a named builtin exists
 * @internal
 * @param {string} name 
 * @param {boolean} strict - if true then throws an error if builtin doesn't exist
 * @returns {boolean}
 */
export function isUplcBuiltin(name, strict = false) {
	if (name.startsWith(BUILTIN_PREFIX)) {
		if (strict) {
			void this.findBuiltin(name); // assert that builtin exists
		}
		return true;
	} else {
		return false;
	}
}