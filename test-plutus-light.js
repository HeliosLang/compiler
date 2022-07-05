#!/usr/bin/env node

import * as PL from "./plutus-light.js";

const ALWAYS_SUCCEEDS = `
func main() Bool {
	true
}
`

const TIME_LOCK = `
data Datum {
    lockUntil Time,
	owner     PubKeyHash, // can't get this info from the ScriptContext
    nonce     Integer // doesn't actually need be checked here
}

func main(datum Datum, ctx ScriptContext) Bool {
    tx Tx = getTx(ctx);

    now Time = getTimeRangeStart(getTxTimeRange(tx));

    returnToOwner Bool = isTxSignedBy(tx, datum.owner);

    trace("now: " + show(now) + ", lock: " + show(datum.lockUntil), now > datum.lockUntil) || 
    trace("returning? " + show(returnToOwner), returnToOwner)
}
`

const TIME_LOCK_DATUM = `
Datum{
    lockUntil: Time(${(new Date()).getTime() + 1000*60*5}),
    owner: PubKeyHash(#1d22b9ff5fc20bae3b84b8f9434e747c1792b0ea2b0af658a8a76d43),
    nonce: 42
}
`

const SUBSCRIPTION = `
data Datum {
    owner            PubKeyHash,
    beneficiary      PubKeyHash,
    total            Value, // remaining Value locked in script
    benefit          Value, 
    after            Time,  // must be incremented by 'interval' every time beneficiary withdraws
    interval         Duration
}

func main(datum Datum, ctx ScriptContext) Bool {
    tx Tx = getTx(ctx);

    if (isTxSignedBy(tx, datum.owner)) {
        true
    } else if (isTxSignedBy(tx, datum.beneficiary)) {
        now Time = getTimeRangeStart(getTxTimeRange(tx));
        if (now >= datum.after) {
             if (datum.benefit >= datum.total) {
                true
             } else {
                currentHash ValidatorHash = getCurrentValidatorHash(ctx);

                expectedRemaining Value = datum.total - datum.benefit;

                expectedDatum Datum = Datum{
                    owner:       datum.owner,
                    beneficiary: datum.beneficiary,
                    total:       expectedRemaining,
                    benefit:     datum.benefit,
                    after:       datum.after + datum.interval,
                    interval:    datum.interval
                };

                // if expectedDatum isn't found, then valueLockedByDatum() immediately throws an error
                actualRemaining Value = valueLockedByDatum(tx, currentHash, expectedDatum);
  
                if (trace("actualRemaining: "  + show(getValueComponent(actualRemaining, AssetClass(MintingPolicyHash(#), "")))   + " lovelace", actualRemaining) >= 
                    trace("expectedRemaining " + show(getValueComponent(expectedRemaining, AssetClass(MintingPolicyHash(#), ""))) + " lovelace", expectedRemaining))
                {
                    true
                } else {
                    trace("too much", false)
                }
             }
        } else {
            trace("too soon", false)
        }
    } else {
        trace("unauthorized", false)
    }
}
`

const SUBSCRIPTION_TIME = (new Date()).getTime() + 1000*60*5;
const SUBSCRIPTION_INTERVAL = 1000*60*5;
const SUBSCRIPTION_DATUM1 = `
Datum{
    owner:       PubKeyHash(#1d22b9ff5fc20bae3b84b8f9434e747c1792b0ea2b0af658a8a76d43),
    beneficiary: PubKeyHash(#3a1858b50ae22f5eb40bc8cdab12643b6793e9e14f9c7590402d73de),
    total:       lovelace(${4000000}),
    benefit:     lovelace(${2000000}),
    after:       Time(${SUBSCRIPTION_TIME.toString()}),
    interval:    Duration(${SUBSCRIPTION_INTERVAL.toString()})
}
`

