#!/usr/bin/env node
//@ts-check

import * as helios from "../helios.js";
import { runIfEntryPoint } from "./util.js";

async function test1() {
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

        shareholders: Map[Address]Int =  shareholder_indexes.fold(
          (acc: Map[Address]Int, idx: Int) -> Map[Address]Int {
            acc + Map[Address]Int{
              bytearrayToAddress(shareholder_pkhs.get(idx-1)): shareholder_shares.get(idx-1)
            }
          },
          init
        );
        shareholders.length == 1
    }`;

    helios.Program.new(src);
}

async function test2() {
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

      const BLA = "123"

      func unused2() -> Int {
        Datum::unusedMember()
      }
    }
    
    func main(datum: Datum, _, ctx: ScriptContext) -> Bool {
      tx: Tx = ctx.tx;
      datum.tradeOwnerSigned(tx)
    }
    
    const OWNER_BYTES = #
    const PRICE_LOVELACE = 0
    const DISBURSEMENTS = Map[PubKeyHash]Int{}
    
    const DATUM = Datum{
      disbursements : DISBURSEMENTS,
      amount : PRICE_LOVELACE,
      tradeOwner : PubKeyHash::new(OWNER_BYTES)
    }`;

    let program = helios.Program.new(src);

    program.parameters = {
      DISBURSEMENTS: new (helios.HMap(helios.PubKeyHash, helios.HInt))([
        [new helios.PubKeyHash("01020304050607080910111213141516171819202122232425262728"), new helios.HInt(100)]
      ])
    };

    console.log(program.evalParam("DISBURSEMENTS").toString());
    console.log(program.evalParam("DATUM").toString());

    console.log(program.cleanSource());
}

async function test3() {
  const src = `
  testing bool_struct

  struct MyStruct {
    b: Bool
    s: String
  }

  func main() -> Bool {
    s = MyStruct{b: true, s: "asdasd"};
    s.b
  } 
  `

  let program = helios.Program.new(src).compile();

  console.log((await program.run([])).toString());
}

async function test4() {
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

  let program = helios.Program.new(src);

  console.log(program.prettyIR());

  let uplcProgram = program.compile();

  console.log((await uplcProgram.runWithPrint([])).toString());
}

async function test5() {
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

  let program = helios.Program.new(src);

  let uplcProgram = program.compile();

  console.log((await uplcProgram.runWithPrint([])).toString());

  console.log(program.evalParam("r").toString());
}

async function test6() {
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

  const program = helios.Program.new(src);

  console.log(program.paramTypes);

  console.log(await program.compile().runWithPrint([]));
}

async function test7() {
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

  const program = helios.Program.new(src);

  console.log(program.paramTypes);

  console.log(await program.compile().runWithPrint([]));
}

