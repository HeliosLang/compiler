# Grammar

PlutusLightProgram ::= ProgramType Statement [Statement [...]];

Statement ::= NamedStatement | ImplStatement;

NamedStatement ::= ConstStatement | StructStatement | FuncStatement | EnumStatement;

Comment ::= `//` /.\*/ EOL | `/*` /.\*/ `*/`;

StructStatement ::= `struct` DataDefinition;

DataDefintion ::= Word `{`
    [DataField [`,` DataField [`,` ...]]]
`}`;

DataField ::= NameTypePair;

EnumStatement ::= `enum` Identifier `{`
    EnumMember `,` EnumMember [`,` EnumMember [`,` EnumMember [...]]]
`}`;

EnumMember ::= DataDefinition;

ImplStatement ::= `impl` Identifier `{`
    ImplMember [ImplMember [...]]
`}`;

ImplMember ::= ConstStatement | FuncStatement;

ConstStatement ::= `const` Identifier [`:` TypeExpr] `=` OtherValueExpr `;`;

FuncStatement ::= `func` Identifier `(` [FuncArg [`,` FuncArg [...]]] `)` `->` TypeExpr `{` ValueExpr `}`;

FuncArg ::= NameTypePair;

NameTypePair ::= Word `:` TypeExpr;

TypeExpr ::= TypeRefExpr | TypePathExpr | ListTypeExpr | MapTypeExpr | OptionTypeExpr | FuncTypeExpr;

FuncTypeExpr ::= `(` [TypeExpr [`,` TypeExpr [...]]] `)` `->` TypeExpr;

TypeRefExpr ::= Identifier;

TypePathExpr ::= TypeRefExpr `::` Word;

ListTypeExpr ::= `[` `]` TypeExpr;

MapTypeExpr ::= `Map` `[` TypeExpr `]` TypeExpr;

OptionTypeExpr ::= `Option` `[` TypeExpr `]`;

ValueExpr ::= AssignExpr | PrintExpr | OtherValueExpr;

OtherValueExpr ::= LiteralExpr | ValueRefExpr | ValuePathExpr | UnaryExpr | BinaryExpr | ParensExpr | CallExpr | MemberExpr | IfElseExpr | SwitchExpr;

LiteralExpr ::= PrimitiveLiteralExpr | StructLiteralExpr | ListLiteralExpr | FuncLiteralExpr;

PrimitiveLiteralExpr ::= PrimitiveLiteral;

PrimitiveLiteral ::= IntLiteral | BoolLiteral | StringLiteral | ByteArrayLiteral;

StructLiteralExpr ::= (TypePathExpr | TypeRefExpr) `{`
    [StructLiteralField [`,` StructLiteralField [...]]
`}`;

StructLiteralField ::= Word `:` ValueExpr;

FuncLiteralExpr ::= `(`[FuncArg [`,` FuncArc [...]]]`)` `->` TypeExpr `{` ValueExpr `}`;

IntLiteral ::= /[0-9]+/ | /0b[0-1]+/ | /0o[0-7]+/ | /0x[0-9a-f]+/;

BoolLiteral ::= `true` | `false`;

StringLiteral ::= `"` StringLiteralChar* `"`;

StringLiteralChar ::= `\\` | `\n` | `\t` | `\"` | /[[^\]/;

ByteArrayLiteral ::= `#` /[0-9a-f]*/;

BinaryExpr ::= ValueExpr BinaryOp ValueExpr;

BinaryOp ::= `+` | `-` | `*` | `/` | `%` | `==` | `!=` | `<` | `>` | `<=` | `>=` | `||` | `&&`;

UnaryExpr ::= UnaryOp ValueExpr;

UnaryOp ::= `-` | `+` | `!`;

AssignExpr ::= Identifier [`:` TypeExpr] `=` ValueExpr `;` ValueExpr;

PrintExpr ::= `print` `(` ValueExpr `)` `;` ValueExpr;

IfElseExpr ::= `if` `(` ValueExpr `)` `{` ValueExpr `}` [`else` `if` `(` ValueExpr `)` `{` ValueExpr `}` [...]] `else` `{` ValueExpr `}`;

SwitchExpr ::= `switch` `(` ValueExpr `)` `{` 
  SwitchCase [SwitchCase [...]]  [SwitchDefault]
`}`;

SwitchCase ::= `case` (`(` Identifier `:` TypePathExpr `)` | TypePathExpr) `{` ValueExpr `}`;

SwitchDefault ::= `default` `{` ValueExpr `}`;

CallExpr ::= ValueExpr `(` [ValueExpr [`,` ValueExpr [...]]] `)`;

MemberExpr ::= ValueExpr `.` Word;

ParensExpr ::= `(` ValueExpr `)`;

ValuePathExpr ::= (TypeRefExpr | TypePathExpr) `::` Word;

ValueRefExpr ::= Identifier;

Identifier ::= Word;

Word ::= /[a-zA-Z_][0-9a-zA-Z_]*/;

# Preprocessor

Regexp search and replace of `$Word`.


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

# Operator precedence and associativity
0. `... = ... ; ...` and `print(...); ...`, right-to-left
1. `||`, left-to-right
2. `&&`, left-to-right
3. `==` and `!=`, left-to-right
4. `<`, `>`, `<=` and `>=`, left-to-right
5. binary `+` and `-`, left-to-right
6. `*`, `/` and `%`, left-to-right
7. unary `+`, `-`, `!`, right-to-left
8. `.`, `::`, `... (...)`, `... {...}` and `(...) -> ... {...}`, left-to-right
9. `(...)`