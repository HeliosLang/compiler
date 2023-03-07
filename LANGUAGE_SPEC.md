# Overview
Topics covered in this document:
 * Grammer of the Helios syntax
 * Token types generated during first stage of parsing
 * Operator precedence and associativity
 * Optimization steps when generating optimized IR
 * Complete list of builtin types and functions

# Grammar
```
Program ::= ScriptPurpose Statement (Statement)*

ScriptPurpose ::= ('testing' | 'minting' | 'spending' | 'staking' | 'module') Word

Statement ::= ImportStatement | ConstStatement | StructStatement | FuncStatement | EnumStatement

Comment ::= 'regexp://.*\n' | 'regexp:/\*(.*|\n)\*/'

ImportStatement ::= 'import' '{' ImportField (',' ImportField)* '}' 'from' ModuleName

ModuleName ::= Word

ImportField ::= Word ['as' Word]

StructStatement ::= 'struct' Word '{' DataDefinition [ImplDefinition] '}'

DataDefinition ::= DataField (DataField)*

DataField ::= Word ':' TypeExpr

NameTypePair ::= (Identifier [':' TypeExpr]) | '_'

EnumStatement ::= 'enum' Identifier '{' EnumMember (EnumMember)* [ImplDefinition] '}'

EnumMember ::= Word ['{' DataDefinition '}']

ImplDefinition ::= ImplMember (ImplMember)*

ImplMember ::= ConstStatement | FuncStatement

ConstStatement ::= 'const' Identifier [':' TypeExpr] '=' ValueExpr

FuncStatement ::= 'func' Identifier '(' [('self' | FuncArg) (',' FuncArg)*] ')' '->' RetTypeExpr '{' ValueExpr '}'

FuncArg ::= NameTypePair

TypeExpr ::= NonFuncTypeExpr | FuncTypeExpr

RetTypeExpr ::= TypeExpr | ( '(' TypeExpr ',' TypeExpr (',' TypeExpr)* ')' )

NonFuncTypeExpr ::= TypeRefExpr | TypePathExpr | ListTypeExpr | MapTypeExpr | OptionTypeExpr

FuncTypeExpr ::= '(' [TypeExpr (',' TypeExpr)*] ')' '->' RetTypeExpr

TypeRefExpr ::= Identifier

TypePathExpr ::= NonFuncTypeExpr '::' Word

ListTypeExpr ::= '[' ']' NonFuncTypeExpr

MapTypeExpr ::= 'Map' '[' NonFuncTypeExpr ']' NonFuncTypeExpr

OptionTypeExpr ::= 'Option' '[' NonFuncTypeExpr ']'

ValueExpr ::= AssignExpr | MultiAssignExpr | PrintExpr | LiteralExpr | ValueRefExpr | ValuePathExpr | UnaryExpr | BinaryExpr | ParensExpr | CallExpr | MemberExpr | IfElseExpr | SwitchExpr

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

AssignExpr ::= (Identifier [':' TypeExpr] '=' ValueExpr ';' ValueExpr

MultiAssignExpr ::= '(' NameTypePair ',' NameTypePair (',' NameTypePair)* ')' '=' ValueExpr ';' ValueExpr

PrintExpr ::= 'print' '(' ValueExpr ')' ';' ValueExpr

ErrorExpr ::= [ValueExpr ';'] 'error' '(' ValueExpr ')'

BranchExpr ::= ValueExpr | ErrorExpr

IfElseExpr ::= 'if' '(' ValueExpr ')' '{' BranchExpr '}' ('else' 'if' '(' ValueExpr ')' '{' BranchExpr '}')* 'else' '{' BranchExpr '}'

SwitchExpr ::= ValueExpr '.' 'switch' '{' SwitchCase (',' SwitchCase)* [SwitchDefault] '}'

SwitchCase ::= (Word | (Identifier ':' Word)) '=>' (BranchExpr | ('{' BranchExpr '}'))

SwitchDefault ::= 'else' '=>' (BranchExpr | ('{' BranchExpr '}'))

CallExpr ::= ValueExpr '(' [ValueExpr (',' ValueExpr)*] ')';

MemberExpr ::= ValueExpr '.' Word

ParensExpr ::= '(' [ValueExpr (',' ValueExpr)*] ')'

ValuePathExpr ::= NonFuncTypeExpr '::' Word

ValueRefExpr ::= Identifier

Identifier ::= Word

Word ::= 'regexp:[a-zA-Z_][0-9a-zA-Z_]*'
```

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
6. extraction of core cast functions

