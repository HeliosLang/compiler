//@ts-check
// Fuzzy testing framework

import {
    Site,
    RuntimeError
} from "./tokens.js";

/**
 * @typedef {import("./crypto.js").NumberGenerator} NumberGenerator
 */

import {
    Crypto
} from "./crypto.js";

import {
    ByteArrayData,
    ConstrData,
    IntData,
    ListData,
    MapData,
    UplcData
} from "./uplc-data.js";

/**
 * @typedef {import("./uplc-costmodels.js").Cost} Cost
 */

import { 
	NetworkParams,
} from "./uplc-costmodels.js";

import {
	DEFAULT_UPLC_RTE_CALLBACKS,
    UplcDataValue,
    UplcValue
} from "./uplc-ast.js";

import {
    extractScriptPurposeAndName
} from "./helios-ast-build.js";

import {
    Program
} from "./helios-program.js";

import {
	rawNetworkEmulatorParams
} from "./emulator.js";

/**
 * @typedef {() => UplcData} ValueGenerator
 */

/**
 * @typedef {(args: UplcValue[], res: (UplcValue | RuntimeError), isSimplfied?: boolean) => (boolean | Object.<string, boolean>)} PropertyTest
 */

/**
 * Creates generators and runs script tests
 */
export class FuzzyTest {
	/**
	 * @type {number}
	 */
	#seed;

	/**
	 * @type {NumberGenerator} - seed generator
	 */
	#rand;

	#runsPerTest;

	#simplify;

	/**
	 * @type {NetworkParams}
	 */
	#dummyNetworkParams;

	/**
	 * @param {number} seed
	 * @param {number} runsPerTest
	 * @param {boolean} simplify - if true then also test the simplified program
	 */
	constructor(seed = 0, runsPerTest = 100, simplify = false) {
		console.log("starting fuzzy testing  with seed", seed);

		this.#seed = seed;
		this.#rand = Crypto.rand(seed);
		this.#runsPerTest = runsPerTest;
		this.#simplify = simplify;
		this.#dummyNetworkParams = new NetworkParams(rawNetworkEmulatorParams);
	}

	reset() {
		this.#rand = Crypto.rand(this.#seed);
	}

	/**
	 * @returns {NumberGenerator}
	 */
	newRand() {
		let seed = this.#rand()*1000000;

		return Crypto.rand(seed);
	}

	/**
	 * Returns a gernator for whole numbers between min and max
	 * @param {number} min
	 * @param {number} max
	 * @returns {() => bigint}
	 */
	rawInt(min = -10000000, max = 10000000) {
		let rand = this.newRand();

		return function() {
			return BigInt(Math.floor(rand()*(max - min)) + min);
		}
	}

	/**
	 * Returns a generator for whole numbers between min and max, wrapped with IntData
	 * @param {number} min
	 * @param {number} max
	 * @returns {ValueGenerator}
	 */
	int(min = -10000000, max = 10000000) {		
		let rand = this.rawInt(min, max);

		return function() {
			return new IntData(rand());
		}
	}

	/**
	 * @param {number} min 
	 * @param {number} max 
	 * @returns {ValueGenerator}
	 */
	real(min = -1000, max = 1000) {
		let rand = this.newRand();

		return function() {
			return new IntData(BigInt(Math.floor(((rand()*(max - min)) + min)*1000000)))
		}
	}

	/**
	 * Returns a generator for strings containing any utf-8 character
	 * @param {number} minLength
	 * @param {number} maxLength
	 * @returns {ValueGenerator}
	 */
	string(minLength = 0, maxLength = 64) {
		let rand = this.newRand();

		return function() {
			let n = Math.round(rand()*(maxLength - minLength)) + minLength;
			if (n < 0) {
				n = 0;
			}

			let chars = [];
			for (let i = 0; i < n; i++) {
				chars.push(String.fromCodePoint(Math.round(rand()*1112064)));
			}
			
			return ByteArrayData.fromString(chars.join(""));
		}
	}

	/** 
	 * Returns a generator for strings with ascii characters from 32 (space) to 126 (tilde)
	 * @param {number} minLength
	 * @param {number} maxLength
	 * @returns {ValueGenerator}
	 */
	ascii(minLength = 0, maxLength = 64) {
		let rand = this.newRand();

		return function() {
			let n = Math.round(rand()*(maxLength - minLength)) + minLength;
			if (n < 0) {
				n = 0;
			}

			let chars = [];
			for (let i = 0; i < n; i++) {
				chars.push(String.fromCharCode(Math.round(rand()*94 + 32)));
			}
			
			return ByteArrayData.fromString(chars.join(""));
		}
	}

