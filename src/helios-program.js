//@ts-check
// Helios program

import {
    TAB
} from "./config.js";

import {
    Source,
	assert,
    assertDefined,
	assertNonEmpty
} from "./utils.js";

import {
    IR,
    IRParametricName,
    RE_IR_PARAMETRIC_NAME,
    UserError,
    Word
} from "./tokens.js";

/**
 * @typedef {import("./tokens.js").IRDefinitions} IRDefinitions
 */

import {
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
    UplcDataValue,
    UplcValue
} from "./uplc-ast.js";

/**
 * @typedef {import("./uplc-ast.js").ScriptPurpose} ScriptPurpose
 */

import {
	UplcProgram
} from "./uplc-program.js";

import {
    tokenize
} from "./tokenization.js";

import { 
	Common 
} from "./eval-common.js";

/**
 * @typedef {import("./eval-common.js").DataType} DataType
 */

/**
 * @typedef {import("./eval-common.js").Type} Type
 */



import {
	BoolType
} from "./eval-primitives.js";

import { 
	DefaultTypeClass 
} from "./eval-parametric.js";

import { 
	ContractContextType,
	ScriptContextType 
} from "./eval-tx.js";

import {
    GlobalScope,
    ModuleScope,
    TopScope
} from "./helios-scopes.js";

import {
    ConstStatement,
    FuncStatement,
    ImportFromStatement,
    ImportModuleStatement,
    Statement
} from "./helios-ast-statements.js";

import {
	buildScript
} from "./helios-ast-build.js";

import {
	fetchRawFunctions,
    fetchRawGenerics
} from "./ir-defs.js";

import {
    IRProgram,
	IRParametricProgram
} from "./ir-program.js";


/**
 * A Module is a collection of statements
 */
class Module {
	#name;
	#statements;

	/**
	 * @param {Word} name 
	 * @param {Statement[]} statements
	 */
	constructor(name, statements) {
		this.#name = name;
		this.#statements = statements;

		this.#statements.forEach(s => s.setBasePath(`__module__${this.#name.toString()}`));
	}

	/**
	 * @param {string} rawSrc
	 * @param {?number} fileIndex - a unique optional index passed in from outside that makes it possible to associate a UserError with a specific file
	 * @returns {Module}
	 */
	static new(rawSrc, fileIndex = null) {
		const src = new Source(rawSrc, fileIndex);

		const ts = tokenize(src);

		src.throwErrors();

		if (ts === null) {
			throw new Error("should've been thrown above");
		}

		if (ts.length == 0) {
			throw UserError.syntaxError(src, 0, 1, "empty script");
		}

		const [purpose, name, statements, mainIdx] = buildScript(ts, "module");

		src.throwErrors();

		if (name !== null) {
			return new Module(name, statements);
		} else {
			throw new Error("unexpected"); // should've been caught by calling src.throwErrors() above
		}
	}

	/**
	 * @type {Word}
	 */
	get name() {
		return this.#name;
	}

	/**
	 * @type {Statement[]}
	 */
	get statements() {
		return this.#statements.slice();
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
	 * @returns {string}
	 */
	toString() {
		return this.#statements.map(s => s.toString()).join("\n");
	}

	/**
	 * @param {ModuleScope} scope 
	 */
	evalTypes(scope) {
		for (let s of this.statements) {
			s.eval(scope);
		}
	}

	/**
	 * This module can depend on other modules
	 * TODO: detect circular dependencies
	 * @param {Module[]} modules 
	 * @param {Module[]} stack
	 * @returns {Module[]}
	 */
	filterDependencies(modules, stack = []) {
		/**
		 * @type {Module[]}
		 */
		let deps = [];

		/** @type {Module[]} */
		let newStack = [this];
		newStack = newStack.concat(stack);

		for (let s of this.#statements) {
			if (s instanceof ImportFromStatement || s instanceof ImportModuleStatement) {
				let mn = s.moduleName.value;

				if (mn == this.name.value) {
					throw s.syntaxError("can't import self");
				} else if (stack.some(d => d.name.value == mn)) {
					throw s.syntaxError("circular import detected");
				}

				// if already in deps, then don't add (because it will have been added before along with all its dependencies)
				if (!deps.some(d => d.name.value == mn)) {
					let m = modules.find(m => m.name.value == mn);

					if (m === undefined) {
						throw s.referenceError(`module '${mn}' not found`);
					} else {
						// only add deps that weren't added before
						let newDeps = m.filterDependencies(modules, newStack).concat([m]).filter(d => !deps.some(d_ => d_.name.value == d.name.value));

						deps = deps.concat(newDeps);
					}
				}
			}
		}

		return deps;
	}
}

/**
 * The entrypoint module
 */
class MainModule extends Module {
	/**
	 * @param {Word} name 
	 * @param {Statement[]} statements 
	 */
	constructor(name, statements) {
		super(name, statements);
	}

	/**
	 * @type {FuncStatement}
	 */
	get mainFunc() {
		for (let s of this.statements) {
			if (s.name.value == "main") {
				if (!(s instanceof FuncStatement)) {	
					throw s.typeError("'main' isn't a function statement");
				} else {
					return s;
				}
			}
		}

		throw new Error("'main' not found (is a module being used as an entrypoint?)");
	}
}

/**
 * @typedef {{[name: string]: any}} UserTypes
 */

/**
 * Helios root object
 */
 export class Program {
	/**
	 * @type {ScriptPurpose}
	 */
	#purpose;

