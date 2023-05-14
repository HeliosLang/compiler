//@ts-check
// IR definitions

import {
	REAL_PRECISION,
	config
} from "./config.js";

import {
    assert,
	assertDefined,
	replaceTabs
} from "./utils.js";

import {
	IR, 
	IRParametricName,
	FTPP,
	TTPP
} from "./tokens.js";

/**
 * @typedef {import("./tokens.js").IRDefinitions} IRDefinitions
 */

/**
 * For collecting test coverage statistics
 * @type {?((name: string, count: number) => void)}
 */
var onNotifyRawUsage = null;

/**
 * Set the statistics collector (used by the test-suite)
 * @param {(name: string, count: number) => void} callback 
 */
function setRawUsageNotifier(callback) {
	onNotifyRawUsage = callback;
}

const RE_BUILTIN = new RegExp("(?<![@[])__helios[a-zA-Z0-9_@[\\]]*", "g");

/**
 * Wrapper for a builtin function (written in IR)
 */
class RawFunc {
	#name;
	#definition;

	/** @type {Set<string>} */
	#dependencies;

	/**
	 * Construct a RawFunc, and immediately scan the definition for dependencies
	 * @param {string} name 
	 * @param {string} definition 
	 */
	constructor(name, definition) {
		this.#name = name;
		assert(definition != undefined);
		this.#definition = definition;
		this.#dependencies = new Set();

		let matches = this.#definition.match(RE_BUILTIN);

		if (matches !== null) {
			for (let match of matches) {
				this.#dependencies.add(match);
			}
		}
	}

	get name() {
		return this.#name;
	}

