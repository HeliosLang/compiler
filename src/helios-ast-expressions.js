//@ts-check
// Helios AST expressions

import {
	TAB
} from "./config.js";

import {
	assert,
	assertClass,
	assertDefined,
	bytesToHex
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
	AllType,
	ArgType,
	Common,
	DataEntity,
	ErrorEntity,
	ErrorType,
	FuncEntity,
	FuncType,
	MultiEntity,
	VoidEntity,
	VoidType

} from "./eval-common.js";

/**
 * @typedef {import("./eval-common.js").DataType} DataType
 */

/**
 * @typedef {import("./eval-common.js").EvalEntity} EvalEntity
 */

/**
 * @typedef {import("./eval-common.js").Func} Func
 */

/**
 * @typedef {import("./eval-common.js").Instance} Instance
 */

/**
 * @typedef {import("./eval-common.js").Multi} Multi
 */

/**
 * @typedef {import("./eval-common.js").Namespace} Namespace
 */

/**
 * @typedef {import("./eval-common.js").Type} Type
 */

/**
 * @typedef {import("./eval-common.js").Typed} Typed
 */

/**
 * @typedef {import("./eval-common.js").TypeClass} TypeClass
 */


import {
	BoolType,
	ByteArrayType,
	IntType,
	RawDataType,
	RealType,
	StringType
} from "./eval-primitives.js";

import {
	ParametricFunc
} from "./eval-parametric.js";

import {
	ListType$,
	MapType$,
	OptionType$,
	IteratorType$
} from "./eval-containers.js";

import {
	Scope
} from "./helios-scopes.js";

/**
 * Base class of every Type and Instance expression.
 * @package
 */
export class Expr extends Token {
	/**@type {null | EvalEntity} */
	#cache;

	/**
	 * @param {Site} site 
	 
	 */
	constructor(site) {
		super(site);
		this.#cache = null;
	}

	/**
	 * @type {null | EvalEntity}
	 */
	get cache() {
		return this.#cache;
	}

	/**
	 * Used in switch cases where initial typeExpr is used as memberName instead
	 * @param {null | EvalEntity} c
	 */
	set cache(c) {
		this.#cache = c;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		throw new Error("not yet implemented");
	}

	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	eval(scope) {
		//if (this.#cache === null) {
			this.#cache = this.evalInternal(scope);
		//}

		return this.#cache;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {DataType}
	 */
	evalAsDataType(scope) {
		const result = this.eval(scope).asDataType;

		if (!result) {
			throw this.typeError("not a data type");
		}

		return result;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Type}
	 */
	evalAsType(scope) {
		const r = this.eval(scope);

		const result = r.asType;

		if (!result) {
			throw this.typeError(`${r.toString()} isn't a type`);
		}

		return result;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Typed}
	 */
	evalAsTyped(scope) {
		const r  = this.eval(scope);

		const result = r.asTyped;

		if (!result) {
			throw this.typeError(`${r.toString()} isn't a value`);
		}

		return result;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Typed | Multi}
	 */
	evalAsTypedOrMulti(scope) {
		const r  = this.eval(scope);

		if (r.asTyped) {
			return r.asTyped;
		} else if (r.asMulti) {
			return r.asMulti;
		} else {
			throw this.typeError(`${r.toString()} isn't a value`);
		}
	}	

	/**
	 * @returns {boolean}
	 */
	isLiteral() {
		return false;
	}

	/**
	 * @param {string} indent
	 * @returns {IR}
	 */
	toIR(indent = "") {
		throw new Error("not yet implemented");
	}

	/**
	 * @returns {string}
	 */
	toString() {
		throw new Error("not yet implemented");
	}
}

/**
 * Simple reference class (i.e. using a Word)
 * @package
 */
export class RefExpr extends Expr {
	#name;

	/**
	 * @param {Word} name
	 */
	constructor(name) {
		super(name.site);
		this.#name = name;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		return scope.get(this.#name);
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		const path = this.cache?.asNamed ? this.cache.asNamed.path : this.#name.value;

		let ir = new IR(path, this.site);
		
		return ir;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.#name.toString();
	}
}

/**
 * Name::Member expression
 * @package
 */
export class PathExpr extends Expr {
	#baseExpr;
	#memberName;

	/**
	 * @param {Site} site 
	 * @param {Expr} baseExpr 
	 * @param {Word} memberName
	 */
	constructor(site, baseExpr, memberName) {
		super(site);
		this.#baseExpr = baseExpr;
		this.#memberName = memberName;
	}

	/**
	 * @type {Expr}
	 */
	get baseExpr() {
		return this.#baseExpr;
	}
	
	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		const base = this.#baseExpr.eval(scope);

		/**
		 * @type {null | EvalEntity}
		 */
		let member = null;

		if (base.asNamespace) {
			member = base.asNamespace.namespaceMembers[this.#memberName.value];
		} else if (base.asType) {
			const typeMembers = base.asType.typeMembers;

			member = typeMembers[this.#memberName.value];
		}

		if (!member) {
			throw this.#memberName.referenceError(`${base.toString()}::${this.#memberName.value} not found`);
		}

		if (member.asType?.toTyped().asFunc) {
			return member.asType.toTyped();
		} else {
			return member;
		}
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		const v = this.cache;

		if (v?.asNamed) {
			return new IR(`${v.asNamed.path}`, this.site);
		} else if (this.#baseExpr.cache?.asNamed) {
			return new IR(`${this.#baseExpr.cache.asNamed.path}__${this.#memberName.value}`, this.site);
		} else {
			throw new Error(`expected named value, ${v?.toString()}`);
		}
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `${this.#baseExpr.toString()}::${this.#memberName.toString()}`;
	}
}

/**
 * Name::Member expression which can instantiate zero field structs and enum members
 * @package
 */
export class ValuePathExpr extends PathExpr {

	/**
	 * @param {Site} site 
	 * @param {Expr} baseExpr 
	 * @param {Word} memberName
	 */
	constructor(site, baseExpr, memberName) {
		super(site, baseExpr, memberName);
	}
	
	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		const member = super.evalInternal(scope);

		if (member.asEnumMemberType && member.asEnumMemberType.fieldNames.length == 0) {
			return new DataEntity(member.asEnumMemberType);
		} else {
			return member;
		}
	}

	/**
	 * @returns {boolean}
	 */
	isLiteral() {
		return (this.cache?.asTyped?.type.asEnumMemberType?.fieldNames?.length ?? -1) == 0;
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		const v = this.cache;

		if (v?.asTyped?.type?.asEnumMemberType && v.asTyped.type.asEnumMemberType.fieldNames.length == 0) {
			return new IR([
				new IR(`${v.asTyped.type.asEnumMemberType.path}____new`, this.site),
				new IR("()")
			]);
		} else {
			return super.toIR(indent);
		}
	}
}

/**
 * []ItemType
 * @package
 */
export class ListTypeExpr extends Expr {
	#itemTypeExpr;

	/**
	 * @param {Site} site 
	 * @param {Expr} itemTypeExpr 
	 */
	constructor(site, itemTypeExpr) {
		super(site);
		this.#itemTypeExpr = itemTypeExpr;
	}
	
	/**
	 * @param {Scope} scope 
	 * @returns {Type}
	 */
	evalInternal(scope) {
		const itemType_ = this.#itemTypeExpr.eval(scope);
		const itemType = itemType_.asType;

		if (!itemType) {
			throw this.#itemTypeExpr.typeError(`'${itemType_.toString()}' isn't a type`);
		}

		return ListType$(itemType);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `[]${this.#itemTypeExpr.toString()}`;
	}
}

/**
 * Map[KeyType]ValueType expression
 * @package
 */
export class MapTypeExpr extends Expr {
	#keyTypeExpr;
	#valueTypeExpr;

