package pdfexport

import (
	"bytes"
	"encoding/base64"
	"io"
	"strings"

	"github.com/vsimakhin/web-logbook/internal/models"
)

// The Nov 2025 AMC1 FCL.050 pilot logbook is printed by EASA as two facing
// pages: columns 1-8 on page 94 and columns 9-12 on page 95.
//
// The application combines those two exact source table geometries onto ONE
// A4-landscape PDF page. Both source tables are reduced with the SAME uniform
// scale factor and placed edge-to-edge. This preserves every relative column,
// row and text position from the EASA source while allowing the complete
// 1-12 logbook spread to fit on one physical A4 page.
const (
	ptToMM = 25.4 / 72.0

	// Kept for the legacy Export settings struct. The composite renderer uses
	// the measured EASA row boundaries below rather than this value directly.
	easaBodyRowHeight = 13.6825 * ptToMM

	// Measured text size in the EASA source. Dynamic flight data is reduced by
	// the same uniform factor as the source table artwork.
	easaTextFontSize = 9.96

	compositeMarginX = 3.0
	compositeGap     = 0.0
)

// Exact line coordinates measured from the EASA Nov 2025 PDF (points from the
// top-left of each A4-landscape source page).
var easaLeftX = []float64{
	70.32 * ptToMM, 132.02 * ptToMM, 174.62 * ptToMM, 216.02 * ptToMM,
	257.18 * ptToMM, 300.05 * ptToMM, 373.37 * ptToMM, 447.65 * ptToMM,
	480.67 * ptToMM, 514.15 * ptToMM, 545.59 * ptToMM, 581.47 * ptToMM,
	610.75 * ptToMM, 642.91 * ptToMM, 700.42 * ptToMM, 731.14 * ptToMM,
	769.42 * ptToMM,
}

var easaLeftY = []float64{
	107.42 * ptToMM, 123.02 * ptToMM, 147.86 * ptToMM, 172.82 * ptToMM,
	187.01 * ptToMM, 201.17 * ptToMM, 215.33 * ptToMM, 229.37 * ptToMM,
	243.53 * ptToMM, 257.69 * ptToMM, 271.85 * ptToMM, 285.89 * ptToMM,
	300.05 * ptToMM, 314.23 * ptToMM, 328.39 * ptToMM, 342.55 * ptToMM,
	377.35 * ptToMM, 414.43 * ptToMM, 449.86 * ptToMM, 477.70 * ptToMM,
}

var easaRightX = []float64{
	71.04 * ptToMM, 105.50 * ptToMM, 141.38 * ptToMM, 176.90 * ptToMM,
	214.34 * ptToMM, 245.54 * ptToMM, 276.38 * ptToMM, 309.29 * ptToMM,
	344.21 * ptToMM, 377.09 * ptToMM, 409.61 * ptToMM, 443.69 * ptToMM,
	480.79 * ptToMM, 541.63 * ptToMM, 592.03 * ptToMM, 622.75 * ptToMM,
	653.83 * ptToMM, 767.62 * ptToMM,
}

var easaRightY = []float64{
	87.98 * ptToMM, 103.10 * ptToMM, 115.82 * ptToMM, 140.66 * ptToMM,
	154.34 * ptToMM, 168.14 * ptToMM, 181.70 * ptToMM, 195.41 * ptToMM,
	209.09 * ptToMM, 222.77 * ptToMM, 236.45 * ptToMM, 250.13 * ptToMM,
	263.81 * ptToMM, 277.37 * ptToMM, 291.17 * ptToMM, 304.85 * ptToMM,
	338.59 * ptToMM, 378.55 * ptToMM, 427.87 * ptToMM,
}

type easaCompositeLayout struct {
	scale  float64
	leftX  float64
	topY   float64
	leftW  float64
	rightW float64
	height float64
}

func sourceWidth(bounds []float64) float64 {
	return bounds[len(bounds)-1] - bounds[0]
}

func sourceHeight(bounds []float64) float64 {
	return bounds[len(bounds)-1] - bounds[0]
}

