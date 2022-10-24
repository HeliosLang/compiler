#!/usr/bin/env node
import * as helios from "./helios.js";

function test1() {
    const src = `spending always_true
    func bytearrayToAddress(bytes: ByteArray) -> Address {   // bytes = #... must be 28 bytes long
        Address::new(Credential::new_pubkey(PubKeyHash::new(bytes)), Option[StakingCredential]::None)
    } 

    func main() -> Bool {
        shareholder_pkhs:[]ByteArray = []ByteArray{#01234567890123456789012345678901234567890123456789012345}; 
        shareholder_shares: []Int = []Int{100};
        shareholder_indexes: []Int = []Int::new(shareholder_shares.length, (i: Int) -> Int {i}); // [1..shareholder_indexes.length]
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

function test2() {
    const src = `spending testing

    struct Datum {
      disbursements : Map[PubKeyHash]Int
      amount : Int
      tradeOwner: PubKeyHash
    
      func tradeOwnerSigned(self, tx: Tx) -> Bool {
        tx.is_signed_by(self.tradeOwner)
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
}

function main() {
    test1();

    test2();
}

main();