	/**
	 * @param {Site} site 
	 * @param {Expr} keyTypeExpr 
	 * @param {Expr} valueTypeExpr 
	 */
	constructor(site, keyTypeExpr, valueTypeExpr) {
		super(site);
		this.#keyTypeExpr = keyTypeExpr;
		this.#valueTypeExpr = valueTypeExpr;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		const keyType = this.#keyTypeExpr.eval(scope).asType;
		if (!keyType) {
			throw this.#keyTypeExpr.typeError("map key type not a type");
		}

		const valueType = this.#valueTypeExpr.eval(scope).asType;
		if (!valueType) {
			throw this.#valueTypeExpr.typeError("map value type not a type");
		}

		return MapType$(keyType, valueType);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `Map[${this.#keyTypeExpr.toString()}]${this.#valueTypeExpr.toString()}`;
	}
}

/**
 * Iterator[Type1, ...] expr
 * @package
 */
export class IteratorTypeExpr extends Expr {
	#itemTypeExprs;

	/**
	 * @param {Site} site
	 * @param {Expr[]} itemTypeExprs
	 */
	constructor(site, itemTypeExprs) {
		super(site);

		this.#itemTypeExprs = itemTypeExprs;
	}

	/**
	 * @param {Scope} scope
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		const itemTypes = this.#itemTypeExprs.map(ite => {
			const itemType = ite.eval(scope).asType;

			if (!itemType) {
				throw ite.typeError("not a type");
			}

			return itemType;
		});

		if (itemTypes.length > 10) {
			throw this.site.typeError("too many Iterator type args (limited to 10)");
		}

		return IteratorType$(itemTypes);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `Iterator[${this.#itemTypeExprs.map(ite => ite.toString()).join(", ")}]`;
	}
}

/**
 * Option[SomeType] expression
 * @package
 */
export class OptionTypeExpr extends Expr {
	#someTypeExpr;