// compositeLayout uses one common scale for BOTH EASA halves. The merged
// template has a single shared vertical grid, so rows 1-8 and 9-12 line up
// exactly across the centre seam.
func compositeLayout() easaCompositeLayout {
	const pageW = 297.0
	const pageH = 210.0

	leftSourceW := sourceWidth(easaLeftX)
	rightSourceW := sourceWidth(easaRightX)
	commonSourceH := sourceHeight(easaLeftY)

	availableW := pageW - 2*compositeMarginX - compositeGap
	scale := availableW / (leftSourceW + rightSourceW)

	leftW := leftSourceW * scale
	rightW := rightSourceW * scale
	height := commonSourceH * scale
	top := (pageH - height) / 2

	return easaCompositeLayout{
		scale:  scale,
		leftX:  compositeMarginX,
		topY:   top,
		leftW:  leftW,
		rightW: rightW,
		height: height,
	}
}

func transformBound(v, sourceStart, targetStart, scale float64) float64 {
	return targetStart + (v-sourceStart)*scale
}

func transformBounds(bounds []float64, sourceStart, targetStart, scale float64) []float64 {
	out := make([]float64, len(bounds))
	for i, v := range bounds {
		out[i] = transformBound(v, sourceStart, targetStart, scale)
	}
	return out
}

// ExportA4 creates one physical A4-landscape page for every 12-entry logbook
// sheet, combining the exact EASA 1-8 and 9-12 table geometries side-by-side.
func (p *PDFExporter) ExportA4(flightRecords []models.FlightRecord, w io.Writer) error {
	if err := p.initPDF(); err != nil {
		return err
	}
	if err := p.loadEASAVectorTemplates(); err != nil {
		return err
	}

	p.rowCounter = 0
	p.pageCounter = 1
	p.titlePage()

	// Database export is newest-first. Paper logbooks are chronological.
	ordered := make([]models.FlightRecord, 0, len(flightRecords))
	for i := len(flightRecords) - 1; i >= 0; i-- {
		record := flightRecords[i]
		if record.Time.MCC != "" {
			record.Time.ME = ""
		}
		ordered = append(ordered, record)
	}

	if len(ordered) == 0 {
		p.totalPage = EmptyTotals()
		p.printEASACompositePage(nil)
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

		p.printEASACompositePage(batch)
		p.totalPrevious = p.totalTime

		if end < len(ordered) {
			p.pageCounter++
		}
	}

	return p.pdf.Output(w)
}

func (p *PDFExporter) printEASACompositePage(records []models.FlightRecord) {
	p.pdf.AddPage()
	layout := compositeLayout()

	// Exact vector template built from the EASA Nov 2025 source pages. The
	// 1-8 and 9-12 halves share the same row grid and are already positioned on
	// one A4-landscape page. Unlike the previous 36 MP PNG, this stays sharp and
	// scrolls smoothly in the browser PDF preview.
	p.easaCompositeImporter.UseImportedTemplate(p.pdf, p.easaCompositePage, 0, 0, 297, 210)

	lx := transformBounds(easaLeftX, easaLeftX[0], layout.leftX, layout.scale)
	rightStart := layout.leftX + layout.leftW + compositeGap
	rx := transformBounds(easaRightX, easaRightX[0], rightStart, layout.scale)
	// Both halves intentionally share the exact same vertical grid.
	y := transformBounds(easaLeftY, easaLeftY[0], layout.topY, layout.scale)

	for i := 0; i < EASALogbookRows; i++ {
		record := EmptyTotals()
		if i < len(records) {
			record = records[i]
		}
		p.drawCompositeLeftBodyRow(record, i, lx, y, layout.scale)
		p.drawCompositeRightBodyRow(record, i, rx, y, layout.scale)
	}

	p.drawCompositeLeftTotals(lx, y, layout.scale)
	p.drawCompositeRightTotals(rx, y, layout.scale)
	p.drawCompositeCertification(rx, y)
	p.drawCompositePilotSignature(rx, y)
}

func splitEASATime(value string) (string, string) {
	value = strings.TrimSpace(value)
	if value == "" || value == "0" || value == "0:00" || value == "00:00" {
		return "", ""
	}
	parts := strings.Split(value, ":")
	if len(parts) != 2 {
		return value, ""
	}
	return strings.TrimLeft(parts[0], "0"), parts[1]
}

func compactEASATime(value string) string {
	h, m := splitEASATime(value)
	if h == "" && m == "" {
		return ""
	}
	if h == "" {
		h = "0"
	}
	if m == "" {
		return h
	}
	return h + " " + m
}

