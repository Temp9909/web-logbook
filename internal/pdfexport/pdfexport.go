package pdfexport

import (
	"bytes"
	"embed"
	"encoding/base64"
	"fmt"
	"io"
	"strings"
	"time"

	"codeberg.org/go-pdf/fpdf"
	"codeberg.org/go-pdf/fpdf/contrib/gofpdi"
	"github.com/vsimakhin/web-logbook/internal/models"
)

// Constants for page formats
const (
	// EASALogbookRows matches the 12 entry lines in the AMC1 FCL.050 pilot-logbook example.
	EASALogbookRows = 12
	// EASACertificationText is fixed by the EASA logbook layout and is not user-configurable.
	EASACertificationText = "I certify that the entries in this log are true."

	PDFA4 string = "A4"
)

// Constants for fonts
const (
	fontBold    string = "LiberationSansNarrow-Bold"
	fontRegular string = "LiberationSansNarrow-Regular"
	fontB612    string = "B612Mono-Regular"
)

// Constants for title page
const (
	Title   string = "PILOT LOGBOOK"
	Name    string = "HOLDER'S NAME:"
	License string = "LICENSE NUMBER:"
	Address string = "ADDRESS:"
)

// Contstants for footer
const (
	FooterThisPage     string = "TOTAL THIS PAGE"
	FooterPreviousPage string = "TOTAL FROM PREVIOUS PAGES"
	FooterTotalTime    string = "TOTAL TIME"
)

// colors
type Color struct{ r, g, b int }

func NewColor(r, g, b int) Color {
	return Color{r: r, g: g, b: b}
}

func EmptyTotals() models.FlightRecord {
	return models.FlightRecord{}
}

var HeaderBG = NewColor(255, 255, 255)
var HeaderText = NewColor(0, 0, 0)
var BodyFillBG = NewColor(255, 255, 255)
var BodyText = NewColor(0, 0, 0)

// Constants for font sizes
const (
	HeaderFontSize        float64 = 6
	BodyFontSize          float64 = 6
	SignatureFontSize     float64 = 7
	PageNumberFontSize    float64 = 6
	TitlePageMainFontSize float64 = 20
	TitlePageInfoFontSize float64 = 15
)

const CheckSymbol string = "✓"

//go:embed font/* template/*
var content embed.FS

// Headers and columns for the logbook
type Headers struct {
	header1 []string
	header2 []string
	header3 []string
}

type ColumnWidths struct {
	w1 []float64
	w2 []float64
	w3 []float64
	w4 []float64
}

// PDFExporter is a struct for exporting logbook to PDF
type PDFExporter struct {
	Format string

	OwnerName      string
	LicenseNumber  string
	Address        string
	Signature      string
	SignatureImage string

	Export models.ExportPDF

	headers Headers
	columns ColumnWidths

	pageBreaks []string

	totalPage     models.FlightRecord
	totalPrevious models.FlightRecord
	totalTime     models.FlightRecord

	pdf *fpdf.Fpdf

	rowCounter      int
	pageCounter     int
	signatureBlockX float64
	signatureBlockY float64
}

// NewPDFExporter creates a new PDFExporter object
func NewPDFExporter(format, ownerName, licenseNumber, address,
	signature, signatureImage string, exportConfig models.ExportPDF,
	previousExperience models.FlightRecord) (*PDFExporter, error) {

	pdfExporter := &PDFExporter{
		Format: format,

		OwnerName:      ownerName,
		LicenseNumber:  licenseNumber,
		Address:        address,
		Signature:      EASACertificationText,
		SignatureImage: signatureImage,

		Export: exportConfig,

		totalPrevious: models.CalculateTotals(EmptyTotals(), previousExperience),
		totalTime:     models.CalculateTotals(EmptyTotals(), previousExperience),
	}

	err := pdfExporter.init()
	if err != nil {
		return nil, err
	}

	return pdfExporter, nil
}

