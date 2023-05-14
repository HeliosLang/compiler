//@ts-check
// Helios AST statements

import {
    TAB
} from "./config.js";

import {
	assert,
	assertDefined
} from "./utils.js";

import {
	BoolLiteral,
    IR,
    Site,
    Token,
    Word,
	FTPP
} from "./tokens.js";

/**
 * @typedef {import("./tokens.js").IRDefinitions} IRDefinitions
 */

import {
	ConstrData,
	ListData,
	UplcData
} from "./uplc-data.js";

import {
	HeliosData
} from "./helios-data.js";

/**
 * @template {HeliosData} T
 * @typedef {import("./helios-data.js").HeliosDataClass<T>} HeliosDataClass
 */

import {
	ArgType,
    DataEntity,
    FuncType,
	FuncEntity,
	GenericType,
	GenericEnumMemberType,
	ModuleNamespace,
	NamedEntity
} from "./eval-common.js";

/**
 * @typedef {import("./eval-common.js").DataType} DataType
 */

/**
 * @typedef {import("./eval-common.js").EnumMemberType} EnumMemberType
 */

/**
 * @typedef {import("./eval-common.js").EvalEntity} EvalEntity
 */

/**
 * @typedef {import("./eval-common.js").Instance} Instance
 */

/**
 * @typedef {import("./eval-common.js").Parametric} Parametric
 */

/**
 * @typedef {import("./eval-common.js").Type} Type
 */

/**
 * @typedef {import("./eval-common.js").InstanceMembers} InstanceMembers
 */

/**
 * @typedef {import("./eval-common.js").NamespaceMembers} NamespaceMembers
 */

/**
 * @typedef {import("./eval-common.js").TypeMembers} TypeMembers
 */

import {
	BoolType,
	genCommonInstanceMembers,
	genCommonTypeMembers
} from "./eval-primitives.js";

import {
	ParametricFunc
} from "./eval-parametric.js";

import {
    ModuleScope,
    Scope,
    TopScope
} from "./helios-scopes.js";

import {
	CallExpr,
	Expr,
	FuncArg,
    FuncLiteralExpr,
    LiteralDataExpr,
    NameTypePair,
	PathExpr,
    PrimitiveLiteralExpr,
	RefExpr,
    StructLiteralExpr,
	TypeParameters
} from "./helios-ast-expressions.js";

/**
 * Base class for all statements
 * Doesn't return a value upon calling eval(scope)
 * @package
 */
export class Statement extends Token {
	#name;
	#basePath; // set by the parent Module

	/**
	 * @param {Site} site 
	 * @param {Word} name 
	 */
	constructor(site, name) {
		super(site);
		this.#name = name;
		this.#basePath = "__user";
	}

	/**
	 * @type {Word}
	 */
	get name() {
		return this.#name;
	}

	/**
	 * @type {string}
	 */
	get path() {
		return `${this.#basePath}__${this.name.toString()}`;
	}

	/**
	 * @param {ModuleScope} scope 
	 */
	eval(scope) {
		throw new Error("not yet implemented");
	}

	/**
	 * @param {string} namespace 
	 * @param {(name: string, cs: ConstStatement) => void} callback 
	 */
	loopConstStatements(namespace, callback) {
		throw new Error("not yet implemented");
	}

	/**
	 * @param {string} basePath 
	 */
	setBasePath(basePath) {
		this.#basePath = basePath;
	}