	/**
	 * @type {Module[]}
	 */
	#modules;

	/**
	 * @type {boolean}
	 */
	#allowPosParams;

	/** 
	 * @type {UserTypes} 
	 */
	#types;

	/**
	 * Cache of const values
	 * @type {Object.<string, HeliosData>}
	 */
	#parameters;
	
	/**
	 * @param {ScriptPurpose} purpose
	 * @param {Module[]} modules
	 * @param {boolean} allowPosParams
	 */
	constructor(purpose, modules, allowPosParams) {
		this.#purpose = purpose;
		this.#modules = modules;
		this.#allowPosParams = allowPosParams;
		this.#types = {};
		this.#parameters = {};
	}

	/**
	 * @param {string} rawSrc 
	 * @returns {[purpose, Module[]]}
	 */
	static parseMainInternal(rawSrc) {
		const src = new Source(rawSrc, 0);

		const ts = tokenize(src);

		src.throwErrors();

		if (ts === null) {
			throw new Error("should've been thrown above");
		}

		if (ts.length == 0) {
			throw UserError.syntaxError(src, 0, 1, "empty script");
		}

		const [purpose, name, statements, mainIdx] = buildScript(ts);

		src.throwErrors();

		if (purpose !== null && name !== null) {
			/**
			 * @type {Module[]}
			 */
			const modules = [new MainModule(name, statements.slice(0, mainIdx+1))];

			if (mainIdx < statements.length - 1) {
				modules.push(new Module(name, statements.slice(mainIdx+1)));
			}

			return [purpose, modules];
		} else {
			throw new Error("unexpected"); // should've been caught by calling src.throwErrors() above
		}
	}

	/**
	 * 
	 * @param {string} mainName 
	 * @param {string[]} moduleSrcs
	 * @returns {Module[]}
	 */
	static parseImports(mainName, moduleSrcs = []) {
		let imports = moduleSrcs.map((src, i) => Module.new(src, i+1));

		/**
		 * @type {Set<string>}
		 */
		let names = new Set();

		names.add(mainName);

		for (let m of imports) {
			if (names.has(m.name.value)) {
				throw m.name.syntaxError(`non-unique module name '${m.name.value}'`);
			}

			names.add(m.name.value);
		}

		return imports;
	}

	/**
	 * @param {string} mainSrc 
	 * @param {string[]} moduleSrcs
	 * @returns {[null | ScriptPurpose, Module[]]}
	 */
	static parseMain(mainSrc, moduleSrcs) {
		let [purpose, modules] = Program.parseMainInternal(mainSrc);

		const site = modules[0].name.site;

		const imports = Program.parseImports(modules[0].name.value, moduleSrcs);
		
		const mainImports = modules[0].filterDependencies(imports);

		/** @type {Module[]} */
		let postImports = [];

		if (modules.length > 1) {
			postImports = modules[modules.length - 1].filterDependencies(imports).filter(m => !mainImports.some(d => d.name.value == m.name.value));
		}

		// create the final order of all the modules (this is the order in which statements will be added to the IR)
		modules = mainImports.concat([modules[0]]).concat(postImports).concat(modules.slice(1));

		if (purpose == "module") {
			throw site.syntaxError("can't use module for main");
		}

		return [purpose, modules];
	}

	/**
	 * Creates  a new program.
	 * @param {string} mainSrc 
	 * @param {string[]} moduleSrcs - optional sources of modules, which can be used for imports
	 * @param {{[name: string]: Type}} validatorTypes
	 * @param {boolean} allowPosParams
	 * @returns {Program}
	 */
	static new(mainSrc, moduleSrcs = [], validatorTypes = {}, allowPosParams = false) {
		const [purpose, modules] = Program.parseMain(mainSrc, moduleSrcs);
	
		/**
		 * @type {Program}
		 */
		let program;

		switch (purpose) {
			case "testing":
				program = new TestingProgram(modules);
				break;
			case "spending":
				program = new SpendingProgram(modules, allowPosParams);
				break;
			case "minting":
				program = new MintingProgram(modules, allowPosParams);
				break;
			case "staking":
				program = new StakingProgram(modules, allowPosParams);
				break;
			default:
				throw new Error("unhandled script purpose");
		}

		const topScope = program.evalTypes(validatorTypes);

		program.fillTypes(topScope);

		return program;
	}

	/**
	 * @type {boolean}
	 */
	get allowPosParams() {
		return this.#allowPosParams;
	}

	/**
	 * @type {number}
	 */
	get nPosParams() {
		return 0;
	}

	/**
	 * @type {Type[]}
	 */
	get posParams() {
		return this.mainArgTypes.slice(0, this.nPosParams);
	}

	/** 
	 * @type {Module[]} 
	 */
	get mainImportedModules() {
		/** @type {Module[]} */
		let ms = [];

		for (let m of this.#modules) {
			if (m instanceof MainModule) {
				break;
			} else {
				ms.push(m);
			}
		}

		return ms;
	}

	/**
	 * @type {MainModule}
	 */
	get mainModule() {
		for (let m of this.#modules) {
			if (m instanceof MainModule) {
				return m;
			}
		}

		throw new Error("MainModule not found");
	}

