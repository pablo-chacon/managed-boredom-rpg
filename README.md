Below is a **production-ready README.md** aligned with CUT principles, your Managed Boredom concept, and the constraints you specified.

No em-dashes.
Arrows use `->` only.
No spoilers about illegal exit behavior.
Neutral, infrastructure-correct framing.

---

# Managed Boredom RPG

Managed Boredom RPG is a **minimal, deterministic CLI game** designed to demonstrate **authorization and ownership via CUT ERC-1155 tokens**.

The game itself is intentionally simple, repetitive, and restrictive.
The experience is not about winning fast.
It is about understanding the system you are inside.

This repository contains **game logic only**.
Authorization is handled externally through CUT.

---

## Concept: Managed Boredom

Managed Boredom is a dystopia without spectacle.

There are no flying cars.
No neon skylines.
No heroic resistance arcs.

Life functions.
Everything works.
Nothing improves.

The system ensures that participants have:

* Enough energy to continue
* Enough money to survive
* Just enough options to feel free
* Never enough momentum to exit easily

When the system fails, responsibility is abstracted.
When the individual fails, responsibility is enforced.

This is not presented as cruelty.
It is presented as care.

---

## Goal

The goal of the game is simple:

**Exit.**

To exit, the player must:

* Accumulate sufficient funds
* Obtain required documents
* Maintain enough energy to complete the process

Most paths appear viable.
Few paths are effective.

---

## Gameplay Loop

The game advances in **monthly steps**.

Each month the player chooses one action:

* work
* unemployment
* illegal_work
* visit_doctor
* rest

Each action affects:

* cash
* energy
* time
* future probabilities

The system reacts deterministically based on:

* current state
* configuration
* seeded randomness

There is no save or load functionality.

Every session is finite.

---

## Employment and Unemployment

All players begin employed.

Immediately after the game starts:

* Employment is terminated due to reconstruction
* A final salary is paid after tax
* The player enters unemployment

Unemployment can be managed in multiple ways:

* Agency participation
* Independent job searching
* Non participation

Each path has:

* Different energy costs
* Different income effects
* Different job probabilities over time

Participation is encouraged.
Non participation is corrected.

---

## Healthcare

When frustration increases, the system offers support.

Support takes the form of:

* Appointments
* Prescriptions
* Follow-ups

Healthcare interactions:

* Cost money
* Consume time
* Do not meaningfully improve progress toward exit

They are not presented as punishment.
They are presented as help.

---

## Illegal Activity

Some activities provide income without taxation.

These activities:

* Consume significant energy
* Do not qualify as progress toward exit
* Carry risk

The system monitors outcomes quietly.

---

## Determinism

All randomness in the game is:

* Seeded
* Reproducible
* Deterministic

Given the same seed and choices, outcomes are identical.

This ensures:

* Testability
* Fairness
* Predictability for developers

---

## Authorization and CUT Integration

Managed Boredom RPG does **not** implement authorization itself.

Access is gated externally via:

* CUT ERC-1155 ownership
* Platform-level authentication
* JSON-RPC based ownership checks

The game **will not start** without a valid authorization token.

This demonstrates that CUT can be used for:

* Game access
* Software entitlement
* Medium-agnostic ownership verification

CUT does not attempt to prevent copying.
Authorization is about **access**, not DRM.

---

## What This Repository Is

* A reference implementation
* A deterministic game loop
* A proof of authorization flow
* A minimal, auditable codebase

---

## What This Repository Is Not

* A platform
* A marketplace
* A service
* A DRM system
* A content distribution solution

---

## Intended Audience

This project is intended for:

* Developers evaluating CUT
* Platform builders
* Engineers interested in authorization patterns
* Anyone curious about deterministic game loops

---

## License

See `LICENSE`.

---

## Final Note

Managed Boredom is not a metaphor.

It is a system.

You are encouraged to play until you understand it.

Exiting is optional.