async function test8() {
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
      else => "other"
    }
  }

  const DATA = MyEnum::Three
  `;

  const program = helios.Program.new(src);

  const data = program.evalParam("DATA");

  console.log(program.prettyIR(true));

  let res = await program.compile(true).run([data]);

  console.log(helios.bytesToText(res.data.bytes));
}

async function test9() {
  const src = `
  testing staking_credential

  func main(sc: StakingCredential) -> StakingValidatorHash {
    sc.switch{h: Hash => h.hash.switch{v: Validator => v.hash, else => error("no StakingValidatorHash")}, else => error("not StakingHash")}
  }
  `;

  helios.Program.new(src);
}

async function test10() {
	const src = `spending always_true
	func main(ctx: ScriptContext) -> Bool {
		ctx.get_script_purpose().serialize().length > 0
			&& ctx.tx.redeemers.length == 1
	}`;

	helios.Program.new(src).compile();
}

async function test11() {
  const src = `testing swap
  func swap(a: Int, b: Int, _) -> (Int, Int) {
    (c: Int, d: Int) = (b, a); (c, d)
  }

  func main(a: Int, b: Int) -> Int {
    (c: Int, _) = swap(swap(a, b, b), b); c
  }`;

  const program = helios.Program.new(src);

  console.log(program.prettyIR(false));
  console.log(program.prettyIR(true));

  program.compile();
}

async function test12() {
  const src = `testing data_switch
  
  func main(d: Data) -> String {
    d.switch{
      Int => "int",
      (i: Int, dl: []Data) => i.show() + ", " + dl.length.show(),
      ByteArray => "bytearray",
      else => "other"
    }
  }

  enum MyEnum {
    One
    Two
    Three{x: Int}
  }

  const DATA = MyEnum::Three{10}
  `;

  const program = helios.Program.new(src);

  const data = program.evalParam("DATA");

  console.log(program.prettyIR(true));

  let res = await program.compile(true).run([data]);

  console.log(helios.bytesToText(res.data.bytes));
}

async function test13() {
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

  let program = helios.Program.new(src);

  console.log(program.prettyIR(false));

  let [res, messages] = await program.compile(false).runWithPrint([]);

  messages.forEach(m => console.log(m));

  console.log(res.toString());
}

async function test14() {
  const srcHelpers = `module helpers
  
  const SOME_PARAM = 0

  func is_tx_authorized_by(tx: Tx, _) -> Bool {
    tx.is_signed_by(PubKeyHash::new(#))
  }`;

  const src = `minting sample_migrate_token_policy

  import { is_tx_authorized_by, SOME_PARAM } from helpers

  struct MyStruct {
  	a: Int
	  b: Int
  }

  enum MyEnum {
    One
    Two
    Three{
      a: Int
      b: Int
    }
  }

  const CRED = Credential::new_pubkey(
    PubKeyHash::new(#1234567890123456789012345678)
  )

  const VALUE = Value::lovelace(100)

  func main(_, ctx: ScriptContext) -> Bool {
    tx: Tx = ctx.tx;

    assert( 1== 1, "error");

    test_option: Option[Int] = Option[Int]::Some{1};

    test: Int = test_option.switch {
      None => error("invalid int"),
      else => {
        assert(1 == 1, "error");
        1
      }
    };

    assert(test == 1, "wrong option");

    is_tx_authorized_by(tx, CRED)
  }`;

  const program = helios.Program.new(src, [srcHelpers]);

  console.log(program.types);

  const {MyStruct, MyEnum} = program.types;

  const {HInt, HString, HList, HMap, Value} = helios;

  const myInt = new HInt(10);

  console.log(myInt.int);

  console.log(myInt.toSchemaJson());

  console.log(myInt._toUplcData().toString());

  console.log((HInt.fromUplcCbor([10])).int);

  console.log(HInt.name);

  console.log ((new HString("ajshdj")).toSchemaJson());

  const list = new (HList(HString))(["a", "b"]);

  console.log(list.toSchemaJson());

  const map = new (HMap(HString, HInt))(["a", "b"], [1, 2]);

  console.log(map.toSchemaJson(), map instanceof (HMap(HString, HInt)));

  const myStruct = new MyStruct(1, 2);

  console.log(myStruct.toSchemaJson());

  console.log(program.parameters.VALUE.toSchemaJson());

  program.parameters = {VALUE: new Value(200n), SOME_PARAM: 2};

  console.log(program.parameters.VALUE.toSchemaJson(), program.parameters.SOME_PARAM.toSchemaJson());

  const myEnum = new MyEnum.Three(1, 2);

  console.log(myEnum.toSchemaJson(), myEnum instanceof MyEnum);
}

async function test15() {
  const src = `
  spending inferred_ret_type

  func main(_, _, ctx: ScriptContext) -> Bool {
    ctx.tx.outputs.fold((prev: Int, output: TxOutput) -> {
      prev + output.value.get(AssetClass::new(MintingPolicyHash::new(#), #))
    }, 0) > 0
  }
  `;

  helios.Program.new(src);
}

async function test16() {
  const src = `
  spending parametric
  
  const OWNER = PubKeyHash::new(#)

  const BOOL = false

  func main(_, _, ctx: ScriptContext) -> Bool {
    ctx.tx.is_signed_by(OWNER) && BOOL
  }`;

  const program = helios.Program.new(src);

  program.compileParametric(["OWNER", "BOOL"], true);
}

async function test17() {
  const mintingSrc = `
  minting redeemer_only

  struct Redeemer {
    value: Int
  }

  func main(redeemer: Redeemer, _) -> Bool {
    redeemer.value == 42
  }
  `;

  helios.Program.new(mintingSrc);

  const spendingSrc = `
  spending redeemer_only

  struct Redeemer {
    value: Int
  }

  func main(_, redeemer: Redeemer, _) -> Bool {
    redeemer.value == 42
  }
  `;

  helios.Program.new(spendingSrc);
}

// recursive type test
async function test18() {
  const src = `
  testing merkle_trees

  enum MerkleTree {
    // represents no value (null object pattern)
    MerkleEmpty
  
    MerkleLeaf { hash: ByteArray }
  
    MerkleNode {
      hash: ByteArray
      left: MerkleTree
      right: MerkleTree
    }
  }
  
  func main() -> Bool {
      a = MerkleTree::MerkleEmpty;
      b = MerkleTree::MerkleLeaf{#abcd};
      c = MerkleTree::MerkleNode{hash: #1234, left: a, right: b};
      (c.left == a).trace("left equal to a: ")
  }`;

  for (const simplify of [true, false]) {
    console.log(simplify)
    const program = helios.Program.new(src).compile(simplify);

    const [result, messages] = await program.runWithPrint([]);

    console.log(result.toString(), messages);
  }
}

async function test19() {
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
    const program = helios.Program.new(src).compile(simplify);

    const result = await program.run([]);

    console.log(result.toString());
  }
}

async function test20() {
  // no newlines
  const src = `testing no_newlines func main()->Bool{true}//`

  helios.Program.new(src).compile(true)
}

export default async function main() {
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

  await test14();

  await test15();

  await test16();

  await test17();

  await test18();

  await test19();

  await test20();
}

runIfEntryPoint(main, "syntax.js");
