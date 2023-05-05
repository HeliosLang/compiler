//@ts-check
// Helios AST expressions

import {
	TAB
} from "./config.js";

import {
	assert,
	assertClass,
	assertDefined,
	bytesToHex,
	reduceNull
} from "./utils.js";

import { 
	BoolLiteral,
	ByteArrayLiteral,
	IntLiteral,
	IR,
	PrimitiveLiteral,
    RealLiteral,
    Site,
	StringLiteral,
	SymbolToken,
    Token,
	UserError,
	Word
} from "./tokens.js";

import {
	UplcData
} from "./uplc-data.js";

import {
	AnyType,
	ArgType,
	BoolType,
	BuiltinFuncInstance,
	ByteArrayType,
	ConstStatementInstance,
	DataInstance,
	EnumMemberStatementType,
	EnumStatementType,
	ErrorInstance,
	ErrorType,
	FuncInstance,
	FuncStatementInstance,
	FuncType,
	Instance,
	IntType,
	ListType,
	MapType,
	MultiInstance,
	Namespace,
	OptionType,
	OptionNoneType,
	ParametricInstance,
	RawDataType,
	RealType,
	StatementType,
	StringType,
	StructStatementType,
    Type,
	TypeClass,
	VoidInstance,
	VoidType,
	AnyTypeClass,
	Parameter,
	ParametricFuncStatementInstance
} from "./helios-eval-entities.js";

import {
	Scope
} from "./helios-scopes.js";

/**
 * Base class of every Type and Instance expression.
 */
class Expr extends Token {
	/**
	 * @param {Site} site 
	 */
	constructor(site) {
		super(site);
	}

	use() {
		throw new Error("not yet implemented");
	}
}

/**
 * Base class of every Type expression
 * Caches evaluated Type.
 * @package
 */
export class TypeExpr extends Expr {
	#cache;

	/**
	 * @param {Site} site 
	 * @param {Type | null} cache
	 */
	constructor(site, cache = null) {
		super(site);
		this.#cache = cache;
	}

	get type() {
		if (this.#cache === null) {
			throw new Error("type not yet evaluated");
		} else {
			return this.#cache;
		}
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Type}
	 */
	evalInternal(scope) {
		throw new Error("not yet implemented");
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Type}
	 */
	eval(scope) {
		if (this.#cache === null) {
			this.#cache = this.evalInternal(scope);
		}

		return this.#cache;
	}
}

/**
 * @package
 * TODO: rename to TypeClassRefExpr
 */
export class TypeClassExpr extends Expr {
	#name;

	/**
	 * @type {null | TypeClass}
	 */
	#cache;

	/**
	 * @param {Word} name 
	 */
	constructor(name) {
		super(name.site);
		this.#name = name;
		this.#cache = null;
	}

	/**
	 * @type {TypeClass}
	 */
	get typeClass() {
		if (this.#cache === null) {
			throw new Error("should be set (can't call this before type evaluation)");
		} else {
			return this.#cache;
		}
	}

	/**
	 * @param {Scope} scope 
	 * @returns {TypeClass}
	 */
	evalInternal(scope) {
		const v = scope.get(this.#name);

		if (v instanceof Scope) {
			throw this.site.typeError("expected type class, got scope");
		} else {
			const tc = v.assertTypeClass();

			if (!tc) {
				throw this.site.typeError("not a typeclass");
			} else {
				return tc;
			}
		}
	}

	/**
	 * @param {Scope} scope 
	 * @returns {TypeClass}
	 */
	eval(scope) {
		if (this.#cache === null) {
			this.#cache = this.evalInternal(scope);
		}

		return this.#cache;
	}
}

/**
 * Type reference class (i.e. using a Word)
 * @package
 */
export class TypeRefExpr extends TypeExpr {
	#name;

	/**
	 * @param {Word} name
	 * @param {?Type} cache
	 */
	constructor(name, cache = null) {
		super(name.site, cache);
		this.#name = name;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.#name.toString();
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Type}
	 */
	evalInternal(scope) {
		const type = scope.get(this.#name).assertType();
		if (!type) {
			throw this.#name.site.typeError("not a type");
		}

		return type;
	}

	get path() {
		return this.type.path;
	}

	use() {
		let t = this.type;

		if (t instanceof StatementType) {
			t.statement.use();
		}
	}
}

/**
 * Type[...] expression
 * @package
 */
export class ParametricTypeExpr extends TypeExpr {
	#baseExpr;
	#parameters;

	/**
	 * @param {Site} site - site of brackets
	 * @param {TypeExpr} baseExpr
	 * @param {TypeExpr[]} parameters
	 */
	constructor(site, baseExpr, parameters) {
		super(site);
		this.#baseExpr = baseExpr;
		this.#parameters = parameters;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `${this.#baseExpr.toString()}[${this.#parameters.map(p => p.toString()).join(", ")}]`;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Type}
	 */
	evalInternal(scope) {
		const paramTypes = this.#parameters.map(p => p.eval(scope));

		const baseType = this.#baseExpr.eval(scope);

		// TODO: apply paramTypes

		return baseType;
	}

	get path() {
		return this.type.path;
	}

	use() {
		this.#baseExpr.use();

		this.#parameters.forEach(p => p.use());
	}
}

/**
 * Type::Member expression
 * @package
 */
export class TypePathExpr extends TypeExpr {
	#baseExpr;
	#memberName;

