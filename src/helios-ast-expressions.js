//@ts-check
// Helios AST expressions

import {
	TAB
} from "./constants.js";

import {
	assert,
	assertDefined
} from "./utils.js";

import { 
	BoolLiteral,
	ByteArrayLiteral,
	IntLiteral,
	IR,
	PrimitiveLiteral,
    Site,
	StringLiteral,
	SymbolToken,
    Token,
	UserError,
	Word
} from "./tokens.js";

import {
	AnyType,
	BoolType,
	BuiltinEnumMember,
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
	OptionType,
	OptionNoneType,
	ParamFuncValue,
	RawDataType,
	StatementType,
	StringType,
	StructStatementType,
    Type,
	VoidInstance,
	VoidType
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
	 * @param {?Type} cache
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
		let type = scope.get(this.#name);

		return type.assertType(this.#name.site);
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

	toString() {
		return `${this.#baseExpr.toString()}::${this.#memberName.toString()}`;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Type}
	 */
	evalInternal(scope) {
		let enumType = this.#baseExpr.eval(scope);

		let memberType = enumType.getTypeMember(this.#memberName);

		return memberType.assertType(this.#memberName.site);
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
 * (ArgType1, ...) -> RetType expression
 * @package
 */
export class FuncTypeExpr extends TypeExpr {
	#argTypeExprs;
	#retTypeExprs;

	/**
	 * @param {Site} site 
	 * @param {TypeExpr[]} argTypeExprs 
	 * @param {TypeExpr[]} retTypeExprs 
	 */
	constructor(site, argTypeExprs, retTypeExprs) {
		super(site);
		this.#argTypeExprs = argTypeExprs;
		this.#retTypeExprs = retTypeExprs;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		if (this.#retTypeExprs.length === 1) {
			return `(${this.#argTypeExprs.map(a => a.toString()).join(", ")}) -> ${this.#retTypeExprs.toString()}`;
		} else {
			return `(${this.#argTypeExprs.map(a => a.toString()).join(", ")}) -> (${this.#retTypeExprs.map(e => e.toString()).join(", ")})`;
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
	 * @param {NameTypePair[]} nameTypes 
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
		let subScope = new Scope(scope);

		let upstreamVal = this.#upstreamExpr.eval(scope);

		if (this.#nameTypes.length > 1) {
			if (!(upstreamVal instanceof MultiInstance)) {
				throw this.typeError("rhs ins't a multi-value");
			} else {
				let types = this.#nameTypes.map(nt => nt.evalType(scope));

				let vals = upstreamVal.values;

				if (types.length != vals.length) {
					throw this.typeError(`expected ${types.length} rhs in multi-assign, got ${vals.length}`);
				} else {
					types.forEach((t, i) => {
						if (!vals[i].isInstanceOf(this.#upstreamExpr.site, t)) {
							throw this.#upstreamExpr.typeError(`expected ${t.toString()} for rhs ${i+1}, got ${vals[i].toString()}`);
						}
					});

					vals.forEach((v, i) => {
						if (!this.#nameTypes[i].isIgnored()) {
							// TODO: take into account ghost type parameters
							v = Instance.new(types[i]);

							subScope.set(this.#nameTypes[i].name, v);
						}
					});
				}
			}
		} else {
			if (!upstreamVal.isValue()) {
				throw this.typeError("rhs isn't a value");
			}

			if (this.#nameTypes[0].hasType()) {
				let type = this.#nameTypes[0].evalType(scope);

				assert(type.isType());

				if (!upstreamVal.isInstanceOf(this.#upstreamExpr.site, type)) {
					throw this.#upstreamExpr.typeError(`expected ${type.toString()}, got ${upstreamVal.toString()}`);
				}

				// TODO: take into account ghost type parameters
				upstreamVal = Instance.new(type);
			} else if (this.#upstreamExpr.isLiteral()) {
				// enum variant type resulting from a constructor-like associated function must be cast back into its enum type
				if ((this.#upstreamExpr instanceof CallExpr &&
					this.#upstreamExpr.fnExpr instanceof ValuePathExpr) || 
					(this.#upstreamExpr instanceof ValuePathExpr && 
					!this.#upstreamExpr.isZeroFieldConstructor())) 
				{
					let upstreamType = upstreamVal.getType(this.#upstreamExpr.site);

					if (upstreamType instanceof EnumMemberStatementType) {
						upstreamVal = Instance.new(new StatementType(upstreamType.statement.parent));
					} else if (upstreamType instanceof BuiltinEnumMember) {
						upstreamVal = Instance.new(upstreamType.parentType);
					}
				}
			} else {
				throw this.typeError("unable to infer type of assignment rhs");
			}

			subScope.set(this.#nameTypes[0].name, upstreamVal);
		}

		let downstreamVal = this.#downstreamExpr.eval(subScope);

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
			return new IR([
				new IR(`(${this.#nameTypes[0].name.toString()}) `), new IR("->", this.site), new IR(` {\n${indent}${TAB}`),
				this.#downstreamExpr.toIR(indent + TAB),
				new IR(`\n${indent}}(`),
				this.#upstreamExpr.toIR(indent),
				new IR(")")
			]);
		} else {
			let ir = new IR([
				this.#upstreamExpr.toIR(indent),
				new IR(`(\n${indent + TAB}(`), new IR(this.#nameTypes.map(nt => new IR(nt.name.toString()))).join(", "), new IR(") ->", this.site), new IR(` {\n${indent}${TAB}${TAB}`),
				this.#downstreamExpr.toIR(indent + TAB + TAB),
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
		let msgVal = this.#msgExpr.eval(scope);

		assert(msgVal.isValue());

		if (!msgVal.isInstanceOf(this.#msgExpr.site, StringType)) {
			throw this.#msgExpr.typeError("expected string arg for print");
		}

		let downstreamVal = this.#downstreamExpr.eval(scope);

		return downstreamVal;
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

		if (this.#primitive instanceof IntLiteral) {
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

	/**
	 * @param {Scope} scope 
	 * @returns 
	 */
	evalInternal(scope) {
		let type = this.#typeExpr.eval(scope);

		assert(type.isType());

		this.#constrIndex = type.getConstrIndex(this.site);

		let instance = Instance.new(type);

		if (instance.nFields(this.site) != this.#fields.length) {
			throw this.typeError("wrong number of fields");
		}

		for (let i = 0; i < this.#fields.length; i++) {
			let f = this.#fields[i];
		
			let fieldVal = f.eval(scope);

			if (f.isNamed()) {
				// check the named type
				let memberType = instance.getInstanceMember(f.name).getType(f.name.site);

				if (!fieldVal.isInstanceOf(f.site, memberType)) {
					throw f.site.typeError(`wrong field type for '${f.name.toString()}'`);
				}
			}
			
			// check the positional type
			let memberType = instance.getFieldType(f.site, i);
			
			if (!fieldVal.isInstanceOf(f.site, memberType)) {
				if (f.isNamed()) {
					throw f.site.typeError("wrond field order");
				} else {
					throw f.site.typeError("wrong field type");
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
	 * @param {string} indent
	 * @returns {IR}
	 */
	toIR(indent = "") {
		let res = new IR("__core__mkNilData(())");

		let fields = this.#fields.slice();

		let instance = Instance.new(this.#typeExpr.type);

		for (let i = fields.length - 1; i >= 0; i--) {
			let f = fields[i];

			let isBool = instance.getFieldType(f.site, i) instanceof BoolType;

			let fIR = f.toIR(indent);

			if (isBool) {
				fIR = new IR([
					new IR("__helios__common__boolData("),
					fIR,
					new IR(")"),
				]);
			}

			// in case of a struct with only one field, return that field directly 
			if (fields.length == 1 && this.#typeExpr.type instanceof StructStatementType) {
				return fIR;
			}

			res = new IR([
				new IR("__core__mkCons("),
				fIR,
				new IR(", "),
				res,
				new IR(")")
			]);
		}

		let index = this.#constrIndex;

		if (index === null) {
			throw new Error("constrIndex not yet set");
		} else if (index == -1) {
			// regular struct
			return new IR([
				new IR("__core__listData", this.site),
				new IR("("), 
				res,
				new IR(")")
			]);
		} else {
			return new IR([
				new IR("__core__constrData", this.site), new IR(`(${index.toString()}, `),
				res,
				new IR(")")
			]);
		}
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

			if (!itemVal.isInstanceOf(itemExpr.site, itemType)) {
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

			if (!keyVal.isInstanceOf(keyExpr.site, keyType)) {
				throw keyExpr.typeError(`expected ${keyType.toString()} for map key, got ${keyVal.toString()}`);
			} else if (!valueVal.isInstanceOf(valueExpr.site, valueType)) {
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

	toIR() {
		return new IR(this.#name.toString(), this.#name.site);
	}
}

/**
 * Function argument class
 * @package
 */
export class FuncArg extends NameTypePair {
	/**
	 * @param {Word} name 
	 * @param {?TypeExpr} typeExpr 
	 */
	constructor(name, typeExpr) {
		super(name, typeExpr);
	}
}

/**
 * (..) -> RetTypeExpr {...} expression
 * @package
 */
export class FuncLiteralExpr extends ValueExpr {
	#args;
	#retTypeExprs;
	#bodyExpr;

	/**
	 * @param {Site} site 
	 * @param {FuncArg[]} args 
	 * @param {TypeExpr[]} retTypeExprs 
	 * @param {ValueExpr} bodyExpr 
	 */
	constructor(site, args, retTypeExprs, bodyExpr) {
		super(site);
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
		return this.#retTypeExprs.map(e => e.type);
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
			return `(${this.#args.map(a => a.toString()).join(", ")}) -> ${this.#retTypeExprs[0].toString()} {${this.#bodyExpr.toString()}}`;
		} else {
			return `(${this.#args.map(a => a.toString()).join(", ")}) -> (${this.#retTypeExprs.map(e => e.toString()).join(", ")}) {${this.#bodyExpr.toString()}}`;
		}
	}

	/**
	 * @param {Scope} scope 
	 * @returns 
	 */
	evalType(scope) {
		let args = this.#args;
		if (this.isMethod()) {
			args = args.slice(1);
		}

		let argTypes = args.map(a => a.evalType(scope));
		let retTypes = this.#retTypeExprs.map(e => e.eval(scope));

		return new FuncType(argTypes, retTypes);
	}

	/**
	 * @param {Scope} scope 
	 * @returns {FuncInstance}
	 */
	evalInternal(scope) {
		let fnType = this.evalType(scope);
		
		// argTypes is calculated separately again here so it includes self
		let argTypes = this.#args.map(a => a.evalType(scope));

		let res = new FuncInstance(fnType);

		let subScope = new Scope(scope);
		argTypes.forEach((a, i) => {
			if (!this.#args[i].isIgnored()) {
				subScope.set(this.#args[i].name, Instance.new(a));
			}
		});

		let bodyVal = this.#bodyExpr.eval(subScope);

		if (this.#retTypeExprs.length === 1) {
			if (bodyVal instanceof MultiInstance) {
				throw this.#retTypeExprs[0].typeError("unexpected multi-value body");
			} else if (!bodyVal.isInstanceOf(this.#retTypeExprs[0].site, fnType.retTypes[0])) {
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

						if (!v.isInstanceOf(this.#retTypeExprs[i].site, fnType.retTypes[i])) {
							throw this.#retTypeExprs[i].typeError(`wrong return type for value ${i}, expected ${fnType.retTypes[i].toString()} but got ${v.getType(this.#bodyExpr.site).toString()}`);
						}
					}
				}
			} else {
				throw this.#bodyExpr.typeError(`expected multi-value function body, but got ${this.#bodyExpr.type.toString()}`);
			}
		}

		subScope.assertAllUsed();

		return res;
	}

	isMethod() {
		return this.#args.length > 0 && this.#args[0].name.toString() == "self";
	}

	use() {
		for (let arg of this.#args) {
			arg.use();
		}

		this.#retTypeExprs.forEach(e => e.use());
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

		let ir = new IR([
			new IR("("),
			argsWithCommas,
			new IR(") "), new IR("->", this.site), new IR(` {\n${innerIndent}${TAB}`),
			this.#bodyExpr.toIR(innerIndent + TAB),
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
		let val = scope.get(this.#name);

		if (val instanceof FuncInstance && val.isRecursive(scope)) {
			this.#isRecursiveFunc = true;
		}

		return val.assertValue(this.#name.site);
	}

	use() {
		if (this.value instanceof FuncStatementInstance) {
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

		if (this.value instanceof FuncStatementInstance || this.value instanceof ConstStatementInstance) {
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

	toString() {
		return `${this.#baseTypeExpr.toString()}::${this.#memberName.toString()}`;
	}

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

			if (this.baseType.isBaseOf(this.site, type)) {
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
		let baseType = this.#baseTypeExpr.eval(scope);
		assert(baseType.isType());

		let memberVal = baseType.getTypeMember(this.#memberName);

		if (memberVal instanceof FuncInstance && memberVal.isRecursive(scope)) {
			this.#isRecursiveFunc = true;
		}

		return memberVal.assertValue(this.#memberName.site);
	}

	use() {
		this.#baseTypeExpr.use();

		if (this.value instanceof ConstStatementInstance) {
			this.value.statement.use();
		} else if (this.value instanceof FuncStatementInstance) {
			this.value.statement.use();
		}
	}

	/**
	 * @param {string} indent
	 * @returns {IR}
	 */
	toIR(indent = "") {
		// if we are directly accessing an enum member as a zero-field constructor we must change the code a bit
		let memberVal = this.#baseTypeExpr.type.getTypeMember(this.#memberName);

		if ((memberVal instanceof EnumMemberStatementType) || (memberVal instanceof OptionNoneType)) {
			let cId = memberVal.getConstrIndex(this.#memberName.site);

			assert(cId >= 0);

			return new IR(`__core__constrData(${cId.toString()}, __core__mkNilData(()))`, this.site)
		} else {
			let ir = new IR(`${this.#baseTypeExpr.type.path}__${this.#memberName.toString()}`, this.site);

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
		let a = this.#a.eval(scope);

		let fnVal = a.assertValue(this.#a.site).getInstanceMember(this.translateOp());

		// ops are immediately applied
		return fnVal.call(this.#op.site, []);
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
			new IR(")()")
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
		this.#alt = false;
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
	 * @param {boolean} alt
	 * @returns {Word}
	 */
	translateOp(alt = false) {
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

		if (alt) {
			name += "_alt";
		}

		return new Word(site, name);
	}

	isCommutative() {
		let op = this.#op.toString();
		return op == "+" || op == "*";
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	evalInternal(scope) {
		let a = this.#a.eval(scope);
		let b = this.#b.eval(scope);

		assert(a.isValue() && b.isValue());

		/**
		 * @type {?UserError}
		 */
		let firstError = null;

		for (let swap of (this.isCommutative() ? [false, true] : [false])) {
			for (let alt of [false, true]) {
				let first  = swap ? b : a;
				let second = swap ? a : b;

				try {
					let fnVal = first.getInstanceMember(this.translateOp(alt));

					let res = fnVal.call(this.#op.site, [second]);

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
				new IR(")("),
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
			return new MultiInstance(this.#exprs.map(e => e.eval(scope)));
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
 * ...(...) expression
 * @package
 */
export class CallExpr extends ValueExpr {
	#fnExpr;
	#argExprs;

	/**
	 * @param {Site} site 
	 * @param {ValueExpr} fnExpr 
	 * @param {ValueExpr[]} argExprs 
	 */
	constructor(site, fnExpr, argExprs) {
		super(site);
		this.#fnExpr = fnExpr;
		this.#argExprs = argExprs;
	}

	get fnExpr() {
		return this.#fnExpr;
	}

	toString() {
		return `${this.#fnExpr.toString()}(${this.#argExprs.map(a => a.toString()).join(", ")})`;
	}

	isLiteral() {
		if (this.#fnExpr instanceof ValuePathExpr && this.#fnExpr.baseType.isBaseOf(this.site, this.type)) {
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
		let fnVal = this.#fnExpr.eval(scope);

		let argVals = this.#argExprs.map(argExpr => argExpr.eval(scope));

		argVals = MultiInstance.flatten(argVals);

		return fnVal.call(this.site, argVals);
	}

	use() {
		this.#fnExpr.use();

		for (let arg of this.#argExprs) {
			arg.use();
		}
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		if (this.#argExprs.some(e => (!e.isLiteral()) && (e.value instanceof MultiInstance))) {
			// count the number of final args
			let n = 0;
			this.#argExprs.forEach(e => {
				if ((!e.isLiteral()) && (e.value instanceof MultiInstance)) {
					n += e.value.values.length;
				} else {
					n += 1;
				}
			});

			let names = [];

			for (let i = 0; i < n; i++) {
				names.push(`x${i}`);
			}

			let ir = new IR([
				this.#fnExpr.toIR(),
				new IR("("),
				new IR(names.map(n => new IR(n))).join(", "),
				new IR(")", this.site)
			]);

			let exprs = this.#argExprs.slice().reverse();

			for (let e of exprs) {
				if ((!e.isLiteral()) && (e.value instanceof MultiInstance)) {
					let mNames = names.splice(names.length - e.value.values.length);

					ir = new IR([
						e.toIR(),
						new IR("(("),
						new IR(mNames.map(n => new IR(n))).join(", "),
						new IR(") -> {"),
						ir,
						new IR("})")
					]);
				} else {
					ir = new IR([
						new IR("("),
						new IR(assertDefined(names.pop())),
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
			let args = this.#argExprs.map(a => a.toIR(indent));

			return new IR([
				this.#fnExpr.toIR(indent),
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
		let objVal = this.#objExpr.eval(scope);

		let memberVal = objVal.assertValue(this.#objExpr.site).getInstanceMember(this.#memberName);

		if (memberVal instanceof FuncInstance && memberVal.isRecursive(scope)) {
			this.#isRecursiveFunc = true;
		}

		return memberVal;
	}

	use() {
		this.#objExpr.use();

		if (this.value instanceof FuncStatementInstance) {
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
		if (this.value instanceof ParamFuncValue && this.value.correctMemberName !== null) {
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
		} else if (!prevType.isBaseOf(site, newType)) {
			if (newType.isBaseOf(site, prevType)) {
				return newType;
			} else {
				// check if enumparent is base of newType and of prevType
				if (newType instanceof EnumMemberStatementType) {
					let parentType = new EnumStatementType(newType.statement.parent);

					if (parentType.isBaseOf(site, prevType) && parentType.isBaseOf(site, newType)) {
						return parentType;
					}
				} else if (newType instanceof BuiltinEnumMember) {
					let parentType = newType.parentType;

					if (parentType.isBaseOf(site, prevType) && parentType.isBaseOf(site, newType)) {
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
	 * @param {Type[]} newTypes
	 */
	static reduceBranchMultiType(site, prevTypes, newTypes) {
		if (prevTypes === null) {
			return newTypes
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
			if (!cVal.isInstanceOf(c.site, BoolType)) {
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
				(branchVal instanceof MultiInstance) ? 
					branchVal.values.map(v => v.getType(b.site)) : 
					[branchVal.getType(b.site)]
			);
		}

		if (branchMultiType === null) {
			throw new Error("unexpected");
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
 * Switch case for a switch expression
 * @package
 */
export class SwitchCase extends Token {
	#varName;
	#memberName;
	#bodyExpr;

	/** @type {?number} */
	#constrIndex;

	/**
	 * @param {Site} site 
	 * @param {?Word} varName - optional
	 * @param {Word} memberName - not optional
	 * @param {ValueExpr} bodyExpr 
	 */
	constructor(site, varName, memberName, bodyExpr) {
		super(site);
		this.#varName = varName;
		this.#memberName = memberName;
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
		return this.#memberName;
	}

	isDataMember() {
		switch (this.#memberName.value) {
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
		return `${this.#varName !== null ? this.#varName.toString() + ": " : ""}${this.#memberName.toString()} => ${this.#bodyExpr.toString()}`;
	}

	/**
	 * Evaluates the switch type and body value of a case.
	 * Evaluated switch type is only used if #varName !== null
	 * @param {Scope} scope 
	 * @param {Type} enumType
	 * @returns {Instance}
	 */
	evalEnumMember(scope, enumType) {
		let caseType = enumType.getTypeMember(this.#memberName).assertType(this.#memberName.site);

		this.#constrIndex = caseType.getConstrIndex(this.#memberName.site);

		assert(this.#constrIndex >= 0);

		if (this.#varName !== null) {
			let caseScope = new Scope(scope);

			caseScope.set(this.#varName, Instance.new(caseType));

			let bodyVal = this.#bodyExpr.eval(caseScope);

			caseScope.assertAllUsed();

			return bodyVal;
		} else {
			return this.#bodyExpr.eval(scope);
		}
	}

	/**
	 * Evaluates the switch type and body value of a case.
	 * Evaluated switch type is only used if #varName !== null
	 * @param {Scope} scope
	 * @returns {Instance}
	 */
	evalDataMember(scope) {
		/** @type {Type} */
		let memberType;

		switch (this.#memberName.value) {
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
				let maybeMemberType = scope.get(this.#memberName);
				if (maybeMemberType instanceof Type) {
					memberType = maybeMemberType;

					if (!(memberType instanceof EnumStatementType)) {
						throw this.#memberName.typeError("expected an enum type");
					}
				} else {
					throw this.#memberName.typeError("expected a type");
				}
		}

		if (this.#varName !== null) {
			let caseScope = new Scope(scope);

			caseScope.set(this.#varName, Instance.new(memberType));

			let bodyVal = this.#bodyExpr.eval(caseScope);

			caseScope.assertAllUsed();

			return bodyVal;
		} else {
			return this.#bodyExpr.eval(scope);
		}
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
		return new IR([
			new IR(`(${this.#varName !== null ? this.#varName.toString() : "_"}) `), new IR("->", this.site), new IR(` {\n${indent}${TAB}`),
			this.#bodyExpr.toIR(indent + TAB),
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
		super(site, null, new Word(site, "(Int, []Data)"), bodyExpr);

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
	 * Evaluated switch type is only used if #varName !== null
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
			throw this.typeError(`insufficient coverage of '${enumType.toString()}' in switch expression`);
		}

		/** @type {?Type[]} */
		let branchMultiType = null;

		for (let c of this.cases) {
			let branchVal = c.evalEnumMember(scope, enumType);
	
			branchMultiType = IfElseExpr.reduceBranchMultiType(
				c.site, 
				branchMultiType, 
				(branchVal instanceof MultiInstance) ? 
					branchVal.values.map(v => v.getType(c.site)) :
					[branchVal.getType(c.site)]
			);
		}

		if (this.defaultCase !== null) {
			let defaultVal = this.defaultCase.eval(scope);

			branchMultiType = IfElseExpr.reduceBranchMultiType(
				this.defaultCase.site,
				branchMultiType, 
				(defaultVal instanceof MultiInstance) ?
					defaultVal.values.map(v => v.getType(assertDefined(this.defaultCase).site)) :
					[defaultVal.getType(this.defaultCase.site)]
			);
		}

		if (branchMultiType === null) {
			throw new Error("unexpected");
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
		if (!dataType.isBaseOf(controlSite, new RawDataType())) {
			throw this.controlExpr.typeError(`expected Data type, got ${controlVal.getType(controlSite).toString()}`);
		}

		// check that we have enough cases to cover the enum members
		if (this.defaultCase === null && this.cases.length < 5) {
			throw this.typeError(`insufficient coverage of 'Data' in switch expression`);
		}

		/** @type {?Type[]} */
		let branchMultiType = null;

		for (let c of this.cases) {
			let branchVal = c.evalDataMember(scope);

			branchMultiType = IfElseExpr.reduceBranchMultiType(
				c.site, 
				branchMultiType, 
				(branchVal instanceof MultiInstance) ?
					branchVal.values.map(v => v.getType(c.site)) :
					[branchVal.getType(c.site)]
			);
		}

		if (this.defaultCase !== null) {
			let defaultVal = this.defaultCase.eval(scope);

			branchMultiType = IfElseExpr.reduceBranchMultiType(
				this.defaultCase.site, 
				branchMultiType, 
				(defaultVal instanceof MultiInstance) ?
					defaultVal.values.map(v => v.getType(assertDefined(this.defaultCase).site)) :
					[defaultVal.getType(this.defaultCase.site)]
			);
		}

		if (branchMultiType === null) {
			throw new Error("unexpected");
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