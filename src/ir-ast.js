//@ts-check
// IR AST objects

import {
    TAB
} from "./constants.js";

import {
    assert,
    assertClass,
    assertDefined
} from "./utils.js";

import {
    RuntimeError,
    Site,
    Token,
    Word
} from "./tokens.js";

import {
    UPLC_BUILTINS
} from "./uplc-builtins.js";

import {
    UplcBool,
    UplcBuiltin,
    UplcByteArray,
    UplcCall,
    UplcConst,
    UplcDelay,
    UplcError,
    UplcForce,
    UplcInt,
    UplcLambda,
    UplcList,
    UplcMap,
    UplcString,
    UplcTerm,
    UplcValue,
    UplcVariable
} from "./uplc-ast.js";

import {
	IRCallStack,
	IRDeferredValue,
	IRFuncValue,
	IRLiteralValue,
	IRScope,
	IRValue,
	IRVariable
} from "./ir-context.js";
import { buildLiteralExprFromJson } from "./helios-param.js";

/**
 * Map of variables to IRExpr
 * @package
 */
export class IRExprStack {
	#throwRTErrors;
	#map;

	/**
	 * @param {boolean} throwRTErrors
	 * Keeps order
	 * @param {Map<IRVariable, IRExpr>} map
	 */
	constructor(throwRTErrors, map = new Map()) {
		this.#throwRTErrors = throwRTErrors;
		this.#map = map;
	}

	get throwRTErrors() {
		return this.#throwRTErrors;
	}

