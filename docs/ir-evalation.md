# IR Evaluation

The IR AST must be evaluated before being able to apply any [optimizations](./ir-optimization.md). A variation of the UPLC CEK machine has been development to do this in a non-recursive way.

## IR CEK machine

### IRExpr -> Compute

First the root IR AST is pushed onto the Compute stack. This binds a value Stack (i.e. `IRStack`) to a particular expression.

For `IRCallExprs` this is done recursively, first the expr itself is pushed onto the Compute stack (so we now how reduce its subexpressions later on), then its lhs is pushed onto the Compute stack, and then its args.

Once the root expression is unwrapped into the Compute stack, the main evaluation loop is started.

### Compute -> Reduce

The main loop of the IR evaluator starts by popping the head item from the Compute stack.

-   An `IRErrorExpr` results in an `IRErrorValue` being pushed onto the Reduction stack.
-   An `IRLiteralExpr` results in an `IRLiteralValue` being pushed onto the Reduction stack.
-   An `IRNameExpr` results in different things being pushed onto the Reduction stack, depending on the name.
    -   If the name has a `__PARAM` prefix it results in an `IRDataValue`
    -   If the name has a `__core` prefix it results in `IRFuncValue`, using the `IRStack` that was attached to the expression
    -   Else the name's `IRVariable` is used to find the associated `IRValue` in the `IRStack`
-   An `IRFuncExpr` results in an `IRFuncValue` being pushed onto the Reduction stack, using the `IRStack` that was attached to the expression
-   An `IRCallExpr` pops its lhs value, and then its arguments, from the Reduction stack
    -   If the lhs is an `IRAnyValue`, a call to each `IRFuncValue` is pushed onto the Compute stack (using only `IRAnyValue` args). If any of these `IRFuncValue`s returns an `IRErrorValue` then the resulting value pushed onto the Reduction stack is `(IRAnyValue | IRErrorValue)`, otherwise it is `IRAnyValue`.
    -   If the lhs is an `IRDataValue` or an `IRLiteralValue`, throw an error because that is unexpected.
    -   If the lhs or any of the args is an `IRErrorValue`, then push an `IRErrorValue` onto the Reduction stack.
    -   If the lhs is an `IRFuncValue`, actually call it (see below)
    -   If the lhs is an `IRMultiValue`, collect the result of calling each entry in the `IRMultiValue` separately

### Calling an `IRFuncValue`

If the function is an `IRNameExpr`, it must be a builtin function, in which an `IRValue` can be calculated immediately, and pushed onto the Reduction stack.

If the function is an `IRFuncExpr`, first each possible permutation is created from the args (some of the args might be `IRMultiValue`). Then for each permutation the `IRStack` attached to the original `IRFuncExpr` (and not the `IRStack` attached to the `IRCallExpr` that triggered this call) is extended and the body of the `IRFuncExpr` is pushed onto the Compute stack.

### Handling Recursion

The difficult part of this CEK machine is handling recursion because termination conditions will never be met. We also don't want to detect recursion prematurely because then some execution-paths might not be taken.

We can't use the `IRStack` to detect recursion because it acts like a list of scopes. Instead we keep track of all active `IRCallExpr`s and their arguments (`IRFuncExpr` can't be used because they can be called within eachother without recursion (eg. multiple boolean `&&` expressions)).
