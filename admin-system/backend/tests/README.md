# Phase1 isolated checks

Run from repository root:

```sh
python3 admin-system/backend/tests/run-phase1.py
```

This is the guarded selected entry, not `go test ./...`. It compiles finance/db/settings/auth/orders/root test binaries before executing package init, then executes selected real handlers in a fresh temporary cwd/HOME/uploads with whitelisted fixture-only environment. Copies only canonical migration source, never shop JSON/env/uploads. Provider requests use in-process transport stubs; no notification dispatcher is initialized. Courier/payment JSON must be nonempty and keep identical hashes. Cleanup runs on success/failure. Any selected skip fails the entry.

Test database requires explicit loopback `TEST_FIXTURE_DSN` on port55432 and database `somsing_fixture_db`. `ENVIRONMENT=test` InitDB refuses shop/default DATABASE_URL instead of falling back. No key-value DSN, shop5432, remote host, query overrides, malformed/duplicate query options, encoded database path or fragments. Only sslmode=disable/connect_timeout=5 options are accepted.

To own a fresh local PostgreSQL fixture, run:

```sh
python3 admin-system/backend/tests/test-db-lifecycle.py --focused-db
```

It uses `docker-compose.test.yml`, cached postgres:15-alpine, loopback55432, explicit fixture credentials, fixed test project and test-only volume. It loads no .env, refuses remote Docker and preexisting test project/volume, starts only its new fixture, and removes that project's container/network/volume in finally. It does not reset an existing business or test database. If the image is unavailable it fails; no automatic pull.

Focused mode reapplies real035 wear-parts table/trigger DDL twice with minimum synthetic printers, then runs actual043 generated-schema/reconnection test and existing wear-parts CRUD/wrong-asset test. This deliberately does NOT certify the complete migration sequence. Normal invocation without focused-db attempts full canonical bootstrap then existing legacy-baseline/migration/lifecycle checks; fresh-bootstrap failures are returned, never skipped or falsely reported passing:

```sh
python3 admin-system/backend/tests/test-db-lifecycle.py
```

Observed existing fresh-bootstrap defects:016 assumes equipment exists;042 seeds printer references absent from fresh schema. See consolidated Phase1 delivery.043 now included byte-identically in canonical and backend migration folders. No actual shop migration applied. Cross-process order/payment durability and native user journey remain separate acceptance.

Automatic checkout remains409 manual_review_required; provider adapter validation cannot record payment. It requires an explicit trusted SlipExpectation (decimal amount, receiver account, currency) and rejects unconfigured, timeout, rejected/malformed/non200, zero/mismatched evidence. Actual provider schema/credentials/integration are NOT VERIFIED. Manual staff review API remains full APPROVED/REJECTED only: atomic order+journal, consistent status/overall_status, no unsupported partial/reversal/production transition.
