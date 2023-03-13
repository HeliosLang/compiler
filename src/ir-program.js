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
	IRCallStack,
	IRScope,
	IRVariable
} from "./ir-context.js";

import {
	IRExpr,
    IRCallExpr,
    IRFuncExpr,
    IRLiteralExpr,
	IRNameExprRegistry,
	IRExprRegistry
} from "./ir-ast.js";

import {
    buildIRExpr
} from "./ir-build.js";


/**
 * Wrapper for IRFuncExpr, IRCallExpr or IRLiteralExpr
 * @package
 */
export class IRProgram {
	#expr;
	#purpose;

	/**
	 * @param {IRFuncExpr | IRCallExpr | IRLiteralExpr} expr
	 * @param {?number} purpose
	 */
	constructor(expr, purpose) {
		this.#expr = expr;
		this.#purpose = purpose;
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
	
		expr.resolveNames(scope);

		expr = expr.evalConstants(new IRCallStack(throwSimplifyRTErrors));

		if (simplify) {
			// inline literals and evaluate core expressions with only literal args (some can be evaluated with only partial literal args)
			expr = this.simplify(expr);

			// make sure the debruijn indices are correct
			expr.resolveNames(scope);
		}

		const program = new IRProgram(IRProgram.assertValidRoot(expr), purpose);

		return program;
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

			expr = expr.simplifyLiterals(new Map());

			const nameExprs = new IRNameExprRegistry();

			expr.registerNameExprs(nameExprs);

			expr = expr.simplifyTopology(new IRExprRegistry(nameExprs));

			const newState = expr.toString();

			if (newState != oldState) {
				dirty = true;
				oldState = newState;
			}
		}

		return expr;
	}

	/**
	 * @package
	 * @type {IRFuncExpr | IRCallExpr | IRLiteralExpr}
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
		if (this.#expr instanceof IRLiteralExpr) {
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
