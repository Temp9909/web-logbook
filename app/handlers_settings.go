package main

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/vsimakhin/web-logbook/internal/models"
)

func (app *application) HandlerApiSettingsList(w http.ResponseWriter, r *http.Request) {
	settings, err := app.db.GetSettings()
	if err != nil {
		app.handleError(w, err)
		return
	}

	settings.Hash = ""
	// SecretKey is an internal authentication secret and is never exposed in Settings.
	settings.SecretKey = ""
	app.writeJSON(w, http.StatusOK, settings)
}

func (app *application) HandlerApiSettingsUpdate(w http.ResponseWriter, r *http.Request) {
	oldsettings, err := app.db.GetSettings()
	if err != nil {
		app.handleError(w, err)
		return
	}

	var settings models.Settings
	err = json.NewDecoder(r.Body).Decode(&settings)
	if err != nil {
		app.handleError(w, err)
		return
	}

	// rewrite export settings since they are set from /export page
	settings.ExportA4 = oldsettings.ExportA4
	// Signature image is also updated separately
	settings.SignatureImage = oldsettings.SignatureImage

	// These settings are no longer user-facing. Keep authentication secret server-side
	// and use one fixed time/totals presentation throughout the app.
	settings.SecretKey = oldsettings.SecretKey
	// Airport data is no longer user-configurable. Keep the fixed background source.
	settings.AirportDBSource = models.DefaultAirportDBSource
	settings.NoICAOFilter = true
	if settings.AuthEnabled && settings.SecretKey == "" {
		key := make([]byte, 32)
		if _, err = rand.Read(key); err != nil {
			app.handleError(w, err)
			return
		}
		settings.SecretKey = base64.RawURLEncoding.EncodeToString(key)
	}

	err = app.db.UpdateSettings(settings)
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeOkResponse(w, "Settings updated")
}

func (app *application) HandlerApiSettingsSignature(w http.ResponseWriter, r *http.Request) {
	oldsettings, err := app.db.GetSettings()
	if err != nil {
		app.handleError(w, err)
		return
	}

	var settings models.Settings
	err = json.NewDecoder(r.Body).Decode(&settings)
	if err != nil {
		app.handleError(w, err)
		return
	}

	oldsettings.SignatureImage = settings.SignatureImage
	err = app.db.UpdateSettings(oldsettings)
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeOkResponse(w, "Signature updated")
}

func (app *application) HandlerApiSettingsExportDefaults(w http.ResponseWriter, r *http.Request) {
	format := chi.URLParam(r, "format")
	if format != "A4" {
		http.Error(w, "unsupported export format", http.StatusNotFound)
		return
	}
	defaults := app.db.GetPdfDefaults()
	app.writeJSON(w, http.StatusOK, defaults)
}

func (app *application) HandlerApiSettingsExportUpdate(w http.ResponseWriter, r *http.Request) {
	format := chi.URLParam(r, "format")

	s, err := app.db.GetSettings()
	if err != nil {
		app.handleError(w, err)
		return
	}

	var updated models.ExportPDF
	err = json.NewDecoder(r.Body).Decode(&updated)
	if err != nil {
		app.handleError(w, err)
		return
	}

	if format != "A4" {
		http.Error(w, "unsupported export format", http.StatusNotFound)
		return
	}

	targetExport := &s.ExportA4

	targetExport.LogbookRows = updated.LogbookRows
	targetExport.Fill = updated.Fill
	targetExport.LeftMargin = updated.LeftMargin
	targetExport.TopMargin = updated.TopMargin
	targetExport.BodyRow = updated.BodyRow
	targetExport.FooterRow = updated.FooterRow
	targetExport.LeftMarginA = updated.LeftMarginA
	targetExport.LeftMarginB = updated.LeftMarginB
	targetExport.Headers = updated.Headers
	targetExport.Columns = updated.Columns
	targetExport.ReplaceSPTime = updated.ReplaceSPTime
	targetExport.IncludeSignature = updated.IncludeSignature
	targetExport.IsExtended = updated.IsExtended

	err = app.db.UpdateSettings(s)
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeOkResponse(w, "Export settings updated")
}

func (app *application) HandlerApiSettingsFieldsDefaults(w http.ResponseWriter, r *http.Request) {
	defaults := app.db.GetStandardFieldsHeaders()
	app.writeJSON(w, http.StatusOK, defaults)
}
