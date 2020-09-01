---
title: Scaling Firestore & lessons we learnt
date: 2020-08-16 09:00:00
tags:
- Firestore
- Scaling
categories:
- Tech
---

Firestore (or GCP Datastore), as a concept, is pretty appealing: an (almost) infinitely scaleable, high availability NoSQL database.
However, there's  quite a few things that will easily catch you out if you aren't careful. This post will probably err more on
the side of pointing out the negatives, since Firestore tend to sell you the positives pretty effectively themselves.

## Sharding

Firestore shards documents between their instances based on the ID you've assigned each document. If you've stuck with the
default firestore implementation, then there's not a huge issue here, but if you decide to use your own IDs it is
**absolutely imperative that you ensure the higher order bits (the start of the ID) are random** as the documents are
range-sharded based on these higher order bits.

If you use a timestamp as part of these higher order bits, you essentially gaurantee that even if Firestore continues
to scale your database out across more nodes, and your application fetches more recent documents more often than
older documents (which is likely), that performance for reads and writes will degrade.

We experienced major scaling issues with our IDs for several reasons. The project originally used the
[KSUID library by Cuvva](https://github.com/cuvva/ksuid-go), which turned out to be a poor choice for several reasons:

- They are prefixed with the resource identifier, removing a large amount of entropy from the higher order bits.
- They then contained the timestamp of creation, meaning that documents that were created at similar times ended up
on the same shard.
- They include the process ID. This is a pretty awful idea if you are intending on deploying your application
using docker containers, since on Docker it's highly likely that the process ID will always be 1 (and if it's not you
are probably doing something wrong).

## Rate of Traffic

Firestore recommends that your traffic increases to their service following the 500/50/5 rule:

- Start with up to 500 op/s to a single collection
- Ramp up at most 50% every 5 minutes

The five minute window gives ample time for Firestore to increase the number of instances serving your data. It would appear
that even if you traffic drops off, it takes at least a few days for the instances to scale back down. This can be used
to your benefit if you are expecting a sudden increase in load (e.g a launch day) as you can create artificial load
with scripts to scale your database out, and then remove the artificial load before you expect the spike.

Obviously, it's impossible to expect them to be able to scale out instantly, but it's worth keeping these guidelines in mind
especially when it comes to handling unexpected spikes in load. Solutions such as caching are likely the answer to both
reducing the cost of firestore & better handling spikes in load.

## Limited querying options

Firestore offers pretty pathetic options in terms of querying when compared to more common-place SQL and NoSQL databases.

If you expect at any point you'll want to

- Order a column by a field included in an equality clause
- Find records where a field matches one of eleven or more values
- Find records where a field doesn't equal a value

Then Firestore probably isn't the solution for you, unless you are happy to perform additional filtering in your application.

Arguably, a lot of these restrictions are somewhat reasonable given the fact that Firestore puts performance ahead
of flexibility. The performance of queries is almost always determined by the size of the result set, rather than the
size of the collection which is incredibly convenient. If you are dead-set on Firestore, another searching tool such as
Algolia or ElasticSearch can be bolted on to grant more powerful querying/searching.