// init initializes the PDFExporter object
func (p *PDFExporter) init() error {
	// check if we have a right format
	if p.Format != PDFA4 {
		return fmt.Errorf("wrong format %s", p.Format)
	}

	p.pageBreaks = strings.Split(p.Export.PageBreaks, ",")

	// The A4 export is fixed to the EASA AMC1 FCL.050 pilot-logbook structure.
	// Legacy saved layout settings are intentionally ignored so an old database
	// cannot alter the regulatory table layout after the settings UI was removed.
	p.Export.LogbookRows = EASALogbookRows
	p.Export.IsExtended = true
	p.Export.LeftMargin = 10.0
	p.Export.TopMargin = 31.0
	p.Export.BodyRow = easaBodyRowHeight
	p.Export.FooterRow = 6.0
	p.Export.Fill = 3
	p.Export.ReplaceSPTime = true

	if !p.Export.IncludeSignature {
		p.SignatureImage = ""
	}

	p.initHeaders()
	p.initColumns()

	return nil
}

// initHeaders initializes headers for the logbook
func (p *PDFExporter) initHeaders() {
	p.headers = Headers{
		header1: []string{"1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"},

		header2: []string{
			"DATE\n(dd/mm/yy)", "DEPARTURE", "ARRIVAL", "AIRCRAFT", "SINGLE-PILOT TIME",
			"MULTI-PILOT TIME", "TOTAL TIME\nOF FLIGHT", "NAME(S) PIC", "LANDINGS",
			"OPERATIONAL\nCONDITION TIME", "PILOT FUNCTION TIME", "FSTD SESSION",
			"REMARKS AND\nENDORSEMENTS",
		},
		header3: []string{
			"", "PLACE", "TIME", "PLACE", "TIME", "MAKE, MODEL,\nVARIANT", "REGISTRATION",
			"SE", "ME", "", "", "", "DAY", "NIGHT", "NIGHT", "IFR",
			"PIC", "CO-PILOT", "DUAL", "INSTRUCTOR", "TYPE", "TOTAL TIME\nOF SESSION", "",
		},
	}
}

// initColumns initializes columns for the logbook
func (p *PDFExporter) initColumns() {
	c := p.Export.Columns

	p.columns = ColumnWidths{
		w1: []float64{
			c.Col1,
			c.Col2 + c.Col3,
			c.Col4 + c.Col5,
			c.Col6 + c.Col7,
			c.Col8 + c.Col9 + c.Col10,
			c.Col11,
			c.Col12,
			c.Col13 + c.Col14,
			c.Col15 + c.Col16,
			c.Col17 + c.Col18 + c.Col19 + c.Col20,
			c.Col21 + c.Col22,
			c.Col23,
		},
		w2: []float64{
			c.Col1,                   //date
			c.Col2 + c.Col3,          //departure
			c.Col4 + c.Col5,          //arrival
			c.Col6 + c.Col7,          //aircraft
			c.Col8 + c.Col9, c.Col10, //single, mcc
			c.Col11,                               //total time
			c.Col12,                               //pic name
			c.Col13 + c.Col14,                     //landings
			c.Col15 + c.Col16,                     //operational condition time
			c.Col17 + c.Col18 + c.Col19 + c.Col20, //pilot function time
			c.Col21 + c.Col22,                     //fstd session
			c.Col23,                               //remarks
		},
		w3: []float64{
			c.Col1,         //date
			c.Col2, c.Col3, //departue - place, time
			c.Col4, c.Col5, //arrival - place, time
			c.Col6, c.Col7, //aircraft - type, reg
			c.Col8, c.Col9, c.Col10, //se, me, mcc
			c.Col11,          //total time
			c.Col12,          //pic name
			c.Col13, c.Col14, //landings - day, night
			c.Col15, c.Col16, //night, ifr
			c.Col17, c.Col18, c.Col19, c.Col20, //pic, cop, dual, instr
			c.Col21, c.Col22, //fstd - type, time
			c.Col23, //remarks
		},
		w4: []float64{
			c.Col1 + c.Col2, //date + departure place
			c.Col3 + c.Col4 + c.Col5 + c.Col6 + c.Col7, //departure time...aircraft reg
			c.Col8,           //se
			c.Col9,           //me
			c.Col10,          //mcc
			c.Col11,          //total
			c.Col12,          //pic name
			c.Col13, c.Col14, //landings
			c.Col15,          //night
			c.Col16,          //ifr
			c.Col17,          //pic
			c.Col18,          //cop
			c.Col19,          //dual
			c.Col20,          //instr
			c.Col21, c.Col22, //fstd type and time
			c.Col23, //remarks
		},
	}

	// extended format add Date column to the FSTD session by reducing Remarks
	if p.Export.IsExtended {
		p.columns.w1[10] += c.Col1
		p.columns.w1[11] -= c.Col1

		p.columns.w2[11] += c.Col1
		p.columns.w2[12] -= c.Col1

		p.columns.w3[22] -= c.Col1

		p.columns.w4[15] += c.Col1
		p.columns.w4[17] -= c.Col1
	}
}

