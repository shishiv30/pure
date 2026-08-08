# server/routes/

**Purpose:** HTTP registration and thin adapters. Mount order matters (specific before catch-all).

**Put here:** Express routers, request param wiring into controllers, thin SOA proxy handlers.

**Do not put here:** Listing field mapping (`helpers/`), seed data (`data/`).

**Canonical docs:** [docs/routes-reference.md](../../docs/routes-reference.md), [server.md](../../server.md), [docs/folder-ownership.md](../../docs/folder-ownership.md).