	/**
	 * @returns {IR}
	 */
	toIR() {
		return new IR(replaceTabs(this.#definition))
	}

	/**
	 * Loads 'this.#dependecies' (if not already loaded), then load 'this'
	 * @param {Map<string, RawFunc>} db 
	 * @param {IRDefinitions} dst 
	 * @returns {void}
	 */
	load(db, dst) {
		if (onNotifyRawUsage !== null) {
			onNotifyRawUsage(this.#name, 1);
		}

		if (dst.has(this.#name)) {
			return;
		} else {
			for (let dep of this.#dependencies) {
				if (!db.has(dep)) {
					throw new Error(`InternalError: dependency ${dep} is not a builtin`);
				} else {
					assertDefined(db.get(dep)).load(db, dst);
				}
			}

			dst.set(this.#name, this.toIR());
		}
	}
}

/**
 * Initializes the db containing all the builtin functions
 * @returns {Map<string, RawFunc>}
 */
// only need to wrap these source in IR right at the very end
function makeRawFunctions() {
	/** @type {Map<string, RawFunc>} */
	let db = new Map();

	// local utility functions

	/**
	 * @param {RawFunc} fn 
	 */
	function add(fn) {
		if (db.has(fn.name)) {
			throw new Error(`builtin ${fn.name} duplicate`);
		}
		db.set(fn.name, fn);
	}

	/**
	 * @param {string} ns 
	 */
	function addNeqFunc(ns) {
		add(new RawFunc(`${ns}____neq`, 
		`(self, other) -> {
			__helios__bool____not(${ns}____eq(self, other))
		}`));
	}

	/**
	 * @param {string} ns 
	 */
	function addDataLikeEqFunc(ns) {
		add(new RawFunc(`${ns}____eq`, 
		`(self, other) -> {
			__core__equalsData(${ns}____to_data(self), ${ns}____to_data(other))
		}`));
	}

	/**
	 * @param {string} ns 
	 */
	function addSerializeFunc(ns) {
		add(new RawFunc(`${ns}__serialize`, 
		`(self) -> {
			() -> {
				__core__serialiseData(${ns}____to_data(self))
			}
		}`));
	}

	/**
	 * @param {string} ns 
	 */
	function addIntLikeFuncs(ns) {
		add(new RawFunc(`${ns}____eq`, "__helios__int____eq"));
		add(new RawFunc(`${ns}____neq`, "__helios__int____neq"));
		add(new RawFunc(`${ns}__serialize`, "__helios__int__serialize"));
		add(new RawFunc(`${ns}__from_data`, "__helios__int__from_data"));
		add(new RawFunc(`${ns}____to_data`, "__helios__int____to_data"));
	}

	/**
	 * @param {string} ns 
	 */
	function addByteArrayLikeFuncs(ns) {
		add(new RawFunc(`${ns}____eq`, "__helios__bytearray____eq"));
		add(new RawFunc(`${ns}____neq`, "__helios__bytearray____neq"));
		add(new RawFunc(`${ns}__serialize`, "__helios__bytearray__serialize"));
		add(new RawFunc(`${ns}__from_data`, "__helios__bytearray__from_data"));
		add(new RawFunc(`${ns}____to_data`, "__helios__bytearray____to_data"));
		add(new RawFunc(`${ns}____lt`, "__helios__bytearray____lt"));
		add(new RawFunc(`${ns}____leq`, "__helios__bytearray____leq"));
		add(new RawFunc(`${ns}____gt`, "__helios__bytearray____gt"));
		add(new RawFunc(`${ns}____geq`, "__helios__bytearray____geq"));
		add(new RawFunc(`${ns}__new`, `__helios__common__identity`));
		add(new RawFunc(`${ns}__show`, "__helios__bytearray__show"));
	}

	/**
	 * Adds basic auto members to a fully named type
	 * @param {string} ns 
	 */
	function addDataFuncs(ns) {
		add(new RawFunc(`${ns}____eq`, "__helios__common____eq"));
		add(new RawFunc(`${ns}____neq`, "__helios__common____neq"));
		add(new RawFunc(`${ns}__serialize`, "__helios__common__serialize"));
		add(new RawFunc(`${ns}__from_data`, "__helios__common__identity"));
		add(new RawFunc(`${ns}____to_data`, "__helios__common__identity"));
	}

	/**
	 * Adds basic auto members to a fully named enum type
	 * @param {string} ns 
	 * @param {number} constrIndex
	 */
	function addEnumDataFuncs(ns, constrIndex) {
		add(new RawFunc(`${ns}____eq`, "__helios__common____eq"));
		add(new RawFunc(`${ns}____neq`, "__helios__common____neq"));
		add(new RawFunc(`${ns}__serialize`, "__helios__common__serialize"));
		add(new RawFunc(`${ns}____to_data`, "__helios__common__identity"));
		add(new RawFunc(`${ns}__from_data`, 
		`(data) -> {
			__helios__common__assert_constr_index(data, ${constrIndex})
		}`))
	}

	/**
	 * Generates the IR needed to unwrap a Plutus-core constrData
	 * @param {string} dataExpr
	 * @param {number} iConstr 
	 * @param {number} iField 
	 * @param {string} errorExpr 
	 * @returns {string}
	 */
	function unData(dataExpr, iConstr, iField, errorExpr = "error(\"unexpected constructor index\")") {
		let inner = "__core__sndPair(pair)";
		for (let i = 0; i < iField; i++) {
			inner = `__core__tailList(${inner})`;
		}

		// deferred evaluation of ifThenElse branches
		return `(pair) -> {__core__ifThenElse(__core__equalsInteger(__core__fstPair(pair), ${iConstr}), () -> {__core__headList(${inner})}, () -> {${errorExpr}})()}(__core__unConstrData(${dataExpr}))`;
	}

	/**
	 * Generates verbose IR for unwrapping a Plutus-core constrData.
	 * If config.DEBUG === false then returns IR without print statement
	 * @param {string} dataExpr
	 * @param {string} constrName
	 * @param {number} iConstr
	 * @param {number} iField
	 * @returns {string}
	 */
	function unDataVerbose(dataExpr, constrName, iConstr, iField) {
		if (!config.DEBUG) {
			return unData(dataExpr, iConstr, iField);
		} else {
			return unData(dataExpr, iConstr, iField, `__helios__common__verbose_error(__core__appendString("bad constr for ${constrName}, want ${iConstr.toString()} but got ", __helios__int__show(__core__fstPair(pair))()))`)
		}
	}

	/**
	 * Generates IR for constructing a list.
	 * By default the result is kept as list, and not converted to data
	 * @param {string[]} args 
	 * @param {boolean} toData 
	 * @returns 
	 */
	function makeList(args, toData = false) {
		let n = args.length;
		let inner = "__core__mkNilData(())";

		for (let i = n - 1; i >= 0; i--) {
			inner = `__core__mkCons(${args[i]}, ${inner})`;
		}

		if (toData) {
			inner = `__core__listData(${inner})`
		}

		return inner;
	}


	// Common builtins
	add(new RawFunc("__helios__common__verbose_error",
	`(msg) -> {
		__core__trace(msg, () -> {error("")})()
	}`));
	add(new RawFunc("__helios__common__assert_constr_index",
	`(data, i) -> {
		__core__ifThenElse(
			__core__equalsInteger(__core__fstPair(__core__unConstrData(data)), i),
			() -> {data},
			() -> {error("unexpected constructor index")}
		)()
	}`));
	add(new RawFunc("__helios__common__identity",
	`(self) -> {self}`));
	add(new RawFunc("__helios__common____eq", "__core__equalsData"));
	add(new RawFunc("__helios__common____neq",
	`(a, b) -> {
		__helios__bool____not(__core__equalsData(a, b))
	}`));
	add(new RawFunc("__helios__common__serialize",
	`(self) -> {
		() -> {
			__core__serialiseData(self)
		}
	}`));
	add(new RawFunc("__helios__common__any",
	`(self, fn) -> {
		(recurse) -> {
			recurse(recurse, self, fn)
		}(
			(recurse, self, fn) -> {
				__core__chooseList(
					self, 
					() -> {false}, 
					() -> {
						__core__ifThenElse(
							fn(__core__headList(self)),
							() -> {true}, 
							() -> {recurse(recurse, __core__tailList(self), fn)}
						)()
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__all", 
	`(self, fn) -> {
		(recurse) -> {
			recurse(recurse, self, fn)
		}(
			(recurse, self, fn) -> {
				__core__chooseList(
					self,
					() -> {true},
					() -> {
						__core__ifThenElse(
							fn(__core__headList(self)),
							() -> {recurse(recurse, __core__tailList(self), fn)},
							() -> {false}
						)()
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__map",
	`(self, fn, init) -> {
		(recurse) -> {
			recurse(recurse, self, init)
		}(
			(recurse, rem, lst) -> {
				__core__chooseList(
					rem,
					() -> {lst},
					() -> {
						__core__mkCons(
							fn(__core__headList(rem)), 
							recurse(recurse, __core__tailList(rem), lst)
						)
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__filter", 
	`(self, fn, nil) -> {
		(recurse) -> {
			recurse(recurse, self, fn)
		}(
			(recurse, self, fn) -> {
				__core__chooseList(
					self, 
					() -> {nil}, 
					() -> {
						__core__ifThenElse(
							fn(__core__headList(self)),
							() -> {__core__mkCons(__core__headList(self), recurse(recurse, __core__tailList(self), fn))}, 
							() -> {recurse(recurse, __core__tailList(self), fn)}
						)()
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__filter_list", 
	`(self, fn) -> {
		__helios__common__filter(self, fn, __helios__common__list_0)
	}`));
	add(new RawFunc("__helios__common__filter_map",
	`(self, fn) -> {
		__helios__common__filter(self, fn, __core__mkNilPairData(()))
	}`));
	add(new RawFunc("__helios__common__find",
	`(self, fn) -> {
		(recurse) -> {
			recurse(recurse, self, fn)
		}(
			(recurse, self, fn) -> {
				__core__chooseList(
					self, 
					() -> {error("not found")}, 
					() -> {
						__core__ifThenElse(
							fn(__core__headList(self)), 
							() -> {__core__headList(self)}, 
							() -> {recurse(recurse, __core__tailList(self), fn)}
						)()
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__find_safe",
	`(self, fn, callback) -> {
		(recurse) -> {
			recurse(recurse, self, fn)
		}(
			(recurse, self, fn) -> {
				__core__chooseList(
					self, 
					() -> {__core__constrData(1, __helios__common__list_0)}, 
					() -> {
						__core__ifThenElse(
							fn(__core__headList(self)), 
							() -> {__core__constrData(0, __helios__common__list_1(callback(__core__headList(self))))}, 
							() -> {recurse(recurse, __core__tailList(self), fn)}
						)()
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__fold",
	`(self, fn, z) -> {
		(recurse) -> {
			recurse(recurse, self, fn, z)
		}(
			(recurse, self, fn, z) -> {
				__core__chooseList(
					self, 
					() -> {z}, 
					() -> {recurse(recurse, __core__tailList(self), fn, fn(z, __core__headList(self)))}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__fold_lazy",
	`(self, fn, z) -> {
		(recurse) -> {
			recurse(recurse, self, fn, z)
		}(
			(recurse, self, fn, z) -> {
				__core__chooseList(
					self, 
					() -> {z}, 
					() -> {fn(__core__headList(self), () -> {recurse(recurse, __core__tailList(self), fn, z)})}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__insert_in_sorted",
	`(x, lst, comp) -> {
		(recurse) -> {
			recurse(recurse, lst)
		}(
			(recurse, lst) -> {
				__core__chooseList(
					lst,
					() -> {__core__mkCons(x, lst)},
					() -> {
						(head) -> {
							__core__ifThenElse(
								comp(x, head),
								() -> {__core__mkCons(x, lst)},
								() -> {__core__mkCons(head, recurse(recurse, __core__tailList(lst)))}
							)()
						}(__core__headList(lst))
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__sort", 
	`(lst, comp) -> {
		(recurse) -> {
			recurse(recurse, lst)
		}(
			(recurse, lst) -> {
				__core__chooseList(
					lst,
					() -> {lst},
					() -> {
						(head, tail) -> {
							__helios__common__insert_in_sorted(head, tail, comp)
						}(__core__headList(lst), recurse(recurse, __core__tailList(lst)))
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__map_get",
	`(self, key, fnFound, fnNotFound) -> {
		(recurse) -> {
			recurse(recurse, self, key)
		}(
			(recurse, self, key) -> {
				__core__chooseList(
					self, 
					fnNotFound, 
					() -> {
						__core__ifThenElse(
							__core__equalsData(key, __core__fstPair(__core__headList(self))), 
							() -> {fnFound(__core__sndPair(__core__headList(self)))}, 
							() -> {recurse(recurse, __core__tailList(self), key)}
						)()
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__is_in_bytearray_list",
	`(lst, key) -> {
		__helios__common__any(lst, (item) -> {__core__equalsData(item, key)})
	}`));
	add(new RawFunc("__helios__common__length", 
	`(lst) -> {
		(recurse) -> {
			recurse(recurse, lst)
		}(
			(recurse, lst) -> {
				__core__chooseList(
					lst, 
					() -> {0}, 
					() -> {__core__addInteger(recurse(recurse, __core__tailList(lst)), 1)}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__concat", 
	`(a, b) -> {
		(recurse) -> {
			recurse(recurse, b, a)
		}(
			(recurse, lst, rem) -> {
				__core__chooseList(
					rem,
					() -> {lst},
					() -> {__core__mkCons(__core__headList(rem), recurse(recurse, lst, __core__tailList(rem)))}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__common__slice_bytearray",
	`(self, selfLengthFn) -> {
		(start, end) -> {
			(normalize) -> {
				(fn) -> {
					fn(normalize(start))
				}(
					(start) -> {
						(fn) -> {
							fn(normalize(end))
						}(
							(end) -> {
								__core__sliceByteString(start, __core__subtractInteger(end, __helios__int__max(start, 0)), self)
							}
						)
					}
				)
			}(
				(pos) -> {
					__core__ifThenElse(
						__core__lessThanInteger(pos, 0),
						() -> {
							__core__addInteger(__core__addInteger(selfLengthFn(self), 1), pos)
						},
						() -> {
							pos
						}
					)()
				}
			)
		}
	}`));
	add(new RawFunc("__helios__common__starts_with", 
	`(self, selfLengthFn) -> {
		(prefix) -> {
			(n, m) -> {
				__core__ifThenElse(
					__core__lessThanInteger(n, m),
					() -> {false},
					() -> {
						__core__equalsByteString(prefix, __core__sliceByteString(0, m, self))
					}
				)()
			}(selfLengthFn(self), __core__lengthOfByteString(prefix))
		}
	}`));
	add(new RawFunc("__helios__common__ends_with",
	`(self, selfLengthFn) -> {
		(suffix) -> {
			(n, m) -> {
				__core__ifThenElse(
					__core__lessThanInteger(n, m),
					() -> {false},
					() -> {
						__core__equalsByteString(suffix, __core__sliceByteString(__core__subtractInteger(n, m), m, self))
					}
				)()
			}(selfLengthFn(self), __core__lengthOfByteString(suffix))
		}
	}`));
	add(new RawFunc("__helios__common__fields", 
	`(self) -> {
		__core__sndPair(__core__unConstrData(self))
	}`));
	add(new RawFunc("__helios__common__field_0", 
	`(self) -> {
		__core__headList(__helios__common__fields(self))
	}`));
	add(new RawFunc("__helios__common__fields_after_0",
	`(self) -> {
		__core__tailList(__helios__common__fields(self))
	}`));
	for (let i = 1; i < 20; i++) {
		add(new RawFunc(`__helios__common__field_${i.toString()}`,
	`(self) -> {
		__core__headList(__helios__common__fields_after_${(i-1).toString()}(self))
	}`));
		add(new RawFunc(`__helios__common__fields_after_${i.toString()}`,
	`(self) -> {
		__core__tailList(__helios__common__fields_after_${(i-1).toString()}(self))
	}`));
	}
	add(new RawFunc("__helios__common__tuple_field_0", "__core__headList"));
	add(new RawFunc("__helios__common__tuple_fields_after_0", "__core__tailList"));
	for (let i = 1; i < 20; i++) {
		add(new RawFunc(`__helios__common__tuple_field_${i.toString()}`,
	`(self) -> {
		__core__headList(__helios__common__tuple_fields_after_${(i-1).toString()}(self))
	}`));
		add(new RawFunc(`__helios__common__tuple_fields_after_${i.toString()}`,
	`(self) -> {
		__core__tailList(__helios__common__tuple_fields_after_${(i-1).toString()}(self))
	}`));
	}
	add(new RawFunc("__helios__common__list_0", "__core__mkNilData(())"));
	add(new RawFunc("__helios__common__list_1", 
	`(a) -> {
		__core__mkCons(a, __helios__common__list_0)
	}`));
	for (let i = 2; i < 20; i++) {
		/**
		 * @type {string[]}
		 */
		let args = [];

		for (let j = 0; j < i; j++) {
			args.push(`arg${j.toString()}`);
		}

		let woFirst = args.slice()
		let first = assertDefined(woFirst.shift());

		add(new RawFunc(`__helios__common__list_${i.toString()}`,
	`(${args.join(", ")}) -> {
		__core__mkCons(${first}, __helios__common__list_${(i-1).toString()}(${woFirst.join(", ")}))
	}`));
	}
	add(new RawFunc(`__helios__common__hash_datum_data[${FTPP}0]`, 
	`(data) -> {
		__core__blake2b_256(${FTPP}0__serialize(data)())
	}`));


	// Global builtin functions
	add(new RawFunc("__helios__print", 
	`(msg) -> {
		__core__trace(msg, ())
	}`));
	add(new RawFunc("__helios__error",
	`(msg) -> {
		__core__trace(
			msg, 
			() -> {
				error("error thrown by user-code")
			}
		)()
	}`));
	add(new RawFunc("__helios__assert",
	`(cond, msg) -> {
		__core__ifThenElse(
			cond,
			() -> {
				()
			},
			() -> {
				__core__trace(
					msg,
					() -> {
						error("assert failed")
					}
				)()
			}
		)()
	}`));


	// Int builtins
	add(new RawFunc("__helios__int____eq", "__core__equalsInteger"));
	add(new RawFunc("__helios__int__from_data", "__core__unIData"));
	add(new RawFunc("__helios__int____to_data", "__core__iData"));
	addNeqFunc("__helios__int");
	addSerializeFunc("__helios__int");
	add(new RawFunc("__helios__int____neg",
	`(self) -> {
		__core__multiplyInteger(self, -1)
	}`));
	add(new RawFunc("__helios__int____pos", "__helios__common__identity"));
	add(new RawFunc("__helios__int____add", "__core__addInteger"));
	add(new RawFunc("__helios__int____sub", "__core__subtractInteger"));
	add(new RawFunc("__helios__int____mul", "__core__multiplyInteger"));
	add(new RawFunc("__helios__int____div", "__core__divideInteger"));
	add(new RawFunc("__helios__int____mod", "__core__modInteger"));
	add(new RawFunc("__helios__int____add1",
	`(a, b) -> {
		__core__addInteger(
			__core__multiplyInteger(a, __helios__real__ONE),
			b
		)
	}`));
	add(new RawFunc("__helios__int____sub1",
	`(a, b) -> {
		__core__subtractInteger(
			__core__multiplyInteger(a, __helios__real__ONE),
			b
		)
	}`));
	add(new RawFunc("__helios__int____mul1", "__helios__int____mul"));
	add(new RawFunc("__helios__int____div1",
	`(a, b) -> {
		__core__divideInteger(
			__core__multiplyInteger(a, __helios__real__ONESQ),
			b
		)
	}`));
	add(new RawFunc("__helios__int____geq",
	`(a, b) -> {
		__helios__bool____not(__core__lessThanInteger(a, b))
	}`));
	add(new RawFunc("__helios__int____gt",
	`(a, b) -> {
		__helios__bool____not(__core__lessThanEqualsInteger(a, b))
	}`));
	add(new RawFunc("__helios__int____leq", "__core__lessThanEqualsInteger"));
	add(new RawFunc("__helios__int____lt", "__core__lessThanInteger"));
	add(new RawFunc("__helios__int____geq1",
	`(a, b) -> {
		__helios__bool____not(
			__core__lessThanInteger(
				__core__multiplyInteger(a, __helios__real__ONE),
				b
			)
		)
	}`));
	add(new RawFunc("__helios__int____gt1",
	`(a, b) -> {
		__helios__bool____not(
			__core__lessThanEqualsInteger(
				__core__multiplyInteger(a, __helios__real__ONE),
				b
			)
		)
	}`));
	add(new RawFunc("__helios__int____leq1",
	`(a, b) -> {
		__core__lessThanEqualsInteger(
			__core__multiplyInteger(a, __helios__real__ONE),
			b
		)
	}`));
	add(new RawFunc("__helios__int____lt1",
	`(a, b) -> {
		__core__lessThanInteger(
			__core__multiplyInteger(a, __helios__real__ONE),
			b
		)
	}`));
	add(new RawFunc("__helios__int__min",
	`(a, b) -> {
		__core__ifThenElse(
			__core__lessThanInteger(a, b),
			a,
			b
		)
	}`));
	add(new RawFunc("__helios__int__max",
	`(a, b) -> {
		__core__ifThenElse(
			__core__lessThanInteger(a, b),
			b,
			a
		)
	}`));
	add(new RawFunc("__helios__int__bound_min",
	`(self) -> {
		(other) -> {
			__helios__int__max(self, other)
		}
	}`));
	add(new RawFunc("__helios__int__bound_max",
	`(self) -> {
		(other) -> {
			__helios__int__min(self, other)
		}
	}`));
	add(new RawFunc("__helios__int__bound",
	`(self) -> {
		(min, max) -> {
			__helios__int__max(__helios__int__min(self, max), min)
		}
	}`));
	add(new RawFunc("__helios__int__abs",
	`(self) -> {
		() -> {
			__core__ifThenElse(
				__core__lessThanInteger(self, 0),
				() -> {
					__core__multiplyInteger(self, -1)
				},
				() -> {
					self
				}
			)()
		}
	}`));
	add(new RawFunc("__helios__int__encode_zigzag",
	`(self) -> {
		() -> {
			__core__ifThenElse(
				__core__lessThanInteger(self, 0),
				() -> {
					__core__subtractInteger(__core__multiplyInteger(self, -2), 1)
				},
				() -> {
					__core__multiplyInteger(self, 2)
				}
			)()
		}
	}`));
	add(new RawFunc("__helios__int__decode_zigzag",
	`(self) -> {
		() -> {
			__core__ifThenElse(
				__core__lessThanInteger(self, 0),
				() -> {
					error("expected positive int")
				},
				() -> {
					__core__ifThenElse(
						__core__equalsInteger(__core__modInteger(self, 2), 0),
						() -> {
							__core__divideInteger(self, 2)
						},
						() -> {
							__core__divideInteger(__core__addInteger(self, 1), -2)
						}
					)()
				}
			)()
		}
	}`));
	add(new RawFunc("__helios__int__to_bool",
	`(self) -> {
		() -> {
			__core__ifThenElse(__core__equalsInteger(self, 0), false, true)
		}
	}`));
	add(new RawFunc("__helios__int__to_real",
	`(self) - {
		() -> {
			__core__multiplyInteger(self, __helios__real__ONE)
		}
	}`));
	add(new RawFunc("__helios__int__to_hex",
	`(self) -> {
		() -> {
			(recurse) -> {
				__core__decodeUtf8(
					__core__ifThenElse(
						__core__lessThanInteger(self, 0),
						() -> {
							__core__consByteString(
								45,
								recurse(recurse, __core__multiplyInteger(self, -1), #)
							)
						},
						() -> {
							recurse(recurse, self, #)
						}
					)()
				)
			}(
				(recurse, self, bytes) -> {
					(digit) -> {
						(bytes) -> {
							__core__ifThenElse(
								__core__lessThanInteger(self, 16),
								() -> {bytes},
								() -> {
									recurse(recurse, __core__divideInteger(self, 16), bytes)
								}
							)()
						}(
							__core__consByteString(
								__core__ifThenElse(
									__core__lessThanInteger(digit, 10), 
									__core__addInteger(digit, 48), 
									__core__addInteger(digit, 87)
								), 
								bytes
							)
						)
					}(__core__modInteger(self, 16))
				}
			)
		}
	}`));
	add(new RawFunc("__helios__common__BASE58_ALPHABET", "#31323334353637383941424344454647484a4b4c4d4e505152535455565758595a6162636465666768696a6b6d6e6f707172737475767778797a"))
	add(new RawFunc("__helios__int__to_base58",
	`(self) -> {
		() -> {
			__core__decodeUtf8(
				__core__ifThenElse(
					__core__lessThanInteger(self, 0),
					() -> {
						error("expected positive number")
					},
					() -> {
						(recurse) -> {
							recurse(recurse, self, #)
						}(
							(recurse, self, bytes) -> {
								(digit) -> {
									(bytes) -> {
										__core__ifThenElse(
											__core__lessThanInteger(self, 58),
											() -> {
												bytes
											},
											() -> {
												recurse(recurse, __core__divideInteger(self, 58), bytes)
											}
										)()
									}(
										__core__consByteString(
											__core__indexByteString(__helios__common__BASE58_ALPHABET, digit),
											bytes
										)
									)
								}(__core__modInteger(self, 58))
							}
						)
					}
				)()
			)
		}
	}`));
	add(new RawFunc("__helios__int__BASE58_INVERSE_ALPHABET_1", "#ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000102030405060708ffffffffffff"));
	add(new RawFunc("__helios__int__BASE58_INVERSE_ALPHABET_2", "#ff090a0b0c0d0e0f10ff1112131415ff161718191a1b1c1d1e1f20ffffffffffff2122232425262728292a2bff2c2d2e2f30313233343536373839ffffffffff"));
	add(new RawFunc("__helios__int__invert_base58_char", 
	`(char) -> {
		(digit) -> {
			__core__ifThenElse(
				__core__equalsInteger(digit, 0xff),
				() -> {
					error("invalid base58 character")
				},
				() -> {
					digit
				}
			)()
		}(
			__core__ifThenElse(
				__core__lessThanInteger(char, 64),
				() -> {
					__core__indexByteString(__helios__int__BASE58_INVERSE_ALPHABET_1, char)
				},
				() -> {
					__core__ifThenElse(
						__core__lessThanInteger(char, 128),
						() -> {
							__core__indexByteString(
								__helios__int__BASE58_INVERSE_ALPHABET_2,
								__core__subtractInteger(char, 64)
							)
						},
						() -> {
							0xff
						}
					)()
				}
			)()
		)
	}`));
	add(new RawFunc("__helios__int__from_base58",
	`(str) -> {
		(bytes) -> {
			(n) -> {
				(recurse) -> {
					recurse(recurse, 0, 1, __core__subtractInteger(n, 1))
				}(
					(recurse, acc, pow, i) -> {
						__core__ifThenElse(
							__core__equalsInteger(i, -1),
							() -> {
								acc
							},
							() -> {
								(new_acc) -> {
									recurse(recurse, new_acc, __core__multiplyInteger(pow, 58), __core__subtractInteger(i, 1))
								}(
									__core__addInteger(
										acc,
										__core__multiplyInteger(
											__helios__int__invert_base58_char(
												__core__indexByteString(bytes, i)
											),
											pow
										)
									)
								)
							}
						)()
					}
				)
			}(__core__lengthOfByteString(bytes))
		}(__core__encodeUtf8(str))
	}`));
	add(new RawFunc("__helios__int__show_digit",
	`(x) -> {
		__core__addInteger(__core__modInteger(x, 10), 48)
	}`));
	add(new RawFunc("__helios__int__show",
	`(self) -> {
		() -> {
			__core__decodeUtf8(
				(recurse) -> {
					__core__ifThenElse(
						__core__lessThanInteger(self, 0),
						() -> {__core__consByteString(45, recurse(recurse, __core__multiplyInteger(self, -1), #))},
						() -> {recurse(recurse, self, #)}
					)()
				}(
					(recurse, i, bytes) -> {
						(bytes) -> {
							__core__ifThenElse(
								__core__lessThanInteger(i, 10),
								() -> {
									bytes
								},
								() -> {
									recurse(recurse, __core__divideInteger(i, 10), bytes)
								}
							)()
						}(__core__consByteString(__helios__int__show_digit(i), bytes))
					}
				)
			)
		}
	}`));
	// not exposed, assumes positive number
	add(new RawFunc("__helios__int__show_padded",
	`(self, n) -> {
		(recurse) -> {
			recurse(recurse, self, 0, #)
		}(
			(recurse, x, pos, bytes) -> {
				__core__ifThenElse(
					__core__lessThanInteger(x, 10),
					() -> {
						__core__ifThenElse(
							__core__lessThanEqualsInteger(n, pos),
							() -> {
								bytes
							},
							() -> {
								recurse(
									recurse,
									0,
									__core__addInteger(pos, 1),
									__core__consByteString(48, bytes)
								)
							}
						)()
					},
					() -> {
						recurse(
							recurse,
							__core__divideInteger(x, 10),
							__core__addInteger(pos, 1),
							__core__consByteString(__helios__int__show_digit(x), bytes)
						)
					}
				)()
			}
		)
	}`));
	
	add(new RawFunc("__helios__int__parse_digit",
	`(digit) -> {
		__core__ifThenElse(
			__core__lessThanEqualsInteger(digit, 57),
			() -> {
				__core__ifThenElse(
					__core__lessThanEqualsInteger(48, digit),
					() -> {
						__core__subtractInteger(digit, 48)
					},
					() -> {
						error("not a digit")
					}
				)()
			},
			() -> {
				error("not a digit")
			}
		)()
	}`));
	add(new RawFunc("__helios__int__parse",
	`(string) -> {
		(bytes) -> {
			(n, b0) -> {
				(recurse) -> {
					__core__ifThenElse(
						__core__equalsInteger(b0, 48),
						() -> {
							__core__ifThenElse(
								__core__equalsInteger(n, 1),
								() -> {
									0
								},
								() -> {
									error("zero padded integer can't be parsed")
								}
							)()
						},
						() -> {
							__core__ifThenElse(
								__core__equalsInteger(b0, 45),
								() -> {
									__core__ifThenElse(
										__core__equalsInteger(__core__indexByteString(bytes, 1), 48),
										() -> {
											error("-0 not allowed")
										},
										() -> {
											__core__multiplyInteger(
												recurse(recurse, 0, 1),
												-1
											)
										}
									)()
								},
								() -> {
									recurse(recurse, 0, 0)
								}
							)()
						}
					)()
				}(
					(recurse, acc, i) -> {
						__core__ifThenElse(
							__core__equalsInteger(i, n),
							() -> {
								acc
							},
							() -> {
								(new_acc) -> {
									recurse(recurse, new_acc, __core__addInteger(i, 1))
								}(
									__core__addInteger(
										__core__multiplyInteger(acc, 10), 
										__helios__int__parse_digit(__core__indexByteString(bytes, i))
									)
								)
							}
						)()
					}
				)
			}(__core__lengthOfByteString(bytes), __core__indexByteString(bytes, 0))
		}(__core__encodeUtf8(string))
	}`));
	add(new RawFunc("__helios__int__from_big_endian",
	`(bytes) -> {
		(n) -> {
			(recurse) -> {
				recurse(recurse, 0, 1, __core__subtractInteger(n, 1))
			}(
				(recurse, acc, pow, i) -> {
					__core__ifThenElse(
						__core__equalsInteger(i, -1),
						() -> {
							acc
						},
						() -> {
							(new_acc) -> {
								recurse(recurse, new_acc, __core__multiplyInteger(pow, 256), __core__subtractInteger(i, 1))
							}(
								__core__addInteger(
									acc,
									__core__multiplyInteger(__core__indexByteString(bytes, i), pow)
								)
							)
						}
					)()
				}
			)
		}(__core__lengthOfByteString(bytes))
	}`));
	add(new RawFunc("__helios__int__from_little_endian", 
	`(bytes) -> {
		(n) -> {
			(recurse) -> {
				recurse(recurse, 0, 1, 0)
			}(
				(recurse, acc, pow, i) -> {
					__core__ifThenElse(
						__core__equalsInteger(i, n),
						() -> {
							acc
						},
						() -> {
							(new_acc) -> {
								recurse(recurse, new_acc, __core__multiplyInteger(pow, 256), __core__addInteger(i, 1))
							}(
								__core__addInteger(
									acc,
									__core__multiplyInteger(__core__indexByteString(bytes, i), pow)
								)
							)
						}
					)()
				}
			)
		}(__core__lengthOfByteString(bytes))
	}`));
	add(new RawFunc("__helios__int__to_big_endian",
	`(self) -> {
		() -> {
			__core__ifThenElse(
				__core__lessThanInteger(self, 0),
				() -> {
					error("can't convert negative number to big endian bytearray")
				},
				() -> {
					(recurse) -> {
						recurse(recurse, self, #)
					}(
						(recurse, self, bytes) -> {
							(bytes) -> {
								__core__ifThenElse(
									__core__lessThanInteger(self, 256),
									() -> {
										bytes
									},
									() -> {
										recurse(
											recurse,
											__core__divideInteger(self, 256),
											bytes
										)
									}
								)()
							}(__core__consByteString(self, bytes))
						}
					)
				}
			)()
		}
	}`));
	add(new RawFunc("__helios__int__to_little_endian",
	`(self) -> {
		() -> {
			__core__ifThenElse(
				__core__lessThanInteger(self, 0),
				() -> {
					error("can't convert negative number to big endian bytearray")
				},
				() -> {
					(recurse) -> {
						recurse(recurse, self)
					}(
						(recurse, self) -> {
							__core__consByteString(self,
								__core__ifThenElse(
									__core__lessThanInteger(self, 256),
									() -> {
										#
									},
									() -> {
										recurse(recurse, __core__divideInteger(self, 256))
									}
								)()
							)
						}
					)
				}
			)()
		}
	}`));
	add(new RawFunc("__helios__int__sqrt",
	`(x) -> {
		__core__ifThenElse(
			__core__lessThanInteger(x, 2),
			() -> {
				__core__ifThenElse(
					__core__equalsInteger(x, 1),
					() -> {
						1
					},
					() -> {
						__core__ifThenElse(
							__core__equalsInteger(x, 0),
							() -> {
								0
							},
							() -> {
								error("negative number in sqrt")
							}
						)()
					}
				)()
			},
			() -> {
				(recurse) -> {
					recurse(recurse, __core__divideInteger(x, 2))
				}(
					(recurse, x0) -> {
						(x1) -> {
							__core__ifThenElse(
								__core__lessThanEqualsInteger(x0, x1),
								() -> {
									x0
								},
								() -> {
									recurse(recurse, x1)
								}
							)()
						}(
							__core__divideInteger(
								__core__addInteger(
									x0,
									__core__divideInteger(x, x0)
								),
								2
							)
						)
					}
				)
			}
		)()
	}`));


	// Real builtins
	addIntLikeFuncs("__helios__real");
	add(new RawFunc("__helios__real__PRECISION", REAL_PRECISION.toString()));
	add(new RawFunc("__helios__real__ONE", '1' + new Array(REAL_PRECISION).fill('0').join('')));
	add(new RawFunc("__helios__real__HALF", '5' + new Array(REAL_PRECISION-1).fill('0').join('')));
	add(new RawFunc("__helios__real__NEARLY_ONE", new Array(REAL_PRECISION).fill('9').join('')));
	add(new RawFunc("__helios__real__ONESQ", '1' + new Array(REAL_PRECISION*2).fill('0').join('')));
	add(new RawFunc("__helios__real____neg", "__helios__int____neg"));
	add(new RawFunc("__helios__real____pos", "__helios__int____pos"));
	add(new RawFunc("__helios__real____add", "__helios__int____add"));
	add(new RawFunc("__helios__real____add1", 
	`(a, b) -> {
			__core__addInteger(a,
				__core__multiplyInteger(b, __helios__real__ONE)
			)
		)
	}`));
	add(new RawFunc("__helios__real____sub", "__helios__int____sub"));
	add(new RawFunc("__helios__real____sub1", 
	`(a, b) -> {
		__core__subtractInteger(
			a,
			__core__multiplyInteger(b, __helios__real__ONE)
		)
	}`));
	add(new RawFunc("__helios__real____mul",
	`(a, b) -> {
		__core__divideInteger(
			__core__multiplyInteger(a, b),
			__helios__real__ONE
		)
	}`));
	add(new RawFunc("__helios__real____mul1", "__helios__int____mul"));
	add(new RawFunc("__helios__real____div",
	`(a, b) -> {
		__core__divideInteger(
			__core__multiplyInteger(a, __helios__real__ONE),
			b
		)
	}`));
	add(new RawFunc("__helios__real____div1", "__helios__int____div"));
	add(new RawFunc("__helios__real____geq", "__helios__int____geq"));
	add(new RawFunc("__helios__real____gt", "__helios__int____gt"));
	add(new RawFunc("__helios__real____leq", "__helios__int____leq"));
	add(new RawFunc("__helios__real____lt", "__helios__int____lt"));
	add(new RawFunc("__helios__real____eq1",
	`(a, b) -> {
		__core__equalsInteger(a,
			__core__multiplyInteger(
				b,
				__helios__real__ONE
			)
		)
	}`));
	add(new RawFunc("__helios__real____neq1",
	`(a, b) -> {
		__helios__bool____not(
			__core__equalsInteger(
				a,
				__core__multiplyInteger(b, __helios__real__ONE)
			)
		)
	}`));
	add(new RawFunc("__helios__real____geq1", 
	`(a, b) -> {
		__helios__bool____not(
			__core__lessThanInteger(
				a,
				__core__multiplyInteger(b, __helios__real__ONE)
			)
		)
	}`));
	add(new RawFunc("__helios__real____gt1", 
	`(a, b) -> {
		__helios__bool____not(
			__core__lessThanEqualsInteger(
				a, 
				__core__multiplyInteger(b, __helios__real__ONE)
			)
		)
	}`));
	add(new RawFunc("__helios__real____leq1",
	`(a, b) -> {
		__core__lessThanEqualsInteger(
			a, 
			__core__multiplyInteger(b, __helios__real__ONE)
		)
	}`));
	add(new RawFunc("__helios__real____lt1", 
	`(a, b) -> {
		__core__lessThanInteger(
			a,
			__core__multiplyInteger(b, __helios__real__ONE)
		)
	}`));
	add(new RawFunc("__helios__real__abs", "__helios__int__abs"));
	add(new RawFunc("__helios__real__sqrt", 
	`(self) -> {
		__helios__int__sqrt(
			__helios__int____mul(self, __helios__real__ONE)
		)
	}`));
	add(new RawFunc("__helios__real__floor", 
	`(self) -> {
		() -> {
			__core__divideInteger(self, __helios__real__ONE)
		}
	}`));
	add(new RawFunc("__helios__real__trunc",
	`(self) -> {
		() -> {
			__core__quotientInteger(self, __helios__real__ONE)
		}
	}`));
	add(new RawFunc("__helios__real__ceil",
	`(self) -> {
		() -> {
			__core__divideInteger(
				__core__addInteger(self, __helios__real__NEARLY_ONE),
				__helios__real__ONE
			)
		}
	}`));
	add(new RawFunc("__helios__real__round",
	`(self) -> {
		() -> {
			__core__divideInteger(
				__core__addInteger(self, __helios__real__HALF),
				__helios__real__ONE
			)
		}
	}`));
	add(new RawFunc("__helios__real__show",
	`(self) -> {
		() -> {
			__helios__string____add(
				__helios__string____add(
					__core__ifThenElse(__core__lessThanInteger(0, self), "-", ""),
					__helios__int__show(
						__helios__real__floor(
							__helios__real__abs(self)()
						)()
					)(),
				),
				__helios__string____add(
					".",
					__helios__int__show_padded(
						__helios__int____mod(self, __helios__real__ONE),
						__helios__real__PRECISION
					)
				)
			)
		}
	}`));


	// Bool builtins
	addSerializeFunc("__helios__bool");
	add(new RawFunc("__helios__bool____eq", 
	`(a, b) -> {
		__core__ifThenElse(a, b, __helios__bool____not(b))
	}`));
	add(new RawFunc("__helios__bool____neq",
	`(a, b) -> {
		__core__ifThenElse(a, __helios__bool____not(b), b)
	}`));
	add(new RawFunc("__helios__bool__from_data", 
	`(d) -> {
		__core__ifThenElse(
			__core__equalsInteger(__core__fstPair(__core__unConstrData(d)), 0), 
			false, 
			true
		)
	}`));
	add(new RawFunc("__helios__bool____to_data",  
	`(b) -> {
		__core__constrData(__core__ifThenElse(b, 1, 0), __helios__common__list_0)
	}`));
	add(new RawFunc("__helios__bool__and",
	`(a, b) -> {
		__core__ifThenElse(
			a(), 
			() -> {b()}, 
			() -> {false}
		)()
	}`));
	add(new RawFunc("__helios__bool__or",
	`(a, b) -> {
		__core__ifThenElse(
			a(), 
			() -> {true},
			() -> {b()}
		)()
	}`));
	add(new RawFunc("__helios__bool____not", 
	`(b) -> {
		__core__ifThenElse(b, false, true)
	}`));
	add(new RawFunc("__helios__bool__to_int",
	`(self) -> {
		() -> {
			__core__ifThenElse(self, 1, 0)
		}
	}`));
	add(new RawFunc("__helios__bool__show",
	`(self) -> {
		() -> {
			__core__ifThenElse(self, "true", "false")
		}
	}`));
	add(new RawFunc("__helios__bool__trace",
	`(self) -> {
		(prefix) -> {
			__core__trace(
				__helios__string____add(
					prefix,
					__helios__bool__show(self)()
				), 
				self
			)
		}
	}`));


	// String builtins
	addSerializeFunc("__helios__string");
	addNeqFunc("__helios__string");
	add(new RawFunc("__helios__string____eq", "__core__equalsString"));
	add(new RawFunc("__helios__string__from_data", 
	`(d) -> {
		__core__decodeUtf8(__core__unBData(d))
	}`));
	add(new RawFunc("__helios__string____to_data", 
	`(s) -> {
		__core__bData(__core__encodeUtf8(s))
	}`));
	add(new RawFunc("__helios__string____add", "__core__appendString"));
	add(new RawFunc("__helios__string__starts_with", 
	`(self) -> {
		(prefix) -> {
			__helios__bytearray__starts_with(
				__core__encodeUtf8(self)
			)(__core__encodeUtf8(prefix))
		}
	}`));
	add(new RawFunc("__helios__string__ends_with", 
	`(self) -> {
		(suffix) -> {
			__helios__bytearray__ends_with(
				__core__encodeUtf8(self)
			)(__core__encodeUtf8(suffix))
		}
	}`));
	add(new RawFunc("__helios__string__encode_utf8",
	`(self) -> {
		() -> {
			__core__encodeUtf8(self)
		}
	}`));


	// ByteArray builtins
	addSerializeFunc("__helios__bytearray");
	addNeqFunc("__helios__bytearray");
	add(new RawFunc("__helios__bytearray____eq", "__core__equalsByteString"));
	add(new RawFunc("__helios__bytearray__from_data", "__core__unBData"));
	add(new RawFunc("__helios__bytearray____to_data", "__core__bData"));
	add(new RawFunc("__helios__bytearray____add", "__core__appendByteString"));
	add(new RawFunc("__helios__bytearray____geq",
	`(a, b) -> {
		__helios__bool____not(__core__lessThanByteString(a, b))
	}`));
	add(new RawFunc("__helios__bytearray____gt",
	`(a, b) -> {
		__helios__bool____not(__core__lessThanEqualsByteString(a, b))
	}`));
	add(new RawFunc("__helios__bytearray____leq", "__core__lessThanEqualsByteString"));
	add(new RawFunc("__helios__bytearray____lt", "__core__lessThanByteString"));
	add(new RawFunc("__helios__bytearray__length", "__core__lengthOfByteString"));
	add(new RawFunc("__helios__bytearray__slice",
	`(self) -> {
		__helios__common__slice_bytearray(self, __core__lengthOfByteString)
	}`));
	add(new RawFunc("__helios__bytearray__starts_with", 
	`(self) -> {
		__helios__common__starts_with(self, __core__lengthOfByteString)
	}`));
	add(new RawFunc("__helios__bytearray__ends_with",
	`(self) -> {
		__helios__common__ends_with(self, __core__lengthOfByteString)
	}`));
	add(new RawFunc("__helios__bytearray__prepend", 
	`(self) -> {
		(byte) -> {
			__core__consByteString(byte, self)
		}
	}`));
	add(new RawFunc("__helios__bytearray__sha2",
	`(self) -> {
		() -> {
			__core__sha2_256(self)
		}
	}`));
	add(new RawFunc("__helios__bytearray__sha3",
	`(self) -> {
		() -> {
			__core__sha3_256(self)
		}
	}`));
	add(new RawFunc("__helios__bytearray__blake2b",
	`(self) -> {
		() -> {
			__core__blake2b_256(self)
		}
	}`));
	add(new RawFunc("__helios__bytearray__decode_utf8",
	`(self) -> {
		() -> {
			__core__decodeUtf8(self)
		}
	}`));
	add(new RawFunc("__helios__bytearray__show",
	`(self) -> {
		() -> {
			(recurse) -> {
				recurse(recurse, self)
			}(
				(recurse, self) -> {
					(n) -> {
						__core__ifThenElse(
							__core__lessThanInteger(0, n),
							() -> {
								__core__appendString(
									__core__decodeUtf8(
										(hexBytes) -> {
											__core__ifThenElse(
												__core__equalsInteger(__core__lengthOfByteString(hexBytes), 1),
												__core__consByteString(48, hexBytes),
												hexBytes
											)
										}(
											__core__encodeUtf8(
												__helios__int__to_hex(
													__core__indexByteString(self, 0)
												)()
											)
										)
									), 
									recurse(recurse, __core__sliceByteString(1, n, self))
								)
							},
							() -> {
								""
							}
						)()
					}(__core__lengthOfByteString(self))
				}
			)
		}
	}`));


	// List builtins
	addSerializeFunc(`__helios__list[${TTPP}0]`);
	addNeqFunc(`__helios__list[${TTPP}0]`);
	addDataLikeEqFunc(`__helios__list[${TTPP}0]`);
	add(new RawFunc(`__helios__list[${TTPP}0]__from_data`, "__core__unListData"));
	add(new RawFunc(`__helios__list[${TTPP}0]____to_data`, "__core__listData"));
	add(new RawFunc(`__helios__list[${TTPP}0]__new`,
	`(n, fn) -> {
		(recurse) -> {
			recurse(recurse, 0)
		}(
			(recurse, i) -> {
				__core__ifThenElse(
					__core__lessThanInteger(i, n),
					() -> {__core__mkCons(${TTPP}0____to_data(fn(i)), recurse(recurse, __core__addInteger(i, 1)))},
					() -> {__core__mkNilData(())}
				)()
			}
		)
	}`));
	add(new RawFunc(`__helios__list[${TTPP}0]__new_const`,
	`(n, item) -> {
		__helios__list[${TTPP}0]__new(n, (i) -> {item})
	}`));
	add(new RawFunc(`__helios__list[${TTPP}0]____add`, "__helios__common__concat"));
	add(new RawFunc(`__helios__list[${TTPP}0]__length`, "__helios__common__length"));
	add(new RawFunc(`__helios__list[${TTPP}0]__head`, 
	`(self) -> {
		${TTPP}0__from_data(__core__headList(self))
	}`));
	add(new RawFunc(`__helios__list[${TTPP}0]__tail`, "__core__tailList"));
	add(new RawFunc(`__helios__list[${TTPP}0]__is_empty`,
	`(self) -> {
		() -> {
			__core__nullList(self)
		}
	}`));
	add(new RawFunc(`__helios__list[${TTPP}0]__get`,
	`(self) -> {
		(index) -> {
			(recurse) -> {
				${TTPP}0__from_data(recurse(recurse, self, index))
			}(
				(recurse, self, index) -> {
					__core__chooseList(
						self, 
						() -> {error("index out of range")}, 
						() -> {__core__ifThenElse(
							__core__lessThanInteger(index, 0), 
							() -> {error("index out of range")}, 
							() -> {
								__core__ifThenElse(
									__core__equalsInteger(index, 0), 
									() -> {__core__headList(self)}, 
									() -> {recurse(recurse, __core__tailList(self), __core__subtractInteger(index, 1))}
								)()
							}
						)()}
					)()
				}
			)
		}
	}`));
	add(new RawFunc(`__helios__list[${TTPP}0]__get_singleton`,
	`(self) -> {
		() -> {
			${TTPP}0__from_data(
				__core__chooseUnit(
					__helios__assert(
						__core__nullList(__core__tailList(self)),
						"not a singleton list"
					),
					__core__headList(self)
				)
			)
		}
	}`));
	add(new RawFunc(`__helios__list[${TTPP}0]__drop`,
	`(self) -> {
		(n) -> {
			(recurse) -> {
				__core__ifThenElse(
					__core__lessThanInteger(n, 0),
					() -> {
						error("negative n in drop")
					},
					() -> {
						recurse(recurse, self, n)
					}
				)()
			}(
				(recurse, lst, n) -> {
					__core__ifThenElse(
						__core__equalsInteger(n, 0),
						() -> {
							lst
						},
						() -> {
							recurse(
								recurse,
								__core__tailList(lst),
								__core__subtractInteger(n, 1)
							)
						}
					)()
				}
			)
		}
	}`));
	add(new RawFunc(`__helios__list[${TTPP}0]__drop_end`,
	`(self) -> {
		(n) -> {
			(recurse) -> {
				__core__ifThenElse(
					__core__lessThanInteger(n, 0),
					() -> {
						error("negative n in drop_end")
					},
					() -> {
						recurse(recurse, self)(
							(count, result) -> {
								__core__ifThenElse(
									__core__lessThanInteger(count, n),
									() -> {
										error("list too short")
									},
									() -> {
										result
									}
								)()
							}
						)
					}
				)()
			}(
				(recurse, lst) -> {
					__core__chooseList(
						lst,
						() -> {
							(callback) -> {callback(0, lst)}
						},
						() -> {
							recurse(recurse, __core__tailList(lst))(
								(count, result) -> {
									__core__ifThenElse(
										__core__equalsInteger(count, n),
										() -> {
											(callback) -> {
												callback(
													count,
													__core__mkCons(
														__core__headList(lst), 
														result
													)
												)
											}
										},
										() -> {
											(callback) -> {
												callback(
													__core__addInteger(count, 1),
													result
												)
											}
										}
									)()
								}
							)
						}
					)()
				}
			)
		}
	}`));
	add(new RawFunc(`__helios__list[${TTPP}0]__take`,
	`(self) -> {
		(n) -> {
			(recurse) -> {
				__core__ifThenElse(
					__core__lessThanInteger(n, 0),
					() -> {
						error("negative n in take")
					},
					() -> {
						recurse(recurse, self, n)
					}
				)()
			}(
				(recurse, lst, n) -> {
					__core__ifThenElse(
						__core__equalsInteger(n, 0),
						() -> {
							__core__mkNilData(())
						},
						() -> {
							__core__mkCons(
								__core__headList(lst),
								recurse(
									recurse,
									__core__tailList(lst),
									__core__subtractInteger(n, 1)
								)
							)
						}
					)()
				}
			)
		}
	}`));
	add(new RawFunc(`__helios__list[${TTPP}0]__take_end`,
	`(self) -> {
		(n) -> {
			(recurse) -> {
				__core__ifThenElse(
					__core__lessThanInteger(n, 0),
					() -> {
						error("negative n in take_end")
					},
					() -> {
						recurse(recurse, self)(
							(count, result) -> {
								__core__ifThenElse(
									__core__lessThanInteger(count, n),
									() -> {
										error("list too short")
									},
									() -> {
										result
									}
								)()
							}
						)
					}
				)()
			}(
				(recurse, lst) -> {
					__core__chooseList(
						lst,
						() -> {
							(callback) -> {callback(0, lst)}
						},
						() -> {
							recurse(recurse, __core__tailList(lst))(
								(count, tail) -> {
									__core__ifThenElse(
										__core__equalsInteger(count, n),
										() -> {
											(callback) -> {callback(count, tail)}
										},
										() -> {
											(callback) -> {
												callback(
													__core__addInteger(count, 1),
													lst
												)
											}
										}
									)()
								}
							)
						}
					)()
				}
			)
		}
	}`));
	add(new RawFunc(`__helios__list[${TTPP}0]__any`,
	`(self) -> {
		(fn) -> {
			__helios__common__any(
				self, 
				(item) -> {
					fn(${TTPP}0__from_data(item))
				}
			)
		}
	}`));
	add(new RawFunc(`__helios__list[${TTPP}0]__all`,
	`(self) -> {
		(fn) -> {
			__helios__common__all(
				self, 
				(item) -> {
					fn(${TTPP}0__from_data(item))
				}
			)
		}
	}`));
	add(new RawFunc(`__helios__list[${TTPP}0]__prepend`,
	`(self) -> {
		(item) -> {
			__core__mkCons(${TTPP}0____to_data(item), self)
		}
	}`));
	add(new RawFunc(`__helios__list[${TTPP}0]__find`,
	`(self) -> {
		(fn) -> {
			(recurse) -> {
				recurse(recurse, self)
			}(
				(recurse, lst) -> {
					__core__chooseList(
						lst, 
						() -> {error("not found")}, 
						() -> {
							(item) -> {
								__core__ifThenElse(
									fn(item), 
									() -> {item}, 
									() -> {recurse(recurse, __core__tailList(lst))}
								)()
							}(${TTPP}0__from_data(__core__headList(lst)))
						}
					)()
				}
			)
		}
	}`));
	add(new RawFunc(`__helios__list[${TTPP}0]__find_safe`,
	`(self) -> {
		(fn) -> {
			__helios__common__find_safe(
				self,
				(item) -> {
					fn(${TTPP}0__from_data(item))
				},
				__helios__common__identity
			)
		}
	}`));
	add(new RawFunc(`__helios__list[${TTPP}0]__filter`,
	`(self) -> {
		(fn) -> {
			__helios__common__filter_list(
				self, 
				(item) -> {
					fn(${TTPP}0__from_data(item))
				}
			)
		}
	}`));
	add(new RawFunc(`__helios__list[${TTPP}0]__for_each`,
	`(self) -> {
		(fn) -> {
			(recurse) -> {
				recurse(recurse, self)
			}(
				(recurse, lst) -> {
					__core__chooseList(
						lst,
						() -> {
							()
						},
						() -> {
							__core__chooseUnit(
								fn(${TTPP}0__from_data(__core__headList(lst))),
								recurse(recurse, __core__tailList(lst))
							)
						}
					)()
				}
			)
		}
	}`));
	add(new RawFunc(`__helios__list[${TTPP}0]__fold[${FTPP}0]`,
	`(self) -> {
		(fn, z) -> {
			__helios__common__fold(
				self, 
				(prev, item) -> {
					fn(prev, ${TTPP}0__from_data(item))
				}, 
				z
			)
		}
	}`));
	add(new RawFunc(`__helios__list[${TTPP}0]__fold_lazy[${FTPP}0]`,
	`(self) -> {
		(fn, z) -> {
			__helios__common__fold_lazy(
				self, 
				(item, next) -> {
					fn(${TTPP}0__from_data(item), next)
				},
				z
			)
		}
	}`));
	add(new RawFunc(`__helios__list[${TTPP}0]__map[${FTPP}0]`,
	`(self) -> {
		(fn) -> {
			__helios__common__map(
				self, 
				(item) -> {
					${FTPP}0____to_data(fn(${TTPP}0__from_data(item)))
				}, 
				__core__mkNilData(())
			)
		}
	}`));
	add(new RawFunc(`__helios__list[${TTPP}0]__sort`,
	`(self) -> {
		(comp) -> {
			__helios__common__sort(
				self, 
				(a, b) -> {
					comp(${TTPP}0__from_data(a), ${TTPP}0__from_data(b))
				}
			)
		}
	}`));
	

	// Map builtins
	addSerializeFunc(`__helios__map[${TTPP}0@${TTPP}1]`);
	addNeqFunc(`__helios__map[${TTPP}0@${TTPP}1]`);
	addDataLikeEqFunc(`__helios__map[${TTPP}0@${TTPP}1]`);
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__from_data`, "__core__unMapData"));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]____to_data`, "__core__mapData"));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]____add`, "__helios__common__concat"));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__prepend`,
	`(self) -> {
		(key, value) -> {
			__core__mkCons(__core__mkPairData(${TTPP}0____to_data(key), ${TTPP}1____to_data(value)), self)
		}
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__head`,
	`(self) -> {
		(head) -> {
			() -> {
				(callback) -> {
					callback(${TTPP}0__from_data(__core__fstPair(head)), ${TTPP}1__from_data(__core__sndPair(head)))
				}
			}
		}(__core__headList(self))
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__head_key`,
	`(self) -> {
		${TTPP}0__from_data(__core__fstPair(__core__headList(self)))
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__head_value`,
	`(self) -> {
		${TTPP}1__from_data(__core__sndPair(__core__headList(self)))
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__length`,
	`(self) -> {
		__helios__common__length(self)
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__tail`, "__core__tailList"));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__is_empty`,
	`(self) -> {
		() -> {
			__core__nullList(self)
		}
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__get`,
	`(self) -> {
		(key) -> {
			__helios__common__map_get(
				self, 
				${TTPP}0____to_data(key), 
				(x) -> {${TTPP}1__from_data(x)}, 
				() -> {error("key not found")}
			)
		}
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__get_safe`,
	`(self) -> {
		(key) -> {
			__helios__common__map_get(
				self, 
				${TTPP}0____to_data(key), 
				(x) -> {
					__core__constrData(0, __helios__common__list_1(x))
				}, 
				() -> {
					__core__constrData(1, __helios__common__list_0)
				}
			)
		}
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__all`,
	`(self) -> {
		(fn) -> {
			(fn) -> {
				__helios__common__all(self, fn)
			}(
				(pair) -> {
					fn(${TTPP}0__from_data(__core__fstPair(pair)), ${TTPP}1__from_data(__core__sndPair(pair)))
				}
			)
		}
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__any`,
	`(self) -> {
		(fn) -> {
			(fn) -> {
				__helios__common__any(self, fn)
			}(
				(pair) -> {
					fn(${TTPP}0__from_data(__core__fstPair(pair)), ${TTPP}1__from_data(__core__sndPair(pair)))
				}
			)
		}
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__delete`,
	`(self) -> {
		(key) -> {
			(key) -> {
				(recurse) -> {
					recurse(recurse, self)
				}(
					(recurse, self) -> {
						__core__chooseList(
							self,
							() -> {self},
							() -> {
								(head, tail) -> {
									__core__ifThenElse(
										__core__equalsData(key, __core__fstPair(head)),
										() -> {recurse(recurse, tail)},
										() -> {__core__mkCons(head, recurse(recurse, tail))}
									)()
								}(__core__headList(self), __core__tailList(self))
							}
						)()
					}
				)
			}(${TTPP}0____to_data(key))
		}
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__filter`,
	`(self) -> {
		(fn) -> {
			__helios__common__filter_map(
				self, 
				(pair) -> {
					fn(${TTPP}0__from_data(__core__fstPair(pair)), ${TTPP}1__from_data(__core__sndPair(pair)))
				}
			)
		}
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__find`,
	`(self) -> {
		(fn) -> {
			(recurse) -> {
				recurse(recurse, self)
			}(
				(recurse, self) -> {
					__core__chooseList(
						self, 
						() -> {error("not found")}, 
						() -> {
							(head) -> {
								(key, value) -> {
									__core__ifThenElse(
										fn(key, value), 
										() -> {
											(callback) -> {
												callback(key, value)
											}
										}, 
										() -> {
											recurse(recurse, __core__tailList(self))
										}
									)()
								}(
									${TTPP}0__from_data(__core__fstPair(head)), 
									${TTPP}1__from_data(__core__sndPair(head))
								)
							}(__core__headList(self))
						}
					)()
				}
			)
		}
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__find_safe`,
	`(self) -> {
		(fn) -> {
			(recurse) -> {
				recurse(recurse, self, fn)
			}(
				(recurse, self, fn) -> {
					__core__chooseList(
						self, 
						() -> {
							(callback) -> {
								callback(() -> {error("not found")}, false)
							}
						}, 
						() -> {
							(head) -> {
								(key, value) -> {
									__core__ifThenElse(
										fn(key, value), 
										() -> {
											(callback) -> {
												callback(
													() -> {
														(callback) -> {
															callback(key, value)
														}
													},
													true
												)
											}
										}, 
										() -> {
											recurse(recurse, __core__tailList(self), fn)
										}
									)()
								}(${TTPP}0__from_data(__core__fstPair(head)), ${TTPP}1__from_data(__core__sndPair(head)))
							}(__core__headList(self))
						}
					)()
				}
			)
		}
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__find_key`,
	`(self) -> {
		(fn) -> {
			(recurse) -> {
				recurse(recurse, self)
			}(
				(recurse, map) -> {
					__core__chooseList(
						map, 
						() -> {error("not found")}, 
						() -> {
							(item) -> {
								__core__ifThenElse(
									fn(item), 
									() -> {item}, 
									() -> {recurse(recurse, __core__tailList(map))}
								)()
							}(${TTPP}0__from_data(__core__fstPair(__core__headList(map))))
						}
					)()
				}
			)
		}
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__find_key_safe`,
	`(self) -> {
		(fn) -> {
			__helios__common__find_safe(
				self,
				(pair) -> {
					fn(${TTPP}0__from_data(__core__fstPair(pair)))
				},
				__core__fstPair
			)
		}
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__find_value`,
	`(self) -> {
		(fn) -> {
			(recurse) -> {
				recurse(recurse, self)
			}(
				(recurse, map) -> {
					__core__chooseList(
						map, 
						() -> {error("not found")}, 
						() -> {
							(item) -> {
								__core__ifThenElse(
									fn(item), 
									() -> {item}, 
									() -> {recurse(recurse, __core__tailList(map))}
								)()
							}(${TTPP}1__from_data(__core__sndPair(__core__headList(map))))
						}
					)()
				}
			)
		}
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__find_value_safe`,
	`(self) -> {
		(fn) -> {
			__helios__common__find_safe(
				self,
				(pair) -> {
					fn(${TTPP}1__from_data(__core__sndPair(pair)))
				},
				__core__sndPair
			)
		}
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__map[${FTPP}0@${FTPP}1]`,
	`(self) -> {
		(fn) -> {
			__helios__common__map(
				self,
				(pair) -> {
					(mapped_pair) -> {
						mapped_pair(
							(key, value) -> {
								__core__mkPairData(${FTPP}0____to_data(key), ${FTPP}1____to_data(value))
							}
						)
					}(fn(${TTPP}0__from_data(__core__fstPair(pair)), ${TTPP}1__from_data(__core__sndPair(pair))))
				}, 
				__core__mkNilPairData(())
			)
		}
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__fold[${FTPP}0]`,
	`(self) -> {
		(fn, z) -> {
			__helios__common__fold(self,
				(z, pair) -> {
					fn(z, ${TTPP}0__from_data(__core__fstPair(pair)), ${TTPP}1__from_data(__core__sndPair(pair)))
				}, 
				z
			)
		}
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__fold_lazy[${FTPP}0]`,
	`(self) -> {
		(fn, z) -> {
			__helios__common__fold_lazy(self, 
				(pair, next) -> {
					fn(${TTPP}0__from_data(__core__fstPair(pair)), ${TTPP}1__from_data(__core__sndPair(pair)), next)
				}, 
				z
			)
		}
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__for_each`,
	`(self) -> {
		(fn) -> {
			(recurse) -> {
				recurse(recurse, self)
			}(
				(recurse, map) -> {
					__core__chooseList(
						map,
						() -> {
							()
						},
						() -> {
							(head) -> {
								__core__chooseUnit(
									fn(${TTPP}0__from_data(__core__fstPair(head)), ${TTPP}1__from_data(__core__sndPair(head))),
									recurse(recurse, __core__tailList(map))
								)
							}(__core__headList(map))
						}
					)()
				}
			)
		}
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__set`, 
	`(self) -> {
		(key, value) -> {
			(key, value) -> {
				(recurse) -> {
					recurse(recurse, self)
				}(
					(recurse, self) -> {
						__core__chooseList(
							self,
							() -> {
								__core__mkCons(__core__mkPairData(key, value), __core__mkNilPairData(()))
							},
							() -> {
								(head, tail) -> {
									__core__ifThenElse(
										__core__equalsData(key, __core__fstPair(head)),
										() -> {
											__core__mkCons(__core__mkPairData(key, value), tail)
										},
										() -> {
											__core__mkCons(head, recurse(recurse, tail))
										}
									)()
								}(__core__headList(self), __core__tailList(self))
							}
						)()
					}
				)
			}(${TTPP}0____to_data(key), ${TTPP}1____to_data(value))
		}
	}`));
	add(new RawFunc(`__helios__map[${TTPP}0@${TTPP}1]__sort`,
	`(self) -> {
		(comp) -> {
			__helios__common__sort(
				self, 
				(a, b) -> {
					comp(
						${TTPP}0__from_data(__core__fstPair(a)), 
						${TTPP}1__from_data(__core__sndPair(a)), 
						${TTPP}0__from_data(__core__fstPair(b)),
						${TTPP}1__from_data(__core__sndPair(b))
					)
				}
			)
		}
	}`));


	// Option[T] builtins
	addDataFuncs(`__helios__option[${TTPP}0]`);
	add(new RawFunc(`__helios__option[${TTPP}0]__map[${FTPP}0]`, 
	`(self) -> {
		(fn) -> {
			(pair) -> {
				__core__ifThenElse(
					__core__equalsInteger(__core__fstPair(pair), 0),
					() -> {
						__helios__option[${FTPP}0]__some__new(
							fn(
								${TTPP}0__from_data(
									__core__headList(__core__sndPair(pair))
								)
							)
						)
					},
					() -> {
						__helios__option[${FTPP}0]__none__new()
					}
				)()
			}(__core__unConstrData(self))
		}
	}`));
	add(new RawFunc(`__helios__option[${TTPP}0]__unwrap`, 
	`(self) -> {
		() -> {
			${TTPP}0__from_data(__helios__common__field_0(self))
		}
	}`));


	// Option[T]::Some
	addEnumDataFuncs(`__helios__option[${TTPP}0]__some`, 0);
	add(new RawFunc(`__helios__option[${TTPP}0]__some____new`,
	`(some) -> {
		__core__constrData(0, __helios__common__list_1(${TTPP}0____to_data(some)))
	}`));
	add(new RawFunc(`__helios__option[${TTPP}0]__some__new`, `__helios__option[${TTPP}0]__some____new`));
	add(new RawFunc(`__helios__option[${TTPP}0]__some__cast`,
	`(data) -> {
		__helios__common__assert_constr_index(data, 0)
	}`));
	add(new RawFunc(`__helios__option[${TTPP}0]__some__some`, 
	`(self) -> {
		${TTPP}0__from_data(__helios__common__field_0(self))
	}`));
	

	// Option[T]::None
	addEnumDataFuncs(`__helios__option[${TTPP}0]__none`, 1);
	add(new RawFunc("__helios__option__NONE", "__core__constrData(1, __helios__common__list_0)"));
	add(new RawFunc(`__helios__option[${TTPP}0]__none____new`,
	`() -> {
		__helios__option__NONE
	}`));
	add(new RawFunc(`__helios__option[${TTPP}0]__none__new`, `__helios__option[${TTPP}0]__none____new`));
	add(new RawFunc(`__helios__option[${TTPP}0]__none__cast`,
	`(data) -> {
		__helios__common__assert_constr_index(data, 1)
	}`));

	
	for (let hash of ["pubkeyhash", "validatorhash", "mintingpolicyhash", "stakingvalidatorhash", "datumhash", "stakekeyhash"]) {
	// Hash builtins
		addByteArrayLikeFuncs(`__helios__${hash}`);
		add(new RawFunc(`__helios__${hash}__from_script_hash`, "__helios__common__identity"));
	}

	
	// ScriptHash builtin
	addByteArrayLikeFuncs("__helios__scripthash");


	// PubKey builtin
	addByteArrayLikeFuncs("__helios__pubkey");
	add(new RawFunc("__helios__pubkey__verify", 
	`(self) -> {
		(message, signature) -> {
			__core__verifyEd25519Signature(self, message, signature)
		}
	}`));


	// ScriptContext builtins
	addDataFuncs("__helios__scriptcontext");
	add(new RawFunc("__helios__scriptcontext__new_spending",
	`(tx, output_id) -> {
		__core__constrData(0, __helios__common__list_2(
			tx,
			__core__constrData(1, __helios__common__list_1(output_id))
		))
	}`));
	add(new RawFunc("__helios__scriptcontext__new_minting",
	`(tx, mph) -> {
		__core__constrData(0, __helios__common__list_2(
			tx,
			__core__constrData(
				0, 
				__helios__common__list_1(
					__helios__mintingpolicyhash____to_data(mph)
				)
			)
		))
	}`));
	add(new RawFunc("__helios__scriptcontext__new_rewarding",
	`(tx, cred) -> {
		__core__constrData(0, __helios__common__list_2(
			tx,
			__core__constrData(2, __helios__common__list_1(cred))
		))
	}`));
	add(new RawFunc("__helios__scriptcontext__new_certifying",
	`(tx, action) -> {
		__core__constrData(0, __helios__common__list_2(
			tx,
			__core__constrData(3, __helios__common__list_1(action))
		))
	}`));
	add(new RawFunc("__helios__scriptcontext__tx", "__helios__common__field_0"));
	add(new RawFunc("__helios__scriptcontext__purpose", "__helios__common__field_1"));
	add(new RawFunc("__helios__scriptcontext__get_current_input",
	`(self) -> {
		() -> {
			(id) -> {
				(recurse) -> {
					recurse(recurse, __helios__tx__inputs(__helios__scriptcontext__tx(self)))
				}(
					(recurse, lst) -> {
						__core__chooseList(
							lst, 
							() -> {error("not found")}, 
							() -> {
								(item) -> {
									__core__ifThenElse(
										__core__equalsData(__helios__txinput__output_id(item), id), 
										() -> {item}, 
										() -> {recurse(recurse, __core__tailList(lst))}
									)()
								}(__core__headList(lst))
							}
						)()
					}
				)
			}(__helios__scriptcontext__get_spending_purpose_output_id(self)())
		}
	}`));
	add(new RawFunc("__helios__scriptcontext__get_cont_outputs",
	`(self) -> {
		() -> {
			(vh) -> {
				(outputs) -> {
					__helios__common__filter_list(
						outputs,
						(output) -> {
							(credential) -> {
								(pair) -> {
									__core__ifThenElse(
										__core__equalsInteger(__core__fstPair(pair), 0),
										() -> {
											false
										},
										() -> {
											__core__equalsByteString(__core__unBData(__core__headList(__core__sndPair(pair))), vh)
										}
									)()
								}(__core__unConstrData(credential))
							}(__helios__address__credential(__helios__txoutput__address(output)))
						}
					)
				}(__helios__tx__outputs(__helios__scriptcontext__tx(self)))
			}(__helios__scriptcontext__get_current_validator_hash(self)())
		}
	}`));
	add(new RawFunc("__helios__scriptcontext__get_spending_purpose_output_id",
	`(self) -> {
		() -> {
			__helios__common__field_0(__helios__common__field_1(self))
		}
	}`));
	add(new RawFunc("__helios__scriptcontext__get_current_validator_hash",
	`(self) -> {
		() -> {
			__helios__credential__validator__hash(
				__helios__credential__validator__cast(
					__helios__address__credential(
						__helios__txoutput__address(
							__helios__txinput__output(
								__helios__scriptcontext__get_current_input(self)()
							)
						)
					)
				)
			)
		}
	}`));
	add(new RawFunc("__helios__scriptcontext__get_current_minting_policy_hash", 
	`(self) -> {
		() -> {
			__helios__mintingpolicyhash__from_data(__helios__scriptcontext__get_spending_purpose_output_id(self)())
		}
	}`));
	add(new RawFunc("__helios__scriptcontext__get_staking_purpose", 
	`(self) -> {
		() -> {
			__helios__scriptcontext__purpose(self)
		}
	}`));
	add(new RawFunc("__helios__scriptcontext__get_script_purpose", 
	`(self) -> {
		() -> {
			__helios__scriptcontext__purpose(self)
		}
	}`));


	// StakingPurpose builtins
	addDataFuncs("__helios__stakingpurpose");


	// StakingPurpose::Rewarding builtins
	addEnumDataFuncs("__helios__stakingpurpose__rewarding", 2);
	add(new RawFunc("__helios__stakingpurpose__rewarding__credential", "__helios__common__field_0"));

	
	// StakingPurpose::Certifying builtins
	addEnumDataFuncs("__helios__stakingpurpose__certifying", 3);
	add(new RawFunc("__helios__stakingpurpose__certifying__action", "__helios__common__field_0"));


	// ScriptPurpose builtins
	addDataFuncs("__helios__scriptpurpose");
	add(new RawFunc("__helios__scriptpurpose__new_minting",
	`(mph) -> {
		__core__constrData(0, __helios__common__list_1(__helios__mintingpolicyhash____to_data(mph)))
	}`));
	add(new RawFunc("__helios__scriptpurpose__new_spending",
	`(output_id) -> {
		__core__constrData(1, __helios__common__list_1(output_id))
	}`));
	add(new RawFunc("__helios__scriptpurpose__new_rewarding",
	`(cred) -> {
		__core__constrData(2, __helios__common__list_1(cred))
	}`));
	add(new RawFunc("__helios__scriptpurpose__new_certifying",
	`(action) -> {
		__core__constrData(3, __helios__common__list_1(action))
	}`));


	// ScriptPurpose::Minting builtins
	addEnumDataFuncs("__helios__scriptpurpose__minting", 0);
	add(new RawFunc("__helios__scriptpurpose__minting__policy_hash", 
	`(self) -> {
		__helios__mintingpolicyhash__from_data(__helios__common__field_0(self))
	}`));

	
	// ScriptPurpose::Spending builtins
	addEnumDataFuncs("__helios__scriptpurpose__spending", 1);
	add(new RawFunc("__helios__scriptpurpose__spending__output_id", "__helios__common__field_0"));

	
	// ScriptPurpose::Rewarding builtins
	addEnumDataFuncs("__helios__scriptpurpose__rewarding", 2);
	add(new RawFunc("__helios__scriptpurpose__rewarding__credential", "__helios__common__field_0"));

	
	// ScriptPurpose::Certifying builtins
	addEnumDataFuncs("__helios__scriptpurpose__certifying", 3);
	add(new RawFunc("__helios__scriptpurpose__certifying__action", "__helios__common__field_0"));


	// DCert builtins
	addDataFuncs("__helios__certifyingaction");
	add(new RawFunc("__helios__certifyingaction__new_register",
	`(cred) -> {
		__core__constrData(0, __helios__common__list_1(cred))
	}`));
	add(new RawFunc("__helios__certifyingaction__new_deregister",
	`(cred) -> {
		__core__constrData(1, __helios__common__list_1(cred))
	}`));
	add(new RawFunc("__helios__certifyingaction__new_delegate",
	`(cred, pool_id) -> {
		__core__constrData(2, __helios__common__list_2(cred, __helios__pubkeyhash____to_data(pool_id)))
	}`));
	add(new RawFunc("__helios__certifyingaction__new_register_pool",
	`(id, vrf) -> {
		__core__constrData(3, __helios__common__list_2(__helios__pubkeyhash____to_data(id), __helios__pubkeyhash____to_data(vrf)))
	}`));
	add(new RawFunc("__helios__certifyingaction__new_retire_pool",
	`(id, epoch) -> {
		__core__constrData(4, __helios__common__list_2(__helios__pubkeyhash____to_data(id), __helios__int____to_data(epoch)))
	}`));


	// DCert::Register builtins
	addEnumDataFuncs("__helios__certifyingaction__register", 0);
	add(new RawFunc("__helios__certifyingaction__register__credential", "__helios__common__field_0"));


	// DCert::Deregister builtins
	addEnumDataFuncs("__helios__certifyingaction__deregister", 1);
	add(new RawFunc("__helios__certifyingaction__deregister__credential", "__helios__common__field_0"));


	// DCert::Delegate builtins
	addEnumDataFuncs("__helios__certifyingaction__delegate", 2);
	add(new RawFunc("__helios__certifyingaction__delegate__delegator", "__helios__common__field_0"));
	add(new RawFunc("__helios__certifyingaction__delegate__pool_id", 
	`(self) -> {
		__helios__pubkeyhash__from_data(__helios__common__field_1(self))
	}`));


	// DCert::RegisterPool builtins
	addEnumDataFuncs("__helios__certifyingaction__registerpool", 3);
	add(new RawFunc("__helios__certifyingaction__registerpool__pool_id", 
	`(self) -> {
		__helios__pubkeyhash__from_data(__helios__common__field_0(self))
	}`));
	add(new RawFunc("__helios__certifyingaction__registerpool__pool_vrf", 
	`(self) -> {
		__helios__pubkeyhash__from_data(__helios__common__field_1(self))
	}`));


	// DCert::RetirePool builtins
	addEnumDataFuncs("__helios__certifyingaction__retirepool", 4);
	add(new RawFunc("__helios__certifyingaction__retirepool__pool_id", 
	`(self) -> {
		__helios__pubkeyhash__from_data(__helios__common__field_0(self))
	}`));
	add(new RawFunc("__helios__certifyingaction__retirepool__epoch", 
	`(self) -> {
		__helios__int__from_data(__helios__common__field_1(self))
	}`));


	// Tx builtins
	addDataFuncs("__helios__tx");
	add(new RawFunc(`__helios__tx__new[${FTPP}0@${FTPP}1]`,
	`(inputs, ref_inputs, outputs, fee, minted, cert_actions, withdrawals, validity, signatories, redeemers, datums, txId) -> {
		__core__constrData(0, __helios__common__list_12(
			__core__listData(inputs),
			__core__listData(ref_inputs),
			__core__listData(outputs),
			__core__mapData(fee),
			__core__mapData(minted),
			__core__listData(cert_actions),
			__core__mapData(withdrawals),
			validity,
			__core__listData(signatories),
			__core__mapData(redeemers),
			__core__mapData(datums),
			__helios__txid__new(#0000000000000000000000000000000000000000000000000000000000000000)
		))
	}`));
	add(new RawFunc("__helios__tx__inputs", 
	`(self) -> {
		__core__unListData(__helios__common__field_0(self))
	}`));
	add(new RawFunc("__helios__tx__ref_inputs", 
	`(self) -> {
		__core__unListData(__helios__common__field_1(self))
	}`))
	add(new RawFunc("__helios__tx__outputs", 
	`(self) -> {
		__core__unListData(__helios__common__field_2(self))
	}`));
	add(new RawFunc("__helios__tx__fee", 
	`(self) -> {
		__core__unMapData(__helios__common__field_3(self))
	}`));
	add(new RawFunc("__helios__tx__minted", 
	`(self) -> {
		__core__unMapData(__helios__common__field_4(self))
	}`));
	add(new RawFunc("__helios__tx__cert_actions", 
	`(self) -> {
		__core__unListData(__helios__common__field_5(self))
	}`));
	add(new RawFunc("__helios__tx__withdrawals", 
	`(self) -> {
		__core__unMapData(__helios__common__field_6(self))
	}`));
	add(new RawFunc("__helios__tx__time_range", "__helios__common__field_7"));
	add(new RawFunc("__helios__tx__signatories", 
	`(self) -> {
		__core__unListData(__helios__common__field_8(self))
	}`));
	add(new RawFunc("__helios__tx__redeemers", 
	`(self) -> {
		__core__unMapData(__helios__common__field_9(self))
	}`));
	add(new RawFunc("__helios__tx__datums", 
	`(self) -> {
		__core__unMapData(__helios__common__field_10(self))
	}`));
	add(new RawFunc("__helios__tx__id", "__helios__common__field_11"));
	add(new RawFunc(`__helios__tx__find_datum_hash[${FTPP}0]`,
	`(self) -> {
		(datum) -> {
			__helios__datumhash__from_data(
				__core__fstPair(
					__helios__common__find(
						__helios__tx__datums(self),
						(pair) -> {
							__core__equalsData(__core__sndPair(pair), datum)
						}
					)
				)
			)
		}
	}`));
	add(new RawFunc("__helios__tx__get_datum_data",
	`(self) -> {
		(output) -> {
			(output) -> {
				(idx) -> {
					__core__ifThenElse(
						__core__equalsInteger(idx, 1),
						() -> {
							__helios__common__map_get(
								__helios__tx__datums(self), 
								__core__headList(__core__sndPair(output)),
								__helios__common__identity,
								() -> {error("datumhash not found")}
							)
						},
						() -> {
							__core__ifThenElse(
								__core__equalsInteger(idx, 2),
								() -> {
									__core__headList(__core__sndPair(output))
								},
								() -> {error("output doesn't have a datum")}
							)()
						}
					)()
				}(__core__fstPair(output))
			}(__core__unConstrData(__helios__txoutput__datum(output)))
		}
	}`));
	add(new RawFunc("__helios__tx__filter_outputs",
	`(self, fn) -> {
		__helios__common__filter_list(
			__helios__tx__outputs(self), 
			fn
		)
	}`));
	add(new RawFunc("__helios__tx__outputs_sent_to",
	`(self) -> {
		(pkh) -> {
			__helios__tx__filter_outputs(self, (output) -> {
				__helios__txoutput__is_sent_to(output)(pkh)
			})
		}
	}`));
	add(new RawFunc(`__helios__tx__outputs_sent_to_datum[${FTPP}0]`,
	`(self) -> {
		(pkh, datum, isInline) -> {
			__core__ifThenElse(
				isInline,
				() -> {
					__helios__tx__outputs_sent_to_inline_datum[${FTPP}0](self, pkh, datum)
				},
				() -> {
					__helios__tx__outputs_sent_to_datum_hash[${FTPP}0](self, pkh, datum)
				}
			)()
		}
	}`));
	add(new RawFunc(`__helios__tx__outputs_sent_to_datum_hash[${FTPP}0]`,
	`(self, pkh, datum) -> {
		(datumHash) -> {
			__helios__tx__filter_outputs(
				self, 
				(output) -> {
					__helios__bool__and(
						() -> {
							__helios__txoutput__is_sent_to(output)(pkh)
						},
						() -> {
							__helios__txoutput__has_datum_hash(output, datumHash)
						}
					)
				}
			)
		}(__helios__common__hash_datum_data[${FTPP}0](datum))
	}`));
	add(new RawFunc(`__helios__tx__outputs_sent_to_inline_datum[${FTPP}0]`,
	`(self, pkh, datum) -> {
		__helios__tx__filter_outputs(
			self, 
			(output) -> {
				__helios__bool__and(
					() -> {
						__helios__txoutput__is_sent_to(output)(pkh)
					},
					() -> {
						__helios__txoutput__has_inline_datum[${FTPP}0](output, datum)
					}
				)
			}
		)
	}`));
	add(new RawFunc("__helios__tx__outputs_locked_by",
	`(self) -> {
		(vh) -> {
			__helios__tx__filter_outputs(self, (output) -> {
				__helios__txoutput__is_locked_by(output)(vh)
			})
		}
	}`));
	add(new RawFunc(`__helios__tx__outputs_locked_by_datum[${FTPP}0]`,
	`(self) -> {
		(vh, datum, isInline) -> {
			__core__ifThenElse(
				isInline,
				() -> {
					__helios__tx__outputs_locked_by_inline_datum[${FTPP}0](self, vh, datum)
				},
				() -> {
					__helios__tx__outputs_locked_by_datum_hash[${FTPP}0](self, vh, datum)
				}
			)()
		}
	}`));
	add(new RawFunc(`__helios__tx__outputs_locked_by_datum_hash[${FTPP}0]`,
	`(self, vh, datum) -> {
		(datumHash) -> {
			__helios__tx__filter_outputs(
				self, 
				(output) -> {
					__helios__bool__and(
						() -> {
							__helios__txoutput__is_locked_by(output)(vh)
						},
						() -> {
							__helios__txoutput__has_datum_hash(output, datumHash)
						}
					)
				}
			)
		}(__helios__common__hash_datum_data[${FTPP}0](datum))
	}`));
	add(new RawFunc(`__helios__tx__outputs_locked_by_inline_datum[${FTPP}0]`,
	`(self, vh, datum) -> {
		__helios__tx__filter_outputs(
			self, 
			(output) -> {
				__helios__bool__and(
					() -> {
						__helios__txoutput__is_locked_by(output)(vh)
					},
					() -> {
						__helios__txoutput__has_inline_datum[${FTPP}0](output, datum)
					}
				)
			}
		)
	}`));
	add(new RawFunc("__helios__tx__value_sent_to",
	`(self) -> {
		(pkh) -> {
			__helios__txoutput__sum_values(__helios__tx__outputs_sent_to(self)(pkh))
		}
	}`));
	add(new RawFunc(`__helios__tx__value_sent_to_datum[${FTPP}0]`,
	`(self) -> {
		(pkh, datum, isInline) -> {
			__helios__txoutput__sum_values(__helios__tx__outputs_sent_to_datum[${FTPP}0](self)(pkh, datum, isInline))
		}
	}`));
	add(new RawFunc("__helios__tx__value_locked_by",
	`(self) -> {
		(vh) -> {
			__helios__txoutput__sum_values(__helios__tx__outputs_locked_by(self)(vh))
		}
	}`));
	add(new RawFunc(`__helios__tx__value_locked_by_datum[${FTPP}0]`,
	`(self) -> {
		(vh, datum, isInline) -> {
			__helios__txoutput__sum_values(__helios__tx__outputs_locked_by_datum[${FTPP}0](self)(vh, datum, isInline))
		}
	}`));
	add(new RawFunc("__helios__tx__is_signed_by",
	`(self) -> {
		(hash) -> {
			(hash) -> {
				__helios__common__any(
					__helios__tx__signatories(self),
					(signatory) -> {
						__core__equalsData(signatory, hash)
					}
				)
			}(__helios__pubkeyhash____to_data(hash))
		}
	}`));


	// TxId builtins
	addDataFuncs("__helios__txid");
	add(new RawFunc("__helios__txid__bytes",
	`(self) -> {
		__core__unBData(__core__headList(__core__sndPair(__core__unConstrData(self))))
	}`));
	add(new RawFunc("__helios__txid____lt", 
	`(a, b) -> {
		__helios__bytearray____lt(__helios__txid__bytes(a), __helios__txid__bytes(b))
	}`));
	add(new RawFunc("__helios__txid____leq", 
	`(a, b) -> {
		__helios__bytearray____leq(__helios__txid__bytes(a), __helios__txid__bytes(b))
	}`));
	add(new RawFunc("__helios__txid____gt", 
	`(a, b) -> {
		__helios__bytearray____gt(__helios__txid__bytes(a), __helios__txid__bytes(b))
	}`));
	add(new RawFunc("__helios__txid____geq", 
	`(a, b) -> {
		__helios__bytearray____geq(__helios__txid__bytes(a), __helios__txid__bytes(b))
	}`));
	add(new RawFunc("__helios__txid__new",
	`(bytes) -> {
		__core__constrData(0, __helios__common__list_1(__core__bData(bytes))) 
	}`));
	add(new RawFunc("__helios__txid__show",
	`(self) -> {
		__helios__bytearray__show(__helios__txid__bytes(self))
	}`));


	// TxInput builtins
	addDataFuncs("__helios__txinput");
	add(new RawFunc("__helios__txinput__new",
	`(output_id, output) -> {
		__core__constrData(0, __helios__common__list_2(output_id, output))
	}`));
	add(new RawFunc("__helios__txinput__output_id", "__helios__common__field_0"));
	add(new RawFunc("__helios__txinput__output", "__helios__common__field_1"));
	

	// TxOutput builtins
	addDataFuncs("__helios__txoutput");
	add(new RawFunc("__helios__txoutput__new", 
	`(address, value, datum) -> {
		__core__constrData(0, __helios__common__list_4(address, __core__mapData(value), datum, __helios__option__NONE))
	}`));
	add(new RawFunc("__helios__txoutput__address", "__helios__common__field_0"));
	add(new RawFunc("__helios__txoutput__value", `(self) -> {
		__core__unMapData(__helios__common__field_1(self))
	}`));
	add(new RawFunc("__helios__txoutput__datum", "__helios__common__field_2"));
	add(new RawFunc("__helios__txoutput__ref_script_hash", "__helios__common__field_3"));
	add(new RawFunc("__helios__txoutput__get_datum_hash",
	`(self) -> {
		() -> {
			(pair) -> {
				__core__ifThenElse(
					__core__equalsInteger(__core__fstPair(pair), 1),
					() -> {
						__helios__datumhash__from_data(
							__core__headList(__core__sndPair(pair))
						)
					},
					() -> {#}
				)()
			}(__core__unConstrData(__helios__txoutput__datum(self)))
		}
	}`));
	add(new RawFunc("__helios__txoutput__has_datum_hash",
	`(self, datumHash) -> {
		__helios__datumhash____eq(__helios__txoutput__get_datum_hash(self)(), datumHash)
	}`));
	add(new RawFunc(`__helios__txoutput__has_inline_datum[${FTPP}0]`,
	`(self, datum) -> {
		(pair) -> {
			__core__ifThenElse(
				__core__equalsInteger(__core__fstPair(pair), 2),
				() -> {
					__core__equalsData(
						${FTPP}0____to_data(datum),
						__core__headList(__core__sndPair(pair))
					)
				},
				() -> {false}
			)()
		}(__core__unConstrData(__helios__txoutput__datum(self)))
	}`));
	add(new RawFunc("__helios__txoutput__is_locked_by",
	`(self) -> {
		(hash) -> {
			(credential) -> {
				__core__ifThenElse(
					__helios__credential__is_validator(credential),
					() -> {
						__helios__validatorhash____eq(
							hash, 
							__helios__credential__validator__hash(
								__helios__credential__validator__cast(credential)
							)
						)
					},
					() -> {false}
				)()
			}(__helios__address__credential(__helios__txoutput__address(self)))
		}
	}`));
	add(new RawFunc("__helios__txoutput__is_sent_to",
	`(self) -> {
		(pkh) -> {
			(credential) -> {
				__core__ifThenElse(
					__helios__credential__is_pubkey(credential),
					() -> {
						__helios__pubkeyhash____eq(
							pkh, 
							__helios__credential__pubkey__hash(
								__helios__credential__pubkey__cast(credential)
							)
						)
					},
					() -> {false}
				)()
			}(__helios__address__credential(__helios__txoutput__address(self)))
		}
	}`));
	add(new RawFunc("__helios__txoutput__sum_values",
	`(outputs) -> {
		__helios__common__fold(
			outputs, 
			(prev, txOutput) -> {
				__helios__value____add(
					prev,
					__helios__txoutput__value(txOutput)
				)
			}, 
			__helios__value__ZERO
		)
	}`));


	// OutputDatum
	addDataFuncs("__helios__outputdatum");
	add(new RawFunc("__helios__outputdatum__new_none",
	`() -> {
		__core__constrData(0, __helios__common__list_0)
	}`));
	add(new RawFunc("__helios__outputdatum__new_hash",
	`(hash) -> {
		__core__constrData(1, __helios__common__list_1(__helios__datumhash____to_data(hash)))
	}`));
	add(new RawFunc(`__helios__outputdatum__new_inline[${FTPP}0]`,
	`(data) -> {
		__core__constrData(2, __helios__common__list_1(${FTPP}0____to_data(data)))
	}`));
	add(new RawFunc("__helios__outputdatum__get_inline_data",
	`(self) -> {
		() -> {
			(pair) -> {
				(index, fields) -> {
					__core__ifThenElse(
						__core__equalsInteger(index, 2),
						() -> {
							__core__headList(fields)
						},
						() -> {
							error("not an inline datum")
						}
					)()
				}(__core__fstPair(pair), __core__sndPair(pair))
			}(__core__unConstrData(self))
		}
	}`));


	// OutputDatum::None
	addEnumDataFuncs("__helios__outputdatum__none", 0);
	

	// OutputDatum::Hash
	addEnumDataFuncs("__helios__outputdatum__hash", 1);
	add(new RawFunc("__helios__outputdatum__hash__hash", 
	`(self) -> {
		__helios__datumhash__from_data(__helios__common__field_0(self))
	}`));


	// OutputDatum::Inline
	addEnumDataFuncs("__helios__outputdatum__inline", 2);
	add(new RawFunc("__helios__outputdatum__inline__data", "__helios__common__field_0"));


	// RawData
	addDataFuncs("__helios__data");
	add(new RawFunc("__helios__data__tag", 
	`(self) -> {
		__core__fstPair(__core__unConstrData(self))
	}`));


	// TxOutputId
	addDataFuncs("__helios__txoutputid");
	add(new RawFunc("__helios__txoutputid__tx_id", "__helios__common__field_0"));
	add(new RawFunc("__helios__txoutputid__index", 
	`(self) -> {
		__helios__int__from_data(__helios__common__field_1(self))
	}`));
	add(new RawFunc("__helios__txoutputid__comp", 
	`(a, b, comp_txid, comp_index) -> {
		(a_txid, a_index) -> {
			(b_txid, b_index) -> {
				__core__ifThenElse(
					__core__equalsData(a_txid, b_txid),
					() -> {
						comp_index(a_index, b_index)
					},
					() -> {
						comp_txid(a_txid, b_txid)
					}
				)()
			}(__helios__txoutputid__tx_id(b), __helios__txoutputid__index(b))
		}(__helios__txoutputid__tx_id(a), __helios__txoutputid__index(a))
	}`));
	add(new RawFunc("__helios__txoutputid____lt", 
	`(a, b) -> {
		__helios__txoutputid__comp(a, b, __helios__txid____lt, __helios__int____lt)
	}`));
	add(new RawFunc("__helios__txoutputid____leq", 
	`(a, b) -> {
		__helios__txoutputid__comp(a, b, __helios__txid____leq, __helios__int____leq)
	}`));
	add(new RawFunc("__helios__txoutputid____gt", 
	`(a, b) -> {
		__helios__txoutputid__comp(a, b, __helios__txid____gt, __helios__int____gt)
	}`));
	add(new RawFunc("__helios__txoutputid____geq", 
	`(a, b) -> {
		__helios__txoutputid__comp(a, b, __helios__txid____geq, __helios__int____geq)
	}`));
	add(new RawFunc("__helios__txoutputid__new",
	`(tx_id, idx) -> {
		__core__constrData(0, __helios__common__list_2(tx_id, __helios__int____to_data(idx)))
	}`));


	// Address
	addDataFuncs("__helios__address");
	add(new RawFunc("__helios__address__new", 
	`(cred, staking_cred) -> {
		__core__constrData(0, __helios__common__list_2(cred, staking_cred))
	}`));
	add(new RawFunc("__helios__address__new_empty",
	`() -> {
		__core__constrData(0, __helios__common__list_2(__helios__credential__new_pubkey(#), __helios__option__NONE))
	}`))
	add(new RawFunc("__helios__address__credential", "__helios__common__field_0"));
	add(new RawFunc("__helios__address__staking_credential", "__helios__common__field_1"));
	add(new RawFunc("__helios__address__is_staked",
	`(self) -> {
		() -> {
			__core__equalsInteger(__core__fstPair(__core__unConstrData(__helios__common__field_1(self))), 0)
		}
	}`));


	// Credential builtins
	addDataFuncs("__helios__credential");
	add(new RawFunc("__helios__credential__new_pubkey",
	`(hash) -> {
		__core__constrData(0, __helios__common__list_1(__helios__pubkeyhash____to_data(hash)))
	}`));
	add(new RawFunc("__helios__credential__new_validator",
	`(hash) -> {
		__core__constrData(1, __helios__common__list_1(__helios__validatorhash____to_data(hash)))
	}`));
	add(new RawFunc("__helios__credential__is_pubkey",
	`(self) -> {
		__core__equalsInteger(__core__fstPair(__core__unConstrData(self)), 0)
	}`));
	add(new RawFunc("__helios__credential__is_validator",
	`(self) -> {
		__core__equalsInteger(__core__fstPair(__core__unConstrData(self)), 1)
	}`));


	// Credential::PubKey builtins
	addEnumDataFuncs("__helios__credential__pubkey", 0);
	add(new RawFunc("__helios__credential__pubkey__cast",
	`(data) -> {
		__helios__common__assert_constr_index(data, 0)
	}`));
	add(new RawFunc("__helios__credential__pubkey__hash", 
	`(self) -> {
		__helios__pubkeyhash__from_data(__helios__common__field_0(self))
	}`));


	// Credential::Validator builtins
	addEnumDataFuncs("__helios__credential__validator", 1);
	add(new RawFunc("__helios__credential__validator__cast",
	`(data) -> {
		__helios__common__assert_constr_index(data, 1)
	}`));
	add(new RawFunc("__helios__credential__validator__hash", 
	`(self) -> {
		__helios__validatorhash__from_data(__helios__common__field_0(self))
	}`));


	// StakingHash builtins
	addDataFuncs("__helios__stakinghash");
	add(new RawFunc("__helios__stakinghash__new_stakekey", "__helios__credential__new_pubkey"));
	add(new RawFunc("__helios__stakinghash__new_validator", "__helios__credential__new_validator"));
	add(new RawFunc("__helios__stakinghash__is_stakekey", "__helios__credential__is_stakekey"));
	add(new RawFunc("__helios__stakinghash__is_validator", "__helios__credential__is_validator"));


	// StakingHash::StakeKey builtins
	addEnumDataFuncs("__helios__stakinghash__stakekey", 0);
	add(new RawFunc("__helios__stakinghash__stakekey__cast", "__helios__credential__pubkey__cast"));
	add(new RawFunc("__helios__stakinghash__stakekey__hash", "__helios__credential__pubkey__hash"));


	// StakingHash::Validator builtins
	addEnumDataFuncs("__helios__stakinghash__validator", 1);
	add(new RawFunc("__helios__stakinghash__validator__cast", "__helios__credential__validator__cast"));
	add(new RawFunc("__helios__stakinghash__validator__hash", "__helios__credential__validator__hash"));


	// StakingCredential builtins
	addDataFuncs("__helios__stakingcredential");
	add(new RawFunc("__helios__stakingcredential__new_hash", 
	`(cred) -> {
		__core__constrData(0, __helios__common__list_1(cred))
	}`));
	add(new RawFunc("__helios__stakingcredential__new_ptr", 
	`(i, j, k) -> {
		__core__constrData(1, __helios__common__list_3(
			__helios__int____to_data(i), 
			__helios__int____to_data(j), 
			__helios__int____to_data(k)
		))
	}`));

	
	// StakingCredential::Hash builtins
	addEnumDataFuncs("__helios__stakingcredential__hash", 0);
	add(new RawFunc("__helios__stakingcredential__hash__hash", "__helios__common__field_0"));


	// StakingCredential::Ptr builtins
	addEnumDataFuncs("__helios__stakingcredential__ptr", 1);


	// Time builtins
	addIntLikeFuncs("__helios__time");
	add(new RawFunc("__helios__time__new", `__helios__common__identity`));
	add(new RawFunc("__helios__time____add", `__helios__int____add`));
	add(new RawFunc("__helios__time____sub", `__helios__int____sub`));
	add(new RawFunc("__helios__time____sub1", `__helios__int____sub`));
	add(new RawFunc("__helios__time____geq", `__helios__int____geq`));
	add(new RawFunc("__helios__time____gt", `__helios__int____gt`));
	add(new RawFunc("__helios__time____leq", `__helios__int____leq`));
	add(new RawFunc("__helios__time____lt", `__helios__int____lt`));
	add(new RawFunc("__helios__time__show", `__helios__int__show`));


	// Duratin builtins
	addIntLikeFuncs("__helios__duration");
	add(new RawFunc("__helios__duration__new", `__helios__common__identity`));
	add(new RawFunc("__helios__duration____add", `__helios__int____add`));
	add(new RawFunc("__helios__duration____sub", `__helios__int____sub`));
	add(new RawFunc("__helios__duration____mul", `__helios__int____mul`));
	add(new RawFunc("__helios__duration____div", `__helios__int____div`));
	add(new RawFunc("__helios__duration____div1", `__helios__int____div`));
	add(new RawFunc("__helios__duration____mod", `__helios__int____mod`));
	add(new RawFunc("__helios__duration____geq", `__helios__int____geq`));
	add(new RawFunc("__helios__duration____gt", `__helios__int____gt`));
	add(new RawFunc("__helios__duration____leq", `__helios__int____leq`));
	add(new RawFunc("__helios__duration____lt", `__helios__int____lt`));
	add(new RawFunc("__helios__duration__SECOND", "1000"));
	add(new RawFunc("__helios__duration__MINUTE", "60000"));
	add(new RawFunc("__helios__duration__HOUR", "3600000"));
	add(new RawFunc("__helios__duration__DAY", "86400000"));
	add(new RawFunc("__helios__duration__WEEK", "604800000"));


	// TimeRange builtins
	addDataFuncs("__helios__timerange");
	add(new RawFunc("__helios__timerange__new", `
	(a, b) -> {
		(a, b) -> {
			__core__constrData(0, __helios__common__list_2(
				__core__constrData(0, __helios__common__list_2(
					__core__constrData(1, __helios__common__list_1(a)),
					__helios__bool____to_data(true)
				)),
				__core__constrData(0, __helios__common__list_2(
					__core__constrData(1, __helios__common__list_1(b)),
					__helios__bool____to_data(true)
				))
			))
		}(__helios__time____to_data(a), __helios__time____to_data(b))
	}`));
	add(new RawFunc("__helios__timerange__ALWAYS", `
	__core__constrData(0, __helios__common__list_2(
		__core__constrData(0, __helios__common__list_2(
			__core__constrData(0, __helios__common__list_0),
			__helios__bool____to_data(true)
		)),
		__core__constrData(0, __helios__common__list_2(
			__core__constrData(2, __helios__common__list_0),
			__helios__bool____to_data(true)
		))
	))`));
	add(new RawFunc("__helios__timerange__NEVER", `
	__core__constrData(0, __helios__common__list_2(
		__core__constrData(0, __helios__common__list_2(
			__core__constrData(2, __helios__common__list_0),
			__helios__bool____to_data(true)
		)),
		__core__constrData(0, __helios__common__list_2(
			__core__constrData(0, __helios__common__list_0),
			__helios__bool____to_data(true)
		))
	))`));
	add(new RawFunc("__helios__timerange__from", `
	(a) -> {
		(a) -> {
			__core__constrData(0, __helios__common__list_2(
				__core__constrData(0, __helios__common__list_2(
					__core__constrData(1, __helios__common__list_1(a)),
					__helios__bool____to_data(true)
				)),
				__core__constrData(0, __helios__common__list_2(
					__core__constrData(2, __helios__common__list_0),
					__helios__bool____to_data(true)
				))
			))
		}(__helios__time____to_data(a))
	}`));
	add(new RawFunc("__helios__timerange__to", `
	(b) -> {
		(b) -> {
			__core__constrData(0, __helios__common__list_2(
				__core__constrData(0, __helios__common__list_2(
					__core__constrData(0, __helios__common__list_0),
					__helios__bool____to_data(true)
				)),
				__core__constrData(0, __helios__common__list_2(
					__core__constrData(1, __helios__common__list_1(b)),
					__helios__bool____to_data(true)
				))
			))
		}(__helios__time____to_data(b))
	}`));
	add(new RawFunc("__helios__timerange__is_before", 
	`(self) -> {
		(t) -> {
			(upper) -> {
				(extended, closed) -> {
					(extType) -> {
						__core__ifThenElse(
							__core__equalsInteger(extType, 2),
							() -> {false},
							() -> {
								__core__ifThenElse(
									__core__equalsInteger(extType, 0),
									() -> {true},
									() -> {
										__core__ifThenElse(
											closed,
											() -> {__core__lessThanInteger(__core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))), t)},
											() -> {__core__lessThanEqualsInteger(__core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))), t)}
										)()
									}
								)()
							}
						)()
					}(__core__fstPair(__core__unConstrData(extended)))
				}(__helios__common__field_0(upper), __helios__bool__from_data(__helios__common__field_1(upper)))
			}(__helios__common__field_1(self))
		}
	}`));
	add(new RawFunc("__helios__timerange__is_after",
	`(self) -> {
		(t) -> {
			(lower) -> {
				(extended, closed) -> {
					(extType) -> {
						__core__ifThenElse(
							__core__equalsInteger(extType, 0),
							() -> {false},
							() -> {
								__core__ifThenElse(
									__core__equalsInteger(extType, 2),
									() -> {true},
									() -> {
										__core__ifThenElse(
											closed,
											() -> {__core__lessThanInteger(t, __core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))))},
											() -> {__core__lessThanEqualsInteger(t, __core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))))}
										)()
									}
								)()
							}
						)()
					}(__core__fstPair(__core__unConstrData(extended)))
				}(__helios__common__field_0(lower), __helios__bool__from_data(__helios__common__field_1(lower)))
			}(__helios__common__field_0(self))
		}
	}`));
	add(new RawFunc("__helios__timerange__contains",
	`(self) -> {
		(t) -> {
			(lower) -> {
				(extended, closed) -> {
					(lowerExtType, checkUpper) -> {
						__core__ifThenElse(
							__core__equalsInteger(lowerExtType, 2),
							() -> {false},
							() -> {
								__core__ifThenElse(
									__core__equalsInteger(lowerExtType, 0),
									() -> {checkUpper()},
									() -> {
										__core__ifThenElse(
											__core__ifThenElse(
												closed,
												() -> {__core__lessThanEqualsInteger(__core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))), t)},
												() -> {__core__lessThanInteger(__core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))), t)}
											)(),
											() -> {checkUpper()},
											() -> {false}
										)()
									}
								)()
							}
						)()
					}(__core__fstPair(__core__unConstrData(extended)), () -> {
						(upper) -> {
							(extended, closed) -> {
								(upperExtType) -> {
									__core__ifThenElse(
										__core__equalsInteger(upperExtType, 0),
										() -> {false},
										() -> {
											__core__ifThenElse(
												__core__equalsInteger(upperExtType, 2),
												() -> {true},
												() -> {
													__core__ifThenElse(
														__core__ifThenElse(
															closed,
															() -> {__core__lessThanEqualsInteger(t, __core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))))},
															() -> {__core__lessThanInteger(t, __core__unIData(__core__headList(__core__sndPair(__core__unConstrData(extended)))))}
														)(),
														true,
														false
													)
												}
											)()
										}
									)()
								}(__core__fstPair(__core__unConstrData(extended)))
							}(__helios__common__field_0(upper), __helios__bool__from_data(__helios__common__field_1(upper)))
						}(__helios__common__field_1(self))
					})
				}(__helios__common__field_0(lower), __helios__bool__from_data(__helios__common__field_1(lower)))
			}(__helios__common__field_0(self))
		}
	}`));
	add(new RawFunc("__helios__timerange__start",
	`(self) -> {
		__helios__time__from_data(__helios__common__field_0(__helios__common__field_0(__helios__common__field_0(self))))
	}`));
	add(new RawFunc("__helios__timerange__end",
	`(self) -> {
		__helios__time__from_data(__helios__common__field_0(__helios__common__field_0(__helios__common__field_1(self))))
	}`));
	add(new RawFunc("__helios__timerange__show",
	`(self) -> {
		() -> {
			(show_extended) -> {
				__helios__string____add(
					(lower) -> {
						(extended, closed) -> {
							__helios__string____add(
								__core__ifThenElse(closed, "[", "("),
								show_extended(extended)
							)
						}(__helios__common__field_0(lower), __helios__bool__from_data(__helios__common__field_1(lower)))
					}(__helios__common__field_0(self)),
					__helios__string____add(
						",",
						(upper) -> {
							(extended, closed) -> {
								__helios__string____add(
									show_extended(extended),
									__core__ifThenElse(closed, "]", ")")
								)
							}(__helios__common__field_0(upper), __helios__bool__from_data(__helios__common__field_1(upper)))
						}(__helios__common__field_1(self))
					)
				)
			}(
				(extended) -> {
					(extType) -> {
						__core__ifThenElse(
							__core__equalsInteger(extType, 0),
							() -> {"-inf"},
							() -> {
								__core__ifThenElse(
									__core__equalsInteger(extType, 2),
									() -> {"+inf"},
									() -> {
										(fields) -> {
											__helios__int__show(
												__helios__int__from_data(__core__headList(fields))
											)()
										}(__core__sndPair(__core__unConstrData(extended)))
									}
								)()
							}
						)()
					}(__core__fstPair(__core__unConstrData(extended)))
				}
			)
		}
	}`))


	// AssetClass builtins
	addDataFuncs("__helios__assetclass");
	add(new RawFunc("__helios__assetclass__ADA", `__helios__assetclass__new(#, #)`));
	add(new RawFunc("__helios__assetclass__new",
	`(mph, token_name) -> {
		__core__constrData(0, __helios__common__list_2(
			__helios__mintingpolicyhash____to_data(mph), 
			__helios__bytearray____to_data(token_name)
		))
	}`));
	add(new RawFunc("__helios__assetclass__mph", 
	`(self) -> {
		__helios__mintingpolicyhash__from_data(__helios__common__field_0(self))
	}`));
	add(new RawFunc("__helios__assetclass__token_name", 
	`(self) -> {
		__helios__bytearray__from_data(__helios__common__field_1(self))
	}`));


	// Value builtins
	addSerializeFunc("__helios__value");
	add(new RawFunc("__helios__value__from_data", "__core__unMapData"));
	add(new RawFunc("__helios__value____to_data", "__core__mapData"));
	add(new RawFunc("__helios__value__ZERO", "__core__mkNilPairData(())"));
	add(new RawFunc("__helios__value__lovelace",
	`(i) -> {
		__helios__value__new(__helios__assetclass__ADA, i)
	}`));
	add(new RawFunc("__helios__value__new",
	`(assetClass, i) -> {
		__core__ifThenElse(
			__core__equalsInteger(0, i),
			() -> {
				__helios__value__ZERO
			},
			() -> {
				(mph, tokenName) -> {
					__core__mkCons(
						__core__mkPairData(
							mph, 
							__core__mapData(
								__core__mkCons(
									__core__mkPairData(tokenName, __helios__int____to_data(i)), 
									__core__mkNilPairData(())
								)
							)
						), 
						__core__mkNilPairData(())
					)
				}(__helios__common__field_0(assetClass), __helios__common__field_1(assetClass))
			}
		)()
	}`));
	add(new RawFunc("__helios__value__from_map", "__helios__common__identity"));
	add(new RawFunc("__helios__value__to_map", 
	`(self) -> {
		() -> {
			self
		}
	}`));
	add(new RawFunc("__helios__value__get_map_keys",
	`(map) -> {
		(recurse) -> {
			recurse(recurse, map)
		}(
			(recurse, map) -> {
				__core__chooseList(
					map, 
					() -> {__helios__common__list_0}, 
					() -> {__core__mkCons(__core__fstPair(__core__headList(map)), recurse(recurse, __core__tailList(map)))}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__value__merge_map_keys",
	`(a, b) -> {
		(aKeys) -> {
			(recurse) -> {
				(uniqueBKeys) -> {
					__helios__common__concat(aKeys, uniqueBKeys)
				}(recurse(recurse, aKeys, b))
			}(
				(recurse, keys, map) -> {
					__core__chooseList(
						map, 
						() -> {__helios__common__list_0}, 
						() -> {
							(key) -> {
								__core__ifThenElse(
									__helios__common__is_in_bytearray_list(aKeys, key), 
									() -> {recurse(recurse, keys, __core__tailList(map))},
									() -> {__core__mkCons(key, recurse(recurse, keys, __core__tailList(map)))}
								)()
							}(__core__fstPair(__core__headList(map)))
						}
					)()
				}
			)
		}(__helios__value__get_map_keys(a))
	}`));

	add(new RawFunc("__helios__value__get_inner_map",
	`(map, mph) -> {
		(recurse) -> {
			recurse(recurse, map)
		}(
			(recurse, map) -> {
				__core__chooseList(
					map, 
					() -> {__core__mkNilPairData(())},
					() -> {
						__core__ifThenElse(
							__core__equalsData(__core__fstPair(__core__headList(map)), mph), 
							() -> {__core__unMapData(__core__sndPair(__core__headList(map)))},
							() -> {recurse(recurse, __core__tailList(map))}
						)()
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__value__get_inner_map_int",
	`(map, key) -> {
		(recurse) -> {
			recurse(recurse, map, key)
		}(
			(recurse, map, key) -> {
				__core__chooseList(
					map, 
					() -> {0}, 
					() -> {
						__core__ifThenElse(
							__core__equalsData(__core__fstPair(__core__headList(map)), key), 
							() -> {__core__unIData(__core__sndPair(__core__headList(map)))}, 
							() -> {recurse(recurse, __core__tailList(map), key)}
						)()
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__value__add_or_subtract_inner",
	`(op) -> {
		(a, b) -> {
			(recurse) -> {
				recurse(recurse, __helios__value__merge_map_keys(a, b), __core__mkNilPairData(()))
			}(
				(recurse, keys, result) -> {
					__core__chooseList(
						keys, 
						() -> {result}, 
						() -> {
							(key, tail) -> {
								(sum) -> {
									__core__ifThenElse(
										__core__equalsInteger(sum, 0), 
										() -> {tail}, 
										() -> {__core__mkCons(__core__mkPairData(key, __core__iData(sum)), tail)}
									)()
								}(op(__helios__value__get_inner_map_int(a, key), __helios__value__get_inner_map_int(b, key)))
							}(__core__headList(keys), recurse(recurse, __core__tailList(keys), result))
						}
					)()
				}
			)
		}
	}`));
	add(new RawFunc("__helios__value__add_or_subtract",
	`(a, b, op) -> {
		(recurse) -> {
			recurse(recurse, __helios__value__merge_map_keys(a, b), __core__mkNilPairData(()))
		}(
			(recurse, keys, result) -> {
				__core__chooseList(
					keys, 
					() -> {result}, 
					() -> {
						(key, tail) -> {
							(item) -> {
								__core__chooseList(
									item, 
									() -> {tail}, 
									() -> {__core__mkCons(__core__mkPairData(key, __core__mapData(item)), tail)}
								)()
							}(__helios__value__add_or_subtract_inner(op)(__helios__value__get_inner_map(a, key), __helios__value__get_inner_map(b, key)))
						}(__core__headList(keys), recurse(recurse, __core__tailList(keys), result))
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__value__map_quantities",
	`(self, op) -> {
		(recurseInner) -> {
			(recurseOuter) -> {
				recurseOuter(recurseOuter, self)
			}(
				(recurseOuter, outer) -> {
					__core__chooseList(
						outer,
						() -> {__core__mkNilPairData(())},
						() -> {
							(head) -> {
								__core__mkCons(
									__core__mkPairData(
										__core__fstPair(head), 
										__core__mapData(recurseInner(recurseInner, __core__unMapData(__core__sndPair(head))))
									),  
									recurseOuter(recurseOuter, __core__tailList(outer))
								)
							}(__core__headList(outer))
						}
					)()
				}
			)
		}(
			(recurseInner, inner) -> {
				__core__chooseList(
					inner,
					() -> {__core__mkNilPairData(())},
					() -> {
						(head) -> {
							__core__mkCons(
								__core__mkPairData(
									__core__fstPair(head),
									__core__iData(op(__core__unIData(__core__sndPair(head))))
								),
								recurseInner(recurseInner, __core__tailList(inner))
							)
						}(__core__headList(inner))
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__value__compare_inner",
	`(comp, a, b) -> {
		(recurse) -> {
			recurse(recurse, __helios__value__merge_map_keys(a, b))
		}(
			(recurse, keys) -> {
				__core__chooseList(
					keys, 
					() -> {true}, 
					() -> {
						(key) -> {
							__core__ifThenElse(
								__helios__bool____not(
									comp(
										__helios__value__get_inner_map_int(a, key), 
										__helios__value__get_inner_map_int(b, key)
									)
								), 
								() -> {false}, 
								() -> {recurse(recurse, __core__tailList(keys))}
							)()
						}(__core__headList(keys))
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__value__compare",
	`(a, b, comp) -> {
		(recurse) -> {
			recurse(recurse, __helios__value__merge_map_keys(a, b))
		}(
			(recurse, keys) -> {
				__core__chooseList(
					keys, 
					() -> {true}, 
					() -> {
						(key) -> {
							__core__ifThenElse(
								__helios__bool____not(
									__helios__value__compare_inner(
										comp, 
										__helios__value__get_inner_map(a, key), 
										__helios__value__get_inner_map(b, key)
									)
								), 
								() -> {false}, 
								() -> {recurse(recurse, __core__tailList(keys))}
							)()
						}(__core__headList(keys))
					}
				)()
			}
		)
	}`));
	add(new RawFunc("__helios__value____eq",
	`(a, b) -> {
		__helios__value__compare(a, b, __core__equalsInteger)
	}`));
	add(new RawFunc("__helios__value____neq",
	`(a, b) -> {
		__helios__bool____not(__helios__value____eq(a, b))
	}`));
	add(new RawFunc("__helios__value____add",
	`(a, b) -> {
		__helios__value__add_or_subtract(a, b, __core__addInteger)
	}`));
	add(new RawFunc("__helios__value____sub",
	`(a, b) -> {
		__helios__value__add_or_subtract(a, b, __core__subtractInteger)
	}`));
	add(new RawFunc("__helios__value____mul",
	`(a, scale) -> {
		__helios__value__map_quantities(a, (qty) -> {__core__multiplyInteger(qty, scale)})
	}`));
	add(new RawFunc("__helios__value____div",
	`(a, den) -> {
		__helios__value__map_quantities(a, (qty) -> {__core__divideInteger(qty, den)})
	}`));
	add(new RawFunc("__helios__value____geq",
	`(a, b) -> {
		__helios__value__compare(
			a, 
			b, 
			(a_qty, b_qty) -> {
				__helios__bool____not(
					__core__lessThanInteger(a_qty, b_qty)
				)
			}
		)
	}`));
	add(new RawFunc("__helios__value__contains", `
	(self) -> {
		(value) -> {
			__helios__value____geq(self, value)
		}
	}`));
	add(new RawFunc("__helios__value____gt",
	`(a, b) -> {
		__helios__bool__and(
			() -> {
				__helios__bool____not(
					__helios__bool__and(
						__helios__value__is_zero(a),
						__helios__value__is_zero(b)
					)
				)
			},
			() -> {
				__helios__value__compare(
					a, 
					b,
					(a_qty, b_qty) -> {
						__helios__bool____not(__core__lessThanEqualsInteger(a_qty, b_qty))
					}
				)
			}
		)
	}`));
	add(new RawFunc("__helios__value____leq",
	`(a, b) -> {
		__helios__value__compare(a, b, __core__lessThanEqualsInteger)
	}`));
	add(new RawFunc("__helios__value____lt",
	`(a, b) -> {
		__helios__bool__and(
			() -> {
				__helios__bool____not(
					__helios__bool__and(
						__helios__value__is_zero(a),
						__helios__value__is_zero(b)
					)
				)
			},
			() -> {
				__helios__value__compare( 
					a, 
					b,
					(a_qty, b_qty) -> {
						__core__lessThanInteger(a_qty, b_qty)
					}
				)
			}
		)
	}`));
	add(new RawFunc("__helios__value__is_zero",
	`(self) -> {
		() -> {
			__core__nullList(self)
		}
	}`));
	add(new RawFunc("__helios__value__get",
	`(self) -> {
		(assetClass) -> {
			(mintingPolicyHash, tokenName) -> {
				(outer, inner) -> {
					outer(outer, inner, self)
				}(
					(outer, inner, map) -> {
						__core__chooseList(
							map, 
							() -> {error("policy not found")}, 
							() -> {
								__core__ifThenElse(
									__core__equalsData(__core__fstPair(__core__headList(map)), mintingPolicyHash), 
									() -> {inner(inner, __core__unMapData(__core__sndPair(__core__headList(map))))}, 
									() -> {outer(outer, inner, __core__tailList(map))}
								)()
							}
						)()
					}, (inner, map) -> {
						__core__chooseList(
							map, 
							() -> {error("tokenName not found")}, 
							() -> {
								__core__ifThenElse(
									__core__equalsData(__core__fstPair(__core__headList(map)), tokenName),
									() -> {
										__core__unIData(__core__sndPair(__core__headList(map)))
									},
									() -> {
										inner(inner, __core__tailList(map))
									}
								)()
							}
						)()
					}
				)
			}(__helios__common__field_0(assetClass), __helios__common__field_1(assetClass))
		}
	}`));
	add(new RawFunc("__helios__value__get_safe",
	`(self) -> {
		(assetClass) -> {
			(mintingPolicyHash, tokenName) -> {
				(outer, inner) -> {
					outer(outer, inner, self)
				}(
					(outer, inner, map) -> {
						__core__chooseList(
							map, 
							() -> {0}, 
							() -> {
								__core__ifThenElse(
									__core__equalsData(__core__fstPair(__core__headList(map)), mintingPolicyHash), 
									() -> {inner(inner, __core__unMapData(__core__sndPair(__core__headList(map))))}, 
									() -> {outer(outer, inner, __core__tailList(map))}
								)()
							}
						)()
					}, (inner, map) -> {
						__core__chooseList(
							map, 
							() -> {0}, 
							() -> {
								__core__ifThenElse(
									__core__equalsData(__core__fstPair(__core__headList(map)), tokenName),
									() -> {
										__core__unIData(__core__sndPair(__core__headList(map)))
									},
									() -> {
										inner(inner, __core__tailList(map))
									}
								)()
							}
						)()
					}
				)
			}(__helios__common__field_0(assetClass), __helios__common__field_1(assetClass))
		}
	}`));
	add(new RawFunc("__helios__value__get_lovelace",
	`(self) -> {
		() -> {
			__helios__value__get_safe(self)(__helios__assetclass__ADA)
		}
	}`));
	add(new RawFunc("__helios__value__get_assets",
	`(self) -> {
		() -> {
			__helios__common__filter_map(
				self,
				(pair) -> {
					__helios__bool____not(__core__equalsByteString(__core__unBData(__core__fstPair(pair)), #))
				}
			)
		}
	}`));
	add(new RawFunc("__helios__value__get_policy", 
	`(self) -> {
		(mph) -> {
			(mph) -> {
				(recurse) -> {
					recurse(recurse, self)
				}(
					(recurse, map) -> {
						__core__chooseList(
							map,
							() -> {error("policy not found")},
							() -> {
								__core__ifThenElse(
									__core__equalsData(__core__fstPair(__core__headList(map)), mph),
									() -> {
										__core__unMapData(__core__sndPair(__core__headList(map)))
									},
									() -> {
										recurse(recurse, __core__tailList(map))
									}
								)()
							}
						)()
					}
				)
			}(__helios__mintingpolicyhash____to_data(mph))
		} 
	}`));
	add(new RawFunc("__helios__value__contains_policy",
	`(self) -> {
		(mph) -> {
			(mph) -> {
				(recurse) -> {
					recurse(recurse, self)
				}(
					(recurse, map) -> {
						__core__chooseList(
							map,
							() -> {false},
							() -> {
								__core__ifThenElse(
									__core__equalsData(__core__fstPair(__core__headList(map)), mph),
									() -> {true},
									() -> {recurse(recurse, __core__tailList(map))}
								)()
							}
						)()
					}
				)
			}(__helios__mintingpolicyhash____to_data(mph))
		}
	}`));
	add(new RawFunc("__helios__value__show",
	`(self) -> {
		() -> {
			__helios__common__fold(
				self,
				(prev, pair) -> {
					(mph, tokens) -> {
						__helios__common__fold(
							tokens,
							(prev, pair) -> {
								(token_name, qty) -> {
									__helios__string____add(
										prev,
										__core__ifThenElse(
											__helios__mintingpolicyhash____eq(mph, #),
											() -> {
												__helios__string____add(
													"lovelace: ",
													__helios__string____add(
														__helios__int__show(qty)(),
														"\\n"
													)
												)
											},
											() -> {
												__helios__string____add(
													__helios__mintingpolicyhash__show(mph)(),
													__helios__string____add(
														".",
														__helios__string____add(
															__helios__bytearray__show(token_name)(),
															__helios__string____add(
																": ",
																__helios__string____add(
																	__helios__int__show(qty)(),
																	"\\n"
																)
															)
														)
													)
												)
											}
										)()
									)
								}(__helios__bytearray__from_data(__core__fstPair(pair)), __helios__int__from_data(__core__sndPair(pair)))
							},
							prev
						)
					}(__helios__mintingpolicyhash__from_data(__core__fstPair(pair)), __core__unMapData(__core__sndPair(pair)))
				},
				""
			)
		}
	}`))

	return db;
}

const db = makeRawFunctions();

/**
 * Load all raw generics so all possible implementations can be generated correctly during type parameter injection phase
 * @package
 * @returns {IRDefinitions}
 */
export function fetchRawGenerics() {
	/**
	 * @type {IRDefinitions}
	 */
	const map = new Map();

	for (let [k, v] of db) {
		if (IRParametricName.matches(k)) {
			// load without dependencies
			map.set(k, v.toIR())
		}
	}

	return map;
}

/**
 * @package
 * @param {IR} ir 
 * @returns {IRDefinitions}
 */
export function fetchRawFunctions(ir) {
	// notify statistics of existence of builtin in correct order
	if (onNotifyRawUsage !== null) {
		for (let [name, _] of db) {
			onNotifyRawUsage(name, 0);
		}
	}

	let [src, _] = ir.generateSource();

	

	let matches = src.match(RE_BUILTIN);

	/**
	 * @type {IRDefinitions}
	 */
	const map = new Map();

	if (matches !== null) {
		for (let m of matches) {
			if (!IRParametricName.matches(m) && !map.has(m)) {
				const builtin = db.get(m);

				if (!builtin) {
					throw new Error(`builtin ${m} not found`);
				}

				builtin.load(db, map);
			}
		}
	}

	return map;
}

/**
 * @package
 * @param {IR} ir 
 * @returns {IR}
 */
export function wrapWithRawFunctions(ir) {
	const map = fetchRawFunctions(ir);
	
	return IR.wrapWithDefinitions(ir, map);
}
