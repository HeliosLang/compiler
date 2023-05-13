//@ts-check
// Eval builtin typeclasses

import {
	assertClass
} from "./utils.js";

import {
    Site
} from "./tokens.js";

import {
	HeliosData
} from "./helios-data.js";

/**
 * @template {HeliosData} T
 * @typedef {import("./helios-data.js").HeliosDataClass<T>} HeliosDataClass
 */

import {
    Common,
    DataEntity,
	FuncEntity,
    FuncType
} from "./eval-common.js";

/**
 * @typedef {import("./eval-common.js").DataType} DataType
 */

/**
 * @typedef {import("./eval-common.js").EvalEntity} EvalEntity
 */

/**
 * @typedef {import("./eval-common.js").Multi} Multi
 */

/**
 * @typedef {import("./eval-common.js").Named} Named
 */

/**
 * @typedef {import("./eval-common.js").Parametric} Parametric
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

/**
 * @typedef {import("./eval-common.js").InstanceMembers} InstanceMembers
 */

/**
 * @typedef {import("./eval-common.js").TypeMembers} TypeMembers
 */

/**
 * @typedef {import("./eval-common.js").TypeClassMembers} TypeClassMembers
 */

import {
    BoolType,
    ByteArrayType,
    RawDataType
} from "./eval-primitives.js";


/**
 * @package
 * @implements {DataType}
 */
export class TypeClassImpl extends Common {
    /**
     * @type {string}
     */
    #name;

	/**
	 * @type {InstanceMembers}
	 */
	#instanceMembers;

	/**
	 * @type {TypeMembers}
	 */
	#typeMembers;

	/**
	 * @param {TypeClass} typeClass
	 * @param {string} name
	 */
	constructor(typeClass, name) {
		super();

        this.#name = name;
        this.#instanceMembers = typeClass.genInstanceMembers(this);
		this.#typeMembers = typeClass.genTypeMembers(this);
    }

	/**
	 * @param {string} name
	 * @returns {string}
	 */
	static nameToPath(name) {
		return `__typeparam__${name}`;
	}
	
    /**
	 * @type {InstanceMembers}
	 */
	get instanceMembers() {
		return this.#instanceMembers;
	}

	/**
	 * @type {string}
	 */
    get name() {
        return this.#name;
    }

	/**
	 * @type {null | HeliosDataClass<HeliosData>}
	 */
	get offChainType() {
		return null;
	}

	/**
	 * @type {string}
	 */
	get path() {
		return TypeClassImpl.nameToPath(this.name);
	}

	/**
	 * @type {string[]}
	 */
	get fieldNames() {
		return [];
	}

	/**
	 * @type {TypeMembers}
	 */
	get typeMembers() {
		return this.#typeMembers;
	}

	/**
	 * @type {DataType}
	 */
	get asDataType() {
		return this;
	}

    /**
     * @type {Named}
     */
    get asNamed() {
        return this;
    }

    /**
     * @type {Type}
     */
    get asType() {
        return this;
    }

