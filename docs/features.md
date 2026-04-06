# Current Artemis Pulse Features

## Overview

The application lets users work with ActiveMQ Artemis through three views:

- `Pulse`: broker health summary and queues that need attention.
- `Explorer`: main operational workspace for addresses, queues, and messages.
- `Topology`: visual broker map with direct access to `Explorer`.

## Pulse

Current use:
- high-level broker metrics
- backlog, DLQ, and critical queue visibility
- manual refresh
- direct access to problematic queues in `Explorer`

## Explorer

Current use:
- navigate through `address -> queue`
- display empty addresses in the sidebar tree
- search queues or addresses
- list messages without consuming them automatically
- open message detail
- filter and sort loaded messages
- load `100`, `250`, or `500` messages per queue
- select messages individually or in bulk

### Broker Management

Available actions:
- create addresses
- delete addresses
- create queues
- delete queues

### Message Operations

Available actions:
- publish messages
- consume messages
- purge a queue
- move messages
- retry messages from DLQ
- run `Retry All` and `Move All` when applicable

## Topology

Current use:
- represent broker, addresses, queues, and consumers
- filter by text, DLQ, consumers, and problems
- inspect node details
- open a specific queue in `Explorer`

## Status Policy

All three views use the same shared status policy:

- `critical` when backlog exceeds the critical threshold or when there are messages without consumers
- `warning` when backlog exceeds the warning threshold
- `healthy` otherwise

## Common Flows

### Prepare a Test Scenario

1. Create an address.
2. Create a queue.
3. Publish messages.
4. Inspect them in `Explorer`.

### Clean Up a Test Environment

1. Select the queue.
2. Purge messages if needed.
3. Delete the queue.
4. Delete the address if it is no longer used.

### Work with a DLQ

1. Open the DLQ in `Explorer`.
2. Review messages and origin data.
3. Run `Retry`, `Retry All`, `Move`, or `Move All`.

## Current Limitations

- there is no true offset-based pagination
- there is no persistent consumer managed by the app
- there is no action history
- there is no advanced selective requeue by expression

## Destructive Actions

These actions modify or remove broker data:
- `Consume`
- `Purge`
- `Delete queue`
- `Delete address`
- `Move`
- `Retry`

These actions are non-destructive:
- search queues
- view messages
- open message detail
- create address
- create queue
- publish messages