func (p *PDFExporter) wrapTextToWidth(text string, width float64) []string {
	text = strings.TrimSpace(text)
	if text == "" {
		return nil
	}
	var lines []string
	for _, paragraph := range strings.Split(text, "\n") {
		words := strings.Fields(paragraph)
		if len(words) == 0 {
			lines = append(lines, "")
			continue
		}
		line := words[0]
		for _, word := range words[1:] {
			candidate := line + " " + word
			if p.pdf.GetStringWidth(candidate) <= width {
				line = candidate
			} else {
				lines = append(lines, line)
				line = word
			}
		}
		lines = append(lines, line)
	}
	return lines
}

func (p *PDFExporter) trimLineToWidth(line string, width float64) string {
	line = strings.TrimSuffix(strings.TrimSpace(line), "…")
	if p.pdf.GetStringWidth(line) <= width {
		return line
	}
	runes := []rune(line)
	for len(runes) > 1 {
		runes = runes[:len(runes)-1]
		candidate := strings.TrimSpace(string(runes)) + "…"
		if p.pdf.GetStringWidth(candidate) <= width {
			return candidate
		}
	}
	return "…"
}

// overlayTextCell fits text inside a measured EASA cell. It never allows text
// to spill into the neighbouring cell: the font is reduced when necessary and
// wrapped lines are capped to the available height with an ellipsis.
func (p *PDFExporter) overlayTextCell(x0, y0, x1, y1 float64, text, align string, fontSize float64, bold bool) {
	text = strings.TrimSpace(text)
	if text == "" || x1 <= x0 || y1 <= y0 {
		return
	}

	font := fontRegular
	if bold {
		font = fontBold
	}

	paddingX := 0.42
	paddingY := 0.18
	if align == "L" {
		paddingX = 0.55
	}
	usableW := (x1 - x0) - 2*paddingX
	usableH := (y1 - y0) - 2*paddingY
	if usableW <= 0.3 || usableH <= 0.3 {
		return
	}

	minFont := 3.15
	var lines []string
	lineH := 0.0
	for {
		p.pdf.SetFont(font, "", fontSize)
		lines = p.wrapTextToWidth(text, usableW)
		lineH = fontSize * ptToMM * 1.02
		if lineH < 1.0 {
			lineH = 1.0
		}
		if float64(len(lines))*lineH <= usableH || fontSize <= minFont {
			break
		}
		fontSize -= 0.18
		if fontSize < minFont {
			fontSize = minFont
		}
	}

	p.pdf.SetFont(font, "", fontSize)
	maxLines := int(usableH / lineH)
	if maxLines < 1 {
		maxLines = 1
	}
	if len(lines) > maxLines {
		lines = lines[:maxLines]
		lines[maxLines-1] = p.trimLineToWidth(lines[maxLines-1], usableW)
	}

	// Make sure exceptionally long single tokens also remain inside the cell.
	for i := range lines {
		lines[i] = p.trimLineToWidth(lines[i], usableW)
	}

	p.pdf.SetTextColor(0, 0, 0)
	textH := float64(len(lines)) * lineH
	textY := y0 + (y1-y0-textH)/2
	if align == "L" {
		// Remarks read better from the top-left when they wrap.
		textY = y0 + paddingY
	}
	if textY < y0+paddingY {
		textY = y0 + paddingY
	}

	for _, line := range lines {
		p.pdf.SetXY(x0+paddingX, textY)
		p.pdf.CellFormat(usableW, lineH, line, "", 0, align, false, 0, "")
		textY += lineH
	}
}

func (p *PDFExporter) overlaySplitTime(x0, xMid, x1, y0, y1 float64, value string, fontSize float64) {
	h, m := splitEASATime(p.formatTimeField(value))
	p.overlayTextCell(x0, y0, xMid, y1, h, "C", fontSize, false)
	p.overlayTextCell(xMid, y0, x1, y1, m, "C", fontSize, false)
}

func (p *PDFExporter) overlaySinglePilot(x0, x1, y0, y1 float64, value string, fontSize float64) {
	value = strings.TrimSpace(value)
	if value == "" || value == "0" || value == "0:00" || value == "00:00" {
		return
	}
	if p.Export.ReplaceSPTime {
		p.pdf.SetTextColor(0, 0, 0)
		p.pdf.SetFont(fontB612, "", fontSize)
		lineH := fontSize * ptToMM
		p.pdf.SetXY(x0, y0+((y1-y0)-lineH)/2)
		p.pdf.CellFormat(x1-x0, lineH, CheckSymbol, "", 0, "C", false, 0, "")
		return
	}
	p.overlayTextCell(x0, y0, x1, y1, compactEASATime(value), "C", fontSize, false)
}

