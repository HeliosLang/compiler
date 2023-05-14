//@ts-check
// Helios program

import {
    TAB
} from "./config.js";

import {
    Source,
    assertDefined,
	assert
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
    ScriptPurpose,
    UplcDataValue,
    UplcValue
} from "./uplc-ast.js";

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
	SerializableTypeClass 
} from "./eval-parametric.js";

import { 
	ScriptContextType 
} from "./eval-tx.js";

import {
    GlobalScope,
    ModuleScope,
    TopScope
} from "./helios-scopes.js";

import {
    ConstStatement,
    EnumStatement,
    FuncStatement,
    ImportFromStatement,
    ImportModuleStatement,
    Statement,
	StructStatement
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

		const [purpose, name, statements, mainIdx] = buildScript(ts, ScriptPurpose.Module);

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
 * @typedef {Object.<string, HeliosDataClass<HeliosData>>} UserTypes
 */

/**
 * Helios root object
 */
 export class Program {
	#purpose;
	#modules;

	/** @type {UserTypes} */
	#types;

	/**
	 * Cache of const values
	 * @type {Object.<string, HeliosData>}
	 */
	#parameters;
	
	/**
	 * @param {number} purpose
	 * @param {Module[]} modules
	 */
	constructor(purpose, modules) {
		this.#purpose = purpose;
		this.#modules = modules;
		this.#types = {};
		this.#parameters = {};
	}

	/**
	 * @param {string} rawSrc 
	 * @returns {[purpose, Module[]]}
	 */
	static parseMain(rawSrc) {
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
	 * Creates  a new program.
	 * @param {string} mainSrc 
	 * @param {string[]} moduleSrcs - optional sources of modules, which can be used for imports
	 * @returns {Program}
	 */
	static new(mainSrc, moduleSrcs = []) {
		let [purpose, modules] = Program.parseMain(mainSrc);

		let site = modules[0].name.site;

		let imports = Program.parseImports(modules[0].name.value, moduleSrcs);
		
		let mainImports = modules[0].filterDependencies(imports);

		/** @type {Module[]} */
		let postImports = [];

		if (modules.length > 1) {
			postImports = modules[modules.length - 1].filterDependencies(imports).filter(m => !mainImports.some(d => d.name.value == m.name.value));
		}

		// create the final order of all the modules (this is the order in which statements will be added to the IR)
		modules = mainImports.concat([modules[0]]).concat(postImports).concat(modules.slice(1));
	
		/**
		 * @type {Program}
		 */
		let program;

		switch (purpose) {
			case ScriptPurpose.Testing:
				program = new TestingProgram(modules);
				break;
			case ScriptPurpose.Spending:
				program = new SpendingProgram(modules);
				break;
			case ScriptPurpose.Minting:
				program = new MintingProgram(modules);
				break
			case ScriptPurpose.Staking:
				program = new StakingProgram(modules);
				break
			case ScriptPurpose.Module:
				throw site.syntaxError("can't use module for main");
			default:
				throw new Error("unhandled script purpose");
		}

		const topScope = program.evalTypes();

		program.fillTypes(topScope);

		return program;
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
	 * @type {?Module}
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
	 * @returns {TopScope}
	 */
	evalTypes() {
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
		const map = this.fetchDefinitions(new IR(""), [], (s, isImport) => {
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

		let inner = new IR([
			new IR("const"),
			new IR("("),
			new IR(path),
			new IR(")")
		]);

		inner = Program.injectMutualRecursions(inner, map);

		let ir = IR.wrapWithDefinitions(inner, map);

		// add builtins as late as possible, to make sure we catch as many dependencies as possible
		const builtins = fetchRawFunctions(ir);

		ir = IR.wrapWithDefinitions(ir, builtins);

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
				if (!types[name]) {
					throw new Error(`invalid parameter name '${name}'`);
				}

				const UserType = assertDefined(types[name].offChainType, `invalid param name '${name}'`);

				const value = rawValue instanceof UserType ? rawValue : new UserType(rawValue);

				target[name] = value;

				that.changeParamSafe(name, value._toUplcData());

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
	 * @param {string[]} parameters
	 * @param {(s: Statement, isImport: boolean) => boolean} endCond
	 * @returns {IRDefinitions} 
	 */
	statementsToIR(parameters, endCond) {
		// find the constStatements associated with the parameters
		/**
		 * @type {(ConstStatement | null)[]}
		 */
		const parameterStatements = new Array(parameters.length).fill(null);

		if (parameters.length > 0) {
			for (let statement of this.mainStatements) {
				if (statement instanceof ConstStatement) {
					const i = parameters.findIndex(p => statement.name.value == p);

					if (i != -1) {
						parameterStatements[i] = statement;
					}
				}
			}

			parameters.forEach((p, i) => {
				if (parameterStatements[i] == null) {
					throw new Error(`parameter ${p} not found (hint: must come before main)`);
				}
			});
		}		

		/**
		 * @type {IRDefinitions}
		 */
		const map = new Map();

		for (let [statement, isImport] of this.allStatements) {
			if (parameters.length > 0 && statement instanceof ConstStatement) {
				const i = parameterStatements.findIndex(cs => cs === statement);

				if (i != -1) {
					let ir = new IR(`__PARAM_${i}`);

					ir = new IR([
						new IR(`${statement.type.path}__from_data`),
						new IR("("),
						ir,
						new IR(")")
					]);

					map.set(statement.path, ir); 

					continue;
				}
			}

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
		const keys = Array.from(map.keys());

		for (let i = keys.length - 1; i >= 0; i--) {
			const k = keys[i];

			// don't make a final const statement self-recursive (makes evalParam easier)
			// don't make __helios builtins mutually recursive
			// don't make __from_data and ____<op> methods mutually recursive (used frequently inside the entrypoint)
			if ((k.startsWith("__const") && i == keys.length - 1) || k.startsWith("__helios") || k.endsWith("__from_data") || k.includes("____")) {
				continue;
			}

			// get all following definitions including self, excluding constants
			// also don't mutual recurse helios functions
			const others = keys.slice(i).filter(k => !k.startsWith("__const") && !k.startsWith("__helios") && !k.endsWith("__from_data") && !k.includes("____"));

			const re = new RegExp(`\\b${k}\\b`, "gm");
			const newStr = `${k}(${others.join(", ")})`;
			// do the actual replacing
			for (let k_ of keys) {
				map.set(k_, assertDefined(map.get(k_)).replace(re, newStr));
			}

			mainIR = mainIR.replace(re, newStr);

			const wrapped = new IR([
				new IR(`(${others.join(", ")}) -> {`),
				assertDefined(map.get(k)),
				new IR("}")
			]);

			// wrap own definition
			map.set(k, wrapped);
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

			let ir = builtinGenerics.get(genericName) ?? map.get(genericName);

			if (!ir) {
				throw new Error(`${genericName} undefined in ir`);
			} else {
				ir = pName.replaceTemplateNames(ir);

				added.set(name, [location, ir]);

				ir.search(RE_IR_PARAMETRIC_NAME, (name) => add(name, location));
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

		// loop from end so that applied definitions that were generated recursively are added in the correct order
		for (let i = addedEntries.length-1; i >= 0; i--) {
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
	 * Loops over all statements, until endCond == true (includes the matches statement)
	 * Then applies type parameters
	 * @package
	 * @param {IR} ir
	 * @param {string[]} parameters
	 * @param {(s: Statement) => boolean} endCond
	 * @returns {IRDefinitions}
	 */
	fetchDefinitions(ir, parameters, endCond) {
		let map = this.statementsToIR(parameters, endCond);

		return Program.applyTypeParameters(ir, map);
	}

	/**
	 * @package
	 * @param {IR} ir
	 * @param {string[]} parameters
	 * @returns {IR}
	 */
	wrapEntryPoint(ir, parameters) {
		let map = this.fetchDefinitions(ir, parameters, (s) => s.name.value == "main");

		ir = Program.injectMutualRecursions(ir, map);

		const builtins = fetchRawFunctions(IR.wrapWithDefinitions(ir, map));

		map = new Map(Array.from(builtins).concat(Array.from(map)));

		ir = IR.wrapWithDefinitions(ir, map);

		return ir;
	}

	/**
	 * @package
	 * @param {string[]}  parameters
	 * @returns {IR}
	 */
	toIR(parameters = []) {
		throw new Error("not yet implemented");
	}

	/**
	 * @returns {string}
	 */
	prettyIR(simplify = false) {
		const ir = this.toIR([]);

		const irProgram = IRProgram.new(ir, this.#purpose, simplify);

		return new Source(irProgram.toString()).pretty();
	}

	/**
	 * @param {boolean} simplify 
	 * @returns {UplcProgram}
	 */
	compile(simplify = false) {
		const ir = this.toIR([]);

		const irProgram = IRProgram.new(ir, this.#purpose, simplify);
		
		//console.log(new Source(irProgram.toString()).pretty());
		
		return irProgram.toUplc();
	}

	/**
	 * Compile a special Uplc
	 * @param {string[]} parameters
	 * @param {boolean} simplify
	 * @returns {UplcProgram}
	 */
	compileParametric(parameters, simplify = false) {
		assert(parameters.length > 0, "expected at least 1 parameter (hint: use program.compile() instead)");

		const ir = this.toIR(parameters);

		const irProgram = IRParametricProgram.new(ir, this.#purpose, parameters, simplify);

		// TODO: UplcParametricProgram
		return irProgram.toUplc();
	}
}

class RedeemerProgram extends Program {
	/**
	 * @param {number} purpose
	 * @param {Module[]} modules 
	 */
	constructor(purpose, modules) {
		super(purpose, modules);
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

		if (argTypes.length != 2) {
			throw main.typeError("expected 2 args for main");
		}

		if (argTypeNames[0] != "" && !Common.typeImplements(argTypes[0], new SerializableTypeClass())) {
			throw main.typeError(`illegal redeemer argument type in main: '${argTypes[0].toString()}`);
		}

		if (argTypeNames[1] != "" && !(new ScriptContextType(-1)).isBaseOf(argTypes[1])) {
			throw main.typeError(`illegal 3rd argument type in main, expected 'ScriptContext', got ${argTypes[1].toString()}`);
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
	 * @param {string[]} parameters
	 * @returns {IR} 
	 */
	toIR(parameters = []) {
		const argNames = ["redeemer", "ctx"];

		/** @type {IR[]} */
		const outerArgs = [];

		/** 
		 * @type {IR[]} 
		 */
		const innerArgs = [];

		this.mainArgTypes.forEach((t, i) => {
			const name = argNames[i];

			innerArgs.push(new IR([
				new IR(`${t.path}__from_data`),
				new IR("("),
				new IR(name),
				new IR(")")
			]));

			outerArgs.push(new IR(name));
		});

		const ir = new IR([
			new IR(`${TAB}/*entry point*/\n${TAB}(`),
			new IR(outerArgs).join(", "),
			new IR(`) -> {\n${TAB}${TAB}`),
			new IR(`__core__ifThenElse(\n${TAB}${TAB}${TAB}${this.mainPath}(`),
			new IR(innerArgs).join(", "),
			new IR(`),\n${TAB}${TAB}${TAB}() -> {()},\n${TAB}${TAB}${TAB}() -> {error("transaction rejected")}\n${TAB}${TAB})()`),
			new IR(`\n${TAB}}`),
		]);

		return this.wrapEntryPoint(ir, parameters);
	}
}

class DatumRedeemerProgram extends Program {
	/**
	 * @param {number} purpose
	 * @param {Module[]} modules
	 */
	constructor(purpose, modules) {
		super(purpose, modules);
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

		if (argTypes.length != 3) {
			throw main.typeError("expected 3 args for main");
		}

		if (argTypeNames[0] != "" && !Common.typeImplements(argTypes[0], new SerializableTypeClass())) {
			throw main.typeError(`illegal datum argument type in main: '${argTypes[0].toString()}`);
		}

		if (argTypeNames[1] != "" && !Common.typeImplements(argTypes[1], new SerializableTypeClass())) {
			throw main.typeError(`illegal redeemer argument type in main: '${argTypes[1].toString()}`);
		}

		if (argTypeNames[2] != "" && !(new ScriptContextType(-1)).isBaseOf(argTypes[2])) {
			throw main.typeError(`illegal 3rd argument type in main, expected 'ScriptContext', got ${argTypes[2].toString()}`);
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
	 * @param {string[]} parameters
	 * @returns {IR}
	 */
	toIR(parameters = []) {
		const argNames = ["datum", "redeemer", "ctx"];

		/** @type {IR[]} */
		const outerArgs = [];

		/** 
		 * @type {IR[]} 
		 */
		const innerArgs = [];

		const argTypeNames = this.mainFunc.argTypeNames;
		this.mainArgTypes.forEach((t, i) => {
			const name = argNames[i];

			// empty path signgi
			if (argTypeNames[i] != "") {
				innerArgs.push(new IR([
					new IR(`${t.path}__from_data`),
					new IR("("),
					new IR(name),
					new IR(")")
				]));
			} else {
				// unused arg, 0 is easier to optimize
				innerArgs.push(new IR("0"));
			}

			outerArgs.push(new IR(name));
		});

		const ir = new IR([
			new IR(`${TAB}/*entry point*/\n${TAB}(`),
			new IR(outerArgs).join(", "),
			new IR(`) -> {\n${TAB}${TAB}`),
			new IR(`__core__ifThenElse(\n${TAB}${TAB}${TAB}${this.mainPath}(`),
			new IR(innerArgs).join(", "),
			new IR(`),\n${TAB}${TAB}${TAB}() -> {()},\n${TAB}${TAB}${TAB}() -> {error("transaction rejected")}\n${TAB}${TAB})()`),
			new IR(`\n${TAB}}`),
		]);

		return this.wrapEntryPoint(ir, parameters);
	}
}

class TestingProgram extends Program {
	/**
	 * @param {Module[]} modules 
	 */
	constructor(modules) {
		super(ScriptPurpose.Testing, modules);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `testing ${this.name}\n${super.toString()}`;
	}

	/**
	 * @package
	 * @returns {TopScope}
	 */
	evalTypes() {
		const scope = GlobalScope.new(ScriptPurpose.Testing);

		const topScope = this.evalTypesInternal(scope);

		if (this.mainFunc.argTypes.some(at => !Common.typeImplements(at, new SerializableTypeClass()))) {
			throw this.mainFunc.typeError("invalid entry-point argument types");
		}

		if (this.mainFunc.retTypes.length != 1) {
			throw this.mainFunc.typeError("program entry-point can only return one value");
		}

		return topScope;
	}

	/**
	 * @package
	 * @param {string[]} parameters
	 * @returns {IR}
	 */
	toIR(parameters = []) {
		const innerArgs = this.mainArgTypes.map((t, i) => {
			return new IR([
				new IR(`${t.path}__from_data`),
				new IR("("),
				new IR(`arg${i}`),
				new IR(")")
			]);
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

		return this.wrapEntryPoint(ir, parameters);
	}
}

class SpendingProgram extends DatumRedeemerProgram {
	/**
	 * @param {Module[]} modules
	 */
	constructor(modules) {
		super(ScriptPurpose.Spending, modules);
	}

	toString() {
		return `spending ${this.name}\n${super.toString()}`;
	}

	/**
	 * @package
	 * @returns {TopScope}
	 */
	evalTypes() {
		const scope = GlobalScope.new(ScriptPurpose.Spending);

		return this.evalTypesInternal(scope);	
	}
}

class MintingProgram extends RedeemerProgram {
	/**
	 * @param {Module[]} modules 
	 */
	constructor(modules) {
		super(ScriptPurpose.Minting, modules);
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `minting ${this.name}\n${super.toString()}`;
	}

	/**
	 * @package
	 * @returns {TopScope}
	 */
	evalTypes() {
		const scope = GlobalScope.new(ScriptPurpose.Minting);

		return this.evalTypesInternal(scope);	
	}
}

class StakingProgram extends RedeemerProgram {
	/**
	 * @param {Module[]} modules 
	 */
	constructor(modules) {
		super(ScriptPurpose.Staking, modules);
	}

	toString() {
		return `staking ${this.name}\n${super.toString()}`;
	}

	/**
	 * @package
	 * @returns {TopScope}
	 */
	evalTypes() {
		const scope = GlobalScope.new(ScriptPurpose.Staking);

		return this.evalTypesInternal(scope);	
	}
}