# Builtins

## Int
```
associated:  from_data, parse, from_little_endian, min, max
operators:   __eq, __neq, __neg, __pos, __add, __sub, __mul, __div, __mod, __geq, __gt, __leq, __lt
methods:     serialize, to_bool, to_hex, show, bound, bound_min, bound_max
internal ns: __helios__int
```

## Bool
```
associated:  and, or, from_data
operators:   __eq, __neq, __not, __and (desugars as 'and'), __or (desugars as 'or')
methods:     serialize, to_int, show
internal ns: __helios__bool
```

## String
```
associated:  from_data
operators:   __eq, __neq, __add
methods:     serialize, starts_with, ends_with, encode_utf8
internal ns: __helios__string
```

## ByteArray
```
associated:  from_data
operators:   __eq, __neq, __add, __lt, __leq, __gt, __geq
getters:     length
methods:     serialize, slice, starts_with, ends_with, sha2, sha3, blake2b, decode_utf8, show
internal ns: __helios__bytearray
```

## List
```
associated:  new, new_const, from_data
operators:   __eq, __neq, __add
getters:     length, head, tail
methods:     serialize, is_empty, get, prepend, any, all, find, find_safe, filter, fold, fold_lazy, map, sort, for_each
internal ns: __helios__list
```

## Map
```
associated:  from_data
operators:   __eq, __neq, __add
getters:     length, head_key, head_value, tail
methods:     serialize, is_empty, get, get_safe, set, delete, all, all_keys, all_values, any, any_key, any_value, 
             filter, filter_by_key, filter_by_value, fold, fold_keys, fold_values, 
             fold_lazy, fold_keys_lazy, fold_values_lazy, map_keys, map_values, prepend
             sort, sort_by_key, sort_by_value, find, find_key, find_key_safe, find_by_key, find_value, find_value_safe, find_by_value, for_each
internal ns: __helios__map
```

## Option
```
associated:  from_data
operators:   __eq, __neq
methods:     serialize, unwrap, map
internal ns: __helios__option
```

### Option::Some
```
operators:   __eq, __neq
getters:     some
methods:     serialize
hidden:      new, cast
internal ns: __helios__option__some
```

### Option::None
```
operators:   __eq, __neq
methods:     serialize
hidden:      new, cast
internal ns: __helios__option__none
```

## ScriptHash
```
associated:  from_data
operators:   __eq, __neq
methods:     serialize
internal ns: __helios__scripthash
```

## PubKeyHash, StakeKeyHash, DatumHash
```
associated:  new, from_data
operators:   __eq, __neq, __lt, __leq, __gt, __geq
methods:     serialize, show
internal ns: __helios__hash
```

## ValidatorHash, MintingPolicyHash, StakingValidatorHash
```
associated:  new, from_data, from_script_hash
operators:   __eq, __neq, __lt, __leq, __gt, __geq
methods:     serialize, show
macros:      CURRENT
internal ns: __helios__hash
```

## PubKey
```
associated:  new, from_data
operators:   __eq, __neq
methods:     serialize, show, verify
internal ns: __helios__pubkey
```

## ScriptContext
```
associated:  from_data
operators:   __eq, __neq
getters:     tx
methods:     serialize, get_spending_purpose_output_id, get_current_validator_hash,
             get_current_minting_policy_hash, get_current_input, get_staking_purpose, 
             get_script_purpose, get_cont_outputs
macros:      new_spending, new_minting, new_rewarding, new_certifying
internal ns: __helios__scriptcontext
```

