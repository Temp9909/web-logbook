package models

import (
	"encoding/json"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

// GetSettings returns settings parameters
func (m *DBModel) GetSettings() (settings Settings, err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	var raw string

	query := "SELECT settings FROM settings2 WHERE id=0"
	row := m.DB.QueryRowContext(ctx, query)
	if err = row.Scan(&raw); err != nil {
		return settings, err
	}

	if err = json.Unmarshal([]byte(raw), &settings); err != nil {
		return settings, err
	}

	// License alerts default to enabled. Probe the raw JSON so an explicit
	// false chosen by the user is preserved, while older databases that do not
	// contain these keys get the new default automatically.
	type licenseExpirationPresence struct {
		ShowExpired *bool `json:"show_expired"`
		ShowWarning *bool `json:"show_warning"`
	}
	var presence struct {
		LicensesExpiration *licenseExpirationPresence `json:"licenses_expiration"`
	}
	if probeErr := json.Unmarshal([]byte(raw), &presence); probeErr == nil {
		if presence.LicensesExpiration == nil || presence.LicensesExpiration.ShowWarning == nil {
			settings.LicensesExpiration.ShowWarning = true
		}
		if presence.LicensesExpiration == nil || presence.LicensesExpiration.ShowExpired == nil {
			settings.LicensesExpiration.ShowExpired = true
		}
	}
	if settings.LicensesExpiration.WarningPeriod <= 0 {
		settings.LicensesExpiration.WarningPeriod = 90
	}

	return settings, nil
}

// UpdateSettings writes new settings values
func (m *DBModel) UpdateSettings(settings Settings) error {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	// check password field
	pwd := strings.TrimSpace(settings.Password)
	if pwd != "" {
		hash, err := bcrypt.GenerateFromPassword([]byte(pwd), 12)
		if err != nil {
			return err
		}

		settings.Hash = string(hash)
		settings.Password = ""
	} else {
		// keep old hash
		oldSettings, err := m.GetSettings()
		if err != nil {
			return err
		}
		settings.Hash = oldSettings.Hash
	}

	out, err := json.Marshal(settings)
	if err != nil {
		return err
	}

	query := "UPDATE settings2 SET settings = ? WHERE id = 0"
	_, err = m.DB.ExecContext(ctx, query, string(out))
	if err != nil {
		return err
	}

	authCache.Clear()

	return nil
}

func (m *DBModel) GetPdfDefaults() (pdfDefaults ExportPDF) {
	pdfDefaults = pdfA4Defaults
	pdfDefaults.Columns = pdfA4DefaultColumns
	pdfDefaults.Headers = pdfDefaultHeaders

	return pdfDefaults
}

func (m *DBModel) GetStandardFieldsHeaders() ColumnsHeader {
	return standardFieldsHeaders
}