func (p *PDFExporter) drawCompositeLeftBodyRow(record models.FlightRecord, row int, x, y []float64, scale float64) {
	y0, y1 := y[3+row], y[4+row]
	font := easaTextFontSize * scale

	date := ""
	if !isFSTDRecord(record) {
		date = formatLogbookDate(record.Date)
	}
	p.overlayTextCell(x[0], y0, x[1], y1, date, "C", font, false)
	p.overlayTextCell(x[1], y0, x[2], y1, record.Departure.Place, "C", font, false)
	p.overlayTextCell(x[2], y0, x[3], y1, record.Departure.Time, "C", font, false)
	p.overlayTextCell(x[3], y0, x[4], y1, record.Arrival.Place, "C", font, false)
	p.overlayTextCell(x[4], y0, x[5], y1, record.Arrival.Time, "C", font, false)
	p.overlayTextCell(x[5], y0, x[6], y1, record.Aircraft.Model, "C", font, false)
	p.overlayTextCell(x[6], y0, x[7], y1, record.Aircraft.Reg, "C", font, false)
	p.overlaySinglePilot(x[7], x[8], y0, y1, record.Time.SE, font)
	p.overlaySinglePilot(x[8], x[9], y0, y1, record.Time.ME, font)
	p.overlaySplitTime(x[9], x[10], x[11], y0, y1, record.Time.MCC, font)
	p.overlaySplitTime(x[11], x[12], x[13], y0, y1, record.Time.Total, font)
	p.overlayTextCell(x[13], y0, x[14], y1, record.PIC, "C", font, false)
	p.overlayTextCell(x[14], y0, x[15], y1, formatLandings(record.Landings.Day), "C", font, false)
	p.overlayTextCell(x[15], y0, x[16], y1, formatLandings(record.Landings.Night), "C", font, false)
}

func (p *PDFExporter) drawCompositeRightBodyRow(record models.FlightRecord, row int, x, y []float64, scale float64) {
	y0, y1 := y[3+row], y[4+row]
	font := easaTextFontSize * scale

	p.overlaySplitTime(x[0], x[1], x[2], y0, y1, record.Time.Night, font)
	p.overlaySplitTime(x[2], x[3], x[4], y0, y1, record.Time.IFR, font)
	p.overlaySplitTime(x[4], x[5], x[6], y0, y1, record.Time.PIC, font)
	p.overlaySplitTime(x[6], x[7], x[8], y0, y1, record.Time.CoPilot, font)
	p.overlaySplitTime(x[8], x[9], x[10], y0, y1, record.Time.Dual, font)
	p.overlaySplitTime(x[10], x[11], x[12], y0, y1, record.Time.Instructor, font)

	fstdDate := ""
	if isFSTDRecord(record) {
		fstdDate = formatLogbookDate(record.Date)
	}
	p.overlayTextCell(x[12], y0, x[13], y1, fstdDate, "C", font, false)
	p.overlayTextCell(x[13], y0, x[14], y1, record.SIM.Type, "C", font, false)
	p.overlaySplitTime(x[14], x[15], x[16], y0, y1, record.SIM.Time, font)
	p.overlayRemarks(x[16], y0, x[17], y1, record.Remarks, record.Signature, record.UUID, font)
}

func (p *PDFExporter) overlayRemarks(x0, y0, x1, y1 float64, value, signature, uuid string, fontSize float64) {
	textX1 := x1
	if signature != "" {
		// Reserve a fixed right-side strip for the per-flight signature so remarks
		// can never be painted underneath it.
		textX1 = x0 + (x1-x0)*0.64
	}
	p.overlayTextCell(x0, y0, textX1, y1, value, "L", fontSize, false)
	if signature == "" {
		return
	}

	unbased, err := base64.StdEncoding.DecodeString(strings.ReplaceAll(signature, "data:image/png;base64,", ""))
	if err != nil {
		return
	}
	r := bytes.NewReader(unbased)
	im := p.pdf.RegisterImageReader(uuid, "png", r)
	maxH := (y1 - y0) * 0.64
	s := maxH / im.Height()
	imgW := im.Width() * s
	maxW := (x1 - textX1) * 0.88
	if imgW > maxW {
		imgW = maxW
		s = imgW / im.Width()
	}
	imgH := im.Height() * s
	p.pdf.Image(uuid, textX1+(x1-textX1-imgW)/2, y0+(y1-y0-imgH)/2, imgW, imgH, false, "", 0, "")
}

