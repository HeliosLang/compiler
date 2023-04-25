//@ts-check
// Helios eval entities

import {
    assert,
	assertDefined
} from "./utils.js";

import {
    Site,
    Word
} from "./tokens.js";

import {
	ConstrData,
	ListData,
	UplcData
} from "./uplc-data.js";

/**
 * @template T
 * @typedef {import("./helios-data.js").HeliosDataClass<T>} HeliosDataClass
 */

import {
	Address,
	AssetClass,
	Bool,
	ByteArray,
	DatumHash,
	Duration,
	HeliosData,
	HMap,
	HString,
	HInt,
	HList,
	MintingPolicyHash,
	Option,
	PubKeyHash,
	StakeKeyHash,
	StakingValidatorHash,
	Time,
	TxId,
	TxOutputId,
	ValidatorHash,
	Value
} from "./helios-data.js"

import {
    ScriptPurpose
} from "./uplc-ast.js";

/**
 * We can't use StructStatement etc. directly because that would give circular dependencies
 * @typedef {{
 *   name: Word,
 *   getTypeMember(key: Word): EvalEntity,
 *   getInstanceMember(key: Word): Instance,
 *   nFields(site: Site): number,
 *   hasField(key: Word): boolean,
 *   getFieldType(site: Site, i: number): Type,
 * 	 getFieldIndex(site: Site, name: string): number,
 *   getFieldName(i: number): string,
 *   getConstrIndex(site: Site): number,
 *   nEnumMembers(site: Site): number,
 *   path: string,
 *   use: () => void
 * }} UserTypeStatement
 */

/**
 * We can't use ConstStatement directly because that would give a circular dependency
 * @typedef {{
 *   name: Word,
 *   path: string,
 *   use: () => void
 * }} ConstTypeStatement
 */

/**
 * We can't use EnumMember directly because that would give a circular dependency
 * @typedef {UserTypeStatement & {
 * 	 parent: EnumTypeStatement,
 *   getConstrIndex(site: Site): number
*  }} EnumMemberTypeStatement
 */

/**
 * We can't use EnumStatement directly because that would give a circular dependency
 * @typedef {UserTypeStatement & {
 *   type: Type,
 *   nEnumMembers(site: Site): number,
 *   getEnumMember(site: Site, i: number): EnumMemberTypeStatement
 * }} EnumTypeStatement
 */

/**
 * We can't use FuncStatement directly because that would give a circular dependency
 * @typedef {{
 *   path: string,
 *   use: () => void,
 *   setRecursive: () => void,
 *   isRecursive: () => boolean
 * }} RecurseableStatement
 */

/**
 * We can't use Scope directly because that would give a circular dependency
 * @typedef {{
 *   isRecursive: (statement: RecurseableStatement) => boolean
 * }} RecursivenessChecker
 */

/**
 * Base class of Instance and Type.
 * Any member function that takes 'site' as its first argument throws a TypeError if used incorrectly (eg. calling a non-FuncType).
 * @package
 */
export class EvalEntity {
	constructor() {
		this.used_ = false;
	}

	/**
	 * @param {Site} site
	 * @returns {Type}
	 */
	assertType(site) {
		throw site.typeError("not a type");
	}

	/**
	 * @returns {boolean}
	 */
	isType() {
		throw new Error("not yet implemented");
	}

	/**
	 * @param {Site} site
	 * @returns {Instance}
	 */
	assertValue(site) {
		throw site.typeError("not a value");
	}

	/**
	 * @returns {boolean}
	 */
	isValue() {
		throw new Error("not yet implemented");
	}

	/**
	 * @returns {boolean}
	 */
	isUsed() {
		return this.used_;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		throw new Error("not yet implemented");
	}

	/**
	 * Used by Scope to mark named Values/Types as used.
	 * At the end of the Scope an error is thrown if any named Values/Types aren't used.
	 */
	markAsUsed() {
		this.used_ = true;
	}

	/**
	 * Gets type of a value. Throws error when trying to get type of type.
	 * @param {Site} site
	 * @returns {Type}
	 */
	getType(site) {
		throw new Error("not yet implemented");
	}

	/**
	 * Returns 'true' if 'this' is a base-type of 'type'. Throws an error if 'this' isn't a Type.
	 * @param {Site} site
	 * @param {Type} type
	 * @returns {boolean}
	 */
	isBaseOf(site, type) {
		throw new Error("not yet implemented");
	}

	/**
	 * Returns 'true' if 'this' is an instance of 'type'. Throws an error if 'this' isn't a Instance.
	 * 'type' can be a class, or a class instance.
	 * @param {Site} site 
	 * @param {Type | TypeClass} type 
	 * @returns {boolean}
	 */
	isInstanceOf(site, type) {
		throw new Error("not yet implemented");
	}

	/**
	 * Returns the return type of a function (wrapped as a Instance) if the args have the correct types. 
	 * Throws an error if 'this' isn't a function value, or if the args don't correspond.
	 * @param {Site} site 
	 * @param {Instance[]} args
	 * @param {{[name: string]: Instance}} namedArgs
	 * @returns {Instance}
	 */
	call(site, args, namedArgs = {}) {
		throw new Error("not yet implemented");
	}

	/**
	 * Gets a member of a Type (i.e. the '::' operator).
	 * Throws an error if the member doesn't exist or if 'this' isn't a DataType.
	 * @param {Word} name
	 * @returns {EvalEntity} - can be Instance or Type
	 */
	getTypeMember(name) {
		throw new Error("not yet implemented");
	}

	/**
	 * Gets a member of a Instance (i.e. the '.' operator).
	 * Throws an error if the member doesn't exist or if 'this' isn't a DataInstance.
	 * @param {Word} name
	 * @returns {Instance} - can be FuncInstance or DataInstance
	 */
	getInstanceMember(name) {
		throw new Error("not yet implemented");
	}

	/**
	 * Returns the number of fields in a struct.
	 * Used to check if a literal struct constructor is correct.
	 * @param {Site} site
	 * @returns {number}
	 */
	nFields(site) {
		throw new Error("not yet implemented");
	}

	/**
	 * Returns the type of struct or enumMember fields.
	 * Used to check if literal struct constructor is correct.
	 * @param {Site} site
	 * @param {number} i
	 * @returns {Type}
	 */
	getFieldType(site, i) {
		throw new Error("not yet implemented");
	}

	/**
	 * Returns the index of struct or enumMember fields.
	 * Used to order literal struct fields.
	 * @param {Site} site
	 * @param {string} name
	 * @returns {number}
	 */
	getFieldIndex(site, name) {
		throw new Error("not yet implemented");
	}

	/**
	 * Returns the constructor index so Plutus-core data can be created correctly.
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		throw new Error("not yet implemented");
	}
}

/**
 * Types are used during type-checking of Helios
 * @package
 */
export class Type extends EvalEntity {
	constructor() {
		super();
	}

	/**
	 * Compares two types. Throws an error if neither is a Type.
	 * @example
	 * Type.same(Site.dummy(), new IntType(), new IntType()) => true
	 * @param {Site} site 
	 * @param {Type} a 
	 * @param {Type} b 
	 * @returns {boolean}
	 */
	static same(site, a, b) {
		return a.isBaseOf(site, b) && b.isBaseOf(site, a);
	}

	/**
	 * @returns {boolean}
	 */
	isType() {
		return true;
	}

	/**
	 * @param {Site} site
	 * @returns {Type}
	 */
	assertType(site) {
		return this;
	}

	/**
	 * @returns {boolean}
	 */
	isValue() {
		return false;
	}

	/**
	 * Returns the underlying Type. Throws an error in this case because a Type can't return another Type.
	 * @param {Site} site 
	 * @returns {Type}
	 */
	getType(site) {
		throw site.typeError(`can't use getType(), '${this.toString()}' isn't an instance`);
	}

	/**
	 * Throws an error because a Type can't be an instance of another Type.
	 * @param {Site} site 
	 * @param {Type | TypeClass} type
	 * @returns {boolean}
	 */
	isInstanceOf(site, type) {
		throw site.typeError(`can't use isInstanceOf(), '${this.toString()}' isn't an instance`);
	}

	/**
	 * Throws an error because a Type isn't callable.
	 * @param {Site} site 
	 * @param {Instance[]} args 
	 * @param {{[name: string]: Instance}} namedArgs
	 * @returns {Instance}
	 */
	call(site, args, namedArgs = {}) {
		throw site.typeError("not callable");
	}

	/**
	 * @returns {boolean}
	 */
	isEnumMember() {
		return false;
	}

	/**
	 * Throws error for non-enum members
	 * @param {Site} site 
	 * @returns {Type}
	 */
	parentType(site) {
		throw site.typeError(`'${this.toString}' isn't an enum member`);
	}

	/**
	 * Returns number of members of an enum type
	 * Throws an error if not an enum type
	 * @param {Site} site
	 * @returns {number}
	 */
	nEnumMembers(site) {
		throw site.typeError(`'${this.toString()}' isn't an enum type`);
	}

	/**
	 * Returns the base path in the IR (eg. __helios__bool, __helios__error, etc.)
	 * @type {string}
	 */
	get path() {
		throw new Error("not yet implemented");
	}

	/**
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		throw new Error(`${this.toString()} doesn't have a corresponding userType`);
	}
}


/**
 * AnyType matches any other type in the type checker.
 * @package
 */
export class AnyType extends Type {
	constructor() {
		super();
	}

	/**
	 * @param {Site} site 
	 * @param {Type} other 
	 * @returns {boolean}
	 */
	isBaseOf(site, other) {
		return true;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return "Any";
	}
}

/**
 * Base class of non-FuncTypes.
 */
class DataType extends Type {
	constructor() {
		super();
	}

	/**
	 * @param {Site} site 
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isBaseOf(site, type) {
		type = ParamType.unwrap(type, this);

		return Object.getPrototypeOf(this) == Object.getPrototypeOf(type);
	}
}

/**
 * Matches everything except FuncType.
 * Used by find_datum_hash.
 */
class AnyDataType extends Type {
	constructor() {
		super();
	}

	/**
	 * @param {Site} site
	 * @param {Type} type
	 * @returns {boolean}
	 */
	isBaseOf(site, type) {
		return !(type instanceof FuncType);
	}
}

/**
 * Base class of all builtin types (eg. IntType)
 * Note: any builtin type that inherits from BuiltinType must implement get path()
 * @package
 */
export class BuiltinType extends DataType {
	#macrosAllowed; // macros are allowed after the definition of the main function

	constructor() {
		super();
		this.#macrosAllowed = false;
	}

	allowMacros() {
		this.#macrosAllowed = true;
	}

	get macrosAllowed() {
		return this.#macrosAllowed;
	}

	/**
	 * Returns Type member (i.e. '::' operator).
	 * @param {Word} name
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "__eq":
			case "__neq":
				return Instance.new(new FuncType([this, this], new BoolType()));
			case "from_data":
				return Instance.new(new FuncType([new RawDataType()], this));
			default:
				throw name.referenceError(`${this.toString()}::${name.value} undefined`);
		}
	}

	/**
	 * Returns one of default instance members, or throws an error.
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "serialize":
				return Instance.new(new FuncType([], new ByteArrayType()));
			default:
				throw name.referenceError(`${this.toString()}.${name.value} undefined`);
		}
	}

	/**
	 * Returns the number of data fields in a builtin type (not yet used)
	 * @param {Site} site 
	 * @returns {number}
	 */
	nFields(site) {
		return 0;
	}

	/**
	 * Returns the constructor index of a builtin type (eg. 1 for Option::None).
	 * By default non-enum builtin types that are encoded as Plutus-core data use the '0' constructor index.
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 0;
	}

	/**
	 * Use 'path' getter instead of 'toIR()' in order to get the base path.
	 */
	toIR() {
		throw new Error("use path getter instead");
	}
}

/**
 * @package
 */
export class BuiltinEnumMember extends BuiltinType {
	#parentType;

	/**
	 * @param {BuiltinType} parentType 
	 */
	constructor(parentType) {
		super();
		this.#parentType = parentType;
	}

	/**
	 * @returns {boolean}
	 */
	isEnumMember() {
		return true;
	}

	/**
	 * @param {Site} site 
	 * @returns {Type}
	 */
	parentType(site) {
		return this.#parentType;
	}

	/**
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "__eq":
			case "__neq":
				return Instance.new(new FuncType([this.#parentType, this.#parentType], new BoolType()));
			case "from_data":
				throw name.referenceError(`'${this.toString()}::from_data' undefined`);
			default:
				return super.getTypeMember(name);
		}
	}
	
	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			default:
				return super.getInstanceMember(name);
		}
	}
}

/**
 * Type wrapper for Struct statements and Enums and Enum members.
 * @package
 * @template {UserTypeStatement} T
 */
export class StatementType extends DataType {
	#statement;

	/**
	 * @param {T} statement 
	 */
	constructor(statement) {
		super();
		this.#statement = statement;
	}

