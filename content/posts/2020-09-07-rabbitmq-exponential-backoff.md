---
title: "RabbitMQ: Backoff is king [WIP]"
date: 2020-09-07 09:00:00
tags:
- RabbitMQ
- Scaling
categories:
- Tech
---

*This post is work in progress, and will be fleshed out at a later date.*

RabbitMQ is a fantastic piece of infrastructure for building event driven systems, but it's far too easy to skip a key
implementation detail early on (in haste, or ignorance) and end up creating extremely fragile systems. What I am
referring to here is Message Redelivery and the need for some form of back-off.

The worst-case scenario runs as follows: you have a series of queues that consume events that are published to your
exchange. For some reason, message handling fails (perhaps as a service the consumer depends on fails) and the messages
are rejected, leading them to be redelivered. If the upstream service is still down, then it fails again. Over time,
messages that have failed to be delivered begin to build up, leading to a greater and greater rate of message delivery
to your consumers. This can then contribute to a greatly increased MTTR as increased rate of message consumption
leads to yet more pressure on the already degraded upstream service. If this continues to run away, more and more resources
will be consumed as the number of messages that can not be handled builds up, potentially leading to system wide outage.

The solution to our problem? Back-off implemented with RabbitMQ Dead Lettering.

## Implementation A: Fixed back-off

RabbitMQ includes a fantastic option that can be applied to queues, namely the ability to specify a second exchange
that messages should be published to when a message is rejected or runs out of TTL. By chaining a so called "dead-letter
exchange" back into the original queue, we have the ability to provide a fixed back-off time for a message to wait before
reprocessing when we make use of message expiry.

This gives the following rough process:

1. A publisher publishes a message to an exchange
2. The message is passed to the queue ``work-queue`` which is configured with ``x-dead-letter-exchange: work-queue-retry``
3. A consumer is given the message, and handling the message fails, rejecting the message
4. The message is then passed to the exchange ``work-queue-retry`` which has a queue of a similar name bound,
  with both a queue level TTL set (of perhaps 60 seconds) and ``x-dead-letter-exchange: amqp.direct`` with ``x-dead-letter-routing-key: work-queue``
5. The message sits in the queue, until it expires, and is then redelivered directly to the ``work-queue`` via the ``amqp.direct`` exchange.

There's a few limitations/things to note here:

- The routing key of the original message is lost, however, I tend to find it is an anti-pattern to rely on the routing key within application code
- You may only have a single TTL, as messages are expired from the head so messages with a shorter TTL behind a long TTL will be expired after the long TTL
- You need another queue for each of your queues (although queues are pretty cheap in RMQ)

It's worth considering how this can be instrumented. Keeping track of the number of messages in the retry queue is a rough
way to get insight into the health of your system. Whilst it's better practice to have more specific metrics as these
let you dial into an issue quicker, the message count here provides a quick interim solution for alerting purposes.

## Implementation B: Exponential back-off

We can further improve this by adding multiple levels of back-off that increase exponentially in length. This adds additional
complexity but better allows the system to cope with an extended disruption.

Modifications required:

- Instead of rejecting the message, we now need to ack and republish with a header to indicate failure count
- Instantiate a series of queues with exponentially increasing TTLs
- Republish the message directly to the retry exchange, with a routing key to select the queue with the right TTL
- When the retry-count reaches a maximum value, do not republish to the retry exchange on failure

And again a few limitations of note:

- Greatly increases number of queues on your RabbitMQ service
- Lose track of the routing key
- Increased complexity
- Risk of message loss if republishing fails
