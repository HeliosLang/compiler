//@ts-check

import {
  ConstrData,
  IntData,
  Program,
  PubKeyHash,
  RuntimeError,
  Site,
  UplcBool,
  UplcDataValue,
  UplcProgram,
  UplcValue,
  UserError,
  assert,
  assertClass,
  assertDefined,
	config,
  bytesToText,
  extractScriptPurposeAndName,
} from "helios"

config.set({CHECK_CASTS: true});

function asBool(value) {
  if (value instanceof UplcBool) {
      return value.bool;
  } else if (value instanceof ConstrData) {
      if (value.fields.length == 0) {
          if (value.index == 0) {
              return false;
          } else if (value.index == 1) {
              return true;
          } else {
              throw new Error(`unexpected ConstrData index ${value.index} (expected 0 or 1 for Bool)`);
          }
      } else {
          throw new Error(`expected ConstrData with 0 fields (Bool)`);
      }
  } else if (value instanceof UplcDataValue) {
      return asBool(value.data);
  }

  throw new Error(`expected UplcBool, got ${value.toString()}`);
}

/**
 * Throws an error if 'err' isn't en Error
 * @param {any} err 
 * @param {string} info 
 * @returns {boolean}
 */
function isError(err, info, simplified = false) {
  if (err instanceof RuntimeError || err instanceof UserError) {
    if (simplified || err.message == "") {
      return true;
    } else {
      return err.message.includes(info);
    }
  } else {
      throw new Error(`expected UserError with "${info}", got ${err.toString()}`);
  }
}

async function testTrue(src, simplify = false) {
  // also test the transfer() function
  const program = Program.new(src);

  let uplcProgram = program.compile(simplify).transfer(UplcProgram);

  try {
    let result = await uplcProgram.run([]);

    const [_, name] = extractScriptPurposeAndName(src) ?? ["", ""];

    assert(asBool(result), `test ${name} failed`);

    console.log(`test ${name} succeeded${simplify ? " (simplified)" : ""}`);

    if (!simplify) {
        await testTrue(src, true);
    }
  } catch (e) {
    console.log(program.prettyIR(simplify));
    console.log(program.annotateIR(simplify));

    throw e;
  }
}

async function testError(src, expectedError, simplify = false) {
  const [_, name] = extractScriptPurposeAndName(src) ?? ["", ""];

  // also test the transfer() function
	try {
        let program = Program.new(src).compile(simplify).transfer(UplcProgram);

        let result = await program.run([]);

		if (result instanceof Error) {
			throw result;
		} else {
			throw new Error(`test ${name} failed (${result.toString()})`);
		}
	} catch (e) {
        assert(isError(e, expectedError, simplify), `test ${name} failed (${e.toString()})`);
	}

  console.log(`test ${name} succeeded${simplify ? " (simplified)" : ""}`);

  if (!simplify) {
      await testError(src, expectedError, true);
  }
}

async function test0() {
  console.log("TEST 0");

    const src = `testing bool_from_data

    func unused2() -> Bool {
      true
    }
    
    func unused() -> Bool {
      unused2()
    }

    func deserialize[A](a: Data) -> A {
      A::from_data(a)
    }

    func main(d: Data) -> Bool {
      deserialize[Bool](d).trace("hello")
    }`;

    const program = Program.new(src);

    console.log(program.prettyIR(true));
}

async function test1() {
  console.log("TEST 1");

    const src = `spending always_true
    func bytearrayToAddress(bytes: ByteArray) -> Address {   // bytes = #... must be 28 bytes long
        cred: Credential = Credential::new_pubkey(PubKeyHash::new(bytes));
        Address::new(cred, Option[StakingCredential]::None)
    } 

    func main(_, _, _) -> Bool {
        shareholder_pkhs = []ByteArray{#01234567890123456789012345678901234567890123456789012345}; 
        shareholder_shares = []Int{100};
        shareholder_indexes = []Int::new(shareholder_shares.length, (i: Int) -> Int {i}); // [1..shareholder_indexes.length]
        init = Map[Address]Int{};

        shareholders: Map[Address]Int = shareholder_indexes.fold(
          (acc: Map[Address]Int, idx: Int) -> Map[Address]Int {
            acc + Map[Address]Int{
              bytearrayToAddress(shareholder_pkhs.get(idx-1)): shareholder_shares.get(idx-1)
            }
          },
          init
        );
        shareholders.length == 1
    }`;

    const program = Program.new(src);

    
}

