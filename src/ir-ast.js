//@ts-check
// IR AST objects

import {
    TAB
} from "./config.js";

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
    UplcString,
    UplcTerm,
    UplcUnit,
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
		return assertDefined(this.#inline.get(variable), `${this.isInlineable(variable)} ????`).copy(new Map());
	}

	/**
	 * @param {IRVariable} variable 
	 * @param {IRExpr} expr 
	 */
	addInlineable(variable, expr) {
		this.#inline.set(variable, assertDefined(expr));
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
	 * Used during inlining/expansion to make sure multiple inlines of IRNameExpr don't interfere when setting the Debruijn index
	 * @param {Map<IRVariable, IRVariable>} newVars
	 * @returns {IRExpr}
	 */
	copy(newVars) {
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
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr}
	 */
	simplifyUnused(registry) {
		throw new Error("not yet implemented");
	}

	/**
	 * @param {IRVariable} fnVar
	 * @param {number[]} remaining
	 * @returns {IRExpr}
	 */
	simplifyUnusedRecursionArgs(fnVar, remaining) {
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
	 * @type {?IRVariable} - cached variable
	 */
	#variable;

	/**
	 * @type {?IRValue} - cached eval result (reused when eval is called within simplifyLiterals)
	 */
	#value;

	/**
	 * @param {Word} name 
	 * @param {?IRVariable} variable
	 * @param {?IRValue} value
	 */
	constructor(name, variable = null, value = null) {
		super(name.site);
		assert(name.toString() != "_");
		assert(!name.toString().startsWith("undefined"));
		this.#name = name;
		this.#index = null;
		this.#variable = variable;
		this.#value = value;
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
		if (this.#variable != null) {
			this.#value = stack.get(this.#variable);
		}

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
			// prefer result from stack, and use cached result as backup
			const result = stack.get(this.#variable);

			if (result == null) {
				return this.#value;
			} else {
				return result;
			}
		}
	}

	/**
	 * @param {IRVariable} fnVar 
	 * @param {number[]} remaining 
	 * @returns {IRExpr}
	 */
	removeUnusedCallArgs(fnVar, remaining) {
		return this;
	}
	
	/**
	 * @param {IRLiteralRegistry} literals
	 * @returns {IRExpr}
	 */
	simplifyLiterals(literals) {
		if (this.#variable !== null && literals.has(this.#variable)) {
			return assertDefined(literals.get(this.#variable));
		} else if (this.#value instanceof IRLiteralExpr) {
			return this.#value;
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
	 * @param {Map<IRVariable, IRVariable>} newVars
	 * @returns {IRExpr}
	 */
	copy(newVars) {
		let v = this.#variable;

		if (v != null) {
			const maybeNewVar = newVars.get(v);

			if (maybeNewVar != undefined) {
				v = maybeNewVar;
			}
		}

		return new IRNameExpr(this.#name, v, this.#value);
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

	/**
	 * @param {IRVariable} fnVar 
	 * @param {number[]} remaining 
	 * @returns {IRExpr}
	 */
	simplifyUnusedRecursionArgs(fnVar, remaining) {
		return this;
	}

	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr}
	 */
	simplifyUnused(registry) {
		return this;
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
	 * @param {IRVariable} fnVar 
	 * @param {number[]} remaining 
	 * @returns {IRExpr}
	 */
	removeUnusedCallArgs(fnVar, remaining) {
		return this;
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
	 * @param {Map<IRVariable, IRVariable>} newVars
	 * @returns {IRExpr}
	 */
	copy(newVars) {
		return new IRLiteralExpr(this.#value);
	}

	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr}
	 */
	simplifyTopology(registry) {
		return this;
	}

	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr}
	 */
	simplifyUnused(registry) {
		return this;
	}

	/**
	 * @param {IRVariable} fnVar 
	 * @param {number[]} remaining 
	 * @returns {IRExpr}
	 */
	simplifyUnusedRecursionArgs(fnVar, remaining) {
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

	/**
	 * @param {string} indent 
	 * @returns {string}
	 */
	toString(indent = "") {
		return `const(${this.#expr.toString(indent)})`;
	}

	/**
	 * @param {IRNameExprRegistry} nameExprs
	 */
	registerNameExprs(nameExprs) {
		this.#expr.registerNameExprs(nameExprs);
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
			console.log(this.toString());
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

	/**
	 * @param {IRVariable} fnVar 
	 * @param {number[]} remaining 
	 */
	simplifyUnusedRecursionArgs(fnVar, remaining) {
		return new IRConstExpr(this.site, this.#expr.simplifyUnusedRecursionArgs(fnVar, remaining));
	}

	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr}
	 */
	simplifyUnused(registry) {
		return new IRConstExpr(this.site, this.#expr.simplifyUnused(registry));
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
	 * @returns {boolean}
	 */
	hasOptArgs() {
		const b = this.#args.some(a => a.name.startsWith("__useopt__"));

		if (b) {
			return b;
		}

		if (this.#body instanceof IRFuncExpr) {
			return this.#body.hasOptArgs();
		} else {
			return false;
		}
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
	 * @param {IRNameExprRegistry} nameExprs
	 */
	registerNameExprs(nameExprs) {
		this.#args.forEach(a => nameExprs.registerVariable(a));

		this.#body.registerNameExprs(nameExprs);
	}

	/**
	 * @param {IRVariable} fnVar 
	 * @param {number[]} remaining
	 * @returns {IRExpr} 
	 */
	simplifyUnusedRecursionArgs(fnVar, remaining) {
		return new IRFuncExpr(this.site, this.args, this.#body.simplifyUnusedRecursionArgs(fnVar, remaining));
	}

	/**
	 * @param {IRLiteralRegistry} literals 
	 * @returns {IRExpr}
	 */
	simplifyLiterals(literals) {
		return new IRFuncExpr(this.site, this.args, this.#body.simplifyLiterals(literals));
	}

	/**
	 * @param {Map<IRVariable, IRVariable>} newVars
	 * @returns {IRExpr}
	 */
	copy(newVars) {
		return new IRFuncExpr(this.site, this.args.map(oldArg => oldArg.copy(newVars)), this.#body.copy(newVars));
	}

	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr}
	 */
	simplifyTopology(registry) {
		return new IRFuncExpr(this.site, this.args, this.#body.simplifyTopology(registry));
	}

	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRFuncExpr}
	 */
	simplifyUnused(registry) {
		return new IRFuncExpr(this.site, this.args, this.#body.simplifyUnused(registry));
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
		this.#argExprs = assertDefined(argExprs);
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
		return this.#argExprs.map(a => assertDefined(a.simplifyTopology(registry)));
	}

	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr[]}
	 */
	simplifyUnusedInArgs(registry) {
		return this.#argExprs.map(a => a.simplifyUnused(registry));
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
		} else if (builtinName == "chooseList") {
			const lst = args[0].value;

			if (lst !== null && lst instanceof UplcList) {
				if (lst.length == 0) {
					return args[1];
				} else {
					return args[2];
				}
			} else {
				return null;
			}
		} else if (builtinName == "chooseUnit") {
			return args[1];
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
	 * @param {IRVariable} fnVar 
	 * @param {number[]} remaining 
	 */
	simplifyUnusedRecursionArgs(fnVar, remaining) {
		const argExprs = this.argExprs.map(ae => ae.simplifyUnusedRecursionArgs(fnVar, remaining));

		return new IRCoreCallExpr(this.#name, argExprs, this.parensSite);
	}

	/**
	 * @param {IRLiteralRegistry} literals
	 * @returns {IRExpr}
	 */
	simplifyLiterals(literals) {
		const args = this.simplifyLiteralsInArgs(literals);

		if (args.length > 0 && args.every(a => a instanceof IRLiteralExpr)) {
			try {
				const res = IRCoreCallExpr.evalValues(
					this.site,
					false,
					this.builtinName,
					args.map(a => new IRLiteralValue(assertClass(a, IRLiteralExpr).value))
				);

				if (res != null) {
					return new IRLiteralExpr(res.value);
				}
			} catch (e) {
			}
		}

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
							cond.fnExpr.name === "__helios__bool____not"
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
	 * @param {Map<IRVariable, IRVariable>} newVars
	 * @returns {IRExpr}
	 */
	copy(newVars) {
		return new IRCoreCallExpr(this.#name, this.argExprs.map(a => a.copy(newVars)), this.parensSite);
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
				
				break;
			}		
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
			case "ifThenElse": {
				const [cond, a, b] = args;

				if (cond instanceof IRCoreCallExpr && cond.builtinName === "nullList") {
					return new IRCoreCallExpr(new Word(this.site, "__core__chooseList"), [cond.argExprs[0], a, b], this.parensSite);
				}

				break;
			}
			case "chooseUnit": {
				const a = args[0];

				if (a instanceof IRLiteralExpr && a.value instanceof UplcUnit) {
					return args[1];
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

				break;
			}
			case "iData": {
				// check if arg is a call to unIData
				const a = args[0];
				if (a instanceof IRCoreCallExpr && a.builtinName == "unIData") {
					return a.argExprs[0];
				}

				break;
			}
			case "unBData": {
				// check if arg is a call to bData
				const a = args[0];
				if (a instanceof IRCoreCallExpr && a.builtinName == "bData") {
					return a.argExprs[0];
				}

				break;
			}
			case "bData": {
				// check if arg is a call to unBData
				const a = args[0];
				if (a instanceof IRCoreCallExpr && a.builtinName == "unBData") {
					return a.argExprs[0];
				}

				break;
			}
			case "unMapData": {
				// check if arg is call to mapData
				const a = args[0];
				if (a instanceof IRCoreCallExpr && a.builtinName == "mapData") {
					return a.argExprs[0];
				}
				
				break;
			}
			case "mapData": {
				// check if arg is call to unMapData
				const a = args[0];
				if (a instanceof IRCoreCallExpr && a.builtinName == "unMapData") {
					return a.argExprs[0];
				}

				break;
			}
			case "listData": {
				// check if arg is call to unListData
				const a = args[0];
				if (a instanceof IRCoreCallExpr && a.builtinName == "unListData") {
					return a.argExprs[0];
				}

				break;
			}
			case "unListData": {
				// check if arg is call to listData
				const a = args[0];
				if (a instanceof IRCoreCallExpr && a.builtinName == "listData") {
					return a.argExprs[0];
				}
				
				break;
			}		
		}

		return new IRCoreCallExpr(this.#name, args, this.parensSite);
	}

	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr}
	 */
	simplifyUnused(registry) {
		const args = this.simplifyUnusedInArgs(registry);

		return new IRCoreCallExpr(this.#name, args, this.parensSite);
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
	 * @param {IRVariable} fnVar 
	 * @param {number[]} remaining 
	 * @returns {IRExpr}
	 */
	simplifyUnusedRecursionArgs(fnVar, remaining) {
		const argExprs = this.argExprs.map(ae => ae.simplifyUnusedRecursionArgs(fnVar, remaining));

		if (this.#fnExpr instanceof IRNameExpr && this.#fnExpr.isVariable(fnVar)) {
			const remainingArgExprs = argExprs.filter((_, i) => remaining.some(i_ => i_ == i));

			if (remainingArgExprs.length == 0) {
				return this.#fnExpr;
			} else {
				return new IRUserCallExpr(
					this.#fnExpr,
					remainingArgExprs,
					this.parensSite
				);
			}
		} else {
			const fnExpr = this.#fnExpr.simplifyUnusedRecursionArgs(fnVar, remaining);

			return new IRUserCallExpr(
				fnExpr,
				argExprs,
				this.parensSite
			)
		}
	}

	/**
	 * @param {IRLiteralRegistry} literals
	 * @returns {(IRExpr[] | IRLiteralExpr)}
	 */
	simplifyLiteralsInArgsAndTryEval(literals) {
		const args = this.simplifyLiteralsInArgs(literals);

		if (args.length > 0 && args.every(a => ((a instanceof IRLiteralExpr) || (a instanceof IRFuncExpr)))) {
			try {
				const fn = this.#fnExpr.eval(new IRCallStack(false));

				if (fn != null) {
					const res = fn.call(
						args.map(a => {
							const v = a.eval(new IRCallStack(false));

							if (v == null) {
								// caught by outer catch
								throw new Error("null eval sub-result");
							} else {
								return v;
							}
						})
					);

					if (res != null) {
						return new IRLiteralExpr(res.value);
					}
				}
			} catch(e) {
			}
		}

		return args;
	}

	/**
	 * @param {IRLiteralRegistry} literals
	 * @returns {IRExpr}
	 */
	simplifyLiterals(literals) {
		const argsOrLiteral = this.simplifyLiteralsInArgsAndTryEval(literals);

		if (argsOrLiteral instanceof IRLiteralExpr) {
			return argsOrLiteral;
		} else {
			const args = argsOrLiteral;

			return IRUserCallExpr.new(
				this.#fnExpr.simplifyLiterals(literals),
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
		
		this.#fnExpr.registerNameExprs(nameExprs);
	}

	/**
	 * @param {Map<IRVariable, IRVariable>} newVars 
	 * @returns {IRExpr}
	 */
	copy(newVars) {
		return new IRUserCallExpr(this.#fnExpr.copy(newVars), this.argExprs.map(a => a.copy(newVars)), this.parensSite);
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
					case "__helios__bool____to_data": {
							// check if arg is a call to __helios__bool__from_data
							const a = args[0];
							if (a instanceof IRUserCallExpr && a.fnExpr instanceof IRNameExpr && a.fnExpr.name == "__helios__bool__from_data") {
								return a.argExprs[0];
							}
						}
						break;
					case "__helios__bool__from_data": {
							// check if arg is a call to __helios__bool____to_data
							const a = args[0];
							if (a instanceof IRUserCallExpr && a.fnExpr instanceof IRNameExpr && a.fnExpr.name == "__helios__bool____to_data") {
								return a.argExprs[0];
							}
						}
						break;
					case "__helios__bool____not": {
							const a = args[0];
							if (a instanceof IRUserCallExpr && a.fnExpr instanceof IRNameExpr && a.fnExpr.name == "__helios__bool____not") {
								return a.argExprs[0];
							}
						}
						break;
					case "__helios__common__concat": {
							// check if either 1st or 2nd arg is the empty list
							const [a, b] = args;
							if (a instanceof IRLiteralExpr && a.value instanceof UplcList && a.value.length == 0) {
								return b;
							} else {
								if (b instanceof IRLiteralExpr && b.value instanceof UplcList && b.value.length == 0) {
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

	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr}
	 */
	simplifyUnused(registry) {
		const args = this.simplifyUnusedInArgs(registry);

		return IRUserCallExpr.new(
			this.#fnExpr.simplifyUnused(registry),
			args,
			this.parensSite
		);
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
	 * @param {IRVariable} fnVar 
	 * @param {number[]} remaining 
	 * @returns {IRExpr}
	 */
	simplifyUnusedRecursionArgs(fnVar, remaining) {
		const argExprs = this.argExprs.map(ae => ae.simplifyUnusedRecursionArgs(fnVar, remaining));

		let anon = assertClass(this.#anon.simplifyUnusedRecursionArgs(fnVar, remaining), IRFuncExpr);

		return new IRAnonCallExpr(anon, argExprs, this.parensSite);
	}

	/**
	 * Add literal args to the map
	 * @param {IRLiteralRegistry} literals
	 * @returns {IRExpr}
	 */
	simplifyLiterals(literals) {
		const argsOrLiteral = super.simplifyLiteralsInArgsAndTryEval(literals);

		if (argsOrLiteral instanceof IRLiteralExpr) {
			return argsOrLiteral;
		} else {
			const args = argsOrLiteral;

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

		assert(args.length == this.argVariables.length, `number of args should be equal to number of argVariables (${this.toString()})`);

		// remove unused args, inline args that are only referenced once, inline all IRNameExprs, inline function with default args,
		//  inline tiny builtins, inline functions whose body is simply a IRNameExpr
		const remainingIds = this.argVariables.map((variable, i) => {
			const n = registry.countReferences(variable);

			const arg = assertDefined(args[i]);

			if (
				n == 0 
				|| variable.isAlwaysInlineable()
				|| (n == 1 && (!registry.maybeInsideLoop(variable) || arg instanceof IRFuncExpr)) 
				|| arg instanceof IRNameExpr 
				|| (arg instanceof IRFuncExpr && arg.hasOptArgs())
				|| (arg instanceof IRFuncExpr && arg.body instanceof IRNameExpr)
				
			) {
				if (n > 0 && arg != null) {
					// inline
					registry.addInlineable(variable, arg);
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

	/**
	 * @param {IRExprRegistry} registry 
	 * @returns {IRExpr}
	 */
	simplifyUnused(registry) {
		const args = this.simplifyUnusedInArgs(registry);

		// remove unused args
		const remainingIds = this.argVariables.map((variable, i) => {
			const n = registry.countReferences(variable);

			if (n == 0) {
				return -1;
			} else {
				return i;
			}
		}).filter(i => i != -1);

		const remainingVars = remainingIds.map(i => this.argVariables[i]);
		const remainingExprs = remainingIds.map(i => args[i]);

		const anonBody = this.#anon.body.simplifyUnused(registry);

		if (remainingVars.length == 0) {
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
	 * @param {IRVariable} fnVar
	 * @param {number[]} remaining
	 * @returns {IRExpr}
	 */
	simplifyUnusedRecursionArgs(fnVar, remaining) {
		return new IRNestedAnonCallExpr(
			assertClass(this.#anon.simplifyUnusedRecursionArgs(fnVar, remaining), IRAnonCallExpr),
			this.argExprs.map(ae => ae.simplifyUnusedRecursionArgs(fnVar, remaining)),
			this.parensSite
		)
	}
		
	/**
	 * Flattens consecutive nested calls
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

	/**
	 * Flattens consecutive nested calls
	 * @param {IRExprRegistry} registry
	 * @returns {IRExpr}
	 */
	simplifyUnused(registry) {
		const anon = this.#anon.simplifyUnused(registry);

		const args = this.simplifyUnusedInArgs(registry);

		if (anon instanceof IRAnonCallExpr) {
			return new IRNestedAnonCallExpr(
				anon,
				args,
				this.parensSite
			);
		} else {
			return new IRUserCallExpr(
				anon,
				args,
				this.parensSite
			)
		}
	}
}

export class IRFuncDefExpr extends IRAnonCallExpr {
	#def;

	/**
	 * @param {IRFuncExpr} anon 
	 * @param {IRFuncExpr} defExpr 
	 * @param {Site} parensSite
	 */
	constructor(anon, defExpr, parensSite) {
		super(anon, [defExpr], parensSite);

		this.#def = defExpr;
	}

	/**
	 * @param {IRNameExprRegistry} nameExprs 
	 */
	registerNameExprs(nameExprs) {
		this.argVariables.forEach(a => nameExprs.registerVariable(a));

		this.anon.body.registerNameExprs(nameExprs);

		nameExprs = nameExprs.resetVariables();

		this.#def.registerNameExprs(nameExprs);
	}

	/**
	 * @param {IRExprRegistry} registry
	 * @returns {[IRFuncExpr, IRExpr]}
	 */
	simplifyRecursionArgs(registry) {
		let anon = this.anon;
		let def = this.#def;

		if (this.#def.args.every(a => a.name.startsWith("__module") || a.name.startsWith("__const"))) {
			const usedArgs = this.#def.args.map((variable, i) => {
				const n = registry.countReferences(variable);

				if (n == 0) {
					return -1;
				} else {
					return i;
				}
			}).filter(i => i != -1);

			if (usedArgs.length < this.#def.args.length) {
				anon = new IRFuncExpr(
					anon.site,
					anon.args,
					anon.body.simplifyUnusedRecursionArgs(anon.args[0], usedArgs)
				);

				if (usedArgs.length == 0) {
					// simplify the body if none of the args remain
					return [anon, this.#def.body];
				}

				def = new IRFuncExpr(
					this.#def.site,
					usedArgs.map(i => def.args[i]),
					this.#def.body
				);
			}
		}

		return [anon, def];
	}

	/**
	 * Remove args that are unused in def
	 * @param {IRExprRegistry} registry
	 * @returns {IRExpr}
	 */
	simplifyTopology(registry) {
		const [anon, def] = this.simplifyRecursionArgs(registry);
		
		const res = (new IRAnonCallExpr(anon, [def], this.parensSite)).simplifyTopology(registry);

		if (res instanceof IRAnonCallExpr && res.argExprs.length == 0) {
			const argExpr = res.argExprs[0];
			
			if (res.anon.args.length == 1 && argExpr instanceof IRFuncExpr) {
				return new IRFuncDefExpr(
					res.anon,
					argExpr,
					this.parensSite
				)
			}
		}

		return res;
	}

	/**
	 * @param {IRVariable} fnVar
	 * @param {number[]} remaining
	 * @returns {IRExpr}
	 */
	simplifyUnusedRecursionArgs(fnVar, remaining) {
		return new IRFuncDefExpr(
			assertClass(this.anon.simplifyUnusedRecursionArgs(fnVar, remaining), IRFuncExpr),
			assertClass(this.#def.simplifyUnusedRecursionArgs(fnVar, remaining), IRFuncExpr),
			this.parensSite
		);
	}

	/**
	 * @param {IRExprRegistry} registry
	 * @returns {IRExpr}
	 */
	simplifyUnused(registry) {
		if (registry.countReferences(this.anon.args[0]) == 0) {
			return this.anon.body.simplifyUnused(registry);
		} else {
			const [anon, def] = this.simplifyRecursionArgs(registry);

			if (def instanceof IRFuncExpr) {
				return new IRFuncDefExpr(
					anon.simplifyUnused(registry),
					def.simplifyUnused(registry),
					this.parensSite
				);
			} else {
				return new IRAnonCallExpr(
					anon.simplifyUnused(registry),
					[def],
					this.site
				);
			}
		}
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
	 * @param {Map<IRVariable, IRVariable>} newVars 
	 * @returns {IRExpr}
	 */
	copy(newVars) {
		return new IRErrorCallExpr(this.site, this.#msg);
	}

	/**
	 * @param {IRExprRegistry} registry
	 * @returns {IRExpr}
	 */
	simplifyTopology(registry) {
		return this;
	}

	/**
	 * @param {IRExprRegistry} registry
	 * @returns {IRExpr}
	 */
	simplifyUnused(registry) {
		return this;
	}

	/**
	 * @param {IRVariable} fnVar 
	 * @param {number[]} remaining 
	 * @returns {IRExpr}
	 */
	simplifyUnusedRecursionArgs(fnVar, remaining) {
		return this;
	}

	/**
	 * @returns {UplcTerm}
	 */
	toUplc() {
		return new UplcError(this.site, this.#msg);
	}
}