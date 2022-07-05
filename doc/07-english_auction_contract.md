# Part 7 of Plutus-Light how-to guide: English Auction contract

The script:
```golang
data Datum {
    seller        PubKeyHash,
    bidAsset      AssetClass, // allow more than just lovelace, but must be a single AssetClass
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
}
```

TODO: testing procedure