async function test2() {
  console.log("TEST 2");
  
    const src = `spending testing

    struct Datum {
      disbursements : Map[PubKeyHash]Int
      amount : Int
      tradeOwner: PubKeyHash

      func tradeOwnerSigned(self, tx: Tx) -> Bool {
        tx.is_signed_by(self.tradeOwner)
      }

      func unusedMember() -> Int {
        1
      }

      const BLA: String = "123"

      func unused2() -> Int {
        Datum::unusedMember()
      }
    }
    
    func main(datum: Datum, _, ctx: ScriptContext) -> Bool {
      tx: Tx = ctx.tx;
      datum.tradeOwnerSigned(tx)
    }
    
    const OWNER_BYTES: ByteArray = #
    const PRICE_LOVELACE: Int = 0
    const DISBURSEMENTS: Map[PubKeyHash]Int = Map[PubKeyHash]Int{}
    
    const DATUM: Datum = Datum{
      disbursements : DISBURSEMENTS,
      amount : PRICE_LOVELACE,
      tradeOwner : PubKeyHash::new(OWNER_BYTES)
    }`;

    let program = Program.new(src);

    console.log(program.prettyIR(false));
    
    program.parameters = {
      DISBURSEMENTS: [
		  [new PubKeyHash("01020304050607080910111213141516171819202122232425262728"), 100]
	  ]
    };

    console.log(program.evalParam("DISBURSEMENTS").toString());
    console.log(program.evalParam("DATUM").toString());
}

async function test3() {
  console.log("TEST 3");

  const src = `
  testing bool_struct

  const MY_TEXT: String

  struct MyStruct {
    b: Bool
    s: String
  }

  func main() -> Bool {
    s = MyStruct{b: true, s: MY_TEXT};
    s.b
  } 
  `

  // also test the transfer() function
  const program = Program.new(src);
  program.parameters.MY_TEXT = "asdasd";

  const uplcProgram = program.compile().transfer(UplcProgram);

  console.log((await uplcProgram.run([])).toString());
}

async function test4() {
  console.log("TEST 4");

  const src = `
  testing hello_error

  func main() -> Bool {
    if (1 > 2) {
      a = "123";
      error("not true" + a)
    } else {
      true
    }
  }
  `;

  let program = Program.new(src);

  console.log(program.prettyIR());

  // also test the transfer function
  let uplcProgram = program.compile().transfer(UplcProgram);

  console.log((await uplcProgram.runWithPrint([])).toString());
}

async function test5() {
  console.log("TEST 5");

  const src = `
  testing redeemer

  enum Redeemer{
    Bid
  }
  
  const r: Redeemer = Redeemer::Bid

  func main() -> Bool {
    print(r.serialize().show());
    true
  }`;

  let program = Program.new(src);

  // also test the transfer function
  let uplcProgram = program.compile().transfer(UplcProgram);
  console.log((await uplcProgram.runWithPrint([])).toString());
  console.log(program.evalParam("r").toString());
}

async function test6() {
  console.log("TEST 6");

  const src = `testing app

  enum Redeemer {
     Bid
  }
  
  const r: Redeemer = Redeemer::Bid
  
  func main() -> Bool {
     redeemer_serialized: ByteArray = r.serialize();
     print(redeemer_serialized.show());
     print("Test");
     true
  }`;

  const program = Program.new(src);

  console.log(program.paramTypes);

  console.log(await program.compile().runWithPrint([]));
}

async function test7() {
  console.log("TEST 7");

  const src = `testing app

  struct Datum {
    deadline: Int
  }
  
  const d: Datum = Datum{5}
  
  func main() -> Bool {
     print(d.serialize().show());
     print(d.deadline.show());
     print("Test");
     true
  }`;

  const program = Program.new(src);

  console.log(program.paramTypes);

  console.log(await program.compile().runWithPrint([]));
}

async function test8() {
  console.log("TEST 8");

  const src = `testing data_switch
  
  enum MyEnum {
    One
    Two
    Three
  }

  func main(d: Data) -> String {
    d.switch{
      Int => "int",
      m: MyEnum => {
        m.switch {
          One => "One",
          Two => "Two",
          Three => "Three"
        }
      },
      ByteArray => "bytearray",
      _ => "other"
    }
  }

  const DATA: MyEnum::Three = MyEnum::Three
  `;

  const program = Program.new(src);

  const data = program.evalParam("DATA");

  console.log(program.prettyIR(true));

  let res = await program.compile(true).run([data]);

  console.log(bytesToText(assertDefined(assertClass(res, UplcValue).data.bytes)));
}