	/**
	 * @param {Site} site 
	 * @param {TypeExpr} baseExpr 
	 * @param {Word} memberName
	 */
	constructor(site, baseExpr, memberName) {
		super(site);
		this.#baseExpr = baseExpr;
		this.#memberName = memberName;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `${this.#baseExpr.toString()}::${this.#memberName.toString()}`;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Type}
	 */
	evalInternal(scope) {
		let enumType = this.#baseExpr.eval(scope);

		const memberType = enumType.getTypeMember(this.#memberName).assertType();
		if (!memberType) {
			throw this.#memberName.site.typeError("not a type");
		}

		return memberType;
	}

	get path() {
		return this.type.path;
	}

	use() {
		this.#baseExpr.use();
	}
}

/**
 * []ItemType
 * @package
 */
export class ListTypeExpr extends TypeExpr {
	#itemTypeExpr;

	/**
	 * @param {Site} site 
	 * @param {TypeExpr} itemTypeExpr 
	 */
	constructor(site, itemTypeExpr) {
		super(site);
		this.#itemTypeExpr = itemTypeExpr;
	}

	toString() {
		return `[]${this.#itemTypeExpr.toString()}`;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Type}
	 */
	evalInternal(scope) {
		let itemType = this.#itemTypeExpr.eval(scope);

		if (itemType instanceof FuncType) {
			throw this.#itemTypeExpr.typeError("list item type can't be function");
		}

		return new ListType(itemType);
	}

	use() {
		this.#itemTypeExpr.use();
	}
}

/**
 * Map[KeyType]ValueType expression
 * @package
 */
export class MapTypeExpr extends TypeExpr {
	#keyTypeExpr;
	#valueTypeExpr;

	/**
	 * @param {Site} site 
	 * @param {TypeExpr} keyTypeExpr 
	 * @param {TypeExpr} valueTypeExpr 
	 */
	constructor(site, keyTypeExpr, valueTypeExpr) {
		super(site);
		this.#keyTypeExpr = keyTypeExpr;
		this.#valueTypeExpr = valueTypeExpr;
	}

	toString() {
		return `Map[${this.#keyTypeExpr.toString()}]${this.#valueTypeExpr.toString()}`;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Type}
	 */
	evalInternal(scope) {
		let keyType = this.#keyTypeExpr.eval(scope);

		if (keyType instanceof FuncType) {
			throw this.#keyTypeExpr.typeError("map key type can't be function");
		} else if (keyType instanceof BoolType) {
			throw this.#keyTypeExpr.typeError("map key type can't be a boolean");
		}

		let valueType = this.#valueTypeExpr.eval(scope);

		if (valueType instanceof FuncType) {
			throw this.#valueTypeExpr.typeError("map value type can't be function");
		}

		return new MapType(keyType, valueType);
	}

	use() {
		this.#keyTypeExpr.use();
		this.#valueTypeExpr.use();
	}
}

/**
 * Option[SomeType] expression
 * @package
 */
export class OptionTypeExpr extends TypeExpr {
	#someTypeExpr;

	/**
	 * @param {Site} site 
	 * @param {TypeExpr} someTypeExpr 
	 */
	constructor(site, someTypeExpr) {
		super(site);
		this.#someTypeExpr = someTypeExpr;
	}

	toString() {
		return `Option[${this.#someTypeExpr.toString()}]`;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Type}
	 */
	evalInternal(scope) {
		let someType = this.#someTypeExpr.eval(scope);

		if (someType instanceof FuncType) {
			throw this.#someTypeExpr.typeError("option some type can't be function");
		}

		return new OptionType(someType);
	}

	use() {
		this.#someTypeExpr.use();
	}
}

/**
 * '()' which can only be used as return type of func
 * @package
 */
export class VoidTypeExpr extends TypeExpr {
	constructor(site) {
		super(site);
	}

	toString() {
		return "()";
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Type}
	 */
	evalInternal(scope) {
		return new VoidType();
	}
	
	use() {
	}
}

/**
 * @package
 */
export class FuncArgTypeExpr extends Token {
	#name;
	#typeExpr;
	optional;

	/**
	 * @param {Site} site 
	 * @param {null | Word} name 
	 * @param {TypeExpr} typeExpr 
	 * @param {boolean} optional 
	 */
	constructor(site, name, typeExpr, optional) {
		super(site);
		this.#name = name;
		this.#typeExpr = typeExpr;
		this.optional = optional;
	}

	/**
	 * @returns {boolean}
	 */
	isNamed() {
		return this.#name == null;
	}

	/**
	 * @returns {boolean}
	 */
	isOptional() {
		return this.optional;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return [
			this.#name != null ? `${this.#name.toString()}: ` : "",
			this.optional ? "?" : "",
			this.#typeExpr.toString()
		].join("");
	}

	/**
	 * @param {Scope} scope 
	 * @returns {ArgType}
	 */
	eval(scope) {
		return new ArgType(this.#name, this.#typeExpr.eval(scope), this.optional);
	}

	use() {
		this.#typeExpr.use();
	}
}

/**
 * (ArgType1, ...) -> RetType expression
 * @package
 */
export class FuncTypeExpr extends TypeExpr {
	#parameters;
	#argTypeExprs;
	#retTypeExprs;

	/**
	 * @param {Site} site 
	 * @param {TypeParameters} parameters
	 * @param {FuncArgTypeExpr[]} argTypeExprs 
	 * @param {TypeExpr[]} retTypeExprs 
	 */
	constructor(site, parameters, argTypeExprs, retTypeExprs) {
		super(site);
		this.#parameters = parameters;
		this.#argTypeExprs = argTypeExprs;
		this.#retTypeExprs = retTypeExprs;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		if (this.#retTypeExprs.length === 1) {
			return `${this.#parameters.toString()}(${this.#argTypeExprs.map(a => a.toString()).join(", ")}) -> ${this.#retTypeExprs.toString()}`;
		} else {
			return `${this.#parameters.toString()}(${this.#argTypeExprs.map(a => a.toString()).join(", ")}) -> (${this.#retTypeExprs.map(e => e.toString()).join(", ")})`;
		}
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Type}
	 */
	evalInternal(scope) {
		let argTypes = this.#argTypeExprs.map(a => a.eval(scope));

		let retTypes = this.#retTypeExprs.map(e => e.eval(scope));

		return new FuncType(argTypes, retTypes);
	}

	use() {
		this.#argTypeExprs.forEach(arg => arg.use());
		this.#retTypeExprs.forEach(e => e.use());
	}
}

/**
 * Base class of expression that evaluate to Values.
 * @package
 */
export class ValueExpr extends Expr {
	/** @type {?Instance} */
	#cache;

	/**
	 * @param {Site} site 
	 */
	constructor(site) {
		super(site);

		this.#cache = null;
	}

	/**
	 * @type {Instance}
	 */
	get value() {
		if (this.#cache === null) {
			throw new Error("type not yet evaluated");
		} else {
			return this.#cache;
		}
	}

	get type() {
		return this.value.getType(this.site);
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	evalInternal(scope) {
		throw new Error("not yet implemented");
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	eval(scope) {
		if (this.#cache === null) {
			this.#cache = this.evalInternal(scope);
		}

		return this.#cache;
	}

	/**
	 * Returns Intermediate Representation of a value expression.
	 * The IR should be indented to make debugging easier.
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		throw new Error("not implemented");
	}
}

/**
 * '... = ... ; ...' expression
 * @package
 */
export class AssignExpr extends ValueExpr {
	#nameTypes;
	#upstreamExpr;
	#downstreamExpr;

	/**
	 * @param {Site} site 
	 * @param {DestructExpr[]} nameTypes 
	 * @param {ValueExpr} upstreamExpr 
	 * @param {ValueExpr} downstreamExpr 
	 */
	constructor(site, nameTypes, upstreamExpr, downstreamExpr) {
		super(site);
		assert(nameTypes.length > 0);
		this.#nameTypes = nameTypes;
		this.#upstreamExpr = assertDefined(upstreamExpr);
		this.#downstreamExpr = assertDefined(downstreamExpr);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		let downstreamStr = this.#downstreamExpr.toString();
		assert(downstreamStr != undefined);

		if (this.#nameTypes.length === 1) {
			return `${this.#nameTypes.toString()} = ${this.#upstreamExpr.toString()}; ${downstreamStr}`;
		} else {
			return `(${this.#nameTypes.map(nt => nt.toString()).join(", ")}) = ${this.#upstreamExpr.toString()}; ${downstreamStr}`;
		}
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	evalInternal(scope) {
		const subScope = new Scope(scope);

		let upstreamVal = this.#upstreamExpr.eval(scope).assertInstance();
		if (!upstreamVal) {
			throw this.typeError("rhs in't an instance");
		}

		if (this.#nameTypes.length > 1) {
			if (!(upstreamVal instanceof MultiInstance)) {
				throw this.typeError("rhs ins't a multi-value");
			} else {
				let vals = upstreamVal.values;

				if (this.#nameTypes.length != vals.length) {
					throw this.typeError(`expected ${this.#nameTypes.length} rhs in multi-assign, got ${vals.length}`);
				} else {
					this.#nameTypes.forEach((nt, i) => nt.evalInAssignExpr(subScope, vals[i].getType(nt.site), i));
				}
			}
		} else {
			if (this.#nameTypes[0].hasType()) {
				this.#nameTypes[0].evalInAssignExpr(subScope, upstreamVal.getType(this.#nameTypes[0].site), 0);
			} else if (this.#upstreamExpr.isLiteral()) {
				// enum variant type resulting from a constructor-like associated function must be cast back into its enum type
				if ((this.#upstreamExpr instanceof CallExpr &&
					this.#upstreamExpr.fnExpr instanceof ValuePathExpr) || 
					(this.#upstreamExpr instanceof ValuePathExpr && 
					!this.#upstreamExpr.isZeroFieldConstructor())) 
				{
					let upstreamType = upstreamVal.getType(this.#upstreamExpr.site);

					if (upstreamType.isEnumMember()) {
						upstreamVal = Instance.new(upstreamType.parentType(Site.dummy()));
					}
				}

				subScope.set(this.#nameTypes[0].name, upstreamVal);
			} else {
				throw this.typeError("unable to infer type of assignment rhs");
			}
		}

		const downstreamVal = this.#downstreamExpr.eval(subScope);

		subScope.assertAllUsed();

		return downstreamVal;
	}

	use() {
		this.#nameTypes.forEach(nt => nt.use());
		this.#upstreamExpr.use();
		this.#downstreamExpr.use();
	}

	/**
	 * 
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		
		if (this.#nameTypes.length === 1) {
			let inner = this.#downstreamExpr.toIR(indent + TAB);

			inner = this.#nameTypes[0].wrapDestructIR(indent, inner, 0);

			let upstream = this.#upstreamExpr.toIR(indent);

			// enum member run-time error IR
			if (this.#nameTypes[0].hasType()) {
				const t = this.#nameTypes[0].type;

				if (t.isEnumMember()) {
					upstream = new IR([
						new IR("__helios__common__assert_constr_index("),
						upstream,
						new IR(`, ${t.getConstrIndex(this.#nameTypes[0].site)})`)
					]);
				}
			}

			return new IR([
				new IR("("),
				this.#nameTypes[0].toNameIR(0),
				new IR(") "),
				new IR("->", this.site), new IR(` {\n${indent}${TAB}`),
				inner,
				new IR(`\n${indent}}(`),
				upstream,
				new IR(")")
			]);
		} else {
			let inner = this.#downstreamExpr.toIR(indent + TAB + TAB);

			for (let i = this.#nameTypes.length - 1; i >= 0; i--) {
				// internally generates enum-member error IR
				inner = this.#nameTypes[i].wrapDestructIR(indent, inner, i);
			}

			const ir = new IR([
				this.#upstreamExpr.toIR(indent),
				new IR(`(\n${indent + TAB}(`), new IR(this.#nameTypes.map((nt, i) => nt.toNameIR(i))).join(", "), new IR(") ->", this.site), new IR(` {\n${indent}${TAB}${TAB}`),
				inner,
				new IR(`\n${indent + TAB}}\n${indent})`)
			]);

			return ir;
		}
	}
}

/**
 * print(...); ... expression
 * @package
 */
export class PrintExpr extends ValueExpr {
	#msgExpr;
	#downstreamExpr;

	/**
	 * @param {Site} site 
	 * @param {ValueExpr} msgExpr 
	 * @param {ValueExpr} downstreamExpr 
	 */
	constructor(site, msgExpr, downstreamExpr) {
		super(site);
		this.#msgExpr = msgExpr;
		this.#downstreamExpr = downstreamExpr;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		let downstreamStr = this.#downstreamExpr.toString();
		assert(downstreamStr != undefined);
		return `print(${this.#msgExpr.toString()}); ${downstreamStr}`;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	evalInternal(scope) {
		const msgVal = this.#msgExpr.eval(scope).assertInstance();
		if (!msgVal) {
			throw this.#msgExpr.typeError("not an instance");
		}

		if (!msgVal.isInstanceOf(StringType)) {
			throw this.#msgExpr.typeError("expected string arg for print");
		}

		return this.#downstreamExpr.eval(scope);
	}

	use() {
		this.#msgExpr.use();
		this.#downstreamExpr.use();
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		return new IR([
			new IR("__core__trace", this.site), new IR("("), new IR("__helios__common__unStringData("),
			this.#msgExpr.toIR(indent),
			new IR(`), () -> {\n${indent}${TAB}`),
			this.#downstreamExpr.toIR(indent + TAB),
			new IR(`\n${indent}})()`)
		]);
	}
}

/**
 * Helios equivalent of unit
 * @package
 */
export class VoidExpr extends ValueExpr {
	/**
	 * @param {Site} site
	 */
	constructor(site) {
		super(site);
	}

	toString() {
		return "()";
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	evalInternal(scope) {
		return new VoidInstance();
	}

	use() {
	}

	toIR() {
		return new IR("()", this.site);
	}
}

/**
 * expr(...); ...
 * @package
 */
export class ChainExpr extends ValueExpr {
	#upstreamExpr;
	#downstreamExpr;

	/**
	 * @param {Site} site 
	 * @param {ValueExpr} upstreamExpr 
	 * @param {ValueExpr} downstreamExpr 
	 */
	constructor(site, upstreamExpr, downstreamExpr) {
		super(site);
		this.#upstreamExpr = upstreamExpr;
		this.#downstreamExpr = downstreamExpr;
	}

	toString() {
		return `${this.#upstreamExpr.toString()}; ${this.#downstreamExpr.toString()}`;
	}

	/**
	 * @param {Scope} scope
	 * @returns {Instance}
	 */
	evalInternal(scope) {
		let upstreamVal = this.#upstreamExpr.eval(scope);

		if (upstreamVal instanceof ErrorInstance) {
			throw this.#downstreamExpr.typeError("unreachable code (upstream always throws error)");
		} else if (!(upstreamVal instanceof VoidInstance)) {
			throw this.#upstreamExpr.typeError("unexpected return value (hint: use '='");
		}

		return this.#downstreamExpr.eval(scope);
	}

	use() {
		this.#upstreamExpr.use();
		this.#downstreamExpr.use();
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		return new IR([
			new IR("__core__chooseUnit(", this.site),
			this.#upstreamExpr.toIR(indent),
			new IR(", "),
			this.#downstreamExpr.toIR(indent),
			new IR(")")
		]);
	}
}

/**
 * Literal expression class (wraps literal tokens)
 * @package
 */
export class PrimitiveLiteralExpr extends ValueExpr {
	#primitive;

	/**
	 * @param {PrimitiveLiteral} primitive 
	 */
	constructor(primitive) {
		super(primitive.site);
		this.#primitive = primitive;
	}

	isLiteral() {
		return true;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.#primitive.toString();
	}

	/**
	 * @type {Type}
	 */
	get type() {
		if (this.#primitive instanceof IntLiteral) {
			return new IntType();
		} else if (this.#primitive instanceof RealLiteral) {
			return new RealType();
		} else if (this.#primitive instanceof BoolLiteral) {
			return new BoolType();
		} else if (this.#primitive instanceof StringLiteral) {
			return new StringType();
		} else if (this.#primitive instanceof ByteArrayLiteral) {
			return new ByteArrayType(this.#primitive.bytes.length == 32 ? 32 : null);
		} else {
			throw new Error("unhandled primitive type");
		}	
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	evalInternal(scope) {
		return new DataInstance(this.type);
	}

	use() {
	}

	/**
	 * @param {string} indent
	 * @returns {IR}
	 */
	toIR(indent = "") {
		// all literals can be reused in their string-form in the IR
		let inner = new IR(this.#primitive.toString(), this.#primitive.site);

		if (this.#primitive instanceof IntLiteral || this.#primitive instanceof RealLiteral) {
			return new IR([new IR("__core__iData", this.site), new IR("("), inner, new IR(")")]);
		} else if (this.#primitive instanceof BoolLiteral) {
			return inner;
		} else if (this.#primitive instanceof StringLiteral) {
			return new IR([new IR("__helios__common__stringData", this.site), new IR("("), inner, new IR(")")]);
		} else if (this.#primitive instanceof ByteArrayLiteral) {
			return new IR([new IR("__core__bData", this.site), new IR("("), inner, new IR(")")]);
		} else {
			throw new Error("unhandled primitive type");
		}
	}
}

/**
 * Literal UplcData which is the result of parameter substitutions.
 * @package
 */
export class LiteralDataExpr extends ValueExpr {
	#type;
	#data;

	/**
	 * @param {Site} site 
	 * @param {Type} type
	 * @param {UplcData} data
	 */
	constructor(site, type, data) {
		super(site);
		this.#type = type;
		this.#data = data;
	}

	/**
	 * @package
	 * @type {Type}
	 */
	get type() {
		return this.#type;
	}

	/**
	 * @returns {boolean}
	 */
	isLiteral() {
		return true;
	}

	toString() {
		return `##${bytesToHex(this.#data.toCbor())}`;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	evalInternal(scope) {
		return Instance.new(this.#type);
	}

	use() {
	}

	toIR(indent = "") {
		return new IR(this.toString(), this.site);
	}
}

/**
 * Struct field (part of a literal struct constructor)
 * @package
 */
export class StructLiteralField {
	#name;
	#value;

	/**
	 * @param {?Word} name 
	 * @param {ValueExpr} value 
	 */
	constructor(name, value) {
		this.#name = name;
		this.#value = value;
	}

	get site() {
		if (this.#name === null) {
			return this.#value.site;
		} else {
			return this.#name.site;
		}
	}

	/**
	 * @returns {boolean}
	 */
	isNamed() {
		return this.#name !== null;
	}

	get name() {
		if (this.#name === null) {
			throw new Error("name of field not given");
		} else {
			return this.#name;
		}
	}

	toString() {
		if (this.#name === null) {
			return this.#value.toString();
		} else {
			return `${this.#name.toString()}: ${this.#value.toString()}`;
		}
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	eval(scope) {
		return this.#value.eval(scope);
	}

	use() {
		this.#value.use();
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		return this.#value.toIR(indent);
	}
}

/**
 * Struct literal constructor
 * @package
 */
export class StructLiteralExpr extends ValueExpr {
	#typeExpr;
	#fields;
	/** @type {?number} - set during evaluation */
	#constrIndex;

	/**
	 * @param {TypeExpr} typeExpr 
	 * @param {StructLiteralField[]} fields 
	 */
	constructor(typeExpr, fields) {
		super(typeExpr.site);
		this.#typeExpr = typeExpr;
		this.#fields = fields;
		this.#constrIndex = null;
	}

	isLiteral() {
		return true;
	}

	toString() {
		return `${this.#typeExpr.toString()}{${this.#fields.map(f => f.toString()).join(", ")}}`;
	}

	isNamed() {
		// the expression builder already checked that all fields are named or all or positional (i.e. not mixed)
		return this.#fields.length > 0 && this.#fields[0].isNamed();
	}

	/**
	 * @param {Scope} scope 
	 * @returns 
	 */
	evalInternal(scope) {
		const type = this.#typeExpr.eval(scope).assertType();
		if (!type) {
			throw this.#typeExpr.typeError("not a type");
		}

		this.#constrIndex = type.getConstrIndex(this.site);

		let instance = Instance.new(type);

		if (instance.nFields(this.site) != this.#fields.length) {
			throw this.typeError(`wrong number of fields for ${type.toString()}, expected ${instance.nFields(this.site)}, got ${this.#fields.length}`);
		}

		for (let i = 0; i < this.#fields.length; i++) {
			let f = this.#fields[i];
		
			let fieldVal = f.eval(scope);

			if (f.isNamed()) {
				// check the named type
				let memberType = instance.getInstanceMember(f.name).getType(f.name.site);

				if (!fieldVal.isInstanceOf(memberType)) {
					throw f.site.typeError(`wrong field type for '${f.name.toString()}', expected ${memberType.toString()}, got ${fieldVal.getType(Site.dummy()).toString()}`);
				}
			} else {
				// check the positional type
				let memberType = instance.getFieldType(f.site, i);
				
				if (!fieldVal.isInstanceOf(memberType)) {
					throw f.site.typeError(`wrong field type for field ${i.toString()}, expected ${memberType.toString()}, got ${fieldVal.getType(Site.dummy()).toString()}`);
				}
			}
		}

		return instance;
	}

	use() {
		this.#typeExpr.use();

		for (let f of this.#fields) {
			f.use();
		}
	}

	/**
	 * @param {Site} site
	 * @param {Type} type
	 * @param {IR[]} fields
	 * @param {number | null} constrIndex
	 */
	static toIRInternal(site, type, fields, constrIndex) {
		let ir = new IR("__core__mkNilData(())");

		const instance = Instance.new(type);

		for (let i = fields.length - 1; i >= 0; i--) {
			let f = fields[i];

			const isBool = instance.getFieldType(site, i) instanceof BoolType;

			if (isBool) {
				f = new IR([
					new IR("__helios__common__boolData("),
					f,
					new IR(")"),
				]);
			}

			// in case of a struct with only one field, return that field directly 
			if (fields.length == 1 && type instanceof StructStatementType) {
				return f;
			}

			ir = new IR([
				new IR("__core__mkCons("),
				f,
				new IR(", "),
				ir,
				new IR(")")
			]);
		}

		if (constrIndex === null) {
			throw new Error("constrIndex not yet set");
		} else if (constrIndex == -1) {
			// regular struct
			return new IR([
				new IR("__core__listData", site),
				new IR("("), 
				ir,
				new IR(")")
			]);
		} else {
			return new IR([
				new IR("__core__constrData", site), new IR(`(${constrIndex.toString()}, `),
				ir,
				new IR(")")
			]);
		}
	}

	/**
	 * @param {string} indent
	 * @returns {IR}
	 */
	toIR(indent = "") {
		const type = this.#typeExpr.type;

		const fields = this.#fields.slice();

		// sort fields by correct name
		if (this.isNamed()) {
			fields.sort((a, b) => type.getFieldIndex(this.site, a.name.value) - type.getFieldIndex(this.site, b.name.value));
		}

		const irFields = fields.map(f => f.toIR(indent));

		return StructLiteralExpr.toIRInternal(this.site, type, irFields, this.#constrIndex);
	}
}

/**
 * []{...} expression
 * @package
 */
export class ListLiteralExpr extends ValueExpr {
	#itemTypeExpr;
	#itemExprs;

	/**
	 * @param {Site} site 
	 * @param {TypeExpr} itemTypeExpr 
	 * @param {ValueExpr[]} itemExprs 
	 */
	constructor(site, itemTypeExpr, itemExprs) {
		super(site);
		this.#itemTypeExpr = itemTypeExpr;
		this.#itemExprs = itemExprs;
	}

	isLiteral() {
		return true;
	}

	toString() {
		return `[]${this.#itemTypeExpr.toString()}{${this.#itemExprs.map(itemExpr => itemExpr.toString()).join(', ')}}`;
	}

	/**
	 * @param {Scope} scope
	 */
	evalInternal(scope) {
		let itemType = this.#itemTypeExpr.eval(scope);

		if (itemType instanceof FuncType) {
			throw this.#itemTypeExpr.typeError("content of list can't be func");
		}

		for (let itemExpr of this.#itemExprs) {
			let itemVal = itemExpr.eval(scope);

			if (!itemVal.isInstanceOf(itemType)) {
				throw itemExpr.typeError(`expected ${itemType.toString()}, got ${itemVal.toString()}`);
			}
		}

		return Instance.new(new ListType(itemType));
	}

	use() {
		this.#itemTypeExpr.use();

		for (let item of this.#itemExprs) {
			item.use();
		}
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		let isBool = this.#itemTypeExpr.type instanceof BoolType;

		// unsure if list literals in untyped Plutus-core accept arbitrary terms, so we will use the more verbose constructor functions 
		let res = new IR("__core__mkNilData(())");

		// starting from last element, keeping prepending a data version of that item

		for (let i = this.#itemExprs.length - 1; i >= 0; i--) {
			let itemIR = this.#itemExprs[i].toIR(indent);

			if (isBool) {
				itemIR = new IR([
					new IR("__helios__common__boolData("),
					itemIR,
					new IR(")"),
				]);
			}

			res = new IR([
				new IR("__core__mkCons("),
				itemIR,
				new IR(", "),
				res,
				new IR(")")
			]);
		}

		return new IR([new IR("__core__listData", this.site), new IR("("), res, new IR(")")]);
	}
}

/**
 * Map[...]...{... : ...} expression
 * @package
 */
export class MapLiteralExpr extends ValueExpr {
	#keyTypeExpr;
	#valueTypeExpr;
	#pairExprs;

	/**
	 * @param {Site} site 
	 * @param {TypeExpr} keyTypeExpr 
	 * @param {TypeExpr} valueTypeExpr
	 * @param {[ValueExpr, ValueExpr][]} pairExprs 
	 */
	constructor(site, keyTypeExpr, valueTypeExpr, pairExprs) {
		super(site);
		this.#keyTypeExpr = keyTypeExpr;
		this.#valueTypeExpr = valueTypeExpr;
		this.#pairExprs = pairExprs;
	}

	isLiteral() {
		return true;
	}

	toString() {
		return `Map[${this.#keyTypeExpr.toString()}]${this.#valueTypeExpr.toString()}{${this.#pairExprs.map(([keyExpr, valueExpr]) => `${keyExpr.toString()}: ${valueExpr.toString()}`).join(', ')}}`;
	}

	/**
	 * @param {Scope} scope
	 */
	evalInternal(scope) {
		let keyType = this.#keyTypeExpr.eval(scope);
		let valueType = this.#valueTypeExpr.eval(scope);

		if (keyType instanceof FuncType) {
			throw this.#keyTypeExpr.typeError("key-type of Map can't be func");
		} else if (valueType instanceof FuncType) {
			throw this.#valueTypeExpr.typeError("value-type of Map can't be func");
		}

		for (let [keyExpr, valueExpr] of this.#pairExprs) {
			let keyVal = keyExpr.eval(scope);
			let valueVal = valueExpr.eval(scope);

			if (!keyVal.isInstanceOf(keyType)) {
				throw keyExpr.typeError(`expected ${keyType.toString()} for map key, got ${keyVal.toString()}`);
			} else if (!valueVal.isInstanceOf(valueType)) {
				throw valueExpr.typeError(`expected ${valueType.toString()} for map value, got ${valueVal.toString()}`);
			}
		}

		return Instance.new(new MapType(keyType, valueType));
	}

	use() {
		this.#keyTypeExpr.use();
		this.#valueTypeExpr.use();

		for (let [fst, snd] of this.#pairExprs) {
			fst.use();
			snd.use();
		}
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		let isBoolValue = this.#valueTypeExpr.type instanceof BoolType;

		// unsure if list literals in untyped Plutus-core accept arbitrary terms, so we will use the more verbose constructor functions 
		let res = new IR("__core__mkNilPairData(())");

		// starting from last element, keeping prepending a data version of that item

		for (let i = this.#pairExprs.length - 1; i >= 0; i--) {
			let [keyExpr, valueExpr] = this.#pairExprs[i];

			let valueIR = valueExpr.toIR(indent);

			if (isBoolValue) {
				valueIR = new IR([
					new IR("__helios__common__boolData("),
					valueIR,
					new IR(")"),
				]);
			}

			res = new IR([
				new IR("__core__mkCons("),
				new IR("__core__mkPairData("),
				keyExpr.toIR(indent),
				new IR(","),
				valueIR,
				new IR(")"),
				new IR(", "),
				res,
				new IR(")")
			]);
		}

		return new IR([new IR("__core__mapData", this.site), new IR("("), res, new IR(")")]);
	}
}

/**
 * NameTypePair is base class of FuncArg and DataField (differs from StructLiteralField) 
 * @package
 */
export class NameTypePair {
	#name;
	#typeExpr;

	/**
	 * @param {Word} name 
	 * @param {?TypeExpr} typeExpr 
	 */
	constructor(name, typeExpr) {
		this.#name = name;
		this.#typeExpr = typeExpr;
	}

	/**
	 * @type {Site}
	 */
	get site() {
		return this.#name.site;
	}

	/**
	 * @type {Word}
	 */
	get name() {
		return this.#name;
	}

	isIgnored() {
		return this.name.value === "_";
	}

	/**
	 * @returns {boolean}
	 */
	hasType() {
		return this.#typeExpr !== null;
	}

	/**
	 * Throws an error if called before evalType()
	 * @type {Type}
	 */
	get type() {
		if (this.isIgnored()) {
			return new AnyType();
		} else if (this.#typeExpr === null) {
			throw new Error("typeExpr not set");
		} else {
			return this.#typeExpr.type;
		}
	}

	/**
	 * @type {string}
	 */
	get typeName() {
		if (this.#typeExpr === null) {
			return "";
		} else {
			return this.#typeExpr.toString();
		}
	}

	toString() {
		if (this.#typeExpr === null) {
			return this.name.toString();
		} else {
			return `${this.name.toString()}: ${this.#typeExpr.toString()}`;
		}
	}

	/**
	 * Evaluates the type, used by FuncLiteralExpr and DataDefinition
	 * @param {Scope} scope 
	 * @returns {Type}
	 */
	evalType(scope) {
		if (this.isIgnored()) {
			return new AnyType();
		} else if (this.#typeExpr === null) {
			throw new Error("typeExpr not set");
		} else {
			return this.#typeExpr.eval(scope);
		}
	}

	use() {
		if (this.#typeExpr !== null) {
			this.#typeExpr.use();
		}
	}

	/**
	 * @returns {IR}
	 */
	toIR() {
		return new IR(this.#name.toString(), this.#name.site);
	}
}

/**
 * Function argument class
 * @package
 */
export class FuncArg extends NameTypePair {
	#defaultValueExpr;

	/**
	 * @param {Word} name 
	 * @param {?TypeExpr} typeExpr
	 * @param {null | ValueExpr} defaultValueExpr
	 */
	constructor(name, typeExpr, defaultValueExpr = null) {
		super(name, typeExpr);

		this.#defaultValueExpr = defaultValueExpr;
	}

	/**
	 * @param {Scope} scope 
	 */
	evalDefault(scope) {
		if (this.#defaultValueExpr != null) {
			const v = this.#defaultValueExpr.eval(scope);

			const t = this.evalType(scope);

			if (!v.isInstanceOf(t)) {
				throw this.#defaultValueExpr.site.typeError(`expected ${t.toString()}, got ${v.getType(Site.dummy()).toString()}`);
			}
		}
	}

	/**
	 * @param {Scope} scope 
	 * @returns {ArgType}
	 */
	evalArgType(scope) {
		const t = super.evalType(scope);

		return new ArgType(this.name, t, this.#defaultValueExpr != null);
	}

	/**
	 * @returns {IR}
	 */
	toIR() {
		const name = super.toIR();

		if (this.#defaultValueExpr == null) {
			return name;
		} else {
			return new IR([
				new IR(`__useopt__${this.name.toString()}`),
				new IR(", "),
				name
			]);
		}
	}

	/**
	 * @param {IR} bodyIR 
	 * @param {string} name 
	 * @param {IR} defaultIR 
	 * @returns {IR}
	 */
	static wrapWithDefaultInternal(bodyIR, name, defaultIR) {
		return new IR([
			new IR(`(${name}) -> {`),
			bodyIR,
			new IR([
				new IR(`}(__core__ifThenElse(__useopt__${name}, () -> {${name}}, () -> {`),
				defaultIR, 
				new IR("})())")
			])
		]);
	}

	/**
	 * (argName) -> {
	 *   <bodyIR>
	 * }(
	 *   ifThenElse(
	 * 		__useoptarg__argName,
	 *  	() -> {
	 *        argName
	 *      },
	 *      () -> {
	 *        <defaultValueExpr>
	 *      }
	 *   )()
	 * )
	 * TODO: indentation
	 * @param {IR} bodyIR 
	 * @returns {IR}
	 */
	wrapWithDefault(bodyIR) {
		if (this.#defaultValueExpr == null) {
			return bodyIR;
		} else {
			const name = this.name.toString();

			return FuncArg.wrapWithDefaultInternal(bodyIR, name, this.#defaultValueExpr.toIR(""));
		}
	}
}

/**
 * @package
 */
export class TypeParameter {
	#name;
	#typeClassExpr;

	/**
	 * @param {Word} name 
	 * @param {null | TypeClassExpr} typeClassExpr 
	 */
	constructor(name, typeClassExpr) {
		this.#name = name;
		this.#typeClassExpr = typeClassExpr;
	}

	/**
	 * @type {string}
	 */
	get name() {
		return this.#name.value;
	}

	/**
	 * @type {TypeClass}
	 */
	get typeClass() {
		return this.#typeClassExpr?.typeClass ?? new AnyTypeClass();
	}

	/**
	 * @returns {string}
	 */
	toString() {
		if (this.#typeClassExpr) {
			return `${this.#name}: ${this.#typeClassExpr.toString()}`;
		} else {
			return `${this.#name}`;
		}
	}

	/**
	 * @param {Scope} scope 
	 */
	eval(scope) {
		const typeClass = this.#typeClassExpr?.eval(scope) ?? new AnyTypeClass();

		scope.set(this.#name, typeClass.asType(this.#name.value));
	}

	/**
	 * @returns {IR[]}
	 */
	collectIR() {
		const type = this.typeClass.asType(this.#name.value);

		return this.typeClass.memberNames.map(m => new IR(`${type.path}__${m}`, this.#name.site))
	}
}

/**
 * @package
 */
export class TypeParameters {
	#parameters;

	/**
	 * @param {TypeParameter[]} parameters 
	 */
	constructor(parameters) {
		this.#parameters = parameters;
	}

	hasParameters() {
		return this.#parameters.length > 0;
	}

	get parameters() {
		return this.#parameters.map(p => new Parameter(p.name, p.typeClass));
	}

	/**
	 * @returns {string}
	 */
	toString() {
		if (!this.hasParameters) {
			return "";
		} else {
			return `[${this.#parameters.map(p => p.toString()).join(", ")}]`;
		}
	}

	/**
	 * @param {Scope} scope 
	 */
	eval(scope) {
		if (this.#parameters.length == 0) {
			console.log("NO PARAMETERS");
			return scope;
		} else {
			const subScope = new Scope(scope);

			this.#parameters.forEach(p => p.eval(subScope));

			return subScope;
		}
	}

	/**
	 * 
	 * @param {FuncType} fnType
	 * @returns {Instance}
	 */
	createInstance(fnType) {
		if (this.#parameters.length == 0) {
			return new FuncInstance(fnType);
		} else {
			return new ParametricInstance(this.parameters, fnType);
		}
	}

	/**
	 * TODO: indent properly
	 * @param {string} indent
	 * @param {IR} ir 
	 * @returns {IR}
	 */
	wrapIR(indent, ir) {
		/**
		 * @type {IR[]}
		 */
		let members = [];

		this.#parameters.forEach(p => {
			const m = p.collectIR();

			members = members.concat(m);
		});

		if (members.length > 0) {
			return new IR([
				new IR("("),
				new IR(members).join(", "),
				new IR(") -> {"),
				ir,
				new IR("}")
			]);
		} else {
			return ir;
		}
	}
}

/**
 * (..) -> RetTypeExpr {...} expression
 * @package
 */
export class FuncLiteralExpr extends ValueExpr {
	#parameters;
	#args;
	#retTypeExprs;
	#bodyExpr;

	/**
	 * @param {Site} site 
	 * @param {TypeParameters} parameters
	 * @param {FuncArg[]} args 
	 * @param {(?TypeExpr)[]} retTypeExprs 
	 * @param {ValueExpr} bodyExpr 
	 */
	constructor(site, parameters, args, retTypeExprs, bodyExpr) {
		super(site);
		this.#parameters = parameters;
		this.#args = args;
		this.#retTypeExprs = retTypeExprs;
		this.#bodyExpr = bodyExpr;
	}

	/**
	 * @type {Type[]}
	 */
	get argTypes() {
		return this.#args.map(a => a.type);
	}

	/**
	 * @type {string[]}
	 */
	get argTypeNames() {
		return this.#args.map(a => a.typeName)
	}

	/**
	 * @type {Type[]}
	 */
	get retTypes() {
		return this.#retTypeExprs.map(e => {
			if (e == null) {
				return new AnyType();
			} else {
				return e.type
			}
		});
	}

	/**
	 * @returns {boolean}
	 */
	hasParameters() {
		return this.#parameters.hasParameters();
	}

	/**
	 * @type {Parameter[]}
	 */
	get	parameters() {
		return this.#parameters.parameters;
	}

	/**
	 * @returns {boolean}
	 */
	isLiteral() {
		return true;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		if (this.#retTypeExprs.length === 1) {
			let retTypeExpr = this.#retTypeExprs[0];
			if (retTypeExpr == null) {
				return `${this.#parameters.toString()}(${this.#args.map(a => a.toString()).join(", ")}) -> {${this.#bodyExpr.toString()}}`;
			} else {
				return `${this.#parameters.toString()}(${this.#args.map(a => a.toString()).join(", ")}) -> ${retTypeExpr.toString()} {${this.#bodyExpr.toString()}}`;
			}
		} else {
			return `${this.#parameters.toString()}(${this.#args.map(a => a.toString()).join(", ")}) -> (${this.#retTypeExprs.map(e => assertDefined(e).toString()).join(", ")}) {${this.#bodyExpr.toString()}}`;
		}
	}

	/**
	 * @param {Scope} scope 
	 * @returns {FuncType}
	 */
	evalTypeInternal(scope) {
		let args = this.#args;
		if (this.isMethod()) {
			args = args.slice(1);
		}

		let argTypes = args.map(a => a.evalArgType(scope));

		let retTypes = this.#retTypeExprs.map(e => {
			if (e == null) {
				return new AnyType();
			} else {
				return e.eval(scope)
			}
		});

		return new FuncType(argTypes, retTypes);
	}

	/**
	 * @param {Scope} scope 
	 * @returns {FuncType}
	 */
	evalType(scope) {
		scope = this.#parameters.eval(scope);

		return this.evalTypeInternal(scope);
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	evalInternal(scope) {
		scope = this.#parameters.eval(scope);

		const fnType = this.evalTypeInternal(scope);
		
		// argTypes is calculated separately again here so it includes self
		const argTypes = this.#args.map(a => a.evalType(scope));

		const subScope = new Scope(scope);

		argTypes.forEach((a, i) => {
			if (!this.#args[i].isIgnored()) {
				this.#args[i].evalDefault(subScope);

				subScope.set(this.#args[i].name, Instance.new(a));
			}
		});

		let bodyVal = this.#bodyExpr.eval(subScope);

		if (this.#retTypeExprs.length === 1) {
			if (this.#retTypeExprs[0] == null) {
				if (bodyVal instanceof MultiInstance) {
					return new FuncInstance(new FuncType(fnType.argTypes, bodyVal.values.map(v => v.getType(this.site))));
				} else {
					return new FuncInstance(new FuncType(fnType.argTypes, bodyVal.getType(this.site)));
				}
			} else if (bodyVal instanceof MultiInstance) {
				throw this.#retTypeExprs[0].typeError("unexpected multi-value body");
			} else if (!bodyVal.isInstanceOf(fnType.retTypes[0])) {
				throw this.#retTypeExprs[0].typeError(`wrong return type, expected ${fnType.retTypes[0].toString()} but got ${this.#bodyExpr.type.toString()}`);
			}
		} else {
			if (bodyVal instanceof MultiInstance) {
				/** @type {Instance[]} */
				let bodyVals = bodyVal.values;

				if (bodyVals.length !== this.#retTypeExprs.length) {
					throw this.#bodyExpr.typeError(`expected multi-value function body with ${this.#retTypeExprs.length} values, but got ${bodyVals.length} values`);
				} else {
					for (let i = 0; i < bodyVals.length; i++) {
						let v = bodyVals[i];

						let retTypeExpr = assertDefined(this.#retTypeExprs[i]);
						if (!v.isInstanceOf(fnType.retTypes[i])) {
							throw retTypeExpr.typeError(`wrong return type for value ${i}, expected ${fnType.retTypes[i].toString()} but got ${v.getType(this.#bodyExpr.site).toString()}`);
						}
					}
				}
			} else {
				throw this.#bodyExpr.typeError(`expected multi-value function body, but got ${this.#bodyExpr.type.toString()}`);
			}
		}

		subScope.assertAllUsed();

		let res = this.#parameters.createInstance(fnType);

		return res;
	}

	isMethod() {
		return this.#args.length > 0 && this.#args[0].name.toString() == "self";
	}

	use() {
		for (let arg of this.#args) {
			arg.use();
		}

		this.#retTypeExprs.forEach(e => {
			if (e !== null) {
				e.use();
			}
		});
		this.#bodyExpr.use();
	}

	/**
	 * @returns {IR}
	 */
	argsToIR() {
		let args = this.#args.map(a => a.toIR());
		if (this.isMethod()) {
			args = args.slice(1);
		}

		return (new IR(args)).join(", ");
	}

	/**
	 * In reverse order, because later opt args might depend on earlier args
	 * @param {IR} innerIR 
	 * @returns {IR}
	 */
	wrapWithDefaultArgs(innerIR) {
		const args = this.#args.slice().reverse();

		for (let arg of args) {
			innerIR = arg.wrapWithDefault(innerIR);
		}

		return innerIR;
	}

	/**
	 * @param {?string} recursiveName 
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIRInternal(recursiveName, indent = "") {
		let argsWithCommas = this.argsToIR();

		let innerIndent = indent;
		let methodIndent = indent;
		if (this.isMethod()) {
			innerIndent += TAB;
		}

		if (recursiveName !== null) {
			innerIndent += TAB;
			methodIndent += TAB;
		}

		let innerIR = this.#bodyExpr.toIR(innerIndent + TAB);

		innerIR = this.wrapWithDefaultArgs(innerIR);

		let ir = new IR([
			new IR("("),
			argsWithCommas,
			new IR(") "), new IR("->", this.site), new IR(` {\n${innerIndent}${TAB}`),
			innerIR,
			new IR(`\n${innerIndent}}`),
		]);

		// wrap with 'self'
		if (this.isMethod()) {
			ir = new IR([
				new IR(`(self) -> {\n${methodIndent}${TAB}`),
				ir,
				new IR(`\n${methodIndent}}`),
			]);
		}

		if (recursiveName !== null) {
			ir = new IR([
				new IR("("),
				new IR(recursiveName),
				new IR(`) -> {\n${indent}${TAB}`),
				ir,
				new IR(`\n${indent}}`)
			]);
		}

		ir = this.#parameters.wrapIR(indent, ir);

		return ir;
	}

	/**
	 * @param {string} recursiveName 
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIRRecursive(recursiveName, indent = "") {
		return this.toIRInternal(recursiveName, indent);
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		return this.toIRInternal(null, indent);
	}
}

/**
 * Variable expression
 * @package
 */
export class ValueRefExpr extends ValueExpr {
	#name;
	#isRecursiveFunc;

	/**
	 * @param {Word} name 
	 */
	constructor(name) {
		super(name.site);
		this.#name = name;
		this.#isRecursiveFunc = false;
	}

	toString() {
		return this.#name.toString();
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	evalInternal(scope) {
		const val = scope.get(this.#name).assertInstance();
		if (!val) {
			throw this.#name.site.typeError("not an instance");
		}

		if (val instanceof FuncInstance && val.isRecursive(scope)) {
			this.#isRecursiveFunc = true;
		}

		return val;
	}

	use() {
		if (this.value instanceof FuncStatementInstance || this.value instanceof ParametricFuncStatementInstance) {
			this.value.statement.use();
		} else if (this.value instanceof ConstStatementInstance) {
			this.value.statement.use();
		}
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		let path = this.toString();

		if (this.value instanceof FuncStatementInstance || this.value instanceof ParametricFuncStatementInstance || this.value instanceof ConstStatementInstance) {
			path = this.value.statement.path;
		} else if (this.value instanceof BuiltinFuncInstance) {
			path = this.value.path;
		}

		let ir = new IR(path, this.site);

		if (this.#isRecursiveFunc) {
			ir = new IR([
				ir,
				new IR("("),
				ir,
				new IR(")")
			]);
		}
		
		return ir;
	}
}

/**
 * value[...] expression
 * @package
 */
export class ParametricValueExpr extends ValueExpr {
	#baseExpr;
	#parameters;

	/**
	 * @param {Site} site - site of brackets
	 * @param {ValueExpr} baseExpr
	 * @param {TypeExpr[]} parameters
	 */
	constructor(site, baseExpr, parameters) {
		super(site);
		this.#baseExpr = baseExpr;
		this.#parameters = parameters;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `${this.#baseExpr.toString()}[${this.#parameters.map(p => p.toString()).join(", ")}]`;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	evalInternal(scope) {
		const paramTypes = this.#parameters.map(p => {
			const pt = p.eval(scope).assertType();

			if (!pt) {
				throw p.site.typeError("not a type");
			}

			return pt;
		});

		const baseVal_ = this.#baseExpr.eval(scope).assertInstance();
		
		const baseVal = baseVal_?.assertParametric();
		if (!baseVal) {
			throw this.site.typeError("not a parametric instance");
		}

		console.log("BEFORE APPLICATION: ", baseVal.toString());

		const applied = baseVal.applyTypes(this.site, paramTypes).assertInstance();
		if (!applied) {
			throw this.site.typeError("not an instance");
		}

		console.log("APPLIED instance: ", applied.toString());

		return applied;
	}

	use() {
		this.#baseExpr.use();

		this.#parameters.forEach(p => p.use());
	}

	/**
	 * Reused by CallExpr
	 * @param {IR} baseIR 
	 * @param {Type[]} paramTypes
	 * @param {TypeClass[]} typeClasses
	 * @param {Site[]} paramSites
	 */
	static toApplicationIR(baseIR, paramTypes, typeClasses, paramSites = []) {
		assert(typeClasses.length == paramTypes.length);

		/**
		 * @type {IR[]}
		 */
		const injected = [];

		paramTypes.forEach((pt, i) => {
			const tc = typeClasses[i];

			const ptPath = pt.path;

			tc.memberNames.forEach(mn => {
				if (paramSites[i]) {
					injected.push(new IR(`${ptPath}__${mn}`, paramSites[i]));
				} else {
					injected.push(new IR(`${ptPath}__${mn}`));
				}
			});
		});

		let ir = baseIR;

		if (injected.length > 0) {
			ir = new IR([
				ir,
				new IR("("),
				new IR(injected).join(", "),
				new IR(")")
			])
		}

		return ir;
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		const paramTypes = this.#parameters.map(p => p.type);

		const typeClasses = this.#baseExpr.value.assertParametric()?.typeClasses ?? [];

		return ParametricValueExpr.toApplicationIR(
			this.#baseExpr.toIR(indent),
			paramTypes,
			typeClasses,
			this.#parameters.map(p => p.site)
		)
	}
}

/**
 * Word::Word::... expression
 * @package
 */
export class ValuePathExpr extends ValueExpr {
	#baseTypeExpr;
	#memberName;
	#isRecursiveFunc;

	/**
	 * @param {TypeExpr} baseTypeExpr 
	 * @param {Word} memberName 
	 */
	constructor(baseTypeExpr, memberName) {
		super(memberName.site);
		this.#baseTypeExpr = baseTypeExpr;
		this.#memberName = memberName;
		this.#isRecursiveFunc = false;
	}

	/**
	 * @type {Type}
	 */
	get baseType() {
		return this.#baseTypeExpr.type;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `${this.#baseTypeExpr.toString()}::${this.#memberName.toString()}`;
	}

	/**
	 * @returns {boolean}
	 */
	isZeroFieldConstructor() {
		let type = this.type;

		if (type instanceof EnumMemberStatementType && type.statement.name.value === this.#memberName.value) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Returns true if ValuePathExpr constructs a literal enum member with zero field or
	 * if this baseType is also a baseType of the returned value
	 * @returns {boolean}
	 */
	isLiteral() {
		if (this.isZeroFieldConstructor()) {
			return true;
		} else {
			let type = this.type;

			if (this.baseType.isBaseOf(type)) {
				return true;
			} else {
				return false;
			}
		}
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	evalInternal(scope) {
		const baseType = this.#baseTypeExpr.eval(scope);

		const memberEntity = baseType.typeMembers[this.#memberName.value];
		if (!memberEntity) {
			throw this.#memberName.referenceError(`${baseType.toString()}.${this.#memberName.value} not found`);
		}

		const memberVal = memberEntity.assertInstance();
		if (!memberVal) {
			throw this.#memberName.site.typeError("not an instance");
		}

		if (memberVal instanceof FuncInstance && memberVal.isRecursive(scope)) {
			this.#isRecursiveFunc = true;
		}

		return memberVal;
	}

	use() {
		this.#baseTypeExpr.use();

		if (this.value instanceof ConstStatementInstance) {
			this.value.statement.use();
		} else if (this.value instanceof FuncStatementInstance || this.value instanceof ParametricFuncStatementInstance) {
			this.value.statement.use();
		}
	}

	/**
	 * @param {string} indent
	 * @returns {IR}
	 */
	toIR(indent = "") {
		// if we are directly accessing an enum member as a zero-field constructor we must change the code a bit
		const memberVal = this.#baseTypeExpr.type.typeMembers[this.#memberName.value];

		if ((memberVal instanceof EnumMemberStatementType) || (memberVal instanceof OptionNoneType)) {
			let cId = memberVal.getConstrIndex(this.#memberName.site);

			assert(cId >= 0);

			return new IR(`__core__constrData(${cId.toString()}, __core__mkNilData(()))`, this.site)
		} else {
			let path = `${this.#baseTypeExpr.type.path}__${this.#memberName.toString()}`;

			if (this.#baseTypeExpr.type instanceof Namespace) {
				if (memberVal instanceof StatementType || memberVal instanceof FuncStatementInstance || memberVal instanceof ParametricFuncStatementInstance || memberVal instanceof ConstStatementInstance) {
					path = memberVal.statement.path;
				} else {
					throw new Error("expected statement");
				}
			}

			let ir = new IR(path, this.site);

			if (this.#isRecursiveFunc) {
				ir = new IR([
					ir,
					new IR("("),
					ir,
					new IR(")")
				]);
			}

			return ir;
		}
	}
}

/**
 * Unary operator expression
 * Note: there are no post-unary operators, only pre
 * @package
 */
export class UnaryExpr extends ValueExpr {
	#op;
	#a;

	/**
	 * @param {SymbolToken} op 
	 * @param {ValueExpr} a 
	 */
	constructor(op, a) {
		super(op.site);
		this.#op = op;
		this.#a = a;
	}

	toString() {
		return `${this.#op.toString()}${this.#a.toString()}`;
	}

	/**
	 * Turns an op symbol into an internal name
	 * @returns {Word}
	 */
	translateOp() {
		let op = this.#op.toString();
		let site = this.#op.site;

		if (op == "+") {
			return new Word(site, "__pos");
		} else if (op == "-") {
			return new Word(site, "__neg");
		} else if (op == "!") {
			return new Word(site, "__not");
		} else {
			throw new Error("unhandled unary op");
		}
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	evalInternal(scope) {
		const a = this.#a.eval(scope).assertInstance();
		if (!a) {
			throw this.#a.site.typeError("not an instance");
		}

		let fnVal = a.getType(this.site).getTypeMember(this.translateOp());

		// ops are immediately applied
		return fnVal.call(this.#op.site, [a]);
	}

	use() {
		this.#a.use();
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		let path = this.type.path;

		return new IR([
			new IR(`${path}__${this.translateOp().value}`, this.site), new IR("("),
			this.#a.toIR(indent),
			new IR(")")
		]);
	}
}

/**
 * Binary operator expression
 * @package
 */
export class BinaryExpr extends ValueExpr {
	#op;
	#a;
	#b;
	#swap; // swap a and b for commutative ops
	#alt; // use alt (each operator can have one overload)

	/**
	 * @param {SymbolToken} op 
	 * @param {ValueExpr} a 
	 * @param {ValueExpr} b 
	 */
	constructor(op, a, b) {
		super(op.site);
		this.#op = op;
		this.#a = a;
		this.#b = b;
		this.#swap = false;
		this.#alt = 0;
	}

	/** 
	 * @type {ValueExpr}
	 */
	get first() {
		return this.#swap ? this.#b : this.#a;
	}

	/**
	 * @type {ValueExpr} 
	 */
	get second() {
		return this.#swap ? this.#a : this.#b;
	}

	toString() {
		return `${this.#a.toString()} ${this.#op.toString()} ${this.#b.toString()}`;
	}

	/**
	 * Turns op symbol into internal name
	 * @param {number} alt
	 * @returns {Word}
	 */
	translateOp(alt = 0) {
		let op = this.#op.toString();
		let site = this.#op.site;
		let name;

		if (op == "||") {
			name = "__or";
		} else if (op == "&&") {
			name = "__and";
		} else if (op == "==") {
			name = "__eq";
		} else if (op == "!=") {
			name = "__neq";
		} else if (op == "<") {
			name = "__lt";
		} else if (op == "<=") {
			name = "__leq";
		} else if (op == ">") {
			name = "__gt";
		} else if (op == ">=") {
			name = "__geq";
		} else if (op == "+") {
			name = "__add";
		} else if (op == "-") {
			name = "__sub";
		} else if (op == "*") {
			name = "__mul";
		} else if (op == "/") {
			name = "__div";
		} else if (op == "%") {
			name = "__mod";
		} else {
			throw new Error("unhandled");
		}

		if (alt > 0) {
			name += alt.toString();
		}

		return new Word(site, name);
	}

	/**
	 * @returns {boolean}
	 */
	isCommutative() {
		switch (this.#op.toString()) {
			case "+":
			case "*":
			case "==":
			case "!=":
				return true;
			default:
				return false;
		}
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	evalInternal(scope) {
		const a = this.#a.eval(scope).assertInstance();
		if (!a) {
			throw this.#a.typeError("not an instance");
		} 

		const b = this.#b.eval(scope).assertInstance();
		if (!b) {
			throw this.#b.typeError("not an instance");
		}

		/**
		 * @type {?UserError}
		 */
		let firstError = null;

		for (let swap of (this.isCommutative() ? [false, true] : [false])) {
			for (let alt of [0, 1, 2]) {
				let first  = swap ? b : a;
				let second = swap ? a : b;

				try {
					let fnVal = first.getType(this.site).getTypeMember(this.translateOp(alt));

					let res = fnVal.call(this.#op.site, [first, second]);

					this.#swap = swap;
					this.#alt  = alt;

					return res;
				} catch (e) {
					if (e instanceof UserError) {
						if (firstError === null) {
							firstError = e;
						}
						continue;
					} else {
						throw e;
					}
				}
			}
		}

		if (firstError !== null) {
			throw firstError;
		} else {
			throw new Error("unexpected");
		}
	}

	use() {
		this.#a.use();
		this.#b.use();
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		let path = this.first.type.path;

		let op = this.translateOp(this.#alt).value;

		if (op == "__and" || op == "__or") {
			return new IR([
				new IR(`${path}${op}`, this.site), new IR(`(\n${indent}${TAB}() -> {`),
				this.first.toIR(indent + TAB),
				new IR(`},\n${indent}${TAB}() -> {`),
				this.second.toIR(indent + TAB),
				new IR(`}\n${indent})`)
			]);
		} else {
			return new IR([
				new IR(`${path}__${op}`, this.site), new IR("("),
				this.first.toIR(indent),
				new IR(", "),
				this.second.toIR(indent),
				new IR(")")
			]);
		}
	}
}

/**
 * Parentheses expression
 * @package
 */
export class ParensExpr extends ValueExpr {
	#exprs;

	/**
	 * @param {Site} site 
	 * @param {ValueExpr[]} exprs
	 */
	constructor(site, exprs) {
		super(site);
		this.#exprs = exprs;
	}

	toString() {
		return `(${this.#exprs.map(e => e.toString()).join(", ")})`;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	evalInternal(scope) {
		if (this.#exprs.length === 1) {
			return this.#exprs[0].eval(scope);
		} else {
			return new MultiInstance(this.#exprs.map(e => {
				const v = e.eval(scope);

				if (v.getType(e.site) instanceof ErrorType) {
					throw e.site.typeError("unexpected error call in multi-valued expression");
				}

				return v;
			}));
		}
	}

	use() {
		this.#exprs.forEach(e => e.use());
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		if (this.#exprs.length === 1) {
			return this.#exprs[0].toIR(indent);
		} else {
			return new IR(
				[new IR(`(callback) -> {\n${indent + TAB}callback(\n${indent + TAB + TAB}`, this.site)]
				.concat(new IR(this.#exprs.map(e => e.toIR(indent + TAB + TAB))).join(`,\n${indent + TAB + TAB}`))
				.concat([new IR(`\n${indent + TAB})\n${indent}}`)])
			);
		}
	}
}

/**
 * @package
 */
export class CallArgExpr extends Token {
	#name;
	#valueExpr;

	/**
	 * @param {Site} site 
	 * @param {null | Word} name 
	 * @param {ValueExpr} valueExpr 
	 */
	constructor(site, name, valueExpr) {
		super(site);

		this.#name = name;
		this.#valueExpr = valueExpr;
	}

	/**
	 * @type {string}
	 */
	get name() {
		return this.#name?.toString() ?? "";
	}

	/**
	 * @type {ValueExpr}
	 */
	get valueExpr() {
		return this.#valueExpr;
	}

	/**
	 * @type {Instance}
	 */
	get value() {
		return this.#valueExpr.value;
	}

	/**
	 * @returns {boolean}
	 */
	isNamed() {
		return this.#name != null;
	}

	/**
	 * @returns {boolean}
	 */
	isLiteral() {
		return this.#valueExpr.isLiteral();
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return [
			this.#name != null ? `${this.#name.toString()}: `: "",
			this.#valueExpr.toString()
		].join("");
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	eval(scope) {
		return this.#valueExpr.eval(scope);
	}

	use() {
		this.#valueExpr.use();
	}
}

/**
 * ...(...) expression
 * @package
 */
export class CallExpr extends ValueExpr {
	#fnExpr;
	#argExprs;

	/**
	 * @type {Type[]}
	 */
	#paramTypes;

	/**
	 * @param {Site} site 
	 * @param {ValueExpr} fnExpr 
	 * @param {CallArgExpr[]} argExprs 
	 */
	constructor(site, fnExpr, argExprs) {
		super(site);
		this.#fnExpr = fnExpr;
		this.#argExprs = argExprs;
		this.#paramTypes = [];
	}

	get fnExpr() {
		return this.#fnExpr;
	}

	toString() {
		return `${this.#fnExpr.toString()}(${this.#argExprs.map(a => a.toString()).join(", ")})`;
	}

	isLiteral() {
		if (this.#fnExpr instanceof ValuePathExpr && this.#fnExpr.baseType.isBaseOf(this.type)) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	evalInternal(scope) {
		const fnVal = this.#fnExpr.eval(scope);

		const argVals = this.#argExprs.map(ae => ae.eval(scope));

		/**
		 * @type {Instance[]}
		 */
		let posArgVals = [];

		this.#argExprs.forEach((argExpr, i) => {
			if (!argExpr.isNamed()) {
				posArgVals.push(argVals[i]);
			}
		});

		posArgVals = MultiInstance.flatten(posArgVals);

		/**
		 * @type {{[name: string]: Instance}}
		 */
		const namedArgVals = {};

		this.#argExprs.forEach((argExpr, i) => {
			if (argExpr.isNamed()) {
				const val = argVals[i];

				// can't be multi instance
				if (val instanceof MultiInstance) {
					throw argExpr.typeError("can't use multiple return values as named argument");
				}

				namedArgVals[argExpr.name] = val;
			}
		});

		assert(posArgVals.every(pav => pav != undefined));

		if (fnVal instanceof ParametricInstance) {
			this.#paramTypes = [];

			return fnVal.call(this.site, posArgVals, namedArgVals, this.#paramTypes);
		} else {
			return fnVal.call(this.site, posArgVals, namedArgVals);
		}
	}

	use() {
		this.#fnExpr.use();

		for (let arg of this.#argExprs) {
			arg.use();
		}
	}

	/**
	 * Don't call this inside eval() because param types won't yet be complete.
	 * @type {FuncType}
	 */
	get fn() {
		return assertClass(this.#fnExpr.value.getType(this.#fnExpr.site), FuncType);
	}

	/**
	 * @returns {[ValueExpr[], IR[]]} - first list are positional args, second list named args and remaining opt args
	 */
	expandArgs() {
		const fn = this.fn;
		const nNonOptArgs = fn.nNonOptArgs;

		/**
		 * @type {ValueExpr[]}
		 */
		const positional = [];

		this.#argExprs.forEach(ae => {
			if (!ae.isNamed()) {
				positional.push(ae.valueExpr);
			}
		});

		/**
		 * @type {IR[]}
		 */
		const namedOptional = [];

		this.#argExprs.forEach(ae => {
			if (ae.isNamed()) {
				const i = fn.getNamedIndex(ae.site, ae.name);

				if (i < nNonOptArgs) {
					positional[i] = ae.valueExpr;
				} else {
					namedOptional[i - nNonOptArgs] = new IR([
						new IR("true"),
						new IR(", "),
						ae.valueExpr.toIR()
					]);
				}
			}
		});

		for (let i = nNonOptArgs; i < fn.nArgs; i++) {
			if (namedOptional[i - nNonOptArgs] == undefined) {
				namedOptional[i - nNonOptArgs] = new IR([
					new IR("false"),
					new IR(", "),
					new IR("()")
				]);
			}
		}

		return [positional.filter(p => p != undefined), namedOptional];
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		const fn = this.fn;
		let fnIR = this.#fnExpr.toIR(indent);
		const fnVal = this.#fnExpr.value.assertInstance();
		if (fnVal instanceof ParametricInstance) {
			assert(this.#paramTypes.length > 0);
			fnIR = ParametricValueExpr.toApplicationIR(fnIR, this.#paramTypes, fnVal.typeClasses);
		}

		/**
		 * First step is to eliminate the named args
		 * @type {[ValueExpr[], IR[]]}
		 */
		const [positional, namedOptional] = this.expandArgs();

		if (positional.some(e => (!e.isLiteral()) && (e.value instanceof MultiInstance))) {
			// count the number of final args
			let n = 0;

			positional.forEach((e, i) => {
				if ((!e.isLiteral()) && (e.value instanceof MultiInstance)) {
					n += e.value.values.length;
				} else {
					n += 1;
				}
			});

			n += namedOptional.length;

			if (n > fn.nArgs) {
				namedOptional.splice(0, n - fn.nArgs);
			}

			let names = [];

			for (let i = 0; i < fn.nArgs; i++) {
				if (i >= fn.nNonOptArgs) {
					names.push(`__useopt__x${i}`);
				}

				names.push(`x${i}`);
			}

			let ir = new IR([
				fnIR,
				new IR("("),
				new IR(names.map(n => new IR(n))).join(", "),
				new IR(")", this.site)
			]);

			for (let namedIR of namedOptional.slice().reverse()) {
				const n2 = assertDefined(names.pop());
				const n1 = assertDefined(names.pop());
				assert(n1.startsWith("__useopt__"));

				ir = new IR([
					new IR("("),
					new IR(n1),
					new IR(", "),
					new IR(n2),
					new IR(") -> {"),
					ir,
					new IR("}("),
					assertDefined(namedIR), // bool - val pair
					new IR(")")
				]);
			}

			for (let i = positional.length - 1; i >= 0; i--) {
				const e = positional[i];

				if ((!e.isLiteral()) && (e.value instanceof MultiInstance)) {
					const nMulti = e.value.values.length;
					const multiNames = [];
					const multiOpt = [];

					while (multiNames.length < nMulti) {
						multiNames.unshift(assertDefined(names.pop()));

						if (names.length > 0 && names[names.length-1] == `__useopt__${multiNames[0]}`) {
							multiOpt.unshift(assertDefined(names.pop()));
						}
					}

					if (multiOpt.length > 0) {
						ir = new IR([
							new IR("("),
							new IR(multiOpt.map(n => new IR(n))).join(", "),
							new IR(") -> {"),
							ir,
							new IR("}("),
							new IR(multiOpt.map(n => new IR("true"))).join(", "),
							new IR(")")
						])
					}

					ir = new IR([
						e.toIR(),
						new IR("(("),
						new IR(multiNames.map(n => new IR(n))).join(", "),
						new IR(") -> {"),
						ir,
						new IR("})")
					]);
				} else {
					const name = assertDefined(names.pop());

					if (names.length > 0 && names[names.length - 1] == `__useopt__${name}`) {
						ir = new IR([
							new IR("("),
							new IR(assertDefined(names.pop())),
							new IR(") -> {"),
							new IR("}(true)")
						]);
					}

					ir = new IR([
						new IR("("),
						new IR(name),
						new IR(") -> {"),
						ir,
						new IR("}("),
						e.toIR(),
						new IR(")")
					]);
				}
			}

			return ir;
		} else {
			if (positional.length + namedOptional.length > fn.nArgs) {
				namedOptional.splice(0, positional.length + namedOptional.length - fn.nArgs);
			}

			let args = positional.map((a, i) => {
				let ir = a.toIR(indent);

				if (i >= fn.nNonOptArgs) {
					ir = new IR([
						new IR("true, "),
						ir
					]);
				}

				return ir;
			}).concat(namedOptional);

			return new IR([
				fnIR,
				new IR("("),
				(new IR(args)).join(", "),
				new IR(")", this.site)
			]);
		}
	}
}

/**
 *  ... . ... expression
 * @package
 */
export class MemberExpr extends ValueExpr {
	#objExpr;
	#memberName;
	#isRecursiveFunc;

	/**
	 * @param {Site} site 
	 * @param {ValueExpr} objExpr 
	 * @param {Word} memberName 
	 */
	constructor(site, objExpr, memberName) {
		super(site);
		this.#objExpr = objExpr;
		this.#memberName = memberName;
		this.#isRecursiveFunc = false;
	}

	toString() {
		return `${this.#objExpr.toString()}.${this.#memberName.toString()}`;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	evalInternal(scope) {
		const objVal = this.#objExpr.eval(scope).assertInstance();
		if (!objVal) {
			throw this.#objExpr.site.typeError("not an instance");
		}

		let memberVal = objVal.getInstanceMember(this.#memberName);

		if (memberVal instanceof FuncInstance && memberVal.isRecursive(scope)) {
			this.#isRecursiveFunc = true;
		}

		return memberVal;
	}

	use() {
		this.#objExpr.use();

		if (this.value instanceof FuncStatementInstance || this.value instanceof ParametricFuncStatementInstance) {
			this.value.statement.use();
		} else if (this.value instanceof ConstStatementInstance) {
			this.value.statement.use();
		}
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		// members can be functions so, field getters are also encoded as functions for consistency

		let objPath = this.#objExpr.type.path;

		// if we are getting the member of an enum member we should check if it a field or method, because for a method we have to use the parent type
		if ((this.#objExpr.type instanceof EnumMemberStatementType) && (!this.#objExpr.type.statement.hasField(this.#memberName))) {
			objPath = this.#objExpr.type.statement.parent.path;
		}

		// if the memberVal was a ParamFuncValue then the member name might need to be modified if the output type of some callbacks is a Bool
		if (this.value instanceof ParametricInstance && this.value.correctMemberName !== null) {
			this.#memberName = new Word(this.#memberName.site, this.value.correctMemberName());
		}

		let ir = new IR(`${objPath}__${this.#memberName.toString()}`, this.site);

		if (this.#isRecursiveFunc) {
			ir = new IR([
				ir,
				new IR("("),
				ir,
				new IR(")"),
			]);
		}

		return new IR([
			ir, new IR("("),
			this.#objExpr.toIR(indent),
			new IR(")"),
		]);
	}
}

/**
 * if-then-else expression 
 * @package
 */
export class IfElseExpr extends ValueExpr {
	#conditions;
	#branches;

	/**
	 * @param {Site} site 
	 * @param {ValueExpr[]} conditions 
	 * @param {ValueExpr[]} branches 
	 */
	constructor(site, conditions, branches) {
		assert(branches.length == conditions.length + 1);
		assert(branches.length > 1);

		super(site);
		this.#conditions = conditions;
		this.#branches = branches;
	}

	toString() {
		let s = "";
		for (let i = 0; i < this.#conditions.length; i++) {
			s += `if (${this.#conditions[i].toString()}) {${this.#branches[i].toString()}} else `;
		}

		s += `{${this.#branches[this.#conditions.length].toString()}}`;

		return s;
	}

	/**
	 * @param {Site} site
	 * @param {?Type} prevType
	 * @param {Type} newType
	 */
	static reduceBranchType(site, prevType, newType) {
		if (prevType === null || prevType instanceof ErrorType) {
			return newType;
		} else if (newType instanceof ErrorType) {
			return prevType;
		} else if (!prevType.isBaseOf(newType)) {
			if (newType.isBaseOf(prevType)) {
				return newType;
			} else {
				// check if enumparent is base of newType and of prevType
				if (newType.isEnumMember()) {
					const parentType = newType.parentType(Site.dummy());

					if (parentType.isBaseOf(prevType) && parentType.isBaseOf(newType)) {
						return parentType;
					}
				}

				throw site.typeError("inconsistent types");
			}
		} else {
			return prevType;
		}
	}

	/**
	 * @param {Site} site
	 * @param {?Type[]} prevTypes
	 * @param {Instance} newValue
	 * @returns {?Type[]}
	 */
	static reduceBranchMultiType(site, prevTypes, newValue) {
		if (!(newValue instanceof MultiInstance) && newValue.getType(site) instanceof ErrorType) {
			return prevTypes;
		}

		const newTypes = (newValue instanceof MultiInstance) ?
			newValue.values.map(v => v.getType(site)) :
			[newValue.getType(site)];

		if (prevTypes === null) {
			return newTypes;
		} else if (prevTypes.length !== newTypes.length) {
			throw site.typeError("inconsistent number of multi-value types");
		} else {
			return prevTypes.map((pt, i) => IfElseExpr.reduceBranchType(site, pt, newTypes[i]));
		}
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	evalInternal(scope) {
		for (let c of this.#conditions) {
			let cVal = c.eval(scope);
			if (!cVal.isInstanceOf(BoolType)) {
				throw c.typeError("expected bool");
			}
		}

		/**
		 * Supports multiple return values
		 * @type {?Type[]}
		 */
		let branchMultiType = null;

		for (let b of this.#branches) {
			let branchVal = b.eval(scope);

			branchMultiType = IfElseExpr.reduceBranchMultiType(
				b.site, 
				branchMultiType, 
				branchVal
			);
		}

		if (branchMultiType === null) {
			// i.e. every branch throws an error
			return Instance.new(new ErrorType());
		} else  {
			return Instance.new(branchMultiType);
		}
	}

	use() {
		for (let c of this.#conditions) {
			c.use();
		}

		for (let b of this.#branches) {
			b.use();
		}
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		let n = this.#conditions.length;

		// each branch actually returns a function to allow deferred evaluation
		let res = new IR([
			new IR("() -> {"),
			this.#branches[n].toIR(indent),
			new IR("}")
		]);

		// TODO: nice indentation
		for (let i = n - 1; i >= 0; i--) {
			res = new IR([
				new IR("__core__ifThenElse("),
				this.#conditions[i].toIR(indent),
				new IR(", () -> {"),
				this.#branches[i].toIR(indent),
				new IR("}, () -> {"),
				res,
				new IR("()})"),
			]);
		}

		return new IR([res, new IR("()", this.site)]);
	}
}

/**
 * DestructExpr is for the lhs-side of assignments and for switch cases
 * @package
 */
export class DestructExpr {
	#name;
	#typeExpr;
	#destructExprs;

	/**
	 * @param {Word} name - use an underscore as a sink
	 * @param {?TypeExpr} typeExpr 
	 * @param {DestructExpr[]} destructExprs
	 */
	constructor(name, typeExpr, destructExprs = []) {
		this.#name = name;
		this.#typeExpr = typeExpr;
		this.#destructExprs = destructExprs;

		assert (!(this.#typeExpr == null && this.#destructExprs.length > 0));
	}

	/**
	 * @type {Site}
	 */
	get site() {
		return this.#name.site;
	}

	/**
	 * @type {Word}
	 */
	get name() {
		return this.#name;
	}

	/**
	 * @returns {boolean}
	 */
	hasDestructExprs() {
		return this.#destructExprs.length > 0;
	}

	isIgnored() {
		return this.name.value === "_";
	}

	/**
	 * @returns {boolean}
	 */
	hasType() {
		return this.#typeExpr !== null;
	}

	/**
	 * Throws an error if called before evalType()
	 * @type {Type}
	 */
	get type() {
		if (this.#typeExpr === null) {
			if (this.isIgnored()) {
				return new AnyType();
			} else {
				throw new Error("typeExpr not set");
			}
		} else {
			return this.#typeExpr.type;
		}
	}

	/**
	 * @type {Word}
	 */
	get typeName() {
		if (this.#typeExpr === null) {
			return new Word(this.site, "");
		} else {
			return new Word(this.#typeExpr.site, this.#typeExpr.toString());
		}
	}

	toString() {
		if (this.#typeExpr === null) {
			return this.name.toString();
		} else {
			let destructStr = "";

			if (this.#destructExprs.length > 0) {
				destructStr = `{${this.#destructExprs.map(de => de.toString()).join(", ")}}`;
			}

			if (this.isIgnored()) {
				return `${this.#typeExpr.toString()}${destructStr}`;
			} else {
				return `${this.name.toString()}: ${this.#typeExpr.toString()}${destructStr}`;
			}
		}
	}

	/**
	 * Evaluates the type, used by FuncLiteralExpr and DataDefinition
	 * @param {Scope} scope 
	 * @returns {Type}
	 */
	evalType(scope) {
		if (this.#typeExpr === null) {
			if (this.isIgnored()) {
				return new AnyType();
			} else {
				throw new Error("typeExpr not set");
			}
		} else {
			return this.#typeExpr.eval(scope);
		}
	}

	/**
	 * @param {Scope} scope 
	 * @param {Type} upstreamType 
	 */
	evalDestructExprs(scope, upstreamType) {
		if (this.#destructExprs.length > 0) {
			if (!(upstreamType instanceof AnyType) && upstreamType.nFields(this.site) != this.#destructExprs.length) {
				throw this.site.typeError(`wrong number of destruct fields, expected ${upstreamType.nFields(this.site)}, got ${this.#destructExprs.length}`);
			}

			for (let i = 0; i < this.#destructExprs.length; i++) {

				this.#destructExprs[i].evalInternal(
					scope, 
					upstreamType.getFieldType(this.site, i), 
					i
				);
			}
		}
	}

	/**
	 * @param {Scope} scope 
	 * @param {Type} upstreamType
	 * @param {number} i
	 */
	evalInternal(scope, upstreamType, i) {
		if (this.hasType()) {
			const t = this.evalType(scope).assertType();
			if (!t) {
				throw this.site.typeError("not a type");
			}

			// differs from upstreamType because can be enum parent
			let checkType = t;

			// if t is enum variant, get parent instead (exact variant is checked at runtime instead)
			if (t.isEnumMember() && !upstreamType.isEnumMember()) {
				checkType = t.parentType(this.site);
			}

			if (!Instance.new(upstreamType).isInstanceOf(checkType)) {
				throw this.site.typeError(`expected ${checkType.toString()} for destructure field ${i+1}, got ${upstreamType.toString()}`);
			}

			if (!this.isIgnored()) {
				// TODO: take into account ghost type parameters
				scope.set(this.name, Instance.new(t));
			}

			this.evalDestructExprs(scope, t);
		} else {
			if (!this.isIgnored()) {
				// TODO: take into account ghost type parameters
				scope.set(this.name, Instance.new(upstreamType));
			}

			this.evalDestructExprs(scope, upstreamType);
		}
	}

	/**
	 * @param {Scope} scope
	 * @param {Type} caseType
	 */
	evalInSwitchCase(scope, caseType) {
		if (!this.isIgnored()) {
			scope.set(this.#name, Instance.new(caseType));
		}

		this.evalDestructExprs(scope, caseType)
	}

	/**
	 * @param {Scope} scope 
	 * @param {Type} upstreamType
	 * @param {number} i
	 */
	evalInAssignExpr(scope, upstreamType, i) {
		const t = this.evalType(scope).assertType();
		if (!t) {
			throw this.site.typeError("not a type");
		}

		// differs from upstreamType because can be enum parent
		let checkType = t;

		// if t is enum variant, get parent instead (exact variant is checked at runtime instead)
		if (t.isEnumMember() && !upstreamType.isEnumMember()) {
			checkType = t.parentType(this.site);
		}

		if (!Instance.new(upstreamType).isInstanceOf(checkType)) {
			throw this.site.typeError(`expected ${checkType.toString()} for rhs ${i+1}, got ${upstreamType.toString()}`);
		}

		if (!this.isIgnored()) {
			// TODO: take into account ghost type parameters
			scope.set(this.name, Instance.new(t));
		}

		this.evalDestructExprs(scope, t);
	}

	use() {
		if (this.#typeExpr !== null) {
			this.#typeExpr.use();
		}
	}

	/**
	 * @param {number} argIndex 
	 * @returns {IR}
	 */
	toNameIR(argIndex) {
		if (this.isIgnored()) {
			return new IR(`__lhs_${argIndex}`);
		} else {
			return new IR(this.#name.toString(), this.#name.site)
		}
	}

	/**
	 * @param {number} fieldIndex
	 * @param {boolean} isSwitchCase
	 * @returns {string}
	 */
	getFieldFn(fieldIndex, isSwitchCase = false) {
		if (isSwitchCase) {
			return `__helios__common__field_${fieldIndex}`;
		}

		const type = this.type;

		if (type.isEnumMember()) {
			return `__helios__common__field_${fieldIndex}`;
		} else if (type instanceof StructStatementType) {
			if (type.nFields(Site.dummy()) == 1) {
				return "";
			} else {
				return `__helios__common__tuple_field_${fieldIndex}`;
			}
		} else {
			return "";
		}
	}

	/**
	 * @param {string} indent
	 * @param {IR} inner 
	 * @param {string} objName 
	 * @param {number} fieldIndex 
	 * @param {string} fieldFn
	 * @returns {IR}
	 */
	wrapDestructIRInternal(indent, inner, objName, fieldIndex, fieldFn) {
		if (this.isIgnored() && this.#destructExprs.length == 0) {
			return inner;
		} else {
			const baseName = this.isIgnored() ? `${objName}_${fieldIndex}` : this.#name.toString();

			for (let i = this.#destructExprs.length - 1; i >= 0; i--) {
				inner = this.#destructExprs[i].wrapDestructIRInternal(indent + TAB, inner, baseName, i, this.getFieldFn(i));
			}

			let getter = `${fieldFn}(${objName})`;

			// assert correct constructor index
			if (this.#typeExpr && this.type.isEnumMember()) {
				const constrIdx = this.type.getConstrIndex(this.#typeExpr.site);

				getter = `__helios__common__assert_constr_index(${getter}, ${constrIdx})`;
			}
			
			return new IR([
				new IR("("),
				new IR(baseName, this.#name.site),
				new IR(") "),
				new IR("->", this.site), new IR(` {\n${indent}${TAB}`),
				inner,
				new IR(`\n${indent}}(${getter})`),
			]);
		}
	}

	/**
	 * @param {string} indent
	 * @param {IR} inner 
	 * @param {number} argIndex 
	 * @param {boolean} isSwitchCase
	 * @returns {IR}
	 */
	wrapDestructIR(indent, inner, argIndex, isSwitchCase = false) {
		if (this.#destructExprs.length == 0) {
			return inner;
		} else {
			const baseName = this.isIgnored() ? `__lhs_${argIndex}` : this.#name.toString();

			for (let i = this.#destructExprs.length - 1; i >= 0; i--) {
				const de = this.#destructExprs[i];

				inner = de.wrapDestructIRInternal(indent + TAB, inner, baseName, i, this.getFieldFn(i, isSwitchCase));
			}

			return inner;
		}
	}

	/**
	 * @returns {IR}
	 */
	toIR() {
		return new IR(this.#name.toString(), this.#name.site);
	}
}

/**
 * Switch case for a switch expression
 * @package
 */
export class SwitchCase extends Token {
	#lhs;
	#bodyExpr;

	/** @type {?number} */
	#constrIndex;

	/**
	 * @param {Site} site 
	 * @param {DestructExpr} lhs
	 * @param {ValueExpr} bodyExpr 
	 */
	constructor(site, lhs, bodyExpr) {
		super(site);
		this.#lhs = lhs;
		this.#bodyExpr = bodyExpr;
		this.#constrIndex = null;
	}

	/**
	 * @type {ValueExpr}
	 */
	get body() {
		return this.#bodyExpr;
	}

	/**
	 * Used by parser to check if typeExpr reference the same base enum
	 * @type {Word} - word representation of type
	 */
	get memberName() {
		return this.#lhs.typeName;
	}

	isDataMember() {
		switch (this.memberName.value) {
			case "Int":
			case "[]Data":
			case "ByteArray":
			case "Map[Data]Data":
				return true;
			default:
				return false;
		}
	}

	get constrIndex() {
		if (this.#constrIndex === null) {
			throw new Error("constrIndex not yet set");
		} else {
			return this.#constrIndex;
		}
	}

	toString() {
		return `${this.#lhs.toString()} => ${this.#bodyExpr.toString()}`;
	}

	/**
	 * Evaluates the switch type and body value of a case.
	 * @param {Scope} scope 
	 * @param {Type} enumType
	 * @returns {Instance}
	 */
	evalEnumMember(scope, enumType) {
		const caseType = enumType.getTypeMember(this.memberName).assertType();
		if (!caseType) {
			throw this.memberName.typeError("not a type");
		}

		this.#constrIndex = caseType.getConstrIndex(this.memberName.site);

		assert(this.#constrIndex >= 0);

		const caseScope = new Scope(scope);

		this.#lhs.evalInSwitchCase(caseScope, caseType);

		const bodyVal = this.#bodyExpr.eval(caseScope);

		caseScope.assertAllUsed();

		return bodyVal;
	}

	/**
	 * Evaluates the switch type and body value of a case.
	 * @param {Scope} scope
	 * @returns {Instance}
	 */
	evalDataMember(scope) {
		/** @type {Type} */
		let memberType;

		switch (this.memberName.value) {
			case "Int":
				memberType = new IntType();
				break;
			case "ByteArray":
				memberType = new ByteArrayType();
				break;
			case "[]Data":
				memberType = new ListType(new RawDataType());
				break;
			case "Map[Data]Data":
				memberType = new MapType(new RawDataType(), new RawDataType());
				break;
			default:
				let maybeMemberType = scope.get(this.memberName);
				if (maybeMemberType instanceof Type) {
					memberType = maybeMemberType;

					if (!(memberType instanceof EnumStatementType)) {
						throw this.memberName.typeError("expected an enum type");
					}
				} else {
					throw this.memberName.typeError("expected a type");
				}
		}

		const caseScope = new Scope(scope);

		this.#lhs.evalInSwitchCase(caseScope, memberType);

		const bodyVal = this.#bodyExpr.eval(caseScope);

		caseScope.assertAllUsed();

		return bodyVal;
	}

	use() {
		this.#bodyExpr.use();
	}

	/**
	 * Accept an arg because will be called with the result of the controlexpr
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		let inner = this.#bodyExpr.toIR(indent + TAB);

		inner = this.#lhs.wrapDestructIR(indent, inner, 0, true);

		return new IR([
			new IR("("),
			this.#lhs.toNameIR(0), 
			new IR(") "),
			new IR("->", this.site), new IR(` {\n${indent}${TAB}`),
			inner,
			new IR(`\n${indent}}`),
		]);
	}
}

/**
 * @package
 */
export class UnconstrDataSwitchCase extends SwitchCase {
	#intVarName;
	#lstVarName;

	/**
	 * @param {Site} site 
	 * @param {?Word} intVarName 
	 * @param {?Word} lstVarName 
	 * @param {ValueExpr} bodyExpr 
	 */
	constructor(site, intVarName, lstVarName, bodyExpr) {
		super(site, new DestructExpr(new Word(site, "_"), new TypeRefExpr(new Word(site, "(Int, []Data)"))), bodyExpr);

		this.#intVarName = intVarName;
		this.#lstVarName = lstVarName;
	}

	isDataMember() {
		return true;
	}

	toString() {
		return `(${this.#intVarName === null ? "" : this.#intVarName.value + ": "}Int, ${this.#lstVarName === null ? "" : this.#lstVarName.value + ": "} []Data) => ${this.body.toString()}`;
	}

	/**
	 * @param {Scope} scope 
	 * @param {Type} enumType
	 * @returns {Instance}
	 */
	evalEnumMember(scope, enumType) {
		throw new Error("not available");
	}

	/**
	 * Evaluates the switch type and body value of a case.
	 * @param {Scope} scope
	 * @returns {Instance}
	 */
	evalDataMember(scope) {
		if (this.#intVarName !== null || this.#lstVarName !== null) {
			let caseScope = new Scope(scope);

			if (this.#intVarName !== null) {
				caseScope.set(this.#intVarName, Instance.new(new IntType()));
			}

			if (this.#lstVarName !== null) {
				caseScope.set(this.#lstVarName, Instance.new(new ListType(new RawDataType())));
			}

			let bodyVal = this.body.eval(caseScope);

			caseScope.assertAllUsed();

			return bodyVal;
		} else {
			return this.body.eval(scope);
		}
	}

	/**
	 * Accepts two args
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		return new IR([
			new IR(`(data) -> {\n${indent}${TAB}`),
			new IR(`(pair) -> {\n${indent}${TAB}${TAB}`),
			new IR(`(${this.#intVarName !== null ? this.#intVarName.toString() : "_"}, ${this.#lstVarName !== null ? this.#lstVarName.toString() : "_"}) `), new IR("->", this.site), new IR(` {\n${indent}${TAB}${TAB}${TAB}`),
			this.body.toIR(indent + TAB + TAB + TAB),
			new IR(`\n${indent}${TAB}${TAB}}(__core__iData(__core__fstPair(pair)), __core__listData(__core__sndPair(pair)))`),
			new IR(`\n${indent}${TAB}}(__core__unConstrData(data))`),
			new IR(`\n${indent}}`)
		]);
	}
}

/**
 * Default switch case
 * @package
 */
export class SwitchDefault extends Token {
	#bodyExpr;

	/**
	 * @param {Site} site
	 * @param {ValueExpr} bodyExpr
	 */
	constructor(site, bodyExpr) {
		super(site);
		this.#bodyExpr = bodyExpr;
	}

	toString() {
		return `else => ${this.#bodyExpr.toString()}`;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	eval(scope) {
		return this.#bodyExpr.eval(scope);
	}

	use() {
		this.#bodyExpr.use();
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		return new IR([
			new IR(`(_) `), new IR("->", this.site), new IR(` {\n${indent}${TAB}`),
			this.#bodyExpr.toIR(indent + TAB),
			new IR(`\n${indent}}`)
		]);
	}
}

/**
 * Parent class of EnumSwitchExpr and DataSwitchExpr
 */
class SwitchExpr extends ValueExpr {
	#controlExpr;
	#cases;
	#defaultCase;

	/** 
	 * @param {Site} site
	 * @param {ValueExpr} controlExpr - input value of the switch
	 * @param {SwitchCase[]} cases
	 * @param {?SwitchDefault} defaultCase
	*/
	constructor(site, controlExpr, cases, defaultCase = null) {
		super(site);
		this.#controlExpr = controlExpr;
		this.#cases = cases;
		this.#defaultCase = defaultCase;
	}

	get controlExpr() {
		return this.#controlExpr;
	}

	get cases() {
		return this.#cases;
	}

	get defaultCase() {
		return this.#defaultCase;
	}

	/**
	 * If there isn't enough coverage then we can simply set the default case to void, so the other branches can be error, print or assert
	 */
	setDefaultCaseToVoid() {
		this.#defaultCase = new SwitchDefault(this.site, new VoidExpr(this.site));
	}

	toString() {
		return `${this.#controlExpr.toString()}.switch{${this.#cases.map(c => c.toString()).join(", ")}${this.#defaultCase === null ? "" : ", " + this.#defaultCase.toString()}}`;
	}

	use() {
		this.#controlExpr.use();

		for (let c of this.#cases) {
			c.use();
		}

		if (this.#defaultCase !== null) {
			this.#defaultCase.use();
		}
	}
}

/**
 * Switch expression for Enum, with SwitchCases and SwitchDefault as children
 * @package
 */
export class EnumSwitchExpr extends SwitchExpr {
	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	evalInternal(scope) {
		let controlVal = this.controlExpr.eval(scope);
		let enumType = controlVal.getType(this.controlExpr.site);
		let nEnumMembers = enumType.nEnumMembers(this.controlExpr.site);

		// check that we have enough cases to cover the enum members
		if (this.defaultCase === null && nEnumMembers > this.cases.length) {
			// mutate defaultCase to VoidExpr
			this.setDefaultCaseToVoid();
		}

		/** @type {?Type[]} */
		let branchMultiType = null;

		for (let c of this.cases) {
			let branchVal = c.evalEnumMember(scope, enumType);
	
			branchMultiType = IfElseExpr.reduceBranchMultiType(
				c.site, 
				branchMultiType, 
				branchVal
			);
		}

		if (this.defaultCase !== null) {
			let defaultVal = this.defaultCase.eval(scope);

			branchMultiType = IfElseExpr.reduceBranchMultiType(
				this.defaultCase.site,
				branchMultiType, 
				defaultVal
			);
		}

		if (branchMultiType === null) {
			return Instance.new(new ErrorType());
		} else {
			return Instance.new(branchMultiType);
		}
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		let cases = this.cases.slice();

		/** @type {SwitchCase | SwitchDefault} */
		let last;
		if (this.defaultCase !== null) {
			last = this.defaultCase;
		} else {
			last = assertDefined(cases.pop());
		}

		let n = cases.length;

		let res = last.toIR(indent + TAB + TAB + TAB);

		for (let i = n - 1; i >= 0; i--) {
			res = new IR([
				new IR(`__core__ifThenElse(__core__equalsInteger(i, ${cases[i].constrIndex.toString()}), () -> {`),
				cases[i].toIR(indent + TAB + TAB + TAB),
				new IR(`}, () -> {`),
				res,
				new IR(`})()`)
			]);
		}

		return new IR([
			new IR(`(e) `), new IR("->", this.site), new IR(` {\n${indent}${TAB}(\n${indent}${TAB}${TAB}(i) -> {\n${indent}${TAB}${TAB}${TAB}`),
			res,
			new IR(`\n${indent}${TAB}${TAB}}(__core__fstPair(__core__unConstrData(e)))\n${indent}${TAB})(e)\n${indent}}(`),
			this.controlExpr.toIR(indent),
			new IR(")"),
		]);
	}
}

/**
 * Switch expression for Data
 * @package
 */
export class DataSwitchExpr extends SwitchExpr {
	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	evalInternal(scope) {
		let controlVal = this.controlExpr.eval(scope);
		let dataType = controlVal.getType(this.controlExpr.site);

		let controlSite = this.controlExpr.site;
		if (!dataType.isBaseOf(new RawDataType())) {
			throw this.controlExpr.typeError(`expected Data type, got ${controlVal.getType(controlSite).toString()}`);
		}

		// check that we have enough cases to cover the enum members
		if (this.defaultCase === null && this.cases.length < 5) {
			// mutate defaultCase to VoidExpr
			this.setDefaultCaseToVoid();
		}

		/** @type {?Type[]} */
		let branchMultiType = null;

		for (let c of this.cases) {
			let branchVal = c.evalDataMember(scope);

			branchMultiType = IfElseExpr.reduceBranchMultiType(
				c.site, 
				branchMultiType, 
				branchVal
			);
		}

		if (this.defaultCase !== null) {
			let defaultVal = this.defaultCase.eval(scope);

			branchMultiType = IfElseExpr.reduceBranchMultiType(
				this.defaultCase.site, 
				branchMultiType, 
				defaultVal
			);
		}

		if (branchMultiType === null) {
			// only possible if each branch is an error
			return Instance.new(new ErrorType());
		} else {
			return Instance.new(branchMultiType);
		}
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		/** @type {[?IR, ?IR, ?IR, ?IR, ?IR]} */
		let cases = [null, null, null, null, null]; // constr, map, list, int, byteArray

		for (let c of this.cases) {
			let ir = c.toIR(indent + TAB + TAB);

			switch (c.memberName.value) {
				case "ByteArray":
					cases[4] = ir;
					break;
				case "Int":
					cases[3] = ir;
					break;
				case "[]Data":
					cases[2] = ir;
					break;
				case "Map[Data]Data":
					cases[1] = ir;
					break;
				case "(Int, []Data)":
					cases[0] = ir;
					break;
				default:
					if (cases[0] !== null) {
						throw new Error("should've been caught before");
					}

					cases[0] = ir;
			}
		}

		if (this.defaultCase !== null) {
			for (let i = 0; i < 5; i++) {
				if (cases[i] === null) {
					cases[i] = new IR(`${indent}${TAB}def`);
				}
			}
		}

		let res = new IR([
			new IR(`${indent}__core__chooseData(e, `, this.site),
			new IR(cases.map(c => assertDefined(c))).join(", "),
			new IR(`${indent})`)
		]);

		if (this.defaultCase !== null) {
			res = new IR([
				new IR(`${indent}(def) -> {\n`),
				res,
				new IR(`\n${indent}}(`),
				this.defaultCase.toIR(indent),
				new IR(`)`)
			]);
		}

		res = new IR([
			new IR(`${indent}(e) -> {\n`),
			res,
			new IR("(e)"),
			new IR(`${indent}}(`),
			this.controlExpr.toIR(indent),
			new IR(")")
		]);

		return res;
	}
}