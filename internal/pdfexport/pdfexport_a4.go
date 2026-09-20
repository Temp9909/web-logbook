package pdfexport

import (
	"io"
	"strings"

	"github.com/vsimakhin/web-logbook/internal/models"
)

// This file renders the AMC1 FCL.050 pilot-logbook spread used in the
// November 2025 Easy Access Rules for Aircrew. One set of 12 entries is
// rendered over two A4 landscape pages: columns 1-8, then columns 9-12.

const easaHeaderNumberHeight = 5.0
const easaHeaderMainHeight = 7.0
const easaHeaderSubHeight = 8.0

// exportA4 creates an A4 landscape PDF using the EASA pilot-logbook layout.
func (p *PDFExporter) ExportA4(flightRecords []models.FlightRecord, w io.Writer) error {
	if err := p.initPDF(); err != nil {
		return err
	}

	p.rowCounter = 0
	p.pageCounter = 1
	p.titlePage()

	// GetFlightRecordsForExport is newest-first. EASA logbooks read oldest-first.
	ordered := make([]models.FlightRecord, 0, len(flightRecords))
	for i := len(flightRecords) - 1; i >= 0; i-- {
		record := flightRecords[i]
		if record.Time.MCC != "" {
			record.Time.ME = ""
		}
		ordered = append(ordered, record)
	}

	// Keep one blank spread for an empty logbook, just as the former exporter
	// always produced an empty logbook page after the title page.
	if len(ordered) == 0 {
		p.totalPage = EmptyTotals()
		p.printEASALeftPage(nil)
		p.pageCounter++
		p.printEASARightPage(nil)
		return p.pdf.Output(w)
	}

	for start := 0; start < len(ordered); start += EASALogbookRows {
		end := start + EASALogbookRows
		if end > len(ordered) {
			end = len(ordered)
		}
		batch := ordered[start:end]

		p.totalPage = EmptyTotals()
		for _, record := range batch {
			p.totalPage = models.CalculateTotals(p.totalPage, record)
			p.totalTime = models.CalculateTotals(p.totalTime, record)
		}

		p.printEASALeftPage(batch)
		p.pageCounter++
		p.printEASARightPage(batch)

		p.totalPrevious = p.totalTime
		if end < len(ordered) {
			p.pageCounter++
		}
	}

	return p.pdf.Output(w)
}

func (p *PDFExporter) easaTableWidth() float64 {
	return 297.0 - (2 * p.Export.LeftMargin)
}

func scaleWidths(total float64, ratios ...float64) []float64 {
	result := make([]float64, len(ratios))
	for i, ratio := range ratios {
		result[i] = total * ratio
	}
	return result
}

func (p *PDFExporter) headerCell(x, y, w, h float64, text string) {
	p.pdf.Rect(x, y, w, h, "FD")
	if strings.TrimSpace(text) == "" {
		return
	}
	lines := strings.Count(text, "\n") + 1
	lineH := 3.0
	textH := float64(lines) * lineH
	textY := y + (h-textH)/2
	if textY < y+0.5 {
		textY = y + 0.5
	}
	p.pdf.SetXY(x, textY)
	p.pdf.MultiCell(w, lineH, text, "", "C", false)
}

func (p *PDFExporter) drawNumberHeader(x, y, w float64, number string) {
	p.headerCell(x, y, w, easaHeaderNumberHeight, number)
}