const SUBSCRIPTION_DATUM2 = `
Datum{
    owner:       PubKeyHash(#1d22b9ff5fc20bae3b84b8f9434e747c1792b0ea2b0af658a8a76d43),
    beneficiary: PubKeyHash(#3a1858b50ae22f5eb40bc8cdab12643b6793e9e14f9c7590402d73de),
    total:       lovelace(${2000000}),
    benefit:     lovelace(${2000000}),
    after:       Time(${(SUBSCRIPTION_TIME + SUBSCRIPTION_INTERVAL).toString()}),
    interval:    Duration(${SUBSCRIPTION_INTERVAL.toString()})
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

const UNTYPED_UNDATA = `func(data){func(pair) {
	ifThenElse(
		equalsInteger(fstPair(pair), 0),
		func(){headList(sndPair(pair))},
		func(){error()}
	)()
}(unConstrData(data))}`


const MINTING_POLICY = `func main(ctx ScriptContext) Bool {
    tx Tx = getTx(ctx);

    // assume a single input
    txInput TxInput = getTxInputs(tx)[0];

    // we also check the total minted
    getTxInputOutputId(txInput) == TxOutputId(#047311fde3f1281fd08956918e3d37f883930836db4d8f2a75b640bbf76f5827, 0) && getTxMintedValue(tx) == Value(AssetClass(getCurrentMintingPolicyHash(ctx), "MyNFT"), 1)
}`

const ENGLISH_AUCTION = `
data Datum {
    seller        PubKeyHash,
    bidAsset      AssetClass, // allow alternative assets (not just lovelace)
    minBid        Integer,
    deadline      Time,
    forSale       Value,
    highestBid    Integer, // starts at 0, which is also used to identify a new auction
    highestBidder PubKeyHash
}

data Redeemer {
    closing Bool,
    bidder  PubKeyHash, // unused if closing
    bid     Integer     // unused if closing
}

func updateDatum(old Datum, highestBid Integer, highestBidder PubKeyHash) Datum {
    Datum{
        seller:        old.seller,
        bidAsset:      old.bidAsset,
        minBid:        old.minBid,
        deadline:      old.deadline,
        forSale:       old.forSale,
        highestBid:    highestBid,
        highestBidder: highestBidder
    }
}

func main(datum Datum, redeemer Redeemer, ctx ScriptContext) Bool {
    tx Tx = getTx(ctx);

    now Time = getTimeRangeStart(getTxTimeRange(tx));

    validatorHash ValidatorHash = getCurrentValidatorHash(ctx);

    if (now < datum.deadline) {
        if (redeemer.closing) {
            false
        } else {
            if (redeemer.bid < datum.minBid) {
                false
            } else if (datum.highestBid == 0) {
                // first bid
                expectedDatum Datum = updateDatum(datum, redeemer.bid, redeemer.bidder);

                valueLockedByDatum(tx, validatorHash, expectedDatum) >= datum.forSale + Value(datum.bidAsset, redeemer.bid)
            } else if (redeemer.bid <= datum.highestBid) {
                false
            } else {
                expectedDatum Datum = updateDatum(datum, redeemer.bid, redeemer.bidder);

                valueLockedByDatum(tx, validatorHash, expectedDatum) >= datum.forSale + Value(datum.bidAsset, redeemer.bid) &&
                valueSentTo(tx, datum.highestBidder) >= Value(datum.bidAsset, datum.highestBid)
            }
        }
    } else {
        // after deadline -> must close
        if (redeemer.closing) {
            if (datum.highestBid < datum.minBid) {
                // the forSale asset must return to the seller, what happens to any erroneous bid value is irrelevant
                valueSentTo(tx, datum.seller) >= datum.forSale
            } else {
                valueSentTo(tx, datum.seller) >= Value(datum.bidAsset, datum.highestBid) &&
                valueSentTo(tx, datum.highestBidder) >= datum.forSale
            }
        } else {
            false
        }
    }
}`;

function compileScript(name, src, purpose = PL.ScriptPurpose.Spending) {
    console.log("Compiling", name, "...");

	console.log(PL.compilePlutusLightProgram(src, purpose));
}

function compileData(name, src, data) {
	console.log("Compiling datum for", name, "...");

	console.log(PL.compilePlutusLightData(src, data));
}

function main() {
    PL.setDebug(true);

	compileScript("always-succeeds", ALWAYS_SUCCEEDS);

	compileScript("time-lock", TIME_LOCK);

	compileData("time-lock", TIME_LOCK, TIME_LOCK_DATUM);

    compileScript("subscription", SUBSCRIPTION);

    compileData("subscription1", SUBSCRIPTION, SUBSCRIPTION_DATUM1);

    compileData("subscription1", SUBSCRIPTION, SUBSCRIPTION_DATUM2);

	//compileScript("vesting", VESTING);

	//console.log(PL.compileUntypedPlutusLight(UNTYPED_UNDATA));

    compileScript("minting", MINTING_POLICY, PL.ScriptPurpose.Minting)

    compileScript("english-auction", ENGLISH_AUCTION);
}

main();
