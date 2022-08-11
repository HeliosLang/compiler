# Grammar
Program ::= ProgramType Statement (Statement)*

ProgramType ::= ('test' | 'minting_policy' | 'validator') Word

Statement ::= ConstStatement | StructStatement | FuncStatement | EnumStatement

Comment ::= 'regexp://.*\n' | 'regexp:/\*(.*|\n)\*/'

StructStatement ::= 'struct' Word '{' DataDefinition [ImplDefinition] '}'

DataDefinition ::= DataField (DataField)*

DataField ::= NameTypePair

NameTypePair ::= Word ':' TypeExpr

EnumStatement ::= 'enum' Identifier '{' EnumMember (EnumMember)* [ImplDefinition] '}'

EnumMember ::= Word ['{' DataDefinition '}']

ImplDefinition ::= ImplMember (ImplMember)*

ImplMember ::= ConstStatement | FuncStatement

ConstStatement ::= 'const' Identifier [':' TypeExpr] '=' ValueExpr

FuncStatement ::= 'func' Identifier '(' [FuncArg (',' FuncArg)*] ')' '->' TypeExpr '{' ValueExpr '}'

FuncArg ::= NameTypePair

TypeExpr ::= NonFuncTypeExpr | FuncTypeExpr

NonFuncTypeExpr ::= TypeRefExpr | TypePathExpr | ListTypeExpr | MapTypeExpr | OptionTypeExpr

FuncTypeExpr ::= '(' [TypeExpr (',' TypeExpr)*] ')' '->' TypeExpr

TypeRefExpr ::= Identifier

TypePathExpr ::= NonFuncTypeExpr '::' Word

ListTypeExpr ::= '[' ']' NonFuncTypeExpr

MapTypeExpr ::= 'Map' '[' NonFuncTypeExpr ']' NonFuncTypeExpr

OptionTypeExpr ::= 'Option' '[' NonFuncTypeExpr ']'

ValueExpr ::= AssignExpr | PrintExpr | LiteralExpr | ValueRefExpr | ValuePathExpr | UnaryExpr | BinaryExpr | ParensExpr | CallExpr | MemberExpr | IfElseExpr | SwitchExpr

LiteralExpr ::= PrimitiveLiteralExpr | StructLiteralExpr | ListLiteralExpr | MapLiteralExpr | FuncLiteralExpr

PrimitiveLiteralExpr ::= PrimitiveLiteral

PrimitiveLiteral ::= IntLiteral | BoolLiteral | StringLiteral | ByteArrayLiteral

StructLiteralExpr ::= (TypePathExpr | TypeRefExpr) ['{' StructLiteralField (',' StructLiteralField)* '}']

StructLiteralField ::= [Word ':'] ValueExpr

ListLiteralExpr ::= '[]' TypeExpr '{' [ValueExpr] (',' ValueExpr)* '}'

MapLiteralExpr ::= 'Map' '[' TypeExpr ']' TypeExpr '{' [ValueExpr ':' ValueExpr] (',' ValueExpr ':' ValueExpr)* '}'

FuncLiteralExpr ::= '(' [FuncArg (',' FuncArc)*] ')' '->' TypeExpr '{' ValueExpr '}'

IntLiteral ::= 'regexp:[0-9]+' | 'regexp:0b[0-1]+' | 'regexp:0o[0-7]+' | 'regexp:0x[0-9a-f]+'

BoolLiteral ::= 'true' | 'false'

StringLiteral ::= '"' StringLiteralChar* '"';

StringLiteralChar ::= '\\' | '\n' | '\t' | '\"' | 'regexp:[^\]'

ByteArrayLiteral ::= '#' 'regexp:[0-9a-f]*'

BinaryExpr ::= ValueExpr BinaryOp ValueExpr

BinaryOp ::= '+' | '-' | '*' | '/' | '%' | '==' | '!=' | '<' | '>' | '<=' | '>=' | '||' | '&&'

UnaryExpr ::= UnaryOp ValueExpr

UnaryOp ::= '-' | '+' | '!'

AssignExpr ::= Identifier [':' TypeExpr] '=' ValueExpr ';' ValueExpr

PrintExpr ::= 'print' '(' ValueExpr ')' ';' ValueExpr

IfElseExpr ::= 'if' '(' ValueExpr ')' '{' ValueExpr '}' ('else' 'if' '(' ValueExpr ')' '{' ValueExpr '}')* 'else' '{' ValueExpr '}'

SwitchExpr ::= ValueExpr '.' 'switch' '{' SwitchCase (',' SwitchCase)* [SwitchDefault] '}'

SwitchCase ::= (Word | (Identifier ':' Word)) '=>' (ValueExpr | ('{' ValueExpr '}'))

SwitchDefault ::= 'else' '=>' (ValueExpr | ('{' ValueExpr '}'))

CallExpr ::= ValueExpr '(' [ValueExpr (',' ValueExpr)*] ')';

MemberExpr ::= ValueExpr '.' Word

ParensExpr ::= '(' ValueExpr ')'

ValuePathExpr ::= NonFuncTypeExpr '::' Word

ValueRefExpr ::= Identifier

Identifier ::= Word

Word ::= 'regexp:[a-zA-Z_][0-9a-zA-Z_]*'


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
8. `.`, `::`, `... (...)`, `... {...}`, `(...) -> ... {...}`, `if (...) {...} else ...` and `... . switch {...}`, left-to-right
9. `(...)`

# Optimization of generated code (IR level)
1. as much reuse as possible in the manually written IR code
2. const evaluation (with special handling of partial consts in eg. the ifThenElse condition, multiplying by zero etc.)
3. elimination of function calls with a single argument itself starting with the inverse call
4. inlining of single use variables
5. unused variable and dead-code elimination