	/**
	 * @type {null | Module}
	 */
	get postModule() {
		let m = this.#modules[this.#modules.length - 1];

		if (m instanceof MainModule) {
			return null;
		} else {
			return m;
		}
	}

	/**
	 * @type {ScriptPurpose}
	 */
	get purpose() {
		return this.#purpose;
	}

	/**
	 * @type {string}
	 */
	get name() {
		return this.mainModule.name.value;
	}

	/**
	 * @type {FuncStatement}
	 */
	get mainFunc() {
		return this.mainModule.mainFunc;
	}

	/**
	 * @type {string[]}
	 */
	get mainArgNames() {
		return this.mainFunc.argNames;
	}

	/**
	 * @type {DataType[]}
	 */
	get mainArgTypes() {
		return this.mainFunc.argTypes.map(at => assertDefined(at.asDataType));
	}

	/**
	 * @type {string}
	 */
	get mainPath() {
		return this.mainFunc.path;
	}

	/**
	 * @type {Statement[]}
	 */
	get mainStatements() {
		return this.mainModule.statements;
	}

	/**
	 * Needed to list the paramTypes, and to call changeParam
	 * @type {Statement[]}
	 */
	get mainAndPostStatements() {
		let statements = this.mainModule.statements;

		if (this.postModule != null) {
			statements = statements.concat(this.postModule.statements);
		}

		return statements;
	}