func (p *PDFExporter) printEASALeftHeader(widths []float64) {
	p.pdf.AddPage()
	p.setFontLogbookHeader()

	x := p.Export.LeftMargin
	y := p.Export.TopMargin
	mainY := y + easaHeaderNumberHeight
	subY := mainY + easaHeaderMainHeight
	fullLower := easaHeaderMainHeight + easaHeaderSubHeight

	// 1 - DATE
	p.drawNumberHeader(x, y, widths[0], "1")
	p.headerCell(x, mainY, widths[0], fullLower, "DATE\n(dd/mm/yy)")
	x += widths[0]

	// 2 - DEPARTURE
	p.drawNumberHeader(x, y, widths[1], "2")
	p.headerCell(x, mainY, widths[1], easaHeaderMainHeight, "DEPARTURE")
	dep := scaleWidths(widths[1], 0.51, 0.49)
	p.headerCell(x, subY, dep[0], easaHeaderSubHeight, "PLACE")
	p.headerCell(x+dep[0], subY, dep[1], easaHeaderSubHeight, "TIME")
	x += widths[1]

	// 3 - ARRIVAL
	p.drawNumberHeader(x, y, widths[2], "3")
	p.headerCell(x, mainY, widths[2], easaHeaderMainHeight, "ARRIVAL")
	arr := scaleWidths(widths[2], 0.51, 0.49)
	p.headerCell(x, subY, arr[0], easaHeaderSubHeight, "PLACE")
	p.headerCell(x+arr[0], subY, arr[1], easaHeaderSubHeight, "TIME")
	x += widths[2]

	// 4 - AIRCRAFT
	p.drawNumberHeader(x, y, widths[3], "4")
	p.headerCell(x, mainY, widths[3], easaHeaderMainHeight, "AIRCRAFT")
	aircraft := scaleWidths(widths[3], 0.50, 0.50)
	p.headerCell(x, subY, aircraft[0], easaHeaderSubHeight, "MAKE, MODEL,\nVARIANT")
	p.headerCell(x+aircraft[0], subY, aircraft[1], easaHeaderSubHeight, "REGISTRATION")
	x += widths[3]

	// 5 - SINGLE-PILOT / MULTI-PILOT TIME
	p.drawNumberHeader(x, y, widths[4], "5")
	five := scaleWidths(widths[4], 0.49, 0.51)
	p.headerCell(x, mainY, five[0], easaHeaderMainHeight, "SINGLE-PILOT\nTIME")
	sp := scaleWidths(five[0], 0.50, 0.50)
	p.headerCell(x, subY, sp[0], easaHeaderSubHeight, "SE")
	p.headerCell(x+sp[0], subY, sp[1], easaHeaderSubHeight, "ME")
	p.headerCell(x+five[0], mainY, five[1], fullLower, "MULTI-PILOT\nTIME")
	x += widths[4]

	// 6 - TOTAL TIME OF FLIGHT
	p.drawNumberHeader(x, y, widths[5], "6")
	p.headerCell(x, mainY, widths[5], fullLower, "TOTAL TIME\nOF FLIGHT")
	x += widths[5]

	// 7 - NAME(S) PIC
	p.drawNumberHeader(x, y, widths[6], "7")
	p.headerCell(x, mainY, widths[6], fullLower, "NAME(S)\nPIC")
	x += widths[6]

	// 8 - LANDINGS
	p.drawNumberHeader(x, y, widths[7], "8")
	p.headerCell(x, mainY, widths[7], easaHeaderMainHeight, "LANDINGS")
	land := scaleWidths(widths[7], 0.50, 0.50)
	p.headerCell(x, subY, land[0], easaHeaderSubHeight, "DAY")
	p.headerCell(x+land[0], subY, land[1], easaHeaderSubHeight, "NIGHT")

	p.pdf.SetY(y + easaHeaderNumberHeight + fullLower)
}

