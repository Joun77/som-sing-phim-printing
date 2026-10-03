package db

import (
	"testing"
)

func TestInitDB_TestModeNeverUsesBusinessDSN(t *testing.T) {
	for _, dsn := range []string{"", "postgres://localhost:5432/somsing_db", "postgres://localhost:5432/somsing_fixture_db", "postgres://remote.invalid:55432/somsing_fixture_db"} {
		t.Run(dsn, func(t *testing.T) {
			t.Setenv("ENVIRONMENT", "test")
			t.Setenv("DATABASE_URL", "postgres://fixture:fixture@localhost:5432/somsing_db")
			t.Setenv("TEST_FIXTURE_DSN", dsn)
			previous := DB
			t.Cleanup(func() { DB = previous })
			got, err := InitDB()
			if got != nil || err == nil || DB != nil {
				t.Fatal("test-mode fallback accepted unsafe/default DSN")
			}
		})
	}
}