async function test9() {
  console.log("TEST 9");

  const src = `
  testing staking_credential

  func main(sc: StakingCredential) -> StakingValidatorHash {
    sc.switch{h: Hash => h.hash.switch{v: Validator => v.hash, _ => error("no StakingValidatorHash")}, _ => error("not StakingHash")}
  }
  `;

  Program.new(src);
}

async function test10() {
  console.log("TEST 10");

	const src = `spending always_true
	func main(_, _, ctx: ScriptContext) -> Bool {
		ctx.get_script_purpose().serialize().length > 0
			&& ctx.tx.redeemers.length == 1
	}`;

	Program.new(src).compile();
}

async function test11() {
  console.log("TEST 11");

  const src = `testing swap
  func swap(a: Int, b: Int, _) -> (Int, Int) {
    (c: Int, d: Int) = (b, a); (c, d)
  }

  func main(a: Int, b: Int) -> Int {
    (c: Int, _) = swap(swap(a, b, b), b); c
  }`;

  const program = Program.new(src);

  console.log(program.prettyIR(false));
  console.log(program.prettyIR(true));

  const uplcProgram = program.compile();

  const arg0 = new UplcDataValue(Site.dummy(), (new IntData(2n)));
  const arg1 = new UplcDataValue(Site.dummy(), (new IntData(1n)));

  let res = await uplcProgram.run([arg0, arg1]);

  console.log(res.toString())
}

async function test12() {
  console.log("TEST 12");

  const src = `testing data_switch
  
  func main(d: Data) -> String {
    d.switch{
      Int => "int",
      (i: Int, dl: []Data) => i.show() + ", " + dl.length.show(),
      ByteArray => "bytearray",
      _ => "other"
    }
  }

  enum MyEnum {
    One
    Two
    Three{x: Int}
  }

  const DATA: MyEnum::Three = MyEnum::Three{10}
  `;

  const program = Program.new(src);

  const data = program.evalParam("DATA");

  console.log(program.prettyIR(true));

  let res = await program.compile(true).run([data]);

  console.log(bytesToText(assertDefined(assertClass(res, UplcValue).data).bytes));
}

async function test13() {
  console.log("TEST 13");

  const src = `testing void_func
  func nestedAssert(cond: Bool, msg: String) -> () {
    assert(cond, msg)
  }

  func customAssert(cond: Bool, msg: String) -> () {
    if (!cond) {
      error(msg)
    }
  }

  func main() -> Bool {
    nestedAssert(false, "assert failed");
    customAssert(false, "assert failed");
    false
  }`;

  let program = Program.new(src);

  console.log(program.prettyIR(false));

  let [res, messages] = await program.compile(false).runWithPrint([]);

  messages.forEach(m => console.log(m));

  console.log(res.toString());
}

async function test15() {
  console.log("TEST 15");

  const src = `
  spending inferred_ret_type

  func main(_, _, ctx: ScriptContext) -> Bool {
    ctx.tx.outputs.fold((prev: Int, output: TxOutput) -> {
      prev + output.value.get(AssetClass::new(MintingPolicyHash::new(#), #))
    }, 0) > 0
  }
  `;

  Program.new(src);
}

async function test16() {
  console.log("TEST 16");

  const src = `
  spending parametric

  func main(OWNER: PubKeyHash, BOOL: Bool, _, _, ctx: ScriptContext) -> Bool {
    ctx.tx.is_signed_by(OWNER) && BOOL
  }`;

  const program = Program.new(src, [], {}, {
    allowPosParams: true,
    invertEntryPoint: false
  });

  program.compile(true);
}

async function test17() {
  console.log("TEST 17");

  const mintingSrc = `
  minting redeemer_only

  struct Redeemer {
    value: Int
  }

  func main(redeemer: Redeemer, _) -> Bool {
    redeemer.value == 42
  }
  `;

  Program.new(mintingSrc);

  const spendingSrc = `
  spending redeemer_only

  struct Redeemer {
    value: Int
  }

  func main(_, redeemer: Redeemer, _) -> Bool {
    redeemer.value == 42
  }
  `;

  Program.new(spendingSrc);
}