// initPDF initializes the PDF object
func (p *PDFExporter) initPDF() error {
	// The application exports only A4 landscape.
	p.pdf = fpdf.New("L", "mm", "A4", "")

	// Keep every 12-row combined EASA 1-12 logbook sheet on exactly one A4 landscape page.
	p.pdf.SetAutoPageBreak(false, 0)

	// load fonts
	err := p.loadFonts()
	if err != nil {
		return err
	}

	// try to load a signature
	err = p.loadSignature()
	if err != nil {
		// just print error message, we can continue without signature
		fmt.Println(err)
	}

	p.pdf.SetLineWidth(.2)

	return nil
}

// loadFonts loads fonts for the PDF
func (p *PDFExporter) loadFonts() error {
	fonts := []string{fontRegular, fontBold, fontB612}

	for _, font := range fonts {
		fontBytes, err := content.ReadFile(fmt.Sprintf("font/%s.ttf", font))
		if err != nil {
			return fmt.Errorf("failed to read font file: %v", err)
		}

		p.pdf.AddUTF8FontFromBytes(font, "", fontBytes)
	}

	return nil
}

// loadSignature register PNG image with signature in a pdf file
func (p *PDFExporter) loadSignature() error {
	if p.SignatureImage != "" {
		unbased, err := base64.StdEncoding.DecodeString(strings.ReplaceAll(p.SignatureImage, "data:image/png;base64,", ""))
		if err != nil {
			err = fmt.Errorf("error adding signature image to the pdf file - %s, continue without signature", err)
			p.SignatureImage = ""
			return err
		}

		r := bytes.NewReader(unbased)
		p.pdf.RegisterImageReader("signature", "png", r)
	}

	return nil
}

