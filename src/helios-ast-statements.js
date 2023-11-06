//@ts-check
// Helios AST statements

import {
	config,
    TAB
} from "./config.js";

import {
	assert,
	assertDefined,
	bytesToHex,
	textToBytes
} from "./utils.js";

import {
    IR,
    Site,
    Token,
    Word,
	FTPP,
	TTPP,
	IRParametricName,
	StringLiteral
} from "./tokens.js";

/**
 * @typedef {import("./tokens.js").IRDefinitions} IRDefinitions
 */

import {
	ConstrData,
	ListData,
	IntData,
	MapData,
	UplcData,
	ByteArrayData
} from "./uplc-data.js";

import {
	HeliosData
} from "./helios-data.js";

/**
 * @template {HeliosData} T
 * @typedef {import("./helios-data.js").HeliosDataClass<T>} HeliosDataClass
 */

import {
	AllType,
	ArgType,
    DataEntity,
    FuncType,
	GenericType,
	GenericEnumMemberType,
	ModuleNamespace,
	NamedEntity,
	AnyType,
} from "./eval-common.js";

/**
 * @typedef {import("./eval-common.js").InferenceMap} InferenceMap
 */

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
 * @typedef {import("./eval-common.js").TypeClass} TypeClass
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

/**
 * @typedef {import("./eval-common.js").NamedTypeSchema} NamedTypeSchema
 */

/** 
 * @template {HeliosData} T
 * @typedef {import("./eval-common.js").GenericTypeProps<T>} GenericTypeProps
 */

/**
 * @typedef {import("./eval-common.js").JsToUplcHelpers} JsToUplcHelpers
 */

/**
 * @typedef {import("./eval-common.js").UplcToJsHelpers} UplcToJsHelpers
 */


import {
	genCommonInstanceMembers,
	genCommonTypeMembers,
	genCommonEnumTypeMembers
} from "./eval-primitives.js";

import {
	DefaultTypeClass,
	GenericParametricType,
	GenericParametricEnumMemberType,
	Parameter,
	ParametricFunc, 
	ParametricType
} from "./eval-parametric.js";

import {
    ModuleScope,
    Scope,
    TopScope
} from "./helios-scopes.js";

import {
	ToIRContext
} from "./ir-defs.js";

import {
	Expr,
	FuncArg,
    FuncLiteralExpr,
    LiteralDataExpr,
    NameTypePair,
	RefExpr,
    StructLiteralExpr
} from "./helios-ast-expressions.js";