	/**
	 * @type {string}
	 */
	get name() {
		return this.#statement.name.value;
	}

	/**
	 * @returns {T}
	 */
	get statement() {
		return this.#statement;
	}

	/**
	 * @param {Site} site 
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isBaseOf(site, type) {
		type = ParamType.unwrap(type, this);

		if (type instanceof StatementType) {
			return type.path.startsWith(this.path);
		} else {
			return false;
		}
	}

	/**
	 * Returns the name of the type.
	 * @returns {string}
	 */
	toString() {
		return this.#statement.name.toString();
	}

	/**
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		return this.#statement.getTypeMember(name);
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		return this.#statement.getInstanceMember(name);
	}

	/**
	 * Returns the number of fields in a Struct or in an EnumMember.
	 * @param {Site} site 
	 * @returns {number}
	 */
	nFields(site) {
		return this.#statement.nFields(site);
	}

	/**
	 * Returns the i-th field of a Struct or an EnumMember
	 * @param {Site} site
	 * @param {number} i
	 * @returns {Type}
	 */
	getFieldType(site, i) {
		return this.#statement.getFieldType(site, i);
	}

	/**
	 * Returns the index of a named field of a Struct or an EnumMember
	 * @param {Site} site
	 * @param {string} name
	 * @returns {number}
	 */
	getFieldIndex(site, name) {
		return this.#statement.getFieldIndex(site, name);
	}

	/**
	 * Returns the constructor index so that __core__constrData can be called correctly.
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return this.#statement.getConstrIndex(site);
	}

	/**
	 * Returns the number of members of an EnumStatement
	 * @param {Site} site
	 * @returns {number}
	 */
	nEnumMembers(site) {
		return this.#statement.nEnumMembers(site);
	}

	get path() {
		return this.#statement.path;
	}

	/**
	 * A StatementType can instantiate itself if the underlying statement is an enum member with no fields
	 * @param {Site} site
	 * @returns {Instance}
	 */
	assertValue(site) {
		throw site.typeError(`expected a value, got a type`);
	}
}

/**
 * @package
 * @extends {StatementType<UserTypeStatement>}
 */
export class StructStatementType extends StatementType {
	/**
	 * @param {UserTypeStatement} statement - can't use StructStatement because that would give a circular dependency
	 */
	constructor(statement) {
		super(statement);
	}

	/**
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		const statement = this.statement;

		const nFields = this.nFields(Site.dummy());

		/**
		 * @type {[string, Type][]} - [name, type]
		 */
		const fields = [];

		for (let i = 0; i < nFields; i++) {
			fields.push([statement.getFieldName(i), statement.getFieldType(Site.dummy(), i)]);
		}

		class Struct extends HeliosData {
			/**
			 * So we can access fields by index
			 * @type {HeliosData[]}
			 */
			#fields;

			/**
			 * @param  {...any} args
			 */
			constructor(...args) {
				super();
				if (args.length != nFields) {
					throw new Error(`expected ${nFields} args, got ${args.length}`);
				}

				this.#fields = [];

				args.forEach((arg, i) => {
					const [fieldName, fieldType] = fields[i];
					const FieldClass = fieldType.userType;

					const instance = arg instanceof FieldClass ? arg : new FieldClass(arg);

					this.#fields.push(instance);
					this[fieldName] = instance;
				});
			}

			/**
			 * Overload 'instanceof' operator
			 * @param {any} other 
			 * @returns {boolean}
			 */
			static [Symbol.hasInstance](other) {
				return (other._structStatement === statement) && (other instanceof HeliosData);
			}

			/**
			 * @type {UserTypeStatement}
			 */
			get _structStatement() {
				return statement;
			}

			/**
			 * @returns {UplcData}
			 */
			_toUplcData() {
				if (this.#fields.length == 1) {
					return this.#fields[0]._toUplcData();
				} else {
					return new ListData(this.#fields.map(f => f._toUplcData()));
				}
			}

			/**
			 * @param {string | number[]} bytes 
			 * @returns {Struct}
			 */
			static fromUplcCbor(bytes) {
				return Struct.fromUplcData(UplcData.fromCbor(bytes));
			}

			/**
			 * @param {UplcData} data 
			 * @returns {Struct}
			 */
			static fromUplcData(data) {
				const dataItems = data.list;

				if (dataItems.length != nFields) {
					throw new Error("unexpected number of fields");
				}

				const args = dataItems.map((item, i) => {
					return fields[i][1].userType.fromUplcData(item);
				});

				return new Struct(...args);
			}
		}

		Object.defineProperty(Struct, "name", {value: this.name, writable: false});		

		return Struct;
	}
}

/**
 * @package
 * @extends {StatementType<EnumTypeStatement>}
 */
export class EnumStatementType extends StatementType {
	/**
	 * @param {EnumTypeStatement} statement - can't use EnumStatement because that would give a circular dependency
	 */
	constructor(statement) {
		super(statement);
	}

	/**
	 * @package
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		const statement = this.statement;

		const nVariants = statement.nEnumMembers(Site.dummy());

		/**
		 * @type {HeliosDataClass<HeliosData>[]}
		 */
		const variants = [];

		for (let i = 0; i < nVariants; i++) {
			variants.push(
				(new EnumMemberStatementType(statement.getEnumMember(Site.dummy(), i))).userType
			);
		}

		class Enum extends HeliosData {
			constructor() {
				super();
				throw new Error("can't be constructed (hint: construct an enum)");
			}

			/**
			 * Overload 'instanceof' operator
			 * @param {any} other 
			 * @returns {boolean}
			 */
			static [Symbol.hasInstance](other) {
				return (other._enumStatement === statement) && (other instanceof HeliosData);
			}

			/**
			 * @type {EnumTypeStatement}
			 */
			get _enumStatement() {
				return statement;
			}

			/**
			 * @param {string | number[]} bytes
			 * @returns {HeliosData}
			 */
			static fromUplcCbor(bytes) {
				return Enum.fromUplcData(UplcData.fromCbor(bytes));
			}

			/**
			 * @param {UplcData} data 
			 * @returns {HeliosData}
			 */
			static fromUplcData(data) {
				const variant = assertDefined(variants[data.index], "index out of range");

				return variant.fromUplcData(data);
			}
		}

		Object.defineProperty(Enum, "name", {value: this.name, writable: false});

		for (let v of variants) {
			Object.defineProperty(Enum, v.name, {value: v, writable: false});
		}

		return Enum;
	}
}

/**
 * @package
 * @extends {StatementType<EnumMemberTypeStatement>}
 */
export class EnumMemberStatementType extends StatementType {
    /**
     * @param {EnumMemberTypeStatement} statement - can't use EnumMember because that would give a circular dependency
     */
    constructor(statement) {
        super(statement);
    }

	/**
	 * @returns {boolean}
	 */
	isEnumMember() {
		return true;
	}

	/**
	 * @param {Site} site 
	 * @returns {Type}
	 */
	parentType(site) {
		return this.statement.parent.type;
	}

    /**
	 * A StatementType can instantiate itself if the underlying statement is an enum member with no fields
	 * @package
	 * @param {Site} site
	 * @returns {Instance}
	 */
    assertValue(site) {
        if (this.statement.nFields(site) == 0) {
            return Instance.new(this);
        } else {
            throw site.typeError(`expected '{...}' after '${this.statement.name.toString()}'`);
        }
    }

	/**
	 * @package
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		const statement = this.statement;

		const enumStatement = statement.parent;

		const index = statement.getConstrIndex(Site.dummy());

		const nFields = this.nFields(Site.dummy());

		/**
		 * @type {[string, Type][]} - [name, type]
		 */
		const fields = [];

		for (let i = 0; i < nFields; i++) {
			fields.push([statement.getFieldName(i), statement.getFieldType(Site.dummy(), i)]);
		}

		// similar to Struct
		class EnumVariant extends HeliosData {
			/**
			 * So we can access fields by index
			 * @type {HeliosData[]}
			 */
			#fields;

			/**
			 * @param  {...any} args
			 */
			constructor(...args) {
				super();
				if (args.length != nFields) {
					throw new Error(`expected ${nFields} args, got ${args.length}`);
				}
 
				this.#fields = [];
 
				args.forEach((arg, i) => {
					const [fieldName, fieldType] = fields[i];
					const FieldClass = fieldType.userType;
 
					const instance = arg instanceof FieldClass ? arg : new FieldClass(arg);

 					this.#fields.push(instance);
					this[fieldName] = instance;

				});
			}
 
			/**
			 * Overload 'instanceof' operator
			 * @param {any} other 
			 * @returns {boolean}
			 */
			static [Symbol.hasInstance](other) {
				return (other._enumVariantStatement === statement) && (other instanceof HeliosData);
			}
 
			/**
			 * @type {EnumTypeStatement}
			 */
			get _enumStatement() {
				return enumStatement;
			}

			/**
			 * @type {EnumMemberTypeStatement}
			 */
			get _enumVariantStatement() {
				return statement;
			}
 
			/**
			 * @returns {UplcData}
			 */
			_toUplcData() {
				return new ConstrData(index, this.#fields.map(f => f._toUplcData()));
			}
 
			/**
			 * @param {string | number[]} bytes 
			 * @returns {EnumVariant}
			 */
			static fromUplcCbor(bytes) {
				return EnumVariant.fromUplcData(UplcData.fromCbor(bytes));
			}
 
			/**
			 * @param {UplcData} data 
			 * @returns {EnumVariant}
			 */
			static fromUplcData(data) {
				assert(data.index == index, "wrong index");

				const dataItems = data.list;
 
				if (dataItems.length != nFields) {
					throw new Error("unexpected number of fields");
				}
 
				const args = dataItems.map((item, i) => {
					return fields[i][1].userType.fromUplcData(item);
				});
 
				return new EnumVariant(...args);
			}
		}

		Object.defineProperty(EnumVariant, "name", {value: this.name, writable: false});

		return EnumVariant;
	}
}

/**
 * @package
 */
export class ArgType {
	#name;
	#type;
	#optional;

	/**
	 * 
	 * @param {null | Word} name 
	 * @param {Type} type 
	 * @param {boolean} optional 
	 */
	constructor(name, type, optional = false) {
		this.#name = name;
		this.#type = type;
		this.#optional = optional;
	}

	/**
	 * @type {string}
	 */
	get name() {
		if (this.#name === null) {
			return "";
		} else {
			return this.#name.toString();
		}
	}
	/**
	 * @type {Type}
	 */
	get type() {
		return this.#type;
	}

	/**
	 * @returns {boolean}
	 */
	isNamed() {
		return this.#name !== null;
	}

	/**
	 * @returns {boolean}
	 */
	isOptional() {
		return this.#optional;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return [
			this.#name != null ? `${this.#name.toString()}: ` : "",
			this.#optional ? "?" : "",
			this.#type.toString()
		].join("");
	}

	/**
	 * @param {Site} site 
	 * @param {ArgType} other 
	 * @returns {boolean}
	 */
	isBaseOf(site, other) {
		// if this arg has a default value, the other arg must also have a default value
		if (this.#optional && !other.#optional) {
			return false;
		}

		// if this is named, the other must be named as well
		if (this.#name != null) {
			return this.#name.toString() == (other.#name?.toString() ?? "");
		}

		if (this.#type instanceof ParamType) {
			this.#type.setType(site, other.#type);
		} else {
			if (!other.#type.isBaseOf(site, this.#type)) { // note the reversal of the check
				return false;
			}
		}

		return true;
	}
}

/**
 * Function type with arg types and a return type
 * @package
 */
export class FuncType extends Type {
	/**
	 * @type {ArgType[]}
	 */
	#argTypes;

	/**
	 * @type {Type[]}
	 */
	#retTypes;

	/**
	 * @param {Type[] | ArgType[]} argTypes 
	 * @param {Type | Type[]} retTypes 
	 */
	constructor(argTypes, retTypes) {
		super();
		this.#argTypes = argTypes.map(at => {
			if (at instanceof Type) {
				return new ArgType(null, at);
			} else {
				return at;
			}
		});

		if (!Array.isArray(retTypes)) {
			retTypes = [retTypes];
		}

		this.#retTypes = retTypes;
	}

	/**
	 * @type {number}
	 */
	get nArgs() {
		return this.#argTypes.length;
	}

	/**
	 * @type {number}
	 */
	get nNonOptArgs() {
		return this.#argTypes.filter(at => !at.isOptional()).length;
	}

	/**
	 * @type {number}
	 */
	get nOptArgs() {
		return this.#argTypes.filter(at => at.isOptional()).length;
	}

	/**
	 * @type {Type[]}
	 */
	get argTypes() {
		return this.#argTypes.slice().map(at => at.type);
	}