// titlePage prints the two fixed EASA front pages: the pilot logbook
// identification page and the holder's address page. User data is
// overlaid on the official page artwork so the export preview keeps the
// familiar EASA appearance without changing the logbook pages themselves.
func (p *PDFExporter) titlePage() {

	if len(p.Export.CustomTitleBlob) != 0 {
		p.printCustomTitle()
		return
	}

	// Page 1: PILOT LOGBOOK / holder details
	if bs, err := content.ReadFile("template/easa_front_page_1.png"); err == nil {
		p.pdf.RegisterImageReader("easa-front-page-1", "png", bytes.NewReader(bs))
		p.pdf.AddPage()
		p.pdf.Image("easa-front-page-1", 0, 0, 297, 210, false, "", 0, "")

		p.pdf.SetTextColor(0, 0, 0)
		p.pdf.SetFont(fontRegular, "", 11)
		if strings.TrimSpace(p.OwnerName) != "" {
			p.pdf.SetXY(76, 100.3)
			p.pdf.CellFormat(126, 6, strings.ToUpper(p.OwnerName), "", 0, "L", false, 0, "")
		}
		if strings.TrimSpace(p.LicenseNumber) != "" {
			p.pdf.SetXY(76, 124.7)
			p.pdf.CellFormat(126, 6, strings.ToUpper(p.LicenseNumber), "", 0, "L", false, 0, "")
		}
	}

	// Page 2: HOLDER'S ADDRESS
	if bs, err := content.ReadFile("template/easa_front_page_2.png"); err == nil {
		p.pdf.RegisterImageReader("easa-front-page-2", "png", bytes.NewReader(bs))
		p.pdf.AddPage()
		p.pdf.Image("easa-front-page-2", 0, 0, 297, 210, false, "", 0, "")

		addr := strings.TrimSpace(p.Address)
		if addr != "" {
			p.pdf.SetTextColor(0, 0, 0)
			p.pdf.SetFont(fontRegular, "", 10)
			addr = strings.ToUpper(strings.ReplaceAll(addr, "\r", ""))
			lines := strings.Split(addr, "\n")
			if len(lines) == 1 {
				// Soft-wrap a single-line address to fit the first address box.
				words := strings.Fields(lines[0])
				wrapped := []string{}
				line := ""
				for _, w := range words {
					candidate := strings.TrimSpace(line + " " + w)
					if line == "" || p.pdf.GetStringWidth(candidate) <= 84 {
						line = candidate
					} else {
						wrapped = append(wrapped, line)
						line = w
					}
				}
				if line != "" {
					wrapped = append(wrapped, line)
				}
				lines = wrapped
			}
			if len(lines) > 3 {
				lines = lines[:3]
			}
			lineYs := []float64{51.6, 58.0, 64.4}
			for i, line := range lines {
				if i >= len(lineYs) {
					break
				}
				p.pdf.SetXY(26.5, lineYs[i])
				p.pdf.CellFormat(84, 5, line, "", 0, "L", false, 0, "")
			}
		}
	}
}

// printCustomTitle prints custom title page
func (p *PDFExporter) printCustomTitle() {
	// some variables and parameters
	sizes := map[string]fpdf.SizeType{
		PDFA4: {Wd: 210, Ht: 297},
	}

	type pageParams struct{ x, y, w, h float64 }
	params := map[string]map[string]pageParams{
		PDFA4: {
			"P": {x: 0, y: 0, w: 210, h: 297},
			"L": {x: 0, y: -87, w: 297, h: 297},
		},
	}

	imp := gofpdi.NewImporter()

	readSeeker := io.ReadSeeker(bytes.NewReader(p.Export.CustomTitleBlob))

	// import first page and determine page sizes
	imp.ImportPageFromStream(p.pdf, &readSeeker, 1, "/MediaBox")

	pageSizes := imp.GetPageSizes()
	nrPages := len(imp.GetPageSizes())

	// add pages of the attached custom title pdf file
	for i := 1; i <= nrPages; i++ {
		tpl := imp.ImportPageFromStream(p.pdf, &readSeeker, i, "/MediaBox")

		orientation := "P"
		if pageSizes[i]["/MediaBox"]["w"] > pageSizes[i]["/MediaBox"]["h"] {
			orientation = "L"
		}

		p.pdf.AddPageFormat(orientation, sizes[p.Format])
		imp.UseImportedTemplate(p.pdf, tpl,
			params[p.Format][orientation].x, params[p.Format][orientation].y,
			params[p.Format][orientation].w, params[p.Format][orientation].h,
		)
	}
}

// isFillLine checks if the line should be filled
func (p *PDFExporter) isFillLine() bool {
	return p.rowCounter%p.Export.Fill == 0 // fill every "fill" row only
}

// setFontLogbookHeader sets font for logbook header
func (p *PDFExporter) setFontLogbookHeader() {
	p.pdf.SetFillColor(HeaderBG.r, HeaderBG.g, HeaderBG.b)
	p.pdf.SetTextColor(HeaderText.r, HeaderText.g, HeaderText.b)
	p.pdf.SetFont(fontBold, "", HeaderFontSize)
}

// setFontLogbookFooter sets font for logbook footer
func (p *PDFExporter) setFontLogbookFooter() {
	p.setFontLogbookHeader()
}

// setFontLogbookBody sets font for logbook rows
func (p *PDFExporter) setFontLogbookBody() {
	p.pdf.SetFillColor(BodyFillBG.r, BodyFillBG.g, BodyFillBG.b)
	p.pdf.SetTextColor(BodyText.r, BodyText.g, BodyText.b)
	p.pdf.SetFont(fontRegular, "", BodyFontSize)
}

