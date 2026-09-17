package models

import "fmt"

// DeleteLogbookData removes flight records and data directly attached to them.
// Reference/configuration data (settings, aircraft, persons, licensing, airports,
// custom fields and currency rules) is intentionally preserved.
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
	}

	for _, query := range queries {
		if _, err = tx.ExecContext(ctx, query); err != nil {
			_ = tx.Rollback()
			return fmt.Errorf("delete logbook data: %w", err)
		}
	}

	return tx.Commit()
}