	/**
	 * Returns IR of statement.
	 * No need to specify indent here, because all statements are top-level
	 * @param {IRDefinitions} map 
	 */
	toIR(map) {
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
 * Each field in `import {...} from <ModuleName>` is given a separate ImportFromStatement
 * @package
 */
export class ImportFromStatement extends Statement {
	#origName;
	#moduleName;

	/**
	 * @param {Site} site 
	 * @param {Word} name
	 * @param {Word} origName
	 * @param {Word} moduleName
	 */
	constructor(site, name, origName, moduleName) {
		super(site, name);
		this.#origName = origName;
		this.#moduleName = moduleName;
	}

	/**
	 * @type {Word}
	 */
	get moduleName() {
		return this.#moduleName;
	}

	/**
	 * @param {ModuleScope} scope
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		let importedScope = scope.getScope(this.#moduleName);

		let importedEntity = importedScope.get(this.#origName);

		if (importedEntity instanceof Scope) {
			throw this.#origName.typeError(`can't import a module from a module`);
		} else {
			return importedEntity;
		}
	}

	/**
	 * @param {ModuleScope} scope 
	 */
	eval(scope) {
		const v = this.evalInternal(scope);

		scope.set(this.name, v);
	}

	/**
	 * Do nothing
	 * @param {string} namespace 
	 * @param {(name: string, cs: ConstStatement) => void} callback 
	 */
	loopConstStatements(namespace, callback) {
	}

	/**
	 * @param {IRDefinitions} map 
	 */
	toIR(map) {
		// import statements only have a scoping function and don't do anything to the IR
	}
}

/**
 * `import <ModuleName>`
 * @package
 */
export class ImportModuleStatement extends Statement {
	/**
	 * @type {Map<string, EvalEntity>}
	 */
	#imported;

	/**
	 * @param {Site} site 
	 * @param {Word} moduleName
	 */
	constructor(site, moduleName) {
		super(site, moduleName);
		this.#imported = new Map();
	}

	/**
	 * @type {Word}
	 */
	get moduleName() {
		return this.name;
	}

	/**
	 * @param {ModuleScope} scope
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		let importedScope = scope.getScope(this.name);
		
		/**
		 * @type {NamespaceMembers}
		 */
		const namespaceMembers = {};

		for (let [name, entity] of importedScope.values) {
			if (!(entity instanceof Scope)) {
				namespaceMembers[name.value] = entity;
			}
		}

		return new ModuleNamespace(namespaceMembers);
	}

	/**
	 * @param {ModuleScope} scope 
	 */
	eval(scope) {
		let v = this.evalInternal(scope);

		scope.set(this.name, v);
	}

	/**
	 * Do nothing
	 * @param {string} namespace 
	 * @param {(name: string, cs: ConstStatement) => void} callback 
	 */
	loopConstStatements(namespace, callback) {
	}

	/**
	 * @param {IRDefinitions} map 
	 */
	toIR(map) {
		// import statements only have a scoping function and don't do anything to the IR
	}
}

/**
 * Const value statement
 * @package
 */
export class ConstStatement extends Statement {
	/**
	 * @type {null | Expr}
	 */
	#typeExpr;

	/**
	 * @type {Expr}
	 */
	#valueExpr;

	/**
	 * @param {Site} site 
	 * @param {Word} name 
	 * @param {null | Expr} typeExpr - can be null in case of type inference
	 * @param {Expr} valueExpr 
	 */
	constructor(site, name, typeExpr, valueExpr) {
		super(site, name);
		this.#typeExpr = typeExpr;
		this.#valueExpr = valueExpr;
	}