func (p *PDFExporter) printEASARightHeader(widths []float64) {
	p.pdf.AddPage()
	p.setFontLogbookHeader()

	x := p.Export.LeftMargin
	y := p.Export.TopMargin
	mainY := y + easaHeaderNumberHeight
	subY := mainY + easaHeaderMainHeight
	fullLower := easaHeaderMainHeight + easaHeaderSubHeight

	// 9 - OPERATIONAL CONDITION TIME
	p.drawNumberHeader(x, y, widths[0], "9")
	p.headerCell(x, mainY, widths[0], easaHeaderMainHeight, "OPERATIONAL CONDITION TIME")
	nine := scaleWidths(widths[0], 0.50, 0.50)
	p.headerCell(x, subY, nine[0], easaHeaderSubHeight, "NIGHT")
	p.headerCell(x+nine[0], subY, nine[1], easaHeaderSubHeight, "IFR")
	x += widths[0]

	// 10 - PILOT FUNCTION TIME
	p.drawNumberHeader(x, y, widths[1], "10")
	p.headerCell(x, mainY, widths[1], easaHeaderMainHeight, "PILOT FUNCTION TIME")
	ten := scaleWidths(widths[1], 0.25, 0.25, 0.25, 0.25)
	labels := []string{"PIC", "CO-PILOT", "DUAL", "INSTRUCTOR"}
	for i := range ten {
		p.headerCell(x, subY, ten[i], easaHeaderSubHeight, labels[i])
		x += ten[i]
	}

	// 11 - FSTD SESSION
	p.drawNumberHeader(x, y, widths[2], "11")
	p.headerCell(x, mainY, widths[2], easaHeaderMainHeight, "FSTD SESSION")
	eleven := scaleWidths(widths[2], 0.36, 0.32, 0.32)
	p.headerCell(x, subY, eleven[0], easaHeaderSubHeight, "DATE\n(dd/mm/yy)")
	p.headerCell(x+eleven[0], subY, eleven[1], easaHeaderSubHeight, "TYPE")
	p.headerCell(x+eleven[0]+eleven[1], subY, eleven[2], easaHeaderSubHeight, "TOTAL TIME\nOF SESSION")
	x += widths[2]

	// 12 - REMARKS AND ENDORSEMENTS
	p.drawNumberHeader(x, y, widths[3], "12")
	p.headerCell(x, mainY, widths[3], fullLower, "REMARKS AND\nENDORSEMENTS")

	p.pdf.SetY(y + easaHeaderNumberHeight + fullLower)
}

func splitTime(value string) (string, string) {
	value = strings.TrimSpace(value)
	if value == "" || value == "0" || value == "0:00" || value == "00:00" {
		return "", ""
	}
	parts := strings.Split(value, ":")
	if len(parts) != 2 {
		return value, ""
	}
	return parts[0], parts[1]
}

func (p *PDFExporter) printEASATimeCell(w float64, value string, fill bool) {
	if w <= 0 {
		return
	}
	hours, minutes := splitTime(p.formatTimeField(value))
	half := w / 2
	p.pdf.CellFormat(half, p.Export.BodyRow, hours, "1", 0, "C", fill, 0, "")
	p.pdf.CellFormat(w-half, p.Export.BodyRow, minutes, "1", 0, "C", fill, 0, "")
}

func (p *PDFExporter) printEASAFooterTimeCell(w float64, value string) {
	if w <= 0 {
		return
	}
	hours, minutes := splitTime(p.formatTimeField(value))
	half := w / 2
	p.pdf.CellFormat(half, p.Export.FooterRow, hours, "1", 0, "C", true, 0, "")
	p.pdf.CellFormat(w-half, p.Export.FooterRow, minutes, "1", 0, "C", true, 0, "")
}

func (p *PDFExporter) printEASALeftBodyRow(record models.FlightRecord, widths []float64, rowIndex int) {
	p.rowCounter = rowIndex + 1
	fill := p.isFillLine()
	p.setFontLogbookBody()
	p.pdf.SetX(p.Export.LeftMargin)

	flightDate := ""
	if !isFSTDRecord(record) {
		flightDate = formatLogbookDate(record.Date)
	}
	p.printBodyTimeCell(widths[0], flightDate, fill)

	dep := scaleWidths(widths[1], 0.51, 0.49)
	p.printBodyTimeCell(dep[0], record.Departure.Place, fill)
	p.printBodyTimeCell(dep[1], record.Departure.Time, fill)

	arr := scaleWidths(widths[2], 0.51, 0.49)
	p.printBodyTimeCell(arr[0], record.Arrival.Place, fill)
	p.printBodyTimeCell(arr[1], record.Arrival.Time, fill)

	aircraft := scaleWidths(widths[3], 0.50, 0.50)
	p.printBodyTimeCell(aircraft[0], record.Aircraft.Model, fill)
	p.printBodyTimeCell(aircraft[1], record.Aircraft.Reg, fill)

	five := scaleWidths(widths[4], 0.49, 0.51)
	sp := scaleWidths(five[0], 0.50, 0.50)
	if p.Export.ReplaceSPTime && record.Time.SE != "" && record.Time.SE != "0:00" && record.Time.SE != "00:00" {
		p.printSinglePilotTime(sp[0], record.Time.SE, fill)
	} else {
		p.printEASATimeCell(sp[0], record.Time.SE, fill)
	}
	if p.Export.ReplaceSPTime && record.Time.ME != "" && record.Time.ME != "0:00" && record.Time.ME != "00:00" {
		p.printSinglePilotTime(sp[1], record.Time.ME, fill)
	} else {
		p.printEASATimeCell(sp[1], record.Time.ME, fill)
	}
	p.printEASATimeCell(five[1], record.Time.MCC, fill)
	p.printEASATimeCell(widths[5], record.Time.Total, fill)
	p.printBodyTextCell(widths[6], record.PIC, fill)

	land := scaleWidths(widths[7], 0.50, 0.50)
	p.printBodyTimeCell(land[0], formatLandings(record.Landings.Day), fill)
	p.printBodyTimeCell(land[1], formatLandings(record.Landings.Night), fill)
	p.pdf.Ln(-1)
}

