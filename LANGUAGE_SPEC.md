# Grammar

PlutusLightProgram ::= Statement [Statement [...]];

Statement ::= StructStatement | EnumStatement | ImplStatement | ConstStatement | FuncStatement;

Comment ::= `//` /.\*/ EOL | `/*` /.\*/ `*/`;

StructStatement ::= `struct` Identifier `{`
    [StructField [`,` StructField [`,` ...]]]
`}`; 

StructField ::= Word `:` TypeExpr;

EnumStatement ::= `enum` Identifier `{`
    EnumMember `,` EnumMember [`,` EnumMember [`,` EnumMember [...]]]
`}`;

EnumMember ::= Identifier `{`
    [StructField [`,` StructField [`,` ...]]]
`}`;

ImplStatement ::= `impl` Identifier `{`
    ImplMember [ImplMember [...]]
`}`;

ImplMember ::= ConstStatement | FuncStatement;

ConstStatement ::= `const` Identifier [`:` TypeExpr] `=` ValueExpr `;`;

FuncStatement ::= `func` Identifier `(` [FuncArg [`,` FuncArg [...]]] `)` `->` TypeExpr `{` ValueExpr `}`;

FuncArg ::= Identifier `:` TypeExpr;

TypeExpr ::= TypeRefExpr | PathTypeExpr | ListTypeExpr | MapTypeExpr | OptionTypeExpr;

TypeRefExpr ::= Identifier;

PathTypeExpr ::= TypeRefExpr `::` Word;

ListTypeExpr ::= `[` `]` TypeExpr;

MapTypeExpr ::= `Map` `[` TypeExpr `]` TypeExpr;

OptionTypeExpr ::= `Option` `[` TypeExpr `]`;

ValueExpr ::= Literal | BinaryExpr | UnaryExpr | AssignmentExpr | BranchingExpr | SwitchExpr | CallExpr | MemberExpr | ParensExpr | PathValueExpr | ValueRefExpr;

Literal ::= StructLiteral | IntLiteral | BoolLiteral | StringLiteral | ByteArrayLiteral;

StructLiteral ::= (PathTypeExpr | TypeRefExpr) `{`
    [StructLiteralField [`,` StructLiteralField [...]]
`}`;

StructLiteralField ::= Word `:` ValueExpr;

FuncLiteral ::= `(`[FuncArg [`,` FuncArc [...]]]`)` `->` TypeExpr `{` ValueExpr `}`;

IntLiteral ::= /[0-9]+/ | /0b[0-1]+/ | /0o[0-7]+/ | /0x[0-9a-f]+/;

BoolLiteral ::= `true` | `false`;

StringLiteral ::= `"` StringLiteralChar* `"`;

StringLiteralChar ::= `\\` | `\n` | `\t` | `\"` | /[[^\]/;

ByteArrayLiteral ::= `#` /[0-9a-f]*/;

BinaryExpr ::= ValueExpr BinaryOp ValueExpr;

BinaryOp ::= `+` | `-` | `*` | `/` | `%` | `==` | `!=` | `<` | `>` | `<=` | `>=` | `||` | `&&`;

UnaryExpr ::= UnaryOp ValueExpr;

UnaryOp ::= `-` | `+` | `!`;

AssignmentExpr ::= Identifier [`:` TypeExpr] `=` ValueExpr `;` ValueExpr;

BranchingExpr ::= `if` `(` ValueExpr `)` `{` ValueExpr `}` [`else` `if` `(` ValueExpr `)` `{` ValueExpr `}` [...]] `else` `{` ValueExpr `}`;

SwitchExpr ::= `switch` `(` ValueExpr `)` `{` 
  `case` (`(` Identifier `:` PathTypeExpr `)` | PathTypeExpr) `{` ValueExpr `}`
  [`case` ...]
  [`default` `{` ValueExpr `}`]
`}`;

CallExpr ::= ValueExpr `(` [ValueExpr [`,` ValueExpr [...]]] `)`;

MemberExpr ::= ValueExpr `.` Word;

ParensExpr ::= `(` ValueExpr `)`;

PathValueExpr ::= (Identifier | PathValueExpr) `::` Word;

ValueRefExpr ::= Identifier;

Identifier ::= Word;

Word ::= /[a-zA-Z_][0-9a-zA-Z_]*/;


# Tokenization
The tokenizer generates a list of the following terms:
* Word
* Symbol
* Group `(...)` `{...}` `[...]` with fields separated by commas
* IntLiteral
* BoolLiteral
* StringLiteral
* ByteArrayLiteral

Comments are removed immediately.

# Operator precedence rules
0. ternary assignment expressions `...=...;...`, right-to-left
1. `||`, left-to-right
2. `&&`, left-to-right
3. `==` and `!=`, left-to-right
4. `<`, `>`, `<=` and `>=`, left-to-right
5. binary `+` and `-`, left-to-right
6. `*`, `/` and `%`, left-to-right
7. unary `+`, `-`, `!`, right-to-left
8. `(...)`, `.`, `::`, `...(...)`, `...{...}` and `(...) -> ... {...}`, left-to-right