	/**
	 * @type {DataType}
	 */
	get type() {
		if (this.#typeExpr === null) {
			return assertDefined(this.#valueExpr.cache?.asTyped?.type?.asDataType, this.#valueExpr.cache?.toString() ?? this.#valueExpr.toString());
		} else {
			return assertDefined(this.#typeExpr.cache?.asDataType, this.#typeExpr.cache?.toString() ?? this.#typeExpr.toString());
		}
	}

	/**
	 * Include __const prefix in path so that mutual recursion injection isn't applied
	 * @type {string}
	 */
	get path() {
		return `__const${super.path}`;
	}

	/**
	 * Use this to change a value of something that is already typechecked.
	 * @param {UplcData} data
	 */
	changeValueSafe(data) {
		const type = this.type;
		const site = this.#valueExpr.site;

		this.#valueExpr = new LiteralDataExpr(site, type, data);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `const ${this.name.toString()}${this.#typeExpr === null ? "" : ": " + this.#typeExpr.toString()} = ${this.#valueExpr.toString()};`;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {DataType}
	 */
	evalType(scope) {
		if (this.#typeExpr) {
			return this.#typeExpr.evalAsDataType(scope);
		} else {
			const type = this.#valueExpr.evalAsTyped(scope).type.asDataType;

			if (!type) {
				throw this.#valueExpr.typeError("not a data type");
			}

			return type;
		}
	}

	/**
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		const value = this.#valueExpr.evalAsTyped(scope);

		if (this.#typeExpr === null) {
			if (!this.#valueExpr.isLiteral()) {
				throw this.typeError(`can't infer type of ${this.#valueExpr.toString()}`);
			}

			return value;
		} else {
			const type = this.#typeExpr.evalAsDataType(scope);

			if (!type.isBaseOf(value.type)) {
				throw this.#valueExpr.typeError("wrong type");
			}

			return new DataEntity(type);
		}
	}

	/**
	 * Evaluates rhs and adds to scope
	 * @param {TopScope} scope 
	 */
	eval(scope) {
		scope.set(this.name, new NamedEntity(this.name.value, this.path, this.evalInternal(scope)));
	}

	/**
	 * @param {string} namespace 
	 * @param {(name: string, cs: ConstStatement) => void} callback 
	 */
	loopConstStatements(namespace, callback) {
		callback(`${namespace}${this.name.value}`, this);
	}

	/**
	 * @returns {IR}
	 */
	toIRInternal() {
		let ir = this.#valueExpr.toIR();

		if (this.#valueExpr instanceof LiteralDataExpr) {
			ir = new IR([
				new IR(`${this.#valueExpr.type.path}__from_data`),
				new IR("("),
				ir,
				new IR(")")
			]);
		}

		return new IR([
			new IR("const(", this.site),
			ir,
			new IR(")")
		]);
	}

	/**
	 * @param {IRDefinitions} map 
	 */
	toIR(map) {
		map.set(this.path, this.toIRInternal());
	}
}

/**
 * Single field in struct or enum member
 * @package
 */
export class DataField extends NameTypePair {
	/**
	 * @param {Word} name 
	 * @param {Expr} typeExpr 
	 */
	constructor(name, typeExpr) {
		super(name, typeExpr);
	}

	/**
	 * Throws an error if called before evalType()
	 * @type {DataType}
	 */
	get type() {
		return assertDefined(super.type.asDataType);
	}
}

/**
 * Base class for struct and enum member
 * @package
 */
export class DataDefinition extends Statement {
	#fields;

	/**
	 * @param {Site} site 
	 * @param {Word} name 
	 * @param {DataField[]} fields 
	 */
	constructor(site, name, fields) {
		super(site, name);
		this.#fields = fields;
	}

	/**
	 * @type {DataType}
	 */
	get type() {
		throw new Error("not yet implemented");
	}

	get fields() {
		return this.#fields.slice();
	}

	/**
	 * Returns index of a field.
	 * Returns -1 if not found.
	 * @param {Word} name 
	 * @returns {number}
	 */
	findField(name) {
		let found = -1;
		let i = 0;
		for (let f of this.#fields) {
			if (f.name.toString() == name.toString()) {
				found = i;
				break;
			}
			i++;
		}

		return found;
	}

	/**
	 * @type {string[]}
	 */
	get fieldNames() {
		return this.#fields.map(f => f.name.value);
	}

	/**
	 * @param {Word} name 
	 * @returns {boolean}
	 */
	hasField(name) {
		return this.findField(name) != -1;
	}

	/**
	 * @param {Word} name 
	 * @returns {boolean}
	 */
	hasMember(name) {
		return this.hasField(name) || name.value == "copy";
	}

	/**
	 * @returns {string}
	 */
	toStringFields() {
		return `{${this.#fields.map(f => f.toString()).join(", ")}}`;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `${this.name.toString()} ${this.toStringFields()}`;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {InstanceMembers}
	 */
	evalFieldTypes(scope) {
		/**
		 * @type {InstanceMembers}
		 */
		const fields = {};

		for (let f of this.#fields) {
			const fieldType = f.evalType(scope).asDataType;

			if (!fieldType) {
				throw f.site.typeError("field can't be function type");
			}

			fields[f.name.value] = fieldType;
		}

		return fields;
	}

	/**
	 * @type {number}
	 */
	get nFields() {
		return this.#fields.length;
	}

	/**
	 * @param {number} i 
	 * @returns {DataType}
	 */
	getFieldType(i) {
		return this.#fields[i].type;
	}

	/**
	 * @param {string} name 
	 * @returns {number}
	 */
	getFieldIndex(name) {
		const i = this.findField(new Word(Site.dummy(), name));

		if (i == -1) {
			throw new Error(`field ${name} not find in ${this.toString()}`);
		} else {
			return i;
		}
	}

	/**
	 * @param {number} i
	 * @returns {string}
	 */
	getFieldName(i) {
		return this.#fields[i].name.toString();
	}
	
	/**
	 * @param {Site} site 
	 * @returns {number}
	 */
	nEnumMembers(site) {
		throw site.typeError(`'${this.name.value}' isn't an enum type`);
	}


	/**
	 * Gets insance member value.
	 * @param {Type} self
	 * @returns {InstanceMembers}
	 */
	genInstanceMembers(self) {
		const members = {
			...genCommonInstanceMembers(self),
			copy: new FuncType(this.#fields.map(f => new ArgType(f.name, f.type, true)), this.type),
		};

		for (let f of this.fields) {
			members[f.name.value] = f.type;
		}

		return members;
	}

	/**
	 * @param {Type} self
	 * @returns {TypeMembers}
	 */
	genTypeMembers(self) {
		return {
			...genCommonTypeMembers(self)
		};
	}

	/**
	 * 
	 * @param {IRDefinitions} map 
	 */
	newToIR(map) {
		/**
		 * @type {IR}
		 */
		let ir;

		if (this.nFields == 1) {
			ir = new IR("__helios__common__identity");
		} else {
			ir = new IR([
				new IR("__core__mkNilData"),
				new IR("(())")
			]);

			for (let i = this.nFields - 1; i >= 0; i--) {
				const f = this.#fields[i];

				ir = new IR([
					new IR("__core__mkCons"),
					new IR("("), new IR(`${f.type.path}____to_data`), new IR("("), new IR(f.name.value), new IR("), "),
					ir,
					new IR(")")
				]);
			}

			// wrap as function
			ir = new IR([
				new IR("("),
				new IR(this.#fields.map(f => new IR(f.name.value))).join(", "),
				new IR(") -> {"),
				ir,
				new IR("}")
			]);
		}

		const key = `${this.path}____new`;

		map.set(key, ir);
	}

	/**
	 * @package
	 * @param {IRDefinitions} map 
	 * @param {string[]} getterNames
	 * @param {number} constrIndex
	 */
	copyToIR(map, getterNames, constrIndex = -1) {
		const key = `${this.path}__copy`;

		let ir = StructLiteralExpr.toIRInternal(this.site, this.path, this.#fields.map(df => new IR(df.name.value)));

		// wrap with defaults

		for (let i = getterNames.length - 1; i >= 0; i--) {
			const fieldName = this.#fields[i].name.toString();

			ir = FuncArg.wrapWithDefaultInternal(ir, fieldName, new IR([
				new IR(getterNames[i]),
				new IR("(self)")
			]))
		}

		ir = new IR([
			new IR("("), new IR("self"), new IR(") -> {"),
			new IR("("),
			new IR(this.#fields.map(f => new IR([
				new IR(`__useopt__${f.name.toString()}`),
				new IR(", "),
				new IR(`${f.name.toString()}`)
			]))).join(", "),
			new IR(") -> {"),
			ir,
			new IR("}"),
			new IR("}")
		]);

		map.set(key, ir);
	}

	/**
	 * Doesn't return anything, but sets its IRdef in the map
	 * @param {IRDefinitions} map
	 * @param {boolean} isConstr
	 */
	toIR(map, isConstr = true) {
		const getterBaseName = isConstr ? "__helios__common__field" : "__helios__common__tuple_field";

		/**
		 * @type {string[]}
		 */
		const getterNames = [];

		if (this.fields.length == 1) {
			const f = this.fields[0];
			const key = `${this.path}__${f.name.toString()}`;

			const getter = new IR("__helios__common__identity", f.site);
			
			map.set(key, getter);
			getterNames.push(key);
		} else {
			// add a getter for each field
			for (let i = 0; i < this.#fields.length; i++) {
				let f = this.#fields[i];
				let key = `${this.path}__${f.name.toString()}`;
				getterNames.push(key);

				/**
				 * @type {IR}
				 */
				let getter;

				if (i < 20) {
					getter = new IR(`${getterBaseName}_${i}`, f.site);

					getter = new IR([
						new IR("("), new IR("self"), new IR(") "), 
						new IR("->", f.site), 
						new IR(" {"), 
						new IR(`${f.type.path}__from_data`), new IR("("),
						new IR(`${getterBaseName}_${i}`), new IR("("), new IR("self"), new IR(")"),
						new IR(")"),
						new IR("}"),
					]);
				} else {
					let inner = new IR("self");

					if (isConstr) {
						inner = new IR([
							new IR("__core__sndPair"),
							new IR("("),
							new IR("__core__unConstrData"), new IR("("), inner, new IR(")"),
							new IR(")")
						]);
					}

					for (let j = 0; j < i; j++) {
						inner = new IR([
							new IR("__core__tailList"), new IR("("), inner, new IR(")")
						]);
					}

					inner = new IR([
						new IR("__core__headList"), new IR("("), inner, new IR(")")
					]);

					inner = new IR([
						new IR(`${f.type.path}__from_data`), new IR("("), inner, new IR(")")
					]);

					getter = new IR([
						new IR("("), new IR("self"), new IR(") "), 
						new IR("->", f.site), 
						new IR(" {"),
						inner,
						new IR("}"),
					]);
				}

				map.set(key, getter)
			}
		}

		this.newToIR(map);
		this.copyToIR(map, getterNames);
	}
}

/**
 * Struct statement
 * @package
 */
export class StructStatement extends DataDefinition {
	#parameters;
	#impl;

	/**
	 * @param {Site} site
	 * @param {Word} name
	 * @param {TypeParameters} parameters
	 * @param {DataField[]} fields 
	 * @param {ImplDefinition} impl
	 */
	constructor(site, name, parameters, fields, impl) {
		super(site, name, fields);

		this.#parameters = parameters;
		this.#impl = impl;
	}

	/**
	 * @param {string} basePath 
	 */
	setBasePath(basePath) {
		super.setBasePath(basePath);

		this.#impl.setBasePath(this.path);
	}

	/**
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get offChainType() {
		const statement = this;

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
				if (args.length != statement.nFields) {
					throw new Error(`expected ${statement.nFields} args, got ${args.length}`);
				}

				this.#fields = [];

				args.forEach((arg, i) => {
					const fieldName = statement.getFieldName(i);
					const fieldType = statement.getFieldType(i);

					const FieldClass = assertDefined(fieldType.offChainType);

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
			 * @type {StructStatement}
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

				if (dataItems.length != statement.nFields) {
					throw new Error("unexpected number of fields");
				}

				const args = dataItems.map((item, i) => {
					return assertDefined(statement.getFieldType(i).offChainType).fromUplcData(item);
				});

				return new Struct(...args);
			}
		}

		Object.defineProperty(Struct, "name", {value: this.name, writable: false});		

		return Struct;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `struct ${this.name.toString()}${this.#parameters.toString()} ${this.toStringFields()}`;
	}

	/**
	 * Evaluates own type and adds to scope
	 * @param {TopScope} scope 
	 */
	eval(scope) {
		// first evaluate the type using a shell type of self
		const shell = new GenericType({
			fieldNames: this.fields.map(f => f.name.value),
			name: this.name.value,
			path: this.path,
			genInstanceMembers: (self) => ({}),
			genTypeMembers: (self) => ({})
		});

		const typeScope = new Scope(scope);
		typeScope.set(this.name, shell);

		const fields = super.evalFieldTypes(typeScope);

		const [instanceMembers, typeMembers] = this.#impl.evalTypes(typeScope);

		const full = new GenericType({
			fieldNames: this.fields.map(f => f.name.value),
			name: this.name.value,
			path: this.path,
			offChainType: this.offChainType,
			genInstanceMembers: (self) => ({
				...genCommonInstanceMembers(self),
				...fields,
				...instanceMembers
			}),
			genTypeMembers: (self) => ({
				...genCommonTypeMembers(self),
				...typeMembers
			})
		});

		// add before so recursive types are possible
		scope.set(this.name, full);

		// full type evaluation of function bodies
		this.#impl.eval(scope);
	}

	/**
	 * @param {string} namespace 
	 * @param {(name: string, cs: ConstStatement) => void} callback 
	 */
	loopConstStatements(namespace, callback) {
		this.#impl.loopConstStatements(`${namespace}${this.name.value}::`, callback);
	}

	/**
	 * @param {IRDefinitions} map
	 */
	toIR(map) {
		super.toIR(map, false);

		const implPath = this.fieldNames.length == 1 ? this.getFieldType(0).path : "__helios__tuple";

		map.set(`${this.path}____eq`, new IR(`${implPath}____eq`, this.site));
		map.set(`${this.path}____neq`, new IR(`${implPath}____neq`, this.site));
		map.set(`${this.path}__serialize`, new IR(`${implPath}__serialize`, this.site));
		map.set(`${this.path}__from_data`, new IR(`${implPath}__from_data`, this.site));
		map.set(`${this.path}____to_data`, new IR(`${implPath}____to_data`, this.site));

		this.#impl.toIR(map);
	}
}

/**
 * Function statement
 * (basically just a named FuncLiteralExpr)
 * @package
 */
export class FuncStatement extends Statement {
	#funcExpr;

	/**
	 * @param {Site} site 
	 * @param {Word} name 
	 * @param {FuncLiteralExpr} funcExpr 
	 */
	constructor(site, name, funcExpr) {
		super(site, name);
		this.#funcExpr = funcExpr;
	}

	/**
	 * @type {Type[]}
	 */
	get argTypes() {
		return this.#funcExpr.argTypes;
	}

	/**
	 * @type {string[]}
	 */
	get argTypeNames() {
		return this.#funcExpr.argTypeNames;
	}

	/**
	 * @type {Type[]}
	 */
	get retTypes() {
		return this.#funcExpr.retTypes;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `func ${this.name.toString()}${this.#funcExpr.toString()}`;
	}

	/**
	 * Evaluates a function and returns a func value
	 * @param {Scope} scope 
	 * @returns {EvalEntity}
	 */
	evalInternal(scope) {
		return this.#funcExpr.evalInternal(scope);
	}

	/**
	 * Evaluates type of a funtion.
	 * Separate from evalInternal so we can use this function recursively inside evalInternal
	 * @param {Scope} scope 
	 * @returns {FuncType}
	 */
	evalType(scope) {
		return this.#funcExpr.evalType(scope);
	}

	/**
	 * @param {Scope} scope 
	 */
	eval(scope) {
		// add to scope before evaluating, to allow recursive calls

		let fnType = this.evalType(scope);

		let fnVal = this.#funcExpr.hasParameters() ?
			new ParametricFunc(this.#funcExpr.parameters, fnType) :
			new FuncEntity(fnType);

		scope.set(this.name, new NamedEntity(this.name.value, this.path, fnVal));

		void this.#funcExpr.evalInternal(scope);
	}

	/**
	 * Do nothing
	 * @param {string} namespace 
	 * @param {(name: string, cs: ConstStatement) => void} callback 
	 */
	loopConstStatements(namespace, callback) {
	}

	/**
	 * Returns IR of function
	 * @returns {IR}
	 */
	toIRInternal() {
		return this.#funcExpr.toIR(TAB);
	}

	/**
	 * @param {IRDefinitions} map 
	 */
	toIR(map) {
		let key = this.path
		
		if (this.#funcExpr.parameters.length > 0) {
			key = key + `[${this.#funcExpr.parameters.map((_, i) => `${FTPP}${i}`).join("@")}]`;
		}

		map.set(key, this.toIRInternal());
	}

	/**
	 * @param {Statement} s 
	 * @returns {boolean}
	 */
	static isMethod(s) {
		if (s instanceof FuncStatement) {
			return s.#funcExpr.isMethod();
		} else {
			return false;
		}
	}
}

/**
 * EnumMember defintion is similar to a struct definition
 * @package
 */
export class EnumMember extends DataDefinition {
	/** @type {null | EnumStatement} */
	#parent;

	/** @type {?number} */
	#constrIndex;

	/**
	 * @param {Word} name
	 * @param {DataField[]} fields
	 */
	constructor(name, fields) {
		super(name.site, name, fields);
		this.#parent = null; // registered later
		this.#constrIndex = null;
	}

	/**
	 * @returns {number}
	 */
	get constrIndex() {
		if (this.#constrIndex === null) {
			throw new Error("constrIndex not set");
		} else {
			return this.#constrIndex;
		}
	}

	/** 
	 * @param {EnumStatement} parent
	 * @param {number} i
	*/
	registerParent(parent, i) {
		this.#parent = parent;
		this.#constrIndex = i;
	}
	
	/**
	 * @type {EnumStatement}
	 */
	get parent() {
		if (this.#parent === null) {
			throw new Error("parent not yet registered");
		} else {
			return this.#parent;
		}
	}

	/**
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get offChainType() {
		const statement = this;

		const enumStatement = statement.parent;

		const index = statement.constrIndex;

		const nFields = statement.nFields;

		/**
		 * @type {[string, DataType][]} - [name, type]
		 */
		const fields = [];

		for (let i = 0; i < nFields; i++) {
			fields.push([statement.getFieldName(i), statement.getFieldType(i)]);
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
					const FieldClass = assertDefined(fieldType.offChainType);

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
			 * @type {EnumStatement}
			 */
			get _enumStatement() {
				return enumStatement;
			}

			/**
			 * @type {EnumMember}
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
					return assertDefined(fields[i][1].offChainType).fromUplcData(item);
				});

				return new EnumVariant(...args);
			}
		}

		Object.defineProperty(EnumVariant, "name", {value: this.name, writable: false});

		return EnumVariant;

	}

	/**
	 * @param {Scope} scope 
	 * @returns {(parent: DataType) => EnumMemberType}
	 */
	evalType(scope) {
		if (this.#parent === null) {
			throw new Error("parent should've been registered");
		}

		const instanceMembers = super.evalFieldTypes(scope); // the internally created type isn't be added to the scope. (the parent enum type takes care of that)

		return (parent) => new GenericEnumMemberType({
			name: this.name.value,
			path: this.path,
			constrIndex: this.constrIndex,
			offChainType: this.offChainType,
			parentType: parent,
			fieldNames: this.fieldNames,
			genInstanceMembers: (self) => ({
				...genCommonInstanceMembers(self),
				...instanceMembers
			}),
			genTypeMembers: (self) => ({
				...genCommonTypeMembers(self),
			})
		});
	}

	get path() {
		return `${this.parent.path}__${this.name.toString()}`;
	}

	/**
	 * @param {IRDefinitions} map 
	 */
	toIR(map) {
		super.toIR(map);

		map.set(`${this.path}____eq`, new IR("__helios__common____eq", this.site));
		map.set(`${this.path}____neq`, new IR("__helios__common____neq", this.site));
		map.set(`${this.path}__serialize`, new IR("__helios__common__serialize", this.site));
		map.set(`${this.path}__from_data`, new IR(`(data) -> {
			__helios__common__assert_constr_index(data, ${this.constrIndex})
		}`, this.site));
		map.set(`${this.path}____to_data`, new IR("__helios__common__identity", this.site));
	}
}

/**
 * Enum statement, containing at least one member
 * @package
 */
export class EnumStatement extends Statement {
	#parameters;
	#members;
	#impl;

	/**
	 * @param {Site} site 
	 * @param {Word} name 
	 * @param {TypeParameters} parameters
	 * @param {EnumMember[]} members 
	 * @param {ImplDefinition} impl
	 */
	constructor(site, name, parameters, members, impl) {
		super(site, name);
		this.#parameters = parameters;
		this.#members = members;
		this.#impl = impl;
		
		for (let i = 0; i < this.#members.length; i++) {
			this.#members[i].registerParent(this, i);
		}
	}

	/**
	 * @param {string} basePath 
	 */
	setBasePath(basePath) {
		super.setBasePath(basePath);

		this.#impl.setBasePath(this.path);
	}

	/**
	 * @package
	 * @type {HeliosDataClass<HeliosData>}
	 */
	get offChainType() {
		const statement = this;

		const nVariants = statement.nEnumMembers;

		/**
		 * @type {HeliosDataClass<HeliosData>[]}
		 */
		const variants = [];

		for (let i = 0; i < nVariants; i++) {
			variants.push(this.#members[i].offChainType);
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
			 * @type {EnumStatement}
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

	/**
	 * Returns index of enum member.
	 * Returns -1 if not found
	 * @param {Word} name 
	 * @returns {number}
	 */
	// returns an index
	findEnumMember(name) {
		let found = -1;
		let i = 0;
		for (let member of this.#members) {
			if (member.name.toString() == name.toString()) {
				found = i;
				break;
			}
			i++;
		}

		return found;
	}

	/**
	 * @param {number} i
	 * @returns {EnumMember}
	 */
	getEnumMember(i) {
		return assertDefined(this.#members[i]);
	}

	/**
	 * @param {Word} name
	 * @returns {boolean}
	 */
	hasEnumMember(name) {
		return this.findEnumMember(name) != -1;
	}

	/**
	 * @returns {number}
	 */
	get nEnumMembers() {
		return this.#members.length;
	}

	/**
	 * @param {Type} self 
	 * @returns {TypeMembers}
	 */
	genEnumMemberShellTypes(self) {
		/**
		 * @type {TypeMembers}
		 */
		const types = {};

		for (let member of this.#members) {
			types[member.name.value] = new GenericEnumMemberType({
				constrIndex: member.constrIndex,
				name: member.name.value,
				path: member.path,
				parentType: assertDefined(self.asDataType),
				genInstanceMembers: (self) => ({}),
				genTypeMembers: (self) => ({})
			});
		}

		return types
	}

	/**
	 * @param {Scope} scope 
	 */
	eval(scope) {
		// first set the shell type
		const shell = new GenericType({
			name: this.name.value,
			path: this.path,
			genInstanceMembers: (self) => ({}),
			genTypeMembers: (self) => this.genEnumMemberShellTypes(self)
		});

		// the scope that is used for type evaluation
		const subScope = new Scope(scope);
		subScope.set(this.name, shell);

		/**
		 * @type {{[name: string]: (parent: DataType) => EnumMemberType}}
		 */
		const genFullMembers = {};

		this.#members.forEach(m => {
			genFullMembers[m.name.value] =m.evalType(subScope);
		});

		const [instanceMembers, typeMembers] = this.#impl.evalTypes(subScope);

		const full = new GenericType({
			name: this.name.value,
			path: this.path,
			offChainType: this.offChainType,
			genInstanceMembers: (self) => ({
				...genCommonInstanceMembers(self),
				...instanceMembers
			}),
			genTypeMembers: (self) => {
				const typeMembers_ = {
					...genCommonTypeMembers(self),
					...typeMembers
				};
				
				// TODO: detect duplicates
				for (let memberName in genFullMembers) {
					typeMembers_[memberName] = genFullMembers[memberName](assertDefined(self.asDataType))
				}

				return typeMembers_
			}
		});
		
		scope.set(this.name, full);

		this.#impl.eval(scope);
	}

	/**
	 * @param {string} namespace 
	 * @param {(name: string, cs: ConstStatement) => void} callback 
	 */
	loopConstStatements(namespace, callback) {
		this.#impl.loopConstStatements(`${namespace}${this.name.value}::`, callback);
	}

	/**
	 * @param {IRDefinitions} map 
	 */
	toIR(map) {
		for (let member of this.#members) {
			member.toIR(map);
		}

		map.set(`${this.path}____eq`, new IR("__helios__common____eq", this.site));
		map.set(`${this.path}____neq`, new IR("__helios__common____neq", this.site));
		map.set(`${this.path}__serialize`, new IR("__helios__common__serialize", this.site));
		map.set(`${this.path}__from_data`, new IR("__helios__common__identity", this.site));
		map.set(`${this.path}____to_data`, new IR("__helios__common__identity", this.site));

		this.#impl.toIR(map);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `enum ${this.name.toString()}${this.#parameters.toString()} {${this.#members.map(m => m.toString()).join(", ")}}`;
	}
}

/**
 * Impl statements, which add functions and constants to registry of user types (Struct, Enum Member and Enums)
 * @package
 */
export class ImplDefinition {
	#selfTypeExpr;
	#statements;

	/**
	 * @param {RefExpr} selfTypeExpr;
	 * @param {(FuncStatement | ConstStatement)[]} statements 
	 */
	constructor(selfTypeExpr, statements) {
		this.#selfTypeExpr = selfTypeExpr;
		this.#statements = statements;
	}

	/**
	 * @param {string} basePath 
	 */
	setBasePath(basePath) {
		for (let s of this.#statements) {
			s.setBasePath(basePath);
		}
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `${this.#statements.map(s => s.toString()).join("\n")}`;
	}

	/**
	 * Doesn't add the common types
	 * @param {Scope} scope 
	 * @returns {[InstanceMembers, TypeMembers]}
	 */
	evalTypes(scope) {
		/**
		 * @type {InstanceMembers}
		 */
		const instanceMembers = {};

		/**
		 * @type {TypeMembers}
		 */
		const typeMembers = {};

		for (let s of this.#statements) {
			if (FuncStatement.isMethod(s)) {
				instanceMembers[s.name.value] = s.evalType(scope);
			} else if (s instanceof ConstStatement) {
				typeMembers[s.name.value] = s.evalType(scope).toTyped();
			} else {
				typeMembers[s.name.value] = s.evalType(scope);
			}
		}

		return [instanceMembers, typeMembers];
	}

	/**
	 * @param {Scope} scope 
	 */
	eval(scope) {
		void this.#selfTypeExpr.eval(scope);

		for (let s of this.#statements) {
			void s.evalInternal(scope);
		}
	}

	/**
	 * @param {string} namespace 
	 * @param {(name: string, cs: ConstStatement) => void} callback 
	 */
	loopConstStatements(namespace, callback) {
		for (let s of this.#statements) {
			s.loopConstStatements(namespace, callback);
		}
	}
	
	/**
	 * Returns IR of all impl members
	 * @param {IRDefinitions} map 
	 */
	toIR(map) {


		for (let s of this.#statements) {
			map.set(s.path, s.toIRInternal());
		}
	}
}