func (p *PDFExporter) printEASARightBodyRow(record models.FlightRecord, widths []float64, rowIndex int) {
	p.rowCounter = rowIndex + 1
	fill := p.isFillLine()
	p.setFontLogbookBody()
	p.pdf.SetX(p.Export.LeftMargin)

	nine := scaleWidths(widths[0], 0.50, 0.50)
	p.printEASATimeCell(nine[0], record.Time.Night, fill)
	p.printEASATimeCell(nine[1], record.Time.IFR, fill)

	ten := scaleWidths(widths[1], 0.25, 0.25, 0.25, 0.25)
	p.printEASATimeCell(ten[0], record.Time.PIC, fill)
	p.printEASATimeCell(ten[1], record.Time.CoPilot, fill)
	p.printEASATimeCell(ten[2], record.Time.Dual, fill)
	p.printEASATimeCell(ten[3], record.Time.Instructor, fill)

	eleven := scaleWidths(widths[2], 0.36, 0.32, 0.32)
	fstdDate := ""
	if isFSTDRecord(record) {
		fstdDate = formatLogbookDate(record.Date)
	}
	p.printBodyTimeCell(eleven[0], fstdDate, fill)
	p.printBodyTimeCell(eleven[1], record.SIM.Type, fill)
	p.printEASATimeCell(eleven[2], record.SIM.Time, fill)
	p.printBodyRemarksCell(widths[3], record.Remarks, record.Signature, record.UUID, fill)
	p.pdf.Ln(-1)
}

func (p *PDFExporter) printEASALeftFooterRow(label string, total models.FlightRecord, widths []float64) {
	p.setFontLogbookFooter()
	p.pdf.SetX(p.Export.LeftMargin)

	// Columns 1-3 and the MAKE/MODEL/VARIANT half of column 4 are blank.
	aircraft := scaleWidths(widths[3], 0.50, 0.50)
	blankWidth := widths[0] + widths[1] + widths[2] + aircraft[0]
	p.pdf.CellFormat(blankWidth, p.Export.FooterRow, "", "1", 0, "C", true, 0, "")
	p.pdf.CellFormat(aircraft[1], p.Export.FooterRow, label, "1", 0, "C", true, 0, "")

	five := scaleWidths(widths[4], 0.49, 0.51)
	sp := scaleWidths(five[0], 0.50, 0.50)
	p.printEASAFooterTimeCell(sp[0], total.Time.SE)
	p.printEASAFooterTimeCell(sp[1], total.Time.ME)
	p.printEASAFooterTimeCell(five[1], total.Time.MCC)
	p.printEASAFooterTimeCell(widths[5], total.Time.Total)
	p.pdf.CellFormat(widths[6], p.Export.FooterRow, "", "1", 0, "C", true, 0, "")
	land := scaleWidths(widths[7], 0.50, 0.50)
	p.pdf.CellFormat(land[0], p.Export.FooterRow, formatLandings(total.Landings.Day), "1", 0, "C", true, 0, "")
	p.pdf.CellFormat(land[1], p.Export.FooterRow, formatLandings(total.Landings.Night), "1", 0, "C", true, 0, "")
	p.pdf.Ln(-1)
}