    /**
	 * @package
	 * @param {Site} site 
	 * @param {Map<string, Type>} map 
	 * @param {null | Type} type
	 * @returns {Type}
	 */
	infer(site, map, type) {
		const prev = map.get(this.#name);

		if (!prev) {
			if (type) {
				map.set(this.#name, type);

				return type;
			} else {
				throw new Error(`${this.#name} should be in map`);
			}
		} else {
			return prev;
		}
	}

	/**
	 * Returns 'true' if 'this' is a base-type of 'type'. Throws an error if 'this' isn't a Type.
	 * @param {Type} type
	 * @returns {boolean}
	 */
	isBaseOf(type) {
		if (type instanceof TypeClassImpl) {
			// we cans simply use name because name-shadowing isn't allowed
			return type.name == this.name;
		} else {
			return false;
		}
	}

    /**
	 * @returns {string}
	 */
	toString() {
		return this.name;
	}

	/**
	 * @returns {Typed}
	 */
	toTyped() {
		return new DataEntity(this);
	}
}

/**
 * @package
 * @implements {TypeClass}
 */
export class AnyTypeClass extends Common {
    constructor() {
        super();
    }

	/**
	 * @type {TypeClass}
	 */
	get asTypeClass() {
		return this;
	}

    /**
	 * @param {Type} impl
	 * @returns {TypeClassMembers}
	 */
	genInstanceMembers(impl) {
		return {};
	}

	/**
	 * @param {Type} impl
	 * @returns {TypeClassMembers}
	 */
	genTypeMembers(impl) {
		return {};
    }

	/**
	 * @returns {string}
	 */
	toString() {
		return "Any"
	}

    /**
     * @param {string} name 
     * @returns {DataType}
     */

    toType(name) {
        return new TypeClassImpl(this, name);
    }
}

/**
 * @package
 * @implements {TypeClass}
 */
export class SerializableTypeClass extends Common {
    constructor() {
        super();
    }

	/**
	 * @type {TypeClass}
	 */
	get asTypeClass() {
		return this;
	}

	/**
	 * @param {Type} impl
	 * @returns {TypeClassMembers}
	 */
	genTypeMembers(impl) {
		return {
            __eq: new FuncType([impl, impl], BoolType),
            __neq: new FuncType([impl, impl], BoolType),
			__to_data: new FuncType([impl], RawDataType),
			from_data: new FuncType([RawDataType], impl)
		}
	}

	/**	
	 * @param {Type} impl
	 * @returns {TypeClassMembers}
	 */
	genInstanceMembers(impl) {
		return {
            serialize: new FuncType([], ByteArrayType)
		}
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return "Serializable";
	}

    /**
     * @param {string} name 
     * @returns {DataType}
     */
    toType(name) {
        return new TypeClassImpl(this, name);
    }
}


/**
 * @package
 */
export class Parameter {
	/** 
	 * @type {string} 
	 */
	#name;

	/** 
	 * @type {TypeClass}
	 */
	#typeClass;

	/**
	 * @param {string} name - typically "a" or "b"
	 * @param {TypeClass} typeClass
	 */
	constructor(name, typeClass) {
		this.#name = name;
		this.#typeClass = typeClass
	}

	/**
	 * @type {string}
	 */
	get name() {
		return this.#name;
	}

	/**
	 * @type {Type}
	 */
	get ref() {
		return new TypeClassImpl(this.typeClass, this.#name);
	}

	/**
	 * A null TypeClass matches any type
	 * @type {TypeClass}
	 */
	get typeClass() {
		return this.#typeClass;
	}

	toString() {
		if (this.#typeClass) {
			return `${this.#name}: ${this.#typeClass.toString()}`
		} else {
			return this.#name;
		}
	}
}

/**
 * Only func instances can be parametrics instances,
 *  there are no other kinds of parametric instances
 * @package
 * @implements {Parametric}
 */
export class ParametricFunc extends Common {
	#params;
	#fnType;

	/**
	 * @param {Parameter[]} params
	 * @param {FuncType} fnType
	 */
	constructor(params, fnType) {
		super();
		this.#params = params;
		this.#fnType = fnType;
	}

	/**
	 * @type {null | ((...any) => HeliosDataClass<HeliosData>)}
	 */
	get offChainType() {
		return null;
	}

	get params() {
		return this.#params;
	}

	get fnType() {
		return this.#fnType;
	}

	/**
	 * null TypeClasses aren't included
	 * @type {TypeClass[]}
	 */
	get typeClasses() {
		return this.#params.map(p => p.typeClass);
	}

	/**
	 * @param {Type[]} types 
	 * @param {Site} site
	 * @returns {EvalEntity}
	 */
	apply(types, site = Site.dummy()) {
		if (types.length != this.#params.length) {
			throw site.typeError("wrong number of parameter type arguments");
		}

		/**
		 * @type {Map<string, Type>}
		 */
		const map = new Map();

		this.#params.forEach((p, i) => {
			if (!Common.typeImplements(types[i], p.typeClass)) {
				throw site.typeError("typeclass match failed")
			}

			map.set(p.name, types[i]);
		});

		const inferred = this.#fnType.infer(site, map, null);

		return new FuncEntity(assertClass(inferred, FuncType));
	}

	/**
	 * @type {Parametric}
	 */
	get asParametric() {
		return this;
	}

    /**
	 * Must infer before calling
	 * @param {Site} site 
	 * @param {Typed[]} args
	 * @param {{[name: string]: Typed}} namedArgs
	 * @param {Type[]} paramTypes - so that paramTypes can be accessed by caller
	 * @returns {Typed | Multi}
	 */
	call(site, args, namedArgs = {}, paramTypes = []) {
		/**
		 * @type {Map<string, Type>}
		 */
		const map = new Map();

		const fnType = this.#fnType.inferArgs(site, map, args.map(a => a.type));

		// make sure that each parameter is defined in the map
		this.#params.forEach(p => {
			const pt = map.get(p.name);

			if (!pt) {
				throw site.typeError("failed to infer all type parameters (hint: apply directly using [...])");
			}

			paramTypes.push(pt);
		});

