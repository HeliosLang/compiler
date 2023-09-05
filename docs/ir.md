# IR

Helios compiles a set of scripts in an Internal Representation. This IR is a simplified version of the Helios, and only uses a few terms:
  * IRNameExpr
  * IRCallExpr
  * IRFuncExpr
  * IRLiteralExpr
  * IRConstExpr
  * IRErrorCallExpr

## IRNameExpr

```
<word>
```

## IRCallExpr

```
<expr>(<arg-expr>, ...)
```

## IRFuncExpr

```
(<arg-name>, ...) -> {
    <expr>
}
```

## IRLiteralExpr

Syntax is identical to Helios.

## IRConstExpr

Used by `const` statements so parts that should be evaluated into literal expressions can easily be identified.