	/**
	 * Returns a generator for bytearrays containing only valid ascii characters
	 * @param {number} minLength
	 * @param {number} maxLength
	 * @returns {ValueGenerator}
	 */
	asciiBytes(minLength = 0, maxLength = 64) {
		let rand = this.newRand();

		return function() {
			let n = Math.round(rand()*(maxLength - minLength)) + minLength;
			if (n < 0) {
				n = 0;
			}

			let bytes = [];
			for (let i = 0; i < n; i++) {
				bytes.push(Math.floor(rand()*94 + 32));
			}

			return new ByteArrayData(bytes);
		}
	}

	/**
	 * Returns a generator for bytearrays the are also valid utf8 strings
	 * @param {number} minLength - length of the string, not of the bytearray!
	 * @param {number} maxLength - length of the string, not of the bytearray!
	 * @returns {ValueGenerator}
	 */
	utf8Bytes(minLength = 0, maxLength = 64) {
		return this.string(minLength, maxLength);
	}

	/**
	 * Returns a generator for number[]
	 * @param {number} minLength
	 * @param {number} maxLength
	 * @returns {() => number[]}
	 */
	rawBytes(minLength = 0, maxLength = 64) {
		let rand = this.newRand();

		return function() {
			let n = Math.round(rand()*(maxLength - minLength)) + minLength;
			if (n < 0) {
				n = 0;
			}

			let bytes = [];
			for (let i = 0; i < n; i++) {
				bytes.push(Math.floor(rand()*256));
			}

			return bytes;
		}
	}

	/**
	 * Returns a generator for bytearrays 
	 * @param {number} minLength
	 * @param {number} maxLength
	 * @returns {ValueGenerator}
	 */
	bytes(minLength = 0, maxLength = 64) {
		let rand = this.rawBytes(minLength, maxLength);

		return function() {
			let bytes = rand();

			return new ByteArrayData(bytes);
		}
	}
	/**
	 * Returns a generator for booleans,
	 * @returns {() => boolean}
	 */
	rawBool() {
		let rand = this.newRand();

		return function() {
			let x = rand();

			return x >= 0.5;
		}
	}

	/**
	 * Returns a generator for booleans, wrapped with ConstrData
	 * @returns {ValueGenerator}
	 */
	bool() {
		let rand = this.rawBool();

		return function() {
			return new ConstrData(rand() ? 1 : 0, []);
		}
	}

	/**
	 * Returns a generator for options
	 * @param {ValueGenerator} someGenerator
	 * @param {number} noneProbability
	 * @returns {ValueGenerator}
	 */
	option(someGenerator, noneProbability = 0.5) {
		let rand = this.newRand();

		return function() {
			let x = rand();

			if (x < noneProbability) {
				return new ConstrData(1, []);
			} else {
				return new ConstrData(0, [someGenerator()]);
			}
		}
	}

	/**
	 * Returns a generator for lists
	 * @param {ValueGenerator} itemGenerator
	 * @param {number} minLength
	 * @param {number} maxLength
	 * @returns {ValueGenerator}
	 */
	list(itemGenerator, minLength = 0, maxLength = 10) {
		let rand = this.newRand();

		if (minLength < 0) {
			minLength = 0;
		}

		if (maxLength < 0) {
			maxLength = 0;
		}

		return function() {
			let n = Math.round(rand()*(maxLength - minLength)) + minLength;
			if (n < 0) {
				n = 0;
			}

			/**
			 * @type {UplcData[]}
			 */
			let items = [];

			for (let i = 0; i < n; i++) {
				items.push(itemGenerator());
			}

			return new ListData(items);
		}
	}

	/**
	 * Returns a generator for maps
	 * @param {ValueGenerator} keyGenerator
	 * @param {ValueGenerator} valueGenerator
	 * @param {number} minLength
	 * @param {number} maxLength
	 * @returns {ValueGenerator}
	 */
	map(keyGenerator, valueGenerator, minLength = 0, maxLength = 10) {
		let rand = this.newRand();

		if (minLength < 0) {
			minLength = 0;
		}

		if (maxLength < 0) {
			maxLength = 0;
		}

		return function() {
			let n = Math.round(rand()*(maxLength - minLength)) + minLength;

			if (n < 0) {
				n = 0;
			}

			/**
			 * @type {[UplcData, UplcData][]}
			 */
			let pairs = [];

			for (let i = 0; i < n; i++) {
				pairs.push([keyGenerator(), valueGenerator()]);
			}

			return new MapData(pairs);
		};
	}

	/**
	 * Returns a generator for objects
	 * @param {...ValueGenerator} itemGenerators
	 * @returns {ValueGenerator}
	 */
	object(...itemGenerators) {
		return function() {
			let items = itemGenerators.map(g => g());

			return new ConstrData(0, items);
		}
	}