// recursive type test
async function test18() {
  console.log("TEST 18");

  const src = `
  testing merkle_trees

  enum MerkleTree[A] {
    // represents no value (null object pattern)
    MerkleEmpty
  
    MerkleLeaf { hash: A }
  
    MerkleNode {
      hash: A
      left: MerkleTree[A]
      right: MerkleTree[A]
    }
  }
  
  func main() -> Bool {
      a = MerkleTree[ByteArray]::MerkleEmpty;
      b = MerkleTree[ByteArray]::MerkleLeaf{#abcd};
      c = MerkleTree[ByteArray]::MerkleNode{hash: #1234, left: a, right: b};
      (c.left == a).trace("left equal to a: ")
  }`;

  for (const simplify of [true, false]) {
    console.log("simplified:", simplify);

    const program = Program.new(src);

    const uplcProgram = program.compile(simplify);

    try {
      const [result, messages] = await uplcProgram.runWithPrint([]);

      console.log(result.toString(), messages);
    } catch (e) {
      console.log(program.prettyIR(simplify));
      console.log(program.annotateIR(simplify));

      throw e;
    }
  }
}

async function test19() {
  console.log("TEST 19");

  const src = `
  testing named_struct_fields

  struct Pair {
    a: Int
    b: ByteArray
  }

  func main() -> Bool {
    p0 = Pair{1, #2};
    p1 = Pair{b: #2, a: 1};

    p0.a == p1.a && p0.b == p1.b
  }
  `

  for (const simplify of [true, false]) {
    const program = Program.new(src);

	const uplcProgram = program.compile(simplify);

    const result = await uplcProgram.run([]);

    console.log(result.toString());
  }
}

async function test20() {
  console.log("TEST 20");

  // no newlines
  const src = `testing no_newlines func main()->Bool{true}//`

  Program.new(src).compile(true)
}

async function test21() {
  console.log("TEST 21");

  const src = `testing bad_constructor
  
  struct MyStruct {
    a: Int
    b: Int
    c: Int
  }
  
  func main() -> Bool {
    my_struct: MyStruct = {a: 1, b: 2, c: 3};

    my_struct.a == my_struct.b
  }
  `

  try {
    Program.new(src)
  } catch (e) {
    assert(e.message.includes("expected struct type before braces"))
  }
}

async function test22() {
  console.log("TEST 22");

  const src = `testing destruct_pair

  struct Pair {
    first: Int
    second: Int
  }
  
  func main() -> Bool {
    p = Pair{1, 2};
    Pair{a, _} = p;
    a == 1
  }
  `

  console.log(Program.new(src).prettyIR(false))
}