	/**
	 * @type {[Statement, boolean][]} - boolean value marks if statement is import or not
	 */
	get allStatements() {
		/**
		 * @type {[Statement, boolean][]}
		 */
		let statements = [];

		for (let i = 0; i < this.#modules.length; i++) {
			let m = this.#modules[i];

			// MainModule or PostModule => isImport == false
			let isImport = !(m instanceof MainModule || (i == this.#modules.length - 1));

			statements = statements.concat(m.statements.map(s => [s, isImport]));
		}

		return statements;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.#modules.map(m => m.toString()).join("\n");
	}

	/**
	 * @param {GlobalScope} globalScope
	 * @returns {TopScope}
	 */
	evalTypesInternal(globalScope) {
		const topScope = new TopScope(globalScope);

		// loop through the modules

		for (let i = 0; i < this.#modules.length; i++) {
			const m = this.#modules[i];

			// reuse main ModuleScope for post module
			const moduleScope = (m ===  this.postModule) ? topScope.getModuleScope(this.mainModule.name) : new ModuleScope(topScope);

			m.evalTypes(moduleScope);

			if (m instanceof MainModule) {
				topScope.setStrict(false);
			}

			if (m !== this.postModule) {
				topScope.setScope(m.name, moduleScope);
			}
		}
		
		return topScope;
	}

	/**
	 * @param {{[name: string]: Type}} validatorTypes
	 * @returns {TopScope}
	 */
	evalTypes(validatorTypes = {}) {
		throw new Error("not yet implemeneted");
	}

	/**
	 * @type {UserTypes}
	 */
	get types() {
		return this.#types;
	}

	/**
	 * Fill #types with convenient javascript equivalents of Int, ByteArray etc.
	 * @param {TopScope} topScope
	 */
	fillTypes(topScope) {
		const mainModuleScope = topScope.getModuleScope(this.mainModule.name);

		mainModuleScope.loopTypes((name, type) => {
			if (type?.asDataType?.offChainType) {
				this.#types[name] = type.asDataType.offChainType;
			}
		});
	}

	/**
	 * @param {(name: string, cs: ConstStatement) => void} callback 
	 */
	loopConstStatements(callback) {
		const postModule = this.postModule;

		for (let m of this.#modules) {
			const namespace = (m instanceof MainModule || m === postModule) ? "" : `${m.name.value}::`;

			m.loopConstStatements(namespace, callback);
		}
	}

	/**
	 * @type {{[name: string]: DataType}}
	 */
	get paramTypes() {
		/**
		 * @type {{[name: string]: DataType}}
		 */
		let res = {};

		this.loopConstStatements((name, constStatement) => {
			res[name] = constStatement.type
		});

		return res;
	}

	/**
	 * Change the literal value of a const statements  
	 * @package
	 * @param {string} name
	 * @param {UplcData} data
	 */
	changeParamSafe(name, data) {
		let found = false;

		this.loopConstStatements((constName, constStatement) => {
			if (!found) {
				if (constName == name) {
					constStatement.changeValueSafe(data);
					found = true;
				}
			}
		})

		if (!found) {
			throw this.mainFunc.referenceError(`param '${name}' not found`);
		}
	}

	/**
	 * @param {string} name 
	 * @returns {ConstStatement | null}
	 */
	findConstStatement(name) {
		/**
		 * @type {ConstStatement | null}
		 */
		let cs = null;

		this.loopConstStatements((constName, constStatement) => {
			if (cs === null) {
				if (name == constName)  {
					cs = constStatement;
				}
			}
		});

		return cs;
	}

	/**
	 * @param {ConstStatement} constStatement
	 * @returns {UplcValue}
	 */
	evalConst(constStatement) {
		const map = this.fetchDefinitions(new IR(""), (s, isImport) => {
			let found = false;
			s.loopConstStatements("", (_, cs) => {
				if (!found) {
					if (cs === constStatement) {
						found = true;
					}
				}
			})

			return found;
		});

		const path = constStatement.path;

		const inner = new IR([
			new IR("const"),
			new IR("("),
			new IR(path),
			new IR(")")
		]);

		const ir = this.wrapInner(inner, map);

		const irProgram = IRProgram.new(ir, this.#purpose, true, true);

		return new UplcDataValue(irProgram.site, irProgram.data);
	}

	/**
	 * Doesn't use wrapEntryPoint
	 * @param {string} name - can be namespace: "Type::ConstName" or "Module::ConstName" or "Module::Type::ConstName"
	 * @returns {UplcValue}
	 */
	evalParam(name) {
		/** 
		 * @type {ConstStatement | null} 
		 */
		let constStatement = this.findConstStatement(name);

		if (!constStatement) {
			throw new Error(`param '${name}' not found`);
		}

		return this.evalConst(constStatement);
	}
	
	/**
	 * Alternative way to get the parameters as HeliosData instances
	 * @returns {{[name: string]: HeliosData | any}}
	 */
	get parameters() {
		const that = this;

		// not expensive, so doesn't need to be evaluated on-demand
		const types = this.paramTypes;

		const handler = {
			/**
			 * Return from this.#parameters if available, or calculate
			 * @param {{[name: string]: HeliosData}} target 
			 * @param {string} name
			 * @returns {HeliosData}
			 */
			get(target, name) {
				if (name in target) {
					return target[name];
				} else {
					const type = assertDefined(types[name], `invalid param name '${name}'`);
					
					const uplcValue = that.evalParam(name);

					const value = assertDefined(type.offChainType).fromUplcData(uplcValue.data);
						
					target[name] = value;

					return value;
				}
			},
			
			/**
			 * @param {{[name: string]: HeliosData}} target
			 * @param {string} name
			 * @param {HeliosData | any} rawValue
			 * @returns {boolean}
			 */
			set(target, name, rawValue) {
				let permissive = false;
				if (name.startsWith("?")) {
					name = name.slice(1);
					permissive = true;
				}

				if (!types[name]) {
					if (!permissive) {
						throw new Error(`invalid parameter name '${name}'`);
					}
				} else {
					const UserType = assertDefined(types[name].offChainType, `invalid param name '${name}'`);

					const value = rawValue instanceof UserType ? rawValue : new UserType(rawValue);

					target[name] = value;

					that.changeParamSafe(name, value._toUplcData());
				}

				return true;
			}
		};

		return new Proxy(this.#parameters, handler);
	}

	/**
	 * Use proxy for setting
	 * @param {{[name: string]: HeliosData | any}} values
	 */
	set parameters(values) {
		const proxy = this.parameters;

		for (let name in values) {
			proxy[name] = values[name];
		}
	}

	/**
	 * @package
	 * @param {(s: Statement, isImport: boolean) => boolean} endCond
	 * @returns {IRDefinitions} 
	 */
	statementsToIR(endCond) {		
		/**
		 * @type {IRDefinitions}
		 */
		const map = new Map();

		for (let [statement, isImport] of this.allStatements) {
			statement.toIR(map);

			if (endCond(statement, isImport)) {
				break;
			}
		}

		return map;
	}

	/**
	 * For top-level statements
	 * @package
	 * @param {IR} mainIR
	 * @param {IRDefinitions} map
	 * @returns {IR}
	 */
	static injectMutualRecursions(mainIR, map) {
		/**
		 * @param {string} name
		 * @param {string[]} potentialDependencies 
		 * @returns {string[]}
		 */
		const filterMutualDependencies = (name, potentialDependencies) => {
			// names to be treated
			const stack = [name];

			/**
			 * @type {Set<string>}
			 */
			let set = new Set();

			while (stack.length > 0) {
				const name = assertDefined(stack.shift());

				const ir = assertDefined(map.get(name));

				const localDependencies = potentialDependencies.slice(potentialDependencies.findIndex(n => n == name));

				for (let i = 0; i < localDependencies.length; i++) {
					const dep = localDependencies[i];
					if (ir.includes(dep)) {
						set.add(dep)

						if (dep != name) {
							stack.push(dep);
						}
					}
				}
			}

			return potentialDependencies.filter(d => set.has(d));
		}

		const keys = Array.from(map.keys());

		for (let i = keys.length - 1; i >= 0; i--) {
			const k = keys[i];

			// don't make a final const statement self-recursive (makes evalParam easier)
			// don't make __helios builtins mutually recursive
			// don't make __from_data and ____<op> methods mutually recursive (used frequently inside the entrypoint)
			if ((k.startsWith("__const") && i == keys.length - 1) || k.startsWith("__helios") || k.endsWith("__from_data") || k.includes("____")) {
				continue;
			}

			let prefix = assertDefined(k.match(/(__const)?([^[]+)(\[|$)/))[0];

			// get all following definitions including self, excluding constants
			// also don't mutual recurse helios functions
			const potentialDependencies = keys.slice(i).filter(k => (k.startsWith(prefix) || k.startsWith(`__const${prefix}`)) && !k.endsWith("__from_data") && !k.includes("____"));

			const dependencies = filterMutualDependencies(k, potentialDependencies);

			if (dependencies.length > 0) {
				const escaped = k.replace(/\[/g, "\\[").replace(/]/g, "\\]");

				const re = new RegExp(`\\b${escaped}(\\b|$)`, "gm");
				const newStr = `${k}(${dependencies.join(", ")})`;
				// do the actual replacing
				for (let k_ of keys) {
					map.set(k_, assertDefined(map.get(k_)).replace(re, newStr));
				}

				mainIR = mainIR.replace(re, newStr);

				const wrapped = new IR([
					new IR(`(${dependencies.join(", ")}) -> {`),
					assertDefined(map.get(k)),
					new IR("}")
				]);

				// wrap own definition
				map.set(k, wrapped);
			}
		}

		return mainIR;
	}

	/**
	 * Also merges builtins and map
	 * @param {IR} mainIR
	 * @param {IRDefinitions} map 
	 * @returns {IRDefinitions}
	 */
	static applyTypeParameters(mainIR, map) {
		const builtinGenerics = fetchRawGenerics();

		/**
		 * @type {Map<string, [string, IR]>}
		 */
		const added = new Map();

		/**
		 * @param {string} name 
		 * @param {string} location
		 */
		const add = (name, location) => {
			if (map.has(name) || added.has(name)) {
				return;
			}

			const pName = IRParametricName.parse(name);

			const genericName = pName.toTemplate();

			let ir = builtinGenerics.get(name) ?? builtinGenerics.get(genericName) ?? map.get(genericName);

			if (!ir) {
				throw new Error(`${genericName} undefined in ir`);
			} else {
				ir = pName.replaceTemplateNames(ir);

				added.set(name, [location, ir]);

				ir.search(RE_IR_PARAMETRIC_NAME, (name_) => add(name_, name));
			}
		};

		for (let [k, v] of map) {
			v.search(RE_IR_PARAMETRIC_NAME, (name) => add(name, k));
		}

		mainIR.search(RE_IR_PARAMETRIC_NAME, (name) => add(name, "main"))

		// we need to keep templates, otherwise find() might fail to inject the applied definitions in the right location
		let entries = Array.from(map.entries());

		/**
		 * @param {string} name
		 * @returns {number}
		 */
		const find = (name) => {
			for (let i = entries.length - 1; i >= 0; i--) {
				if (entries[i][0] == name) {
					return i;
				}
			}

			if (name == "main") {
				return entries.length;
			} else {
				throw new Error(`${name} not found`);
			}
		};

		const addedEntries = Array.from(added.entries());

		for (let i = 0; i < addedEntries.length; i++) {
			const [name, [location, ir]] = addedEntries[i];

			const j = find(location);

			// inject right before location

			entries = entries.slice(0, j).concat([[name, ir]]).concat(entries.slice(j));
		}

		/**
		 * Remove template because they don't make any sense in the final output
		 */
		entries = entries.filter(([key, _]) => !IRParametricName.isTemplate(key));

		return new Map(entries);
	}

	/**
	 * @param {IR} ir 
	 * @param {IRDefinitions} definitions 
	 * @returns {Set<string>}
	 */
	collectAllUsed(ir, definitions) {
		/**
		 * Set of global paths
		 * @type {Set<string>}
		 */
		const used = new Set();

		/**
		 * @type {IR[]}
		 */
		const stack = [ir];

		const RE = /__[a-zA-Z0-9_[\]@]+/g;

		while (stack.length > 0) {
			const ir = assertDefined(stack.pop());

			ir.search(RE, (match) => {
				if (!used.has(match)) {
					used.add(match);

					const def = definitions.get(match);

					if (def) {
						stack.push(def);
					}
				}
			})
		}

		return used;
	}

	/**
	 * @param {IR} ir 
	 * @param {IRDefinitions} definitions 
	 * @returns {IRDefinitions}
	 */
	eliminateUnused(ir, definitions) {
		const used = this.collectAllUsed(ir, definitions);

		// eliminate all definitions that are not in set

		/**
		 * @type {IRDefinitions}
		 */
		const result = new Map();

		for (let [k, ir] of definitions) {
			if (used.has(k)) {
				result.set(k, ir);
			}
		}

		// Loop internal const statemtsn
		this.loopConstStatements((name, cs) => {
			const path = cs.path;

			if (used.has(path) && !definitions.has(cs.path)) {
				throw cs.site.referenceError(`used unset const '${name}' (hint: use program.parameters['${name}'] = ...)`);
			}
		});

		return result;
	}

	/**
	 * Loops over all statements, until endCond == true (includes the matches statement)
	 * Then applies type parameters
	 * @package
	 * @param {IR} ir
	 * @param {(s: Statement) => boolean} endCond
	 * @returns {IRDefinitions}
	 */
	fetchDefinitions(ir, endCond) {
		let map = this.statementsToIR(endCond);

		return Program.applyTypeParameters(ir, map);
	}

	/**
	 * @param {IR} ir
	 * @param {IRDefinitions} definitions
	 * @param {null | IRDefinitions} extra
	 * @returns {IR}
	 */
	wrapInner(ir, definitions, extra = null) {
		ir = Program.injectMutualRecursions(ir, definitions);

		definitions = this.eliminateUnused(ir, definitions);

		ir = IR.wrapWithDefinitions(ir, definitions);
		
		if (extra) {
			ir = IR.wrapWithDefinitions(ir, extra);
		}

		// add builtins as late as possible, to make sure we catch as many dependencies as possible
		const builtins = fetchRawFunctions(ir, extra);

		ir = IR.wrapWithDefinitions(ir, builtins);

		return ir;
	}

	/**
	 * @package
	 * @param {IR} ir
	 * @param {null | IRDefinitions} extra
	 * @returns {IR}
	 */
	wrapEntryPoint(ir, extra = null) {
		const map = this.fetchDefinitions(ir, (s) => s.name.value == "main");

		return this.wrapInner(ir, map, extra);
	}

	/**
	 * @returns {IR}
	 */
	toIRInternal() {
		throw new Error("not yet implemented");
	}

	/**
	 * @package
	 * @param {null | IRDefinitions} extra
	 * @returns {IR}
	 */
	toIR(extra = null) {
		const ir = this.toIRInternal()

		return this.wrapEntryPoint(ir, extra);
	}

	/**
	 * Non-positional named parameters
	 * @type {[string, Type][]}
	 */
	get requiredParameters() {
		const ir = this.toIRInternal();
		const definitions = this.fetchDefinitions(ir, (s) => s.name.value == "main");
		const used = this.collectAllUsed(ir, definitions);
		
		/**
		 * @type {[string, Type][]}
		 */
		const lst = [];

		this.loopConstStatements((name, cs) => {
			if (!cs.isSet() && used.has(cs.path)) {
				lst.push([name, cs.type]);
			}
		});

		return lst;
	}

	/**
	 * @returns {string}
	 */
	prettyIR(simplify = false) {
		const ir = this.toIR();

		const irProgram = IRProgram.new(ir, this.#purpose, simplify);

		return new Source(irProgram.toString()).pretty();
	}

	/**
	 * @param {boolean} simplify 
	 * @returns {UplcProgram}
	 */
	compile(simplify = false) {
		const ir = this.toIR();

		if (this.nPosParams > 0) {
			const irProgram = IRParametricProgram.new(ir, this.#purpose, this.nPosParams, simplify);

			// TODO: UplcParametricProgram
			return irProgram.toUplc();
		} else {
			const irProgram = IRProgram.new(ir, this.#purpose, simplify);
			
			//console.log(new Source(irProgram.toString()).pretty());
			
			return irProgram.toUplc();
		}
	}
}

class RedeemerProgram extends Program {
	/**
	 * @param {ScriptPurpose} purpose
	 * @param {Module[]} modules 
	 * @param {boolean} allowPosParams
	 */
	constructor(purpose, modules, allowPosParams = false) {
		super(purpose, modules, allowPosParams);
	}

	/**
	 * @type {number}
	 */
	get nPosParams() {
		return this.mainFunc.nArgs - 2;
	}

	/**
	 * @package
	 * @param {GlobalScope} scope
	 * @returns {TopScope}
	 */
	evalTypesInternal(scope) {
		const topScope = super.evalTypesInternal(scope);

		// check the 'main' function

		const main = this.mainFunc;
		const argTypeNames = main.argTypeNames;
		const argTypes = main.argTypes;
		const retTypes = main.retTypes;
		const nArgs = argTypes.length;

		if (this.allowPosParams) {
			if (nArgs < 2) {
				throw main.typeError("expected at least 2 args for main");	
			}
		} else {
			if (nArgs != 2) {
				throw main.typeError("expected 2 args for main");
			}
		}
		
		for (let i = 0; i < nArgs; i++) {
			if (i == nArgs - 1) {
				if (argTypeNames[i] != "" && !(new ScriptContextType()).isBaseOf(argTypes[i])) {
					throw main.typeError(`illegal type for arg ${nArgs} in main, expected 'ScriptContext', got ${argTypes[i].toString()}`);
				}
			} else {
				if (argTypeNames[i] != "" && !(new DefaultTypeClass()).isImplementedBy(argTypes[i])) {
					throw main.typeError(`illegal ${i == nArgs - 2 ? "redeemer " : ""}argument type in main: '${argTypes[i].toString()}`);
				}
			}
		}

		if (retTypes.length !== 1) {
			throw main.typeError(`illegal number of return values for main, expected 1, got ${retTypes.length}`);
		} else if (!(BoolType.isBaseOf(retTypes[0]))) {
			throw main.typeError(`illegal return type for main, expected 'Bool', got '${retTypes[0].toString()}'`);
		}

		return topScope;
	}

	/**
	 * @package
	 * @param {{[name: string]: Type}} validatorTypes
	 * @returns {TopScope}
	 */
	evalTypes(validatorTypes = {}) {
		const scope = GlobalScope.new(this.purpose, validatorTypes);

		return this.evalTypesInternal(scope);	
	}

	/**
	 * @package
	 * @returns {IR} 
	 */
	toIRInternal() {
		const outerArgNames = ["redeemer", "ctx"];

		const nArgs = this.mainFunc.nArgs;
		const argTypeNames = this.mainFunc.argTypeNames;
		const argTypes = this.mainArgTypes;

		const innerArgs = argTypes.map((t, i) => {
			const name = (i >= (nArgs-2)) ? outerArgNames[i-(nArgs-2)] : `__PARAM_${i.toString()}`;

			// empty path
			if (argTypeNames[i] != "") {
				return new IR([
					new IR(`${assertNonEmpty(t.path)}__from_data`),
					new IR("("),
					new IR(name),
					new IR(")")
				]);
			} else {
				// unused arg, 0 is easier to optimize
				return new IR("0");
			}
		});

		const outerArgs = outerArgNames.map((n) => new IR(n));

		let ir = new IR([
			new IR(`${TAB}/*entry point*/\n${TAB}(`),
			new IR(outerArgs).join(", "),
			new IR(`) -> {\n${TAB}${TAB}`),
			new IR(`__core__ifThenElse(\n${TAB}${TAB}${TAB}${this.mainPath}(`),
			new IR(innerArgs).join(", "),
			new IR(`),\n${TAB}${TAB}${TAB}() -> {()},\n${TAB}${TAB}${TAB}() -> {error("transaction rejected")}\n${TAB}${TAB})()`),
			new IR(`\n${TAB}}`),
		]);

		return ir;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `${this.purpose} ${this.name}\n${super.toString()}`;
	}
}

class DatumRedeemerProgram extends Program {
	/**
	 * @param {ScriptPurpose} purpose
	 * @param {Module[]} modules
	 * @param {boolean} allowPosParams
	 */
	constructor(purpose, modules, allowPosParams) {
		super(purpose, modules, allowPosParams);
	}

	/**
	 * @type {number}
	 */
	get nPosParams() {
		return this.mainFunc.nArgs - 3;
	}

	/**
	 * @package
	 * @param {GlobalScope} scope 
	 * @returns {TopScope}
	 */
	evalTypesInternal(scope) {
		const topScope = super.evalTypesInternal(scope);

		// check the 'main' function

		const main = this.mainFunc;
		const argTypeNames = main.argTypeNames;
		const argTypes = main.argTypes;
		const retTypes = main.retTypes;
		const nArgs = main.nArgs;

		if (this.allowPosParams) {
			if (argTypes.length < 3) {
				throw main.typeError("expected at least 3 args for main");	
			}
		} else {
			if (argTypes.length != 3) {
				throw main.typeError("expected 3 args for main");	
			}
		}

		for (let i = 0; i < nArgs; i++) {
			if (i == nArgs - 1) {
				if (argTypeNames[i] != "" && !(new ScriptContextType()).isBaseOf(argTypes[i])) {
					throw main.typeError(`illegal type for arg ${nArgs} in main: expected 'ScriptContext', got '${argTypes[i].toString()}'`);
				}
			} else {
				if (argTypeNames[i] != "" && !(new DefaultTypeClass()).isImplementedBy(argTypes[i])) {
					throw main.typeError(`illegal type for arg ${i+1} in main ${i == nArgs - 2 ? "(datum) " : (i == nArgs - 3 ? "(redeemer) " : "")}: '${argTypes[i].toString()}`);
				}
			}
		}

		if (retTypes.length !== 1) {
			throw main.typeError(`illegal number of return values for main, expected 1, got ${retTypes.length}`);
		} else if (!(BoolType.isBaseOf(retTypes[0]))) {
			throw main.typeError(`illegal return type for main, expected 'Bool', got '${retTypes[0].toString()}'`);
		}

		return topScope;
	}

	/**
	 * @package
	 * @param {{[name: string]: Type}} validatorTypes
	 * @returns {TopScope}
	 */
	evalTypes(validatorTypes) {
		const scope = GlobalScope.new(this.purpose, validatorTypes);

		return this.evalTypesInternal(scope);	
	}

	/**
	 * @package
	 * @returns {IR}
	 */
	toIRInternal() {
		const outerArgNames = ["datum", "redeemer", "ctx"];

		const nArgs = this.mainFunc.nArgs;
		const argTypeNames = this.mainFunc.argTypeNames;

		const innerArgs = this.mainArgTypes.map((t, i) => {
			const name = (i >= (nArgs-3)) ? outerArgNames[i-(nArgs-3)] : `__PARAM_${i.toString()}`;

			// empty path
			if (argTypeNames[i] != "") {
				return new IR([
					new IR(`${assertNonEmpty(t.path)}__from_data`),
					new IR("("),
					new IR(name),
					new IR(")")
				]);
			} else {
				// unused arg, 0 is easier to optimize
				return new IR("0");
			}
		});

		const outerArgs = outerArgNames.map((n) => new IR(n));

		return new IR([
			new IR(`${TAB}/*entry point*/\n${TAB}(`),
			new IR(outerArgs).join(", "),
			new IR(`) -> {\n${TAB}${TAB}`),
			new IR(`__core__ifThenElse(\n${TAB}${TAB}${TAB}${this.mainPath}(`),
			new IR(innerArgs).join(", "),
			new IR(`),\n${TAB}${TAB}${TAB}() -> {()},\n${TAB}${TAB}${TAB}() -> {error("transaction rejected")}\n${TAB}${TAB})()`),
			new IR(`\n${TAB}}`),
		]);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `${this.purpose} ${this.name}\n${super.toString()}`;
	}
}

class GenericProgram extends Program {
	/**
	 * @param {ScriptPurpose} purpose 
	 * @param {Module[]} modules 
	 * @param {boolean} allowPosParams
	 */
	constructor(purpose, modules, allowPosParams) {
		super(purpose, modules, allowPosParams);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `${this.purpose} ${this.name}\n${super.toString()}`;
	}

	/**
	 * @package
	 * @param {{[name: string]: Type}} validatorTypes
	 * @returns {TopScope}
	 */
	evalTypes(validatorTypes) {
		const scope = GlobalScope.new(this.purpose, validatorTypes);

		const topScope = super.evalTypesInternal(scope);

		// check the 'main' function

		const main = this.mainFunc;
		const argTypeNames = main.argTypeNames;
		const argTypes = main.argTypes;
		const retTypes = main.retTypes;


		argTypeNames.forEach((argTypeName, i) => {
			if (argTypeName != "" && !(new DefaultTypeClass()).isImplementedBy(argTypes[i])) {
				throw main.typeError(`illegal argument type in main: '${argTypes[i].toString()}`);
			}
		});

		// TODO: support multiple return values
		if (retTypes.length !== 1) {
			throw main.typeError(`illegal number of return values for main, expected 1, got ${retTypes.length}`);
		} else if (!((new DefaultTypeClass()).isImplementedBy(retTypes[0]))) {
			throw main.typeError(`illegal return type for main: '${retTypes[0].toString()}'`);
		}

		return topScope;
	}

	/**
	 * @package
	 * @returns {IR}
	 */
	toIRInternal() {
		const argTypeNames = this.mainFunc.argTypeNames;

		const innerArgs = this.mainArgTypes.map((t, i) => {
			// empty path
			if (argTypeNames[i] != "") {
				return new IR([
					new IR(`${assertNonEmpty(t.path)}__from_data`),
					new IR("("),
					new IR(`arg${i}`),
					new IR(")")
				]);
			} else {
				// unused arg, 0 is easier to optimize
				return new IR("0")
			}
		});

		let ir = new IR([
			new IR(`${this.mainPath}(`),
			new IR(innerArgs).join(", "),
			new IR(")"),
		]);

		const retType = assertDefined(this.mainFunc.retTypes[0].asDataType);

		ir = new IR([
			new IR(`${retType.path}____to_data`),
			new IR("("),
			ir,
			new IR(")")
		]);

		const outerArgs = this.mainFunc.argTypes.map((_, i) => new IR(`arg${i}`));

		ir = new IR([
			new IR(`${TAB}/*entry point*/\n${TAB}(`),
			new IR(outerArgs).join(", "),
			new IR(`) -> {\n${TAB}${TAB}`),
			ir,
			new IR(`\n${TAB}}`),
		]);

		return ir;
	}
}

class TestingProgram extends GenericProgram {
	/**
	 * @param {Module[]} modules 
	 */
	constructor(modules) {
		super("testing", modules, false);
	}
}

class SpendingProgram extends DatumRedeemerProgram {
	/**
	 * @param {Module[]} modules
	 * @param {boolean} allowPosParams
	 */
	constructor(modules, allowPosParams) {
		super("spending", modules, allowPosParams);
	}
}

class MintingProgram extends RedeemerProgram {
	/**
	 * @param {Module[]} modules 
	 * @param {boolean} allowPosParams
	 */
	constructor(modules, allowPosParams = false) {
		super("minting", modules, allowPosParams);
	}
}

class StakingProgram extends RedeemerProgram {
	/**
	 * @param {Module[]} modules 
	 * @param {boolean} allowPosParams
	 */
	constructor(modules, allowPosParams = false) {
		super("staking", modules, allowPosParams);
	}
}

export class LinkingProgram extends GenericProgram {
	/**
	 * @type {Program[]}
	 */
	#validators;

	/**
	 * @param {Module[]} modules 
	 * @param {Program[]} validators 
	 */
	constructor(modules, validators) {
		super("linking", modules, false);

		this.#validators = validators;
	}

	/**
	 * Creates  a new program.
	 * @param {string} mainSrc 
	 * @param {string[]} moduleSrcs - optional sources of modules, which can be used for imports
	 * @param {{[name: string]: Type}} validatorTypes - generators for script hashes, used by ScriptCollection
	 * @returns {LinkingProgram}
	 */
	static new(mainSrc, moduleSrcs = [], validatorTypes = {}) {
		const [purpose, modules] = Program.parseMain(mainSrc, moduleSrcs);

		assert(purpose == "linking")

		const program = new LinkingProgram(modules, []);

		program.evalTypes(validatorTypes)

		return program;
	}

	/**
	 * @package
	 * @param {{[name: string]: Type}} validatorTypes
	 * @returns {TopScope}
	 */
	evalTypes(validatorTypes = {}) {
		const scope = GlobalScope.newLinking(validatorTypes);

		const topScope = super.evalTypesInternal(scope);
		
		const main = this.mainFunc;
		const argTypes = main.argTypes;
		const argTypeNames = main.argTypeNames;
		const retTypes = main.retTypes;

		if (argTypeNames.length == 0) {
			throw main.typeError("expected at least argument 'ContractContext'");
		}

		argTypeNames.forEach((argTypeName, i) => {
			if (i != argTypeNames.length -1 && argTypeName != "" && !(new DefaultTypeClass()).isImplementedBy(argTypes[i])) {
				throw main.typeError(`illegal argument type in main: '${argTypes[i].toString()}`);
			}
		});

		if (argTypeNames[argTypeNames.length-1] != "") {
			const lastArgType = argTypes[argTypes.length-1];
			if (!(lastArgType instanceof ContractContextType)) {
				throw main.typeError(`expected 'ContractContext' for arg ${argTypes.length}, got '${lastArgType.toString()}'`);
			}
		}
		
		// TODO: support multiple return values
		if (retTypes.length !== 1) {
			throw main.typeError(`illegal number of return values for main, expected 1, got ${retTypes.length}`);
		} else if (!((new DefaultTypeClass()).isImplementedBy(retTypes[0]))) {
			throw main.typeError(`illegal return type for main: '${retTypes[0].toString()}'`);
		}
		
		return topScope;
	}
}