func (p *PDFExporter) printEASARightTotalsRow(total models.FlightRecord, widths []float64) {
	p.setFontLogbookFooter()
	p.pdf.SetX(p.Export.LeftMargin)
	nine := scaleWidths(widths[0], 0.50, 0.50)
	p.printEASAFooterTimeCell(nine[0], total.Time.Night)
	p.printEASAFooterTimeCell(nine[1], total.Time.IFR)
	ten := scaleWidths(widths[1], 0.25, 0.25, 0.25, 0.25)
	p.printEASAFooterTimeCell(ten[0], total.Time.PIC)
	p.printEASAFooterTimeCell(ten[1], total.Time.CoPilot)
	p.printEASAFooterTimeCell(ten[2], total.Time.Dual)
	p.printEASAFooterTimeCell(ten[3], total.Time.Instructor)
	eleven := scaleWidths(widths[2], 0.36, 0.32, 0.32)
	p.pdf.CellFormat(eleven[0], p.Export.FooterRow, "", "1", 0, "C", true, 0, "")
	p.pdf.CellFormat(eleven[1], p.Export.FooterRow, "", "1", 0, "C", true, 0, "")
	p.printEASAFooterTimeCell(eleven[2], total.SIM.Time)
}

func (p *PDFExporter) printEASARightFooter(widths []float64) {
	startX, startY := p.pdf.GetXY()
	remarksX := p.Export.LeftMargin + widths[0] + widths[1] + widths[2]

	// Totals for columns 9-11.
	p.printEASARightTotalsRow(p.totalPage, widths)
	p.pdf.SetY(startY + p.Export.FooterRow)
	p.printEASARightTotalsRow(p.totalPrevious, widths)
	p.pdf.SetY(startY + 2*p.Export.FooterRow)
	p.printEASARightTotalsRow(p.totalTime, widths)

	// Column 12 certification/signature block from the EASA model.
	p.setFontLogbookFooter()
	p.pdf.SetXY(remarksX, startY)
	p.pdf.Rect(remarksX, startY, widths[3], 2*p.Export.FooterRow, "FD")
	p.pdf.SetXY(remarksX+1, startY+1)
	p.pdf.MultiCell(widths[3]-2, 3, "I certify that the entries\nin this log are true.", "", "L", false)

	p.pdf.SetXY(remarksX, startY+2*p.Export.FooterRow)
	p.pdf.Rect(remarksX, startY+2*p.Export.FooterRow, widths[3], p.Export.FooterRow, "FD")
	p.pdf.SetXY(remarksX+1, startY+2*p.Export.FooterRow+1)
	p.pdf.MultiCell(widths[3]-2, 3, "PILOT'S SIGNATURE", "", "L", false)
	if p.SignatureImage != "" {
		p.pdf.Image("signature", remarksX+widths[3]*0.52, startY+2*p.Export.FooterRow+0.4, widths[3]*0.45, p.Export.FooterRow-0.8, false, "", 0, "")
	}

	p.pdf.SetXY(startX, startY+3*p.Export.FooterRow)
}

func (p *PDFExporter) printEASALeftPage(records []models.FlightRecord) {
	widths := scaleWidths(p.easaTableWidth(), 0.088, 0.120, 0.121, 0.211, 0.191, 0.087, 0.083, 0.099)
	p.printEASALeftHeader(widths)
	for i := 0; i < EASALogbookRows; i++ {
		record := EmptyTotals()
		if i < len(records) {
			record = records[i]
		}
		p.printEASALeftBodyRow(record, widths, i)
	}
	p.printEASALeftFooterRow(FooterThisPage, p.totalPage, widths)
	p.printEASALeftFooterRow(FooterPreviousPage, p.totalPrevious, widths)
	p.printEASALeftFooterRow(FooterTotalTime, p.totalTime, widths)
	p.printPageNumber()
}

func (p *PDFExporter) printEASARightPage(records []models.FlightRecord) {
	widths := scaleWidths(p.easaTableWidth(), 0.206, 0.380, 0.249, 0.165)
	p.printEASARightHeader(widths)
	for i := 0; i < EASALogbookRows; i++ {
		record := EmptyTotals()
		if i < len(records) {
			record = records[i]
		}
		p.printEASARightBodyRow(record, widths, i)
	}
	p.printEASARightFooter(widths)
	p.printPageNumber()
}