async function test23() {
  await testTrue(`testing destruct_pair

  struct Pair {
      a: Int
      b: Int
  }

  func main() -> Bool {
      p = Pair{1, 1};

      Pair{a, b} = p;

      a == b
  }`);

  await testTrue(`testing destruct_pair_ignore_1
  
  struct Pair {
      a: Int
      b: Int
  }
  
  func main() -> Bool {
      p = Pair{1, 2};

      Pair{a, _} = p;

      a == 1
  }`);

  await testTrue(`testing destruct_pair_optional_typed
  
  struct Pair {
      a: Int
      b: Int
  }
  
  func main() -> Bool {
      p = Pair{1, 2};

      Pair{a: Int, _} = p;

      a == 1
  }`);

  await testError(`testing destruct_pair_optional_wrong_typed
  
  struct Pair {
      a: Int
      b: Int
  }
  
  func main() -> Bool {
      p = Pair{1, 2};

      Pair{a: Bool, _} = p;

      a
  }`, "expected Bool for destructure field 1, got Int");

  await testTrue(`testing destruct_nested
  
  struct Pair {
      a: Int
      b: Int
  }

  struct PP {
      a: Pair
      b: Pair
  }
  
  func main() -> Bool {
      pp = PP{Pair{1, 2}, Pair{1, 2}};

      PP{p0: Pair{_, b}, p1: Pair{_, c}} = pp;

      b == c && p0 == p1
  }
  `);

  await testTrue(`testing destruct_option_assigment
  
  func main() -> Bool {
    o = Option[Int]::Some{10};

    Option[Int]::Some{a} = o;

    a == 10
  }`);

  await testTrue(`testing destruct_enum
  
  struct Price {
      p: Int
  }

  enum Action {
      Sell
      Buy{p: Price}
  }
  
  func main() -> Bool {
      e: Action = Action::Buy{Price{10}};

      e.switch{
          Sell => false,
          Buy{Price{p}} => p == 10
      }
  }`);

  await testError(`testing destruct_enum_duplicate_name_error
  
  struct Price {
      p: Int
  }

  enum Action {
      Sell
      Buy{p: Price}
  }
  
  func main() -> Bool {
      e: Action = Action::Buy{Price{10}};

      e.switch{
          Sell => false,
          Buy{p: Price{p}} => p == 10
      }
  }`, "'p' already defined");

  await testTrue(`testing destruct_enum_interm_obj_too
  
  struct Price {
      p: Int
  }

  enum Action {
      Sell
      Buy{p: Price}
  }
  
  func main() -> Bool {
      e: Action = Action::Buy{Price{10}};

      e.switch{
          Sell => false,
          Buy{pp: Price{p}} => p == 10 && pp.p == 10
      }
  }`);

  await testTrue(`testing destruct_enum_all_levels
  
  struct Price {
      p: Int
  }

  enum Action {
      Sell
      Buy{p: Price}
  }
  
  func main() -> Bool {
      e: Action = Action::Buy{Price{10}};

      e.switch{
          Sell => false,
          b: Buy{pp: Price{p}} => p == 10 && pp.p == 10 && b.p.p == 10
      }
  }`);

  await testTrue(`testing destruct_option_nested

  struct Pair {
    a: Int
    b: Int
  }
  
  func main() -> Bool {
    o: Option[Pair] = Option[Pair]::Some{Pair{0, 10}};

    o.switch{
        None => false,
        Some{Pair{_, b}} => b == 10
    }
  }`);

  await testTrue(`testing destruct_option_expect
  
  func main() -> Bool {
    o: Option[Int] = Option[Int]::Some{10};

    Option[Int]::Some{a} = o;

    a == 10
  }`);

  await testTrue(`testing destruct_option_expect_plain
  
  func main() -> Bool {
    o: Option[Int] = Option[Int]::Some{10};

    some: Option[Int]::Some = o;

    some.some == 10
  }`);

  await testError(`testing destruct_option_expect_error
  
  func main() -> Bool {
    o: Option[Int] = Option[Int]::None;

    Option[Int]::Some{a} = o;

    a == 10
  }`, "unexpected constructor index");

  await testError(`testing destruct_option_expect_plain_error
  
  func main() -> Bool {
    o: Option[Int] = Option[Int]::None;

    some: Option[Int]::Some = o;

    some.some == 10
  }`, "unexpected constructor index");

  await testTrue(`testing destruct_option_multi_expect
  
  func main() -> Bool {
    o: Option[Int] = Option[Int]::Some{10};

    (Option[Int]::Some{a}, _) = (o, Option[Int]::None);

    a == 10
  }`);

  await testTrue(`testing destruct_option_nested_expect
  
  struct Pair {
    a: Option[Int]
    b: Option[Int]
  }

  func main() -> Bool {
    p = Pair{Option[Int]::Some{10}, Option[Int]::Some{11}};

    Pair{Option[Int]::Some{a}, Option[Int]::Some{b}} = p;

    a == 10 && b == 11
  }`);


  await testError(`testing destruct_option_nested_expect_error
  
  struct Pair {
    a: Option[Int]
    b: Option[Int]
  }

  func main() -> Bool {
    p = Pair{Option[Int]::Some{10}, Option[Int]::None};

    Pair{Option[Int]::Some{a}, Option[Int]::Some{b}} = p;

    a == 10 && b == 11
  }`, "unexpected constructor index");

  await testTrue(`testing destruct_option_switch_expect
  
  enum Collection {
    One {
      a: Option[Int]
    }

    Two {
      a: Option[Int]
      b: Option[Int]
    }
  }

  func main() -> Bool {
    c: Collection = Collection::Two{Option[Int]::Some{10}, Option[Int]::Some{11}};

    c.switch{
      Two {Option[Int]::Some{a}, Option[Int]::Some{b}} => a == 10 && b == 11,
      _ => true
    }
  }`);

  await testError(`testing destruct_option_switch_expect_error
  
  enum Collection {
    One {
      a: Option[Int]
    }

    Two {
      a: Option[Int]
      b: Option[Int]
    }
  }

  func main() -> Bool {
    c: Collection = Collection::Two{Option[Int]::Some{10}, Option[Int]::None};

    c.switch{
      Two {Option[Int]::Some{a}, Option[Int]::Some{b}} => a == 10 && b == 11,
      _ => false
    }
  }`, "unexpected constructor index");
}

