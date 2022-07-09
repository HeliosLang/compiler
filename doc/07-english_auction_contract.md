# Part 7 of Plutus-Light tutorial: English Auction contract

## The script

```golang
data Datum {
    seller        PubKeyHash,
    bidAsset      AssetClass, // allow alternative assets (not just lovelace)
    minBid        Integer,
    deadline      Time,
    forSale       Value,
    highestBid    Integer, // initialized at 0, which signifies the auction doesn't yet have valid bids
    highestBidder PubKeyHash
}

union Redeemer {
    Close {},
    Bid {
        bidder PubKeyHash,
        bid    Integer
    }
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
        select (redeemer) {
            case Redeemer::Close {false}
            case (b Redeemer::Bid) {
                if (b.bid < datum.minBid) {
                    false
                } else if (datum.highestBid == 0) {
                    // first bid
                    expectedDatum Datum = updateDatum(datum, b.bid, b.bidder);

                    valueLockedByDatum(tx, validatorHash, expectedDatum) >= datum.forSale + Value(datum.bidAsset, b.bid)
                } else if (b.bid <= datum.highestBid) {
                    false
                } else {
                    expectedDatum Datum = updateDatum(datum, b.bid, b.bidder);

                    valueLockedByDatum(tx, validatorHash, expectedDatum) >= datum.forSale + Value(datum.bidAsset, b.bid) &&
                    valueSentTo(tx, datum.highestBidder) >= Value(datum.bidAsset, datum.highestBid)
                }
            }
        }
    } else {
        // after deadline -> must close
        select (redeemer) {
            case Redeemer::Close {
                if (datum.highestBid < datum.minBid) {
                    // the forSale asset must return to the seller, what happens to any erroneous bid value is irrelevant
                    valueSentTo(tx, datum.seller) >= datum.forSale
                } else {
                    valueSentTo(tx, datum.seller) >= Value(datum.bidAsset, datum.highestBid) &&
                    valueSentTo(tx, datum.highestBidder) >= datum.forSale
                }
            }
            default {false}
        }
    }
}
```

## TODO: testing procedure