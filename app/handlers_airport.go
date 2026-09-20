package main

import (
	"bytes"
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/vsimakhin/web-logbook/internal/models"
)

// HandlerAirportByID returns airport record by ID (ICAO or IATA)
func (app *application) HandlerApiAirportByID(w http.ResponseWriter, r *http.Request) {
	uuid := strings.ToUpper(chi.URLParam(r, "id"))

	airport, err := app.db.GetAirportByID(uuid)
	if err != nil {
		app.handleError(w, err)
		return
	}

	if airport.IATA == "" && airport.ICAO == "" {
		// looks like there is no such ID in airport database
		app.warningLog.Printf("cannot find %s in the airport database\n", uuid)
		app.writeJSON(w, http.StatusNotFound, models.JSONResponse{OK: false, Message: "Airport not found"})
		return
	}

	app.writeJSON(w, http.StatusOK, airport)
}

// HandlerApiStandardAirportList returns a list of standard airports
func (app *application) HandlerApiStandardAirportList(w http.ResponseWriter, r *http.Request) {
	airports, err := app.db.GetStandardAirports()
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeJSON(w, http.StatusOK, airports)
}

// HandlerApiCustomAirportList returns a list of custom airports
func (app *application) HandlerApiCustomAirportList(w http.ResponseWriter, r *http.Request) {
	airports, err := app.db.GetCustomAirports()
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeJSON(w, http.StatusOK, airports)
}

// HandlerApiAirportList returns a list of all airports
func (app *application) HandlerApiAirportList(w http.ResponseWriter, r *http.Request) {
	airports, err := app.db.GetAllAirports()
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeJSON(w, http.StatusOK, airports)
}

func (app *application) downloadAirportDB(source string) ([]models.Airport, error) {
	if source == "" {
		source = models.DefaultAirportDBSource
	}

	ctx, cancel := context.WithTimeout(context.Background(), 300*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, source, nil)
	if err != nil {
		return nil, err
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return nil, fmt.Errorf("airport database download failed: %s", resp.Status)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if strings.Contains(source, "airports.json") {
		return app.parseJSONAirports(body)
	}
	return app.parseCSVAirports(body)
}

func (app *application) parseJSONAirports(data []byte) ([]models.Airport, error) {
	type airportJSON struct {
		ICAO      string  `json:"icao"`
		IATA      string  `json:"iata"`
		Name      string  `json:"name"`
		City      string  `json:"city"`
		Country   string  `json:"country"`
		Elevation float64 `json:"elevation"`
		Lat       float64 `json:"lat"`
		Lon       float64 `json:"lon"`
	}

	var airportsMap map[string]airportJSON
	if err := json.Unmarshal(data, &airportsMap); err != nil {
		return nil, err
	}

	airports := make([]models.Airport, 0, len(airportsMap))
	for _, a := range airportsMap {
		airports = append(airports, models.Airport{
			ICAO:      a.ICAO,
			IATA:      a.IATA,
			Name:      a.Name,
			City:      a.City,
			Country:   a.Country,
			Elevation: int(a.Elevation),
			Lat:       a.Lat,
			Lon:       a.Lon,
		})
	}
	return airports, nil
}

func (app *application) parseCSVAirports(data []byte) ([]models.Airport, error) {
	r := csv.NewReader(bytes.NewReader(data))
	records, err := r.ReadAll()
	if err != nil {
		return nil, err
	}
	if len(records) == 0 {
		return []models.Airport{}, nil
	}

	header := make(map[string]int, len(records[0]))
	for i, name := range records[0] {
		header[strings.TrimSpace(strings.ToLower(name))] = i
	}
	field := func(record []string, name string) string {
		i, ok := header[name]
		if !ok || i < 0 || i >= len(record) {
			return ""
		}
		return strings.TrimSpace(record[i])
	}

	airports := make([]models.Airport, 0, len(records)-1)
	for _, record := range records[1:] {
		ident := strings.ToUpper(field(record, "ident"))
		icao := strings.ToUpper(field(record, "icao_code"))
		if icao == "" {
			icao = strings.ToUpper(field(record, "gps_code"))
		}
		if icao == "" {
			icao = ident
		}
		if icao == "" {
			continue
		}

		iata := strings.ToUpper(field(record, "iata_code"))
		elevation, _ := strconv.Atoi(field(record, "elevation_ft"))
		lat, _ := strconv.ParseFloat(field(record, "latitude_deg"), 64)
		lon, _ := strconv.ParseFloat(field(record, "longitude_deg"), 64)

		airports = append(airports, models.Airport{
			ICAO:      icao,
			IATA:      iata,
			Name:      field(record, "name"),
			City:      field(record, "municipality"),
			Country:   field(record, "iso_country"),
			Elevation: elevation,
			Lat:       lat,
			Lon:       lon,
		})
	}
	return airports, nil
}

// HandlerAirportUpdate updates the Airports DB
func (app *application) HandlerApiAirportDBUpdate(w http.ResponseWriter, r *http.Request) {
	airports, err := app.downloadAirportDB(models.DefaultAirportDBSource)
	if err != nil {
		app.handleError(w, err)
		return
	}

	err = app.db.UpdateAirportDB(airports, true)
	if err != nil {
		app.handleError(w, err)
		return
	}
	app.writeJSON(w, http.StatusOK, "Airports DB updated")
}

// HandlerAirportAddCustom adds a new custom airport
func (app *application) HandlerApiAirportCustomNew(w http.ResponseWriter, r *http.Request) {
	var airport models.Airport
	err := json.NewDecoder(r.Body).Decode(&airport)
	if err != nil {
		app.handleError(w, err)
		return
	}

	err = app.db.AddCustomAirport(airport)
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeJSON(w, http.StatusOK, "Custom airport added")
}

// HandlerAirportUpdateCustom updates a custom airport
func (app *application) HandlerApiAirportCustomUpdate(w http.ResponseWriter, r *http.Request) {
	var airport models.Airport
	err := json.NewDecoder(r.Body).Decode(&airport)
	if err != nil {
		app.handleError(w, err)
		return
	}

	err = app.db.UpdateCustomAirport(airport)
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeJSON(w, http.StatusOK, "Custom airport updated")
}

// HandlerApiAirportCustomDelete removes a custom airport
func (app *application) HandlerApiAirportCustomDelete(w http.ResponseWriter, r *http.Request) {
	var airport models.Airport
	err := json.NewDecoder(r.Body).Decode(&airport)
	if err != nil {
		app.handleError(w, err)
		return
	}

	err = app.db.RemoveCustomAirport(airport.Name)
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeJSON(w, http.StatusOK, "Custom airport removed")
}