// error expr tests
async function test24() {

  await testTrue(`testing if_error
  
  func main() -> Bool {
    if (false) {
      error("never called")
    };
    true
  }
  `);

  await testError(`testing if_error
  
  func main() -> Bool {
    if (false) {
      error("never called")
    } else {
      error("error")
    };
    true
  }
  `, "error");

  await testTrue(`testing switch_error
  
  func main() -> Bool {
    opt: Option[Int] = Option[Int]::Some{10};

    opt.switch{
      None => error("unexpected")
    };

    true
  }`);

  await testTrue(`testing multi_value_if_error
  
  func multiv() -> (Int, Int) { 
    if (true) {
      (1, 2)
    } else {
      error("unexpected")
    }
  }

  func main() -> Bool {
    (a: Int, _) = multiv();
    a == 1
  }`)

  await testError(`testing multi_value_if_error
  
  func multiv() -> (Int, Int) { 
    if (true) {
      (1, 2)
    } else {
      (error("unexpected"), error("unexpected"))
    }
  }

  func main() -> Bool {
    (a: Int, _) = multiv();
    a == 1
  }`, "unexpected error call");

  await testError(`testing deadcode

  func main() -> Bool {
    error("error");
    true
  }`, "unreachable code");
}

async function test25() {
  await testTrue(`testing type_parameters
  
  struct Pair[A, B] {
    a: A
    b: B

    func serialize_custom(self) -> ByteArray {
      self.a.serialize() + self.b.serialize()
    }

    func serialize_2[C](self, other: C) -> ByteArray {
      self.serialize_custom() + other.serialize()
    }
  }

  func main() -> Bool {
    p = Pair[Int, Int]{10, 11};

    p.serialize_custom().length < p.serialize_2(true).length
  }`);
}

async function test26() {
  await testTrue(`testing inferred_literal_struct
  
  struct Pair {
    a: Int
    b: Int

    func is_zero(self) -> Bool {
      self.a == 0 && self.b == 0
    }
  }

  func main() -> Bool {
    lst = []Pair{{0, 0}, {1, 2}, {3, 4}};
    map = Map[Pair]Pair{{0, 0}: {1, 2}, {3, 4} : {5, 6}};
    option = Option[Pair]::Some{{0, 0}};
    lst_nested = [][]Pair{{{0, 0}, {1, 2}, {3, 4}}, {{0, 0}, {1, 2}, {3, 4}}};

    lst.any((p: Pair) -> {p.is_zero()})
    && map.any((k: Pair, v: Pair) -> {k.is_zero() || v.is_zero()})
    && option.some.is_zero()
    && lst_nested.flatten().any((p: Pair) -> {p.is_zero()})
  }
  `)
}

async function test27() {
  await testTrue(`testing limited_shadowing
  
  func main() -> Bool {
    a = 10;
    a = a + 10;
    a == 20
  }`)

  await testError(`testing limited_shadowing_wrong_scope
  
  func main() -> Bool {
    a = 10;

    if (true) {
      a = a + 10;
      a
    } else {
      a
    }
  }`, "already defined")
}

async function test28() {
	await testTrue(`testing utf8_bytearray_literal

	func main() -> Bool {
		b"Hello world" == "Hello world".encode_utf8()
	}`)
}

async function test29() {
  const moduleSrc = `module Foo

  struct DelegateDetails {
      name:  String
      addrs: Address[]
  }
  `

  const mainSrc = `testing main_
  
  import { DelegateDetails } from Foo

  func main(dd: DelegateDetails) -> Bool {
    dd.name == dd.name
  }`

  try {
    Program.new(mainSrc, [moduleSrc]).compile()
  } catch (e) {
    if (!e.message.includes("isn't") && !e.message.includes("parametric")) {
      throw e
    }
  }
  
}

export default async function main() {
  await test0();

  await test1();

  await test2();

  await test3();

  await test4();
  
  await test5();

  await test6();

  await test7();

  await test8();

  await test9();

  await test10();

  await test11();
  
  await test12();

  await test13();

  await test15();

  await test16();

  await test17();

  await test18();

  await test19();

  await test20();

  await test21();

  await test22();

  await test23();

  await test24();

  await test25();

  await test26();

  await test27();

  await test28();

  await test29();
}
