//@ts-check
// IR Program

import { 
	Source,
	assertClass, 
	textToBytes 
} from "./utils.js";

import {
    IR,
	Site,
	Word
} from "./tokens.js";

import {
	ByteArrayData,
	ConstrData,
	IntData,
	ListData,
	MapData,
    UplcData
} from "./uplc-data.js";

import {
	UplcBool,
	UplcByteArray,
	UplcDataValue,
	UplcInt,
	UplcList,
	UplcLambda,
	UplcPair,
	UplcString,
} from "./uplc-ast.js";

/**
 * @typedef {import("./uplc-ast.js").ScriptPurpose} ScriptPurpose
 */
/**
 * @typedef {import("./uplc-program.js").ProgramProperties} ProgramProperties
 */

import {
    UplcProgram
} from "./uplc-program.js";

import {
    tokenizeIR
} from "./tokenization.js";

import {
	IRScope,
	IRVariable
} from "./ir-context.js";

/**
 * @typedef {import("./ir-ast.js").IRExpr} IRExpr
 */

import {
    IRCallExpr,
    IRFuncExpr,
    IRLiteralExpr
} from "./ir-ast.js";

import {
    buildIRExpr
} from "./ir-build.js";

import {
	IROptimizer
} from "./ir-optimize.js";
import { IREvaluator, annotateIR } from "./ir-evaluate.js";


/**
 * Wrapper for IRFuncExpr, IRCallExpr or IRLiteralExpr
 * @internal
 */
export class IRProgram {
	#expr;
	#properties;

	/**
	 * @param {IRFuncExpr | IRCallExpr | IRLiteralExpr} expr
	 * @param {ProgramProperties} properties
	 */
	constructor(expr, properties) {
		this.#expr = expr;
		this.#properties = properties;
	}

	/**
	 * @param {IRExpr} expr 
	 * @returns {IRFuncExpr | IRCallExpr | IRLiteralExpr}
	 */
	static assertValidRoot(expr) {
		if (expr instanceof IRFuncExpr || expr instanceof IRCallExpr || expr instanceof IRLiteralExpr) {
			return expr;
		} else {
			throw new Error("invalid IRExpr type for IRProgram");
		}
	}

	/**
	 * @internal
	 * @param {IR} ir 
	 * @param {null | ScriptPurpose} purpose
	 * @param {boolean} simplify
	 * @param {IRScope} scope
	 * @returns {IRProgram}
	 */
	static new(ir, purpose, simplify = false, scope = new IRScope(null, null)) {
		let [irSrc, codeMap] = ir.generateSource();
		
		const callsTxTimeRange = irSrc.match(/\b__helios__tx__time_range\b/) !== null;

		let irTokens = tokenizeIR(irSrc, codeMap);

		let expr = buildIRExpr(irTokens);
		
		try {
			expr.resolveNames(scope);
		
			if (simplify) {
				// inline literals and evaluate core expressions with only literal args (some can be evaluated with only partial literal args)
				expr = IRProgram.simplify(expr);
			}

			// make sure the debruijn indices are correct (doesn't matter for simplication because names are converted into unique IRVariables, but is very important before converting to UPLC)
			expr.resolveNames(scope);

			const program = new IRProgram(IRProgram.assertValidRoot(expr), {
				purpose: purpose,
				callsTxTimeRange: callsTxTimeRange
			});

			return program;
		} catch (e) {
			console.log((new Source(irSrc, "")).pretty());

			throw e;
		}
	}

	/**
	 * @returns {string}
	 */
	annotate() {
		const evaluator = new IREvaluator();

		evaluator.eval(this.#expr);

		return annotateIR(evaluator, this.#expr);
	}

	/**
	 * @param {IRExpr} expr
	 * @returns {IRExpr}
	 */
	static simplify(expr) {
		let dirty = true;
		let oldState = expr.toString();

		while (dirty) {
			dirty = false;

			const optimizer = new IROptimizer(expr, true);

			expr = optimizer.optimize();

			const newState = expr.toString();

			if (newState != oldState) {
				dirty = true;
				oldState = newState;
			}
		}

		return expr;
	}

	/**
	 * @internal
	 * @type {IRFuncExpr | IRCallExpr | IRLiteralExpr}
	 */
	get expr() {
		return this.#expr;
	}

	/**
	 * @internal
	 * @type {ProgramProperties}
	 */
	get properties() {
		return this.#properties;
	}

	/**
	 * @internal
	 * @type {Site}
	 */
	get site() {
		return this.#expr.site;
	}

	/**
	 * @type {UplcData}
	 */
	get data() {
		if (this.#expr instanceof IRLiteralExpr) {
			let v = this.#expr.value;

			if (v instanceof UplcDataValue) {
				return v.data;
			} else if (v instanceof UplcInt) {
				return new IntData(v.int);
			} else if (v instanceof UplcBool) {
				return new ConstrData(v.bool ? 1 : 0, []);
			} else if (v instanceof UplcList) {
				if (v.isDataList()) {
					return new ListData(v.list.map(item => item.data));
				} else if (v.isDataMap()) {
					return new MapData(v.list.map(item => {
						const pair = assertClass(item, UplcPair);

						return [pair.key, pair.value];
					}));
				}
			} else if (v instanceof UplcString) {
				return new ByteArrayData(textToBytes(v.string));
			} else if (v instanceof UplcByteArray) {
				return new ByteArrayData(v.bytes);
			}
		} 

		throw new Error(`unable to turn '${this.toString()}' into data`);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.#expr.toString();
	}

	/**
	 * @returns {UplcProgram}
	 */
	toUplc() {
		return new UplcProgram(this.#expr.toUplc(), this.#properties);
	}

	/**
	 * @returns {number}
	 */
	calcSize() {
		return this.toUplc().calcSize();
	}
}

/**
 * @internal
 */
export class IRParametricProgram {
	/**
	 * @type {IRProgram}
	 */
	#irProgram;

	/**
	 * @type {number}
	 */
	#nParams;

	/**
	 * @param {IRProgram} irProgram
	 * @param {number} nParams
	 */
	constructor(irProgram, nParams) {
		this.#irProgram = irProgram;
		this.#nParams = nParams;
	}

	/**
	 * @internal
	 * @param {IR} ir 
	 * @param {null | ScriptPurpose} purpose
	 * @param {number} nParams
	 * @param {boolean} simplify
	 * @returns {IRParametricProgram}
	 */
	static new(ir, purpose, nParams, simplify = false) {
		let scope = new IRScope(null, null);

		for (let i = 0; i < nParams; i++) {
			const internalName = `__PARAM_${i}`;

			scope = new IRScope(scope, new IRVariable(new Word(Site.dummy(), internalName)));
		}

		const irProgram = IRProgram.new(ir, purpose, simplify, scope);

		return new IRParametricProgram(irProgram, nParams);
	}

	/**
	 * @type {IRProgram}
	 */
	get program() {
		return this.#irProgram;
	}

	/**
	 * @returns {UplcProgram}
	 */
	toUplc() {
		let exprUplc = this.#irProgram.expr.toUplc();

		for (let i = 0; i < this.#nParams; i++) {
			exprUplc = new UplcLambda(Site.dummy(), exprUplc);
		}

		return new UplcProgram(exprUplc, this.#irProgram.properties);
	}
}