## StakingPurpose
```
associated:  from_data
operators:   __eq, __neq
methods:     serialize
internal ns: __helios__stakingpurpose
```

### StakingPurpose::Rewarding
```
operators:   __eq, __neq
getters:     credential
methods:     serialize
internal ns: __helios__stakingpurpose__rewarding
```

### StakingPurpose::Certifying
```
operator:    __eq, __neq
getters:     dcert,
methods:     serialize,
internal ns: __helios__stakingpurpose__certifying
```

## ScriptPurpose
```
associated:  from_data, new_minting, new_spending, new_rewarding, new_certifying
operators:   __eq, __neq
methods:     serialize
internal ns: __helios__scriptpurpose
```

### ScriptPurpose::Minting
```
operators:   __eq, __neq
getters:     policy_hash
methods:     serialize
internal ns: __helios__scriptpurpose__minting
```

### ScriptPurpose::Spending
```
operators:   __eq, __neq
getters:     output_id
methods:     serialize
internal ns: __helios__scriptpurpose__spending
```

### ScriptPurpose::Rewarding
```
operators:   __eq, __neq
getters:     credential
methods:     serialize
internal ns: __helios__scriptpurpose__rewarding
```

### ScriptPurpose::Certifying
```
operator:    __eq, __neq
getters:     dcert,
methods:     serialize,
internal ns: __helios__scriptpurpose__certifying
```

## DCert
```
associated:  from_data
operators:   __eq, __neq
methods:     serialize
macros:      new_register, new_deregister, new_delegate, new_register_pool, new_retire_pool
internal ns:  __helios__dcert
```

### DCert::Register
```
operators:   __eq, __neq
getters:     credential
methods:     serialize
internal ns: __helios__dcert__register
```

### DCert::Deregister
```
operators:   __eq, __neq
getters:     credential
methods:     serialize
internal ns: __helios__dcert__deregister
```

### DCert::Delegate
```
operators:   __eq, __neq
getters:     delegator, pool_id
methods:     serialize
internal ns: __helios__dcert__delegate
```

### DCert::RegisterPool
```
operators:   __eq, __neq
getters:     pool_id, pool_vrf
methods:     serialize
internal ns: __helios__dcert__registerpool
```

### DCert::RetirePool
```
operators:   __eq, __neq
getters:     pool_id, epoch
methods:     serialize
internal ns: __helios__dcert__retirepool
```

## Tx
```
associated:  from_data
operators:   __eq, __neq
getters:     inputs, ref_inputs, outputs, fee, minted, dcerts, withdrawals, time_range, 
             signatories, id
methods:     serialize, find_datum_hash, 
             outputs_sent_to, outputs_sent_to_datum, 
             outputs_locked_by, outputs_locked_by_datum,
             value_sent_to, value_sent_to_dataum,
             value_locked_by, value_locked_by_datum, is_signed_by
macros:      new
hidden:      datums
internal ns: __helios__tx
```
    
## TxId
```
associated:  new, from_data
operators:   __eq, __neq, __lt, __leq, __gt, __geq
methods:     serialize, show
macros:      CURRENT
internal ns: __helios__txid
```
       
## TxInput
```
associated:  from_data
operators:   __eq, __neq
getters:     output_id, output
methods:     serialize
macros:      new
internal ns: __helios__txinput
```

## TxOutput
```
associated:  from_data
operators:   __eq, __neq
getters:     address, value, datum, ref_script_hash
methods:     serialize
macros:      new
hidden:      get_datum_hash
internal ns: __helios__txoutput
```

## OutputDatum
```
associated:  from_data
operators:   __eq, __neq
macros:      new_none, new_hash, new_inline
methods:     inline_data, serialize
internal ns: __helios__outputdatum
```

### OutputDatum::None
```
operators:   __eq, __neq
methods:     serialize
internal ns: __helios__outputdatum__none
```

