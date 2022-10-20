#!/usr/bin/env node
import * as helios from "./helios.js";

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