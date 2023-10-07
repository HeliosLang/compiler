# IR

Helios compiles a set of scripts into an Internal Representation. This IR is a simplified version of Helios, and only uses a few expression terms:
  * IRNameExpr
  * IRCallExpr
  * IRFuncExpr
  * IRLiteralExpr
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

Literals like strings, bytearrays and integers. The IR literal syntax is identical to the Helios literal syntax.

## IRErrorExpr

```
error()
```