### OutputDatum::Hash
```
operators:   __eq, __neq
getters:     hash
methods:     serialize
internal ns: __helios__outputdatum__hash
```

### OutputDatum::Inline
```
operators:   __eq, __neq
getters:     data
methods:     serialize
internal ns: __helios__outputdatum__inline
```

## Data
```
associated:  from_data
operators:   __eq, __neq
getters:     tag
methods:     serialize
internal ns: __helios__data
```

## TxOutputId
```
associated:  new, from_data
operators:   __eq, __neq, __lt, __leq, __gt, __geq
methods:     serialize
internal ns: __helios__txoutputid
```

## Address
```
associated:  new, new_empty, from_data
operators:   __eq, __neq
getters:     credential, staking_credential
methods:     serialize
hidden:      is_staked
internal ns: __helios__address
```

## Credential
```
associated:  new_pubkey, new_validator, from_data
operators:   __eq, __neq
methods:     serialize
hidden:      is_pubkey, is_validator
internal ns: __helios__credential
```

### Credential::PubKey
```
associated:  from_data
operators:   __eq, __neq
getters:     hash
methods:     serialize
hidden:      cast
internal ns: __helios__credential__pubkey
```

### Credential::Validator
```
associated: from_data
operators:  __eq, __neq
getters:    hash
methods:    serialize
hidden:     cast
internal ns: __helios__credential__validator
```

## StakingHash
```
associated:  new_stakekey, new_validator, from_data
operators:   __eq, __neq
methods:     serialize
hidden:      is_stakekey, is_validator
internal ns: __helios__stakinghash
```

### StakingHash::StakeKey
```
associated:  from_data
operators:   __eq, __neq
getters:     hash
methods:     serialize
hidden:      cast
internal ns: __helios__stakinghash__stakekey
```

### StakingHash::Validator
```
associated: from_data
operators:  __eq, __neq
getters:    hash
methods:    serialize
hidden:     cast
internal ns: __helios__stakinghash__validator
```

## StakingCredential
```
associated: new_hash, new_ptr, from_data
operators:  __eq, __neq
methods:    serialize
internal ns: __helios__stakingcredential
```

### StakingCredential::Hash
```
operators:  __eq, __neq
methods:    serialize
internal ns: __helios__stakingcredential__hash
```

### StakingCredential::Ptr
```
operators:  __eq, __neq
methods:    serialize
internal ns: __helios__stakingcredential__ptr
```

## Time
```
associated: new, from_data
operators:  __eq, __neq, __add, __sub, __sub_alt, __geq, __gt, __leq, __lt
methods:     serialize, show
internal ns: __helios__time
```

## Duration
```
associated: new, from_data
operators:  __eq, __neq, __add, __sub, __mul, __div, __div_alt, __mod, __geq, __gt, __leq, __lt
methods:    serialize
internal ns: __helios__duration
```

## TimeRange
```
associated: new, to, from, ALWAYS, NEVER, from_data
operators:  __eq, __neq
getters:    start, end
methods:    serialize, contains, is_before, is_after
internal ns: __helios__timerange
```

## AssetClass
```
associated: ADA, new, from_data
operators:  __eq, __neq
methods:    serialize
internal ns: __helios__assetclass
```

## Value
```
associated:  ZERO, lovelace, new, from_data, from_map
operators:   __eq, __neq, __add, __sub, __geq, __gt, __leq, __lt
methods:     serialize, is_zero, get, get_safe, contains, get_policy, contains_policy, to_map, get_lovelace, get_assets
hidden:      get_map_keys, merge_map_keys, get_inner_map, get_inner_map_int, add_or_subtract_inner, add_or_subtract, compare_inner, compare
internal ns: __helios__value
```

## Common (hidden from user)
```
associated:  verbose_error, assert_constr_index, not, identity, serialize, is_in_bytearray_list
             unBoolData, boolData, unStringData, stringData
operators:   __eq, __neq
methods:     __identity
internal ns: __helios__common
```
