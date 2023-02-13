//@ts-check
// Helios program

import {
    TAB
} from "./constants.js";

import {
    Source,
    assertDefined,
	assert
} from "./utils.js";

import {
    IR,
	Site,
    UserError,
    Word
} from "./tokens.js";

import {
	UplcData
} from "./uplc-data.js";

/**
 * @template T
 * @typedef {import("./helios-data.js").HeliosDataClass<T>} HeliosDataClass
 */

import {
	Bool,
	HeliosData
} from "./helios-data.js";

import {
    ScriptPurpose,
	UplcBool,
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
    BoolType,
    EnumStatementType,
    StructStatementType,
    Type
} from "./helios-eval-entities.js";

import {
    GlobalScope,
    ModuleScope,
    TopScope
} from "./helios-scopes.js";

import {
    ConstStatement,
    FuncStatement,
    ImportStatement,
    Statement
} from "./helios-ast-statements.js";

import {
    buildProgramStatements,
    buildScriptPurpose
} from "./helios-ast-build.js";

import {
    wrapWithRawFunctions
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
		let src = new Source(rawSrc, fileIndex);

		let ts = tokenize(src);

		if (ts.length == 0) {
			throw UserError.syntaxError(src, 0, "empty script");
		}

		let [purpose, name] = buildScriptPurpose(ts);

		if (purpose != ScriptPurpose.Module) {
			throw name.syntaxError("expected 'module' script purpose");
		} else if (name.value == "main") {
			throw name.syntaxError("name of 'module' can't be 'main'");
		}

		let statements = buildProgramStatements(ts);

		return new Module(name, statements);
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
	 * Cleans the program by removing everything that is unecessary for the smart contract (easier to audit)
	 * @returns {string}
	 */
	cleanSource() {
		let raw = this.name.site.src.raw;
		let n = raw.length;

		let mask = new Uint8Array(n);

		mask.fill(1); // hide the unused parts by setting to 0

		for (let s of this.#statements) {
			s.hideUnused(mask);
		}

		/** @type {string[]} */
		let chars = [];

		for (let i = 0; i < n; i++) {
			let c = raw.charAt(i);

			if (c == '\n' || c == ' ') {
				chars.push(c);
			} else if (mask[i] == 1) {
				chars.push(c);
			} else {
				chars.push(' ');
			}
		}

		let lines = chars.join("").split("\n").map(l => {
			if (l.trim().length == 0) {
				return "";
			} else {
				return l;
			}
		});

		// remove more than one consecutive empty line

		/**
		 * @type {string[]}
		 */
		let parts = [];

		for (let i = 0; i < lines.length; i++) {
			if (!(i > 0 && lines[i-1].length == 0 && lines[i].length == 0)) {
				parts.push(lines[i]);
			}
		}

		return parts.join("\n");
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
			if (s instanceof ImportStatement) {
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
		let src = new Source(rawSrc, 0);

		let ts = tokenize(src);

		if (ts.length == 0) {
			throw UserError.syntaxError(src, 0, "empty script");
		}

		let [purpose, name] = buildScriptPurpose(ts);

		if (name.value === "main") {
			throw name.site.syntaxError("script can't be named 'main'");
		}

		let statements = buildProgramStatements(ts);

		let mainIdx = statements.findIndex(s => s.name.value === "main");

		if (mainIdx == -1) {
			throw name.site.syntaxError("'main' not found");
		}

		/**
		 * @type {Module[]}
		 */
		let modules = [new MainModule(name, statements.slice(0, mainIdx+1))];

		if (mainIdx < statements.length - 1) {
			modules.push(new Module(name, statements.slice(mainIdx+1)));
		}

		return [purpose, modules];
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
	 * @returns {[string[], string]}
	 */
	cleanSource() {
		return [this.mainImportedModules.map(m => m.cleanSource()), this.mainModule.cleanSource()];
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
				globalScope.allowMacros();
				topScope.setStrict(false);
			}

			if (m !== this.postModule) {
				topScope.set(m.name, moduleScope);
			}
		}

		this.mainFunc.use();
		
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
			if (type instanceof StructStatementType || type instanceof EnumStatementType) {
				if (name in this.#types) {
					throw new Error(`unexpected duplicate type name ${name} in main program scope`);
				}

				this.#types[name] = type.userType;;
			}
		});
	}

	/**
	 * @type {Object.<string, Type>}
	 */
	get paramTypes() {
		/**
		 * @type {Object.<string, Type>}
		 */
		let res = {};

		for (let s of this.mainAndPostStatements) {
			if (s instanceof ConstStatement) {
				res[s.name.value] = s.type;
			} else if (s instanceof ImportStatement && s.origStatement instanceof ConstStatement) {
				res[s.name.value] = s.origStatement.type;
			}
		}

		return res;
	}

	/**
	 * Change the literal value of a const statements  
	 * @param {string} name 
	 * @param {string | UplcValue} value 
	 * @returns {Program} - returns 'this' so that changeParam calls can be chained
	 */
	changeParam(name, value) {
		for (let s of this.mainAndPostStatements) {
			if (s instanceof ConstStatement && s.name.value == name) {
				s.changeValue(value);
				return this;
			} else if (s instanceof ImportStatement && s.name.value == name && s.origStatement instanceof ConstStatement) {
				s.origStatement.changeValue(value);
				return this;
			}
		}

		throw this.mainFunc.referenceError(`param '${name}' not found`);
	}

	/**
	 * Change the literal value of a const statements  
	 * @package
	 * @param {string} name 
	 * @param {UplcData} data
	 */
	changeParamSafe(name, data) {
		for (let s of this.mainAndPostStatements) {
			if (s instanceof ConstStatement && s.name.value == name) {
				s.changeValueSafe(data);
				return this;
			} else if (s instanceof ImportStatement && s.name.value == name && s.origStatement instanceof ConstStatement) {
				s.origStatement.changeValueSafe(data);
				return this;
			}
		}

		throw this.mainFunc.referenceError(`param '${name}' not found`);
	}

	/**
	 * Doesn't use wrapEntryPoint
	 * @param {string} name 
	 * @returns {UplcValue}
	 */
	evalParam(name) {
		/**
		 * @type {Map<string, IR>}
		 */
		let map = new Map();

		/** @type {?ConstStatement} */
		let constStatement = null;

		for (let s of this.mainAndPostStatements) {
			if (s instanceof ImportStatement && s.name.value == name && s.origStatement instanceof ConstStatement) {
				constStatement = s.origStatement;
				break;
			}
		}

		for (let [s, isImport] of this.allStatements) {
			s.toIR(map);
			if (s instanceof ConstStatement && ((s.name.value == name && !isImport) || s === constStatement)) {
				constStatement = s;
				break;
			}
		}

		if (constStatement === null) {
			throw new Error(`param '${name}' not found`);
		} else {
			let path = constStatement.path;

			let ir = assertDefined(map.get(path));

			map.delete(path);

			ir = wrapWithRawFunctions(IR.wrapWithDefinitions(ir, map));

			let irProgram = IRProgram.new(ir, this.#purpose, true, true);

			return new UplcDataValue(irProgram.site, irProgram.data);
		}
	}
	
	/**
	 * Alternative way to get the parameters as HeliosData instances
	 * @returns {Object.<string, HeliosData>}
	 */
	get parameters() {
		const that = this;

		// not expensive, so doesn't need to be evaluated on-demand
		const types = this.paramTypes;

		const handler = {
			/**
			 * Return from this.#parameters if available, or calculate
			 * @param {Object.<string, HeliosData>} target 
			 * @param {string} name
			 * @returns 
			 */
			get(target, name) {
				if (name in target) {
					return target[name];
				} else {
					const type = assertDefined(types[name], `invalid param name '${name}'`);
					
					const uplcValue = that.evalParam(name);

					const value = (uplcValue instanceof UplcBool) ? new Bool(uplcValue.bool) : type.userType.fromUplcData(uplcValue.data);
						
					target[name] = value;

					return value;
				}
			},
		};

		return new Proxy(this.#parameters, handler);
	}

	/**
	 * @param {Object.<string, HeliosData | any>} values
	 */
	set parameters(values) {
		const types = this.paramTypes;

		for (let name in values) {
			const rawValue = values[name];

			const UserType = assertDefined(types[name], `invalid param name '${name}'`).userType;

			const value = rawValue instanceof UserType ? rawValue : new UserType(rawValue);

			this.#parameters[name] = value;

			this.changeParamSafe(name, value._toUplcData());
		}
	}

	/**
	 * @package
	 * @param {IR} ir
	 * @param {string[]} parameters
	 * @returns {IR}
	 */
	wrapEntryPoint(ir, parameters) {
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
				} else if (statement instanceof ImportStatement && statement.origStatement instanceof ConstStatement) {
					const i = parameters.findIndex(p => statement.name.value == p);

					if (i != -1) {
						parameterStatements[i] = statement.origStatement;
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
		 * @type {Map<string, IR>}
		 */
		const map = new Map();

		for (let [statement, _] of this.allStatements) {
			if (parameters.length > 0 && statement instanceof ConstStatement) {
				const i = parameterStatements.findIndex(cs => cs === statement);

				if (i != -1) {
					let ir = new IR(`__PARAM_${i}`);

					if (statement.type instanceof BoolType) {
						ir = new IR([
							new IR("__helios__common__unBoolData("),
							ir,
							new IR(")")
						]);
					}

					map.set(statement.path, ir); 

					continue;
				}
			}

			statement.toIR(map);

			if (statement.name.value == "main") {
				break;
			}
		}
 
		// builtin functions are added when the IR program is built
		// also replace all tabs with four spaces
		return wrapWithRawFunctions(IR.wrapWithDefinitions(ir, map));
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

		let main = this.mainFunc;
		let argTypeNames = main.argTypeNames;
		let retTypes = main.retTypes;
		let haveRedeemer = false;
		let haveScriptContext = false;

		if (argTypeNames.length > 2) {
			throw main.typeError("too many arguments for main");
		}

		for (let t of argTypeNames) {
			if (t == "Redeemer") {
				if (haveRedeemer) {
					throw main.typeError(`duplicate 'Redeemer' argument`);
				} else if (haveScriptContext) {
					throw main.typeError(`'Redeemer' must come before 'ScriptContext'`);
				} else {
					haveRedeemer = true;
				}
			} else if (t == "ScriptContext") {
				if (haveScriptContext) {
					throw main.typeError(`duplicate 'ScriptContext' argument`);
				} else {
					haveScriptContext = true;
				}
			} else {
				throw main.typeError(`illegal argument type, must be 'Redeemer' or 'ScriptContext', got '${t}'`);
			}
		}

		if (retTypes.length !== 1) {
			throw main.typeError(`illegal number of return values for main, expected 1, got ${retTypes.length}`);
		} else if (!(retTypes[0] instanceof BoolType)) {
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
		/** @type {IR[]} */
		const outerArgs = [];

		/** @type {IR[]} */
		const innerArgs = [];

		for (let t of this.mainFunc.argTypeNames) {
			if (t == "Redeemer") {
				innerArgs.push(new IR("redeemer"));
				outerArgs.push(new IR("redeemer"));
			} else if (t == "ScriptContext") {
				innerArgs.push(new IR("ctx"));
				if (outerArgs.length == 0) {
					outerArgs.push(new IR("_"));
				}
				outerArgs.push(new IR("ctx"));
			} else {
				throw new Error("unexpected");
			}
		}

		while(outerArgs.length < 2) {
			outerArgs.push(new IR("_"));
		}

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
		const retTypes = main.retTypes;
		let haveDatum = false;
		let haveRedeemer = false;
		let haveScriptContext = false;

		if (argTypeNames.length > 3) {
			throw main.typeError("too many arguments for main");
		}

		for (let t of argTypeNames) {
			if (t == "Datum") {
				if (haveDatum) {
					throw main.typeError("duplicate 'Datum' argument");
				} else if (haveRedeemer) {
					throw main.typeError("'Datum' must come before 'Redeemer'");
				} else if (haveScriptContext) {
					throw main.typeError("'Datum' must come before 'ScriptContext'");
				} else {
					haveDatum = true;
				}
			} else if (t == "Redeemer") {
				if (haveRedeemer) {
					throw main.typeError("duplicate 'Redeemer' argument");
				} else if (haveScriptContext) {
					throw main.typeError("'Redeemer' must come before 'ScriptContext'");
				} else {
					haveRedeemer = true;
				}
			} else if (t == "ScriptContext") {
				if (haveScriptContext) {
					throw main.typeError("duplicate 'ScriptContext' argument");
				} else {
					haveScriptContext = true;
				}
			} else {
				throw main.typeError(`illegal argument type, must be 'Datum', 'Redeemer' or 'ScriptContext', got '${t}'`);
			}
		}

		if (retTypes.length !== 1) {
			throw main.typeError(`illegal number of return values for main, expected 1, got ${retTypes.length}`);
		} else if (!(retTypes[0] instanceof BoolType)) {
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
		/** @type {IR[]} */
		const outerArgs = [];

		/** @type {IR[]} */
		const innerArgs = [];

		for (let t of this.mainFunc.argTypeNames) {
			if (t == "Datum") {
				innerArgs.push(new IR("datum"));
				outerArgs.push(new IR("datum"));
			} else if (t == "Redeemer") {
				innerArgs.push(new IR("redeemer"));
				if (outerArgs.length == 0) {
					outerArgs.push(new IR("_"));
				}
				outerArgs.push(new IR("redeemer"));
			} else if (t == "ScriptContext") {
				innerArgs.push(new IR("ctx"));
				while (outerArgs.length < 2) {
					outerArgs.push(new IR("_"));
				}
				outerArgs.push(new IR("ctx"));
			} else {
				throw new Error("unexpected");
			}
		}

		while(outerArgs.length < 3) {
			outerArgs.push(new IR("_"));
		}

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

		// main can have any arg types, and any return type 

		if (this.mainFunc.retTypes.length > 1) {
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
		let args = this.mainFunc.argTypes.map((_, i) => new IR(`arg${i}`));

		let ir = new IR([
			new IR(`${TAB}/*entry point*/\n${TAB}(`),
			new IR(args).join(", "),
			new IR(`) -> {\n${TAB}${TAB}`),
			new IR([
				new IR(`${this.mainPath}(`),
				new IR(args).join(", "),
				new IR(")"),
			]),
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