	/**
	 * @param {Site} site 
	 * @param {Expr} someTypeExpr 
	 */
	constructor(site, someTypeExpr) {
		super(site);
		this.#someTypeExpr = someTypeExpr;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Type}
	 */
	evalInternal(scope) {
		return OptionType$(this.#someTypeExpr.evalAsType(scope));
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `Option[${this.#someTypeExpr.toString()}]`;
	}
}

/**
 * '()' which can only be used as return type of func
 * @package
 */
export class VoidTypeExpr extends Expr {
	/**
	 * @param {Site} site 
	 */
	constructor(site) {
		super(site);
	}

	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		return new VoidType();
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return "()";
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
	 * @param {Expr} typeExpr 
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
	 * @param {Scope} scope 
	 * @returns {ArgType}
	 */
	eval(scope) {
		const type_ = this.#typeExpr.eval(scope);

		const type = type_.asType;
		if (!type) {
			throw this.#typeExpr.typeError(`'${type_.toString()}' isn't a type`);
		}

		return new ArgType(this.#name, type, this.optional);
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
}

/**
 * (ArgType1, ...) -> RetType expression
 * @package
 */
export class FuncTypeExpr extends Expr {
	#argTypeExprs;
	#retTypeExprs;

	/**
	 * @param {Site} site
	 * @param {FuncArgTypeExpr[]} argTypeExprs 
	 * @param {Expr[]} retTypeExprs 
	 */
	constructor(site, argTypeExprs, retTypeExprs) {
		super(site);
		this.#argTypeExprs = argTypeExprs;
		this.#retTypeExprs = retTypeExprs;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Type}
	 */
	evalInternal(scope) {
		const argTypes = this.#argTypeExprs.map(a => a.eval(scope));

		const retTypes = this.#retTypeExprs.map(e => {
			const retType = e.eval(scope).asType;

			if (!retType) {
				throw e.typeError("return type isn't a type");
			}

			return retType;
		});

		return new FuncType(argTypes, retTypes);
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
}

/**
 * '... = ... ; ...' expression
 * @package
 */
export class AssignExpr extends Expr {
	#nameTypes;
	#upstreamExpr;
	#downstreamExpr;

	/**
	 * @param {Site} site 
	 * @param {DestructExpr[]} nameTypes 
	 * @param {Expr} upstreamExpr 
	 * @param {Expr} downstreamExpr 
	 */
	constructor(site, nameTypes, upstreamExpr, downstreamExpr) {
		super(site);
		assert(nameTypes.length > 0);
		this.#nameTypes = nameTypes;
		this.#upstreamExpr = assertDefined(upstreamExpr);
		this.#downstreamExpr = assertDefined(downstreamExpr);
	}

	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		const subScope = new Scope(scope);

		let upstreamVal = this.#upstreamExpr.eval(scope);

		if (this.#nameTypes.length > 1) {
			if (!upstreamVal.asMulti) {
				throw this.typeError("rhs ins't a multi-value");
			}

			const vals = upstreamVal.asMulti.values;

			if (this.#nameTypes.length != vals.length) {
				throw this.typeError(`expected ${this.#nameTypes.length} rhs in multi-assign, got ${vals.length}`);
			}

			this.#nameTypes.forEach((nt, i) => {
				nt.evalInAssignExpr(subScope, assertDefined(vals[i].type.asType), i)
			});
		} else if (upstreamVal.asTyped) {
			if (this.#nameTypes[0].hasType()) {
				this.#nameTypes[0].evalInAssignExpr(subScope, assertDefined(upstreamVal.asTyped.type.asType), 0);
			} else if (this.#upstreamExpr.isLiteral()) {
				// enum variant type resulting from a constructor-like associated function must be cast back into its enum type
				if ((this.#upstreamExpr instanceof CallExpr &&
					this.#upstreamExpr.fnExpr instanceof PathExpr) || 
					(this.#upstreamExpr instanceof PathExpr && 
					!this.#upstreamExpr.isLiteral())) 
				{
					const upstreamType = upstreamVal.asTyped.type;

					if (upstreamType.asEnumMemberType) {
						upstreamVal = new DataEntity(upstreamType.asEnumMemberType.parentType);
					}
				}

				subScope.set(this.#nameTypes[0].name, upstreamVal);
			} else {
				throw this.typeError("unable to infer type of assignment rhs");
			}
		} else {
			throw this.#upstreamExpr.typeError("not an instance");
		}

		const downstreamVal = this.#downstreamExpr.eval(subScope);

		subScope.assertAllUsed();

		return downstreamVal;
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

				if (t.asEnumMemberType) {
					upstream = new IR([
						new IR("__helios__common__assert_constr_index("),
						upstream,
						new IR(`, ${t.asEnumMemberType.constrIndex})`)
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
}

/**
 * Helios equivalent of unit
 * @package
 */
export class VoidExpr extends Expr {
	/**
	 * @param {Site} site
	 */
	constructor(site) {
		super(site);
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Instance}
	 */
	evalInternal(scope) {
		return new VoidEntity();
	}

	/**
	 * @param {string} indent
	 * @returns {IR}
	 */
	toIR(indent = "") {
		return new IR("()", this.site);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return "()";
	}
}

/**
 * expr(...); ...
 * @package
 */
export class ChainExpr extends Expr {
	#upstreamExpr;
	#downstreamExpr;

	/**
	 * @param {Site} site 
	 * @param {Expr} upstreamExpr 
	 * @param {Expr} downstreamExpr 
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
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		const upstreamVal = this.#upstreamExpr.eval(scope).asTyped;

		if (!upstreamVal) {
			throw this.#upstreamExpr.typeError("upstream isn't typed");
		}

		if ((new ErrorType()).isBaseOf(upstreamVal.type)) {
			throw this.#downstreamExpr.typeError("unreachable code (upstream always throws error)");
		} else if (!((new VoidType()).isBaseOf(upstreamVal.type))) {
			throw this.#upstreamExpr.typeError("unexpected return value (hint: use '='");
		}

		return this.#downstreamExpr.eval(scope);
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
export class PrimitiveLiteralExpr extends Expr {
	#primitive;

	/**
	 * @param {PrimitiveLiteral} primitive 
	 */
	constructor(primitive) {
		super(primitive.site);
		this.#primitive = primitive;
	}

	/**
	 * @type {DataType}
	 */
	get type() {
		if (this.#primitive instanceof IntLiteral) {
			return IntType;
		} else if (this.#primitive instanceof RealLiteral) {
			return RealType;
		} else if (this.#primitive instanceof BoolLiteral) {
			return BoolType;
		} else if (this.#primitive instanceof StringLiteral) {
			return StringType;
		} else if (this.#primitive instanceof ByteArrayLiteral) {
			return ByteArrayType;
		} else {
			throw new Error("unhandled primitive type");
		}	
	}

	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		return new DataEntity(this.type);
	}

	/**
	 * @returns {boolean}
	 */
	isLiteral() {
		return true;
	}

	/**
	 * @param {string} indent
	 * @returns {IR}
	 */
	toIR(indent = "") {
		// all literals can be reused in their string-form in the IR
		return new IR(this.#primitive.toString(), this.#primitive.site);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.#primitive.toString();
	}
}

/**
 * Literal UplcData which is the result of parameter substitutions.
 * @package
 */
export class LiteralDataExpr extends Expr {
	#type;
	#data;

	/**
	 * @param {Site} site 
	 * @param {DataType} type
	 * @param {UplcData} data
	 */
	constructor(site, type, data) {
		super(site);
		this.#type = type;
		this.#data = data;
	}

	/**
	 * @package
	 * @type {DataType}
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

	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		return new DataEntity(this.#type);
	}

	/**
	 * @type {EvalEntity}
	 */
	get cache() {
		return new DataEntity(this.#type);
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		return new IR(this.toString(), this.site);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `##${bytesToHex(this.#data.toCbor())}`;
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
	 * @param {null | Word} name 
	 * @param {Expr} value 
	 */
	constructor(name, value) {
		this.#name = name;
		this.#value = value;
	}

	/**
	 * @type {Word}
	 */
	get name() {
		if (this.#name === null) {
			throw new Error("name of field not given");
		} else {
			return this.#name;
		}
	}

	get site() {
		if (this.#name === null) {
			return this.#value.site;
		} else {
			return this.#name.site;
		}
	}
	
	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	eval(scope) {
		return this.#value.eval(scope);
	}

	/**
	 * @returns {boolean}
	 */
	isNamed() {
		return this.#name !== null;
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		return this.#value.toIR(indent);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		if (this.#name === null) {
			return this.#value.toString();
		} else {
			return `${this.#name.toString()}: ${this.#value.toString()}`;
		}
	}
}

/**
 * Struct literal constructor
 * @package
 */
export class StructLiteralExpr extends Expr {
	#typeExpr;
	#fields;

	/**
	 * @param {Expr} typeExpr 
	 * @param {StructLiteralField[]} fields 
	 */
	constructor(typeExpr, fields) {
		super(typeExpr.site);
		this.#typeExpr = typeExpr;
		this.#fields = fields;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		const type = this.#typeExpr.eval(scope).asDataType;

		if (!type) {
			throw this.#typeExpr.typeError(`'${this.#typeExpr.toString()}' doesn't evaluate to a data type`);
		}

		if (type.fieldNames.length != this.#fields.length) {
			throw this.typeError(`wrong number of fields for ${type.toString()}, expected ${type.fieldNames.length}, got ${this.#fields.length}`);
		}

		/**
		 * @param {Word} name
		 * @returns {Type}
		 */
		const getMemberType = (name) => {
			const memberVal = type.instanceMembers[name.value];

			if (!memberVal) {
				throw name.typeError(`member '${name.value}' not defined`);
			}

			const memberType = memberVal.asType;

			if (!memberType) {
				throw name.typeError(`member '${name.value}' isn't a type`);
			}

			return memberType;
		};

		for (let i = 0; i < this.#fields.length; i++) {
			const f = this.#fields[i];
		
			const fieldVal = f.eval(scope).asTyped;
			if (!fieldVal) {
				throw f.site.typeError("not typed");
			}

			if (f.isNamed()) {
				if (type.fieldNames.findIndex(n => n == f.name.value) == -1) {
					throw f.name.site.typeError("not a valid field");
				}

				// check the named type
				const memberType = getMemberType(f.name);

				if (!memberType.isBaseOf(fieldVal.type)) {
					throw f.site.typeError(`wrong field type for '${f.name.toString()}', expected ${memberType.toString()}, got ${fieldVal.type.toString()}`);
				}
			} else {
				// check the positional type
				const memberType = getMemberType(new Word(f.site, type.fieldNames[i]));
				
				if (!memberType.isBaseOf(fieldVal.type)) {
					throw f.site.typeError(`wrong field type for field ${i.toString()}, expected ${memberType.toString()}, got ${fieldVal.type.toString()}`);
				}
			}
		}

		return new DataEntity(type);
	}

	/**
	 * @returns {boolean}
	 */
	isLiteral() {
		return true;
	}

	/**
	 * @returns {boolean}
	 */
	isNamed() {
		// the expression builder already checked that all fields are named or all or positional (i.e. not mixed)
		return this.#fields.length > 0 && this.#fields[0].isNamed();
	}

	/**
	 * @param {Site} site
	 * @param {string} path
	 * @param {IR[]} fields
	 */
	static toIRInternal(site, path, fields) {
		return new IR([
			new IR(`${path}____new`),
			new IR("("),
			new IR(fields).join(", "),
			new IR(")")
		], site);
	}

	/**
	 * @param {string} indent
	 * @returns {IR}
	 */
	toIR(indent = "") {
		const type = assertDefined(this.#typeExpr.cache?.asDataType);

		const fields = this.#fields.slice();

		// sort fields by correct name
		if (this.isNamed()) {
			fields.sort((a, b) => type.fieldNames.findIndex(n => n == a.name.value) - type.fieldNames.findIndex(n => n == b.name.value));
		}

		const irFields = fields.map(f => f.toIR(indent));

		return StructLiteralExpr.toIRInternal(this.site, type.path, irFields);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `${this.#typeExpr.toString()}{${this.#fields.map(f => f.toString()).join(", ")}}`;
	}
}

/**
 * []{...} expression
 * @package
 */
export class ListLiteralExpr extends Expr {
	#itemTypeExpr;
	#itemExprs;

	/**
	 * @param {Site} site 
	 * @param {Expr} itemTypeExpr 
	 * @param {Expr[]} itemExprs 
	 */
	constructor(site, itemTypeExpr, itemExprs) {
		super(site);
		this.#itemTypeExpr = itemTypeExpr;
		this.#itemExprs = itemExprs;
	}

	/**
	 * @type {DataType}
	 */
	get itemType() {
		return assertDefined(this.#itemTypeExpr.cache?.asDataType);
	}

	/**
	 * @param {Scope} scope
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		const itemType = this.#itemTypeExpr.eval(scope).asDataType;

		if (!itemType) {
			throw this.#itemTypeExpr.typeError("content of list can't be func");
		}

		for (let itemExpr of this.#itemExprs) {
			let itemVal = itemExpr.eval(scope).asTyped;

			if (!itemVal) {
				throw itemExpr.typeError("not typed");
			}

			if (!itemType.isBaseOf(itemVal.type)) {
				throw itemExpr.typeError(`expected ${itemType.toString()}, got ${itemVal.type.toString()}`);
			}
		}

		return new DataEntity(ListType$(itemType));
	}

	/**
	 * @returns {boolean}
	 */
	isLiteral() {
		return true;
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		let ir = new IR("__core__mkNilData(())");

		// starting from last element, keeping prepending a data version of that item

		for (let i = this.#itemExprs.length - 1; i >= 0; i--) {

			let itemIR = new IR([
				new IR(`${this.itemType.path}____to_data`),
				new IR("("),
				this.#itemExprs[i].toIR(indent),
				new IR(")"),
			]);

			ir = new IR([
				new IR("__core__mkCons"),
				new IR("("),
				itemIR,
				new IR(", "),
				ir,
				new IR(")")
			]);
		}

		return ir;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `[]${this.#itemTypeExpr.toString()}{${this.#itemExprs.map(itemExpr => itemExpr.toString()).join(', ')}}`;
	}
}

/**
 * Map[...]...{... : ...} expression
 * @package
 */
export class MapLiteralExpr extends Expr {
	#keyTypeExpr;
	#valueTypeExpr;
	#pairExprs;

	/**
	 * @param {Site} site 
	 * @param {Expr} keyTypeExpr 
	 * @param {Expr} valueTypeExpr
	 * @param {[Expr, Expr][]} pairExprs 
	 */
	constructor(site, keyTypeExpr, valueTypeExpr, pairExprs) {
		super(site);
		this.#keyTypeExpr = keyTypeExpr;
		this.#valueTypeExpr = valueTypeExpr;
		this.#pairExprs = pairExprs;
	}

	/**
	 * @type {DataType}
	 */
	get keyType() {
		return assertDefined(this.#keyTypeExpr.cache?.asDataType);
	}

	/**
	 * @type {DataType}
	 */
	get valueType() {
		return assertDefined(this.#valueTypeExpr.cache?.asDataType);
	}

	/**
	 * @param {Scope} scope
	 */
	evalInternal(scope) {
		const keyType = this.#keyTypeExpr.eval(scope).asDataType;
		if (!keyType) {
			throw this.#keyTypeExpr.typeError("key-type of Map can't be func");
		}

		const valueType = this.#valueTypeExpr.eval(scope).asDataType;
		if (!valueType) {
			throw this.#valueTypeExpr.typeError("value-type of Map can't be func");
		}

		for (let [keyExpr, valueExpr] of this.#pairExprs) {
			const keyVal = keyExpr.eval(scope).asTyped;
			if (!keyVal) {
				throw keyExpr.typeError("not typed");
			}

			const valueVal = valueExpr.eval(scope).asTyped;
			if (!valueVal) {
				throw valueExpr.typeError("not typed");
			}

			if (!keyType.isBaseOf(keyVal.type)) {
				throw keyExpr.typeError(`expected ${keyType.toString()} for map key, got ${keyVal.toString()}`);
			}
			
			if (!valueType.isBaseOf(valueVal.type)) {
				throw valueExpr.typeError(`expected ${valueType.toString()} for map value, got ${valueVal.toString()}`);
			}
		}

		return new DataEntity(MapType$(keyType, valueType));
	}

	/**
	 * @returns {boolean}
	 */
	isLiteral() {
		return true;
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		let ir = new IR("__core__mkNilPairData(())");

		// starting from last element, keeping prepending a data version of that item

		for (let i = this.#pairExprs.length - 1; i >= 0; i--) {
			let [keyExpr, valueExpr] = this.#pairExprs[i];

			let keyIR = new IR([
				new IR(`${this.keyType.path}____to_data`),
				new IR("("),
				keyExpr.toIR(indent),
				new IR(")"),
			]);

			let valueIR = new IR([
				new IR(`${this.valueType.path}____to_data`),
				new IR("("),
				valueExpr.toIR(indent),
				new IR(")"),
			]);

			ir = new IR([
				new IR("__core__mkCons("),
				new IR("__core__mkPairData("),
				keyIR,
				new IR(","),
				valueIR,
				new IR(")"),
				new IR(", "),
				ir,
				new IR(")")
			], this.site);
		}

		return ir;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `Map[${this.#keyTypeExpr.toString()}]${this.#valueTypeExpr.toString()}{${this.#pairExprs.map(([keyExpr, valueExpr]) => `${keyExpr.toString()}: ${valueExpr.toString()}`).join(', ')}}`;
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
	 * @param {null | Expr} typeExpr 
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

	/**
	 * Throws an error if called before evalType()
	 * @type {Type}
	 */
	get type() {
		if (this.isIgnored()) {
			return new AllType();
		} else if (this.#typeExpr === null) {
			throw new Error("typeExpr not set");
		} else {
			return assertDefined(this.#typeExpr.cache?.asType);
		}
	}

	/**
	 * @type {null | Expr}
	 */
	get typeExpr() {
		return this.#typeExpr
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

	/**
	 * @returns {boolean}
	 */
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
	 * Evaluates the type, used by FuncLiteralExpr and DataDefinition
	 * @param {Scope} scope 
	 * @returns {Type}
	 */
	evalType(scope) {
		if (this.isIgnored()) {
			return new AllType();
		} else if (this.#typeExpr === null) {
			throw new Error("typeExpr not set");
		} else {
			const t = this.#typeExpr.eval(scope);

			if (!t.asType) {
				throw this.#typeExpr.typeError(`'${t.toString()} isn't a valid type`);
			} else {
				return t.asType;
			}
		}
	}

	/**
	 * @returns {IR}
	 */
	toIR() {
		return new IR(this.#name.toString(), this.#name.site);
	}

	/**
	 * 
	 * @returns {string}
	 */
	toString() {
		if (this.#typeExpr === null) {
			return this.name.toString();
		} else {
			return `${this.name.toString()}: ${this.#typeExpr.toString()}`;
		}
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
	 * @param {null | Expr} typeExpr
	 * @param {null | Expr} defaultValueExpr
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
			const v = this.#defaultValueExpr.eval(scope).asTyped;
			if (!v) {
				throw this.#defaultValueExpr.typeError("not typed");
			}

			const t = this.evalType(scope);

			if (!t.isBaseOf(v.type)) {
				throw this.#defaultValueExpr.site.typeError(`expected ${t.toString()}, got ${v.type.toString()}`);
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
 * (..) -> RetTypeExpr {...} expression
 * @package
 */
export class FuncLiteralExpr extends Expr {
	#args;
	#retTypeExprs;
	#bodyExpr;

	/**
	 * @param {Site} site
	 * @param {FuncArg[]} args 
	 * @param {(null | Expr)[]} retTypeExprs 
	 * @param {Expr} bodyExpr 
	 */
	constructor(site, args, retTypeExprs, bodyExpr) {
		super(site);
		this.#args = args;
		this.#retTypeExprs = retTypeExprs;
		this.#bodyExpr = bodyExpr;
	}

	/**
	 * @type {number}
	 */
	get nArgs() {
		return this.#args.length;
	}

	/**
	 * @type {string[]}
	 */
	get argNames() {
		return this.#args.map(a => a.name.value);
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
				return new AllType();
			} else {
				return assertDefined(e.cache?.asType);
			}
		});
	}
	
	/**
	 * @returns {boolean}
	 */
	isLiteral() {
		return true;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {FuncType}
	 */
	evalType(scope) {
		let args = this.#args;
		if (this.isMethod()) {
			args = args.slice(1);
		}

		const argTypes = args.map(a => a.evalArgType(scope));

		const retTypes = this.#retTypeExprs.map(e => {
			if (e == null) {
				return new AllType();
			} else {
				return e.evalAsType(scope);
			}
		});

		return new FuncType(argTypes, retTypes);
	}

	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		const fnType = this.evalType(scope);
		
		// argTypes is calculated separately again here so it includes self
		const argTypes = this.#args.map(a => a.evalType(scope));

		const subScope = new Scope(scope);

		argTypes.forEach((a, i) => {
			if (!this.#args[i].isIgnored()) {
				this.#args[i].evalDefault(subScope);

				subScope.set(this.#args[i].name, a.toTyped());
			}
		});

		let bodyVal = this.#bodyExpr.eval(subScope);

		if (this.#retTypeExprs.length === 1) {
			if (this.#retTypeExprs[0] == null) {
				if (bodyVal.asMulti) {
					return new FuncEntity(new FuncType(fnType.argTypes, bodyVal.asMulti.values.map(v => v.type)));
				} else if (bodyVal.asTyped) {
					return new FuncEntity(new FuncType(fnType.argTypes, bodyVal.asTyped.type));
				} else {
					throw this.#bodyExpr.typeError("expect multi or typed");
				}
			} else if (bodyVal.asMulti) {
				throw this.#retTypeExprs[0].typeError("unexpected multi-value body");
			} else if (bodyVal.asTyped) {
				if (!fnType.retTypes[0].isBaseOf(bodyVal.asTyped.type)) {
					throw this.#retTypeExprs[0].typeError(`wrong return type, expected ${fnType.retTypes[0].toString()} but got ${bodyVal.asTyped.type.toString()}`);
				}
			} else {
				throw this.#bodyExpr.typeError("expect multi or typed");
			}
		} else {
			if (bodyVal.asMulti) {
				/** 
				 * @type {Typed[]} 
				 */
				let bodyVals = bodyVal.asMulti.values;

				if (bodyVals.length !== this.#retTypeExprs.length) {
					throw this.#bodyExpr.typeError(`expected multi-value function body with ${this.#retTypeExprs.length} values, but got ${bodyVals.length} values`);
				} else {
					for (let i = 0; i < bodyVals.length; i++) {
						let v = bodyVals[i];

						let retTypeExpr = assertDefined(this.#retTypeExprs[i]);
						if (!fnType.retTypes[i].isBaseOf(v.type)) {
							throw retTypeExpr.typeError(`wrong return type for value ${i}, expected ${fnType.retTypes[i].toString()} but got ${v.type.toString()}`);
						}
					}
				}
			} else {
				throw this.#bodyExpr.typeError(`expected multi-value function body, but got ${this.#bodyExpr.toString()}`);
			}
		}

		subScope.assertAllUsed();

		return new FuncEntity(fnType);
	}

	isMethod() {
		return this.#args.length > 0 && this.#args[0].name.toString() == "self";
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
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIRInternal(indent = "") {
		let argsWithCommas = this.argsToIR();

		let innerIndent = indent;
		let methodIndent = indent;
		if (this.isMethod()) {
			innerIndent += TAB;
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

		return ir;
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		return this.toIRInternal(indent);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		if (this.#retTypeExprs.length === 1) {
			let retTypeExpr = this.#retTypeExprs[0];
			if (retTypeExpr == null) {
				return `(${this.#args.map(a => a.toString()).join(", ")}) -> {${this.#bodyExpr.toString()}}`;
			} else {
				return `(${this.#args.map(a => a.toString()).join(", ")}) -> ${retTypeExpr.toString()} {${this.#bodyExpr.toString()}}`;
			}
		} else {
			return `(${this.#args.map(a => a.toString()).join(", ")}) -> (${this.#retTypeExprs.map(e => assertDefined(e).toString()).join(", ")}) {${this.#bodyExpr.toString()}}`;
		}
	}
}

/**
 * value[...] expression
 * @package
 */
export class ParametricExpr extends Expr {
	#baseExpr;
	#parameters;

	/**
	 * @param {Site} site - site of brackets
	 * @param {Expr} baseExpr
	 * @param {Expr[]} parameters
	 */
	constructor(site, baseExpr, parameters) {
		super(site);
		this.#baseExpr = baseExpr;
		this.#parameters = parameters;
	}

	/**
	 * @type {Type[]}
	 */
	get paramTypes() {
		return this.#parameters.map(p => {
			const pt = p.cache?.asType;

			if (!pt) {
				throw new Error("not a type");
			}

			return pt;
		})
	}

	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		const paramTypes = this.#parameters.map(p => p.evalAsType(scope));

		const baseVal = this.#baseExpr.eval(scope);

		if (!baseVal.asParametric) {
			throw this.site.typeError(`'${baseVal.toString()}' isn't a parametric instance`);
		} else {
			return baseVal.asParametric.apply(paramTypes, this.site);
		}
	}

	/**
	 * Reused by CallExpr
	 * @param {Type[]} paramTypes
	 * @returns {string}
	 */
	static toApplicationIR(paramTypes) {
		return `[${paramTypes.map(pt => {
			if (pt instanceof FuncType) {
				return "__fn";
			} else {
				return assertDefined(pt.asNamed).path;
			}
		}).join("@")}]`;
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		const params = ParametricExpr.toApplicationIR(this.paramTypes);
		
		if (this.#baseExpr instanceof MemberExpr) {
			return this.#baseExpr.toIR(indent, params);
		} else {
			return new IR(`${this.#baseExpr.toIR().toString()}${params}`, this.site);
		}
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `${this.#baseExpr.toString()}[${this.#parameters.map(p => p.toString()).join(", ")}]`;
	}
}

/**
 * Unary operator expression
 * Note: there are no post-unary operators, only pre
 * @package
 */
export class UnaryExpr extends Expr {
	#op;
	#a;

	/**
	 * @param {SymbolToken} op 
	 * @param {Expr} a 
	 */
	constructor(op, a) {
		super(op.site);
		this.#op = op;
		this.#a = a;
	}

	/**
	 * Turns an op symbol into an internal name
	 * @returns {Word}
	 */
	translateOp() {
		const op = this.#op.toString();
		const site = this.#op.site;

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
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		const a = this.#a.eval(scope).asInstance;
		if (!a) {
			throw this.#a.site.typeError("not an instance");
		}

		const op = this.translateOp().value;

		const fnVal = a.type.typeMembers[op]?.asType?.toTyped()?.asFunc;

		if (fnVal) {
			// immediately applied
			return fnVal.asFunc.call(this.#op.site, [a]);
		} else {
			throw this.#a.site.typeError(`'${this.#op.toString()} ${a.type.toString()}' undefined`);
		}
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		const path = assertDefined(this.cache?.asTyped?.type?.asNamed).path;

		return new IR([
			new IR(`${path}__${this.translateOp().value}`, this.site), new IR("("),
			this.#a.toIR(indent),
			new IR(")")
		]);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `${this.#op.toString()}${this.#a.toString()}`;
	}
}

/**
 * Binary operator expression
 * @package
 */
export class BinaryExpr extends Expr {
	#op;
	#a;
	#b;
	#swap; // swap a and b for commutative ops
	#alt; // use alt (each operator can have one overload)

	/**
	 * @param {SymbolToken} op 
	 * @param {Expr} a 
	 * @param {Expr} b 
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
	 * @type {Expr}
	 */
	get first() {
		return this.#swap ? this.#b : this.#a;
	}

	/**
	 * @type {Expr} 
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
		const op = this.#op.toString();
		const site = this.#op.site;
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
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		const a = this.#a.eval(scope).asInstance;
		if (!a) {
			throw this.#a.typeError("not an instance");
		} 

		const b = this.#b.eval(scope).asInstance;
		if (!b) {
			throw this.#b.typeError("not an instance");
		}

		for (let swap of (this.isCommutative() ? [false, true] : [false])) {
			for (let alt of [0, 1, 2]) {
				let first  = swap ? b : a;
				let second = swap ? a : b;

				try {
					const fnVal_ = first.type.typeMembers[this.translateOp(alt).value];

					let fnVal = fnVal_?.asType?.toTyped()?.asFunc;
					if (!fnVal) {
						continue;
					}

					let res = fnVal.call(this.#op.site, [first, second]);

					this.#swap = swap;
					this.#alt  = alt;

					return res;
				} catch (e) {
					if (e instanceof UserError) {
						continue;
					} else {
						throw e;
					}
				}
			}
		}

		throw this.typeError(`'${a.type.toString()} ${this.#op.toString()} ${b.type.toString()}' undefined`);
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		let path = assertDefined(this.first.cache?.asTyped?.type.asNamed).path;

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
export class ParensExpr extends Expr {
	#exprs;

	/**
	 * @param {Site} site 
	 * @param {Expr[]} exprs
	 */
	constructor(site, exprs) {
		super(site);
		this.#exprs = exprs;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		if (this.#exprs.length === 1) {
			return this.#exprs[0].eval(scope);
		} else {
			return new MultiEntity(this.#exprs.map(e => {
				const v = e.eval(scope).asTyped;

				if (!v) {
					throw e.site.typeError("not typed");
				} 
				
				if ((new ErrorType()).isBaseOf(v.type)) {
					throw e.site.typeError("unexpected error call in multi-valued expression");
				}

				return v;
			}));
		}
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

	/**
	 * @returns {string}
	 */
	toString() {
		return `(${this.#exprs.map(e => e.toString()).join(", ")})`;
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
	 * @param {Expr} valueExpr 
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
	 * @type {Expr}
	 */
	get valueExpr() {
		return this.#valueExpr;
	}

	/**
	 * @type {EvalEntity}
	 */
	get value() {
		return assertDefined(this.#valueExpr.cache);
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
	 * @returns {EvalEntity}
	 */
	eval(scope) {
		return this.#valueExpr.eval(scope);
	}
}

/**
 * ...(...) expression
 * @package
 */
export class CallExpr extends Expr {
	#fnExpr;
	#argExprs;

	/**
	 * @type {Type[]}
	 */
	#paramTypes;

	/**
	 * @type {null | Func}
	 */
	#appliedFnVal;

	/**
	 * @param {Site} site 
	 * @param {Expr} fnExpr 
	 * @param {CallArgExpr[]} argExprs 
	 */
	constructor(site, fnExpr, argExprs) {
		super(site);
		this.#fnExpr = fnExpr;
		this.#argExprs = argExprs;
		this.#paramTypes = [];
		this.#appliedFnVal = null; // only for infered parametric funcions
	}

	get fnExpr() {
		return this.#fnExpr;
	}

	toString() {
		return `${this.#fnExpr.toString()}(${this.#argExprs.map(a => a.toString()).join(", ")})`;
	}

	/**
	 * @returns {boolean}
	 */
	isLiteral() {
		if (this.#fnExpr instanceof PathExpr && this.cache?.asTyped && this.#fnExpr.baseExpr.cache?.asType?.isBaseOf(this.cache.asTyped.type)) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		const fnVal = this.#fnExpr.eval(scope);

		const argVals = this.#argExprs.map(ae => {
			const av_ = ae.eval(scope);
			
			const av = av_.asTyped ?? av_.asMulti;

			if (!av) {
				throw ae.typeError("not an instance");
			}

			return av;
		});

		/**
		 * @type {(Typed | Multi)[]}
		 */
		const posArgVals_ = [];

		this.#argExprs.forEach((argExpr, i) => {
			if (!argExpr.isNamed()) {
				posArgVals_.push(argVals[i]);
			}
		});

		/**
		 * @type {Typed[]}
		 */
		const posArgVals = MultiEntity.flatten(posArgVals_);

		/**
		 * @type {{[name: string]: Typed}}
		 */
		const namedArgVals = {};

		this.#argExprs.forEach((argExpr, i) => {
			if (argExpr.isNamed()) {
				const val = argVals[i];

				// can't be multi instance
				if (val.asMulti) {
					throw argExpr.typeError("can't use multiple return values as named argument");
				} else if (val.asTyped) {
					namedArgVals[argExpr.name] = val.asTyped;
				} else {
					throw new Error("unexpected");
				}
			}
		});

		assert(posArgVals.every(pav => pav != undefined));

		if (fnVal.asParametric) {
			this.#paramTypes = [];

			this.#appliedFnVal = fnVal.asParametric.inferCall(this.site, posArgVals, namedArgVals, this.#paramTypes);

			return this.#appliedFnVal.call(this.site, posArgVals, namedArgVals);
		} else if (fnVal.asFunc) {
			return fnVal.asFunc.call(this.site, posArgVals, namedArgVals);
		} else {
			throw this.#fnExpr.typeError(`expected function, got ${fnVal.toString()}`);
		}
	}

	/**
	 * Don't call this inside eval() because param types won't yet be complete.
	 * @type {FuncType}
	 */
	get fn() {
		if (this.#fnExpr.cache?.asParametric) {
			return assertClass(this.#appliedFnVal?.type?.asType, FuncType);
		} else {
			return assertClass(this.#fnExpr.cache?.asTyped?.type.asType, FuncType);
		}
	}

	/**
	 * @returns {[Expr[], IR[]]} - first list are positional args, second list named args and remaining opt args
	 */
	expandArgs() {
		const fn = this.fn;
		const nNonOptArgs = fn.nNonOptArgs;

		/**
		 * @type {Expr[]}
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
	toFnExprIR(indent = "") {
		if (this.#fnExpr.cache?.asParametric instanceof ParametricFunc) {
			assert(this.#paramTypes.length > 0);

			const params = ParametricExpr.toApplicationIR(this.#paramTypes);

			if (this.#fnExpr instanceof MemberExpr) {
				return this.#fnExpr.toIR(indent, params);
			} else {
				return new IR(`${this.#fnExpr.toIR(indent).toString()}${params}`, this.#fnExpr.site);
			}
		} else {
			return this.#fnExpr.toIR(indent);
		}
	}

	/**
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		let fnIR = this.toFnExprIR(indent);

		/**
		 * We need the func type for things like multivalued args and optional args 
		 * @type {FuncType} 
		 */
		const fn = this.fn;

		/**
		 * First step is to eliminate the named args
		 * @type {[Expr[], IR[]]}
		 */
		const [positional, namedOptional] = this.expandArgs();

		if (positional.some(e => (!e.isLiteral()) && (e.cache?.asMulti))) {
			// count the number of final args
			let n = 0;

			positional.forEach((e, i) => {
				if ((!e.isLiteral()) && (e.cache?.asMulti)) {
					n += e.cache.asMulti.values.length;
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

				if ((!e.isLiteral()) && (e.cache?.asMulti)) {
					const nMulti = e.cache.asMulti.values.length;
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
export class MemberExpr extends Expr {
	#objExpr;
	#memberName;

	/**
	 * @param {Site} site 
	 * @param {Expr} objExpr 
	 * @param {Word} memberName 
	 */
	constructor(site, objExpr, memberName) {
		super(site);
		this.#objExpr = objExpr;
		this.#memberName = memberName;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		const objVal = this.#objExpr.eval(scope).asInstance;
		if (!objVal) {
			throw this.#objExpr.site.typeError("not an instance");
		}

		let member = objVal.instanceMembers[this.#memberName.value];
		if (!member) {

			if (objVal?.type?.asEnumMemberType) {
				member = objVal.type.asEnumMemberType.parentType.instanceMembers[this.#memberName.value];
			}

			if (!member) {
				throw this.#memberName.referenceError(`'${objVal.type.toString()}.${this.#memberName.value}' undefined`);
			}
		}

		if (member.asParametric) {
			return member;
		} else if (member.asType) {
			const memberVal = member.asType.toTyped();

			return memberVal;
		} else {
			throw new Error("expected type or parametric");
		}
	}

	/**
	 * @param {string} indent 
	 * @param {string} params - applied type parameters must be inserted Before the call to self
	 * @returns {IR}
	 */
	toIR(indent = "", params = "") {
		// members can be functions so, field getters are also encoded as functions for consistency

		const objType = assertDefined(this.#objExpr.cache?.asTyped?.type?.asNamed); 

		let objPath = objType.path;

		// if we are getting the member of an enum member we should check if it a field or method, because for a method we have to use the parent type
		if (objType.asEnumMemberType && (objType.asEnumMemberType.instanceMembers[this.#memberName.value] === undefined)) {
			objPath = objType.asEnumMemberType.parentType.path;
		}

		let ir = new IR(`${objPath}__${this.#memberName.toString()}${params}`, this.site);

		return new IR([
			ir, new IR("("),
			this.#objExpr.toIR(indent),
			new IR(")"),
		]);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `${this.#objExpr.toString()}.${this.#memberName.toString()}`;
	}
}

/**
 * if-then-else expression 
 * @package
 */
export class IfElseExpr extends Expr {
	#conditions;
	#branches;

	/**
	 * @param {Site} site 
	 * @param {Expr[]} conditions 
	 * @param {Expr[]} branches 
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
	 * @param {null | Type} prevType
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
				if (newType.asEnumMemberType) {
					const parentType = newType.asEnumMemberType.parentType;

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
	 * @param {null | Type[]} prevTypes
	 * @param {Typed | Multi} newValue
	 * @returns {null | Type[]}
	 */
	static reduceBranchMultiType(site, prevTypes, newValue) {
		if (!newValue.asMulti && newValue.asTyped && (new ErrorType()).isBaseOf(newValue.asTyped.type)) {
			return prevTypes;
		}

		const newTypes = (newValue.asMulti) ?
			newValue.asMulti.values.map(v => v.type) :
			[assertDefined(newValue.asTyped).type];

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
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		for (let c of this.#conditions) {
			let cVal = c.eval(scope).asTyped;

			if (!cVal || !BoolType.isBaseOf(cVal.type)) {
				throw c.typeError("expected bool");
			}
		}

		/**
		 * Supports multiple return values
		 * @type {null | Type[]}
		 */
		let branchMultiType = null;

		for (let b of this.#branches) {
			const branchVal = b.evalAsTypedOrMulti(scope);

			branchMultiType = IfElseExpr.reduceBranchMultiType(
				b.site, 
				branchMultiType, 
				branchVal
			);
		}

		if (branchMultiType === null) {
			// i.e. every branch throws an error
			return new ErrorEntity();
		} else  {
			return Common.toTyped(branchMultiType);
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
	/**
	 * @type {Word}
	 */
	#name;

	/**
	 * @type {null | Expr}
	 */
	#typeExpr;

	/**
	 * @type {DestructExpr[]}
	 */
	#destructExprs;

	/**
	 * @param {Word} name - use an underscore as a sink
	 * @param {null | Expr} typeExpr 
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
				return new AllType();
			} else {
				throw new Error("typeExpr not set");
			}
		} else {
			if (!this.#typeExpr.cache?.asType) {
				throw this.#typeExpr.typeError(`invalid type '${assertDefined(this.#typeExpr.cache, "cache unset").toString()}'`);
			} else {
				return this.#typeExpr.cache.asType;
			}
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

	/**
	 * @returns {string}
	 */
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
				return new AllType();
			} else {
				throw new Error("typeExpr not set");
			}
		} else {
			return this.#typeExpr.evalAsType(scope);
		}
	}

	/**
	 * @param {Scope} scope 
	 * @param {Type} upstreamType 
	 */
	evalDestructExprs(scope, upstreamType) {
		if (this.#destructExprs.length > 0) {
			if (!upstreamType.asDataType) {
				throw this.site.typeError("can't destruct a function");
			}

			const upstreamFieldNames = upstreamType.asDataType.fieldNames;

			if (upstreamFieldNames.length != this.#destructExprs.length) {
				throw this.site.typeError(`wrong number of destruct fields, expected ${upstreamFieldNames.length}, got ${this.#destructExprs.length}`);
			}

			for (let i = 0; i < this.#destructExprs.length; i++) {

				this.#destructExprs[i].evalInternal(
					scope, 
					assertDefined(upstreamType.instanceMembers[upstreamFieldNames[i]].asDataType), 
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
			const t = this.evalType(scope).asDataType;
			if (!t) {
				throw this.site.typeError("not a data type");
			}

			// differs from upstreamType because can be enum parent
			let checkType = t;

			// if t is enum variant, get parent instead (exact variant is checked at runtime instead)
			if (t.asEnumMemberType && !upstreamType.asEnumMemberType) {
				checkType = t.asEnumMemberType.parentType;
			}

			if (!checkType.isBaseOf(upstreamType)) {
				throw this.site.typeError(`expected ${checkType.toString()} for destructure field ${i+1}, got ${upstreamType.toString()}`);
			}

			if (!this.isIgnored()) {
				// TODO: take into account ghost type parameters
				scope.set(this.name, t.toTyped());
			}

			this.evalDestructExprs(scope, t);
		} else {
			if (!this.isIgnored()) {
				// TODO: take into account ghost type parameters
				scope.set(this.name, upstreamType.toTyped());
			}

			this.evalDestructExprs(scope, upstreamType);
		}
	}

	/**
	 * @param {Scope} scope
	 * @param {DataType} caseType
	 */
	evalInSwitchCase(scope, caseType) {
		if (!this.isIgnored()) {
			scope.set(this.#name, caseType.toTyped());
		}

		if (this.#typeExpr) {
			this.#typeExpr.cache = caseType;
		}

		this.evalDestructExprs(scope, caseType);
	}

	/**
	 * @param {Scope} scope 
	 * @param {Type} upstreamType
	 * @param {number} i
	 */
	evalInAssignExpr(scope, upstreamType, i) {
		/**
		 * @param {null | Type} t 
		 */
		const checkType = (t) => {
			if (!t) {
				throw this.site.typeError("not a type");
			}

			// differs from upstreamType because can be enum parent
			let checkType = t;

			// if t is enum variant, get parent instead (exact variant is checked at runtime instead)
			if (t.asEnumMemberType && !upstreamType.asEnumMemberType) {
				checkType = t.asEnumMemberType.parentType;
			}

			if (!checkType.isBaseOf(upstreamType)) {
				throw this.site.typeError(`expected ${checkType.toString()} for rhs ${i+1}, got ${upstreamType.toString()}`);
			}

			if (!this.isIgnored()) {
				// TODO: take into account ghost type parameters
				scope.set(this.name, t.toTyped());
			}

			this.evalDestructExprs(scope, t);
		}

		const t = this.evalType(scope);

		if (t.asType) {
			checkType(t.asType);
		} else if (t.asMulti) {
			if (i >= t.asMulti.values.length) {
				throw this.site.typeError(`expected multi instace with only ${t.asMulti.values.length} items`);
			}

			checkType(t.asMulti.values[i].type.asDataType);
		} else {
			throw new Error("unexpected");
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
	 * @returns {string}
	 */
	getFieldFn(fieldIndex) {
		const type = this.type;

		if (type.asDataType) {
			return `${type.asDataType.path}__${type.asDataType.fieldNames[fieldIndex]}`;
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
			if (this.#typeExpr && this.type.asEnumMemberType) {
				const constrIdx = this.type.asEnumMemberType.constrIndex;

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
	 * @returns {IR}
	 */
	wrapDestructIR(indent, inner, argIndex) {
		if (this.#destructExprs.length == 0) {
			return inner;
		} else {
			const baseName = this.isIgnored() ? `__lhs_${argIndex}` : this.#name.toString();

			for (let i = this.#destructExprs.length - 1; i >= 0; i--) {
				const de = this.#destructExprs[i];

				inner = de.wrapDestructIRInternal(indent + TAB, inner, baseName, i, this.getFieldFn(i));
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
	 * @param {Expr} bodyExpr 
	 */
	constructor(site, lhs, bodyExpr) {
		super(site);
		this.#lhs = lhs;
		this.#bodyExpr = bodyExpr;
		this.#constrIndex = null;
	}

	/**
	 * @type {Expr}
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

	/**
	 * @type {number}
	 */
	get constrIndex() {
		if (this.#constrIndex === null) {
			throw new Error("constrIndex not yet set");
		} else {
			return this.#constrIndex;
		}
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `${this.#lhs.toString()} => ${this.#bodyExpr.toString()}`;
	}

	/**
	 * Evaluates the switch type and body value of a case.
	 * @param {Scope} scope 
	 * @param {DataType} enumType
	 * @returns {Multi | Typed}
	 */
	evalEnumMember(scope, enumType) {
		const caseType = enumType.typeMembers[this.memberName.value]?.asEnumMemberType;
		if (!caseType) {
			throw this.memberName.typeError(`${this.memberName.value} isn't a valid enum member of ${enumType.toString()}`);
		}

		this.#constrIndex = caseType.constrIndex;

		assert(this.#constrIndex >= 0);

		const caseScope = new Scope(scope);

		this.#lhs.evalInSwitchCase(caseScope, caseType);

		const bodyVal_ = this.#bodyExpr.eval(caseScope);

		const bodyVal = bodyVal_.asTyped ?? bodyVal_?.asMulti;

		if (!bodyVal) {
			throw this.#bodyExpr.typeError("not typed");
		}

		caseScope.assertAllUsed();

		return bodyVal;
	}

	/**
	 * Evaluates the switch type and body value of a case.
	 * @param {Scope} scope
	 * @returns {Typed | Multi}
	 */
	evalDataMember(scope) {
		/** @type {DataType} */
		let memberType;

		switch (this.memberName.value) {
			case "Int":
				memberType = IntType;
				break;
			case "ByteArray":
				memberType = ByteArrayType;
				break;
			case "[]Data":
				memberType = ListType$(RawDataType);
				break;
			case "Map[Data]Data":
				memberType = MapType$(RawDataType, RawDataType);
				break;
			default:
				let maybeMemberType = scope.get(this.memberName).asDataType;
				if (!maybeMemberType) {
					throw this.memberName.typeError("expected a data type");
				}
				memberType = maybeMemberType;

				if (!Common.isEnum(memberType)) {
					throw this.memberName.typeError("expected an enum type");
				}
		}

		const caseScope = new Scope(scope);

		this.#lhs.evalInSwitchCase(caseScope, memberType);

		const bodyVal_ = this.#bodyExpr.eval(caseScope);

		caseScope.assertAllUsed();

		const bodyVal = bodyVal_.asTyped ?? bodyVal_.asMulti;

		if (!bodyVal) {
			throw this.#bodyExpr.typeError("not typed");
		}

		return bodyVal;
	}

	/**
	 * Accept an arg because will be called with the result of the controlexpr
	 * @param {string} indent 
	 * @returns {IR}
	 */
	toIR(indent = "") {
		let inner = this.#bodyExpr.toIR(indent + TAB);

		inner = this.#lhs.wrapDestructIR(indent, inner, 0);

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
	 * @param {Expr} bodyExpr 
	 */
	constructor(site, intVarName, lstVarName, bodyExpr) {
		super(site, new DestructExpr(new Word(site, "_"), new RefExpr(new Word(site, "(Int, []Data)"))), bodyExpr);

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
	 * @returns {Typed | Multi}
	 */
	evalDataMember(scope) {
		/**
		 * @type {null | Typed | Multi}
		 */
		let bodyVal = null;

		if (this.#intVarName !== null || this.#lstVarName !== null) {
			let caseScope = new Scope(scope);

			if (this.#intVarName !== null) {
				caseScope.set(this.#intVarName, new DataEntity(IntType));
			}

			if (this.#lstVarName !== null) {
				caseScope.set(this.#lstVarName, new DataEntity(ListType$(RawDataType)));
			}

			const bodyVal_ = this.body.eval(caseScope);

			bodyVal = bodyVal_.asTyped ?? bodyVal_.asMulti;

			caseScope.assertAllUsed();
		} else {
			const bodyVal_ = this.body.eval(scope);

			bodyVal = bodyVal_.asTyped ?? bodyVal_.asMulti;
		}

		if (!bodyVal) {
			throw this.body.typeError("not typed");
		}

		return bodyVal;
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
			new IR(`\n${indent}${TAB}${TAB}}(__core__fstPair(pair), __core__sndPair(pair))`),
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
	 * @param {Expr} bodyExpr
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
	 * @returns {Typed | Multi}
	 */
	eval(scope) {
		const bodyVal_ = this.#bodyExpr.eval(scope);

		const bodyVal = bodyVal_.asTyped ?? bodyVal_.asMulti;

		if (!bodyVal) {
			throw this.#bodyExpr.typeError("not typed");
		}

		return bodyVal;
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
class SwitchExpr extends Expr {
	#controlExpr;
	#cases;
	#defaultCase;

	/** 
	 * @param {Site} site
	 * @param {Expr} controlExpr - input value of the switch
	 * @param {SwitchCase[]} cases
	 * @param {null | SwitchDefault} defaultCase
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
}

/**
 * Switch expression for Enum, with SwitchCases and SwitchDefault as children
 * @package
 */
export class EnumSwitchExpr extends SwitchExpr {
	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		let controlVal = this.controlExpr.eval(scope).asTyped;

		if (!controlVal) {
			throw this.controlExpr.typeError("not typed");
		}

		let enumType = controlVal.type.asDataType;

		if (!enumType) {
			throw this.controlExpr.typeError("not an enum");
		}

		let nEnumMembers = Common.countEnumMembers(enumType);

		// check that we have enough cases to cover the enum members
		if (this.defaultCase === null && nEnumMembers > this.cases.length) {
			// mutate defaultCase to VoidExpr
			this.setDefaultCaseToVoid();
		}

		/** @type {null | Type[]} */
		let branchMultiType = null;

		for (let c of this.cases) {
			const branchVal = c.evalEnumMember(scope, enumType);
	
			branchMultiType = IfElseExpr.reduceBranchMultiType(
				c.site, 
				branchMultiType, 
				branchVal
			);
		}

		if (this.defaultCase !== null) {
			const defaultVal = this.defaultCase.eval(scope);

			branchMultiType = IfElseExpr.reduceBranchMultiType(
				this.defaultCase.site,
				branchMultiType, 
				defaultVal
			);
		}

		if (branchMultiType === null) {
			return new ErrorEntity();
		} else {
			return Common.toTyped(branchMultiType);
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
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		let controlVal = this.controlExpr.eval(scope).asTyped;
		if (!controlVal) {
			throw this.controlExpr.typeError("not typed");
		}

		let dataType = controlVal.type.asDataType;
		if (!dataType) {
			throw this.controlExpr.typeError("not a data type");
		}

		if (!RawDataType.isBaseOf(dataType)) {
			throw this.controlExpr.typeError(`expected Data type, got ${controlVal.type.toString()}`);
		}

		// check that we have enough cases to cover the enum members
		if (this.defaultCase === null && this.cases.length < 5) {
			// mutate defaultCase to VoidExpr
			this.setDefaultCaseToVoid();
		}

		/** @type {?Type[]} */
		let branchMultiType = null;

		for (let c of this.cases) {
			const branchVal = c.evalDataMember(scope);

			branchMultiType = IfElseExpr.reduceBranchMultiType(
				c.site, 
				branchMultiType, 
				branchVal
			);
		}

		if (this.defaultCase !== null) {
			const defaultVal = this.defaultCase.eval(scope);

			branchMultiType = IfElseExpr.reduceBranchMultiType(
				this.defaultCase.site, 
				branchMultiType, 
				defaultVal
			);
		}

		if (branchMultiType === null) {
			// only possible if each branch is an error
			return new ErrorEntity();
		} else {
			return Common.toTyped(branchMultiType);
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
					cases[4] = new IR([
						new IR("("), new IR("e"), new IR(") -> {"), 
						ir,
						new IR("("),
						new IR("__helios__bytearray__from_data"),
						new IR("("), new IR("e"), new IR(")"),
						new IR(")"),
						new IR("}")
					]);
					break;
				case "Int":
					cases[3] = new IR([
						new IR("("), new IR("e"), new IR(") -> {"), 
						ir,
						new IR("("),
						new IR("__helios__int__from_data"),
						new IR("("), new IR("e"), new IR(")"),
						new IR(")"),
						new IR("}")
					]);
					break;
				case "[]Data":
					cases[2] = new IR([
						new IR("("), new IR("e"), new IR(") -> {"), 
						ir,
						new IR("("),
						new IR("__code__unListData"),
						new IR("("), new IR("e"), new IR(")"),
						new IR(")"),
						new IR("}")
					]);
					break;
				case "Map[Data]Data":
					cases[1] = new IR([
						new IR("("), new IR("e"), new IR(") -> {"), 
						ir,
						new IR("("),
						new IR("__code__unMapData"),
						new IR("("), new IR("e"), new IR(")"),
						new IR(")"),
						new IR("}")
					]);
					break;
				case "(Int, []Data)":
					// conversion from_data is handled by UnconstrDataSwitchCase
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