func (p *PDFExporter) drawCompositeLeftTotals(x, y []float64, scale float64) {
	font := easaTextFontSize * scale
	totals := []models.FlightRecord{p.totalPage, p.totalPrevious, p.totalTime}
	for row := 0; row < 3; row++ {
		y0, y1 := y[15+row], y[16+row]
		t := totals[row]
		p.overlayTextCell(x[7], y0, x[8], y1, compactEASATime(t.Time.SE), "C", font, false)
		p.overlayTextCell(x[8], y0, x[9], y1, compactEASATime(t.Time.ME), "C", font, false)
		p.overlaySplitTime(x[9], x[10], x[11], y0, y1, t.Time.MCC, font)
		p.overlayTextCell(x[11], y0, x[13], y1, compactEASATime(t.Time.Total), "C", font, false)
		p.overlayTextCell(x[14], y0, x[15], y1, formatLandings(t.Landings.Day), "C", font, false)
		p.overlayTextCell(x[15], y0, x[16], y1, formatLandings(t.Landings.Night), "C", font, false)
	}
}

func (p *PDFExporter) drawCompositeRightTotals(x, y []float64, scale float64) {
	font := easaTextFontSize * scale
	totals := []models.FlightRecord{p.totalPage, p.totalPrevious, p.totalTime}
	for row := 0; row < 3; row++ {
		y0, y1 := y[15+row], y[16+row]
		t := totals[row]
		p.overlaySplitTime(x[0], x[1], x[2], y0, y1, t.Time.Night, font)
		p.overlaySplitTime(x[2], x[3], x[4], y0, y1, t.Time.IFR, font)
		p.overlaySplitTime(x[4], x[5], x[6], y0, y1, t.Time.PIC, font)
		p.overlaySplitTime(x[6], x[7], x[8], y0, y1, t.Time.CoPilot, font)
		p.overlaySplitTime(x[8], x[9], x[10], y0, y1, t.Time.Dual, font)
		p.overlaySplitTime(x[10], x[11], x[12], y0, y1, t.Time.Instructor, font)
		p.overlaySplitTime(x[14], x[15], x[16], y0, y1, t.SIM.Time, font)
	}
}

func (p *PDFExporter) drawCompositeCertification(x, y []float64) {
	cellX0, cellX1 := x[16], x[17]
	cellY0, cellY1 := y[15], y[18]

	// The aligned template already contains the certification wording as raster
	// artwork. Clear only the inside of that cell, keeping the measured EASA
	// border untouched, then redraw the same wording slightly larger.
	inset := 0.16
	p.pdf.SetFillColor(255, 255, 255)
	p.pdf.Rect(cellX0+inset, cellY0+inset, (cellX1-cellX0)-2*inset, (cellY1-cellY0)-2*inset, "F")

	p.pdf.SetTextColor(0, 0, 0)
	p.pdf.SetFont(fontRegular, "", 6.8)
	lineH := 2.55
	textX := cellX0 + 0.85
	textY := cellY0 + 1.45
	usableW := (cellX1 - cellX0) - 1.7

	p.pdf.SetXY(textX, textY)
	p.pdf.CellFormat(usableW, lineH, "I certify that the entries", "", 1, "L", false, 0, "")
	p.pdf.SetX(textX)
	p.pdf.CellFormat(usableW, lineH, "in this log are true.", "", 0, "L", false, 0, "")
}

func (p *PDFExporter) drawCompositePilotSignature(x, y []float64) {
	cellX0, cellX1 := x[16], x[17]
	cellY0, cellY1 := y[18], y[19]
	cellW, cellH := cellX1-cellX0, cellY1-cellY0

	p.pdf.SetTextColor(0, 0, 0)
	p.pdf.SetFont(fontBold, "", 6.9)
	p.pdf.SetXY(cellX0+0.85, cellY0+0.75)
	p.pdf.CellFormat(cellW-1.7, 2.8, "PILOT'S SIGNATURE", "", 0, "L", false, 0, "")

	if p.SignatureImage == "" {
		return
	}
	// Keep the label unobstructed; the signature image uses only the lower area.
	p.pdf.Image("signature", cellX0+cellW*0.14, cellY0+cellH*0.30, cellW*0.78, cellH*0.61, false, "", 0, "")
}
