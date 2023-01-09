//@ts-check
// IR Program

import {
    IR,
	Site,
	Word
} from "./tokens.js";

import {
    UplcData
} from "./uplc-data.js";

import {
	UplcLambda
} from "./uplc-ast.js";

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
    IRUserCallExpr,
	IRVariable
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
	 * @package
	 * @param {IR} ir 
	 * @param {?number} purpose
	 * @param {boolean} simplify
	 * @param {boolean} throwSimplifyRTErrors - if true -> throw RuntimErrors caught during evaluation steps
	 * @param {IRScope} scope
	 * @returns {IRProgram}
	 */
	static new(ir, purpose, simplify = false, throwSimplifyRTErrors = false, scope = new IRScope(null, null)) {
		let [irSrc, codeMap] = ir.generateSource();

		let irTokens = tokenizeIR(irSrc, codeMap);

		let expr = buildIRExpr(irTokens);
		
		/**
		 * @type {IRProgram}
		 */
		if (expr instanceof IRFuncExpr || expr instanceof IRCallExpr || expr instanceof IRLiteral) {
			if (expr instanceof IRFuncExpr || expr instanceof IRUserCallExpr || expr instanceof IRCoreCallExpr) {
				expr.resolveNames(scope);
			}

			let program = new IRProgram(expr, purpose);

			if (simplify) {
				program.simplify(throwSimplifyRTErrors, scope);
			}

			return program;
		} else {
			throw new Error("expected IRFuncExpr or IRUserCallExpr or IRLiteral as result of IRProgram.new");
		}
	}

	/**
	 * @package
	 * @type {IRFuncExpr | IRCallExpr | IRLiteral}
	 */
	get expr() {
		return this.#expr;
	}

	/**
	 * @package
	 * @type {?number}
	 */
	get purpose() {
		return this.#purpose;
	}

	/**
	 * @package
	 * @type {Site}
	 */
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
	 * @param {IRScope} scope
	 */
	simplify(throwSimplifyRTErrors = false, scope = new IRScope(null, null)) {
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
			this.#expr.resolveNames(scope);
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

export class IRParametricProgram {
	#irProgram;
	#parameters;

	/**
	 * @param {IRProgram} irProgram
	 * @param {string[]} parameters
	 */
	constructor(irProgram, parameters) {
		this.#irProgram = irProgram;
		this.#parameters = parameters;
	}

	/**
	 * @package
	 * @param {IR} ir 
	 * @param {?number} purpose
	 * @param {string[]} parameters
	 * @param {boolean} simplify
	 * @returns {IRParametricProgram}
	 */
	static new(ir, purpose, parameters, simplify = false) {
		let scope = new IRScope(null, null);

		parameters.forEach((p, i) => {
			const internalName = `__PARAM_${i}`;

			scope = new IRScope(scope, new IRVariable(new Word(Site.dummy(), internalName)));
		});

		const irProgram = IRProgram.new(ir, purpose, simplify, false, scope);

		return new IRParametricProgram(irProgram, parameters);
	}

	/**
	 * @returns {UplcProgram}
	 */
	toUplc() {
		let exprUplc = this.#irProgram.expr.toUplc();

		this.#parameters.forEach(p => {
			exprUplc = new UplcLambda(Site.dummy(), exprUplc, p);
		});

		return new UplcProgram(exprUplc, this.#irProgram.purpose);
	}
}