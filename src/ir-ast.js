//@ts-check
// IR AST objects

import {
    TAB
} from "./config.js";

import {
    assert,
    assertDefined
} from "./utils.js";

import {
    Site,
    Word
} from "./tokens.js";

import {
	BUILTIN_PREFIX,
	MACRO_BUILTIN_PREFIX,
	SAFE_BUILTIN_SUFFIX,
    UPLC_BUILTINS
} from "./uplc-builtins.js";

/**
 * @typedef {import("./uplc-ast.js").UplcValue} UplcValue
 */

import {
    UplcBuiltin,
    UplcCall,
    UplcConst,
    UplcDelay,
    UplcError,
    UplcForce,
    UplcInt,
    UplcLambda,
    UplcTerm,
    UplcVariable
} from "./uplc-ast.js";

import {
	IRScope,
	IRVariable
} from "./ir-context.js";


/**
 * The optimizer maps expressions to expected values, calling notifyCopy assures that that mapping isn't lost for copies (copying is necessary when inlining)
 * @internal
 * @typedef {(oldExpr: IRExpr, newExpr: IRExpr) => void} NotifyCopy
 */

/**
 * Interface for:
 *   * `IRErrorExpr`
 *   * `IRCallExpr`
 *   * `IRFuncExpr`
 *   * `IRNameExpr`
 *   * `IRLiteralExpr`
 * 
 * The `copy()` method is needed because inlining can't use the same IRNameExpr twice, 
 *   so any inlineable expression is copied upon inlining to assure each nested IRNameExpr is unique.
 *   This is important to do even the the inlined expression is only called once, because it might still be inlined into multiple other locations that are eliminated in the next iteration.
 * 
 * `flatSize` returns the number of bits occupied by the equivalent UplcTerm in the final serialized UPLC program
 *   This is used to detect small IRFuncExprs and inline them
 * @internal
 * @typedef {{
 *   site: Site,
 *   flatSize: number
 *   resolveNames(scope: IRScope): void,
 *   toString(indent?: string): string,
 *   copy(notifyCopy: NotifyCopy, varMap: Map<IRVariable, IRVariable>): IRExpr,
 *   toUplc(): UplcTerm
 * }} IRExpr
 */

/**
 * Intermediate Representation variable reference expression
 * @internal
 * @implements {IRExpr}
 */
export class IRNameExpr {
	/**
	 * @readonly
	 * @type {Site}
	 */
	site;

	#name;

	/**
	 * @type {null | number} - cached debruijn index 
	 */
	#index;

	/**
	 * @type {null | IRVariable} - cached variable
	 */
	#variable;

	/**
	 * @param {Word} name 
	 * @param {null | IRVariable} variable
	 */
	constructor(name, variable = null) {
		this.site = name.site;
		assert(name.toString() != "_");
		assert(!name.toString().startsWith("undefined"));
		this.#name = name;
		this.#index = null;
		this.#variable = variable;
	}

	/**
	 * @type {string}
	 */
	get name() {
		return this.#name.toString();
	}

	/**
	 * isVariable() should be used to check if a IRNameExpr.variable is equal to a IRVariable (includes special handling of "__core*")
	 * @type {IRVariable}
	 */
	get variable() {
		if (this.#variable === null) {
			throw new Error(`variable should be set (name: ${this.name})`);
		} else {
			return this.#variable;
		}
	}

	/**
	 * @type {number}
	 */
	get flatSize() {
		if (this.isCore()) {
			let nForce = 0;

			let name = this.name;
			if (!name.startsWith(MACRO_BUILTIN_PREFIX) && name.startsWith(BUILTIN_PREFIX)) {
				if (name.endsWith(SAFE_BUILTIN_SUFFIX)) {
					name = name.slice(0, name.length - SAFE_BUILTIN_SUFFIX.length);
				}

				nForce = UPLC_BUILTINS[IRScope.findBuiltin(name)].forceCount;
			}

			return 13 + 4*nForce; // 4 for header, 7 for builtin index, 4 per force
		} else {
			return 13; // 4 for term header, and assume DeBruijn index fits in 7 bits
		}
	}

