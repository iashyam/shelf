package main

import (
	"encoding/json"
	"fmt"
	"go.mongodb.org/mongo-driver/v2/bson"
	"time"
)

type Document interface {
	GetID() bson.ObjectID
	SetID(bson.ObjectID)
}

type Genre int

const (
	AnyBook Genre = iota
	Travel
	Thriller
	ScienceFiction
	PopularScience
	Classic
	MagicRealism
	CotemporaryFiction
	Fantasy
)

var genreStrings = map[Genre]string{
	AnyBook:            "anyBook",
	Travel:             "travel",
	Thriller:           "thriller",
	ScienceFiction:     "scienceFiction",
	PopularScience:     "popularScience",
	Classic:            "classic",
	MagicRealism:       "magicRealism",
	CotemporaryFiction: "contemporaryFiction",
	Fantasy:            "fantasy",
}

var stringToGenre = map[string]Genre{
	"anyBook":             AnyBook,
	"travel":              Travel,
	"thriller":            Thriller,
	"scienceFiction":      ScienceFiction,
	"popularScience":      PopularScience,
	"classic":             Classic,
	"magicRealism":        MagicRealism,
	"contemporaryFiction": CotemporaryFiction,
	"fantasy":             Fantasy,
}

func (g Genre) String() string {
	if s, ok := genreStrings[g]; ok {
		return s
	}
	return "unknown"
}

func (g Genre) MarshalJSON() ([]byte, error) {
	return []byte(`"` + g.String() + `"`), nil
}

func (g *Genre) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}
	if genre, ok := stringToGenre[s]; ok {
		*g = genre
		return nil
	}
	return fmt.Errorf("invalid genre: %s", s)
}

type WatchGenre int

const (
	General WatchGenre = iota
	Action
	Comedy
	Drama
	Horror
	WatchThriller
	Romance
	Documentary
	Animation
	Crime
	SciFi
	WatchFantasy
	Mystery
	Adventure
	Family
)

var watchGenreStrings = map[WatchGenre]string{
	General:       "general",
	Action:        "action",
	Comedy:        "comedy",
	Drama:         "drama",
	Horror:        "horror",
	WatchThriller: "thriller",
	Romance:       "romance",
	Documentary:   "documentary",
	Animation:     "animation",
	Crime:         "crime",
	SciFi:         "sciFi",
	WatchFantasy:  "fantasy",
	Mystery:       "mystery",
	Adventure:     "adventure",
	Family:        "family",
}

var stringToWatchGenre = map[string]WatchGenre{
	"general":     General,
	"action":      Action,
	"comedy":      Comedy,
	"drama":       Drama,
	"horror":      Horror,
	"thriller":    WatchThriller,
	"romance":     Romance,
	"documentary": Documentary,
	"animation":   Animation,
	"crime":       Crime,
	"sciFi":       SciFi,
	"fantasy":     WatchFantasy,
	"mystery":     Mystery,
	"adventure":   Adventure,
	"family":      Family,
}

func (g WatchGenre) String() string {
	if s, ok := watchGenreStrings[g]; ok {
		return s
	}
	return "unknown"
}

func (g WatchGenre) MarshalJSON() ([]byte, error) {
	return []byte(`"` + g.String() + `"`), nil
}

func (g *WatchGenre) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}
	if genre, ok := stringToWatchGenre[s]; ok {
		*g = genre
		return nil
	}
	return fmt.Errorf("invalid genre: %s", s)
}

type BookStatus string

const (
	BookToRead           BookStatus = "toRead"
	BookCurrentlyReading BookStatus = "currentlyReading"
	BookRead             BookStatus = "read"
)

type MovieStatus string

const (
	MovieWatchlist         MovieStatus = "watchlist"
	MovieCurrentlyWatching MovieStatus = "currentlyWatching"
	MovieWatched           MovieStatus = "watched"
)

type ShowStatus string

const (
	ShowWatchlist         ShowStatus = "watchlist"
	ShowCurrentlyWatching ShowStatus = "currentlyWatching"
	ShowWatched           ShowStatus = "watched"
)

type BookList struct {
	ID    bson.ObjectID `bson:"_id,omitempty" json:"id"`
	Books []Book        `bson:"books" json:"books"`
}

type MoviesList struct {
	ID     bson.ObjectID `bson:"_id,omitempty" json:"id"`
	Movies []Movie       `bson:"movies" json:"movies"`
}

type Book struct {
	ID        bson.ObjectID `bson:"_id,omitempty" json:"id"`
	Title     string        `bson:"title" json:"title"`
	Author    string        `bson:"author" json:"author"`
	StartDate time.Time     `bson:"startDate" json:"startDate"`
	EndDate   time.Time     `bson:"endDate" json:"endDate"`
	Status    BookStatus    `bson:"status" json:"status"`
	Pages     int           `bson:"pages" json:"pages"`
	Genre     Genre         `bson:"genre" json:"genre"`

	// Set when the book was added through external search.
	ExternalID string `bson:"externalId,omitempty" json:"externalId,omitempty"`
	CoverURL   string `bson:"coverUrl,omitempty" json:"coverUrl,omitempty"`
	Year       int    `bson:"year,omitempty" json:"year,omitempty"`
}

type Movie struct {
	ID        bson.ObjectID `bson:"_id,omitempty" json:"id"`
	Title     string        `bson:"title" json:"title"`
	Director  string        `bson:"director" json:"director"`
	StartDate time.Time     `bson:"startDate" json:"startDate"`
	EndDate   time.Time     `bson:"endDate" json:"endDate"`
	Status    MovieStatus   `bson:"status" json:"status"`
	Length    int           `bson:"length" json:"length"`
	Genre     WatchGenre    `bson:"genre" json:"genre"`
}

type Show struct {
	ID        bson.ObjectID `bson:"_id,omitempty" json:"id"`
	Title     string        `bson:"title" json:"title"`
	Director  string        `bson:"director" json:"director"`
	StartDate time.Time     `bson:"startDate" json:"startDate"`
	EndDate   time.Time     `bson:"endDate" json:"endDate"`
	Seasons   int           `bson:"seasons" json:"seasons"`
	Status    ShowStatus    `bson:"status" json:"status"`
	Genre     WatchGenre    `bson:"genre" json:"genre"`
}

func (b Book) GetID() bson.ObjectID   { return b.ID }
func (b Book) SetID(id bson.ObjectID) { b.ID = id }

func (m Movie) GetID() bson.ObjectID   { return m.ID }
func (m Movie) SetID(id bson.ObjectID) { m.ID = id }

func (s Show) GetID() bson.ObjectID   { return s.ID }
func (s Show) SetID(id bson.ObjectID) { s.ID = id }