	/**
	 * Doesn't mutate, returns a new stack
	 * @param {IRVariable} ref 
	 * @param {IRExpr} value 
	 * @returns {IRExprStack}
	 */
	set(ref, value) {
		/**
		 * @type {Map<IRVariable, IRExpr>}
		 */
		let map = new Map();

		for (let [k, v] of this.#map) {
			map.set(k, v);
		}

		map.set(ref, value);

		return new IRExprStack(this.#throwRTErrors, map);
	}

	/**
	 * Mutates
	 * @param {IRVariable} variable
	 * @param {IRExpr} expr
	 */
	setInline(variable, expr) {
		this.#map.set(variable, expr);
	}

	/**
	 * @param {IRVariable} ref
	 * @returns {boolean}
	 */
	has(ref) {
		return this.#map.has(ref);
	}

	/**
	 * Returns null if not found
	 * @param {IRVariable} ref
	 * @returns {IRExpr}
	 */
	get(ref) {
		return assertDefined(this.#map.get(ref)).copy();
	}

	/**
	 * @returns {IRCallStack}
	 */
	initCallStack() {
		let stack = new IRCallStack(this.#throwRTErrors);

		for (let [variable, expr] of this.#map) {
			let val = expr.eval(stack);
			if (val !== null) {
				stack = stack.set(variable, val);
			}
		}

		return stack;
	}

	/**
	 * Returns a list of the names in the stack
	 * @returns {string}
	 */
	dump() {
		let names = [];

		for (let [k, _] of this.#map) {
			names.push(k.name);
		}

		return names.join(", ");
	}
}

/**
 * @typedef {(expr: IRExpr) => IRExpr} IRWalkFn
 */

/**
 * @typedef {Map<IRVariable, IRLiteralExpr>} IRLiteralRegistry
 */

export class IRNameExprRegistry {
	/**
	 * @type {Map<IRVariable, Set<IRNameExpr>>}
	 */
	#map;

	/**
	 * @type {Set<IRVariable>}
	 */
	#maybeInsideLoop;

	/**
	 * Reset whenever recursion is detected.
	 * @type {Set<IRVariable>}
	 */
	#variables;

	/**
	 * @param {Map<IRVariable, Set<IRNameExpr>>} map
	 */
	constructor(map = new Map(), maybeInsideLoop = new Set()) {
		this.#map = map;
		this.#maybeInsideLoop = maybeInsideLoop;
		this.#variables = new Set();
	}

	/**
	 * @param {IRNameExpr} nameExpr 
	 */
	register(nameExpr) {
		if (!nameExpr.isCore()) {
			const variable = nameExpr.variable;

			if (!this.#map.has(variable)) {
				this.#map.set(variable, new Set([nameExpr]));
			} else {
				assertDefined(this.#map.get(variable)).add(nameExpr);
			}

			// add another reference in case of recursion
			if (!this.#variables.has(variable)) {
				this.#maybeInsideLoop.add(variable);
			}
		}
	}

	/**
	 * Used to prevent inlining upon recursion
	 * @param {IRVariable} variable
	 */
	registerVariable(variable) {
		this.#variables.add(variable)
	}

	/**
	 * @param {IRVariable} variable 
	 * @returns {number}
	 */
	countReferences(variable) {
		const set = this.#map.get(variable);

		if (set == undefined) {
			return 0;
		} else {
			return set.size;
		}
	}

	/**
	 * @param {IRVariable} variable 
	 * @returns {boolean}
	 */
	maybeInsideLoop(variable) {
		return this.#maybeInsideLoop.has(variable);
	}

	/**
	 * Called whenever recursion is detected
	 * @returns {IRNameExprRegistry}
	 */
	resetVariables() {
		return new IRNameExprRegistry(this.#map, this.#maybeInsideLoop);
	}
}

export class IRExprRegistry {
	#nameExprs;

	/**
	 * @type {Map<IRVariable, IRExpr>}
	 */
	#inline;

	/**
	 * @param {IRNameExprRegistry} nameExprs 
	 */
	constructor(nameExprs) {
		this.#nameExprs = nameExprs;
		this.#inline = new Map();
	}

	/**
	 * @param {IRVariable} variable 
	 * @returns {number}
	 */
	countReferences(variable) {
		return this.#nameExprs.countReferences(variable);
	}

	/**
	 * @param {IRVariable} variable 
	 * @returns {boolean}
	 */
	maybeInsideLoop(variable) {
		return this.#nameExprs.maybeInsideLoop(variable);
	}

	/**
	 * @param {IRVariable} variable
	 * @returns {boolean}
	 */
	isInlineable(variable) {
		return this.#inline.has(variable);
	}

	/**
	 * @param {IRVariable} variable
	 * @returns {IRExpr}
	 */
	getInlineable(variable) {
		return assertDefined(this.#inline.get(variable)).copy();
	}

	/**
	 * @param {IRVariable} variable 
	 * @param {IRExpr} expr 
	 */
	addInlineable(variable, expr) {
		this.#inline.set(variable, expr);
	}
}

/**
 * Base class of all Intermediate Representation expressions
 * @package
 */
export class IRExpr extends Token {
	/**
	 * @param {Site} site 
	 */
	constructor(site) {
		super(site);
	}

	/**
	 * For pretty printing the IR
	 * @param {string} indent 
	 * @returns {string}
	 */
	toString(indent = "") {
		throw new Error("not yet implemented");
	}

	/**
	 * Link IRNameExprs to variables
	 * @param {IRScope} scope 
	 */
	resolveNames(scope) {
		throw new Error("not yet implemented");
	}

	/**
	 * Turns all IRConstExpr istances into IRLiteralExpr instances
	 * @param {IRCallStack} stack 
	 * @returns {IRExpr}
	 */
	evalConstants(stack) {
		throw new Error("not yet implemented");
	}

	/**
	 * Evaluates an expression to something (hopefully) literal
	 * Returns null if it the result would be worse than the current expression
	 * Doesn't return an IRLiteral because the resulting expression might still be an improvement, even if it isn't a literal
	 * @param {IRCallStack} stack
	 * @returns {?IRValue}
	 */
	eval(stack) {
		throw new Error("not yet implemented");
	}

	/**
	 * Used to inline literals and to evaluate IRCoreCallExpr instances with only literal args.
	 * @param {IRLiteralRegistry} literals
	 * @returns {IRExpr}
	 */
	simplifyLiterals(literals) {
		throw new Error("not yet implemented");
	}

	/**
	 * Used before simplifyTopology
	 * @param {IRNameExprRegistry} nameExprs
	 */
	registerNameExprs(nameExprs) {
		throw new Error("not yet implemented");
	}

	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr}
	 */
	simplifyTopology(registry) {
		throw new Error("not yet implemented");
	}

	/**
	 * Used during inlining/expansion to make sure multiple inlines of IRNameExpr don't interfere when setting the index
	 * @returns {IRExpr}
	 */
	copy() {
		throw new Error("not yet implemented");
	}

	/**
	 * Counts the number of times a variable is referenced inside the current expression
	 * @param {IRVariable} ref
	 * @returns {number}
	 */
	countRefs(ref) {
		throw new Error("not yet implemented");
	}

	/**
	 * Inline every variable that can be found in the stack.
	 * @param {IRExprStack} stack
	 * @returns {IRExpr}
	 */
	inline(stack) {
		throw new Error("not yet implemented");
	}

	

	/**
	 * @param {IRWalkFn} fn 
	 * @returns {IRExpr}
	 */
	walk(fn) {
		throw new Error("not yet implemented");
	}

	/**
	 * Returns non-null expr if ok
	 * @param {IRVariable} ref
	 * @param {string} builtinName
	 * @returns {?IRExpr}
	 */
	wrapCall(ref, builtinName) {
		throw new Error("not yet implemented")
	}

	/**
	 * @param {IRVariable} ref 
	 * @returns {?IRExpr}
	 */
	flattenCall(ref) {
		throw new Error("not yet implemented");
	}

	/**
	 * Simplify 'this' by returning something smaller (doesn't mutate)
	 * @param {IRExprStack} stack - contains some global definitions that might be useful for simplification
	 * @returns {IRExpr}
	 */
	simplify(stack) {
		throw new Error("not yet implemented");
	}

	/**
	 * @returns {UplcTerm}
	 */
	toUplc() {
		throw new Error("not yet implemented");
	}
}

/**
 * Intermediate Representation variable reference expression
 * @package
 */
export class IRNameExpr extends IRExpr {
	#name;

	/**
	 * @type {?number} - cached debruijn index 
	 */
	#index;

	/**
	 * @type {?IRVariable} - cached variable (note that core functions can be referenced as variables (yet))
	 */
	#variable;

	/**
	 * @param {Word} name 
	 * @param {?IRVariable} variable
	 */
	constructor(name, variable = null) {
		super(name.site);
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
	 * @package
	 * @returns {boolean}
	 */
	isCore() {
		const name = this.name;

		return name.startsWith("__core");
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
		if (!this.name.startsWith("__core")) {
			if (this.#variable == null || this.name.startsWith("__PARAM")) {
				[this.#index, this.#variable] = scope.get(this.#name);
			} else {
				[this.#index, this.#variable] = scope.get(this.#variable);
			}
		}
	}

	/**
	 * @param {IRCallStack} stack 
	 * @returns {IRExpr}
	 */
	evalConstants(stack) {
		return this;
	}

	/**
	 * @param {IRCallStack} stack
	 * @returns {?IRValue}
	 */
	eval(stack) {
		if (this.isCore()) {
			return new IRFuncValue((args) => {
				return IRCoreCallExpr.evalValues(this.site, stack.throwRTErrors, this.#name.value.slice("__core__".length), args);
			});
		} else if (this.#variable === null) {
			throw new Error("variable should be set");
		} else {
			return stack.get(this.#variable);
		}
	}

	/**
	 * @param {IRLiteralRegistry} literals
	 * @returns {IRExpr}
	 */
	simplifyLiterals(literals) {
		if (this.#variable !== null && literals.has(this.#variable)) {
			return assertDefined(literals.get(this.#variable));
		} else {
			return this;
		}
	}

	/**
	 * @param {IRNameExprRegistry} nameExprs
	 */
	registerNameExprs(nameExprs) {
		nameExprs.register(this);
	}

	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr}
	 */
	simplifyTopology(registry) {
		if (!this.isCore() && registry.isInlineable(this.variable)) {
			return registry.getInlineable(this.variable);
		} else {
			return this;
		}
	}

	copy() {
		return new IRNameExpr(this.#name, this.#variable);
	}

	/**
	 * @param {IRVariable} ref
	 * @returns {number}
	 */
	countRefs(ref) {
		return this.isVariable(ref) ? 1 : 0;
	}

	/**
	 * @param {IRExprStack} stack
	 * @returns {IRExpr}
	 */
	inline(stack) {
		if (this.isCore()) {
			return this;
		} else if (this.#variable === null) {
			throw new Error("variable should be set");
		} else {
			if (stack.has(this.#variable)) {
				return stack.get(this.#variable).inline(stack);
			} else {
				return this;
			}
		}
	}

	/**
	 * @param {IRWalkFn} fn 
	 * @returns {IRExpr}
	 */
	walk(fn) {
		return fn(this);
	}

	/**
	 * @param {IRVariable} ref 
	 * @param {string} builtinName 
	 * @returns {?IRExpr}
	 */
	wrapCall(ref, builtinName) {
		return this.isVariable(ref) ? null : this;
	}

	/**
	 * @param {IRVariable} ref 
	 * @returns {?IRExpr}
	 */
	flattenCall(ref) {
		return this.isVariable(ref) ? null : this;
	}

	/**
	 * @param {IRExprStack} stack
	 * @returns {IRExpr}
	 */
	simplify(stack) {
		if (this.isCore()) {
			return this;
		} else if (this.#variable === null) {
			throw new Error("variable should be set");
		} else {
			// first check if expanded version is smaller
			if (stack.has(this.#variable)) {
				let that = stack.get(this.#variable);

				
				return that;
			} else {
				return this;
			}
		}
	}

	/**
	 * @returns {UplcTerm}
	 */
	toUplc() {
		if (this.name.startsWith("__core")) {
			return IRCoreCallExpr.newUplcBuiltin(this.site, this.name);
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
 * @package
 */
export class IRLiteralExpr extends IRExpr {
	/**
	 * @type {UplcValue}
	 */
	#value;

	/**
	 * @param {UplcValue} value 
	 */
	constructor(value) {
		super(value.site);

		this.#value = value;
	}

	/**
	 * @type {UplcValue}
	 */
	get value() {
		return this.#value;
	}

	copy() {
		return new IRLiteralExpr(this.#value);
	}

	/**
	 * @param {string} indent 
	 * @returns {string}
	 */
	toString(indent = "") {
		return this.#value.toString();
	}

	/**
	 * Linking doesn't do anything for literals
	 * @param {IRScope} scope 
	 */
	resolveNames(scope) {
	}

	/**
	 * @param {IRCallStack} stack
	 */
	evalConstants(stack) {
		return this;
	}

	/**
	 * @param {IRCallStack} stack
	 * @returns {?IRValue}
	 */
	eval(stack) {
		return new IRLiteralValue(this.value);
	}

	/**
	 * @param {IRLiteralRegistry} literals
	 * @returns {IRExpr}
	 */
	simplifyLiterals(literals) {
		return this;
	}

	/**
	 * @param {IRNameExprRegistry} nameExprs
	 */
	registerNameExprs(nameExprs) {
	}

	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr}
	 */
	simplifyTopology(registry) {
		return this;
	}

	/**
	 * @param {IRVariable} ref
	 * @returns {number}
	 */
	countRefs(ref) {
		return 0;
	}

	/**
	 * Returns 'this' (nothing to inline)
	 * @param {IRExprStack} stack
	 * @returns {IRExpr}
	 */
	inline(stack) {
		return this;
	}
	
	/**
	 * @param {IRVariable} ref 
	 * @param {string} builtinName 
	 * @returns {?IRExpr}
	 */
	wrapCall(ref, builtinName) {
		return this;
	}

	/**
	 * @param {IRVariable} ref 
	 * @returns {?IRExpr}
	 */
	flattenCall(ref) {
		return this;
	}

	/**
	 * @param {IRWalkFn} fn 
	 * @returns {IRExpr}
	 */
	walk(fn) {
		return fn(this);
	}

	/**
	 * @param {IRExprStack} stack
	 * @param {IRLiteralExpr[]} args
	 * @returns {?IRExpr}
	 */
	call(stack, args) {
		throw new Error("can't call literal");
	}

	/**
	 * Returns 'this' (nothing to simplify)
	 * @param {IRExprStack} stack
	 * @returns {IRExpr}
	 */
	simplify(stack) {
		return this;
	}

	/**
	 * @returns {UplcConst}
	 */
	toUplc() {
		return new UplcConst(this.#value);
	}
}

/**
 * The IRExpr simplify methods aren't implemented because any IRConstExpr instances should've been eliminated during evalConstants.
 * @package
 */
export class IRConstExpr extends IRExpr {
	#expr;

	/**
	 * @param {Site} site 
	 * @param {IRExpr} expr 
	 */
	constructor(site, expr) {
		super(site);
		this.#expr = expr;
	}

	toString(indent = "") {
		return `const(${this.#expr.toString(indent)})`;
	}

	/**
	 * @param {IRScope} scope 
	 */
	resolveNames(scope) {
		this.#expr.resolveNames(scope);
	}

	/**
	 * @param {IRCallStack} stack
	 * @returns {IRExpr}
	 */
	evalConstants(stack) {
		const result = this.#expr.eval(stack);

		if (result != null) {
			return new IRLiteralExpr(result.value);
		} else {
			throw new Error("unable to evaluate const");
		}
	}

	/**
	 * @param {IRCallStack} stack 
	 * @returns {?IRValue}
	 */
	eval(stack) {
		return this.#expr.eval(stack);
	}
}

/**
 * IR function expression with some args, that act as the header, and a body expression
 * @package
 */
export class IRFuncExpr extends IRExpr {
	#args;
	#body;

	/**
	 * @param {Site} site 
	 * @param {IRVariable[]} args 
	 * @param {IRExpr} body 
	 */
	constructor(site, args, body) {
		super(site);
		this.#args = args;
		this.#body = assertDefined(body);
	}

	get args() {
		return this.#args.slice();
	}

	get body() {
		return this.#body;
	}

	/**
	 * @param {string} indent 
	 * @returns {string}
	 */
	toString(indent = "") {
		let innerIndent = (this.#body instanceof IRUserCallExpr && this.#body.argExprs.length == 1 && this.#body.fnExpr instanceof IRFuncExpr && this.#body.fnExpr.args[0].name.startsWith("__")) ? indent : indent + TAB;

		let s = "(" + this.#args.map(n => n.toString()).join(", ") + ") -> {\n" + innerIndent;
		s += this.#body.toString(innerIndent);
		s += "\n" + indent + "}";

		return s;
	}

	/**
	 * @param {IRScope} scope 
	 */
	resolveNames(scope) {
		// in the zero-arg case no Debruijn indices need to be added because we use Delay/Force

		for (let arg of this.#args) {
			scope = new IRScope(scope, arg);
		}

		this.#body.resolveNames(scope);
	}

	/**
	 * @param {IRCallStack} stack 
	 */
	evalConstants(stack) {
		return new IRFuncExpr(this.site, this.args, this.#body.evalConstants(stack));
	}

	/**
	 * @param {IRCallStack} stack
	 * @returns {?IRValue}
	 */
	eval(stack) {
		return new IRFuncValue((args) => {
			if (args.length != this.#args.length) {
				throw this.site.syntaxError(`expected ${this.#args.length} arg(s), got ${args.length} arg(s)`);
			}

			for (let i = 0; i < args.length; i++) {
				stack = stack.set(this.#args[i], args[i]);
			}

			return this.#body.eval(stack);
		});
	}

	/**
	 * @param {IRLiteralRegistry} literals 
	 * @returns {IRExpr}
	 */
	simplifyLiterals(literals) {
		return new IRFuncExpr(this.site, this.args, this.#body.simplifyLiterals(literals));
	}
	
	/**
	 * @param {IRNameExprRegistry} nameExprs
	 */
	registerNameExprs(nameExprs) {
		nameExprs = nameExprs.resetVariables();

		this.#args.forEach(a => nameExprs.registerVariable(a));

		this.#body.registerNameExprs(nameExprs);
	}

	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr}
	 */
	simplifyTopology(registry) {
		return new IRFuncExpr(this.site, this.args, this.#body.simplifyTopology(registry));
	}

	copy() {
		return new IRFuncExpr(this.site, this.args, this.#body.copy());
	}

	/**
	 * @param {IRVariable} ref
	 * @returns {number}
	 */
	countRefs(ref) {
		return this.#body.countRefs(ref);
	}

	/**
	 * Inline expressions in the body
	 * Checking of unused args is done by caller
	 * @param {IRExprStack} stack
	 * @returns {IRFuncExpr}
	 */
	inline(stack) {
		return new IRFuncExpr(this.site, this.#args, this.#body.inline(stack));
	}

	/**
	 * @param {IRWalkFn} fn
	 * @returns {IRExpr}
	 */
	walk(fn) {
		let body = this.body.walk(fn);

		return fn(new IRFuncExpr(this.site, this.args, body));
	}

	/**
	 * @param {IRVariable} ref
	 * @param {string} builtinName 
	 * @returns {?IRExpr}
	 */
	wrapCall(ref, builtinName) {
		let body = this.body.wrapCall(ref, builtinName);

		if (body !== null) {
			return new IRFuncExpr(this.site, this.args, body);
		} else {
			return null;
		}
	}

	/**
	 * @param {IRVariable} ref 
	 * @returns {?IRExpr}
	 */
	flattenCall(ref) {
		let body = this.body.flattenCall(ref);

		if (body !== null) {
			return new IRFuncExpr(this.site, this.args, body);
		} else {
			return null;
		}
	}

	/**
	 * Simplify body, returning a IRFuncExpr with the same args
	 * @param {IRExprStack} stack
	 * @returns {IRFuncExpr}
	 */
	simplifyBody(stack) {
		return new IRFuncExpr(this.site, this.#args, this.#body.simplify(stack));
	}

	/**
	 * Simplify body
	 * (Checking of unused args is done by caller)
	 * @param {IRExprStack} stack
	 * @returns {IRExpr}
	 */
	simplify(stack) {
		// a IRFuncExpr that wraps a Call with the same arguments, in the same order, can simply return that function
		if (this.#body instanceof IRCallExpr && this.#body.argExprs.length == this.#args.length && this.#body.argExprs.every((a, i) => {
			return (a instanceof IRNameExpr) && (!a.isCore()) && (this.#args[i] === a.variable);
		})) {
			if (this.#body instanceof IRCoreCallExpr) {
				return new IRNameExpr(new Word(this.site, `__core__${this.#body.builtinName}`));
			} else if (this.#body instanceof IRUserCallExpr && this.#body.fnExpr instanceof IRNameExpr) {
				return this.#body.fnExpr;
			}
		}

		return this.simplifyBody(stack);
	}

	/** 
	 * @returns {UplcTerm}
	 */
	toUplc() {
		let term = this.#body.toUplc();

		if (this.#args.length == 0) {
			// a zero-arg func is turned into a UplcDelay term
			term = new UplcDelay(this.site, term);
		} else {
			for (let i = this.#args.length - 1; i >= 0; i--) {
				term = new UplcLambda(this.site, term, this.#args[i].toString());
			}
		}

		return term;
	}
}


/**
 * Base class of IRUserCallExpr and IRCoreCallExpr
 * @package
 */
export class IRCallExpr extends IRExpr {
	#argExprs;
	#parensSite;

	/**
	 * @param {Site} site
	 * @param {IRExpr[]} argExprs 
	 * @param {Site} parensSite 
	 */
	constructor(site, argExprs, parensSite) {
		super(site);
		this.#argExprs = argExprs;
		this.#parensSite = parensSite;
		
	}

	get argExprs() {
		return this.#argExprs.slice();
	}

	get parensSite() {
		return this.#parensSite;
	}

	/**
	 * @param {string} indent 
	 * @returns {string}
	 */
	argsToString(indent = "") {
		return this.#argExprs.map(argExpr => argExpr.toString(indent)).join(", ")
	}

	/**
	 * @param {IRScope} scope 
	 */
	resolveNamesInArgs(scope) {
		for (let argExpr of this.#argExprs) {
			argExpr.resolveNames(scope);
		}
	}

	/**
	 * @param {IRCallStack} stack 
	 * @returns {IRExpr[]}
	 */
	evalConstantsInArgs(stack) {
		return this.#argExprs.map(a => a.evalConstants(stack));
	}

	/** 
	 * @param {IRCallStack} stack
	 * @returns {?IRValue[]} 
	 */
	evalArgs(stack) {
		/**
		 * @type {IRValue[]}
		 */
		let args = [];

		for (let argExpr of this.argExprs) {
			let argVal = argExpr.eval(stack);
			if (argVal !== null) {
				args.push(argVal);
			} else {
				return null;
			}
		}

		return args;
	}

	/**
	 * @param {IRLiteralRegistry} literals
	 * @returns {IRExpr[]}
	 */
	simplifyLiteralsInArgs(literals) {
		return this.#argExprs.map(a => a.simplifyLiterals(literals));
	}

	/**
	 * @param {IRNameExprRegistry} nameExprs 
	 */
	registerNameExprsInArgs(nameExprs) {
		this.#argExprs.forEach(a => a.registerNameExprs(nameExprs));
	}

	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr[]}
	 */
	simplifyTopologyInArgs(registry) {
		return this.#argExprs.map(a => a.simplifyTopology(registry));
	}

	/**
	 * @param {IRVariable} ref
	 * @returns {number}
	 */
	countRefs(ref) {
		let count = 0;
		for (let argExpr of this.#argExprs) {
			count += argExpr.countRefs(ref);
		}

		return count;
	}

	/**
	 * @param {IRWalkFn} fn
	 * @returns {IRExpr[]}
	 */
	walkArgs(fn) {
		return this.#argExprs.map(expr => expr.walk(fn));
	}

	/**
	 * @param {IRVariable} ref 
	 * @param {string} builtinName 
	 * @returns {?IRExpr[]}
	 */
	wrapCallArgs(ref, builtinName) {
		/**
		 * @type {IRExpr[]}
		 */
		let wrapped = [];

		for (let argExpr of this.#argExprs) {
			let newArgExpr = argExpr.wrapCall(ref, builtinName);

			if (newArgExpr === null) {
				return null;
			} else {
				wrapped.push(newArgExpr);
			}
		}

		return wrapped;
	}

	/**
	 * @param {IRVariable} ref 
	 * @returns {?IRExpr[]}
	 */
	flattenCallArgs(ref) {
		/**
		 * @type {IRExpr[]}
		 */
		let args = [];

		for (let argExpr of this.#argExprs) {
			let arg = argExpr.flattenCall(ref);

			if (arg === null) {
				return null;
			} else {
				args.push(arg);
			}
		}

		return args;
	}

	/**
	 * @param {IRExprStack} stack
	 * @param {boolean} inline
	 * @returns {IRExpr[]}
	 */
	simplifyArgs(stack, inline = false) {
		if (inline) {
			return this.#argExprs.map(argExpr => argExpr.inline(stack));
		} else {
			return this.#argExprs.map(argExpr => argExpr.simplify(stack));
		}
	}

	/**
	 * @param {UplcTerm} term
	 * @returns {UplcTerm}
	 */
	toUplcCall(term) {
		if (this.#argExprs.length == 0) {
			// assuming underlying zero-arg function has been converted into a UplcDelay term
			term = new UplcForce(this.site, term);
		} else {
			for (let argExpr of this.#argExprs) {
				term = new UplcCall(this.site, term, argExpr.toUplc());
			}
		}

		return term;
	}
}

/**
 * IR function call of core functions
 * @package
 */
export class IRCoreCallExpr extends IRCallExpr {
	#name;

	/**
	 * @param {Word} name 
	 * @param {IRExpr[]} argExprs 
	 * @param {Site} parensSite 
	 */
	constructor(name, argExprs, parensSite) {
		super(name.site, argExprs, parensSite);
		assert(name.value !== "" && name.value !== "error");
		this.#name = name;

		assert(this.builtinName !== "", name.value);
	}

	get builtinName() {
		return this.#name.toString().slice(8);
	}

	/**
	 * @returns {boolean}
	 */
	isCast() {
		let name = this.builtinName;

		return name == "iData" || name == "bData" || name == "unIData" || name == "unBData" || name == "mapData" || name == "unMapData" || name == "listData" || name == "unListData";
	}

	/**
	 * @param {string} indent
	 * @returns {string}
	 */
	toString(indent = "") {
		if (this.builtinName == "ifThenElse") {
			return `${this.#name.toString()}(\n${indent}${TAB}${this.argExprs[0].toString(indent + TAB)},\n${indent}${TAB}${this.argExprs[1].toString(indent + TAB)},\n${indent}${TAB}${this.argExprs[2].toString(indent+TAB)}\n${indent})`;
		} else {
			return `${this.#name.toString()}(${this.argsToString(indent)})`;
		}
	}

	/**
	 * @param {IRScope} scope 
	 */
	resolveNames(scope) {
		this.resolveNamesInArgs(scope);
	}

	/**
	 * @param {Site} site
	 * @param {boolean} throwRTErrors
	 * @param {string} builtinName
	 * @param {IRValue[]} args 
	 * @returns {?IRValue}
	 */
	static evalValues(site, throwRTErrors, builtinName, args) {
		if (builtinName == "ifThenElse") {
			let cond = args[0].value;
			if (cond !== null && cond instanceof UplcBool) {
				if (cond.bool) {
					return args[1];
				} else {
					return args[2];
				}
			} else {
				return null;
			}
		} else if (builtinName == "trace") {
			return args[1];
		} else {
			/**
			 * @type {UplcValue[]}
			 */
			let argValues = [];

			for (let arg of args) {
				if (arg.value !== null) {
					argValues.push(arg.value);
				} else {
					return null;
				}
			}

			try {
				let result = UplcBuiltin.evalStatic(new Word(Site.dummy(), builtinName), argValues);

				return new IRLiteralValue(result);
			} catch(e) {
				// runtime errors like division by zero are allowed if throwRTErrors is false
				if (e instanceof RuntimeError) {
					if (!throwRTErrors) {
						return null;
					} else {
						throw e.addTraceSite(site);
					}
				} else {
					throw e;
				}
			}
		}
	}

	/**
	 * @param {IRCallStack} stack 
	 * @returns {IRExpr}
	 */
	evalConstants(stack) {
		return new IRCoreCallExpr(this.#name, this.evalConstantsInArgs(stack), this.parensSite);
	}
	
	/**
	 * @param {IRCallStack} stack
	 * @returns {?IRValue}
	 */
	eval(stack) {
		let args = this.evalArgs(stack);

		if (args !== null) {
			return IRCoreCallExpr.evalValues(this.site, stack.throwRTErrors, this.builtinName, args);
		}
		
		return null;
	}

	/**
	 * @param {IRLiteralRegistry} literals
	 * @returns {IRExpr}
	 */
	simplifyLiterals(literals) {
		const args = this.simplifyLiteralsInArgs(literals);

		switch(this.builtinName) {
			case "addInteger": {
					// check if first or second arg evaluates to 0
					const [a, b] = args;

					if (a instanceof IRLiteralExpr && a.value instanceof UplcInt && a.value.int == 0n) {
						return b;
					} else if (b instanceof IRLiteralExpr && b.value instanceof UplcInt && b.value.int == 0n) {
						return a;
					}
				}
				break;
			case "appendByteString": {
					// check if either 1st or 2nd arg is the empty bytearray
					const [a, b] = args;
					if (a instanceof IRLiteralExpr && a.value instanceof UplcByteArray && a.value.bytes.length == 0) {
						return b;
					} else if (b instanceof IRLiteralExpr && b.value instanceof UplcByteArray && b.value.bytes.length == 0) {
						return a;
					}
				}
				break;
			case "appendString": {
					// check if either 1st or 2nd arg is the empty string
					const [a, b] = args;
					if (a instanceof IRLiteralExpr && a.value instanceof UplcString && a.value.string.length == 0) {
						return b;
					} else if (b instanceof IRLiteralExpr && b.value instanceof UplcString && b.value.string.length == 0) {
						return a;
					}
				}
				break;
			case "divideInteger": {
					// check if second arg is 1
					const [a, b] = args;
					if (b instanceof IRLiteralExpr && b.value instanceof UplcInt) {
						if (b.value.int == 1n) {
							return a;
						} else if (b.value.int == 0n) {
							return new IRCoreCallExpr(this.#name, args, this.parensSite);
						}
					}
				}
				break;
			case "ifThenElse": {
					const [cond, a, b] = args;

					if (cond instanceof IRLiteralExpr && cond.value instanceof UplcBool) {
						// if the condition is a literal, one the branches can be returned
						if (cond.value.bool) {
							return a;
						} else {
							return b;
						}
					} else if (a instanceof IRLiteralExpr && a.value instanceof UplcBool && b instanceof IRLiteralExpr && b.value instanceof UplcBool) {
						if (a.value.bool && !b.value.bool) {
							return cond;
						} else if (
							!a.value.bool && 
							b.value.bool && 
							cond instanceof IRUserCallExpr && 
							cond.fnExpr instanceof IRNameExpr && 
							cond.fnExpr.name === "__helios__common__not"
						) {
							return cond.argExprs[0];
						}	
					}
				}
				break;
			case "modInteger": {
					// check if second arg is 1
					const [a, b] = args;
					if (b instanceof IRLiteralExpr && b.value instanceof UplcInt && b.value.int == 1n) {
						return new IRLiteralExpr(new UplcInt(this.site, 0n));
					}
				}
				break;
			case "multiplyInteger": {
					// check if first arg is 0 or 1
					const [a, b] = args;
					if (a instanceof IRLiteralExpr && a.value instanceof UplcInt) {
						if (a.value.int == 0n) {
							return a;
						} else if (a.value.int == 1n) {
							return b;
						}
					} else if (b instanceof IRLiteralExpr && b.value instanceof UplcInt) {
						if (b.value.int == 0n) {
							return b;
						} else if (b.value.int == 1n) {
							return a;
						}
					}
				}
				break;
			case "subtractInteger": {
					// check if second arg evaluates to 0
					const [a, b] = args;
					if (b instanceof IRLiteralExpr && b.value instanceof UplcInt && b.value.int == 0n) {
						return a;
					}
				}
				break;
		}

		if (args.every(a => a instanceof IRLiteralExpr)) {
			return new IRLiteralExpr(
				UplcBuiltin.evalStatic(
					new Word(this.#name.site, this.builtinName),
					args.map(a => assertClass(a, IRLiteralExpr).value)
				)
			);
		} else {
			return new IRCoreCallExpr(this.#name, args, this.parensSite);
		}
	}

	/**
	 * @param {IRNameExprRegistry} nameExprs
	 */
	registerNameExprs(nameExprs) {
		this.registerNameExprsInArgs(nameExprs);
	}

	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr}
	 */
	simplifyTopology(registry) {
		const args = this.simplifyTopologyInArgs(registry);

		switch(this.builtinName) {
			case "encodeUtf8":
				// we can't eliminate a call to decodeUtf8, as it might throw some errors
				break;
			case "decodeUtf8": {
					// check if arg is a call to encodeUtf8
					const [arg] = args;
					if (arg instanceof IRCoreCallExpr && arg.builtinName == "encodeUtf8") {
						return arg.argExprs[0];
					}
				}
				break;			
			case "equalsData": {
				const [a, b] = args;

				if (a instanceof IRCoreCallExpr && b instanceof IRCoreCallExpr) {
					if (a.builtinName === "iData" && b.builtinName === "iData") {
						return new IRCoreCallExpr(new Word(this.site, "__core__equalsInteger"), [a.argExprs[0], b.argExprs[0]], this.parensSite);	
					} else if (a.builtinName === "bData" && b.builtinName === "bData") {
						return new IRCoreCallExpr(new Word(this.site, "__core__equalsByteString"), [a.argExprs[0], b.argExprs[0]], this.parensSite);	
					} else if (a.builtinName === "decodeUtf8" && b.builtinName === "decodeUtf8") {
						return new IRCoreCallExpr(new Word(this.site, "__core__equalsString"), [a.argExprs[0], b.argExprs[0]], this.parensSite);
					}
				}

				break;
			}
			case "trace":
				return args[1];
			case "unIData": {
					// check if arg is a call to iData
					const a = args[0];
					if (a instanceof IRCoreCallExpr && a.builtinName == "iData") {
						return a.argExprs[0];
					}
				}
				break;
			case "iData": {
					// check if arg is a call to unIData
					const a = args[0];
					if (a instanceof IRCoreCallExpr && a.builtinName == "unIData") {
						return a.argExprs[0];
					}
				}
				break;
			case "unBData": {
					// check if arg is a call to bData
					const a = args[0];
					if (a instanceof IRCoreCallExpr && a.builtinName == "bData") {
						return a.argExprs[0];
					}
				}
				break;
			case "bData": {
					// check if arg is a call to unBData
					const a = args[0];
					if (a instanceof IRCoreCallExpr && a.builtinName == "unBData") {
						return a.argExprs[0];
					}
				}
				break;
			case "unMapData": {
					// check if arg is call to mapData
					const a = args[0];
					if (a instanceof IRCoreCallExpr && a.builtinName == "mapData") {
						return a.argExprs[0];
					}
				}
				break;
			case "mapData": {
					// check if arg is call to unMapData
					const a = args[0];
					if (a instanceof IRCoreCallExpr && a.builtinName == "unMapData") {
						return a.argExprs[0];
					}
				}
				break;
			case "listData": {
					// check if arg is call to unListData
					const a = args[0];
					if (a instanceof IRCoreCallExpr && a.builtinName == "unListData") {
						return a.argExprs[0];
					}
				}
				break;
			case "unListData": {
					// check if arg is call to listData
					const a = args[0];
					if (a instanceof IRCoreCallExpr && a.builtinName == "listData") {
						return a.argExprs[0];
					}
				}
				break;
		}

		return new IRCoreCallExpr(this.#name, args, this.parensSite);
	}

	copy() {
		return new IRCoreCallExpr(this.#name, this.argExprs.map(a => a.copy()), this.parensSite);
	}

	/**
	 * @param {IRWalkFn} fn 
	 * @returns {IRExpr}
	 */
	walk(fn) {
		let args = this.walkArgs(fn);

		return fn(new IRCoreCallExpr(this.#name, args, this.parensSite));
	}

	/**
	 * @param {IRVariable} ref 
	 * @param {string} builtinName
	 * @returns {?IRExpr}
	 */
	wrapCall(ref, builtinName) {
		let args = this.wrapCallArgs(ref, builtinName);

		if (args !== null) {
			return new IRCoreCallExpr(this.#name, args, this.parensSite);
		} else {
			return null;
		}
	}

	/**
	 * 
	 * @param {IRVariable} ref 
	 * @returns {?IRExpr}
	 */
	flattenCall(ref) {
		let args = this.flattenCallArgs(ref);

		if (args !== null) {
			return new IRCoreCallExpr(this.#name, args, this.parensSite);
		} else {
			return null
		}
	}

	/**
	 * @param {boolean} throwRTErrors
	 * @param {IRExpr[]} argExprs
	 * @returns {?IRExpr}
	 */
	simplifyLiteralArgs(throwRTErrors, argExprs) {
		if (this.builtinName == "ifThenElse") {
			assert(argExprs.length == 3);
			let cond = argExprs[0];
			let a = argExprs[1];
			let b = argExprs[2];

			if (cond instanceof IRLiteralExpr && cond.value instanceof UplcBool) {
				if (cond.value.bool) {
					return a;
				} else {
					return b;
				}
			} else if (a instanceof IRLiteralExpr && a.value instanceof UplcBool && b instanceof IRLiteralExpr && b.value instanceof UplcBool) {
				if (a.value.bool && !b.value.bool) {
					return cond;
				} else if (cond instanceof IRUserCallExpr && cond.fnExpr instanceof IRNameExpr && cond.fnExpr.name === "__helios__common__not") {
					return cond.argExprs[0];
				}	
			}
		} else if (this.builtinName == "trace") {
			assert(argExprs.length == 2);
			return argExprs[1];
		} else {
			// if all the args are literals -> return the result

			/**
			 * @type {UplcValue[]}
			 */
			let argValues = [];

			for (let arg of argExprs) {
				if (arg instanceof IRLiteralExpr) {
					argValues.push(arg.value);
				} else {
					return null;
				}
			}

			try {
				let result = UplcBuiltin.evalStatic(new Word(this.#name.site, this.builtinName), argValues);

				return new IRLiteralExpr(result);
			} catch(e) {
				if (e instanceof RuntimeError) {
					if (!throwRTErrors) {
						return null;
					} else {
						throw e.addTraceSite(this.site);
					}
				} else {
					throw e;
				}
			}
		}
		
		return null;
	}

	/**
	 * @param {IRExpr[]} argExprs
	 * @returns {?IRExpr}
	 */
	simplifyTopology_(argExprs) {
		switch (this.builtinName) {			
			case "encodeUtf8":
				// we can't eliminate a call to decodeUtf8, as it might throw some errors
				break;
			case "decodeUtf8": {
					// check if arg is a call to encodeUtf8
					let argExpr = argExprs[0];
					if (argExpr instanceof IRCoreCallExpr && argExpr.builtinName == "encodeUtf8") {
						return argExpr.argExprs[0];
					}
				}
				break;
			case "ifThenElse": {
					// check if first arg evaluates to constant condition
					let cond = argExprs[0];
					if (cond instanceof IRLiteralExpr && cond.value instanceof UplcBool) {
						return cond.value.bool ? argExprs[1] : argExprs[2];
					}
				}
				break;
			case "addInteger": {
					// check if first or second arg evaluates to 0
					let a = argExprs[0];
					if (a instanceof IRLiteralExpr && a.value instanceof UplcInt && a.value.int == 0n) {
						return argExprs[1];
					} else {
						let b = argExprs[1];
						if (b instanceof IRLiteralExpr && b.value instanceof UplcInt && b.value.int == 0n) {
							return argExprs[0];
						}
					}
				}
				break;
			case "subtractInteger": {
					// check if second arg evaluates to 0
					let b = argExprs[1];
					if (b instanceof IRLiteralExpr && b.value instanceof UplcInt && b.value.int == 0n) {
						return argExprs[0];
					}
				}
				break;
			case "multiplyInteger": {
					// check if first arg is 0 or 1
					let a = argExprs[0];
					if (a instanceof IRLiteralExpr && a.value instanceof UplcInt) {
						if (a.value.int == 0n) {
							return a;
						} else if (a.value.int == 1n) {
							return argExprs[1];
						}
					} else {
						let b = argExprs[1];
						if (b instanceof IRLiteralExpr && b.value instanceof UplcInt) {
							if (b.value.int == 0n) {
								return b;
							} else if (b.value.int == 1n) {
								return argExprs[0];
							}
						}
					}
				}
				break;
			case "divideInteger": {
					// check if second arg is 1
					let b = argExprs[1];
					if (b instanceof IRLiteralExpr && b.value instanceof UplcInt && b.value.int == 1n) {
						return argExprs[0];
					}
				}
				break;
			case "modInteger": {
					// check if second arg is 1
					let b = argExprs[1];
					if (b instanceof IRLiteralExpr && b.value instanceof UplcInt && b.value.int == 1n) {
						return new IRLiteralExpr(new UplcInt(this.site, 0n));
					}
				}
				break;
			case "appendByteString": {
					// check if either 1st or 2nd arg is the empty bytearray
					let a = argExprs[0];
					if (a instanceof IRLiteralExpr && a.value instanceof UplcByteArray && a.value.bytes.length == 0) {
						return argExprs[1];
					} else {
						let b = argExprs[1];
						if (b instanceof IRLiteralExpr && b.value instanceof UplcByteArray && b.value.bytes.length == 0) {
							return argExprs[0];
						}
					}
				}
				break;
			case "appendString": {
					// check if either 1st or 2nd arg is the empty string
					let a = argExprs[0];
					if (a instanceof IRLiteralExpr && a.value instanceof UplcString && a.value.string.length == 0) {
						return argExprs[1];
					} else {
						let b = argExprs[1];
						if (b instanceof IRLiteralExpr && b.value instanceof UplcString && b.value.string.length == 0) {
							return argExprs[0];
						}
					}
				}
				break;
			case "equalsData": {
				let a = argExprs[0];
				let b = argExprs[1];

				if (a instanceof IRCoreCallExpr && b instanceof IRCoreCallExpr) {
					if (a.builtinName === "iData" && b.builtinName === "iData") {
						return new IRCoreCallExpr(new Word(this.site, "__core__equalsInteger"), [a.argExprs[0], b.argExprs[0]], this.parensSite);	
					} else if (a.builtinName === "bData" && b.builtinName === "bData") {
						return new IRCoreCallExpr(new Word(this.site, "__core__equalsByteString"), [a.argExprs[0], b.argExprs[0]], this.parensSite);	
					} else if (a.builtinName === "decodeUtf8" && b.builtinName === "decodeUtf8") {
						return new IRCoreCallExpr(new Word(this.site, "__core__equalsString"), [a.argExprs[0], b.argExprs[0]], this.parensSite);
					}
				}

				break;
			}
			case "trace":
				return argExprs[1];
			case "unIData": {
					// check if arg is a call to iData
					let argExpr = argExprs[0];
					if (argExpr instanceof IRCoreCallExpr && argExpr.builtinName == "iData") {
						return argExpr.argExprs[0];
					}
				}
				break;
			case "iData": {
					// check if arg is a call to unIData
					let argExpr = argExprs[0];
					if (argExpr instanceof IRCoreCallExpr && argExpr.builtinName == "unIData") {
						return argExpr.argExprs[0];
					}
				}
				break;
			case "unBData": {
					// check if arg is a call to bData
					let argExpr = argExprs[0];
					if (argExpr instanceof IRCoreCallExpr && argExpr.builtinName == "bData") {
						return argExpr.argExprs[0];
					}
				}
				break;
			case "bData": {
					// check if arg is a call to unBData
					let argExpr = argExprs[0];
					if (argExpr instanceof IRCoreCallExpr && argExpr.builtinName == "unBData") {
						return argExpr.argExprs[0];
					}
				}
				break;
			case "unMapData": {
					// check if arg is call to mapData
					let argExpr = argExprs[0];
					if (argExpr instanceof IRCoreCallExpr && argExpr.builtinName == "mapData") {
						return argExpr.argExprs[0];
					}
				}
				break;
			case "mapData": {
					// check if arg is call to unMapData
					let argExpr = argExprs[0];
					if (argExpr instanceof IRCoreCallExpr && argExpr.builtinName == "unMapData") {
						return argExpr.argExprs[0];
					}
				}
				break;
			case "listData": {
					// check if arg is call to unListData
					let argExpr = argExprs[0];
					if (argExpr instanceof IRCoreCallExpr && argExpr.builtinName == "unListData") {
						return argExpr.argExprs[0];
					}
				}
				break;
			case "unListData": {
					// check if arg is call to listData
					let argExpr = argExprs[0];
					if (argExpr instanceof IRCoreCallExpr && argExpr.builtinName == "listData") {
						return argExpr.argExprs[0];
					}
				}
				break;
		}

		return null;
	}

	/**
	 * @param {IRExprStack} stack
	 * @returns {IRExpr}
	 */
	inline(stack) {
		return new IRCoreCallExpr(this.#name, super.simplifyArgs(stack, true), this.parensSite);
	}

	/**
	 * @param {IRExprStack} stack
	 * @returns {IRExpr}
	 */
	simplify(stack) {
		let argExprs = super.simplifyArgs(stack);

		{
			let maybeBetter = this.simplifyLiteralArgs(stack.throwRTErrors, argExprs);
			if (maybeBetter !== null) {
				return maybeBetter;
			}
		}

		{
			let maybeBetter = this.simplifyTopology_(argExprs);
			if (maybeBetter !== null) {
				return maybeBetter;
			}
		}
		
		return new IRCoreCallExpr(this.#name, argExprs, this.parensSite);
	}

	/**
	 * @param {Site} site
	 * @param {string} name - full name of builtin, including prefix
	 * @returns {UplcTerm}
	 */
	static newUplcBuiltin(site, name) {
		let builtinName = name.slice("__core__".length);
		assert(!builtinName.startsWith("__core__"));

		/**
		 * @type {UplcTerm}
		 */
		let term = new UplcBuiltin(site, builtinName);

		let nForce = UPLC_BUILTINS[IRScope.findBuiltin(name)].forceCount;
 
		for (let i = 0; i < nForce; i++) {
			term = new UplcForce(site, term);
		}
 
		return term;
	}

	/**
	 * @returns {UplcTerm}
	 */
	toUplc() {
		let term = IRCoreCallExpr.newUplcBuiltin(this.site, this.#name.value);

		return this.toUplcCall(term);
	}
}

/**
 * IR function call of non-core function
 * @package
 */
export class IRUserCallExpr extends IRCallExpr {
	#fnExpr;

	/**
	 * @param {IRExpr} fnExpr 
	 * @param {IRExpr[]} argExprs 
	 * @param {Site} parensSite 
	 */
	constructor(fnExpr, argExprs, parensSite) {
		super(fnExpr.site, argExprs, parensSite);

		this.#fnExpr = fnExpr;
	}

	/**
	 * @param {IRExpr} fnExpr 
	 * @param {IRExpr[]} argExprs 
	 * @param {Site} parensSite 
	 * @returns {IRUserCallExpr}
	 */
	static new(fnExpr, argExprs, parensSite) {
		if (fnExpr instanceof IRAnonCallExpr) {
			return new IRNestedAnonCallExpr(fnExpr, argExprs, parensSite);
		} else if (fnExpr instanceof IRFuncExpr) {
			if (argExprs.length == 1 && argExprs[0] instanceof IRFuncExpr) {
				const argExpr = argExprs[0];

				if (argExpr instanceof IRFuncExpr) {
					return new IRFuncDefExpr(fnExpr, argExpr, parensSite);
				}
			}

			return new IRAnonCallExpr(fnExpr, argExprs, parensSite);
		} else {
			return new IRUserCallExpr(fnExpr, argExprs, parensSite);
		}
	}

	get fnExpr() {
		return this.#fnExpr;
	}

	/**
	 * @param {string} indent
	 * @returns {string}
	 */
	toString(indent = "") {
		let comment = (this.#fnExpr instanceof IRFuncExpr && this.#fnExpr.args.length == 1 && this.#fnExpr.args[0].name.startsWith("__")) ? `/*${this.#fnExpr.args[0].name}*/` : "";

		return `${this.#fnExpr.toString(indent)}(${comment}${this.argsToString(indent)})`;
	}

	/**
	 * @param {IRScope} scope 
	 */
	resolveNames(scope) {
		this.#fnExpr.resolveNames(scope);

		super.resolveNamesInArgs(scope);
	}

	/**
	 * @param {IRCallStack} stack
	 * @returns {IRExpr}
	 */
	evalConstants(stack) {
		return IRUserCallExpr.new(
			this.#fnExpr.evalConstants(stack),
			this.evalConstantsInArgs(stack),
			this.parensSite
		);
	}

	/**
	 * @param {IRCallStack} stack 
	 * @returns {?IRValue}
	 */
	eval(stack) {
		let args = this.evalArgs(stack);

		if (args === null) {
			return null;
		} else {
			let fn = this.#fnExpr.eval(stack);

			if (fn === null) {
				return null;
			} else {
				try {
					return fn.call(args);
				} catch (e) {
					if (e instanceof RuntimeError) {
						if (!stack.throwRTErrors) {
							return null;
						} else {
							throw e.addTraceSite(this.site);
						}
					} else {
						throw e;
					}
				}
			}
		}
	}

	/**
	 * @param {IRLiteralRegistry} literals
	 * @returns {IRExpr}
	 */
	simplifyLiterals(literals) {
		const args = this.simplifyLiteralsInArgs(literals);

		return IRUserCallExpr.new(
			this.#fnExpr.simplifyLiterals(literals),
			args, 
			this.parensSite
		);
	}

	/**
	 * @param {IRNameExprRegistry} nameExprs 
	 */
	registerNameExprs(nameExprs) {
		this.registerNameExprsInArgs(nameExprs);
		
		this.#fnExpr.registerNameExprs(nameExprs);
	}

	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr}
	 */
	simplifyTopology(registry) {
		const args = this.simplifyTopologyInArgs(registry);

		if (this.#fnExpr instanceof IRNameExpr) {
			if (this.#fnExpr.isCore()) {
				return new IRCoreCallExpr(new Word(this.#fnExpr.site, this.#fnExpr.name), args, this.parensSite);
			} else {
				switch (this.#fnExpr.name) {
					case "__helios__common__boolData": {
							// check if arg is a call to __helios__common__unBoolData
							const a = args[0];
							if (a instanceof IRUserCallExpr && a.fnExpr instanceof IRNameExpr && a.fnExpr.name == "__helios__common__unBoolData") {
								return a.argExprs[0];
							}
						}
						break;
					case "__helios__common__unBoolData": {
							// check if arg is a call to __helios__common__boolData
							const a = args[0];
							if (a instanceof IRUserCallExpr && a.fnExpr instanceof IRNameExpr && a.fnExpr.name == "__helios__common__boolData") {
								return a.argExprs[0];
							}
						}
						break;
					case "__helios__common__not": {
							const a = args[0];
							if (a instanceof IRUserCallExpr && a.fnExpr instanceof IRNameExpr && a.fnExpr.name == "__helios__common__not") {
								return a.argExprs[0];
							}
						}
						break;
					case "__helios__common__concat": {
							// check if either 1st or 2nd arg is the empty list
							const [a, b] = args;
							if (a instanceof IRLiteralExpr && a.value instanceof UplcList && a.value.list.length == 0) {
								return b;
							} else if (a instanceof IRLiteralExpr && a.value instanceof UplcMap && a.value.map.length == 0) {
								return b;
							} else {
								if (b instanceof IRLiteralExpr && b.value instanceof UplcList && b.value.list.length == 0) {
									return a;
								} else if (b instanceof IRLiteralExpr && b.value instanceof UplcMap && b.value.map.length == 0) {
									return a;
								}
							}
						}
						break;
				}
			}
		}

		return IRUserCallExpr.new(
			this.#fnExpr.simplifyTopology(registry),
			args,
			this.parensSite
		);
	}

	copy() {
		return new IRUserCallExpr(this.#fnExpr.copy(), this.argExprs.map(a => a.copy()), this.parensSite);
	}

	/**
	 * @param {IRVariable} ref
	 * @returns {number}
	 */
	countRefs(ref) {
		return this.#fnExpr.countRefs(ref) + super.countRefs(ref);
	}

	/**
	 * @param {IRWalkFn} fn
	 * @returns {IRExpr}
	 */
	walk(fn) {
		let args = this.walkArgs(fn);

		return fn(new IRUserCallExpr(this.#fnExpr.walk(fn), args, this.parensSite));
	}

	/**
	 * @param {IRExprStack} stack
	 * @returns {IRExpr}
	 */
	inline(stack) {
		return new IRUserCallExpr(this.#fnExpr.inline(stack), super.simplifyArgs(stack, true), this.parensSite);
	}

	/**
	 * 
	 * @param {IRVariable} ref 
	 * @param {string} builtinName 
	 * @returns {?IRExpr}
	 */
	wrapCall(ref, builtinName) {
		let args = super.wrapCallArgs(ref, builtinName);

		if (args !== null) {
			if (this.#fnExpr instanceof IRNameExpr && this.#fnExpr.isVariable(ref)) {
				let res = new IRCoreCallExpr(
					new Word(this.parensSite, `__core__${builtinName}`), 
					[new IRUserCallExpr(this.#fnExpr, args, this.parensSite)], 
					this.parensSite
				);

				return res;
			} else {
				let fnExpr = this.#fnExpr.wrapCall(ref, builtinName);

				if (fnExpr === null) {
					return null;
				} else {
					return new IRUserCallExpr(fnExpr, args, this.parensSite);
				}
			}		
		} else {
			return null;
		}
	}

	/**
	 * @param {IRVariable} ref
	 * @returns {?IRExpr}
	 */
	flattenCall(ref) {
		if (this.#fnExpr instanceof IRNameExpr && this.#fnExpr.isVariable(ref)) {
			return null;
		} else if (this.#fnExpr instanceof IRUserCallExpr && this.#fnExpr.fnExpr instanceof IRNameExpr && this.#fnExpr.fnExpr.isVariable(ref)) {
			let allArgs = this.#fnExpr.argExprs.concat(this.argExprs);

			let argsf = [];

			for (let arg of allArgs) {
				let argf = arg.flattenCall(ref);

				if (argf === null) {
					return null;
				} else {
					argsf.push(argf);
				}
			}
			
			return new IRUserCallExpr(this.#fnExpr.fnExpr, argsf, this.parensSite);
		} else {
			let fnExpr = this.#fnExpr.flattenCall(ref);

			if (fnExpr !== null) {
				let args = this.flattenCallArgs(ref);

				if (args !== null) {
					return new IRUserCallExpr(fnExpr, args, this.parensSite);
				} else {
					return null;
				}
			} else {
				return null;
			}
		}
	}

	/**
	 * Inlines arguments that are only used once in fnExpr.
	 * Also eliminates unused arguments
	 * @param {IRExprStack} stack
	 * @param {IRExpr} fnExpr - already simplified
	 * @param {IRExpr[]} argExprs - already simplified
	 * @returns {?IRExpr} - returns null if it isn't simpler
	 */
	inlineArgs(stack, fnExpr, argExprs) {
		// inline single use vars, and eliminate unused vars
		if (fnExpr instanceof IRFuncExpr) {
			/**
			 * @type {IRVariable[]}
			 */
			let remVars = [];

			/**
			 * @type {IRExpr[]}
			 */
			let remArgExprs = [];

			let inlineStack = new IRExprStack(stack.throwRTErrors);

			for (let i = 0; i < fnExpr.args.length; i++) {
				let variable = fnExpr.args[i];
				let nRefs = fnExpr.countRefs(variable);
				let argExpr = argExprs[i];

				if (nRefs == 0) {
					// don't add
				} else if (nRefs == 1 || argExpr instanceof IRNameExpr) {
					// inline for sure
					inlineStack.setInline(variable, argExpr);
				} else {
					remVars.push(variable);
					remArgExprs.push(argExpr);
				}
			}

			if (remArgExprs.length < argExprs.length || remArgExprs.length == 0) {
				if (remArgExprs.length == 0) {
					return fnExpr.inline(inlineStack).body;
				} else {
					return new IRUserCallExpr(new IRFuncExpr(fnExpr.site, remVars, fnExpr.inline(inlineStack).body), remArgExprs, this.parensSite);
				}
			}
		}

		return null;
	}

	/**
	 * Inline all literal args if the resulting expression is an improvement over the current expression
	 * @param {IRExprStack} stack
	 * @param {IRExpr} fnExpr - already simplified
	 * @param {IRExpr[]} argExprs - already simplified
	 * @returns {?IRExpr} - returns null if it isn't simpler
	 */
	inlineLiteralArgs(stack, fnExpr, argExprs) {
		if (fnExpr instanceof IRFuncExpr) {
			let inlineStack = new IRExprStack(stack.throwRTErrors);

			/**
			 * @type {IRVariable[]}
			 */
			let remVars = [];

			/**
			 * @type {IRExpr[]}
			 */
			let remArgs = [];

			let argVariables = fnExpr.args;

			for (let i = 0; i < argVariables.length; i++) {
				let v = argVariables[i];
				let argExpr = argExprs[i];
				if (argExpr instanceof IRLiteralExpr) {
					inlineStack.setInline(v, argExpr);
				} else {
					remVars.push(v);
					remArgs.push(argExpr);
				}
			}

			if (remVars.length < argVariables.length) {
				let that = new IRUserCallExpr(new IRFuncExpr(fnExpr.site, remVars, fnExpr.body.inline(inlineStack)), remArgs, this.parensSite);

				return that;
			}
		}
		
		return null;
	}

	/**
	 * Simplify some specific builtin functions
	 * @param {IRExprStack} stack
	 * @param {IRExpr} fnExpr
	 * @param {IRExpr[]} argExprs
	 * @returns {?IRExpr}
	 */
	simplifyTopology_(stack, fnExpr, argExprs) {
		if (fnExpr instanceof IRNameExpr) {
			switch (fnExpr.name) {
				case "__helios__common__boolData": {
						// check if arg is a call to __helios__common__unBoolData
						let argExpr = argExprs[0];
						if (argExpr instanceof IRUserCallExpr && argExpr.fnExpr instanceof IRNameExpr && argExpr.fnExpr.name == "__helios__common__unBoolData") {
							return argExpr.argExprs[0];
						}
					}
					break;
				case "__helios__common__unBoolData": {
						// check if arg is a call to __helios__common__boolData
						let argExpr = argExprs[0];
						if (argExpr instanceof IRUserCallExpr && argExpr.fnExpr instanceof IRNameExpr && argExpr.fnExpr.name == "__helios__common__boolData") {
							return argExpr.argExprs[0];
						}
					}
					break;
				case "__helios__common__concat": {
						// check if either 1st or 2nd arg is the empty list
						let a = argExprs[0];
						if (a instanceof IRLiteralExpr && a.value instanceof UplcList && a.value.list.length == 0) {
							return argExprs[1];
						} else if (a instanceof IRLiteralExpr && a.value instanceof UplcMap && a.value.map.length == 0) {
							return argExprs[1];
						} else {
							let b = argExprs[1];
							if (b instanceof IRLiteralExpr && b.value instanceof UplcList && b.value.list.length == 0) {
								return argExprs[0];
							} else if (b instanceof IRLiteralExpr && b.value instanceof UplcMap && b.value.map.length == 0) {
								return argExprs[0];
							}
						}
					}
					break;
			}
		}

		return null;
	}

	/**
	 * Evaluates fnExpr if all args are literals
	 * Otherwise returns null
	 * @param {IRExprStack} stack
	 * @param {IRExpr} fnExpr
	 * @param {IRExpr[]} argExprs
	 * @returns {?IRExpr}
	 */
	simplifyLiteral(stack, fnExpr, argExprs) {
		let callExpr = new IRUserCallExpr(fnExpr, argExprs, this.parensSite);
		
		let callStack = stack.initCallStack();
		
		let res = callExpr.eval(callStack);

		if (res === null) {
			return null;
		} else {
			return new IRLiteralExpr(res.value);
		}
	}

	simplifyFlatten() {
		if (this.fnExpr instanceof IRFuncExpr && this.argExprs.some(e => e instanceof IRFuncExpr)) {
			/** @type {IRExpr[]} */
			let args = [];

			/** @type {IRFuncExpr} */
			let that = this.fnExpr;
			let someFlattened = false;

			for (let i = 0; i < this.argExprs.length; i++) {
				let a = this.argExprs[i];

				if (a instanceof IRFuncExpr && a.body instanceof IRFuncExpr) {
					// try to flatten
					let aBetter = new IRFuncExpr(a.site, a.args.concat(a.body.args), a.body.body);

					let maybeThat = that.flattenCall(this.fnExpr.args[i]);

					if (maybeThat !== null && maybeThat instanceof IRFuncExpr) {
						args.push(aBetter);
						that = maybeThat;
						someFlattened = true;
					} else {
						args.push(a);
					}
				} else {
					args.push(a);
				}
			}

			if (someFlattened) {
				return new IRUserCallExpr(that, args, this.parensSite);
			}
		}

		return this;
	}

	/**
	 * @param {IRExprStack} stack
	 * @returns {IRExpr}
	 */
	simplifyWithoutExtractingCasts(stack) {
		let argExprs = this.simplifyArgs(stack);

		{
			let maybeBetter = this.simplifyLiteral(stack, this.#fnExpr, this.argExprs);
			if (maybeBetter !== null) {
				return maybeBetter;
			}
		}

		let innerStack = stack;

		if (this.#fnExpr instanceof IRFuncExpr) {
			assert(argExprs.length == this.#fnExpr.args.length);
			for (let i = 0; i < argExprs.length; i++) {
				let v = this.#fnExpr.args[i];
				innerStack = innerStack.set(v, argExprs[i]);
			}
		}

		let fnExpr = this.#fnExpr.simplify(innerStack);

		if (fnExpr instanceof IRNameExpr && fnExpr.name.startsWith("__core")) {
			return new IRCoreCallExpr(new Word(fnExpr.site, fnExpr.name), argExprs, this.parensSite);
		}

		{
			let maybeBetter = this.simplifyLiteral(stack, fnExpr, argExprs);
			if (maybeBetter !== null) {
				return maybeBetter;
			}
		}

		{
			/*let maybeBetter = this.inlineArgs(stack, fnExpr, argExprs);
			if (maybeBetter !== null) {
				return maybeBetter;
			}*/
		}

		{
			let maybeBetter = this.inlineLiteralArgs(stack, fnExpr, argExprs);
			if (maybeBetter !== null) {
				return maybeBetter;
			}
		}

		{
			let maybeBetter = this.simplifyTopology_(stack, fnExpr, argExprs);
			if (maybeBetter !== null) {
				return maybeBetter;
			}
		}


		return new IRUserCallExpr(fnExpr, argExprs, this.parensSite);
	}

	/**
	 * Extract functions like __core__iData from IRFuncExpr args, and inserting it in IRFuncExpr fnExpr, and then run inner simplify methods
	 * @returns {IRExpr}
	 */
	extractDownstreamCasts() {
		if (this.fnExpr instanceof IRFuncExpr && this.argExprs.some(e => e instanceof IRFuncExpr)) {
			/** @type {IRExpr[]} */
			let args = [];

			let fnExpr = this.fnExpr;

			let someExtracted = false;

			for (let i = 0; i < this.argExprs.length; i++) {
				let a = this.argExprs[i];

				if (a instanceof IRFuncExpr) {
					
					if (a.body instanceof IRCoreCallExpr) {
						if (a.body.isCast()) {
							// unwrap the inner expr core call
							let argWithInline = new IRFuncExpr(a.site, a.args, a.body.argExprs[0]);

							// and add the core call the wherever the variable is called
							let maybeFnExpr = this.fnExpr.wrapCall(this.fnExpr.args[i], a.body.builtinName);

							if (maybeFnExpr !== null && maybeFnExpr instanceof IRFuncExpr) {
								fnExpr = maybeFnExpr;
								args.push(argWithInline);
								someExtracted = true;
							} else {
								args.push(a);	
							}
						} else {
							args.push(a);
						}
					} else {
						args.push(a);
					}
				} else {
					args.push(a);
				}
			}

			if (someExtracted) {
				assert(args.length == this.argExprs.length);
				
				let result = new IRUserCallExpr(fnExpr, args, this.parensSite)

				return result;
			}
		}

		return this;
	}

	/**
	 * @returns {IRExpr}
	 */
	extractUpstreamCasts() {
		if (this.fnExpr instanceof IRFuncExpr && this.argExprs.some(e => e instanceof IRFuncExpr)) {
			/** @type {IRExpr[]} */
			let args = [];

			let refs = this.fnExpr.args;

			/** @type {IRExpr} */
			let fnExpr = this.fnExpr;

			for (let i = 0; i < this.argExprs.length; i++) {
				let fn = this.argExprs[i];

				if (fn instanceof IRFuncExpr) {
					// for each of the inner args, walk the body to see what changes

					let fnBody = fn.body;

					for (let j = 0; j < fn.args.length; j++) {
						let a = fn.args[j];

						let ok = true;
						let castName = "";

						/** 
						 * Make sure eahc relevant IRNameExpr is actually wrapped by a cast call and doesn't appear by itself
						 * This is done like this to circumvent the limitations of 'walk'
						 * @type {Set<IRNameExpr>} */
						let okList = new Set();
						/** @type {IRNameExpr[]} */
						let verify = [];

						let fnBody_ = fnBody.walk((expr) => {
							if (expr instanceof IRCoreCallExpr && expr.isCast() && expr.argExprs[0] instanceof IRNameExpr && expr.argExprs[0].isVariable(a)) {
								if (castName == "" || castName == expr.builtinName) {
									castName = expr.builtinName;
									okList.add(expr.argExprs[0]);
									return expr.argExprs[0];
								} else {
									ok = false; // different casts, don't extract  anything for this arg
									return expr;
								}
							} else if (expr instanceof IRNameExpr && expr.isVariable(a)) {
								// make sure that expr is surrounded by IRCoreCallExpr
								verify.push(expr);

								return expr;
							} else {
								return expr;
							}
						});

						ok = ok && verify.every(v => okList.has(v));

						// wrap the call args in the current body
						if (ok && castName != "") {
							/**
							 * Make sure each relevant IRNameExpr is actually part of IRUserCallExpr and doesn't appear by itself
							 * This is done like this to circumvent the limitations of 'walk' 
							 * @type {Set<IRNameExpr>} */
							let okList = new Set();
							/** @type {IRNameExpr[]} */
							let verify = [];

							// now try to replace every jth arg of a call to fn
							let fnExpr_ = fnExpr.walk((expr) => {
								if (expr instanceof IRUserCallExpr && expr.fnExpr instanceof IRNameExpr && expr.fnExpr.isVariable(refs[i])) {
									// replace the j arg with castName(...)
									let callArgs = expr.argExprs.slice();
									callArgs[j] = new IRCoreCallExpr(new Word(callArgs[j].site, `__core__${castName}`), [callArgs[j]], callArgs[j].site);

									okList.add(expr.fnExpr);

									return new IRUserCallExpr(expr.fnExpr, callArgs, expr.parensSite);
								} else if (expr instanceof IRNameExpr && expr.isVariable(refs[i])) {
									verify.push(expr);
									return expr;
								} else {
									return expr;
								}
							});

							ok = ok && verify.every(v => okList.has(v));

							if (ok) {
								fnBody = fnBody_;
								fnExpr = fnExpr_;
							}
						}
					}

					args.push(new IRFuncExpr(fn.site, fn.args, fnBody));
				} else {
					args.push(fn);
				}
			}

			return new IRUserCallExpr(fnExpr, args, this.parensSite);
		} else {
			return this;
		}
	}

	/**
	 * @returns {IRExpr}
	 */
	extractCasts() {
		let better = this.extractDownstreamCasts();

		if (better instanceof IRUserCallExpr) {
			return better.extractUpstreamCasts();
		} else {
			return better;
		}
	}

	/**
	 * @param {IRExprStack} stack
	 * @returns {IRExpr}
	 */
	simplify(stack) {
		/**
		 * @type {IRExpr}
		 */
		let better = this.simplifyFlatten();

		if (better instanceof IRUserCallExpr) {
			better = better.simplifyWithoutExtractingCasts(stack);
		}

		if (better instanceof IRUserCallExpr) {
			better = better.extractCasts();
		}

		return better;
	}

	/**
	 * @returns {UplcTerm}
	 */
	toUplc() {
		return super.toUplcCall(this.#fnExpr.toUplc());
	}
}

export class IRAnonCallExpr extends IRUserCallExpr {
	#anon;

	/**
	 * @param {IRFuncExpr} fnExpr 
	 * @param {IRExpr[]} argExprs 
	 * @param {Site} parensSite 
	 */
	constructor(fnExpr, argExprs, parensSite) {
		super(fnExpr, argExprs, parensSite)

		this.#anon = fnExpr;
	}

	/**
	 * Internal function
	 * @type {IRFuncExpr}
	 */
	get anon() {
		return this.#anon;
	}

	/**
	 * @type {IRVariable[]}
	 */
	get argVariables() {
		return this.#anon.args;
	}

	/**
	 * Add args to the stack as IRDeferredValue instances
	 * @param {IRCallStack} stack
	 */
	evalConstants(stack) {
		const argExprs = this.evalConstantsInArgs(stack);

		const parentStack = stack;

		argExprs.forEach((argExpr, i) => {
			stack = stack.set(this.argVariables[i], new IRDeferredValue(() => argExpr.eval(parentStack)));
		});

		const anonBody = this.#anon.body.evalConstants(stack);

		if (anonBody instanceof IRLiteralExpr) {
			return anonBody;
		} else {
			return IRUserCallExpr.new(
				new IRFuncExpr(
					this.#anon.site,
					this.#anon.args,
					anonBody
				),
				argExprs,
				this.parensSite
			);
		}
	}

	/**
	 * Add literal args to the map
	 * @param {IRLiteralRegistry} literals
	 * @returns {IRExpr}
	 */
	simplifyLiterals(literals) {
		const args = this.simplifyLiteralsInArgs(literals);

		args.forEach((arg, i) => {
			if (arg instanceof IRLiteralExpr) {
				literals.set(this.argVariables[i], arg);
			}
		});

		const anonBody = this.#anon.body.simplifyLiterals(literals);

		if (anonBody instanceof IRLiteralExpr) {
			return anonBody;
		} else {
			return new IRAnonCallExpr(
				new IRFuncExpr(
					this.#anon.site,
					this.#anon.args,
					anonBody
				),
				args,
				this.parensSite
			);
		}
	}

	/**
	 * @param {IRNameExprRegistry} nameExprs 
	 */
	registerNameExprs(nameExprs) {
		this.registerNameExprsInArgs(nameExprs);

		this.argVariables.forEach(a => nameExprs.registerVariable(a));

		this.#anon.body.registerNameExprs(nameExprs);
	}
	
	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr}
	 */
	simplifyTopology(registry) {
		const args = this.simplifyTopologyInArgs(registry);

		// remove unused args, inline args that are only referenced once
		const remainingIds = this.argVariables.map((variable, i) => {
			const n = registry.countReferences(variable);

			if (n == 0 || (n == 1 && (!registry.maybeInsideLoop(variable) || args[i] instanceof IRFuncExpr)) || args[i] instanceof IRNameExpr) {
				if (n > 0) {
					// inline
					registry.addInlineable(variable, args[i]);
				}

				return -1;
			} else {
				return i;
			}
		}).filter(i => i != -1);

		const remainingVars = remainingIds.map(i => this.argVariables[i]);
		const remainingExprs = remainingIds.map(i => args[i]);

		const anonBody = this.#anon.body.simplifyTopology(registry);

		if (anonBody instanceof IRLiteralExpr || remainingExprs.length == 0) {
			return anonBody;
		} else {
			return new IRAnonCallExpr(
				new IRFuncExpr(
					this.#anon.site,
					remainingVars,
					anonBody
				),
				remainingExprs,
				this.parensSite
			);
		}
	}
}

export class IRNestedAnonCallExpr extends IRUserCallExpr {
	#anon;

	/**
	 * @param {IRAnonCallExpr} anon
	 * @param {IRExpr[]} outerArgExprs
	 * @param {Site} parensSite
	 */
	constructor(anon, outerArgExprs, parensSite) {
		super(anon, outerArgExprs, parensSite);

		this.#anon = anon;
	}

	/**
	 * @param {IRExprRegistry} registry
	 * @returns {IRExpr}
	 */
	simplifyTopology(registry) {
		const anon = this.#anon.simplifyTopology(registry);

		const args = this.simplifyTopologyInArgs(registry);

		if (anon instanceof IRAnonCallExpr && anon.anon.body instanceof IRFuncExpr) {
			// flatten
			const allArgs = anon.argExprs.slice().concat(args);
			const allVars = anon.argVariables.slice().concat(anon.anon.body.args.slice());

			assert(allArgs.length == allVars.length);

			return IRUserCallExpr.new(
				new IRFuncExpr(
					anon.anon.body.site,
					allVars,
					anon.anon.body.body
				),
				allArgs,
				this.parensSite
			);
		} else {
			return IRUserCallExpr.new(
				anon,
				args,
				this.parensSite
			);
		}
	}
}

export class IRFuncDefExpr extends IRAnonCallExpr {
	#def;

	/**
	 * @param {IRFuncExpr} fnExpr 
	 * @param {IRFuncExpr} defExpr 
	 * @param {Site} parensSite
	 */
	constructor(fnExpr, defExpr, parensSite) {
		super(fnExpr, [defExpr], parensSite);

		this.#def = defExpr;
	}
}

/**
 * Intermediate Representation error call (with optional literal error message)
 * @package
 */
export class IRErrorCallExpr extends IRExpr {
	#msg;

	/**
	 * @param {Site} site 
	 * @param {string} msg 
	 */
	constructor(site, msg = "") {
		super(site);
		this.#msg = msg;
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
	 * @param {IRCallStack} stack
	 * @returns {IRExpr}
	 */
	evalConstants(stack) {
		return this;
	}

	/**
	 * @param {IRCallStack} stack
	 * @returns {?IRValue}
	 */
	eval(stack) {
		if (stack.throwRTErrors) {
			throw this.site.runtimeError(this.#msg);
		} else {
			return null;
		}
	}

	/**
	 * @param {IRLiteralRegistry} literals 
	 * @returns {IRExpr}
	 */
	simplifyLiterals(literals) {
		return this;
	}

	/**
	 * @param {IRNameExprRegistry} nameExprs
	 */
	registerNameExprs(nameExprs) {
	}

	/**
	 * @param {IRExprRegistry} registry
	 * @returns {IRExpr}
	 */
	simplifyTopology(registry) {
		return this;
	}

	copy() {
		return new IRErrorCallExpr(this.site, this.#msg);
	}

	/**
	 * @param {IRVariable} ref
	 * @returns {number}
	 */
	countRefs(ref) {
		return 0;
	}

	/**
	 * @param {IRWalkFn} fn 
	 * @returns {IRExpr}
	 */
	walk(fn) {
		return fn(this);
	}

	/**
	 * @param {IRVariable} ref
	 * @param {string} builtinName
	 * @returns {?IRExpr}
	 */
	wrapCall(ref, builtinName) {
		return this;
	}

	/**
	 * @param {IRVariable} ref 
	 * @returns {?IRExpr}
	 */
	flattenCall(ref) {
		return this;
	}

	/**
	 * @param {IRExprStack} stack
	 * @returns {IRExpr}
	 */
	inline(stack) {
		return this;
	}

	/**
	 * @param {IRExprStack} stack
	 * @returns {IRExpr}
	 */
	simplify(stack) {
		return this;
	}

	/**
	 * @returns {UplcTerm}
	 */
	toUplc() {
		return new UplcError(this.site, this.#msg);
	}
}
