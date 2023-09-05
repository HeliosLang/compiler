# IR optimization

Helios compiles a set of scripts in an Internal Representation. For production use, this IR is then optimized to create leaner UPLC.

This optimization process isn't trivial and if done wrong can lead to critical bugs. This document describes how Helios performs this optimization and discusses some of the unobvious details.

## Optimization steps

Before the main part of the optimization process is performed, unused top-level function definitions are eliminated, and `const` statements are evaluated as much as possible (some `const` statements can't be evaluated because they depend on runtime data).

Should an error be thrown inside a `const` statements, then the compiler should throw an error as well stating that the resulting UPLC can never succeed.

The main part of the optimization consists of two steps, that are repeated until no more changes are detected:
  1. evaluate literals as much as possible
  2. optimize topology (inlining, eliminating unused args, etc.)

## Evaluating literals

If all the arguments of a builtin function call are literals, then that call can be evaluated during compile-time and replaced by another literal. If any errors are thrown, eg. division by zero, the substitution doesn't take place and the expression stays unoptimized.

```
__core__<builtin-name>(<literal-expr>, ...) => <literal-expr>
```

Some builtin calls can be substituted even if only some of the args are known. This is only possible though if the unknown expression never throws an error.

### Adding 0

```
__core__addInteger(<expr>, 0) => <expr>
__core__addInteger(0, <expr>) => <expr>
```

### Subtracting 0

```
__core__subtractInteger(<expr>, 0) => <expr>
```

### Multiplying by 0

```
__core__multiplyInteger(<expr>, 0) => 0
__core__multiplyInteger(0, <expr>) => 0
```

Can't be done if `<expr>` throws an error.

### Multiplying by 1

```
__core__multiplyInteger(<expr>, 1) => <expr>
__core__multiplyInteger(1, <expr>) => <expr>
```

### Dividing by 1

```
__core__divideInteger(<expr>, 1) => <expr>
```

### Modulo 1

```
__core__modInteger(<expr>, 1) => 0
```

Can't be done if `<expr>` throws an error.

### ifThenElse known condition

```
__core__ifThenElse(true, <expr-a>, <expr-b>) => <expr-a>
__core__ifThenElse(false, <expr-a>, <expr-b>) => <expr-b>
```

Can't be done if the other expr throws an error.

### Append empty string

```
__core__appendString(<expr>, "") => <expr>
__core__appendString("", <expr>) => <expr>
```

### Append empty byteString

```
__core__appendByteString(<expr>, #) => <expr>
__core__appendByteString(#, <expr>) => <expr>
```

### chooseList of known list

```
__core__chooseList([], <expr-a>, <expr-b>) => <expr-a>
__core__chooseList([...], <expr-a>, <expr-b>) => <expr-b>
```

Can't be done if the other expr throws an error.

### chooseUnit

```
__core__chooseUnit(<expr-a>, <expr-b>) => <expr-b>
```

Can't be done of `<expr-a>` throws an error.

### chooseUnit of unit

```
__core__chooseUnit(<expr>, ()) => <expr>
```

This works because `<expr>` returns a unit as well.

### Calling a function with a literal body

```
<expr-returning-fn-with-literal-body>(<arg-expr>, ...) => <literal-body>
```

Can't be done if the expression returning the function, or any of the arg expressions, throws an error.

## Builtin call topology optimizations

### decodeUtf8 of encodeUtf8

```
__core__decodeUtf8(__core__encodeUtf8(<expr>)) => <expr>
```

### equalsData of iData

```
__core__equalsData(__core__iData(<expr-a>), __core__iData(<expr-b>)) => __core__equalsInteger(<expr-a>, <expr-b>)
```

### equalsData of bData

```
__core__equalsData(__core__bData(<expr-a>), __core__bData(<expr-b>)) => __core__equalsByteString(<expr-a>, <expr-b>)
```

### equalsData of decodeUtf8

Not possible because either decodeUtf8 call could throw an error.

### ifThenElse with nullList condition

```
__core__ifThenElse(__core__nullList(<expr-cond>), <expr-a>, <expr-b>) => __core__chooseList(<expr-cond>, <expr-a>, <expr-b>)
```

### trace

```
__core__trace(<msg-expr>, <expr>) => <expr>
```

Can't be done if `<msg-expr>` throws an error. Sadly decodeUtf8 will be used throughout for debugging. The methods that "show" byte arrays and ints require `decodeUtf8` to convert a byte array into a string.

## IR evaluation

Simplifying literals requires a (pseudo)-evaluation of the IR. Though less efficient, a simple recursive algorithm can be used.

Each term can return one of the following value types:
  * IRLiteralValue (wraps UplcValue, similar to IRLiteralExpr)
  * IRErrorValue (potential error thrown by expression returning this value)
  * IRDataValue (generic data value which can't be known during compile time)
  * IRFuncValue (each IRFuncValue, containing a callback function wrapping the associated IRFuncExpr or builtin func)
  * IRMultiValue (a set of any other value type above)
