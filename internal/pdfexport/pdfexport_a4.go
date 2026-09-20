package pdfexport

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"io"
	"strings"

	"github.com/vsimakhin/web-logbook/internal/models"
)

// The EASA paper logbook uses two landscape pages for columns 1-8 and 9-12.
// The application keeps A4 landscape as requested, but renders the full logical
// 12-column logbook page on ONE PDF page. The vertical measurements and the
// certification/signature block are taken from the Nov 2025 AMC1 FCL.050 model;
// the columns are proportionally compressed horizontally to fit one A4 page.
const (
	easaCombinedTableWidth = 277.0

	// Header/body measurements follow the proportions of EASA pp. 94-95.
	easaHeaderNumberHeight = 5.36
	easaHeaderMainHeight   = 8.75
	easaHeaderSubHeight    = 8.75
	easaBodyRowHeight      = 4.82

	// On EASA p. 95 the certification block spans the first two lower rows and
	// the signature box occupies the last row. Keeping these heights fixes the
	// visibly undersized signature area from the previous exporter.
	easaFooterRow1Height = 12.0
	easaFooterRow2Height = 14.1
	easaFooterRow3Height = 17.6
)

// exportA4 creates an A4 landscape PDF. One batch of 12 records is one PDF
// logbook page containing columns 1 through 12.
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

	// Keep one blank logbook page for an empty logbook.
	if len(ordered) == 0 {
		p.totalPage = EmptyTotals()
		p.printEASACombinedPage(nil)
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

		p.printEASACombinedPage(batch)
		p.totalPrevious = p.totalTime

		if end < len(ordered) {
			p.pageCounter++
		}
	}

	return p.pdf.Output(w)
}

func scaleWidths(total float64, ratios ...float64) []float64 {
	result := make([]float64, len(ratios))
	for i, ratio := range ratios {
		result[i] = total * ratio
	}
	return result
}

// combinedGroupWidths keeps column 12 at approximately the same physical width
// as the EASA reference (about 40.4 mm). Columns 1-11 are compressed by the
// same factor so the complete spread fits inside one 277 mm A4-landscape table.
func combinedGroupWidths() []float64 {
	return []float64{
		11.36, // 1 DATE
		15.49, // 2 DEPARTURE
		15.49, // 3 ARRIVAL
		27.23, // 4 AIRCRAFT
		24.72, // 5 SINGLE-/MULTI-PILOT TIME
		11.29, // 6 TOTAL TIME OF FLIGHT
		10.63, // 7 NAME(S) PIC
		12.91, // 8 LANDINGS
		26.41, // 9 OPERATIONAL CONDITION TIME
		49.16, // 10 PILOT FUNCTION TIME
		31.95, // 11 FSTD SESSION
		40.36, // 12 REMARKS / CERTIFICATION / SIGNATURE
	}
}

func (p *PDFExporter) drawCell(x, y, w, h float64, text, align string, fontSize float64, bold bool) {
	if w <= 0 || h <= 0 {
		return
	}

	p.pdf.SetFillColor(255, 255, 255)
	p.pdf.SetDrawColor(0, 0, 0)
	p.pdf.Rect(x, y, w, h, "DF")

	text = strings.TrimSpace(text)
	if text == "" {
		return
	}

	font := fontRegular
	if bold {
		font = fontBold
	}
	p.pdf.SetTextColor(0, 0, 0)
	p.pdf.SetFont(font, "", fontSize)

	lines := strings.Split(text, "\n")
	lineH := fontSize * 0.42 // fpdf sizes are points, coordinates are mm.
	if lineH < 2.0 {
		lineH = 2.0
	}
	textH := float64(len(lines)) * lineH
	textY := y + (h-textH)/2
	if textY < y+0.35 {
		textY = y + 0.35
	}

	textX := x
	textW := w
	if align == "L" && w > 2.0 {
		textX = x + 0.8
		textW = w - 1.6
	}
	p.pdf.SetXY(textX, textY)
	p.pdf.MultiCell(textW, lineH, text, "", align, false)
}

func (p *PDFExporter) drawTimeCell(x, y, w, h float64, value string, fontSize float64) {
	hours, minutes := splitTime(p.formatTimeField(value))
	half := w / 2
	p.drawCell(x, y, half, h, hours, "C", fontSize, false)
	p.drawCell(x+half, y, w-half, h, minutes, "C", fontSize, false)
}