	/**
	 * @type {Type[]}
	 */
	get retTypes() {
		return this.#retTypes;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		if (this.#retTypes.length === 1) {
			return `(${this.#argTypes.map(a => a.toString()).join(", ")}) -> ${this.#retTypes.toString()}`;
		} else {
			return `(${this.#argTypes.map(a => a.toString()).join(", ")}) -> (${this.#retTypes.map(t => t.toString()).join(", ")})`;
		}
	}

	/**
	 * Checks if the type of the first arg is the same as 'type'
	 * Also returns false if there are no args.
	 * For a method to be a valid instance member its first argument must also be named 'self', but that is checked elsewhere
	 * @param {Site} site 
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isMaybeMethod(site, type) {
		if (this.#argTypes.length > 0) {
			return Type.same(site, this.#argTypes[0].type, type);
		} else {
			return false;
		}
	}

	/** 
	 * Checks if any of 'this' argTypes or retType is same as Type.
	 * Only if this checks return true is the association allowed.
	 * @param {Site} site
	 * @param {Type} type
	 * @returns {boolean}
	 */
	isAssociated(site, type) {
		for (let arg of this.#argTypes) {
			if (Type.same(site, arg.type, type)) {
				return true;
			}
		}

		for (let rt of this.#retTypes) {
			if (Type.same(site, type, rt)) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Checks if 'this' is a base type of another FuncType.
	 * The number of args needs to be the same.
	 * Each argType of the FuncType we are checking against needs to be the same or less specific (i.e. isBaseOf(this.#argTypes[i]))
	 * The retType of 'this' needs to be the same or more specific
	 * @param {Site} site 
	 * @param {Type} other 
	 * @returns {boolean}
	 */
	isBaseOf(site, other) {
		if (other instanceof FuncType) {
			if (this.nNonOptArgs != other.nNonOptArgs) {
				return false;
			} else {
				for (let i = 0; i < this.nNonOptArgs; i++) {
					if (!this.#argTypes[i].isBaseOf(site, other.#argTypes[i])) {
						return false;
					}
				}

				if (this.#retTypes.length === other.#retTypes.length) {
					for (let i = 0; i < this.#retTypes.length; i++) {
						if (!this.#retTypes[i].isBaseOf(site, other.#retTypes[i])) {
							return false;
						}
					}

					return true;
				} else {
					return false;
				}
			}

		} else {
			return false;
		}
	}
	
	/**
	 * Throws an error if name isn't found
	 * @param {Site} site 
	 * @param {string} name 
	 * @returns {number}
	 */
	getNamedIndex(site, name) {
		const i = this.#argTypes.findIndex(at => at.name == name);

		if (i == -1) {
			throw site.typeError(`arg name ${name} not found`);
		} else {
			return i;
		}
	}

	/**
	 * Checks if arg types are valid.
	 * Throws errors if not valid. Returns the return type if valid. 
	 * @param {Site} site 
	 * @param {Instance[]} posArgs
	 * @param {{[name: string]: Instance}} namedArgs
	 * @returns {Type[]}
	 */
	checkCall(site, posArgs, namedArgs = {}) {
		if (posArgs.length < this.nNonOptArgs) {
			// check if each nonOptArg is covered by the named args
			for (let i = 0; i < this.nNonOptArgs; i++) {
				if (!this.#argTypes[i].isNamed()) {
					throw site.typeError(`expected at least ${this.#argTypes.filter(at => !at.isNamed()).length} positional arg(s), got ${posArgs.length} positional arg(s)`);
				} else {
					if (!(this.#argTypes[i].name in namedArgs)) {
						throw site.typeError(`named arg ${this.#argTypes[i].name} missing from call`);
					}
				}
			}

		} else if (posArgs.length > this.#argTypes.length) {
			throw site.typeError(`expected at most ${this.#argTypes.length} arg(s), got ${posArgs.length} arg(s)`);
		}

		for (let i = 0; i < posArgs.length; i++) {
			if (!posArgs[i].isInstanceOf(site, this.#argTypes[i].type)) {
				throw site.typeError(`expected '${this.#argTypes[i].type.toString()}' for arg ${i + 1}, got '${posArgs[i].toString()}'`);
			}
		}

		for (let key in namedArgs) {
			const i = this.#argTypes.findIndex(at => at.name == key);

			if (i == -1) {
				throw site.typeError(`arg named ${key} not found in function type ${this.toString()}`);
			}

			if (i < posArgs.length) {
				throw site.typeError(`named arg '${key}' already covered by positional arg ${i+1}`);
			}

			const thisArg = this.#argTypes[i];

			if (!namedArgs[key].isInstanceOf(site, thisArg.type)) {
				throw site.typeError(`expected '${thisArg.type.toString()}' for arg '${key}', got '${namedArgs[key].toString()}`);
			}
		}

		return this.#retTypes;
	}
}

class NotType extends EvalEntity {
	constructor() {
		super();
	}
	
	/**
	 * @returns {boolean}
	 */
	isType() {
		return false;
	}

	/**
	 * Throws an error because NotType can't be a base-Type of anything.
	 * @param {Site} site 
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isBaseOf(site, type) {
		throw site.typeError("not a type");
	}

	/**
	 * @param {Word} name
	 * @returns {EvalEntity} - can be Instance or Type
	 */
	getTypeMember(name) {
		throw new Error("not a type");
	}
}

/**
 * Base class for DataInstance and FuncInstance
 * @package
 */
export class Instance extends NotType {
	constructor() {
		super();
	}

	/**
	 * @param {Type | Type[]} type 
	 * @returns {Instance}
	 */
	static new(type) {
		if (Array.isArray(type)) {
			if (type.length === 1) {
				return Instance.new(type[0]);
			} else {
				return new MultiInstance(type.map(t => Instance.new(t)));
			}
		} else if (type instanceof FuncType) {
			return new FuncInstance(type);
		} else if (type instanceof ParamType) {
			const t = type.type;
			if (t == null) {
				throw new Error("expected non-null type");
			} else {
				return Instance.new(t);
			}
		} else if (type instanceof ErrorType) {
			return new ErrorInstance();
		} else if (type instanceof VoidType) {
			return new VoidInstance();
		} else {
			return new DataInstance(type);
		}
	}

	/**
	 * @returns {boolean}
	 */
	isValue() {
		return true;
	}

	/**
	 * @param {Site} site
	 * @returns {Instance}
	 */
	assertValue(site) {
		return this;
	}
}


/**
 * A regular non-Func Instance. DataValues can always be compared, serialized, used in containers.
 * @package
 */
export class DataInstance extends Instance {
	#type;

	/**
	 * @param {DataType} type 
	 */
	constructor(type) {
		assert(!(type instanceof FuncType));

		super();
		this.#type = type;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.#type.toString();
	}

	/**
	 * Gets the underlying Type.
	 * @param {Site} site 
	 * @returns {Type}
	 */
	getType(site) {
		return this.#type;
	}

	/**
	 * @typedef {new(...any) => Type} TypeClass
	 */

	/**
	 * Checks if 'this' is instance of 'type'.
	 * 'type' can be a class, or a class instance.
	 * @param {Site} site 
	 * @param {Type | TypeClass} type 
	 * @returns 
	 */
	isInstanceOf(site, type) {
		if (typeof type == 'function') {
			return this.#type instanceof type;
		} else {
			return type.isBaseOf(site, this.#type);
		}
	}

	/**
	 * Returns the number of fields of a struct, enum member, or builtin type.
	 * @param {Site} site 
	 * @returns {number}
	 */
	nFields(site) {
		return this.#type.nFields(site);
	}

	/**
	 * Returns the i-th field of a Struct or an EnumMember
	 * @param {Site} site
	 * @param {number} i
	 * @returns {Type}
	 */
	getFieldType(site, i) {
		return this.#type.getFieldType(site, i);
	}

	/**
	 * Returns the index of a named field
	 * @param {Site} site 
	 * @param {string} name 
	 * @returns {number}
	 */
	getFieldIndex(site, name) {
		return this.#type.getFieldIndex(site, name);
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		return this.#type.getInstanceMember(name);
	}

	/**
	 * Throws an error bec
	 * @param {Site} site 
	 * @param {Instance[]} args 
	 * @param {{[name: string]: Instance}} namedArgs
	 * @returns {Instance}
	 */
	call(site, args, namedArgs = {}) {
		throw site.typeError("not callable");
	}
}

/**
 * @package
 */
export class ConstStatementInstance extends DataInstance {
	#statement;

	/**
	 * @param {DataType} type 
	 * @param {ConstTypeStatement} statement - can't use ConstStatement because that would give circular dependency
	 */
	constructor(type, statement) {
		super(type);
		this.#statement = statement;
	}

	/**
	 * @type {ConstTypeStatement}
	 */
	get statement() {
		return this.#statement
	}
}

/**
 * A callable Instance.
 * @package
 */
export class FuncInstance extends Instance {
	#type;

	/**
	 * @param {FuncType} type 
	 */
	constructor(type) {
		assert(type instanceof FuncType);

		super();
		this.#type = type;
	}

	/**
	 * @param {RecursivenessChecker} scope
	 * @returns {boolean}
	 */
	isRecursive(scope) {
		return false;
	}

	/**
	 * Returns a string representing the type.
	 * @returns {string}
	 */
	toString() {
		return this.#type.toString();
	}

	/**
	 * Returns the underlying FuncType as Type.
	 * @param {Site} site
	 * @returns {Type}
	 */
	getType(site) {
		return this.#type;
	}

	/**
	 * Returns the underlying FuncType directly.
	 * @returns {FuncType}
	 */
	getFuncType() {
		return this.#type;
	}

	/**
	 * Checks if 'this' is an instance of 'type'.
	 * Type can be a class or a class instance. 
	 * @param {Site} site 
	 * @param {Type | TypeClass} type 
	 * @returns {boolean}
	 */
	isInstanceOf(site, type) {
		if (typeof type == 'function') {
			return this.#type instanceof type;
		} else {
			return type.isBaseOf(site, this.#type);
		}
	}

	/**
	 * @param {Site} site 
	 * @param {Instance[]} args 
	 * @param {{[name: string]: Instance}} namedArgs
	 * @returns {Instance}
	 */
	call(site, args, namedArgs = {}) {
		return Instance.new(this.#type.checkCall(site, args, namedArgs));
	}

	/**
	 * Throws an error because a function value doesn't have any fields.
	 * @param {Site} site 
	 * @returns {number}
	 */
	nFields(site) {
		throw site.typeError("a function doesn't have fields");
	}

	/**
	 * Throws an error because a function value doesn't have any fields.
	 * @param {Site} site
	 * @param {number} i
	 * @returns {Type}
	 */
	getFieldType(site, i) {
		throw site.typeError("a function doesn't have fields");
	}

	/**
	 * Throws an error because a function value have any fields.
	 * @param {Site} site 
	 * @param {string} name 
	 * @returns {number}
	 */
	getFieldIndex(site, name) {
		throw site.typeError("a function doesn't have fields");
	}

	/**
	 * Throws an error because a function value doesn't have members.
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		throw name.typeError("a function doesn't have any members");
	}
}

/**
 * Special function value class for top level functions because they can be used recursively.
 * @package
 */
export class FuncStatementInstance extends FuncInstance {
	#statement

	/**
	 * @param {FuncType} type 
	 * @param {RecurseableStatement} statement - can't use FuncStatement because that would give circular dependency
	 */
	constructor(type, statement) {
		super(type);
		this.#statement = statement;
	}

	/**
	 * @type {RecurseableStatement}
	 */
	get statement() {
		return this.#statement;
	}

	/**
	 * @param {RecursivenessChecker} scope
	 * @returns {boolean}
	 */
	isRecursive(scope) {
		if (this.#statement.isRecursive()) {
			return true;
		} else {
			return scope.isRecursive(this.#statement);
		}
	}
}

/**
 * Wraps multiple return values
 * @package
 */
export class MultiInstance extends Instance {
	#values;

	/**
	 * @param {Instance[]} values 
	 */
	constructor(values) {
		super();
		this.#values = values;
	}

	get values() {
		return this.#values;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `(${this.#values.map(v => v.toString()).join(", ")})`;
	}

	/**
	 * @param {Instance[]} vals
	 * @returns {Instance[]}
	 */
	static flatten(vals) {
		/**
		 * @type {Instance[]}
		 */
		let result = [];

		for (let v of vals) {
			if (v instanceof MultiInstance) {
				result = result.concat(v.values);
			} else {
				result.push(v);
			}
		}

		return result;
	}
}

/**
 * Returned by functions that don't return anything (eg. assert, error, print)
 * @package
 */
export class VoidInstance extends Instance {
	constructor() {
		super();
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return "()"
	}

	/**
	 * @param {Site} site 
	 * @param {Type | TypeClass} type 
	 * @returns {boolean}
	 */
	isInstanceOf(site, type) {
		return type instanceof VoidType;
	}

	/**
	 * @param {Site} site 
	 * @returns {Type}
	 */
	getType(site) {
		return new VoidType();
	}

	/**
	 * @param {Site} site 
	 * @param {Instance[]} args
	 * @param {{[name: string]: Instance}} namedArgs
	 * @returns {Instance}
	 */
	call(site, args, namedArgs = {}) {
		throw new Error("can't call void");
	}

	/**
	 * @param {Word} name
	 * @returns {Instance} - can be FuncInstance or DataInstance
	 */
	getInstanceMember(name) {
		throw new Error("can't get member of void");
	}

	/**
	 * @param {Site} site
	 * @returns {number}
	 */
	nFields(site) {
		throw new Error("can't get nFields of void");
	}

	/**
	 * @param {Site} site
	 * @param {number} i
	 * @returns {Type}
	 */
	getFieldType(site, i) {
		throw new Error("can't get field-type of void");
	}

	/**
	 * @param {Site} site
	 * @param {string} name
	 * @returns {number}
	 */
	getFieldIndex(site, name) {
		throw new Error("can't get field-type of void");
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		throw new Error("can't get constr index of void");
	}
}

/**
 * Returned by an error()
 * Special case of no-return-value that indicates that execution can't proceed.
 * @package
 */
export class ErrorInstance extends VoidInstance {
	/**
	 * @param {Site} site 
	 * @returns {Type}
	 */
	 getType(site) {
		return new ErrorType();
	}
}

/**
 * Parent-class for AssertFunc, ErrorFunc and PrintFunc
 * @package
 */
export class BuiltinFuncInstance extends FuncInstance {
	/**
	 * Returns the base path in the IR (eg. __helios__bool, __helios__error, etc.)
	 * @type {string}
	 */
	get path() {
		throw new Error("not implemented")
	}
}

/**
 * Special builtin function that throws an error if condition is false and returns Void
 * @package
 */
 export class AssertFunc extends BuiltinFuncInstance {
	constructor() {
		super(new FuncType([new BoolType(), new StringType()], new VoidType()));
	}

	get path() {
		return "__helios__assert";
	}
}

/**
 * Special builtin function that throws an error and returns ErrorInstance (special case of Void)
 * @package
 */
 export class ErrorFunc extends BuiltinFuncInstance {
	constructor() {
		super(new FuncType([new StringType()], new ErrorType()));
	}

	get path() {
		return "__helios__error";
	}
}

/**
 * Special builtin function that prints a message and returns void
 * @package
 */
export class PrintFunc extends BuiltinFuncInstance {
	constructor() {
		super(new FuncType([new StringType()], new VoidType()));
	}

	get path() {
		return "__helios__print";
	}
}

/**
 * Type of return-value of functions that don't return anything (eg. assert, print, error)
 * @package
 */
export class VoidType extends Type {
	constructor() {
		super();
	}

	toString() {
		return "()";
	}

	/**
	 * @param {Site} site 
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isBaseOf(site, type) {
		return type instanceof VoidType;
	}
}

/**
 * Type of special case of no-return value where execution can't continue.
 * @package
 */
export class ErrorType extends VoidType {
	constructor() {
		super();
	}

	/**
	 * @param {Site} site 
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isBaseOf(site, type) {
		return type instanceof ErrorType;
	}
}

/**
 * Builtin Int type
 * @package
 */
export class IntType extends BuiltinType {
	constructor() {
		super();
	}

	toString() {
		return "Int";
	}

	/**
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "__neg":
			case "__pos":
				return Instance.new(new FuncType([this], new IntType()));
			case "__add":
			case "__sub":
			case "__mul":
			case "__div":
			case "__mod":
				return Instance.new(new FuncType([this, new IntType()], new IntType()));
			case "__geq":
			case "__gt":
			case "__leq":
			case "__lt":
				return Instance.new(new FuncType([this, new IntType()], new BoolType()));
			case "from_big_endian":
			case "from_little_endian":
				return Instance.new(new FuncType([new ByteArrayType()], new IntType()));
			case "max":
			case "min": 
				return Instance.new(new FuncType([new IntType(), new IntType()], new IntType()));
			case "from_base58":
			case "parse":
				return Instance.new(new FuncType([new StringType()], new IntType()));
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "decode_zigzag":
			case "encode_zigzag":
			case "abs":
				return Instance.new(new FuncType([], new IntType()));
			case "bound":
				return Instance.new(new FuncType([new IntType(), new IntType()], new IntType()));
			case "bound_min":
			case "bound_max":
				return Instance.new(new FuncType([new IntType()], new IntType()));
			case "to_bool":
				return Instance.new(new FuncType([], new BoolType()));
			case "to_big_endian":
			case "to_little_endian":
				return Instance.new(new FuncType([], new ByteArrayType()));
			case "to_base58":
			case "to_hex":
			case "show":
				return Instance.new(new FuncType([], new StringType()));
			default:
				return super.getInstanceMember(name);
		}
	}

	get path() {
		return "__helios__int";
	}

	get userType() {
		return HInt;
	}
}

/**
 * Builtin bool type
 * @package
 */
export class BoolType extends BuiltinType {
	constructor() {
		super();
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return "Bool";
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "__not":
				return Instance.new(new FuncType([this], new BoolType()));
			case "__and":
			case "__or":
				return Instance.new(new FuncType([this, new BoolType()], new BoolType()));
			case "and":
			case "or":
				return Instance.new(new FuncType([new FuncType([], new BoolType()), new FuncType([], new BoolType())], new BoolType()));
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "to_int":
				return Instance.new(new FuncType([], new IntType()));
			case "show":
				return Instance.new(new FuncType([], new StringType()));
			case "trace":
				return Instance.new(new FuncType([new StringType()], new BoolType()));
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @package
	 * @type {string}
	 */
	get path() {
		return "__helios__bool";
	}

	/**
	 * @package
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		return Bool;
	}
}

/**
 * Builtin string type
 * @package
 */
export class StringType extends BuiltinType {
	constructor() {
		super();
	}

	toString() {
		return "String";
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "__add":
				return Instance.new(new FuncType([this, new StringType()], new StringType()));
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "starts_with":
			case "ends_with":
				return Instance.new(new FuncType([new StringType()], new BoolType()));
			case "encode_utf8":
				return Instance.new(new FuncType([], new ByteArrayType()));
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @package
	 * @type {string}
	 */
	get path() {
		return "__helios__string";
	}

	/**
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		return HString;
	}
}

/**
 * Builtin bytearray type
 * @package
 */
export class ByteArrayType extends BuiltinType {
	#size;

	/**
	 * @param {?number} size - can be null or 32 (result of hashing)
	 */
	constructor(size = null) {
		super();

		this.#size = size;
	}

	toString() {
		return "ByteArray";
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "__add":
				return Instance.new(new FuncType([this, new ByteArrayType()], new ByteArrayType()));
			case "__geq":
			case "__gt":
			case "__leq":
			case "__lt":
				return Instance.new(new FuncType([this, new ByteArrayType()], new BoolType()));
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "length":
				return Instance.new(new IntType());
			case "slice":
				return Instance.new(new FuncType([new IntType(), new IntType()], new ByteArrayType()));
			case "starts_with":
			case "ends_with":
				return Instance.new(new FuncType([new ByteArrayType()], new BoolType()));
			case "prepend":
				return Instance.new(new FuncType([new IntType()], new ByteArrayType()));
			case "sha2":
			case "sha3":
			case "blake2b":
				return Instance.new(new FuncType([], new ByteArrayType(32)));
			case "decode_utf8":
			case "show":
				return Instance.new(new FuncType([], new StringType()));
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @package
	 * @type {string}
	 */
	get path() {
		return `__helios__bytearray${this.#size === null ? "" : this.#size}`;
	}

	/**
	 * @package
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		return ByteArray;
	}
}


class ParamType extends Type {
	/** @type {?Type} */
	#type;

	/** @type {string} */
	#name;

	#checkType;

	/**
	 * @param {string} name - typically "a" or "b"
	 * @param {?(site: Site, type: Type) => void} checkType
	 */
	constructor(name, checkType = null) {
		super();
		this.#type = null;
		this.#name = name;
		this.#checkType = checkType;
	}

	/**
	 * @returns {boolean}
	 */
	isInferred() {
		return this.#type !== null;
	}

	/**
	 * @param {Site} site
	 * @param {Type} type 
	 */
	setType(site, type) {
		if (this.#checkType !== null) {
			this.#checkType(site, type);
		}

		this.#type = type;
	}

	/**
	 * @param {Type} type 
	 * @param {?Type} expected
	 * @returns {Type}
	 */
	static unwrap(type, expected = null) {
		if (type instanceof AnyType) {
			if (expected !== null) {
				return expected;
			} else {
				throw new Error("unable to infer type of AnyType");
			}
		} else if (type instanceof ParamType) {
			let origType = type.type;

			if (origType === null) {
				if (expected !== null) {
					type.setType(Site.dummy(), expected);
					return expected;
				} else {
					throw new Error("unable to infer ParamType");
				}
			} else {
				return origType;
			}
		} else {
			return type;
		}
	}

	/**
	 * @type {?Type}
	 */
	get type() {
		if (this.#type instanceof ParamType) {
			return this.#type.type;
		} else {
			return this.#type;
		}
	}

	toString() {
		if (this.#type === null) {
			return this.#name;
		} else {
			return this.#type.toString();
		}
	}

	/**
	 * Returns number of members of an enum type
	 * Throws an error if not an enum type
	 * @param {Site} site
	 * @returns {number}
	 */
	nEnumMembers(site) {
		if (this.#type === null) {
			throw new Error("param type not yet infered");
		} else {
			return this.#type.nEnumMembers(site);
		}
	}

	/**
	 * Returns the number of fields of a struct, enum member, or builtin type.
	 * @param {Site} site 
	 * @returns {number}
	 */
	nFields(site) {
		if (this.#type === null) {
			throw new Error("should've been set");
		} else {
			return this.#type.nFields(site);
		}
	}

	/**
	 * Returns the i-th field of a Struct or an EnumMember
	 * @param {Site} site
	 * @param {number} i
	 * @returns {Type}
	 */
	getFieldType(site, i) {
		if (this.#type === null) {
			throw new Error("should've been set");
		} else {
			return this.#type.getFieldType(site, i);
		}
	}

	/**
	 * Returns the i-th field of a Struct or an EnumMember
	 * @param {Site} site
	 * @param {string} name
	 * @returns {number}
	 */
	getFieldIndex(site, name) {
		if (this.#type === null) {
			throw new Error("should've been set");
		} else {
			return this.#type.getFieldIndex(site, name);
		}
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		if (this.#type === null) {
			throw new Error("should've been set");
		} else {
			return this.#type.getInstanceMember(name);
		}
	}
	
	/**
	 * Returns 'true' if 'this' is a base-type of 'type'. Throws an error if 'this' isn't a Type.
	 * @param {Site} site
	 * @param {Type} type
	 * @returns {boolean}
	 */
	isBaseOf(site, type) {
		if (this.#type === null) {
			this.setType(site, type);
			return true;
		} else {
			return this.#type.isBaseOf(site, type);
		}
	}

	/**
	 * Returns the base path of type (eg. __helios__bool).
	 * This is used extensively in the Intermediate Representation.
	 * @type {string}
	 */
	get path() {
		if (this.#type === null) {
			throw new Error("param type not yet infered");
		} else {
			return this.#type.path;
		}
	}
}

/**
 * @package
 */
export class ParamFuncValue extends FuncInstance {
	#params;
	#fnType;
	#correctMemberName;

	/**
	 * @param {ParamType[]} params
	 * @param {FuncType} fnType 
	 * @param {?() => string} correctMemberName
	 */
	constructor(params, fnType, correctMemberName = null) {
		super(fnType);
		this.#params = params;
		this.#fnType = fnType;
		this.#correctMemberName = correctMemberName;
	}

	get correctMemberName() {
		return this.#correctMemberName;
	}

	/**
	 * @returns {boolean}
	 */
	allInferred() {
		return this.#params.every(p => p.isInferred());
	}

	toString() {
		return this.#fnType.toString();
	}

	/**
	 * @param {Site} site 
	 * @returns {Type}
	 */
	getType(site) {
		if (this.allInferred()) {
			return this.#fnType;
		} else {
			throw site.typeError("can't get type of type parametric function");
		}
	}

	/**
	 * @param {Site} site 
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isInstanceOf(site, type) {
		if (this.allInferred()) {
			return (new FuncInstance(this.#fnType)).isInstanceOf(site, type);
		} else {
			throw site.typeError("can't determine if type parametric function is instanceof a type");
		}
	}

	/**
	 * @param {Site} site 
	 * @param {Instance[]} args
	 * @param {{[name: string]: Instance}} namedArgs
	 * @returns {Instance}
	 */
	call(site, args, namedArgs = {}) {
		return (new FuncInstance(this.#fnType)).call(site, args, namedArgs);
	}
}

/**
 * Builtin list type
 * @package
 */
export class ListType extends BuiltinType {
	#itemType;

	/**
	 * @param {Type} itemType 
	 */
	constructor(itemType) {
		super();
		this.#itemType = itemType;
	}

	/**
	 * @package
	 * @type {Type}
	 */
	get itemType() {
		return this.#itemType;
	}

	toString() {
		return `[]${this.#itemType.toString()}`;
	}

	/**
	 * @package
	 * @param {Site} site 
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isBaseOf(site, type) {
		type = ParamType.unwrap(type, this);

		if (type instanceof ListType) {
			return this.#itemType.isBaseOf(site, type.itemType);
		} else {
			return false;
		}
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "__add":
				return Instance.new(new FuncType([this, this], this));
			case "new":
				return Instance.new(new FuncType([new IntType(), new FuncType([new IntType()], this.#itemType)], this));
			case "new_const":
				return Instance.new(new FuncType([new IntType(), this.#itemType], this));
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "length":
				return Instance.new(new IntType());
			case "head":
				return Instance.new(this.#itemType);
			case "tail":
				return Instance.new(new ListType(this.#itemType));
			case "is_empty":
				return Instance.new(new FuncType([], new BoolType()));
			case "get":
				return Instance.new(new FuncType([new IntType()], this.#itemType));
			case "prepend":
				return Instance.new(new FuncType([this.#itemType], new ListType(this.#itemType)));
			case "any":
			case "all":
				return Instance.new(new FuncType([new FuncType([this.#itemType], new BoolType())], new BoolType()));
			case "find":
				return Instance.new(new FuncType([new FuncType([this.#itemType], new BoolType())], this.#itemType));
			case "find_safe":
				return Instance.new(new FuncType([new FuncType([this.#itemType], new BoolType())], new OptionType(this.#itemType)));
			case "filter":
				return Instance.new(new FuncType([new FuncType([this.#itemType], new BoolType())], new ListType(this.#itemType)));
			case "for_each":
				return Instance.new(new FuncType([new FuncType([this.#itemType], new VoidType())], new VoidType()));
			case "fold": {
				let a = new ParamType("a");
				return new ParamFuncValue([a], new FuncType([new FuncType([a, this.#itemType], a), a], a));
			}
			case "fold_lazy": {
				let a = new ParamType("a");
				return new ParamFuncValue([a], new FuncType([new FuncType([this.#itemType, new FuncType([], a)], a), a], a));
			}
			case "map": {
				let a = new ParamType("a");
				return new ParamFuncValue([a], new FuncType([new FuncType([this.#itemType], a)], new ListType(a)), () => {
					let type = a.type;
					if (type === null) {
						throw new Error("should've been inferred by now");
					} else {
						if ((new BoolType()).isBaseOf(Site.dummy(), type)) {
							return "map_to_bool";
						} else {
							return "map";
						}
					}
				});
			}
			case "single":
				return Instance.new(new FuncType([], this.#itemType));
			case "sort":
				return Instance.new(new FuncType([new FuncType([this.#itemType, this.#itemType], new BoolType())], new ListType(this.#itemType)));
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @package
	 * @type {string}
	 */
	get path() {
		return `__helios__${this.#itemType instanceof BoolType ? "bool" : ""}list`;
	}

	/**
	 * @package
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		return HList(this.#itemType.userType);
	}
}

/**
 * Builtin map type (in reality list of key-value pairs)
 * @package
 */
export class MapType extends BuiltinType {
	#keyType;
	#valueType;

	/**
	 * @param {Type} keyType 
	 * @param {Type} valueType 
	 */
	constructor(keyType, valueType) {
		super();
		this.#keyType = keyType;
		this.#valueType = valueType;
	}

	/**
	 * @package
	 * @type {Type}
	 */
	get keyType() {
		return this.#keyType;
	}

	/**
	 * @package
	 * @type {Type}
	 */
	get valueType() {
		return this.#valueType;
	}

	toString() {
		return `Map[${this.#keyType.toString()}]${this.#valueType.toString()}`;
	}

	/**
	 * @package
	 * @param {Site} site 
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isBaseOf(site, type) {
		type = ParamType.unwrap(type, this);

		if (type instanceof MapType) {
			return this.#keyType.isBaseOf(site, type.#keyType) && this.#valueType.isBaseOf(site, type.#valueType);
		} else {
			return false;
		}
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "__add":
				return Instance.new(new FuncType([this, this], this));
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "all":
			case "any":
				return Instance.new(new FuncType([new FuncType([this.#keyType, this.#valueType], new BoolType())], new BoolType()));
			case "delete":
				return Instance.new(new FuncType([this.#keyType], this));
			case "filter":
				return Instance.new(new FuncType([new FuncType([this.#keyType, this.#valueType], new BoolType())], this));
			case "find":
				return Instance.new(new FuncType([new FuncType([this.#keyType, this.#valueType], new BoolType())], [this.#keyType, this.#valueType]));
			case "find_safe":
				return Instance.new(new FuncType([new FuncType([this.#keyType, this.#valueType], new BoolType())], [new FuncType([], [this.#keyType, this.#valueType]), new BoolType()]))
			case "find_key":
				return Instance.new(new FuncType([new FuncType([this.#keyType], new BoolType())], this.#keyType));
			case "find_key_safe":
				return Instance.new(new FuncType([new FuncType([this.#keyType], new BoolType())], new OptionType(this.#keyType)));
			case "find_value":
				return Instance.new(new FuncType([new FuncType([this.#valueType], new BoolType())], this.#valueType));
			case "find_value_safe":
				return Instance.new(new FuncType([new FuncType([this.#valueType], new BoolType())], new OptionType(this.#valueType)));
			case "fold": {
				let a = new ParamType("a");
				return new ParamFuncValue([a], new FuncType([new FuncType([a, this.#keyType, this.#valueType], a), a], a));
			}
			case "fold_lazy": {
				let a = new ParamType("a");
				return new ParamFuncValue([a], new FuncType([new FuncType([this.#keyType, this.#valueType, new FuncType([], a)], a), a], a));
			}
			case "for_each":
				return Instance.new(new FuncType([new FuncType([this.#keyType, this.#valueType], new VoidType())], new VoidType()));
			case "get":
				return Instance.new(new FuncType([this.#keyType], this.#valueType));
			case "get_safe":
				return Instance.new(new FuncType([this.#keyType], new OptionType(this.#valueType)));
			case "head":
				return Instance.new(new FuncType([], [this.#keyType, this.#valueType]));
			case "head_key":
				return Instance.new(this.#keyType);
			case "head_value":
				return Instance.new(this.#valueType);
			case "is_empty":
				return Instance.new(new FuncType([], new BoolType()));
			case "length":
				return Instance.new(new IntType());
			case "map": {
				let a = new ParamType("a", (site, type) => {
					if ((new BoolType()).isBaseOf(site, type)) {
						throw site.typeError("Map keys can't be of 'Bool' type");
					}
				});

				let b = new ParamType("b");

				return new ParamFuncValue([a, b], new FuncType([new FuncType([this.#keyType, this.#valueType], [a, b])], new MapType(a, b)), () => {
					let type = b.type;
					if (type === null) {
						throw new Error("should've been inferred by now");
					} else {
						if ((new BoolType()).isBaseOf(Site.dummy(), type)) {
							return "map_to_bool";
						} else {
							return "map";
						}
					}
				});
			}
			case "prepend":
				return Instance.new(new FuncType([this.#keyType, this.#valueType], this));
			case "set":
				return Instance.new(new FuncType([this.#keyType, this.#valueType], this));
			case "sort":
				return Instance.new(new FuncType([new FuncType([this.#keyType, this.#valueType, this.#keyType, this.#valueType], new BoolType())], new MapType(this.#keyType, this.#valueType)));
			case "tail":
				return Instance.new(this);
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @package
	 * @type {string}
	 */
	get path() {
		return `__helios__${this.#valueType instanceof BoolType ? "bool" : ""}map`;
	}

	/**
	 * @package
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		return HMap(this.#keyType.userType, this.#valueType.userType);
	}
}

/**
 * Builtin option type
 * @package
 */
export class OptionType extends BuiltinType {
	#someType;

	/**
	 * @param {Type} someType 
	 */
	constructor(someType) {
		super();
		this.#someType = someType;
	}

	toString() {
		return `Option[${this.#someType.toString()}]`;
	}

	/**
	 * @package
	 * @param {Site} site 
	 * @returns {number}
	 */
	nEnumMembers(site) {
		return 2;
	}

	/**
	 * @package
	 * @param {Site} site 
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isBaseOf(site, type) {
		type = ParamType.unwrap(type, this);

		if (type instanceof OptionType) {
			return this.#someType.isBaseOf(site, type.#someType);
		} else {
			return (new OptionSomeType(this.#someType)).isBaseOf(site, type) || 
				(new OptionNoneType(this.#someType)).isBaseOf(site, type);
		}
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "Some":
				return new OptionSomeType(this.#someType);
			case "None":
				return new OptionNoneType(this.#someType);
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "map": {
				let a = new ParamType("a");
				return new ParamFuncValue([a], new FuncType([new FuncType([this.#someType], a)], new OptionType(a)), () => {
					let type = a.type;
					if (type === null) {
						throw new Error("should've been inferred by now");
					} else {
						if ((new BoolType()).isBaseOf(Site.dummy(), type)) {
							return "map_to_bool";
						} else {
							return "map";
						}
					}
				});
			}
			case "unwrap":
				return Instance.new(new FuncType([], this.#someType));
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @package
	 * @type {string}
	 */
	get path() {
		return `__helios__${this.#someType instanceof BoolType ? "bool" : ""}option`;
	}

	/**
	 * @package
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		return Option(this.#someType.userType);
	}
}

/**
 * Member type of OptionType with some content
 */
class OptionSomeType extends BuiltinEnumMember {
	#someType;

	/**
	 * @param {Type} someType 
	 */
	constructor(someType) {
		super(new OptionType(someType));
		this.#someType = someType;
	}

	toString() {
		return `Option[${this.#someType.toString()}]::Some`;
	}

	/**
	 * @param {Site} site 
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isBaseOf(site, type) {
		type = ParamType.unwrap(type, this);

		if (type instanceof OptionSomeType) {
			return this.#someType.isBaseOf(site, type.#someType);
		} else {
			return false;
		}
	}

	/**
	 * @param {Site} site
	 * @returns {number}
	 */
	nFields(site) {
		return 1;
	}

	/**
	 * @param {Site} site
	 * @param {number} i
	 * @returns {Type}
	 */
	getFieldType(site, i) {
		assert(i == 0);
		return this.#someType;
	}

	/**
	 * @param {Site} site
	 * @param {string} name
	 * @returns {number}
	 */
	getFieldIndex(site, name) {
		assert(name == "some");
		return 0;
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "some":
				return Instance.new(this.#someType);
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 0;
	}

	get path() {
		return `__helios__${this.#someType instanceof BoolType ? "bool" : ""}option__some`;
	}
}

/**
 * Member type of OptionType with no content
 * @package
 */
export class OptionNoneType extends BuiltinEnumMember {
	#someType;

	/**
	 * @param {Type} someType 
	 */
	constructor(someType) {
		super(new OptionType(someType));
		this.#someType = someType;
	}

	toString() {
		return `Option[${this.#someType.toString()}]::None`;
	}

	/**
	 * @param {Site} site 
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isBaseOf(site, type) {
		type = ParamType.unwrap(type, this);

		if (type instanceof OptionNoneType) {
			return this.#someType.isBaseOf(site, type.#someType);
		} else {
			return false;
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 1;
	}

	get path() {
		return `__helios__${this.#someType instanceof BoolType ? "bool" : ""}option__none`;
	}

	/**
	 * Instantiates self as value
	 * @param {Site} site
	 * @returns {Instance}
	 */
	assertValue(site) {
		return Instance.new(this);
	}
}

/**
 * Base type of other ValidatorHash etc. (all functionality is actually implemented here)
 * @package
 */
export class HashType extends BuiltinType {
	constructor() {
		super();
	}

	/**
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "__geq":
			case "__gt":
			case "__leq":
			case "__lt":
				return Instance.new(new FuncType([this, this], new BoolType()));
			case "new":
				return Instance.new(new FuncType([new ByteArrayType()], this));
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "show":
				return Instance.new(new FuncType([], new StringType()));
			default:
				return super.getInstanceMember(name);
		}
	}

	get path() {
		return "__helios__hash";
	}
}

/**
 * Builtin PubKeyHash type
 * @package
 */
export class PubKeyHashType extends HashType {
	toString() {
		return "PubKeyHash";
	}

	/**
	 * @package
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		return PubKeyHash;
	}
}

/**
 * Builtin StakeKeyHash type
 * @package
 */
export class StakeKeyHashType extends HashType {
	toString() {
		return "StakeKeyHash";
	}

	/**
	 * @package
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		return StakeKeyHash;
	}
}

/**
 * Builtin PubKey type
 * @package
 */
export class PubKeyType extends BuiltinType {
	toString() {
		return "PubKey";
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "new":
				return Instance.new(new FuncType([new ByteArrayType()], this));
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @package
	 * @param {Word} name
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "show":
				return Instance.new(new FuncType([], new StringType()));
			case "verify":
				return Instance.new(new FuncType([new ByteArrayType(), new ByteArrayType()], new BoolType()));
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @package
	 * @type {string}
	 */
	get path() {
		return "__helios__pubkey";
	}
}

/**
 * Generalization of ValidatorHash type and MintingPolicyHash type
 * Must be cast before being able to use the Hash type methods
 * @package
 */
export class ScriptHashType extends BuiltinType {
	constructor() {
		super();
	}

	toString() {
		return "ScriptHash";
	}

	get path() {
		return "__helios__scripthash";
	}
}

/**
 * Builtin ValidatorHash type
 * @package
 */
export class ValidatorHashType extends HashType {
	#purpose;

	/**
	 * @param {number} purpose 
	 */
	constructor(purpose = -1) {
		super();
		this.#purpose = purpose;
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "CURRENT":
				if (this.macrosAllowed) {
					if (this.#purpose == ScriptPurpose.Spending || this.#purpose == ScriptPurpose.Testing) {
						return Instance.new(this);
					} else {
						throw name.referenceError("'ValidatorHash::CURRENT' only available in spending script");
					}
				} else {
					throw name.referenceError("'ValidatorHash::CURRENT' can only be used after 'main'");
				}
			case "from_script_hash":
				return Instance.new(new FuncType([new ScriptHashType()], new ValidatorHashType()));
			default:
				return super.getTypeMember(name);
		}
	}

	toString() {
		return "ValidatorHash";
	}

	/**
	 * @package
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		return ValidatorHash;
	}
}

/**
 * Builtin MintingPolicyHash type
 * @package
 */
export class MintingPolicyHashType extends HashType {
	#purpose;

	/**
	 * @param {number} purpose 
	 */
	constructor(purpose = -1) {
		super();
		this.#purpose = purpose;
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "CURRENT":
				if (this.macrosAllowed) {
					if (this.#purpose == ScriptPurpose.Minting) {
						return Instance.new(this);
					} else {
						throw name.referenceError("'MintingPolicyHash::CURRENT' only available in minting script");
					}
				} else {
					throw name.referenceError("'MintingPolicyHash::CURRENT' can only be used after 'main'");
				}
			case "from_script_hash":
				return Instance.new(new FuncType([new ScriptHashType()], new MintingPolicyHashType()));
			default:
				return super.getTypeMember(name);
		}
	}

	toString() {
		return "MintingPolicyHash";
	}

	/**
	 * @package
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		return MintingPolicyHash;
	}
}

/**
 * Builtin StakingValidatorHash type
 * @package
 */
export class StakingValidatorHashType extends HashType {
	#purpose;

	/**
	 * @param {number} purpose 
	 */
	constructor(purpose = -1) {
		super();
		this.#purpose = purpose;
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "CURRENT":
				if (this.macrosAllowed) {
					if (this.#purpose == ScriptPurpose.Staking) {
						return Instance.new(this);
					} else {
						throw name.referenceError("'StakingValidatorHash::CURRENT' only available in minting script");
					}
				} else {
					throw name.referenceError("'StakingValidatorHash::CURRENT' can only be used after 'main'");
				}
			case "from_script_hash":
				return Instance.new(new FuncType([new ScriptHashType()], new StakingValidatorHashType()));
			default:
				return super.getTypeMember(name);
		}
	}

	toString() {
		return "StakingValidatorHash";
	}

	/**
	 * @package
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		return StakingValidatorHash;
	}
}

/**
 * Builtin DatumHash type
 * @package
 */
export class DatumHashType extends HashType {
	toString() {
		return "DatumHash";
	}

	/**
	 * @package
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		return DatumHash;
	}
}

/**
 * Builtin ScriptContext type
 * @package
 */
export class ScriptContextType extends BuiltinType {
	#purpose;

	/**
	 * @param {number} purpose 
	 */
	constructor(purpose) {
		super();
		this.#purpose = purpose;
	}

	toString() {
		return "ScriptContext";
	}

	/**
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "new_spending":
				if (this.macrosAllowed) {
					if (this.#purpose == ScriptPurpose.Spending || this.#purpose == ScriptPurpose.Testing) {
						return Instance.new(new FuncType([new TxType(), new TxOutputIdType()], this));
					} else {
						throw name.referenceError("'ScriptContext::new_spending' only avaiable for spending");
					}
				} else {
					if (this.#purpose == ScriptPurpose.Staking || this.#purpose == ScriptPurpose.Minting) {
						throw name.referenceError("'ScriptContext::new_spending' only avaiable for spending  scripts");
					} else {
						throw name.referenceError("'ScriptContext::new_spending' can only be used after 'main'");
					}
				}
			case "new_minting":
				if (this.macrosAllowed) {
					if (this.#purpose == ScriptPurpose.Minting || this.#purpose == ScriptPurpose.Testing) {
						return Instance.new(new FuncType([new TxType(), new MintingPolicyHashType()], this));
					} else {
						throw name.referenceError("'ScriptContext::new_minting' only avaiable for minting scripts");
					}
				} else {
					if (this.#purpose == ScriptPurpose.Staking || this.#purpose == ScriptPurpose.Spending) {
						throw name.referenceError("'ScriptContext::new_minting' only avaiable for minting scripts");
					} else {
						throw name.referenceError("'ScriptContext::new_minting' can only be used after 'main'");
					}
				}
			case "new_rewarding":
				if (this.macrosAllowed) {
					if (this.#purpose == ScriptPurpose.Staking || this.#purpose == ScriptPurpose.Testing) {
						return Instance.new(new FuncType([new TxType(), new StakingCredentialType()], this));
					} else {
						throw name.referenceError("'ScriptContext::new_rewarding' only avaiable for staking scripts");
					}
				} else {
					if (this.#purpose == ScriptPurpose.Spending || this.#purpose == ScriptPurpose.Minting) {
						throw name.referenceError("'ScriptContext::new_rewarding' only avaiable for staking scripts");
					} else {
						throw name.referenceError("'ScriptContext::new_rewarding' can only be used after 'main'");
					}
				}
			case "new_certifying":
				if (this.macrosAllowed) {
					if (this.#purpose == ScriptPurpose.Staking || this.#purpose == ScriptPurpose.Testing) {
						return Instance.new(new FuncType([new TxType(), new DCertType()], this));
					} else {
						throw name.referenceError("'ScriptContext::new_certifying' only avaiable for staking scripts");
					}
				} else {
					if (this.#purpose == ScriptPurpose.Spending || this.#purpose == ScriptPurpose.Minting) {
						throw name.referenceError("'ScriptContext::new_certifying' only avaiable for staking scripts");
					} else {
						throw name.referenceError("'ScriptContext::new_certifying' can only be used after 'main'");
					}
				}
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "tx":
				return Instance.new(new TxType());
			case "get_spending_purpose_output_id":
				if (this.#purpose == ScriptPurpose.Minting || this.#purpose == ScriptPurpose.Staking) {
					throw name.referenceError("not available in minting/staking script");
				} else {
					return Instance.new(new FuncType([], new TxOutputIdType()));
				}
			case "get_current_validator_hash":
				if (this.#purpose == ScriptPurpose.Minting || this.#purpose == ScriptPurpose.Staking) {
					throw name.referenceError("not available in minting/staking script");
				} else {
					return Instance.new(new FuncType([], new ValidatorHashType(this.#purpose)));
				}
			case "get_current_minting_policy_hash":
				if (this.#purpose == ScriptPurpose.Spending || this.#purpose == ScriptPurpose.Staking) {
					throw name.referenceError("not available in spending/staking script");
				} else {
					return Instance.new(new FuncType([], new MintingPolicyHashType(this.#purpose)));
				}
			case "get_current_input":
				if (this.#purpose == ScriptPurpose.Minting || this.#purpose == ScriptPurpose.Staking) {
					throw name.referenceError("not available in minting/staking script");
				} else {
					return Instance.new(new FuncType([], new TxInputType()));
				}
			case "get_cont_outputs":
				if (this.#purpose == ScriptPurpose.Minting || this.#purpose == ScriptPurpose.Staking) {
					throw name.referenceError("not available in minting/staking script");
				} else {
					return Instance.new(new FuncType([], new ListType(new TxOutputType())));
				}
			case "get_staking_purpose":
				if (this.#purpose == ScriptPurpose.Minting || this.#purpose == ScriptPurpose.Spending) {
					throw name.referenceError("not available in minting/spending script");
				} else {
					return Instance.new(new FuncType([], new StakingPurposeType()));
				}
			case "get_script_purpose":
				return Instance.new(new FuncType([], new ScriptPurposeType()));
			default:
				return super.getInstanceMember(name);
		}
	}

	get path() {
		return "__helios__scriptcontext";
	}
}

/**
 * Builtin ScriptPurpose type (Minting| Spending| Rewarding | Certifying)
 * @package
 */
export class ScriptPurposeType extends BuiltinType {
	toString() {
		return "ScriptPurpose";
	}

	/**
	 * @param {Site} site 
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isBaseOf(site, type) {
		let b = super.isBaseOf(site, type) ||
				(new MintingScriptPurposeType()).isBaseOf(site, type) || 
				(new SpendingScriptPurposeType()).isBaseOf(site, type) || 
				(new RewardingScriptPurposeType()).isBaseOf(site, type) || 
				(new CertifyingScriptPurposeType()).isBaseOf(site, type); 

		return b;
	}

	/**
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "new_minting":
				return Instance.new(new FuncType([new MintingPolicyHashType()], new MintingScriptPurposeType()));
			case "new_spending":
				return Instance.new(new FuncType([new TxOutputIdType()], new SpendingScriptPurposeType()));
			case "new_rewarding":
				return Instance.new(new FuncType([new StakingCredentialType()], new RewardingScriptPurposeType()));
			case "new_certifying":
				return Instance.new(new FuncType([new DCertType()], new CertifyingScriptPurposeType()));
			case "Minting":
				return new MintingScriptPurposeType();
			case "Spending":
				return new SpendingScriptPurposeType();
			case "Rewarding":
				return new RewardingScriptPurposeType();
			case "Certifying":
				return new CertifyingScriptPurposeType();
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	nEnumMembers(site) {
		return 4;
	}

	get path() {
		return "__helios__scriptpurpose";
	}
}

/**
 * Builtin ScriptPurpose::Minting
 */
class MintingScriptPurposeType extends BuiltinEnumMember {
	constructor() {
		super(new ScriptPurposeType());
	}

	toString() {
		return "ScriptPurpose::Minting";
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "policy_hash":
				return Instance.new(new MintingPolicyHashType());
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 0;
	}

	get path() {
		return "__helios__scriptpurpose__minting";
	}
}

/**
 * Builtin ScriptPurpose::Spending
 */
class SpendingScriptPurposeType extends BuiltinEnumMember {
	constructor() {
		super(new ScriptPurposeType());
	}

	toString() {
		return "ScriptPurpose::Spending";
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "output_id":
				return Instance.new(new TxOutputIdType());
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 1;
	}

	get path() {
		return "__helios__scriptpurpose__spending";
	}
}

/**
 * Builtin ScriptPurpose::Rewarding
 */
class RewardingScriptPurposeType extends BuiltinEnumMember {
	/**
	 * @param {?BuiltinType} parentType 
	 */
	constructor(parentType = null) {
		super(parentType === null ? new ScriptPurposeType() : parentType);
	}

	toString() {
		return "ScriptPurpose::Rewarding";
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "credential":
				return Instance.new(new StakingCredentialType());
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 2;
	}

	get path() {
		return "__helios__scriptpurpose__rewarding";
	}
}

/**
 * Builtin ScriptPurpose::Certifying type
 */
class CertifyingScriptPurposeType extends BuiltinEnumMember {
	/**
	 * @param {?BuiltinType} parentType
	 */
	constructor(parentType = null) {
		super(parentType === null ? new ScriptPurposeType() : parentType);
	}

	toString() {
		return "ScriptPurpose::Certifying";
	}


	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "dcert":
				return Instance.new(new DCertType());
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 3;
	}

	get path() {
		return "__helios__scriptpurpose__certifying";
	}
}

/**
 * Builtin StakingPurpose type (Rewarding or Certifying)
 * @package
 */
export class StakingPurposeType extends BuiltinType {
	toString() {
		return "StakingPurpose";
	}

	/**
	 * @param {Site} site 
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isBaseOf(site, type) {
		let b = super.isBaseOf(site, type) ||
				(new StakingRewardingPurposeType()).isBaseOf(site, type) || 
				(new StakingCertifyingPurposeType()).isBaseOf(site, type); 

		return b;
	}

	/**
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "Rewarding":
				return new StakingRewardingPurposeType();
			case "Certifying":
				return new StakingCertifyingPurposeType();
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	nEnumMembers(site) {
		return 2;
	}

	get path() {
		return "__helios__stakingpurpose";
	}
}

/**
 * Builtin StakingPurpose::Rewarding
 */
class StakingRewardingPurposeType extends RewardingScriptPurposeType {
	constructor() {
		super(new StakingPurposeType());
	}

	toString() {
		return "StakingPurpose::Rewarding";
	}

	get path() {
		return "__helios__stakingpurpose__rewarding";
	}
}

/**
 * Builtin StakingPurpose::Certifying type
 */
class StakingCertifyingPurposeType extends CertifyingScriptPurposeType {
	constructor() {
		super(new StakingPurposeType());
	}

	toString() {
		return "StakingPurpose::Certifying";
	}

	get path() {
		return "__helios__stakingpurpose__certifying";
	}
}

/**
 * Staking action type (confusingly named D(igest)(of)?Cert(ificate))
 * TODO: think of better name
 * @package
 */
export class DCertType extends BuiltinType {
	toString() {
		return "DCert";
	}

	/**
	 * @param {Site} site 
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isBaseOf(site, type) {
		let b = super.isBaseOf(site, type) ||
				(new RegisterDCertType()).isBaseOf(site, type) || 
				(new DeregisterDCertType()).isBaseOf(site, type) || 
				(new DelegateDCertType()).isBaseOf(site, type) || 
				(new RegisterPoolDCertType()).isBaseOf(site, type) ||
				(new RetirePoolDCertType()).isBaseOf(site, type); 

		return b;
	}

	/**
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "new_register":
				return Instance.new(new FuncType([new StakingCredentialType()], new RegisterDCertType()));
			case "new_deregister":
				return Instance.new(new FuncType([new StakingCredentialType()], new DeregisterDCertType()));
			case "new_delegate":
				return Instance.new(new FuncType([new StakingCredentialType(), new PubKeyHashType()], new DelegateDCertType()));
			case "new_register_pool":
				return Instance.new(new FuncType([new PubKeyHashType(), new PubKeyHashType()], new RegisterPoolDCertType()));
			case "new_retire_pool":
				return Instance.new(new FuncType([new PubKeyHashType(), new IntType()], new RetirePoolDCertType()));
			case "Register":
				return new RegisterDCertType();
			case "Deregister":
				return new DeregisterDCertType();
			case "Delegate":
				return new DelegateDCertType();
			case "RegisterPool":
				return new RegisterPoolDCertType();
			case "RetirePool":
				return new RetirePoolDCertType();
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	nEnumMembers(site) {
		return 5;
	}

	get path() {
		return "__helios__dcert";
	}
}

class RegisterDCertType extends BuiltinEnumMember {
	constructor() {
		super(new DCertType());
	}

	toString() {
		return "DCert::Register";
	}
	
	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "credential":
				return Instance.new(new StakingCredentialType());
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 0;
	}

	get path() {
		return "__helios__dcert__register";
	}
}

class DeregisterDCertType extends BuiltinEnumMember {
	constructor() {
		super(new DCertType());
	}

	toString() {
		return "DCert::Deregister";
	}
	
	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "credential":
				return Instance.new(new StakingCredentialType());
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 1;
	}

	get path() {
		return "__helios__dcert__deregister";
	}
}

class DelegateDCertType extends BuiltinEnumMember {
	constructor() {
		super(new DCertType());
	}

	toString() {
		return "DCert::Delegate";
	}
	
	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "delegator":
				return Instance.new(new StakingCredentialType());
			case "pool_id":
				return Instance.new(new PubKeyHashType());
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 2;
	}

	get path() {
		return "__helios__dcert__delegate";
	}
}

class RegisterPoolDCertType extends BuiltinEnumMember {
	constructor() {
		super(new DCertType());
	}

	toString() {
		return "DCert::RegisterPool";
	}
	
	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "pool_id":
				return Instance.new(new PubKeyHashType());
			case "pool_vrf":
				return Instance.new(new PubKeyHashType());
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 3;
	}

	get path() {
		return "__helios__dcert__registerpool";
	}
}

class RetirePoolDCertType extends BuiltinEnumMember {
	constructor() {
		super(new DCertType());
	}

	toString() {
		return "DCert::RetirePool";
	}
	
	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "pool_id":
				return Instance.new(new PubKeyHashType());
			case "epoch":
				return Instance.new(new IntType());
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 4;
	}

	get path() {
		return "__helios__dcert__retirepool";
	}
}

/**
 * Builtin Tx type
 * @package
 */
export class TxType extends BuiltinType {
	constructor() {
		super();
	}

	toString() {
		return "Tx";
	}

	/**
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "new":
				if (this.macrosAllowed) {
					return Instance.new(new FuncType([
						new ListType(new TxInputType()), // 0
						new ListType(new TxInputType()), // 1
						new ListType(new TxOutputType()), // 2
						new ValueType(), // 3
						new ValueType(), // 4
						new ListType(new DCertType()), // 5
						new MapType(new StakingCredentialType(), new IntType()), // 6
						new TimeRangeType(), // 7
						new ListType(new PubKeyHashType()), // 8
						new MapType(new ScriptPurposeType(), new AnyDataType()), // 9
						new MapType(new DatumHashType(), new AnyDataType()) // 10
					], this));
				} else {
					throw name.referenceError("'Tx::new' can only be used after 'main'");
				}
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "inputs":
				return Instance.new(new ListType(new TxInputType()));
			case "ref_inputs":
				return Instance.new(new ListType(new TxInputType()));
			case "outputs":
				return Instance.new(new ListType(new TxOutputType()));
			case "fee":
				return Instance.new(new ValueType());
			case "minted":
				return Instance.new(new ValueType());
			case "dcerts":
				return Instance.new(new ListType(new DCertType()));
			case "withdrawals":
				return Instance.new(new MapType(new StakingCredentialType(), new IntType()));
			case "time_range":
				return Instance.new(new TimeRangeType());
			case "signatories":
				return Instance.new(new ListType(new PubKeyHashType()));
			case "redeemers":
				return Instance.new(new MapType(new ScriptPurposeType(), new RawDataType()));
			case "datums":
				return Instance.new(new MapType(new DatumHashType(), new RawDataType()));
			case "id":
				return Instance.new(new TxIdType());
			case "find_datum_hash":
				return Instance.new(new FuncType([new AnyDataType()], new DatumHashType()));
			case "get_datum_data":
				return Instance.new(new FuncType([new TxOutputType()], new RawDataType()));
			case "outputs_sent_to":
				return Instance.new(new FuncType([new PubKeyHashType()], new ListType(new TxOutputType())));
			case "outputs_sent_to_datum":
				return Instance.new(new FuncType([new PubKeyHashType(), new AnyDataType(), new BoolType()], new ListType(new TxOutputType())));
			case "outputs_locked_by":
				return Instance.new(new FuncType([new ValidatorHashType()], new ListType(new TxOutputType())));
			case "outputs_locked_by_datum":
				return Instance.new(new FuncType([new ValidatorHashType(), new AnyDataType(), new BoolType()], new ListType(new TxOutputType())));
			case "value_sent_to":
				return Instance.new(new FuncType([new PubKeyHashType()], new ValueType()));
			case "value_sent_to_datum":
				return Instance.new(new FuncType([new PubKeyHashType(), new AnyDataType(), new BoolType()], new ValueType()));
			case "value_locked_by":
				return Instance.new(new FuncType([new ValidatorHashType()], new ValueType()));
			case "value_locked_by_datum":
				return Instance.new(new FuncType([new ValidatorHashType(), new AnyDataType(), new BoolType()], new ValueType()));
			case "is_signed_by":
				return Instance.new(new FuncType([new PubKeyHashType()], new BoolType()));
			default:
				return super.getInstanceMember(name);
		}
	}

	get path() {
		return "__helios__tx";
	}
}

/**
 * Builtin TxId type
 * @package
 */
export class TxIdType extends BuiltinType {
	toString() {
		return "TxId";
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "__geq":
			case "__gt":
			case "__leq":
			case "__lt":
				return Instance.new(new FuncType([this, this], new BoolType()));
			case "new":
				return Instance.new(new FuncType([new ByteArrayType()], this));
			case "CURRENT":
				if (this.macrosAllowed) {
					return Instance.new(this);
				} else {
					throw name.referenceError("'TxId::CURRENT' can only be used after 'main'");
				}
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "show":
				return Instance.new(new FuncType([], new StringType()));
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @package
	 * @type {string}
	 */
	get path() {
		return "__helios__txid";
	}

	/**
	 * @package
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		return TxId;
	}
}

/**
 * Builtin TxInput type
 * @package
 */
export class TxInputType extends BuiltinType {
	toString() {
		return "TxInput";
	}

	/**
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "new":
				if (this.macrosAllowed) {
					return Instance.new(new FuncType([
						new TxOutputIdType(), // 0
						new TxOutputType(), // 1
					], this));
				} else {
					throw name.referenceError("'TxInput::new' can only be used after 'main'");
				}
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "output_id":
				return Instance.new(new TxOutputIdType());
			case "output":
				return Instance.new(new TxOutputType());
			default:
				return super.getInstanceMember(name);
		}
	}

	get path() {
		return "__helios__txinput";
	}
}

/**
 * Builtin TxOutput type
 * @package
 */
export class TxOutputType extends BuiltinType {
	toString() {
		return "TxOutput";
	}

	/**
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "new":
				return Instance.new(new FuncType([
					new AddressType(), // 0
					new ValueType(), // 1
					new OutputDatumType(), // 2
				], this));
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "address":
				return Instance.new(new AddressType());
			case "value":
				return Instance.new(new ValueType());
			case "datum":
				return Instance.new(new OutputDatumType());
			case "ref_script_hash":
				return Instance.new(new OptionType(new ScriptHashType()));
			default:
				return super.getInstanceMember(name);
		}
	}

	get path() {
		return "__helios__txoutput";
	}
}

/**
 * @package
 */
export class OutputDatumType extends BuiltinType {
	toString() {
		return "OutputDatum";
	}

	/**
	 * @param {Site} site 
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isBaseOf(site, type) {
		let b = super.isBaseOf(site, type) ||
				(new NoOutputDatumType()).isBaseOf(site, type) || 
				(new HashedOutputDatumType()).isBaseOf(site, type) || 
				(new InlineOutputDatumType()).isBaseOf(site, type);; 

		return b;
	}

	/**
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "new_none":
				return Instance.new(new FuncType([], new NoOutputDatumType()));
			case "new_hash":
				return Instance.new(new FuncType([new DatumHashType()], new HashedOutputDatumType()));
			case "new_inline": {
				let a = new ParamType("a");
				return new ParamFuncValue([a], new FuncType([a], new InlineOutputDatumType()), () => {
					let type = a.type;
					if (type === null) {
						throw new Error("should've been inferred by now");
					} else {
						if (a.type instanceof FuncType) {
							throw name.site.typeError("can't use function as argument to OutputDatum::new_inline()");
						} else if ((new BoolType()).isBaseOf(Site.dummy(), type)) {
							return "new_inline_from_bool";
						} else {
							return "new_inline";
						}
					}
				});
			}
			case "None":
				return new NoOutputDatumType();
			case "Hash":
				return new HashedOutputDatumType();
			case "Inline":
				return new InlineOutputDatumType();
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "get_inline_data":
				return Instance.new(new FuncType([], new RawDataType()));
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	nEnumMembers(site) {
		return 3;
	}

	get path() {
		return "__helios__outputdatum";
	}
}

/**
 * @package
 */
class NoOutputDatumType extends BuiltinEnumMember {
	constructor() {
		super(new OutputDatumType);
	}

	toString() {
		return "OutputDatum::None";
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 0;
	}

	get path() {
		return "__helios__outputdatum__none";
	}
}

/**
 * @package
 */
class HashedOutputDatumType extends BuiltinEnumMember {
	constructor() {
		super(new OutputDatumType());
	}

	toString() {
		return "OutputDatum::Hash";
	}
	
	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "hash":
				return Instance.new(new DatumHashType());
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 1;
	}

	get path() {
		return "__helios__outputdatum__hash";
	}
}

/**
 * @package
 */
class InlineOutputDatumType extends BuiltinEnumMember {
	constructor() {
		super(new OutputDatumType());
	}

	toString() {
		return "OutputDatum::Inline";
	}
	
	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "data":
				return Instance.new(new RawDataType());
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 2;
	}

	get path() {
		return "__helios__outputdatum__inline";
	}
}

/**
 * Type of external data that must be cast/type-checked before using
 * Not named 'Data' in Js because it's too generic
 * @package
 */
export class RawDataType extends BuiltinType {
	toString() {
		return "Data";
	}

	/**
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "from_data":
				throw name.referenceError(`calling Data::from_data(data) is useless`);
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "tag":
				return Instance.new(new IntType());
			default:
				return super.getInstanceMember(name);
		}
	}

	get path() {
		return "__helios__data";
	}
}

/**
 * Builtin TxOutputId type
 * @package
 */
export class TxOutputIdType extends BuiltinType {
	toString() {
		return "TxOutputId";
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "__lt":
			case "__leq":
			case "__gt":
			case "__geq":
				return Instance.new(new FuncType([this, new TxOutputIdType()], new BoolType()));
			case "new":
				return Instance.new(new FuncType([new TxIdType(), new IntType()], new TxOutputIdType()));
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "tx_id":
				return Instance.new(new TxIdType());
			case "index":
				return Instance.new(new IntType());
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @package
	 * @type {string}
	 */
	get path() {
		return "__helios__txoutputid";
	}

	/**
	 * @package
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		return TxOutputId;
	}
}

/**
 * Buitin Address type
 * @package
 */
export class AddressType extends BuiltinType {
	toString() {
		return "Address";
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "new":
				return Instance.new(new FuncType([
					new CredentialType(), // 0
					new OptionType(new StakingCredentialType()), // 1
				], this));
			case "new_empty":
				return Instance.new(new FuncType([], this));
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "credential":
				return Instance.new(new CredentialType());
			case "staking_credential":
				return Instance.new(new OptionType(new StakingCredentialType()));
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @package
	 * @type {string}
	 */
	get path() {
		return "__helios__address";
	}

	/**
	 * @package
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		return Address;
	}
}

/**
 * Builtin Credential type
 * @package
 */
export class CredentialType extends BuiltinType {
	toString() {
		return "Credential";
	}

	/**
	 * @package
	 * @param {Site} site 
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isBaseOf(site, type) {
		let b = super.isBaseOf(site, type) ||
				(new CredentialPubKeyType()).isBaseOf(site, type) || 
				(new CredentialValidatorType()).isBaseOf(site, type); 

		return b;
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "PubKey":
				return new CredentialPubKeyType();
			case "Validator":
				return new CredentialValidatorType();
			case "new_pubkey":
				return Instance.new(new FuncType([new PubKeyHashType()], new CredentialPubKeyType()));
			case "new_validator":
				return Instance.new(new FuncType([new ValidatorHashType()], new CredentialValidatorType()));
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @package
	 * @param {Site} site 
	 * @returns {number}
	 */
	nEnumMembers(site) {
		return 2;
	}

	/**
	 * @package
	 * @type {string}
	 */
	get path() {
		return "__helios__credential";
	}
}

/**
 * Builtin Credential::PubKey
 */
class CredentialPubKeyType extends BuiltinEnumMember {
	constructor() {
		super(new CredentialType());
	}

	toString() {
		return "Credential::PubKey";
	}
	
	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "hash":
				return Instance.new(new PubKeyHashType());
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 0;
	}

	get path() {
		return "__helios__credential__pubkey";
	}
}

/**
 * Builtin Credential::Validator type
 */
class CredentialValidatorType extends BuiltinEnumMember {
	constructor() {
		super(new CredentialType());
	}

	toString() {
		return "Credential::Validator";
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "hash":
				return Instance.new(new ValidatorHashType());
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 1;
	}

	get path() {
		return "__helios__credential__validator";
	}
}

/**
 * Builtin StakingHash type
 * @package
 */
export class StakingHashType extends BuiltinType {
	toString() {
		return "StakingHash";
	}

	/**
	 * @param {Site} site 
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isBaseOf(site, type) {
		let b = super.isBaseOf(site, type) ||
				(new StakingHashStakeKeyType()).isBaseOf(site, type) || 
				(new StakingHashValidatorType()).isBaseOf(site, type); 

		return b;
	}

	/**
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "StakeKey":
				return new StakingHashStakeKeyType();
			case "Validator":
				return new StakingHashValidatorType();
			case "new_stakekey":
				return Instance.new(new FuncType([new StakeKeyHashType()], new StakingHashStakeKeyType()));
			case "new_validator":
				return Instance.new(new FuncType([new StakingValidatorHashType()], new StakingHashValidatorType()));
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	nEnumMembers(site) {
		return 2;
	}

	get path() {
		return "__helios__stakinghash";
	}
}

/**
 * Builtin StakingHash::StakeKey
 */
class StakingHashStakeKeyType extends BuiltinEnumMember {
	constructor() {
		super(new StakingHashType());
	}

	toString() {
		return "StakingHash::StakeKey";
	}
	
	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "hash":
				return Instance.new(new StakeKeyHashType());
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 0;
	}

	get path() {
		return "__helios__stakinghash__stakekey";
	}
}

/**
 * Builtin StakingHash::Validator type
 */
class StakingHashValidatorType extends BuiltinEnumMember {
	constructor() {
		super(new StakingHashType());
	}

	toString() {
		return "StakingHash::Validator";
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "hash":
				return Instance.new(new StakingValidatorHashType());
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 1;
	}

	get path() {
		return "__helios__stakinghash__validator";
	}
}

/**
 * Builtin StakingCredential type
 * @package
 */
export class StakingCredentialType extends BuiltinType {
	toString() {
		return "StakingCredential";
	}

	/**
	 * @param {Site} site 
	 * @param {Type} type 
	 * @returns {boolean}
	 */
	isBaseOf(site, type) {
		let b = super.isBaseOf(site, type) ||
				(new StakingHashCredentialType()).isBaseOf(site, type) || 
				(new StakingPtrCredentialType()).isBaseOf(site, type); 

		return b;
	}

	/**
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "Hash":
				return new StakingHashCredentialType();
			case "Ptr":
				return new StakingPtrCredentialType();
			case "new_hash":
				return Instance.new(new FuncType([new StakingHashType()], new StakingHashCredentialType()));
			case "new_ptr":
				return Instance.new(new FuncType([new IntType(), new IntType(), new IntType()], new StakingPtrCredentialType()));
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	nEnumMembers(site) {
		return 2;
	}

	get path() {
		return "__helios__stakingcredential";
	}
}

/**
 * Builtin StakingCredential::Hash
 */
class StakingHashCredentialType extends BuiltinEnumMember {
	constructor() {
		super(new StakingCredentialType());
	}

	toString() {
		return "StakingCredential::Hash";
	}
	
	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "hash":
				return Instance.new(new StakingHashType());
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 0;
	}

	get path() {
		return "__helios__stakingcredential__hash";
	}
}

/**
 * Builtin StakingCredential::Ptr
 */
class StakingPtrCredentialType extends BuiltinEnumMember {
	constructor() {
		super(new StakingCredentialType());
	}

	toString() {
		return "StakingCredential::Ptr";
	}

	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	getConstrIndex(site) {
		return 1;
	}

	get path() {
		return "__helios__stakingcredential__ptr";
	}
}

/**
 * Builtin Time type. Opaque alias of Int representing milliseconds since 1970
 */
export class TimeType extends BuiltinType {
	toString() {
		return "Time";
	}

	/**
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "__add":
				return Instance.new(new FuncType([this, new DurationType()], new TimeType()));
			case "__sub":
				return Instance.new(new FuncType([this, new TimeType()], new DurationType()));
			case "__sub_alt":
				return Instance.new(new FuncType([this, new DurationType()], new TimeType()));
			case "__geq":
			case "__gt":
			case "__leq":
			case "__lt":
				return Instance.new(new FuncType([this, new TimeType()], new BoolType()));
			case "new":
				return Instance.new(new FuncType([new IntType()], this));
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "show":
				return Instance.new(new FuncType([], new StringType()));
			default:
				return super.getInstanceMember(name);
		}
	}

	get path() {
		return "__helios__time";
	}

	/**
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		return Time;
	}
}

/**
 * Builtin Duration type
 * @package
 */
export class DurationType extends BuiltinType {
	toString() {
		return "Duration";
	}

	/**
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "__add":
			case "__sub":
			case "__mod":
				return Instance.new(new FuncType([this, new DurationType()], new DurationType()));
			case "__mul":
			case "__div":
				return Instance.new(new FuncType([this, new IntType()], new DurationType()));
			case "__div_alt":
				return Instance.new(new FuncType([this, new DurationType()], new IntType()));
			case "__geq":
			case "__gt":
			case "__leq":
			case "__lt":
				return Instance.new(new FuncType([this, new DurationType()], new BoolType()));
			case "new":
				return Instance.new(new FuncType([new IntType()], this));
			case "SECOND":
			case "MINUTE":
			case "HOUR":
			case "DAY":
			case "WEEK":
				return Instance.new(this)
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			default:
				return super.getInstanceMember(name);
		}
	}

	get path() {
		return "__helios__duration";
	}

	get userType() {
		return Duration;
	}
}

/**
 * Builtin TimeRange type
 * @package
 */
export class TimeRangeType extends BuiltinType {
	toString() {
		return "TimeRange";
	}
	/**
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "new":
				return Instance.new(new FuncType([new TimeType(), new TimeType()], new TimeRangeType()));
			case "ALWAYS":
				return Instance.new(new TimeRangeType());
			case "NEVER":
				return Instance.new(new TimeRangeType());
			case "from":
				return Instance.new(new FuncType([new TimeType()], new TimeRangeType()));
			case "to":
				return Instance.new(new FuncType([new TimeType()], new TimeRangeType()));
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "is_before": // is_before condition never overlaps with contains
			case "is_after": // is_after condition never overlaps with contains
			case "contains":
				return Instance.new(new FuncType([new TimeType()], new BoolType()));
			case "start":
			case "end":
				return Instance.new(new TimeType());
			case "show":
				return Instance.new(new FuncType([], new StringType()));
			default:
				return super.getInstanceMember(name);
		}
	}

	get path() {
		return "__helios__timerange";
	}
}

/**
 * Builtin AssetClass type
 * @package
 */
export class AssetClassType extends BuiltinType {
	toString() {
		return "AssetClass";
	}

	/**
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "ADA":
				return Instance.new(new AssetClassType());
			case "new":
				return Instance.new(new FuncType([new MintingPolicyHashType(), new ByteArrayType()], new AssetClassType()));
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "mph":
				return Instance.new(new MintingPolicyHashType());
			case "token_name":
				return Instance.new(new ByteArrayType());
			default:
				return super.getInstanceMember(name);
		}
	}

	get path() {
		return "__helios__assetclass";
	}

	/**
	 * @package
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		return AssetClass;
	}
}

/**
 * Builtin money Value type
 * @package
 */
export class ValueType extends BuiltinType {
	toString() {
		return "Value";
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {EvalEntity}
	 */
	getTypeMember(name) {
		switch (name.value) {
			case "__add":
			case "__sub":
				return Instance.new(new FuncType([this, new ValueType()], new ValueType()));
			case "__mul":
			case "__div":
				return Instance.new(new FuncType([this, new IntType()], new ValueType()));
			case "__geq":
			case "__gt":
			case "__leq":
			case "__lt":
				return Instance.new(new FuncType([this, new ValueType()], new BoolType()));
			case "ZERO":
				return Instance.new(new ValueType());
			case "lovelace":
				return Instance.new(new FuncType([new IntType()], new ValueType()));
			case "new":
				return Instance.new(new FuncType([new AssetClassType(), new IntType()], new ValueType()));
			case "from_map":
				return Instance.new(new FuncType([new MapType(new MintingPolicyHashType(), new MapType(new ByteArrayType(), new IntType()))], new ValueType()));
			default:
				return super.getTypeMember(name);
		}
	}

	/**
	 * @package
	 * @param {Word} name 
	 * @returns {Instance}
	 */
	getInstanceMember(name) {
		switch (name.value) {
			case "contains":
				return Instance.new(new FuncType([new ValueType()], new BoolType()));
			case "is_zero":
				return Instance.new(new FuncType([], new BoolType()));
			case "get":
				return Instance.new(new FuncType([new AssetClassType()], new IntType()));
			case "get_safe":
				return Instance.new(new FuncType([new AssetClassType()], new IntType()));
			case "get_lovelace":
				return Instance.new(new FuncType([], new IntType()));
			case "get_assets":
				return Instance.new(new FuncType([], new ValueType()));
			case "get_policy":
				return Instance.new(new FuncType([new MintingPolicyHashType()], new MapType(new ByteArrayType(), new IntType())));
			case "contains_policy":
				return Instance.new(new FuncType([new MintingPolicyHashType()], new BoolType()));
			case "show":
				return Instance.new(new FuncType([], new StringType()));
			case "to_map":
				return Instance.new(new FuncType([], new MapType(new MintingPolicyHashType(), new MapType(new ByteArrayType(), new IntType()))));
			default:
				return super.getInstanceMember(name);
		}
	}

	/**
	 * @package
	 * @type {string}
	 */
	get path() {
		return "__helios__value";
	}

	/**
	 * @package
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get userType() {
		return Value;
	}
}