// printBodyTimeCell prints time cell in the row of the logbook
func (p *PDFExporter) printBodyTimeCell(w float64, value string, fill bool) {
	if w <= 0 {
		return
	}
	p.pdf.CellFormat(w, p.Export.BodyRow, value, "1", 0, "C", fill, 0, "")
}

// printBodyTextCell prints text cell in the row of the logbook
func (p *PDFExporter) printBodyTextCell(w float64, value string, fill bool) {
	if w <= 0 {
		return
	}
	p.pdf.CellFormat(w, p.Export.BodyRow, value, "1", 0, "L", fill, 0, "")
}

// printFooterCell prints cell in the footer of the logbook
func (p *PDFExporter) printFooterCell(w float64, value string) {
	if w <= 0 {
		return
	}
	p.pdf.CellFormat(w, p.Export.FooterRow, value, "1", 0, "C", true, 0, "")
}

// printSinglePilotTime prints time cell for single pilot in the row of the logbook
func (p *PDFExporter) printSinglePilotTime(w float64, value string, fill bool) {
	if p.Export.ReplaceSPTime && value != "" {
		// set new font with symbol support
		p.pdf.SetFont(fontB612, "", BodyFontSize)
		// put check symbol
		p.printBodyTimeCell(w, CheckSymbol, fill)
		// set back the regular font
		p.pdf.SetFont(fontRegular, "", BodyFontSize)
	} else {
		p.printBodyTimeCell(w, value, fill)
	}
}

// formatLogbookDate formats the date as required by the EASA example (dd/mm/yy).
func formatLogbookDate(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return ""
	}

	for _, layout := range []string{"02/01/2006", "2/1/2006", "02-01-2006", "2-1-2006", "2006-01-02", "02/01/06", "2/1/06"} {
		if parsed, err := time.Parse(layout, value); err == nil {
			return parsed.Format("02/01/06")
		}
	}

	return value
}

// isFSTDRecord identifies a simulator/FSTD entry so its date is printed in column 11.
func isFSTDRecord(record models.FlightRecord) bool {
	return strings.TrimSpace(record.SIM.Type) != "" || strings.TrimSpace(record.SIM.Time) != ""
}

func (p *PDFExporter) formatTimeField(timeField string) string {
	return timeField
}

func (p *PDFExporter) printBodyRemarksCell(w float64, value string, signature string, uuid string, fill bool) {
	if w <= 0 {
		return
	}

	wFactored := int(w * 0.9)
	vL := len(value)
	longCut := int(1.75 * float64(wFactored))

	if vL > longCut {
		// too long remark, cut it and set font 5
		p.pdf.SetFont(fontRegular, "", BodyFontSize-3)
		value = value[:longCut-3] + "..."

	} else if vL > wFactored*3/2 {
		// slightly long remark
		p.pdf.SetFont(fontRegular, "", BodyFontSize-3)

	} else if vL > wFactored {
		// long remark
		p.pdf.SetFont(fontRegular, "", BodyFontSize-2)
	}

	p.pdf.CellFormat(w, p.Export.BodyRow, value, "1", 0, "L", fill, 0, "")
	p.pdf.SetFont(fontRegular, "", BodyFontSize)

	if signature != "" {
		// register image
		unbased, err := base64.StdEncoding.DecodeString(strings.ReplaceAll(signature, "data:image/png;base64,", ""))
		if err != nil {
			err = fmt.Errorf("error adding signature for the flight record %s - %s, continue without signature", uuid, err)
			return
		}

		r := bytes.NewReader(unbased)
		im := p.pdf.RegisterImageReader(uuid, "png", r)
		// need to scale image so it will be with to the p.Export.BodyRow height
		// and placed at the end of the cell
		scale := p.Export.BodyRow / im.Height()
		p.pdf.Image(uuid, p.pdf.GetX()-im.Width()*scale, p.pdf.GetY(),
			im.Width()*scale, p.Export.BodyRow, false, "", 0, "")
	}
}

