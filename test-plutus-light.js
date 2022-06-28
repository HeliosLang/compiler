#!/usr/bin/env node

import * as PL from "./plutus-light.js";

const ALWAYS_SUCCEEDS = `
func main() Bool {
	true
}
`

const VESTING = `
data VestingTranche {
    time   Time, // amount is available after time
    amount Value
}

data VestingParams {
    tranche1 VestingTranche,
    tranche2 VestingTranche,
    owner    PubKeyHash
}

func availableFrom(tranche VestingTranche, time Time) Value {
    if (time >= tranche.time) {
        tranche.amount
    } else {
        zero()
    }
}

func remainingFrom(tranche VestingTranche, time Time) Value {
    tranche.amount - availableFrom(tranche, time)
}

// the compiler is smart enough to add an empty Datum and empty Redeemer as arguments to the actual main function
func main(ctx ScriptContext) Bool {
    vestingParams VestingParams = VestingParams{
		tranche1: VestingTranche{time: Time(1656285936477), amount: lovelace(1000000)},
		tranche2: VestingTranche{time: Time(1658877962311), amount: lovelace(2000000)},
		owner: PubKeyHash(#abcdef1234567890)
	};
    tx Tx = getTx(ctx);
    now Time = getTimeRangeStart(getTxTimeRange(tx));
    remainingActual Value = valueLockedBy(tx, getCurrentValidatorHash(ctx));
	remainingExpected Value = remainingFrom(vestingParams.tranche1, now) + remainingFrom(vestingParams.tranche2, now);
    isStrictlyGeq(remainingActual, remainingExpected) && isTxSignedBy(tx, vestingParams.owner) 
} 
`

function main() {
	console.log(PL.compilePlutusLightProgram(ALWAYS_SUCCEEDS));

	console.log(PL.compilePlutusLightProgram(VESTING));
}

main();
