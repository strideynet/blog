---
title: Redis is great
date: 2020-09-01 09:00:00
tags:
- Redis
- Thoughts
---

It's not often that a piece of tech really gets me excited, or at least excited enough to rant about it. Redis is one of the few that are lucky enough to have a place close to my heart (and it has for a few years), and it's there for a many reasons but one part is key:

> Redis encapsulates doing something simple well

Some might liken this to the Unix philosophy of 'doing one thing well', an adage that often gets on my nerves for the
amount that it is thrown around, but they'd probably be right. Redis' simplicity makes it a tool that is easy for anyone
with an understanding of basic data structures and some engineering knack to pick up and effectively start using it.

For those not in the know, Redis is at its most basic is an in-memory data structure server. It provides access to
structures such as hash tables, lists (which can act as queues) and sets (with support for ordering) with an appropriate
amount of secondary features such as key expiry and leader-follower replication. This allows Redis to be used as an extremely
flexible cache or even as a datastore.

Not only is Redis simple to use, but its implementation is just as simple, making it incredibly performant (to the point
of being significantly faster than your network) but also rock solid. I am yet to encounter any kind of significant issue
with Redis in production, especially when compared to many other tools that are part of our stack. I will admit that
scaling out Redis beyond simple leader-follower gets more complex, this is easily pasted over with the cost-effective and
rather fantastic SAAS Redis that is on offer by Redis Labs.

Perhaps the part of Redis that demonstrates its simplicity best is its protocol. The Redis protocol (RESP) is a human-readable
request-response protocol. It is essentially plaintext, with a leading byte used to denote the datatype of provided values.
For example, the string ``FOOBAR`` is encoded simply as ``+FOOBAR\r\n`` (+ indicating a string) and integers are encoded in base 10. This simplicitly
is extremely refreshing in the light of many modern protocols which are essentially impossible to debug quickly with classic tools
such as Wireshark, and makes it easier where a novel client implementation is needed (although I doubt this should ever be the case).

Whilst I acknowledge Redis has its flaws (nothing is perfect), its a tool I foresee myself using on almost every scaled out project I touch
in the next few years, and that is with absolute pleasure. Whilst other tools may offer more features, I can't see any
that compete with Redis' maturity and simplicity.

If you disagree, or have found a tool better than Redis, please get in touch! I'm always open to exploring new tech.