/**
 * Base class for all statements
 * Doesn't return a value upon calling eval(scope)
 * @internal
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
	 * @param {ToIRContext} ctx
	 * @param {IRDefinitions} map 
	 */
	toIR(ctx, map) {
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
 * @internal
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
	 * @returns {null | EvalEntity}
	 */
	evalInternal(scope) {
		const importedScope = scope.getScope(this.#moduleName);

		if (!importedScope) {
			return null;
		}

		const importedEntity = importedScope.get(this.#origName);

		if (importedEntity instanceof Scope) {
			this.#origName.typeError(`can't import a module from a module`);
			return null;
		} else {
			return importedEntity;
		}
	}

	/**
	 * @param {ModuleScope} scope 
	 */
	eval(scope) {
		const v = this.evalInternal(scope);

		if (v) {
			scope.set(this.name, v);
		}
	}

	/**
	 * Do nothing
	 * @param {string} namespace 
	 * @param {(name: string, cs: ConstStatement) => void} callback 
	 */
	loopConstStatements(namespace, callback) {
	}

	/**
	 * @param {ToIRContext} ctx
	 * @param {IRDefinitions} map 
	 */
	toIR(ctx, map) {
		// import statements only have a scoping function and don't do anything to the IR
	}
}

/**
 * `import <ModuleName>`
 * @internal
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
	 * @returns {null | EvalEntity}
	 */
	evalInternal(scope) {
		const importedScope = scope.getScope(this.name);

		if (!importedScope) {
			return null;
		}
		
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

		if (v) {
			scope.set(this.name, v);
		}
	}

	/**
	 * Do nothing
	 * @param {string} namespace 
	 * @param {(name: string, cs: ConstStatement) => void} callback 
	 */
	loopConstStatements(namespace, callback) {
	}

	/**
	 * @param {ToIRContext} ctx
	 * @param {IRDefinitions} map 
	 */
	toIR(ctx, map) {
		// import statements only have a scoping function and don't do anything to the IR
	}
}

/**
 * Const value statement
 * @internal
 */
export class ConstStatement extends Statement {
	/**
	 * @type {Expr}
	 */
	#typeExpr;

	/**
	 * @type {null | Expr}
	 */
	#valueExpr;

	/**
	 * @param {Site} site 
	 * @param {Word} name 
	 * @param {Expr} typeExpr - can be null in case of type inference
	 * @param {null | Expr} valueExpr 
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
		return assertDefined(this.#typeExpr.cache?.asDataType, this.#typeExpr.cache?.toString() ?? this.#typeExpr.toString());
	}

	/**
	 * Include __const prefix in path so that mutual recursion injection isn't applied
	 * @type {string}
	 */
	get path() {
		return `__const${super.path}`;
	}

	/**
	 * @returns {boolean}
	 */
	isSet() {
		return this.#valueExpr !== null;
	}

	/**
	 * Use this to change a value of something that is already typechecked.
	 * @param {UplcData} data
	 */
	changeValueSafe(data) {
		const type = this.type;
		const site = this.#valueExpr ? this.#valueExpr.site : this.site;

		this.#valueExpr = new LiteralDataExpr(site, type, data);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `const ${this.name.toString()}${this.#typeExpr.toString()}${this.#valueExpr ? ` = ${this.#valueExpr.toString()}` : ""};`;
	}

	/**
	 * @param {Scope} scope 
	 * @returns {null | DataType}
	 */
	evalType(scope) {
		return this.#typeExpr.evalAsDataType(scope);
	}

	/**
	 * @param {Scope} scope 
	 * @returns {null | EvalEntity}
	 */
	evalInternal(scope) {
		const type = this.#typeExpr.evalAsDataType(scope);

		if (!type) {
			return null;
		}

		if (this.#valueExpr) {
			const value = this.#valueExpr.evalAsTyped(scope);

			if (!value) {
				return null;
			}

			if (!type.isBaseOf(value.type)) {
				this.#valueExpr.typeError("wrong type");
				return null;
			}
		}

		return new DataEntity(type);
	}

	/**
	 * Evaluates rhs and adds to scope
	 * @param {TopScope} scope 
	 */
	eval(scope) {
		const data = this.evalInternal(scope);

		if (!data) {
			scope.set(this.name, new NamedEntity(this.name.value, this.path, new DataEntity(new AllType())));
		} else {
			scope.set(this.name, new NamedEntity(this.name.value, this.path, data));
		}
	}

	/**
	 * @param {string} namespace 
	 * @param {(name: string, cs: ConstStatement) => void} callback 
	 */
	loopConstStatements(namespace, callback) {
		callback(`${namespace}${this.name.value}`, this);
	}

	/**
	 * @param {ToIRContext} ctx
	 * @returns {IR}
	 */
	toIRInternal(ctx) {
		let ir = assertDefined(this.#valueExpr).toIR(ctx);

		if (this.#valueExpr instanceof LiteralDataExpr) {
			/*ir = new IR([
				new IR(`${this.#valueExpr.type.path}__from_data`),
				new IR("(", this.site),
				ir,
				new IR(")")
			]);*/

			ir = IR.new`${this.#valueExpr.type.path}__from_data${null}(${this.site}${ir})`;
		}

		return ir;
	}

	/**
	 * @param {ToIRContext} ctx
	 * @param {IRDefinitions} map 
	 */
	toIR(ctx, map) {
		if (this.#valueExpr) {
			map.set(this.path, this.toIRInternal(ctx));
		}
	}
}


/**
 * @internal
 */
export class TypeParameter {
	#name;
	#typeClassExpr;

	/**
	 * @param {Word} name 
	 * @param {null | Expr} typeClassExpr 
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
		if (this.#typeClassExpr) {
			return assertDefined(this.#typeClassExpr.cache?.asTypeClass);
		} else {
			return new DefaultTypeClass();
		}
	}

	/**
	 * @param {Scope} scope 
	 * @param {string} path
	 * @returns {null | Parameter}
	 */
	eval(scope, path) {
		/**
		 * @type {TypeClass}
		 */
		let typeClass = new DefaultTypeClass();

		if (this.#typeClassExpr) {
			const typeClass_ = this.#typeClassExpr.eval(scope);
			if (!typeClass_) {
				return null;
			}

			if (!typeClass_.asTypeClass) {
				this.#typeClassExpr?.typeError("not a typeclass");
				return null;
			} else {
				typeClass = typeClass_.asTypeClass;
			}
		}

		const parameter = new Parameter(this.name, path, typeClass);

		scope.set(this.#name, typeClass.toType(this.#name.value, path, parameter));

		return parameter;
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
}

/**
 * @internal
 */
export class TypeParameters {
	#parameterExprs;
	#prefix;

	/**
	 * @type {null | Parameter[]}
	 */
	#parameters;

	/**
	 * @param {TypeParameter[]} parameterExprs 
	 * @param {boolean} isForFunc
	 */
	constructor(parameterExprs, isForFunc) {
		this.#parameterExprs = parameterExprs;
		this.#prefix = isForFunc ? FTPP : TTPP;
		this.#parameters = null;
	}

	/**
	 * @returns {boolean}
	 */
	hasParameters() {
		return this.#parameterExprs.length > 0;
	}

	/** 
	 * @type {string[]}
	 */
	get parameterNames() {
		return this.#parameterExprs.map(pe => pe.name);
	}

	/**
	 * @returns {Parameter[]}
	 */
	getParameters() {
		return assertDefined(this.#parameters, "parameters not yet evaluated");
	}

	/**
	 * Always include the braces, even if there aren't any type parameters, so that the mutual recursion injection function has an easier time figuring out what can depend on what
	 * @param {string} base
	 * @returns {string}
	 */
	genTypePath(base) {
		return `${base}[${this.#parameterExprs.map((_, i) => `${this.#prefix}${i}`).join("@")}]`;
	}

	/**
	 * Always include the braces, even if there aren't any type parameters, so that the mutual recursion injection function has an easier time figuring out what can depend on what
	 * @param {string} base
	 * @returns {string}
	 */
	genFuncPath(base) {
		if (this.hasParameters()) {
			return this.genTypePath(base);
		} else {
			return base;
		}
	}

	/**
	 * @returns {string}
	 */
	toString() {
		if (!this.hasParameters()) {
			return "";
		} else {
			return `[${this.#parameterExprs.map(p => p.toString()).join(", ")}]`;
		}
	}

	/**
	 * @param {Scope} scope 
	 * @returns {Scope}
	 */
	evalParams(scope) {
		const subScope = new Scope(scope);

		this.#parameters = [];

		this.#parameterExprs.forEach((pe, i) => {
			const p = pe.eval(subScope, `${this.#prefix}${i}`);

			if (p) {
				this.#parameters?.push(p);
			}
		});

		return subScope;
	}

	/**
	 * @param {Scope} scope 
	 * @param {(scope: Scope) => (null | FuncType)} evalConcrete
	 * @returns {null | ParametricFunc | FuncType}
	 */
	evalParametricFuncType(scope, evalConcrete, impl = null) {
		const typeScope = this.evalParams(scope);

		const type = evalConcrete(typeScope);

		if (!type) {
			return null;
		}

		typeScope.assertAllUsed();

		return this.hasParameters() ? new ParametricFunc(this.getParameters(), type) : type;
	}

	/**
	 * @param {Scope} scope 
	 * @param {(scope: Scope) => (null | FuncType)} evalConcrete 
	 * @returns {null | EvalEntity}
	 */
	evalParametricFunc(scope, evalConcrete) {
		const type = this.evalParametricFuncType(scope, evalConcrete);

		if (!type) {
			return null;
		}

		if (type.asType) {
			return type.asType.toTyped();
		} else {
			return type;
		}
	}

	/**
	 * @param {Scope} scope
	 * @param {Site} site
	 * @param {(scope: Scope) => DataType} evalConcrete
	 * @returns {[DataType | ParametricType, Scope]}
	 */
	createParametricType(scope, site, evalConcrete) {
		const typeScope = this.evalParams(scope);

		const type = evalConcrete(new Scope(typeScope));

		if (!this.hasParameters()) {
			return [type, typeScope];
		} else {
			const paramType = new ParametricType({
				name: type.name,
				parameters: this.getParameters(),
				apply: (paramTypes) => {
					/**
					 * @type {InferenceMap}
					 */
					const map = new Map();

					paramTypes.forEach((pt, i) => {
						const p = this.getParameters()[i];

						map.set(p, pt);
					});

					const appliedType = assertDefined(type.infer(site, map, null).asDataType);

					const appliedPath = IRParametricName.parse(type.path, true).toImplementation(paramTypes.map(pt => assertDefined(pt.asDataType).path)).toString();

					if (appliedType instanceof GenericType) {
						return appliedType.changeNameAndPath(
							`${type.name}[${paramTypes.map(pt => pt.toString()).join(",")}]`,
							appliedPath
						);
					} else {
						throw new Error("unexpected");
					}
				}
			});

			return [paramType, typeScope];
		}
	}
}

/**
 * Single field in struct or enum member
 * @internal
 */
export class DataField extends NameTypePair {
	#tag;

	/**
	 * @param {Word} name 
	 * @param {Expr} typeExpr 
	 * @param {null | StringLiteral} tag
	 */
	constructor(name, typeExpr, tag = null) {
		super(name, typeExpr);
		this.#tag = tag;
	}

	/**
	 * Throws an error if called before evalType()
	 * @type {DataType}
	 */
	get type() {
		return assertDefined(super.type.asDataType);
	}

	/**
	 * @returns {boolean}
	 */
	hasTag() {
		return this.#tag !== null;
	}

	/**
	 * @type {string}
	 */
	get tag() {
		return this.#tag ? this.#tag.value : this.name.value;
	}

	/**
	 * Evaluates the type, used by FuncLiteralExpr and DataDefinition
	 * @param {Scope} scope 
	 * @returns {null | DataType}
	 */
	eval(scope) {
		if (this.typeExpr === null) {
			throw new Error("typeExpr not set in " + this.site.src.raw.split("\n")[0]);
		} else {
			const t = this.typeExpr.eval(scope);

			if (!t) {
				return null;
			}

			if (t.asDataType) {
				return t.asDataType;
			} else {
				this.typeExpr.typeError(`'${t.toString()}' isn't a valid data field type`);
				return null;
			}
		}
	}
}

/**
 * Base class for struct and enum member
 * @internal
 */
export class DataDefinition {
	#site;
	#name;
	#fields;

	/**
	 * @param {Site} site 
	 * @param {Word} name 
	 * @param {DataField[]} fields 
	 */
	constructor(site, name, fields) {
		this.#site = site;
		this.#name = name;
		this.#fields = fields;
	}

	/**
	 * @type {Site}
	 */
	get site() {
		return this.#site;
	}

	/**
	 * @type {Word}
	 */
	get name() {
		return this.#name;
	}

	/**
	 * @type {DataField[]}
	 */
	get fields() {
		return this.#fields.slice();
	}

	hasTags() {
		return this.#fields.some(f => f.hasTag());
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
			const f_ = f.eval(scope);

			if (f_) {
				fields[f.name.value] = f_;
			}
		}

		return fields;
	}

	/**
	 * @param {Type} self
	 * @returns {Type}
	 */
	genCopyType(self) {
		return new FuncType(this.#fields.map(f => new ArgType(f.name, f.type, true)), self);
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
	 * Gets insance member value.
	 * @param {Type} self
	 * @returns {InstanceMembers}
	 */
	genInstanceMembers(self) {
		const members = {
			...genCommonInstanceMembers(self),
			copy: new FuncType(this.#fields.map(f => new ArgType(f.name, f.type, true)), self),
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
	 * @returns {[string, string, NamedTypeSchema[]]}
	 */
	genTypeDetails() {
		const inputTypeParts = [];
		const outputTypeParts = [];
		const internalTypeParts = [];

		this.fieldNames.forEach((fn, i) => {
			const ftd = assertDefined(this.getFieldType(i).typeDetails);
			inputTypeParts.push(`${fn}: ${ftd.inputType}`);
			outputTypeParts.push(`${fn}: ${ftd.outputType}`);
			internalTypeParts.push({
				...ftd.internalType,
				name: fn
			});
		})

		return [
			`{${inputTypeParts.join(", ")}}`,
			`{${outputTypeParts.join(", ")}}`,
			internalTypeParts	
		];
	}

	/**
	 * @param {any} obj
	 * @param {JsToUplcHelpers} helpers
	 * @return {Promise<UplcData[]>}
	 */
	async jsFieldsToUplc(obj, helpers) {
		/**
		 * @type {Promise<UplcData>[]}
		 */
		const fields = [];

		if (Object.keys(obj).length == this.nFields && Object.keys(obj).every(k => this.hasField(new Word(Site.dummy(), k)))) {
			this.fieldNames.forEach((fieldName, i) => {
				const arg = assertDefined(obj[fieldName]);

				const fieldType = this.getFieldType(i);

				if (!fieldType.typeDetails) {
					throw new Error(`typeDetails for ${fieldType.name} not yet implemented`);
				}

				fields.push(fieldType.jsToUplc(arg, helpers));
			});
		} else {
			throw new Error(`expected ${this.nFields} args, got ${Object.keys(obj).length}`);
		}

		return Promise.all(fields);
	}

	/**
	 * Uses field names as keys, not tags
	 * @param {any} obj
	 * @param {JsToUplcHelpers} helpers
	 * @return {Promise<[UplcData, UplcData][]>}
	 */
	async jsMapToUplc(obj, helpers) {
		/**
		 * @type {[UplcData, UplcData][]}
		 */
		const fields = [];

		if (Object.keys(obj).length == this.nFields && Object.keys(obj).every(k => this.hasField(new Word(Site.dummy(), k)))) {
			for (let i = 0; i < this.nFields; i++) {
				const fieldName = this.fieldNames[i];

				const arg = assertDefined(obj[fieldName]);

				const fieldType = this.getFieldType(i);

				if (!fieldType.typeDetails) {
					throw new Error(`typeDetails for ${fieldType.name} not yet implemented`);
				}

				fields.push([
					new ByteArrayData(textToBytes(this.#fields[i].tag)),
					await fieldType.jsToUplc(arg, helpers)
				]);
			};
		} else {
			throw new Error(`expected ${this.nFields} args, got ${Object.keys(obj).length}`);
		}

		return fields;
	}

	/**
	 * @param {UplcData[]} fields 
	 * @param {UplcToJsHelpers} helpers
	 * @returns {Promise<any>}
	 */
	async uplcFieldsToJs(fields, helpers) {
		const obj = {};

		for (let i = 0; i < fields.length; i++) {
			const f = fields[i];

			const fn = this.getFieldName(i);

			obj[fn] = await this.getFieldType(i).uplcToJs(f, helpers);
		};

		return obj;
	}

	/**
	 * For Cip68-tagged structs
	 * @param {[UplcData, UplcData][]} fields 
	 * @param {UplcToJsHelpers} helpers
	 * @returns {Promise<any>}
	 */
	async uplcMapToJs(fields, helpers) {
		const obj = {};

		for (let i = 0; i < this.#fields.length; i++) {
			const f = this.#fields[i];

			const fn = this.getFieldName(i);

			const j = fields.findIndex(([key, value]) => {
				return ByteArrayData.comp(key.bytes, textToBytes(f.tag))
			})

			if (j == -1) {
				throw new Error(`couldn't find field ${f.tag}`)
			}

			obj[fn] = await this.getFieldType(i).uplcToJs(fields[j][1], helpers);
		};

		return obj;
	}

	/**
	 * @param {ToIRContext} ctx
	 * @param {string} path
	 * @param {IRDefinitions} map 
	 * @param {number} constrIndex
	 */
	newToIR(ctx, path, map, constrIndex) {
		const isConstr = constrIndex != -1;

		/**
		 * @type {IR}
		 */
		let ir;

		if (this.hasTags()) {
			ir = IR.new`__core__mkNilPairData(())`;

			for (let i = this.nFields - 1; i >= 0; i--) {
				const f = this.#fields[i];

				ir = IR.new`__core__mkCons(
					__core__mkPairData(
						__core__bData(#${bytesToHex(textToBytes(f.tag))}),
						${f.type.path}____to_data(${f.name.value})
					),
					${ir}
				)`;
			}

			// TODO: according to https://cips.cardano.org/cips/cip68/#metadata an additional 'extra' (which can be unit)  should be added. Is that really necessary?
			ir = IR.new`__core__constrData(
				0,
				__core__mkCons(
					__core__mapData(${ir}),
					__core__mkCons(
						__core__iData(1),
						__core__mkNilData(())
					)
				)
			)`;

			ir = IR.new`(${new IR(this.#fields.map(f => new IR(f.name.value))).join(", ")}) -> {${ir}}`;
		} else if (this.nFields == 1) {
			if (isConstr) {
				ir = IR.new`(self) -> {
					__core__constrData(${constrIndex}, __helios__common__list_1(${this.getFieldType(0).path}____to_data(self)))
				}${this.site}`;
			} else {
				ir = IR.new`__helios__common__identity`;
		}
		} else {
			ir = IR.new`__core__mkNilData(())`;

			for (let i = this.nFields - 1; i >= 0; i--) {
				const f = this.#fields[i];

				ir = IR.new`__core__mkCons(${f.type.path}____to_data(${f.name.value}), ${ir})`;
			}

			if (isConstr) {
				ir =  IR.new`__core__constrData(${constrIndex}, ${ir})`;
			}

			ir = IR.new`(${new IR(this.#fields.map(f => new IR(f.name.value))).join(", ")}) -> {${ir}}`;
		}

		const key = `${path}____new`;

		map.set(key, ir);
	}

	/**
	 * @internal
	 * @param {ToIRContext} ctx
	 * @param {string} path
	 * @param {IRDefinitions} map 
	 * @param {string[]} getterNames
	 * @param {number} constrIndex
	 */
	copyToIR(ctx, path, map, getterNames, constrIndex = -1) {
		const key = `${path}__copy`;

		let ir = StructLiteralExpr.toIRInternal(ctx, this.site, path, this.#fields.map(df => new IR(df.name.value)));

		// wrap with defaults

		for (let i = getterNames.length - 1; i >= 0; i--) {
			const fieldName = this.#fields[i].name.toString();

			ir = FuncArg.wrapWithDefaultInternal(ir, fieldName, IR.new`${getterNames[i]}(self)`);
		}

		const args = new IR(this.#fields.map(f => new IR([
			new IR(`__useopt__${f.name.toString()}`),
			new IR(", "),
			new IR(`${f.name.toString()}`)
		]))).join(", ")

		ir = IR.new`(self) -> {
			(${args}) -> {
				${ir}
			}
		}`;

		map.set(key, ir);
	}

	/**
	 * @internal
	 * @returns {IR}
	 */
	testDataToIR() {
		if (this.hasTags()) {
			const fields = this.#fields;

			let ir = IR.new``;

			fields.forEach((f, i) => {
				if (i == 0) {
					ir = IR.new`__helios__common__test_cip68_field(
						data,
						__core__bData(#${bytesToHex(textToBytes(f.tag))}),
						${f.type.path}__test_data	
					)`;
				} else {
					ir = IR.new`__core__ifThenElse(
						__helios__common__test_cip68_field(
							data,
							__core__bData(#${bytesToHex(textToBytes(f.tag))}),
							${f.type.path}__test_data	
						),
						() -> {
							${ir}
						},
						() -> {
							false
						}
					)()`;
				}
			});

			return IR.new`(data) -> {
				${ir}
			}`;
		} else if (this.nFields == 1) {
			return IR.new`${this.#fields[0].type.path}__test_data`;
		} else {
			const reversedFields = this.#fields.slice().reverse();

			let ir = IR.new`(fields) -> {
				__core__chooseList(
					fields,
					true,
					false
				)
			}`;

			reversedFields.forEach(f => {
				ir = IR.new`(fields) -> {
					__core__chooseList(
						fields,
						() -> {
							false
						},
						() -> {
							(head) -> {
								__core__ifThenElse(
									${f.type.path}__test_data(head),
									() -> {${ir}(__core__tailList__safe(fields))},
									() -> {false}
								)()
							}(__core__headList__safe(fields))
						}
					)()
				}`;
			});

			return IR.new`(data) -> {
				__core__chooseData(
					data,
					() -> {false},
					() -> {false},
					() -> {
						${ir}(__core__unListData__safe(data))
					},
					() -> {false},
					() -> {false}
				)()
			}`;
		}
	}

	/**
	 * @internal
	 * @param {string} path
	 * @returns {IR}
	 */
	fromDataFieldsCheckToIR(path) {
		if (this.hasTags()) {

			//let ir = IR.new`(data) -> {__core__mkNilPairData(())}`;

			let ir = IR.new(`(data) -> {
				(ignore) -> {
					data
				}(
					__core__ifThenElse(
						${path}__test_data(data),
						() -> {
							()
						},
						() -> {
							__core__trace("Warning: invalid ${this.name.toString()} data", ())
						}
					)()
				)
			}`);
			/*for (let i = this.nFields - 1; i >= 0; i--) {
				const f = this.#fields[i]
				const ftPath = f.type.path;

				ir = IR.new`(data) -> {
					__core__mkCons(
						__core__mkPairData(
							__core__bData(#${bytesToHex(textToBytes(f.tag))}),
							${ftPath}____to_data(
								${ftPath}__from_data(
									__helios__common__cip68_field(
										data, 
										__core__bData(#${bytesToHex(textToBytes(f.tag))})
									)
								)
							)
						),
						${ir}(data)
					)
				}`;
			}

			ir = IR.new`(data) -> {
				__core__constrData(
					0, 
					__core__mkCons(
						__core__mapData(${ir}(data)),
						__core__mkCons(
							__core__iData(1),
							__core__mkNilData(())
						)
					)
				)
			}`;*/

			return ir;
		} else {
			let ir = IR.new(`(fields) -> {
				(ignore) -> {
					fields
				}(
					__core__ifThenElse(
						${path}__test_data(__core__listData(fields)),
						() -> {
							()
						},
						() -> {
							__core__trace("Warning: invalid ${this.name.toString()} data", ())
						}
					)()
				)
			}`)

			return ir;

			/*let ir = IR.new`(fields) -> {__core__mkNilData(())}`;

			for (let i = this.nFields - 1; i >= 0; i--) {
				const ftPath = this.getFieldType(i).path;

				ir = IR.new`(fields) -> {
					__core__mkCons(
						${ftPath}____to_data(
							${ftPath}__from_data(
								__core__headList(fields)
							)
						), 
						${ir}(__core__tailList(fields))
					)
				}`;
			}

			return ir;*/
		}
	}

	/**
	 * Doesn't return anything, but sets its IRdef in the map
	 * @param {ToIRContext} ctx
	 * @param {string} path
	 * @param {IRDefinitions} map
	 * @param {number} constrIndex
	 */
	toIR(ctx, path, map, constrIndex) {
		/**
		 * @type {string[]}
		 */
		const getterNames = [];

		if (this.hasTags()) {
			for (let i = 0; i < this.#fields.length; i++) {
				const f = this.#fields[i];
				const key = `${path}__${f.name.value}`;

				// equalsData is much more efficient than first converting to byteArray
				const getter = IR.new`(self) -> {${f.type.path}__from_data(__helios__common__cip68_field(self, __core__bData(#${bytesToHex(textToBytes(f.tag))})))}`;

				map.set(key, getter);
				getterNames.push(key);
			}
		} else {
			const isConstr = constrIndex != -1;

			const getterBaseName = isConstr ? "__helios__common__enum_field" : "__helios__common__struct_field";

			if (this.fields.length == 1 && !isConstr) {
				const f = this.fields[0];
				const key = `${path}__${f.name.value}`;

				const getter =  IR.new`__helios__common__identity${f.site}`;
				
				map.set(key, getter);

				getterNames.push(key);
			} else {
				// add a getter for each field
				for (let i = 0; i < this.#fields.length; i++) {
					let f = this.#fields[i];
					let key = `${path}__${f.name.value}`;
					getterNames.push(key);

					/**
					 * @type {IR}
					 */
					let getter;

					if (i < 20) {
						getter = IR.new`(self) ${null}->${f.site} {
							${f.type.path}__from_data(${getterBaseName}_${i}(self))
						}`
					} else {
						let inner = new IR("self");

						if (isConstr) {
							inner = IR.new`__core__sndPair(__core__unConstrData(${inner}))`;
						}

						for (let j = 0; j < i; j++) {
							inner = IR.new`__core__tailList(${inner})`;
						}

						inner = IR.new`${f.type.path}__from_data(__core__headList(${inner}))`

						getter = IR.new`(self) ${null}->${f.site} {${inner}}`;
					}

					map.set(key, getter)
				}
			}
		}

		this.newToIR(ctx, path, map, constrIndex);
		this.copyToIR(ctx, path, map, getterNames);
	}
}

/**
 * Struct statement
 * @internal
 */
export class StructStatement extends Statement {
	#parameters;
	#dataDef;
	#impl;

	/**
	 * @param {Site} site
	 * @param {Word} name
	 * @param {TypeParameters} parameters
	 * @param {DataField[]} fields 
	 * @param {ImplDefinition} impl
	 */
	constructor(site, name, parameters, fields, impl) {
		super(site, name);

		this.#parameters = parameters;
		this.#dataDef = new DataDefinition(this.site, name, fields);
		this.#impl = impl;
	}

	get path() {
		return this.#parameters.genTypePath(super.path);
	}

	/**
	 * @param {string} basePath 
	 */
	setBasePath(basePath) {
		super.setBasePath(basePath);

		this.#impl.setBasePath(this.path);
	}

	/**
	 * @returns {HeliosDataClass<HeliosData>}
	 */
	genOffChainType() {
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

				this.#fields = [];

				if (args.length == 1 && (typeof args[0] == "object") && Object.keys(args[0]).length == statement.#dataDef.nFields && Object.keys(args[0]).every(k => statement.#dataDef.hasField(new Word(Site.dummy(), k)))) {
					statement.#dataDef.fieldNames.forEach((fieldName, i) => {
						const arg = assertDefined(args[0][fieldName]);

						const fieldType = statement.#dataDef.getFieldType(i);

						if (!fieldType.offChainType) {
							throw new Error(`offChainType for ${fieldType.name} not yet implemented`);
						}

						const FieldClass = fieldType.offChainType;

						const instance = arg instanceof FieldClass ? arg : new FieldClass(arg);

						this.#fields.push(instance);
						this[fieldName] = instance;
					});
				} else if (args.length != statement.#dataDef.nFields) {
					throw new Error(`expected ${statement.#dataDef.nFields} args, got ${args.length}`);
				} else {
					args.forEach((arg, i) => {
						const fieldName = statement.#dataDef.getFieldName(i);
						const fieldType = statement.#dataDef.getFieldType(i);

						if (!fieldType.offChainType) {
							throw new Error(`offChainType for ${fieldType.name} not yet implemented`);
						}

						const FieldClass = fieldType.offChainType;

						const instance = arg instanceof FieldClass ? arg : new FieldClass(arg);

						this.#fields.push(instance);
						this[fieldName] = instance;
					});
				}
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
			 * @type {HeliosData[]}
			 */
			get _fields() {
				return this.#fields;
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

				if (dataItems.length != statement.#dataDef.nFields) {
					throw new Error("unexpected number of fields");
				}

				const args = dataItems.map((item, i) => {
					return assertDefined(statement.#dataDef.getFieldType(i).offChainType).fromUplcData(item);
				});

				return new Struct(...args);
			}

			/**
			 * @returns {boolean}
			 */
			static isBuiltin() {
				return false;
			}
		}

		Object.defineProperty(Struct, "name", {value: this.name, writable: false});		

		return Struct;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `struct ${this.name.toString()}${this.#parameters.toString()} ${this.#dataDef.toStringFields()}`;
	}

	/**
	 * Evaluates own type and adds to scope
	 * @param {TopScope} scope 
	 */
	eval(scope) {
		const [type, typeScope] = this.#parameters.createParametricType(scope, this.site, (typeScope) => {
			const props = {
				fieldNames: this.#dataDef.fieldNames,
				name: this.name.value,
				path: this.path, // includes template parameters
				genTypeDetails: (self) => {
					const [inputType, outputType, internalTypeFields] = this.#dataDef.genTypeDetails();

					return {
						inputType: inputType,
						outputType: outputType,
						internalType: {
							type: "Struct",
							fieldTypes: internalTypeFields
						}
					};
				},
				jsToUplc: async (obj, helpers) => {
					if (this.#dataDef.hasTags()) {
						const pairs = await this.#dataDef.jsMapToUplc(obj, helpers);

						return new ConstrData(0, [new MapData(pairs), new IntData(1n)]);
					} else {
						/**
						 * @type {UplcData[]}
						 */
						const fields = await this.#dataDef.jsFieldsToUplc(obj, helpers);

						if (fields.length == 1) {
							return fields[0];
						} else {
							return new ListData(fields);
						}
					}
				},
				uplcToJs: async (data, helpers) => {
					if (this.#dataDef.hasTags()) {
						return this.#dataDef.uplcMapToJs(data.fields[0].map, helpers);
					} else {
						if (this.#dataDef.nFields == 1) {
							return this.#dataDef.getFieldType(0).uplcToJs(data, helpers);
						} else {
							return this.#dataDef.uplcFieldsToJs(data.list, helpers);
						}
					}
				},
				genOffChainType: () => this.genOffChainType(),
				genInstanceMembers: (self) => ({
					...genCommonInstanceMembers(self),
					...this.#dataDef.evalFieldTypes(typeScope),
					...this.#impl.genInstanceMembers(typeScope),
					copy: this.#dataDef.genCopyType(self)
				}),
				genTypeMembers: (self) => ({
					...genCommonTypeMembers(self),
					...this.#impl.genTypeMembers(typeScope)
				})
			};

			if (this.#parameters.hasParameters()) {
				return new GenericParametricType(props);
			} else {
				return new GenericType(props);
			}
		});

		const path = this.#parameters.hasParameters() ? super.path : this.path;
		
		scope.set(this.name, new NamedEntity(this.name.value, path, type));

		void this.#dataDef.evalFieldTypes(typeScope);

		typeScope.assertAllUsed();

		this.#impl.eval(typeScope);
	}

	/**
	 * @param {string} namespace 
	 * @param {(name: string, cs: ConstStatement) => void} callback 
	 */
	loopConstStatements(namespace, callback) {
		this.#impl.loopConstStatements(`${namespace}${this.name.value}::`, callback);
	}

	/**
	 * @param {ToIRContext} ctx
	 * @param {IRDefinitions} map
	 */
	toIR(ctx, map) {
		map.set(`${this.path}__test_data`, this.#dataDef.testDataToIR());

		if (this.#dataDef.hasTags()) {
			map.set(`${this.path}____eq`, IR.new`__helios__common____eq${this.site}`);
			map.set(`${this.path}____neq`, IR.new`__helios__common____neq${this.site}`);
			map.set(`${this.path}__serialize`, IR.new`__helios__common__serialize${this.site}`);
			map.set(`${this.path}____to_data`, IR.new`__helios__common__identity${this.site}`);

			if (config.CHECK_CASTS && !ctx.simplify) {
				map.set(`${this.path}__from_data`, IR.new`(data) -> {
					(ignore) -> {
						data
					}(
						__core__ifThenElse(
							${this.path}__test_data(data),
							() -> {
								()
							},
							() -> {
								__core__trace("Warning: invalid ${this.name.toString()} data", ())
							}
						)()
					)
				}${this.site}`);
			} else {
				map.set(`${this.path}__from_data`, IR.new`__helios__common__identity${this.site}`);
			}
		} else {
			const implPath = this.#dataDef.nFields == 1 ? this.#dataDef.getFieldType(0).path : "__helios__struct";

			map.set(`${this.path}____eq`, IR.new`${implPath}____eq${this.site}`);
			map.set(`${this.path}____neq`, IR.new`${implPath}____neq${this.site}`);
			map.set(`${this.path}__serialize`, IR.new`${implPath}__serialize${this.site}`);

			// the from_data method can include field checks
			if (this.#dataDef.fieldNames.length == 1 || (!(config.CHECK_CASTS && !ctx.simplify))) {
				map.set(`${this.path}__from_data`, IR.new`${implPath}__from_data${this.site}`);
			} else {
				map.set(`${this.path}__from_data`, IR.new`(data) -> {
					(ignore) -> {
						__core__unListData(data)
					}(
						__core__ifThenElse(
							${this.path}__test_data(data),
							() -> {
								()
							},
							() -> {
								__core__trace("Warning: invalid ${this.name.toString()} data", ())
							}
						)()
					)
				}${this.site}`);
			}

			map.set(`${this.path}____to_data`, new IR(`${implPath}____to_data`, this.site));
		}

		// super.toIR adds __new and copy, which might depend on __to_data, so must come after
		this.#dataDef.toIR(ctx, this.path, map, -1);

		this.#impl.toIR(ctx, map);
	}
}

/**
 * Function statement
 * (basically just a named FuncLiteralExpr)
 * @internal
 */
export class FuncStatement extends Statement {
	#parameters;
	#funcExpr;

	/**
	 * @param {Site} site 
	 * @param {Word} name 
	 * @param {TypeParameters} parameters
	 * @param {FuncLiteralExpr} funcExpr 
	 */
	constructor(site, name, parameters, funcExpr) {
		super(site, name);
		this.#parameters = parameters;
		this.#funcExpr = funcExpr;
	}

	/**
	 * @type {string}
	 */
	get path() {
		return this.#parameters.genFuncPath(super.path,);
	}

	/**
	 * @type {number}
	 */
	get nArgs() {
		return this.#funcExpr.nArgs;
	}

	/**
	 * @type {string[]}
	 */
	get argNames() {
		return this.#funcExpr.argNames;
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
	 * @type {Type}
	 */
	get retType() {
		return this.#funcExpr.retType;
	}

	/**
	 * @type {Site}
	 */
	get retSite() {
		return this.#funcExpr.retExpr.site;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `func ${this.name.toString()}${this.#parameters.toString()}${this.#funcExpr.toString()}`;
	}

	/**
	 * Evaluates a function and returns a func value
	 * @param {Scope} scope 
	 * @returns {null | EvalEntity}
	 */
	evalInternal(scope) {
		const typed = this.#parameters.evalParametricFunc(scope, (subScope) => {
			const type = this.#funcExpr.evalType(subScope);

			if (!type) {
				return null;
			}

			const implScope = new Scope(subScope);

			// recursive calls expect func value, not func type
			implScope.set(this.name, new NamedEntity(this.name.value, super.path, type.toTyped()));

			
			void this.#funcExpr.evalInternal(implScope);

			return type;
		});

		return typed;
	}

	/**
	 * Evaluates type of a funtion.
	 * Separate from evalInternal so we can use this function recursively inside evalInternal
	 * @param {Scope} scope 
	 * @returns {null | ParametricFunc | FuncType}
	 */
	evalType(scope) {
		return this.#parameters.evalParametricFuncType(scope, (subScope) => {
			return this.#funcExpr.evalType(subScope);
		});
	}

	/**
	 * @param {Scope} scope 
	 */
	eval(scope) {
		const typed = this.evalInternal(scope);

		if (typed) {
			assert(!typed.asType);

			scope.set(this.name, new NamedEntity(this.name.value, super.path, typed));
		}
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
	 * @param {ToIRContext} ctx
	 * @returns {IR}
	 */
	toIRInternal(ctx) {
		return this.#funcExpr.toIR(ctx);
	}

	/**
	 * @param {ToIRContext} ctx
	 * @param {IRDefinitions} map 
	 */
	toIR(ctx, map) {
		map.set(this.path, this.toIRInternal(ctx));
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
 * @internal
 */
export class EnumMember {
	/** @type {null | EnumStatement} */
	#parent;

	/** @type {null | number} */
	#constrIndex;

	#dataDef;

	/**
	 * @param {Word} name
	 * @param {DataField[]} fields
	 */
	constructor(name, fields) {
		this.#parent = null; // registered later
		this.#constrIndex = null;
		this.#dataDef = new DataDefinition(name.site, name, fields);
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
	 * @type {Word}
	 */
	get name() {
		return this.#dataDef.name;
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
	 * @returns {HeliosDataClass<HeliosData>}
	 */
	genOffChainType() {
		const statement = this;

		const enumStatement = statement.parent;

		const index = statement.constrIndex;

		const nFields = statement.#dataDef.nFields;

		/**
		 * @type {[string, DataType][]} - [name, type]
		 */
		const fields = [];

		for (let i = 0; i < nFields; i++) {
			fields.push([statement.#dataDef.getFieldName(i), statement.#dataDef.getFieldType(i)]);
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
			 * @returns {boolean}
			 */
			static isBuiltin() {
				return false;
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

		Object.defineProperty(EnumVariant, "name", {value: this.#dataDef.name, writable: false});

		return EnumVariant;

	}

	/**
	 * @type {DataDefinition}
	 */
	get dataDefinition() {
		return this.#dataDef;
	}

	/**
	 * @param {Scope} scope 
	 */
	evalDataFields(scope) {
		this.#dataDef.evalFieldTypes(scope);
	}

	/**
	 * @param {Scope} scope 
	 * @returns {(parent: DataType) => EnumMemberType}
	 */
	evalType(scope) {
		if (this.#parent === null) {
			throw new Error("parent should've been registered");
		}

		return (parent) => {
			const path = `${parent.path}__${this.#dataDef.name.value}`; 

			const props = {
				name: this.#dataDef.name.value,
				path: path, 
				constrIndex: this.constrIndex,
				genOffChainType: () => this.genOffChainType(),
				parentType: parent,
				fieldNames: this.#dataDef.fieldNames,
				genInstanceMembers: (self) => {
					const res = {
						...genCommonInstanceMembers(self),
						...this.#dataDef.evalFieldTypes(scope),
						copy: this.#dataDef.genCopyType(self)
					}

					return res;
				},
				genTypeMembers: (self) => ({
					...genCommonEnumTypeMembers(self, parent),
				})
			};

			if (this.parent.hasParameters()) {
				return new GenericParametricEnumMemberType(props);
			} else {
				return new GenericEnumMemberType(props);
			}
		};
	}

	get path() {
		return `${this.parent.path}__${this.#dataDef.name.toString()}`;
	}

	/**
	 * @param {ToIRContext} ctx
	 * @param {IRDefinitions} map 
	 */
	toIR(ctx, map) {
		map.set(`${this.path}____eq`, IR.new`__helios__common____eq${this.#dataDef.site}`);
		map.set(`${this.path}____neq`, IR.new`__helios__common____neq${this.#dataDef.site}`);
		map.set(`${this.path}__serialize`, IR.new`__helios__common__serialize${this.#dataDef.site}`);

		map.set(`${this.path}__test_data`, IR.new`(data) -> {
			__core__chooseData(
				data,
				() -> {
					(pair) -> {
						__core__ifThenElse(
							__core__equalsInteger(__core__fstPair(pair), ${this.#constrIndex}),
							() -> {
								${this.#dataDef.testDataToIR()}(__core__listData(__core__sndPair(pair)))
							},
							() -> {
								false
							}
						)()
					}(__core__unConstrData__safe(data))
				},
				() -> {false},
				() -> {false},
				() -> {false},
				() -> {false}
			)()
		}`);

		if (config.CHECK_CASTS && !ctx.simplify) {
			map.set(`${this.path}__from_data`, IR.new`(data) -> {
				(ignore) -> {
					data
				}(
					__core__ifThenElse(
						${this.path}__test_data(data),
						() -> {
							()
						},
						() -> {
							__core__trace("Warning: invalid ${this.name.toString()} data", ())
						}
					)()
				)
			}`);
		} else {
			map.set(`${this.path}__from_data`, new IR(`(data) -> {
				__helios__common__assert_constr_index(data, ${this.constrIndex})
			}`, this.#dataDef.site));
		}

		map.set(`${this.path}____to_data`, new IR("__helios__common__identity", this.#dataDef.site));

		// super.toIR adds __new and copy, which might depend on __to_data, so must come after
		this.#dataDef.toIR(ctx, this.path, map, this.constrIndex);
	}
}

/**
 * Enum statement, containing at least one member
 * @internal
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
	 * @type {string}
	 */
	get path() {
		return this.#parameters.genTypePath(super.path);
	}

	/**
	 * @returns {boolean}
	 */
	hasParameters() {
		return this.#parameters.hasParameters();
	}

	/**
	 * @param {string} basePath 
	 */
	setBasePath(basePath) {
		super.setBasePath(basePath);

		this.#impl.setBasePath(this.path);
	}

	/**
	 * @internal
	 * @returns {HeliosDataClass<HeliosData>}
	 */
	genOffChainType() {
		const statement = this;

		const nVariants = statement.nEnumMembers;

		/**
		 * @type {HeliosDataClass<HeliosData>[]}
		 */
		const variants = [];

		for (let i = 0; i < nVariants; i++) {
			variants.push(this.#members[i].genOffChainType());
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
			 * @param {number[] | string} bytes Array of bytes, or hexadecimal representation.
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

			/**
			 * @returns {boolean}
			 */
			static isBuiltin() {
				return false;
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
	 * @param {Scope} scope 
	 */
	eval(scope) {
		const [type, typeScope] = this.#parameters.createParametricType(scope, this.site, (typeScope) => {
			/**
			 * @type {{[name: string]: (parent: DataType) => EnumMemberType}}
			 */
			const genFullMembers = {};

			this.#members.forEach(m => {
				genFullMembers[m.name.value] = m.evalType(typeScope);
			});

			const props = {
				name: this.name.value,
				path: this.path,
				genTypeDetails: (self) => {
					const inputEnumTypeParts = [];
					const outputEnumTypeParts = [];
					const internalEnumTypeParts = [];

					this.#members.forEach(member => {
						const [inputType, outputType, internalTypeFields] = member.dataDefinition.genTypeDetails();
						
						inputEnumTypeParts.push(`{"${member.name.value}": ${inputType}}`);
						outputEnumTypeParts.push(`{"${member.name.value}": ${outputType}}`);
						internalEnumTypeParts.push({name: member.name.value, fieldTypes: internalTypeFields});
					});

					return {
						inputType: inputEnumTypeParts.join(" | "),
						outputType: outputEnumTypeParts.join(" | "),
						internalType: {
							type: "Enum",
							variantTypes: internalEnumTypeParts
						}
					};
				},
				jsToUplc: async (obj, helpers) => {
					const memberName = assertDefined(Object.keys(obj)[0]);

					const i = this.#members.findIndex(m => m.name.value == memberName);

					if (i == -1) {
						throw new Error(`invalid ${memberName} of ${this.name.value}`);
					}

					const member = this.#members[i];

					const fields = await member.dataDefinition.jsFieldsToUplc(assertDefined(obj[memberName]), helpers);

					return new ConstrData(i, fields);
				},
				uplcToJs: async (data, helpers) => {
					const i = data.index;

					if (i < 0 || i >= this.#members.length) {
						throw new Error(`enum variant index ${i} out of range`);
					}

					const member = this.#members[i];

					return {
						[member.name.value]: await member.dataDefinition.uplcFieldsToJs(data.fields, helpers)
					};
				},
				genOffChainType: () => this.genOffChainType(),
				genInstanceMembers: (self) => ({
					...genCommonInstanceMembers(self),
					...this.#impl.genInstanceMembers(typeScope),
				}),
				genTypeMembers: (self) => {
					const typeMembers_ = {
						...genCommonTypeMembers(self),
						...this.#impl.genTypeMembers(typeScope)
					};
					
					// TODO: detect duplicates
					for (let memberName in genFullMembers) {
						typeMembers_[memberName] = genFullMembers[memberName](assertDefined(self.asDataType))
					}

					return typeMembers_
				}
			};

			if (this.#parameters.hasParameters()) {
				return new GenericParametricType(props)
			} else {
				return new GenericType(props);
			}
		});

		// don't include type parameters in path (except empty), these are added by application statement
		const path = this.#parameters.hasParameters() ? super.path : this.path;
		
		scope.set(this.name, new NamedEntity(this.name.value, path, type));

		this.#members.forEach(m => {
			m.evalDataFields(typeScope);
		});

		typeScope.assertAllUsed();
		
		this.#impl.eval(typeScope);
	}

	/**
	 * @param {string} namespace 
	 * @param {(name: string, cs: ConstStatement) => void} callback 
	 */
	loopConstStatements(namespace, callback) {
		this.#impl.loopConstStatements(`${namespace}${this.name.value}::`, callback);
	}

	/**
	 * @returns {IR}
	 */
	testDataToIR() {
		let ir = IR.new`false`;

		this.#members.forEach(m => {
			ir = IR.new`__core__ifThenElse(
				${m.path}__test_data(data),
				() -> {
					true
				},
				() -> {
					${ir}
				}
			)()`;
		});

		return IR.new`(data) -> {
			${ir}
		}`;
	}

	/**
	 * @param {ToIRContext} ctx
	 * @param {IRDefinitions} map 
	 */
	toIR(ctx, map) {
		map.set(`${this.path}____eq`, IR.new`__helios__common____eq${this.site}`);
		map.set(`${this.path}____neq`, IR.new`__helios__common____neq${this.site}`);
		map.set(`${this.path}__serialize`, IR.new`__helios__common__serialize${this.site}`);
		map.set(`${this.path}____to_data`, IR.new`__helios__common__identity${this.site}`);

		map.set(`${this.path}__test_data`, this.testDataToIR());

		// there could be circular dependencies here, which is ok
		if (config.CHECK_CASTS && !ctx.simplify) {
			map.set(`${this.path}__from_data`, IR.new`(data) -> {
				(ignore) -> {
					data
				}(
					__core__ifThenElse(
						${this.path}__test_data(data),
						() -> {
							()
						},
						() -> {
							__core__trace("Warning: invalid ${this.name.toString()} data", ())
						}
					)()
				)
			}${this.site}`);
		} else {
			map.set(`${this.path}__from_data`, IR.new`__helios__common__identity${this.site}`);
		}

		// member __new and copy methods might depend on __to_data, so must be added after
		for (let member of this.#members) {
			member.toIR(ctx, map);
		}

		this.#impl.toIR(ctx, map);
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
 * @internal
 */
export class ImplDefinition {
	#selfTypeExpr;
	#statements;

	/**
	 * @param {Expr} selfTypeExpr;
	 * @param {(FuncStatement | ConstStatement)[]} statements 
	 */
	constructor(selfTypeExpr, statements) {
		this.#selfTypeExpr = selfTypeExpr;
		this.#statements = statements;
	}

	/**
	 * @type {Site}
	 */
	get site() {
		return this.#selfTypeExpr.site;
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
	 * @param {Scope} scope 
	 * @returns {TypeMembers}
	 */
	genTypeMembers(scope) {
		/**
		 * @type {TypeMembers}
		 */
		const typeMembers = {};

		for (let s of this.#statements) {
			if (s instanceof ConstStatement) {
				const s_ = s.evalType(scope);
				if (s_) {
					typeMembers[s.name.value] = s_.toTyped();
				}
			} else if (!FuncStatement.isMethod(s)) {
				const s_ = s.evalType(scope);

				if (s_) {
					typeMembers[s.name.value] = s_;
				}
			}
		}

		return typeMembers;
	}

	/**
	 * Doesn't add the common types
	 * @param {Scope} scope 
	 * @returns {InstanceMembers}
	 */
	genInstanceMembers(scope) {
		/**
		 * @type {InstanceMembers}
		 */
		const instanceMembers = {};

		for (let s of this.#statements) {
			if (FuncStatement.isMethod(s)) {
				const s_ = s.evalType(scope);

				if (s_) {
					instanceMembers[s.name.value] = s_;
				}
			}
		}

		return instanceMembers;
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
	 * @param {ToIRContext} ctx
	 * @param {IRDefinitions} map 
	 */
	toIR(ctx, map) {
		for (let s of this.#statements) {
			s.toIR(ctx, map);
		}
	}
}