//@ts-check
// Uplc cost-models

import { 
    assert,
    assertDefined,
    assertNumber
} from "./utils.js";

/**
 * @typedef {Object} Cost
 * @property {bigint} mem
 * @property {bigint} cpu
 */

/**
 * @typedef {() => bigint} LiveSlotGetter
 */

/**
 * Wrapper for the raw JSON containing all the current network parameters.
 * 
 * NetworkParams is needed to be able to calculate script budgets and perform transaction building checks.
 * 
 * The raw JSON can be downloaded from the following CDN locations:
 * 
 *  - Preview: [https://d1t0d7c2nekuk0.cloudfront.net/preview.json](https://d1t0d7c2nekuk0.cloudfront.net/preview.json)
 *  - Preprod: [https://d1t0d7c2nekuk0.cloudfront.net/preprod.json](https://d1t0d7c2nekuk0.cloudfront.net/preprod.json)
 *  - Mainnet: [https://d1t0d7c2nekuk0.cloudfront.net/mainnet.json](https://d1t0d7c2nekuk0.cloudfront.net/mainnet.json)
 * 
 * These JSONs are updated every 15 minutes.
 */
export class NetworkParams {
	#raw;

	/**
	 * Should only be set by the network emulator
	 * @type {null | LiveSlotGetter}
	 */
	#liveSlotGetter;

	/**
	 * @param {Object} raw 
	 * @param {null | LiveSlotGetter} liveSlotGetter
	 */
	constructor(raw, liveSlotGetter = null) {
		if(typeof raw !== 'object'){
		    throw new Error("raw param must be of type object");
        }
		
		this.#raw = raw;
		this.#liveSlotGetter = liveSlotGetter;
	}

	/**
	 * @type {Object}
	 */
	get raw() {
		return this.#raw;
	}
	
	/**
	 * @type {null | bigint}
	 */
	get liveSlot() {
		if (this.#liveSlotGetter) {
			return this.#liveSlotGetter()
		} else {
			return null;
		}
	}

