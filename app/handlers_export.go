package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"codeberg.org/go-pdf/fpdf"
	"codeberg.org/go-pdf/fpdf/contrib/gofpdi"
	"github.com/go-chi/chi/v5"
	"github.com/vsimakhin/web-logbook/internal/models"
	"github.com/vsimakhin/web-logbook/internal/pdfexport"
)

const exportA4 = "A4"

// validateCustomTitlePdf checks if the uploaded PDF file is supported by fpdf library
func validateCustomTitlePdf(bs []byte) (err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("this PDF file is not supported by pdf library")
		}
	}()

	pdf := fpdf.New("L", "mm", "A4", "")
	imp := gofpdi.NewImporter()

	readSeeker := io.ReadSeeker(bytes.NewReader(bs))
	imp.ImportPageFromStream(pdf, &readSeeker, 1, "/MediaBox")

	return nil
}

// HandlerApiUploadAttachment handles attachments upload
func (app *application) HandlerApiUploadCustomTitle(w http.ResponseWriter, r *http.Request) {
	err := r.ParseMultipartForm(32 << 20)
	if err != nil {
		app.errorLog.Println(fmt.Errorf("cannot parse the data, probably the attachment is too big - %s", err))
		app.handleError(w, err)
		return
	}

	attachment := models.Attachment{
		UUID:     r.PostFormValue("id"),
		RecordID: r.PostFormValue("id"),
	}

	// check attached file
	file, header, err := r.FormFile("document")
	if err != nil {
		if !strings.Contains(err.Error(), "no such file") {
			app.handleError(w, err)
			return
		}
	} else {
		defer file.Close()
		attachment.DocumentName = header.Filename

		// read file
		bs, err := io.ReadAll(file)
		if err != nil {
			app.handleError(w, err)
			return
		}
		attachment.Document = bs
		err = validateCustomTitlePdf(attachment.Document)
		if err != nil {
			app.handleError(w, err)
			return
		}
	}

	// drop the old custom title
	err = app.db.DeleteAttachment(attachment.UUID)
	if err != nil {
		app.handleError(w, err)
		return
	}

	err = app.db.InsertAttachmentRecord(attachment)
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeOkResponse(w, "Attachment has been uploaded")
}

// HandlerExportLogbook serves the GET request for logbook export
func (app *application) HandlerApiExportLogbook(w http.ResponseWriter, r *http.Request) {
	format := chi.URLParam(r, "format")
	if format != exportA4 {
		http.Error(w, "unsupported export format", http.StatusNotFound)
		return
	}

	flightRecords, err := app.db.GetFlightRecordsForExport()
	if err != nil {
		app.handleError(w, err)
		return
	}

	settings, err := app.db.GetSettings()
	if err != nil {
		app.handleError(w, err)
		return
	}

	exportSettings := settings.ExportA4

	var previousExperience models.FlightRecord
	previousExperience.Time.SE = settings.PreviousExperience.SE
	previousExperience.Time.ME = settings.PreviousExperience.ME
	previousExperience.Time.Total = settings.PreviousExperience.Total
	previousExperience.Time.MCC = settings.PreviousExperience.MCC
	previousExperience.Time.Night = settings.PreviousExperience.Night
	previousExperience.Time.IFR = settings.PreviousExperience.IFR
	previousExperience.Time.PIC = settings.PreviousExperience.PIC
	previousExperience.Time.CoPilot = settings.PreviousExperience.CoPilot
	previousExperience.Time.Dual = settings.PreviousExperience.Dual
	previousExperience.Time.Instructor = settings.PreviousExperience.Instructor
	previousExperience.Landings.Day = settings.PreviousExperience.LandingsDay
	previousExperience.Landings.Night = settings.PreviousExperience.LandingsNight
	previousExperience.SIM.Time = settings.PreviousExperience.SimTime

	att, _ := app.db.GetAttachmentByID("custom_title_a4")
	exportSettings.CustomTitleBlob = att.Document

	pdfExporter, err := pdfexport.NewPDFExporter(
		exportA4,
		settings.OwnerName, settings.LicenseNumber, settings.Address, settings.Address2,
		settings.SignatureText, settings.SignatureImage, exportSettings,
		previousExperience,
	)
	if err != nil {
		app.handleError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", "attachment; filename=logbook.pdf")

	if err := pdfExporter.ExportA4(flightRecords, w); err != nil {
		app.handleError(w, err)
	}
}

// HandlerApiPreviewLogbook generates a real PDF preview using the settings
// sent by the UI without persisting them to the database.
func (app *application) HandlerApiPreviewLogbook(w http.ResponseWriter, r *http.Request) {
	format := chi.URLParam(r, "format")
	if format != exportA4 {
		http.Error(w, "unsupported export format", http.StatusNotFound)
		return
	}

	var exportSettings models.ExportPDF
	if err := json.NewDecoder(r.Body).Decode(&exportSettings); err != nil {
		app.handleError(w, err)
		return
	}

	flightRecords, err := app.db.GetFlightRecordsForExport()
	if err != nil {
		app.handleError(w, err)
		return
	}

	settings, err := app.db.GetSettings()
	if err != nil {
		app.handleError(w, err)
		return
	}

	var previousExperience models.FlightRecord
	previousExperience.Time.SE = settings.PreviousExperience.SE
	previousExperience.Time.ME = settings.PreviousExperience.ME
	previousExperience.Time.Total = settings.PreviousExperience.Total
	previousExperience.Time.MCC = settings.PreviousExperience.MCC
	previousExperience.Time.Night = settings.PreviousExperience.Night
	previousExperience.Time.IFR = settings.PreviousExperience.IFR
	previousExperience.Time.PIC = settings.PreviousExperience.PIC
	previousExperience.Time.CoPilot = settings.PreviousExperience.CoPilot
	previousExperience.Time.Dual = settings.PreviousExperience.Dual
	previousExperience.Time.Instructor = settings.PreviousExperience.Instructor
	previousExperience.Landings.Day = settings.PreviousExperience.LandingsDay
	previousExperience.Landings.Night = settings.PreviousExperience.LandingsNight
	previousExperience.SIM.Time = settings.PreviousExperience.SimTime

	att, _ := app.db.GetAttachmentByID("custom_title_a4")
	exportSettings.CustomTitleBlob = att.Document

	pdfExporter, err := pdfexport.NewPDFExporter(
		exportA4,
		settings.OwnerName, settings.LicenseNumber, settings.Address, settings.Address2,
		settings.SignatureText, settings.SignatureImage, exportSettings,
		previousExperience,
	)
	if err != nil {
		app.handleError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", "inline; filename=logbook-preview.pdf")

	if err := pdfExporter.ExportA4(flightRecords, w); err != nil {
		app.handleError(w, err)
	}
}