		return (new FuncEntity(fnType)).call(site, args, namedArgs);
	}

    /**
     * @returns {string}
     */
	toString() {
		return this.#fnType.toString();
	}
}

/**
 * @package
 * @implements {DataType}
 */
class AppliedType extends Common {
    #types;
    #apply;
    #inner;

    /**
     * @param {Type[]} types
     * @param {(types: Type[]) => DataType} apply
     * @param {DataType} inner 
     */
    constructor(types, apply, inner) {
        super();

        this.#types = types;
        this.#apply = apply;
        this.#inner = inner;
    }

    /**
     * @type {string[]}
     */
    get fieldNames() {
        return this.#inner.fieldNames;
    }

    /**
     * @type {InstanceMembers}
     */
    get instanceMembers() {
        return this.#inner.instanceMembers;
    }

    /**
     * @type {string}
     */
    get name() {
        return this.#inner.name;
    }

    /**
     * @type {null | HeliosDataClass<HeliosData>}
     */
    get offChainType() {
        return this.#inner.offChainType;
    }

    /**
     * @type {string}
     */
    get path() {
        return this.#inner.path;
    }

    /**
     * @type {TypeMembers}
     */
    get typeMembers() {
        return this.#inner.typeMembers;
    }

    /**
     * @type {DataType}
     */
    get asDataType() {
        return this;
    }

    /**
     * @type {Named}
     */
    get asNamed() {
        return this;
    }

    /**
     * @type {Type}
     */
    get asType() {
        return this;
    }

    /**
     * @param {Site} site 
     * @param {Map<string, Type>} map 
     * @param {null | Type} type 
     * @returns {Type}
     */
    infer(site, map, type) {
        if (!type) {
            const inferred = this.#types.map(t => t.infer(site, map, null));

            return new AppliedType(inferred, this.#apply, this.#apply(inferred));
		} else if (this.isBaseOf(type)) {
            const inferred = this.#types.map(t => t.infer(site, map, t));

            return new AppliedType(inferred, this.#apply, this.#apply(inferred));
        }

		throw site.typeError("unable to infer type");
    }

    /**
     * @param {Type} other 
     * @returns {boolean}
     */
    isBaseOf(other) {
        return this.#inner.isBaseOf(other);
    }

    /**
     * @returns {string}
     */
    toString() {
        return this.#inner.toString();
    }

	/**
	 * @returns {Typed}
	 */
	toTyped() {
		return new DataEntity(this);
	}
}

/**
 * @package
 * @implements {Parametric}
 */
export class ParametricType extends Common {
    #offChainType;
    #parameters;
    #apply;

    /**
     * @param {{
     *   offChainType?: ((...any) => HeliosDataClass<HeliosData>)
     *   parameters: Parameter[]
     *   apply: (types: Type[]) => DataType
     * }} props
     */
    constructor({offChainType, parameters, apply}) {
        super();
        this.#offChainType = offChainType ?? null;
        this.#parameters = parameters;
        this.#apply = apply;
    }

    /**
     * @type {Parametric}
     */
    get asParametric() {
        return this;
    }

    /**
     * @type {null | ((...any) => HeliosDataClass<HeliosData>)}
     */
    get offChainType() {
        return this.#offChainType;
    }

	/**
	 * @type {TypeClass[]}
	 */
	get typeClasses() {
		return this.#parameters.map(p => p.typeClass);
	}

    /**
     * @param {Type[]} types 
     * @param {Site} site 
     * @returns {EvalEntity}
     */
    apply(types, site = Site.dummy()) {
        if (types.length != this.#parameters.length) {
			throw site.typeError(`expected ${this.#parameters.length} type parameter(s), got ${types.length}`);
		}

		this.#parameters.forEach((p, i) => {
			if (!Common.typeImplements(types[i], p.typeClass)) {
				throw site.typeError(`${types[i].toString()} doesn't implement ${p.typeClass.toString()}`);
			}
		});

		return new AppliedType(types, this.#apply, this.#apply(types));
    }

	 /**
	 * Must infer before calling
	 * @param {Site} site 
	 * @param {Typed[]} args
	 * @param {{[name: string]: Typed}} namedArgs
	 * @param {Type[]} paramTypes - so that paramTypes can be accessed by caller
	 * @returns {Typed | Multi}
	 */
	call(site, args, namedArgs = {}, paramTypes = []) {
		throw site.typeError("not a parametric function");
	}
}