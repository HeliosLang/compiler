//@ts-check
// IR Program

import {
    IR
} from "./tokens.js";

import {
    UplcData
} from "./uplc-data.js";

import {
    UplcProgram
} from "./uplc-program.js";

import {
    tokenizeIR
} from "./tokenization.js";

import {
    IRCallExpr,
    IRCoreCallExpr,
    IRExprStack,
    IRFuncExpr,
    IRLiteral,
    IRScope,
    IRUserCallExpr
} from "./ir-ast.js";

import {
    buildIRExpr
} from "./ir-build.js";

/**
 * Wrapper for IRFuncExpr, IRCallExpr or IRLiteral
 * @package
 */
export class IRProgram {
	#expr;
	#purpose;

	/**
	 * @param {IRFuncExpr | IRCallExpr | IRLiteral} expr
	 * @param {?number} purpose
	 */
	constructor(expr, purpose) {
		this.#expr = expr;
		this.#purpose = purpose;
	}

	/**
	 * @param {IR} ir 
	 * @param {?number} purpose
	 * @param {boolean} simplify
	 * @param {boolean} throwSimplifyRTErrors - if true -> throw RuntimErrors caught during evaluation steps
	 * @returns {IRProgram}
	 */
	static new(ir, purpose, simplify = false, throwSimplifyRTErrors = false) {
		let [irSrc, codeMap] = ir.generateSource();

		let irTokens = tokenizeIR(irSrc, codeMap);

		let expr = buildIRExpr(irTokens);
		
		/**
		 * @type {IRProgram}
		 */
		if (expr instanceof IRFuncExpr || expr instanceof IRCallExpr || expr instanceof IRLiteral) {
			if (expr instanceof IRFuncExpr || expr instanceof IRUserCallExpr || expr instanceof IRCoreCallExpr) {
				expr.resolveNames(new IRScope(null, null));
			}

			let program = new IRProgram(expr, purpose);

			if (simplify) {
				program.simplify(throwSimplifyRTErrors);
			}

			return program;
		} else {
			throw new Error("expected IRFuncExpr or IRUserCallExpr or IRLiteral as result of IRProgram.new");
		}
	}

	get site() {
		return this.#expr.site;
	}

	/**
	 * @type {UplcData}
	 */
	get data() {
		if (this.#expr instanceof IRLiteral) {
			let v = this.#expr.value;

			return v.data;
		} else {
			console.log(this.#expr.toString());
			throw new Error("expected data literal");
		}
	}

	toString() {
		return this.#expr.toString();
	}

	/**
	 * @param {boolean} throwSimplifyRTErrors
	 */
	simplify(throwSimplifyRTErrors = false) {
		let dirty = true;
	
		while(dirty && (this.#expr instanceof IRFuncExpr || this.#expr instanceof IRUserCallExpr || this.#expr instanceof IRCoreCallExpr)) {
			dirty = false;
			let newExpr = this.#expr.simplify(new IRExprStack(throwSimplifyRTErrors));
	
			if (newExpr instanceof IRFuncExpr || newExpr instanceof IRUserCallExpr || newExpr instanceof IRCoreCallExpr || newExpr instanceof IRLiteral) {
				dirty = newExpr.toString() != this.#expr.toString();
				this.#expr = newExpr;
			}
		}
	
		if (this.#expr instanceof IRFuncExpr || this.#expr instanceof IRUserCallExpr || this.#expr instanceof IRCoreCallExpr) {
			// recalculate the Debruijn indices
			this.#expr.resolveNames(new IRScope(null, null));
		}
	}

	/**
	 * @returns {UplcProgram}
	 */
	toUplc() {
		return new UplcProgram(this.#expr.toUplc(), this.#purpose);
	}

	/**
	 * @returns {number}
	 */
	calcSize() {
		return this.toUplc().calcSize();
	}
}