	/**
	 * Used when inlining
	 * @param {(oldExpr: IRExpr, newExpr: IRExpr) => void} notifyCopy
	 * @param {Map<IRVariable, IRVariable>} varMap
	 * @returns {IRNameExpr}
	 */
	copy(notifyCopy, varMap) {
		const variable = (this.#variable ? (varMap.get(this.#variable) ?? this.#variable) : this.#variable);

		const newExpr = new IRNameExpr(this.#name, variable);

		notifyCopy(this, newExpr);

		return newExpr;
	}

	/**
	 * @internal
	 * @returns {boolean}
	 */
	isCore() {
		const name = this.name;

		return name.startsWith(BUILTIN_PREFIX);
	}

	/**
	 * @internal
	 * @returns {boolean}
	 */
	isParam() {
		return this.name.startsWith("__PARAM")
	}

	/**
	 * @param {IRVariable} ref 
	 * @returns {boolean}
	 */
	isVariable(ref) {
		if (this.isCore()) {
			return false;
		} else {
			return this.variable === ref;
		}
	}

	/**
	 * @param {string} indent 
	 * @returns {string}
	 */
	toString(indent = "") {
		return this.#name.toString();
	}

	/**
	 * @param {IRScope} scope
	 */
	resolveNames(scope) {
		if (!this.isCore()) {
			if (this.#variable == null || this.isParam()) {
				[this.#index, this.#variable] = scope.get(this.#name);
			} else {
				[this.#index, this.#variable] = scope.get(this.#variable);
			}
		}
	}

	/**
	 * @returns {UplcTerm}
	 */
	toUplc() {
		if (this.isCore()) {
			return IRCallExpr.newUplcBuiltin(this.site, this.name);
		} else if (this.#index === null) {
			// use a dummy index (for size calculation)
			return new UplcVariable(
				this.site,
				new UplcInt(this.site, BigInt(0), false),
			);
		} else {
			return new UplcVariable(
				this.site,
				new UplcInt(this.site, BigInt(this.#index), false),
			);
		}
	}
}

/**
 * IR wrapper for UplcValues, representing literals
 * @internal
 * @implements {IRExpr}
 */
export class IRLiteralExpr {
	/**
	 * @readonly
	 * @type {Site}
	 */
	site;

	/**
	 * @type {UplcValue}
	 */
	#value;

	/**
	 * @param {UplcValue} value 
	 */
	constructor(value) {
		this.site = value.site;

		this.#value = value;
	}

	/**
	 * @type {UplcValue}
	 */
	get value() {
		return this.#value;
	}

	/**
	 * @type {number}
	 */
	get flatSize() {
		return (new UplcConst(this.#value)).flatSize;
	}

	/**
	 * @param {string} indent 
	 * @returns {string}
	 */
	toString(indent = "") {
		return this.#value.toString();
	}

	/**
	 * @param {NotifyCopy} notifyCopy
	 * @param {Map<IRVariable, IRVariable>} varMap
	 * @returns {IRExpr}
	 */
	copy(notifyCopy, varMap) {
		return this;
	}

	/**
	 * Linking doesn't do anything for literals
	 * @param {IRScope} scope 
	 */
	resolveNames(scope) {
	}

	/**
	 * @returns {UplcConst}
	 */
	toUplc() {
		return new UplcConst(this.#value);
	}
}

/**
 * IR function expression with some args, that act as the header, and a body expression
 * @internal
 * @implements {IRExpr}
 */
export class IRFuncExpr {
	/**
	 * @readonly
	 * @type {Site}
	 */
	site;

	/**
	 * Mutation is more convenient and much faster when applying some optimizations.
	 * @readwrite
	 * @type {IRVariable[]}
	 */
	args;

	/**
	 * Mutation is more convenient and much faster when applying some optimizations.
	 * @readwrite
	 * @type {IRExpr}
	 */
	body;

	/**
	 * A unique tag, that distinguishes each IRFuncExpr from each other IRFuncExpr (used for hashing)
	 * @readonly
	 * @type {number}
	 */
	tag;

	/**
	 * @param {Site} site 
	 * @param {IRVariable[]} args 
	 * @param {IRExpr} body 
	 * @param {number} tag
	 */
	constructor(site, args, body, tag) {
		this.site = site;
		this.args = args;
		this.body = assertDefined(body);
		this.tag = tag;
	}

	/**
	 * @type {number}
	 */
	get flatSize() {
		const nArgs = this.args.length;
		return 4 + (nArgs > 0 ? (nArgs - 1)*4 : 0) + this.body.flatSize;
	}

	/**
	 * @returns {boolean}
	 */
	hasOptArgs() {
		const b = this.args.some(a => a.name.startsWith("__useopt__"));

		if (b) {
			return b;
		}

		if (this.body instanceof IRFuncExpr) {
			return this.body.hasOptArgs();
		} else {
			return false;
		}
	}

	/**
	 * @param {string} indent 
	 * @returns {string}
	 */
	toString(indent = "") {
		let innerIndent = (this.body instanceof IRCallExpr && this.body.func instanceof IRFuncExpr && this.body.args.length == 1 && this.body.func instanceof IRFuncExpr && this.body.func.args[0].name.startsWith("__")) ? indent : indent + TAB;

		let s = "(" + this.args.map(n => n.toString()).join(", ") + ") -> {\n" + innerIndent;
		s += this.body.toString(innerIndent);
		s += "\n" + indent + "}";

		return s;
	}

	/**
	 * @param {IRScope} scope 
	 */
	resolveNames(scope) {
		// in the zero-arg case no Debruijn indices need to be added because we use Delay/Force

		for (let arg of this.args) {
			scope = new IRScope(scope, arg);
		}

		this.body.resolveNames(scope);
	}

	/**
	 * @param {NotifyCopy} notifyCopy
	 * @param {Map<IRVariable, IRVariable>} varMap
	 * @returns {IRExpr}
	 */
	copy(notifyCopy, varMap) {
		const args = this.args.map(a => a.copy(varMap));
		const newExpr = new IRFuncExpr(this.site, args, this.body.copy(notifyCopy, varMap), this.tag);

		notifyCopy(this, newExpr);

		return newExpr;
	}

	/** 
	 * @returns {UplcTerm}
	 */
	toUplc() {
		let term = this.body.toUplc();

		if (this.args.length == 0) {
			// a zero-arg func is turned into a UplcDelay term
			term = new UplcDelay(this.site, term);
		} else {
			for (let i = this.args.length - 1; i >= 0; i--) {
				term = new UplcLambda(this.site, term, this.args[i].toString());
			}
		}

		return term;
	}
}

/**
 * Base class of IRUserCallExpr and IRCoreCallExpr
 * @internal
 * @implements {IRExpr}
 */
export class IRCallExpr {
	/**
	 * @readonly
	 * @type {Site}
	 */
	site;

	/**
	 * Mutation is more convenient and much faster when applying some optimizations.
	 * @readwrite
	 * @type {IRExpr}
	 */
	func;

	/**
	 * Mutation is more convenient and much faster when applying some optimizations.
	 * @readwrite
	 * @type {IRExpr[]}
	 */
	args;

	/**
	 * @param {Site} site
	 * @param {IRExpr} func
	 * @param {IRExpr[]} args
	 */
	constructor(site, func, args) {
		this.site = site;
		this.func = func;
		this.args = args;
	}

	/**
	 * @returns {boolean}
	 */
	isSafeBuiltin() {
		if (this.func instanceof IRNameExpr && this.func.isCore()) {
			return this.func.name.endsWith(SAFE_BUILTIN_SUFFIX);
		} else {
			return false;
		}
	}

	/**
	 * Returns an empty string this isn't a builtin
	 * @type {string}
	 */
	get builtinName() {
		if (this.func instanceof IRNameExpr && this.func.isCore()) {
			let name = this.func.name.toString().slice(BUILTIN_PREFIX.length);

			if (name.endsWith(SAFE_BUILTIN_SUFFIX)) {
				name = name.slice(0, name.length - SAFE_BUILTIN_SUFFIX.length);
			}

			return name;
		} else {
			return "";
		}
	}

	get flatSize() {
		return 4 + this.args.reduce((prev, arg) => arg.flatSize + prev, 0) + this.func.flatSize;
	}

	/**
	 * @param {string} indent 
	 * @returns {string}
	 */
	argsToString(indent = "") {
		return this.args.map(argExpr => argExpr.toString(indent)).join(", ")
	}

	/**
	 * @param {string} indent
	 * @returns {string}
	 */
	toString(indent = "") {
		if (this.builtinName == "ifThenElse") {
			return `${BUILTIN_PREFIX}${this.builtinName}(\n${indent}${TAB}${this.args[0].toString(indent + TAB)},\n${indent}${TAB}${this.args[1].toString(indent + TAB)},\n${indent}${TAB}${this.args[2].toString(indent+TAB)}\n${indent})`;
		} else if (this.builtinName != "") {
			return `${BUILTIN_PREFIX}${this.builtinName}(${this.argsToString(indent)})`;
		} else {
			let comment = (this.func instanceof IRFuncExpr && this.func.args.length == 1 && this.func.args[0].name.startsWith("__")) ? `/*${this.func.args[0].name}*/` : "";

			return `${this.func.toString(indent)}(${comment}${this.argsToString(indent)})`;
		}
	}

	/**
	 * @param {IRScope} scope 
	 */
	resolveNamesInArgs(scope) {
		for (let argExpr of this.args) {
			argExpr.resolveNames(scope);
		}
	}

	/**
	 * @param {IRScope} scope 
	 */
	resolveNames(scope) {
		if (this.func instanceof IRNameExpr && this.func.isCore()) {
			this.resolveNamesInArgs(scope);
		} else {
			this.func.resolveNames(scope);
			this.resolveNamesInArgs(scope);
		}
	}

	/**
	 * @param {NotifyCopy} notifyCopy
	 * @param {Map<IRVariable, IRVariable>} varMap
	 * @returns {IRExpr}
	 */
	copy(notifyCopy, varMap) {
		const newExpr = new IRCallExpr(this.site, this.func.copy(notifyCopy, varMap), this.args.map(a => a.copy(notifyCopy, varMap)));

		notifyCopy(this, newExpr);

		return newExpr;
	}

	/**
	 * @param {UplcTerm} term
	 * @returns {UplcTerm}
	 */
	toUplcCall(term) {
		if (this.args.length == 0) {
			// assuming underlying zero-arg function has been converted into a UplcDelay term
			term = new UplcForce(this.site, term);
		} else {
			for (let argExpr of this.args) {
				
				term = new UplcCall(this.site, term, argExpr.toUplc());
			}
		}

		return term;
	}

	/**
	 * @param {Site} site
	 * @param {string} name - full name of builtin, including prefix
	 * @returns {UplcTerm}
	 */
	static newUplcBuiltin(site, name) {
		assert(name.startsWith(BUILTIN_PREFIX));

		if (name.endsWith(SAFE_BUILTIN_SUFFIX)) {
			name = name.slice(0, name.length - SAFE_BUILTIN_SUFFIX.length);
		}

		const builtinName = name.slice(BUILTIN_PREFIX.length);

		/**
		 * @type {UplcTerm}
		 */
		let term = new UplcBuiltin(site, builtinName);

		if (!builtinName.startsWith("macro__")) {
			const nForce = UPLC_BUILTINS[IRScope.findBuiltin(name)].forceCount;
	
			for (let i = 0; i < nForce; i++) {
				term = new UplcForce(site, term);
			}
		}
 
		return term;
	}

	/**
	 * @returns {UplcTerm}
	 */
	toUplc() {
		if (this.func instanceof IRNameExpr && this.func.name.startsWith(BUILTIN_PREFIX)) {
			let term = IRCallExpr.newUplcBuiltin(this.site, this.func.name);

			return this.toUplcCall(term);
		} else {
			return this.toUplcCall(this.func.toUplc());
		}
	}
}

/**
 * Intermediate Representation error call (with optional literal error message)
 * @internal
 * @implements {IRExpr}
 */
export class IRErrorExpr {
	/**
	 * @readonly
	 * @type {Site}
	 */
	site;

	#msg;

	/**
	 * @param {Site} site 
	 * @param {string} msg 
	 */
	constructor(site, msg = "") {
		this.site = site;
		this.#msg = msg;
	}

	/**
	 * @type {number}
	 */
	get flatSize() {
		return 4;
	}

	/**
	 * @param {string} indent 
	 * @returns {string}
	 */
	toString(indent = "") {
		return "error()";
	}

	/**
	 * @param {IRScope} scope 
	 */
	resolveNames(scope) {
	}

	/**
	 * @param {NotifyCopy} notifyCopy
	 * @returns {IRExpr}
	 */
	copy(notifyCopy) {
		const newExpr = new IRErrorExpr(this.site, this.#msg);

		notifyCopy(this, newExpr);

		return newExpr;
	}

	/**
	 * @returns {UplcTerm}
	 */
	toUplc() {
		return new UplcError(this.site, this.#msg);
	}
}

/**
 * @internal
 * @param {IRExpr} root 
 * @param {{
 *   nameExpr?: (expr: IRNameExpr) => void
 *   errorExpr?: (expr: IRErrorExpr) => void
 *   literalExpr?: (expr: IRLiteralExpr) => void
 *   callExpr?: (expr: IRCallExpr) => void
 *   funcExpr?: (expr: IRFuncExpr) => void
 *   exit?: () => boolean
 * }} callbacks 
 * @returns 
 */
export function loopIRExprs(root, callbacks) {
	const stack = [root];

	let head = stack.pop();

	while (head) {
		if (head instanceof IRNameExpr) {
			if (callbacks.nameExpr) {
				callbacks.nameExpr(head);
			}
		} else if (head instanceof IRErrorExpr) {
			if (callbacks.errorExpr) {
				callbacks.errorExpr(head);
			}
		} else if (head instanceof IRLiteralExpr) {
			if (callbacks.literalExpr) {
				callbacks.literalExpr(head);
			}
		} else if (head instanceof IRCallExpr) {
			stack.push(head.func);

			for (let a of head.args) {
				stack.push(a);
			}

			if (callbacks.callExpr) {
				callbacks.callExpr(head);
			}
		} else if (head instanceof IRFuncExpr) {
			if (callbacks.funcExpr) {
				callbacks.funcExpr(head);
			}

			stack.push(head.body);
		}

		if (callbacks.exit && callbacks.exit()) {
			return;
		}

		head = stack.pop();
	}
}