func (p *PDFExporter) drawSinglePilotCell(x, y, w, h float64, value string, fontSize float64) {
	value = strings.TrimSpace(value)
	if p.Export.ReplaceSPTime && value != "" && value != "0" && value != "0:00" && value != "00:00" {
		p.pdf.SetFillColor(255, 255, 255)
		p.pdf.SetDrawColor(0, 0, 0)
		p.pdf.Rect(x, y, w, h, "DF")
		p.pdf.SetTextColor(0, 0, 0)
		p.pdf.SetFont(fontB612, "", fontSize)
		p.pdf.SetXY(x, y+(h-2.2)/2)
		p.pdf.CellFormat(w, 2.2, CheckSymbol, "", 0, "C", false, 0, "")
		return
	}
	p.drawTimeCell(x, y, w, h, value, fontSize)
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

func (p *PDFExporter) drawCombinedHeader(widths []float64) float64 {
	x := p.Export.LeftMargin
	y := p.Export.TopMargin

	for i, w := range widths {
		p.drawCell(x, y, w, easaHeaderNumberHeight, fmt.Sprintf("%d", i+1), "C", 5.8, true)
		x += w
	}

	x = p.Export.LeftMargin
	y += easaHeaderNumberHeight
	fullLower := easaHeaderMainHeight + easaHeaderSubHeight

	// 1 - DATE
	p.drawCell(x, y, widths[0], fullLower, "DATE\n(dd/mm/yy)", "C", 5.4, true)
	x += widths[0]

	// 2 - DEPARTURE
	p.drawCell(x, y, widths[1], easaHeaderMainHeight, "DEPARTURE", "C", 5.3, true)
	dep := scaleWidths(widths[1], 0.51, 0.49)
	p.drawCell(x, y+easaHeaderMainHeight, dep[0], easaHeaderSubHeight, "PLACE", "C", 5.1, true)
	p.drawCell(x+dep[0], y+easaHeaderMainHeight, dep[1], easaHeaderSubHeight, "TIME", "C", 5.1, true)
	x += widths[1]

	// 3 - ARRIVAL
	p.drawCell(x, y, widths[2], easaHeaderMainHeight, "ARRIVAL", "C", 5.3, true)
	arr := scaleWidths(widths[2], 0.51, 0.49)
	p.drawCell(x, y+easaHeaderMainHeight, arr[0], easaHeaderSubHeight, "PLACE", "C", 5.1, true)
	p.drawCell(x+arr[0], y+easaHeaderMainHeight, arr[1], easaHeaderSubHeight, "TIME", "C", 5.1, true)
	x += widths[2]

	// 4 - AIRCRAFT
	p.drawCell(x, y, widths[3], easaHeaderMainHeight, "AIRCRAFT", "C", 5.4, true)
	aircraft := scaleWidths(widths[3], 0.50, 0.50)
	p.drawCell(x, y+easaHeaderMainHeight, aircraft[0], easaHeaderSubHeight, "MAKE, MODEL,\nVARIANT", "C", 4.6, true)
	p.drawCell(x+aircraft[0], y+easaHeaderMainHeight, aircraft[1], easaHeaderSubHeight, "REGISTRATION", "C", 4.7, true)
	x += widths[3]

	// 5 - SINGLE-PILOT TIME / MULTI-PILOT TIME
	fiveGroups := scaleWidths(widths[4], 0.49, 0.51)
	p.drawCell(x, y, fiveGroups[0], easaHeaderMainHeight, "SINGLE-PILOT\nTIME", "C", 4.7, true)
	sp := scaleWidths(fiveGroups[0], 0.50, 0.50)
	p.drawCell(x, y+easaHeaderMainHeight, sp[0], easaHeaderSubHeight, "SE", "C", 5.1, true)
	p.drawCell(x+sp[0], y+easaHeaderMainHeight, sp[1], easaHeaderSubHeight, "ME", "C", 5.1, true)
	p.drawCell(x+fiveGroups[0], y, fiveGroups[1], fullLower, "MULTI-PILOT\nTIME", "C", 4.6, true)
	x += widths[4]

	// 6 - TOTAL TIME OF FLIGHT
	p.drawCell(x, y, widths[5], fullLower, "TOTAL TIME\nOF FLIGHT", "C", 4.9, true)
	x += widths[5]

	// 7 - NAME(S) PIC
	p.drawCell(x, y, widths[6], fullLower, "NAME(S)\nPIC", "C", 5.0, true)
	x += widths[6]

	// 8 - LANDINGS
	p.drawCell(x, y, widths[7], easaHeaderMainHeight, "LANDINGS", "C", 4.9, true)
	land := scaleWidths(widths[7], 0.50, 0.50)
	p.drawCell(x, y+easaHeaderMainHeight, land[0], easaHeaderSubHeight, "DAY", "C", 5.0, true)
	p.drawCell(x+land[0], y+easaHeaderMainHeight, land[1], easaHeaderSubHeight, "NIGHT", "C", 5.0, true)
	x += widths[7]

	// 9 - OPERATIONAL CONDITION TIME
	p.drawCell(x, y, widths[8], easaHeaderMainHeight, "OPERATIONAL CONDITION TIME", "C", 4.55, true)
	nine := scaleWidths(widths[8], 0.50, 0.50)
	p.drawCell(x, y+easaHeaderMainHeight, nine[0], easaHeaderSubHeight, "NIGHT", "C", 5.0, true)
	p.drawCell(x+nine[0], y+easaHeaderMainHeight, nine[1], easaHeaderSubHeight, "IFR", "C", 5.0, true)
	x += widths[8]

	// 10 - PILOT FUNCTION TIME
	p.drawCell(x, y, widths[9], easaHeaderMainHeight, "PILOT FUNCTION TIME", "C", 5.2, true)
	ten := scaleWidths(widths[9], 0.25, 0.25, 0.25, 0.25)
	labels := []string{"PIC", "CO-PILOT", "DUAL", "INSTRUCTOR"}
	for i, w := range ten {
		p.drawCell(x, y+easaHeaderMainHeight, w, easaHeaderSubHeight, labels[i], "C", 4.75, true)
		x += w
	}

	// 11 - FSTD SESSION
	p.drawCell(x, y, widths[10], easaHeaderMainHeight, "FSTD SESSION", "C", 5.2, true)
	eleven := scaleWidths(widths[10], 0.35, 0.29, 0.36)
	p.drawCell(x, y+easaHeaderMainHeight, eleven[0], easaHeaderSubHeight, "DATE\n(dd/mm/yy)", "C", 4.45, true)
	p.drawCell(x+eleven[0], y+easaHeaderMainHeight, eleven[1], easaHeaderSubHeight, "TYPE", "C", 4.8, true)
	p.drawCell(x+eleven[0]+eleven[1], y+easaHeaderMainHeight, eleven[2], easaHeaderSubHeight, "TOTAL TIME\nOF SESSION", "C", 4.15, true)
	x += widths[10]

	// 12 - REMARKS AND ENDORSEMENTS
	p.drawCell(x, y, widths[11], fullLower, "REMARKS AND\nENDORSEMENTS", "C", 5.5, true)

	return p.Export.TopMargin + easaHeaderNumberHeight + fullLower
}

func (p *PDFExporter) drawCombinedBodyRow(record models.FlightRecord, widths []float64, y float64, rowIndex int) {
	p.rowCounter = rowIndex + 1
	x := p.Export.LeftMargin
	fontSize := 5.8

	flightDate := ""
	if !isFSTDRecord(record) {
		flightDate = formatLogbookDate(record.Date)
	}
	p.drawCell(x, y, widths[0], easaBodyRowHeight, flightDate, "C", fontSize, false)
	x += widths[0]

	dep := scaleWidths(widths[1], 0.51, 0.49)
	p.drawCell(x, y, dep[0], easaBodyRowHeight, record.Departure.Place, "C", fontSize, false)
	p.drawCell(x+dep[0], y, dep[1], easaBodyRowHeight, record.Departure.Time, "C", 5.2, false)
	x += widths[1]

	arr := scaleWidths(widths[2], 0.51, 0.49)
	p.drawCell(x, y, arr[0], easaBodyRowHeight, record.Arrival.Place, "C", fontSize, false)
	p.drawCell(x+arr[0], y, arr[1], easaBodyRowHeight, record.Arrival.Time, "C", 5.2, false)
	x += widths[2]

	aircraft := scaleWidths(widths[3], 0.50, 0.50)
	p.drawCell(x, y, aircraft[0], easaBodyRowHeight, record.Aircraft.Model, "C", 5.3, false)
	p.drawCell(x+aircraft[0], y, aircraft[1], easaBodyRowHeight, record.Aircraft.Reg, "C", 5.3, false)
	x += widths[3]

	five := scaleWidths(widths[4], 0.245, 0.245, 0.51)
	p.drawSinglePilotCell(x, y, five[0], easaBodyRowHeight, record.Time.SE, 5.4)
	p.drawSinglePilotCell(x+five[0], y, five[1], easaBodyRowHeight, record.Time.ME, 5.4)
	p.drawTimeCell(x+five[0]+five[1], y, five[2], easaBodyRowHeight, record.Time.MCC, 5.2)
	x += widths[4]

	p.drawTimeCell(x, y, widths[5], easaBodyRowHeight, record.Time.Total, 5.2)
	x += widths[5]

	p.drawCell(x, y, widths[6], easaBodyRowHeight, record.PIC, "C", 5.0, false)
	x += widths[6]

	land := scaleWidths(widths[7], 0.50, 0.50)
	p.drawCell(x, y, land[0], easaBodyRowHeight, formatLandings(record.Landings.Day), "C", 5.4, false)
	p.drawCell(x+land[0], y, land[1], easaBodyRowHeight, formatLandings(record.Landings.Night), "C", 5.4, false)
	x += widths[7]

	nine := scaleWidths(widths[8], 0.50, 0.50)
	p.drawTimeCell(x, y, nine[0], easaBodyRowHeight, record.Time.Night, 5.2)
	p.drawTimeCell(x+nine[0], y, nine[1], easaBodyRowHeight, record.Time.IFR, 5.2)
	x += widths[8]

	ten := scaleWidths(widths[9], 0.25, 0.25, 0.25, 0.25)
	times := []string{record.Time.PIC, record.Time.CoPilot, record.Time.Dual, record.Time.Instructor}
	for i, w := range ten {
		p.drawTimeCell(x, y, w, easaBodyRowHeight, times[i], 5.2)
		x += w
	}

	eleven := scaleWidths(widths[10], 0.35, 0.29, 0.36)
	fstdDate := ""
	if isFSTDRecord(record) {
		fstdDate = formatLogbookDate(record.Date)
	}
	p.drawCell(x, y, eleven[0], easaBodyRowHeight, fstdDate, "C", 5.0, false)
	p.drawCell(x+eleven[0], y, eleven[1], easaBodyRowHeight, record.SIM.Type, "C", 4.9, false)
	p.drawTimeCell(x+eleven[0]+eleven[1], y, eleven[2], easaBodyRowHeight, record.SIM.Time, 5.0)
	x += widths[10]

	p.drawCombinedRemarksCell(x, y, widths[11], easaBodyRowHeight, record.Remarks, record.Signature, record.UUID)
}

func (p *PDFExporter) drawCombinedRemarksCell(x, y, w, h float64, value, signature, uuid string) {
	value = strings.TrimSpace(value)
	fontSize := 5.2
	if len(value) > 52 {
		value = value[:49] + "..."
		fontSize = 4.2
	} else if len(value) > 34 {
		fontSize = 4.7
	}
	p.drawCell(x, y, w, h, value, "L", fontSize, false)

	if signature == "" {
		return
	}

	unbased, err := base64.StdEncoding.DecodeString(strings.ReplaceAll(signature, "data:image/png;base64,", ""))
	if err != nil {
		return
	}

	r := bytes.NewReader(unbased)
	im := p.pdf.RegisterImageReader(uuid, "png", r)
	if im == nil || im.Height() == 0 {
		return
	}
	imgH := h - 0.8
	imgW := im.Width() * (imgH / im.Height())
	maxW := w * 0.42
	if imgW > maxW {
		imgW = maxW
	}
	p.pdf.Image(uuid, x+w-imgW-0.4, y+0.4, imgW, imgH, false, "", 0, "")
}

func (p *PDFExporter) drawFooterTimeCell(x, y, w, h float64, value string) {
	p.drawTimeCell(x, y, w, h, value, 5.3)
}

func (p *PDFExporter) drawCombinedFooter(widths []float64, startY float64) {
	heights := []float64{easaFooterRow1Height, easaFooterRow2Height, easaFooterRow3Height}
	totals := []models.FlightRecord{p.totalPage, p.totalPrevious, p.totalTime}
	labels := []string{FooterThisPage, FooterPreviousPage, FooterTotalTime}

	// Columns 1-3 form the large blank block at the lower left. On the
	// official two-page paper layout the total label sits in half of column 4;
	// after compressing both pages onto one A4 sheet that half would be too
	// narrow to remain legible, so the full AIRCRAFT column is used for the
	// same label while preserving the EASA footer heights.
	x := p.Export.LeftMargin
	footerH := heights[0] + heights[1] + heights[2]
	blankWidth := widths[0] + widths[1] + widths[2]
	p.drawCell(x, startY, blankWidth, footerH, "", "C", 5.0, false)
	x += blankWidth

	for row := 0; row < 3; row++ {
		y := startY
		for i := 0; i < row; i++ {
			y += heights[i]
		}
		h := heights[row]
		total := totals[row]

		rowX := x
		p.drawCell(rowX, y, widths[3], h, labels[row], "L", 5.0, true)
		rowX += widths[3]

		five := scaleWidths(widths[4], 0.245, 0.245, 0.51)
		p.drawFooterTimeCell(rowX, y, five[0], h, total.Time.SE)
		rowX += five[0]
		p.drawFooterTimeCell(rowX, y, five[1], h, total.Time.ME)
		rowX += five[1]
		p.drawFooterTimeCell(rowX, y, five[2], h, total.Time.MCC)
		rowX += five[2]

		p.drawFooterTimeCell(rowX, y, widths[5], h, total.Time.Total)
		rowX += widths[5]
		p.drawCell(rowX, y, widths[6], h, "", "C", 5.0, false)
		rowX += widths[6]

		land := scaleWidths(widths[7], 0.50, 0.50)
		p.drawCell(rowX, y, land[0], h, formatLandings(total.Landings.Day), "C", 5.2, false)
		rowX += land[0]
		p.drawCell(rowX, y, land[1], h, formatLandings(total.Landings.Night), "C", 5.2, false)
		rowX += land[1]

		nine := scaleWidths(widths[8], 0.50, 0.50)
		p.drawFooterTimeCell(rowX, y, nine[0], h, total.Time.Night)
		rowX += nine[0]
		p.drawFooterTimeCell(rowX, y, nine[1], h, total.Time.IFR)
		rowX += nine[1]

		ten := scaleWidths(widths[9], 0.25, 0.25, 0.25, 0.25)
		times := []string{total.Time.PIC, total.Time.CoPilot, total.Time.Dual, total.Time.Instructor}
		for i, w := range ten {
			p.drawFooterTimeCell(rowX, y, w, h, times[i])
			rowX += w
		}

		eleven := scaleWidths(widths[10], 0.35, 0.29, 0.36)
		p.drawCell(rowX, y, eleven[0], h, "", "C", 5.0, false)
		rowX += eleven[0]
		p.drawCell(rowX, y, eleven[1], h, "", "C", 5.0, false)
		rowX += eleven[1]
		p.drawFooterTimeCell(rowX, y, eleven[2], h, total.SIM.Time)
	}

	// Column 12 follows the proportions of EASA p. 95: certification over the
	// first two lower rows, then a distinctly taller signature box.
	remarksX := p.Export.LeftMargin
	for i := 0; i < 11; i++ {
		remarksX += widths[i]
	}
	certH := heights[0] + heights[1]
	p.drawCell(remarksX, startY, widths[11], certH, EASACertificationText, "L", 7.0, true)
	p.drawCell(remarksX, startY+certH, widths[11], heights[2], "PILOT'S SIGNATURE", "L", 6.4, true)

	if p.SignatureImage != "" {
		p.pdf.Image("signature", remarksX+widths[11]*0.48, startY+certH+1.2, widths[11]*0.48, heights[2]-2.4, false, "", 0, "")
	}
}

func (p *PDFExporter) printEASACombinedPage(records []models.FlightRecord) {
	p.pdf.AddPage()
	widths := combinedGroupWidths()

	bodyStart := p.drawCombinedHeader(widths)
	for i := 0; i < EASALogbookRows; i++ {
		record := EmptyTotals()
		if i < len(records) {
			record = records[i]
		}
		p.drawCombinedBodyRow(record, widths, bodyStart+float64(i)*easaBodyRowHeight, i)
	}

	footerStart := bodyStart + float64(EASALogbookRows)*easaBodyRowHeight
	p.drawCombinedFooter(widths, footerStart)
	p.printPageNumber()
}
