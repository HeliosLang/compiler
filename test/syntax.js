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

    func main() -> Bool {
        shareholder_pkhs = []ByteArray{#01234567890123456789012345678901234567890123456789012345}; 
        shareholder_shares = []Int{100};
        shareholder_indexes = []Int::new(shareholder_shares.length, (i: Int) -> Int {i}); // [1..shareholder_indexes.length]
        init = Map[Address]Int{};

        shareholders: Map[Address]Int =  shareholder_indexes.fold(
            (acc: Map[Address]Int, idx: Int) -> Map[Address]Int {
            acc + Map[Address]Int{bytearrayToAddress(shareholder_pkhs.get(idx-1)): shareholder_shares.get(idx-1)}
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
    
    func main(datum: Datum, ctx: ScriptContext) -> Bool {
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

    program.changeParam("DISBURSEMENTS", JSON.stringify([[[1,2,3], 100]]));

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

  let program = helios.Program.new(src).compile();

  console.log((await program.runWithPrint([])).toString());
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
}

runIfEntryPoint(main, "syntax.js");
