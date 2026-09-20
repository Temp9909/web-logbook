package driver

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	_ "embed"

	_ "github.com/go-sql-driver/mysql"
	"github.com/vsimakhin/web-logbook/internal/models"
	_ "modernc.org/sqlite"
)

const (
	DefaultOwnerName     = "Owner Name"
	DefaultSignatureText = "I certify that the entries in this log are true."
)

func OpenDB(engine string, dsn string) (*sql.DB, error) {
	db, err := sql.Open(engine, dsn)
	if err != nil {
		return nil, err
	}

	err = db.Ping()
	if err != nil {
		return nil, err
	}

	err = validateDB(db, engine)
	if err != nil {
		return nil, err
	}

	return db, nil
}

// validateDB creates db structure in case it's a first run and the schema is empty
func validateDB(db *sql.DB, engine string) error {
	metadataTable.initTable(db, engine)
	isNewSchema, previousVersion := newShema(db)
	if isNewSchema {
		// check tables
		tables := []*Table{logbookTable, airportsTable, customAirportsTable,
			settingsTable, licensingTable, attachmentsTable, tokensTable,
			aircraftsTable, aircraftCategoriesTable, deletedAircraftsTable, deletedAircraftTypesTable, currencyTable,
			customFieldsTable, personsTable, personToLogTable,
		}

		for _, table := range tables {
			if err := table.initTable(db, engine); err != nil {
				return err
			}
		}

		// check views
		views := []*View{logbookView, airportsView, aircraftsView, logbookStatsView, attachmentsView}
		for _, view := range views {
			if err := view.initView(db, engine); err != nil {
				return err
			}
		}

		// check settings table it's not empty
		err := checkSettingsTable(db)
		if err != nil {
			return err
		}

		// Version 47 changes both licence-alert switches from their historical
		// zero-value default (off) to the requested default (on). Apply it once
		// to existing databases; later user choices remain untouched.
		if shouldEnableLicenseAlertDefaults(previousVersion) {
			if err := enableLicenseAlertDefaults(db); err != nil {
				return err
			}
		}

		// update schema version
		err = updateSchemaVersion(db)
		if err != nil {
			return err
		}
	}

	return nil
}

func newShema(db *sql.DB) (bool, string) {
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	query := "SELECT version FROM metadata ORDER BY created_at DESC LIMIT 1"
	var version string
	err := db.QueryRowContext(ctx, query).Scan(&version)
	if err != nil {
		if err == sql.ErrNoRows {
			fmt.Printf("No rows found in 'metadata'. Initializing version %s...\n", schemaVersion)
			return true, ""
		}
		fmt.Println(err)
		return true, ""
	}

	if version != schemaVersion {
		fmt.Printf("Schema version (%s) mismatch. Initializing version %s...\n", version, schemaVersion)
		return true, version
	}

	return false, version
}

func shouldEnableLicenseAlertDefaults(previousVersion string) bool {
	previous, err := strconv.Atoi(previousVersion)
	if err != nil {
		return false
	}
	current, err := strconv.Atoi(schemaVersion)
	return err == nil && previous < 47 && current >= 47
}

func enableLicenseAlertDefaults(db *sql.DB) error {
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	var raw string
	if err := db.QueryRowContext(ctx, "SELECT settings FROM settings2 WHERE id=0").Scan(&raw); err != nil {
		return err
	}

	var settings models.Settings
	if err := json.Unmarshal([]byte(raw), &settings); err != nil {
		return err
	}
	settings.LicensesExpiration.ShowWarning = true
	settings.LicensesExpiration.ShowExpired = true
	if settings.LicensesExpiration.WarningPeriod <= 0 {
		settings.LicensesExpiration.WarningPeriod = 90
	}

	out, err := json.Marshal(settings)
	if err != nil {
		return err
	}
	_, err = db.ExecContext(ctx, "UPDATE settings2 SET settings = ? WHERE id = 0", string(out))
	return err
}

func updateSchemaVersion(db *sql.DB) error {
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	query := "INSERT INTO metadata (version, created_at) VALUES (?,?)"
	_, err := db.ExecContext(ctx, query, schemaVersion, time.Now().Format("20060102 15:04:05"))
	return err
}

// checkSettingsTable verifies the proper transition to the new settings table
func checkSettingsTable(db *sql.DB) error {
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	var s models.Settings

	// check settings table (first app run)
	var rowsCount int
	row := db.QueryRowContext(ctx, "SELECT COUNT(*) FROM settings2")

	if err := row.Scan(&rowsCount); err != nil {
		return err
	}

	if rowsCount == 0 {
		// default values
		s.OwnerName = DefaultOwnerName
		s.SignatureText = DefaultSignatureText
		s.LicensesExpiration.ShowWarning = true
		s.LicensesExpiration.ShowExpired = true
		s.LicensesExpiration.WarningPeriod = 90

		out, err := json.Marshal(s)
		if err != nil {
			return err
		}

		_, err = db.ExecContext(ctx, "INSERT INTO settings2 (id, settings) VALUES (0, ?)", string(out))
		return err
	}

	return nil
}
