package models

import "fmt"

// DeleteLogbookData removes the complete personal logbook dataset.
// Application settings, airports, custom fields and currency rules are preserved.
func (m *DBModel) DeleteLogbookData() error {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	tx, err := m.DB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	queries := []string{
		"DELETE FROM attachments",
		"DELETE FROM person_to_log",
		"DELETE FROM logbook",
		"DELETE FROM licensing",
		"DELETE FROM persons",
		"DELETE FROM aircrafts",
		"DELETE FROM aircraft_categories",
		"DELETE FROM deleted_aircrafts",
		"DELETE FROM deleted_aircraft_types",
	}

	for _, query := range queries {
		if _, err = tx.ExecContext(ctx, query); err != nil {
			_ = tx.Rollback()
			return fmt.Errorf("delete logbook data: %w", err)
		}
	}

	return tx.Commit()
}