	/**
	 * Returns a generator for tagged constr
	 * @param {number | NumberGenerator} tag
	 * @param {...ValueGenerator} fieldGenerators
	 * @returns {ValueGenerator}
	 */
	constr(tag, ...fieldGenerators) {
		return function() {
			const fields = fieldGenerators.map(g => g());

			const finalTag = (typeof tag == "number") ? tag : Math.round(tag()*100);
			
			return new ConstrData(finalTag, fields);
		}
	}

	/**
	 * Run a test
	 * @param {ValueGenerator[]} argGens
	 * @param {string} src
	 * @param {PropertyTest} propTest
	 * @param {number} nRuns
	 * @param {boolean} simplify
	 * @returns {Promise<void>} - throws an error if any of the property tests fail
	 */
	async test(argGens, src, propTest, nRuns = this.#runsPerTest, simplify = false) {
		// compilation errors here aren't caught

		let purposeName = extractScriptPurposeAndName(src);

		if (purposeName === null) {
			throw new Error("failed to get script purpose and name");
		} else {
			let [_, testName] = purposeName;

			let program = Program.new(src).compile(simplify);

			/**
			 * @type {Cost}
			 */
			const totalCost = {
				mem: 0n,
				cpu: 0n
			};

			let nonErrorRuns = 0;

			for (let it = 0; it < nRuns; it++) {
				let args = argGens.map(gen => new UplcDataValue(Site.dummy(), gen()));
			
				/**
				 * @type {Cost}
				 */
				const cost = {
					mem: 0n,
					cpu: 0n
				};

				let result = await program.run(
					args, {
						...DEFAULT_UPLC_RTE_CALLBACKS,
						onPrint: async (msg) => {return},
						onIncrCost: (name, isTerm, c) => {cost.mem = cost.mem + c.mem; cost.cpu = cost.cpu + c.cpu}
					},
					this.#dummyNetworkParams
				);

				let obj = propTest(args, result, simplify);

				if (result instanceof UplcValue) {
					totalCost.mem += cost.mem;
					totalCost.cpu += cost.cpu;
					nonErrorRuns += 1;
				}

				if (typeof obj == "boolean") {
					if (!obj) {
						throw new Error(`property test '${testName}' failed (info: (${args.map(a => a.toString()).join(', ')}) => ${result.toString()})`);
					}
				} else {
					// check for failures
					for (let key in obj) {
						if (!obj[key]) {
							throw new Error(`property test '${testName}:${key}' failed (info: (${args.map(a => a.toString()).join(', ')}) => ${result.toString()})`);
						}
					}
				}
			}

			console.log(`property tests for '${testName}' succeeded${simplify ? " (simplified)":""} (${program.calcSize()} bytes, ${nonErrorRuns > 0 ? totalCost.mem/BigInt(nonErrorRuns): "N/A"} mem, ${nonErrorRuns > 0 ? totalCost.cpu/BigInt(nonErrorRuns): "N/A"} cpu)`);
		}

		if (!simplify && this.#simplify) {
			await this.test(argGens, src, propTest, nRuns, true);
		}
	}

	/**
	 * @param {Object.<string, ValueGenerator>} paramGenerators
	 * @param {string[]} paramArgs
	 * @param {string} src
	 * @param {PropertyTest} propTest
	 * @param {number} nRuns
	 * @param {boolean} simplify
	 * @returns {Promise<void>}
	 */
	async testParams(paramGenerators, paramArgs, src, propTest, nRuns = this.#runsPerTest, simplify = false) {
		let program = Program.new(src);

		let purposeName = extractScriptPurposeAndName(src);

		if (purposeName === null) {
			throw new Error("failed to get script purpose and name");
		} else {
			let [_, testName] = purposeName;

			for (let it = 0; it < nRuns; it++) {

				for (let key in paramGenerators) {
					program.changeParamSafe(key, paramGenerators[key]())
				}

				let args = paramArgs.map(paramArg => program.evalParam(paramArg));
			
				let coreProgram = Program.new(src).compile(simplify);

				let result = await coreProgram.run(args);

				let obj = propTest(args, result, simplify);

				if (typeof obj == "boolean") {
					if (!obj) {
						throw new Error(`property test '${testName}' failed (info: (${args.map(a => a.toString()).join(', ')}) => ${result.toString()})`);
					}
				} else {
					// check for failures
					for (let key in obj) {
						if (!obj[key]) {
							throw new Error(`property test '${testName}:${key}' failed (info: (${args.map(a => a.toString()).join(', ')}) => ${result.toString()})`);
						}
					}
				}
			}

			console.log(`property tests for '${testName}' succeeded${simplify ? " (simplified)":""}`);
		}

		if (!simplify && this.#simplify) {
			await this.testParams(paramGenerators, paramArgs, src, propTest, nRuns, true);
		}
	}
}