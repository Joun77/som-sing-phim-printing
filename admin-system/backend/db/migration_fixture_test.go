package db

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"fmt"
	"os"
	"strings"
	"testing"

	_ "github.com/lib/pq"
)

// parseAndValidateDSN delegates to the exported ParseAndValidateDSN.
func parseAndValidateDSN(rawDSN string) (string, error) {
	return ParseAndValidateDSN(rawDSN)
}

// TestParseAndValidateDSN tests pure no-DB parsing to ensure we reject unsafe DSNs.
func TestParseAndValidateDSN(t *testing.T) {
	tests := []struct {
		name    string
		dsn     string
		wantErr bool
	}{
		{"Valid fixture URL", "postgres://user:pass@localhost:55432/somsing_fixture_db?sslmode=disable", false},
		{"Valid fixture URL 127.0.0.1", "postgresql://user:pass@127.0.0.1:55432/somsing_fixture_db", false},
		{"Keyword DSN rejection", "host=localhost dbname=somsing_fixture_db", true},
		{"Production DB name rejection", "postgres://localhost:55432/somsing_db", true},
		{"Unknown DB name rejection", "postgres://localhost:55432/other_db", true},
		{"Query host override rejection", "postgres://localhost:55432/somsing_fixture_db?host=remote.example", true},
		{"Query dbname override rejection", "postgres://localhost:55432/somsing_fixture_db?dbname=somsing_db", true},
		{"Remote host rejection", "postgres://remote.example/somsing_fixture_db", true},
		{"Shop port rejected", "postgres://localhost:5432/somsing_fixture_db", true},
		{"Default port rejected", "postgres://localhost/somsing_fixture_db", true},
		{"Provider query rejected", "postgres://localhost:55432/somsing_fixture_db?service=shop", true},
		{"Options override rejected", "postgres://localhost:55432/somsing_fixture_db?options=-csearch_path%3Dpublic", true},
		{"Malformed query rejected", "postgres://localhost:55432/somsing_fixture_db?sslmode=%GG", true},
		{"Duplicate query rejected", "postgres://localhost:55432/somsing_fixture_db?sslmode=disable&sslmode=require", true},
		{"Encoded database rejected", "postgres://localhost:55432/%73omsing_fixture_db", true},
		{"Fragment rejected", "postgres://localhost:55432/somsing_fixture_db#shop", true},
		{"Valid bounded timeout", "postgres://localhost:55432/somsing_fixture_db?sslmode=disable&connect_timeout=5", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := parseAndValidateDSN(tt.dsn)
			if (err != nil) != tt.wantErr {
				t.Errorf("parseAndValidateDSN() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

// TestMigration043_IsolatedFixture (Not Verified Until Safe Isolated Runtime Execution)
// This fixture runs the ACTUAL Postgres migration sequence 043 on a disposable generated schema
// confined by a dedicated search_path. It verifies legacy empty-string behaviors, duplicate token
// restrictions, and reconnection persistence.
func TestMigration043_IsolatedFixture(t *testing.T) {
	fixtureDSN := os.Getenv("TEST_FIXTURE_DSN")
	if fixtureDSN == "" {
		t.Skip("TEST_FIXTURE_DSN not provided. Skipping isolated Postgres migration test.")
	}

	// A1: parse DSN and validate actual host plus explicit dedicated test database identity before connecting; no live/default DSN fallback.
	canonicalDSN, err := parseAndValidateDSN(fixtureDSN)
	if err != nil {
		t.Fatalf("Invalid TEST_FIXTURE_DSN: %v", err)
	}

	testDB, err := sql.Open("postgres", canonicalDSN)
	if err != nil {
		t.Fatalf("Failed to open fixture DB: %v", err)
	}

	// A3: cleanup runs before connection/pool close
	t.Cleanup(func() {
		if err := testDB.Close(); err != nil {
			t.Logf("Failed to close DB pool: %v", err)
		}
	})

	// Ping failure when opt-in must fail not skip
	if err := testDB.Ping(); err != nil {
		t.Fatalf("Fixture DB ping failed: %v", err)
	}

	ctx := context.Background()

	// A2: use acquired dedicated sql.Conn for all session-scoped setup/migration/assertions
	conn, err := testDB.Conn(ctx)
	if err != nil {
		t.Fatalf("Failed to acquire dedicated connection: %v", err)
	}
	t.Cleanup(func() {
		conn.Close()
	})

	// Create disposable generated schema
	randBytes := make([]byte, 4)
	rand.Read(randBytes)
	schemaName := fmt.Sprintf("fixture_schema_%s", hex.EncodeToString(randBytes))

	_, err = conn.ExecContext(ctx, fmt.Sprintf("CREATE SCHEMA %s;", schemaName))
	if err != nil {
		t.Fatalf("Failed to create disposable schema %s: %v", schemaName, err)
	}

	// A3: cleanup runs before connection/pool close, targets generated schema only, and cleanup failure fails test.
	t.Cleanup(func() {
		// Use a separate connection from pool for cleanup to guarantee it works even if main conn transaction aborted
		cleanupConn, err := testDB.Conn(ctx)
		if err != nil {
			t.Fatalf("Cleanup failed to acquire connection: %v", err)
		}
		defer cleanupConn.Close()
		_, err = cleanupConn.ExecContext(ctx, fmt.Sprintf("DROP SCHEMA %s CASCADE;", schemaName))
		if err != nil {
			t.Fatalf("Failed to drop schema %s during cleanup: %v", schemaName, err)
		}
	})

	// Dedicated connection search_path confined to that schema
	_, err = conn.ExecContext(ctx, fmt.Sprintf("SET search_path TO %s;", schemaName))
	if err != nil {
		t.Fatalf("Failed to set search_path to %s: %v", schemaName, err)
	}

	// Setup prerequisite orders table in the isolated schema before applying 043
	_, err = conn.ExecContext(ctx, `
		CREATE TABLE orders (
			id VARCHAR(100) PRIMARY KEY,
			order_no VARCHAR(100)
		);
	`)
	if err != nil {
		t.Fatalf("Failed to setup prerequisite orders table in schema %s: %v", schemaName, err)
	}

	// Execute actual043 file content
	migrationContent, err := os.ReadFile("../migrations/043_add_public_tracking_token_to_orders.sql")
	if err != nil {
		// Try alternative path if run from project root
		migrationContent, err = os.ReadFile("migrations/043_add_public_tracking_token_to_orders.sql")
		if err != nil {
			t.Fatalf("Failed to read actual 043 migration file: %v", err)
		}
	}

	upSection := extractUpSection(string(migrationContent))
	if upSection == "" {
		t.Fatalf("Failed to extract Up section from 043 migration")
	}

	_, err = conn.ExecContext(ctx, upSection)
	if err != nil {
		t.Fatalf("Failed to execute actual 043 migration content: %v\nSQL: %s", err, upSection)
	}

	// Insert legacy empty tracking tokens (Should succeed multiple times)
	_, err = conn.ExecContext(ctx, `INSERT INTO orders (id, order_no, public_tracking_token) VALUES ('ord-1', 'ORD-001', '')`)
	if err != nil {
		t.Fatalf("Failed to insert first empty token: %v", err)
	}

	_, err = conn.ExecContext(ctx, `INSERT INTO orders (id, order_no, public_tracking_token) VALUES ('ord-2', 'ORD-002', '')`)
	if err != nil {
		t.Fatalf("Failed to insert second empty token (partial index should allow this): %v", err)
	}

	_, err = conn.ExecContext(ctx, `INSERT INTO orders (id, order_no, public_tracking_token) VALUES ('ord-3', 'ORD-003', NULL)`)
	if err != nil {
		t.Fatalf("Failed to insert NULL token: %v", err)
	}

	// Insert unique tokens
	_, err = conn.ExecContext(ctx, `INSERT INTO orders (id, order_no, public_tracking_token) VALUES ('ord-4', 'ORD-004', 'VALID_TOKEN_A')`)
	if err != nil {
		t.Fatalf("Failed to insert unique token A: %v", err)
	}

	// Duplicate token restriction (Should fail)
	_, err = conn.ExecContext(ctx, `INSERT INTO orders (id, order_no, public_tracking_token) VALUES ('ord-6', 'ORD-006', 'VALID_TOKEN_A')`)
	if err == nil {
		t.Fatalf("Expected constraint violation when inserting duplicate 'VALID_TOKEN_A', but it succeeded")
	} else if !strings.Contains(err.Error(), "unique constraint") {
		t.Fatalf("Expected unique constraint violation, got: %v", err)
	}

	// Add persistence/reconnect read fixture using a new dedicated sql.Conn
	reconnectConn, err := testDB.Conn(ctx)
	if err != nil {
		t.Fatalf("Failed to open read reconnect DB conn: %v", err)
	}
	defer reconnectConn.Close()

	_, err = reconnectConn.ExecContext(ctx, fmt.Sprintf("SET search_path TO %s;", schemaName))
	if err != nil {
		t.Fatalf("Failed to set search_path on read connection: %v", err)
	}

	var readToken string
	err = reconnectConn.QueryRowContext(ctx, `SELECT public_tracking_token FROM orders WHERE id = 'ord-4'`).Scan(&readToken)
	if err != nil {
		t.Fatalf("Failed to read persisted token: %v", err)
	}
	if readToken != "VALID_TOKEN_A" {
		t.Fatalf("Expected token VALID_TOKEN_A, got %s", readToken)
	}
}