// printFooterLeftBlock prints left block in the footer of the logbook
func (p *PDFExporter) printFooterLeftBlock(totalName string) {
	if p.columns.w4[0] <= 0 {
		return
	}

	var border string
	switch totalName {
	case FooterThisPage:
		border = "LTR"
	case FooterPreviousPage:
		border = "LR"
	case FooterTotalTime:
		border = "LBR"
	}

	p.pdf.CellFormat(p.columns.w4[0], p.Export.FooterRow, "", border, 0, "", true, 0, "")
}

// printFooterSignatureBlock prints signature block in the footer of the logbook
func (p *PDFExporter) printFooterSignatureBlock(totalName string) {
	p.pdf.SetFont(fontRegular, "", SignatureFontSize)

	switch totalName {
	case FooterThisPage:
		if p.Export.IsExtended {
			// let's save the coordinates
			p.signatureBlockX, p.signatureBlockY = p.pdf.GetXY()
			// and put empty filled box
			p.pdf.CellFormat(p.columns.w4[17], p.Export.FooterRow, "", "LTR", 0, "C", true, 0, "")
		} else {
			p.pdf.CellFormat(p.columns.w4[17], p.Export.FooterRow, p.Signature, "LTR", 0, "C", true, 0, "")
		}
	case FooterPreviousPage:
		p.pdf.CellFormat(p.columns.w4[17], p.Export.FooterRow, "", "LR", 0, "", true, 0, "")

		if p.Export.IsExtended {
			// in case it's extended format, the remarks field can be too short to
			// include the signature text, especially for A4 format. In this case
			// there will be MultiCell function which support new line automatically
			x, y := p.pdf.GetXY()
			rowH := p.Export.FooterRow
			if len(p.Signature) > int(p.columns.w4[17]*0.8) {
				// looks like the signature text is really too long,
				// so let's fit multiline cell into one normal footerRowHeight
				rowH = p.Export.FooterRow / 2
			}
			p.pdf.SetXY(p.signatureBlockX, p.signatureBlockY)
			p.pdf.MultiCell(p.columns.w4[17], rowH, strings.TrimRight(p.Signature, "\r\n"), "LTR", "C", true)
			p.pdf.SetXY(x, y)
			// empty tiny cell to set the footerRowHeight back
			p.pdf.CellFormat(0.01, p.Export.FooterRow, "", "", 0, "", true, 0, "")
		}
	default:
		p.pdf.CellFormat(p.columns.w4[17], p.Export.FooterRow, p.OwnerName, "LBR", 0, "C", true, 0, "")
		p.printSignature()
	}
}

// printSignature prints signature in the footer of the logbook
func (p *PDFExporter) printSignature() {
	if p.SignatureImage != "" {
		p.pdf.Image("signature", p.pdf.GetX()-p.columns.w4[17], p.pdf.GetY()-p.Export.FooterRow*2, p.columns.w4[17],
			p.Export.FooterRow*3, false, "", 0, "")
	}
}

// printPageNumber prints page number in the footer of the logbook
func (p *PDFExporter) printPageNumber() {
	p.pdf.SetTextColor(0, 0, 0)
	p.pdf.SetFont(fontRegular, "", PageNumberFontSize)
	p.pdf.SetXY(p.Export.LeftMargin, 196)
	p.pdf.CellFormat(24, 3, fmt.Sprintf("page %d", p.pageCounter), "", 0, "L", false, 0, "")
}

// checkPageBreaks checks if we need to insert a page break and a new logbook started
func (p *PDFExporter) checkPageBreaks() {
	if len(p.pageBreaks) > 0 {
		if fmt.Sprintf("%d", p.pageCounter) == p.pageBreaks[0] {
			p.titlePage()

			p.pageCounter = 0

			p.pageBreaks = append(p.pageBreaks[:0], p.pageBreaks[1:]...)
		}
	}
}

// formatLandings is a helper function and formats landings field in the logbook
func formatLandings(landing int) string {
	if landing == 0 {
		return ""
	}
	return fmt.Sprintf("%d", landing)
}
