package main

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

const fakeOpenLibraryBody = `{"docs":[
 {"key":"/works/OL1W","title":"Dune","author_name":["Frank Herbert"],"number_of_pages_median":412,"first_publish_year":1965,"cover_i":123,"subject":["Science fiction","Deserts"]},
 {"key":"/works/OL2W","title":"Obscure Book"},
 {"key":"/works/OL3W","title":""}
]}`

func newFakeSearcher(t *testing.T, status int, body string) *BookSearcher {
	t.Helper()
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/search.json" || r.URL.Query().Get("q") == "" {
			t.Errorf("unexpected request: %s", r.URL.String())
		}
		w.WriteHeader(status)
		_, _ = w.Write([]byte(body))
	}))
	t.Cleanup(srv.Close)
	return &BookSearcher{client: srv.Client(), baseURL: srv.URL}
}

func TestSearchNormalizesResults(t *testing.T) {
	s := newFakeSearcher(t, http.StatusOK, fakeOpenLibraryBody)

	results, err := s.Search(context.Background(), "dune")
	if err != nil {
		t.Fatal(err)
	}
	if len(results) != 2 {
		t.Fatalf("want 2 results (empty title skipped), got %d", len(results))
	}

	dune := results[0]
	if dune.ExternalID != "OL1W" || dune.Author != "Frank Herbert" || dune.Pages != 412 || dune.Year != 1965 {
		t.Errorf("unexpected normalization: %+v", dune)
	}
	if dune.Genre != ScienceFiction {
		t.Errorf("want scienceFiction, got %v", dune.Genre)
	}
	if dune.CoverURL != "https://covers.openlibrary.org/b/id/123-M.jpg" {
		t.Errorf("unexpected cover url: %s", dune.CoverURL)
	}

	obscure := results[1]
	if obscure.Pages != 0 || obscure.CoverURL != "" || obscure.Author != "" || obscure.Genre != AnyBook {
		t.Errorf("missing fields should be zero values: %+v", obscure)
	}
}

func TestSearchUpstreamErrorReturnsError(t *testing.T) {
	s := newFakeSearcher(t, http.StatusInternalServerError, "oops")
	if _, err := s.Search(context.Background(), "dune"); err == nil {
		t.Fatal("expected error on upstream 500")
	}
}

func TestMapSubjectsToGenre(t *testing.T) {
	cases := []struct {
		subjects []string
		want     Genre
	}{
		{[]string{"Fantasy fiction"}, Fantasy},
		{[]string{"Fiction", "Mystery"}, Thriller},
		{[]string{"Travel writing"}, Travel},
		{[]string{"Fiction"}, CotemporaryFiction},
		{[]string{"Cooking"}, AnyBook},
		{nil, AnyBook},
	}
	for _, tc := range cases {
		if got := mapSubjectsToGenre(tc.subjects); got != tc.want {
			t.Errorf("subjects %v: want %v, got %v", tc.subjects, tc.want, got)
		}
	}
}

func TestSearchBooksHandlerRejectsShortQuery(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/search/books", SearchBooksHandler(newFakeSearcher(t, http.StatusOK, fakeOpenLibraryBody)))

	for _, path := range []string{"/search/books", "/search/books?q=a", "/search/books?q=%20%20"} {
		w := httptest.NewRecorder()
		r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, path, nil))
		if w.Code != http.StatusBadRequest {
			t.Errorf("%s: want 400, got %d", path, w.Code)
		}
	}
}

func TestSearchBooksHandlerReturnsBadGatewayOnUpstreamFailure(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/search/books", SearchBooksHandler(newFakeSearcher(t, http.StatusInternalServerError, "x")))

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/search/books?q=dune", nil))
	if w.Code != http.StatusBadGateway {
		t.Errorf("want 502, got %d", w.Code)
	}
}