    /**
     * @internal
     * @type {Object}
     */
	get costModel() {
		return assertDefined(this.#raw?.latestParams?.costModels?.PlutusScriptV2, "'obj.latestParams.costModels.PlutusScriptV2' undefined");
	}

	/**
     * @internal
	 * @param {string} key 
	 * @returns {number}
	 */
	getCostModelParameter(key) {
		return assertNumber(this.costModel[key], `'obj.${key}' undefined`);
	}

	/**
     * @internal
	 * @param {string} name 
	 * @returns {Cost}
	 */
	getTermCost(name) {
		let memKey = `cek${name}Cost-exBudgetMemory`;
		let cpuKey = `cek${name}Cost-exBudgetCPU`;

		return {
			mem: BigInt(assertNumber(this.costModel[memKey], `'obj.${memKey}' undefined`)),
			cpu: BigInt(assertNumber(this.costModel[cpuKey], `'obj.${cpuKey}' undefined`)),
		};
	}

	/**
     * @internal
	 * @type {Cost}
	 */
	get plutusCoreStartupCost() {
		return this.getTermCost("Startup");
	}

	/**
     * @internal
	 * @type {Cost}
	 */
	get plutusCoreVariableCost() {
		return this.getTermCost("Var");
	}

	/**
     * @internal
	 * @type {Cost}
	 */
	get plutusCoreLambdaCost() {
		return this.getTermCost("Lam");
	}

	/**
     * @internal
	 * @type {Cost}
	 */
	get plutusCoreDelayCost() {
		return this.getTermCost("Delay");
	}

	/**
     * @internal
	 * @type {Cost}
	 */
	get plutusCoreCallCost() {
		return this.getTermCost("Apply");
	}

	/**
     * @internal
	 * @type {Cost}
	 */
	get plutusCoreConstCost() {
		return this.getTermCost("Const");
	}

	/**
     * @internal
	 * @type {Cost}
	 */
	get plutusCoreForceCost() {
		return this.getTermCost("Force");
	}

	/**
     * @internal
	 * @type {Cost}
	 */
	get plutusCoreBuiltinCost() {
		return this.getTermCost("Builtin");
	}

	/**
     * @internal
	 * @type {[number, number]} - a + b*size
	 */
	get txFeeParams() {
		return [
			assertNumber(this.#raw?.latestParams?.txFeeFixed),
			assertNumber(this.#raw?.latestParams?.txFeePerByte),
		];
	}

	/**
     * @internal
	 * @type {[number, number]} - [memFee, cpuFee]
	 */
	get exFeeParams() {
		return [
			assertNumber(this.#raw?.latestParams?.executionUnitPrices?.priceMemory),
			assertNumber(this.#raw?.latestParams?.executionUnitPrices?.priceSteps),
		];
	}
	
	/**
     * @internal
	 * @type {number[]}
	 */
	get sortedCostParams() {
		let baseObj = this.#raw?.latestParams?.costModels?.PlutusScriptV2;
		let keys = Object.keys(baseObj);

		keys.sort();

		return keys.map(key => assertNumber(baseObj[key]));
	}

	/**
     * @internal
	 * @type {number}
	 */
	get lovelacePerUTXOByte() {
		return assertNumber(this.#raw?.latestParams?.utxoCostPerByte);
	}

	/**
     * @internal
	 * @type {number}
	 */
	get minCollateralPct() {
		return assertNumber(this.#raw?.latestParams?.collateralPercentage);
	}

	/**
     * @internal
	 * @type {number}
	 */
	get maxCollateralInputs() {
		return assertNumber(this.#raw?.latestParams?.maxCollateralInputs);
	}

	/**
     * @internal
	 * @type {[number, number]} - [mem, cpu]
	 */
	get maxTxExecutionBudget() {
		return [
			assertNumber(this.#raw?.latestParams?.maxTxExecutionUnits?.memory),
			assertNumber(this.#raw?.latestParams?.maxTxExecutionUnits?.steps),
		];
	}

	/**
     * @internal
	 * @type {number}
	 */
	get maxTxSize() {
		return assertNumber(this.#raw?.latestParams?.maxTxSize);
	}

	/**
	 * @type {bigint}
	 */
	get stakeAddressDeposit() {
		return BigInt(assertNumber(this.#raw?.latestParams?.stakeAddressDeposit));
	}

	/**
	 * Tx balancing picks additional inputs by starting from maxTxFee. 
	 * This is done because the order of the inputs can have a huge impact on the tx fee, so the order must be known before balancing.
	 * If there aren't enough inputs to cover the maxTxFee and the min deposits of newly created UTxOs, the balancing will fail.
	 * @type {bigint}
	 */
	get maxTxFee() {
		const [a, b] = this.txFeeParams;
		const [feePerMem, feePerCpu] = this.exFeeParams;
		const [maxMem, maxCpu] = this.maxTxExecutionBudget;

		return BigInt(a) + BigInt(Math.ceil(b*this.maxTxSize)) + BigInt(Math.ceil(feePerMem*maxMem)) + BigInt(Math.ceil(feePerCpu*maxCpu));
	}

	/**
	 * Calculates the time (in milliseconds in 01/01/1970) associated with a given slot number.
	 * @param {bigint} slot
	 * @returns {bigint}
	 */
	slotToTime(slot) {
		let secondsPerSlot = assertNumber(this.#raw?.shelleyGenesis?.slotLength);

		let lastSlot = BigInt(assertNumber(this.#raw?.latestTip?.slot));
		let lastTime = BigInt(assertNumber(this.#raw?.latestTip?.time));

		let slotDiff = slot - lastSlot;

		return lastTime + slotDiff*BigInt(secondsPerSlot*1000);
	}

	/**
	 * Calculates the slot number associated with a given time. Time is specified as milliseconds since 01/01/1970.
	 * @param {bigint} time Milliseconds since 1970
	 * @returns {bigint}
	 */
	timeToSlot(time) {
		let secondsPerSlot = assertNumber(this.#raw?.shelleyGenesis?.slotLength);

		let lastSlot = BigInt(assertNumber(this.#raw?.latestTip?.slot));
		let lastTime = BigInt(assertNumber(this.#raw?.latestTip?.time));

		let timeDiff = time - lastTime;

		return lastSlot + BigInt(Math.round(Number(timeDiff)/(1000*secondsPerSlot)));
	}
}

/**
 * Each builtin has an associated CostModel.
 * The CostModel calculates the execution cost of a builtin, depending on the byte-size of the inputs.
 * @internal
 */
export class CostModel {
	constructor() {
	}

	/**
	 * @param {NetworkParams} params
	 * @param {string} baseName
	 * @returns {CostModel}
	 */
	static fromParams(params, baseName) {
		throw new Error("not yet implemented");
	}

	/**
	 * @param {number[]} args 
	 * @returns {bigint}
	 */
	calc(args) {
		throw new Error("not yet implemented");
	}

	/**
	 * @returns {string}
	 */
	dump() {
		throw new Error("not yet implemented");
	}
}

/**
 * A simple constant cost, independent of arg size.
 * @internal
 */
export class ConstCost extends CostModel {
	#constant;

	/**
	 * @param {bigint} constant
	 */
	constructor(constant) {
		super();
		this.#constant = constant;
	}

	/**
	 * @param {NetworkParams} params 
	 * @param {string} baseName - eg. addInteger-cpu-arguments
	 * @returns {ConstCost}
	 */
	static fromParams(params, baseName) {
		let a = params.getCostModelParameter(`${baseName}`);

		return new ConstCost(BigInt(a));
	}

	/**
	 * @param {number[]} args
	 * @returns {bigint}
	 */
	calc(args) {
		return this.#constant;
	}

	/**
	 * @returns {string}
	 */
	dump() {
		return `const: ${this.#constant.toString()}`;
	}
}

/**
 * cost = a + b*size(arg)
 * @internal
 */
export class LinearCost extends CostModel {
	#a;
	#b;

	/**
	 * a + b*SizeFn(x, y)
	 * @param {bigint} a - intercept
	 * @param {bigint} b - slope
	 */
	constructor(a, b) {
		super();
		this.#a = a;
		this.#b = b;
	}

	/**
	 * @param {NetworkParams} params 
	 * @param {string} baseName - eg. addInteger-cpu-arguments
	 * @returns {[bigint, bigint]}
	 */
	static getParams(params, baseName) {
		let a = params.getCostModelParameter(`${baseName}-intercept`);
		let b = params.getCostModelParameter(`${baseName}-slope`);

		return [BigInt(a), BigInt(b)];
	}

	/**
	 * @param  {number} size
	 * @returns {bigint}
	 */
	calcInternal(size) {
		return this.#a + this.#b*BigInt(size);
	}

	/**
	 * @returns {string}
	 */
	dump() {
		return `intercept: ${this.#a.toString()}, slope: ${this.#b.toString()}`;
	}
}

/**
 * cost = a + b*size(args[i])
 * @internal
 */
export class ArgSizeCost extends LinearCost {
	#i;

	/**
	 * @param {bigint} a - intercept
	 * @param {bigint} b - slope
	 * @param {number} i - index of the arg
	 */
	constructor(a, b, i) {
		super(a, b);
		this.#i = i;
	}

	/**
	 * @param {number[]} args
	 * @returns {bigint}
	 */
	calc(args) {
		assert(this.#i < args.length && this.#i >= 0);

		return this.calcInternal(args[this.#i]);
	}
}

/**
 * cost = a + b*size(arg0)
 * @internal
 */
export class Arg0SizeCost extends ArgSizeCost {
	/**
	 * @param {bigint} a 
	 * @param {bigint} b 
	 */
	constructor(a, b) {
		super(a, b, 0);
	}

	/**
	 * @param {NetworkParams} params 
	 * @param {string} baseName - eg. addInteger-cpu-arguments
	 * @returns {Arg0SizeCost}
	 */
	static fromParams(params, baseName) {
		let [a, b] = LinearCost.getParams(params, baseName);

		return new Arg0SizeCost(a, b);
	}
}

/**
 * cost = a + b*size(arg1)
 * @internal
 */
export class Arg1SizeCost extends ArgSizeCost {
	/**
	 * @param {bigint} a 
	 * @param {bigint} b 
	 */
	constructor(a, b) {
		super(a, b, 1);
	}

	/**
	 * @param {NetworkParams} params 
	 * @param {string} baseName - eg. addInteger-cpu-arguments
	 * @returns {Arg1SizeCost}
	 */
	static fromParams(params, baseName) {
		let [a, b] = LinearCost.getParams(params, baseName);

		return new Arg1SizeCost(a, b);
	}
}

/**
 * cost = a + b*size(arg2)
 * @internal
 */
export class Arg2SizeCost extends ArgSizeCost {
	/**
	 * @param {bigint} a 
	 * @param {bigint} b 
	 */
	constructor(a, b) {
		super(a, b, 2);
	}

	/**
	 * @param {NetworkParams} params 
	 * @param {string} baseName - eg. addInteger-cpu-arguments
	 * @returns {Arg2SizeCost}
	 */
	static fromParams(params, baseName) {
		let [a, b] = LinearCost.getParams(params, baseName);

		return new Arg2SizeCost(a, b);
	}
}

/**
 * cost = a + b*min(args)
 * @internal
 */
export class MinArgSizeCost extends LinearCost {
	/**
	 * @param {bigint} a - intercept
	 * @param {bigint} b - slope
	 */
	constructor(a, b) {
		super(a, b);
	}
	/**
	 * @param {NetworkParams} params 
	 * @param {string} baseName - eg. addInteger-cpu-arguments
	 * @returns {MaxArgSizeCost}
	 */
	static fromParams(params, baseName) {
		let [a, b] = LinearCost.getParams(params, baseName);

		return new MinArgSizeCost(a, b);
	}

	/**
	 * @param  {number[]} args
	 * @returns {bigint}
	 */
	calc(args) {
		return this.calcInternal(Math.min(...args));
	}
}

/**
 * cost = a + b*max(args)
 * @internal
 */
export class MaxArgSizeCost extends LinearCost {
	/**
	 * @param {bigint} a - intercept
	 * @param {bigint} b - slope
	 */
	constructor(a, b) {
		super(a, b);
	}

	/**
	 * @param {NetworkParams} params 
	 * @param {string} baseName - eg. addInteger-cpu-arguments
	 * @returns {MaxArgSizeCost}
	 */
	static fromParams(params, baseName) {
		let [a, b] = LinearCost.getParams(params, baseName);

		return new MaxArgSizeCost(a, b);
	}

	/**
	 * @param  {number[]} args
	 * @returns {bigint}
	 */
	calc(args) {
		return this.calcInternal(Math.max(...args));
	}
}

/**
 * cost = a + b*sum(sizes(args))
 * @internal
 */
export class SumArgSizesCost extends LinearCost {
	/**
	 * @param {bigint} a - intercept
	 * @param {bigint} b - slope
	 */
	constructor(a, b) {
		super(a, b);
	}

	/**
	 * @param {NetworkParams} params 
	 * @param {string} baseName - eg. addInteger-cpu-arguments
	 * @returns {MaxArgSizeCost}
	 */
	static fromParams(params, baseName) {
		let [a, b] = LinearCost.getParams(params, baseName);

		return new SumArgSizesCost(a, b);
	}

	/**
	 * @param  {number[]} args
	 * @returns {bigint}
	 */
	calc(args) {
		let sum = 0;

		for (let arg of args) {
			sum += arg;
		}

		return this.calcInternal(sum);
	}
}

/**
 * cost = a + b*max(size(arg0)-size(arg1), min)
 * (only for Uplc functions with two arguments) 
 * @internal
 */
export class ArgSizeDiffCost extends LinearCost {
	#min;

	/**
	 * @param {bigint} a - intercept
	 * @param {bigint} b - slope
	 * @param {number} min
	 */
	constructor(a, b, min) {
		super(a, b);
		this.#min = min
	}
	/**
	 * @param {NetworkParams} params 
	 * @param {string} baseName - eg. addInteger-cpu-arguments
	 * @returns {ArgSizeDiffCost}
	 */
	static fromParams(params, baseName) {
		let [a, b] = LinearCost.getParams(params, baseName);
		let min = params.getCostModelParameter(`${baseName}-minimum`);

		return new ArgSizeDiffCost(a, b, min);
	}

	/**
	 * @param {number[]} args
	 * @returns {bigint}
	 */
	calc(args) {
		assert(args.length == 2);
		let [x, y] = args;

		return this.calcInternal(Math.max(x - y, this.#min));
	}

	/**
	 * @returns {string}
	 */
	dump() {
		return super.dump() + `, minimum: ${this.#min.toString()}`;
	}
}

/**
 * cost = (size(arg0) > size(arg1)) ? constant : a + b*size(arg0)*size(arg1)
 * (only for Uplc functions with two arguments)
 * @internal
 */
export class ArgSizeProdCost extends LinearCost {
	#constant;

	/**
	 * @param {bigint} a - intercept
	 * @param {bigint} b - slope
	 * @param {bigint} constant
	 */
	constructor(a, b, constant) {
		super(a, b);
		this.#constant = constant;
	}

	/**
	 * @param {NetworkParams} params 
	 * @param {string} baseName - eg. addInteger-cpu-arguments
	 * @returns {MaxArgSizeCost}
	 */
	static fromParams(params, baseName) {
		const [a, b] = LinearCost.getParams(params, `${baseName}-model-arguments`);
		const constant = params.getCostModelParameter(`${baseName}-constant`);

		return new ArgSizeProdCost(a, b, BigInt(constant));
	}

	/**
	 * @param {number[]} args
	 * @returns {bigint}
	 */
	calc(args) {
		assert(args.length == 2);
		
		const [x, y] = args;

		if (x > y) {
			return this.#constant;
		} else {
			return this.calcInternal(x*y);
		}
	}

	/**
	 * @returns {string}
	 */
	dump() {
		return super.dump() + `, constant: ${this.#constant.toString()}`;
	}
}

/**
 * cost = (size(arg0) != size(arg1)) ? constant : a + b*size(arg0)
 * (only for Uplc functions with two arguments)
 * @internal
 */
export class ArgSizeDiagCost extends LinearCost {
	#constant;

	/**
	 * @param {bigint} a
	 * @param {bigint} b
	 * @param {bigint} constant
	 */
	constructor(a, b, constant) {
		super(a, b);
		this.#constant = constant;
	}
	/**
	 * @param {NetworkParams} params 
	 * @param {string} baseName - eg. addInteger-cpu-arguments
	 * @returns {ArgSizeDiagCost}
	 */
	static fromParams(params, baseName) {
		const [a, b] = LinearCost.getParams(params, baseName);
		const constant = params.getCostModelParameter(`${baseName}-constant`);

		return new ArgSizeDiagCost(a, b, BigInt(constant));
	}

	/**
	 * @param {number[]} args 
	 * @returns {bigint}
	 */
	calc(args) {
		assert(args.length == 2);

		if (args[0] == args[1]) {
			return this.calcInternal(args[0]);
		} else {
			return this.#constant;
		}
	}

	/**
	 * @returns {string}
	 */
	dump() {
		return super.dump() + `, constant: ${this.#constant.toString()}`;
	}
}

/**
 * @internal
 * @typedef CostModelClass
 * @property {(params: NetworkParams, baseName: string) => CostModel} fromParams
 */