package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

const (
	openLibraryBaseURL = "https://openlibrary.org"
	openLibraryCovers  = "https://covers.openlibrary.org"
	minSearchQueryLen  = 2
	maxSearchResults   = 10
)

// BookSearchResult is the normalized shape returned to the frontend.
type BookSearchResult struct {
	ExternalID string `json:"externalId"`
	Title      string `json:"title"`
	Author     string `json:"author"`
	Pages      int    `json:"pages"`
	Year       int    `json:"year"`
	Genre      Genre  `json:"genre"`
	CoverURL   string `json:"coverUrl"`
}

type openLibraryDoc struct {
	Key              string   `json:"key"`
	Title            string   `json:"title"`
	AuthorName       []string `json:"author_name"`
	NumberOfPages    int      `json:"number_of_pages_median"`
	FirstPublishYear int      `json:"first_publish_year"`
	CoverI           int      `json:"cover_i"`
	Subject          []string `json:"subject"`
}

type openLibraryResponse struct {
	Docs []openLibraryDoc `json:"docs"`
}

// BookSearcher queries Open Library. baseURL is injectable for tests.
type BookSearcher struct {
	client  *http.Client
	baseURL string
}

func NewBookSearcher() *BookSearcher {
	return &BookSearcher{
		client:  &http.Client{Timeout: 5 * time.Second},
		baseURL: openLibraryBaseURL,
	}
}

func (s *BookSearcher) Search(ctx context.Context, query string) ([]BookSearchResult, error) {
	params := url.Values{}
	params.Set("q", query)
	params.Set("limit", fmt.Sprint(maxSearchResults))
	params.Set("fields", "key,title,author_name,number_of_pages_median,first_publish_year,cover_i,subject")

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, s.baseURL+"/search.json?"+params.Encode(), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "shelf-app (personal reading tracker)")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("open library returned status %d", resp.StatusCode)
	}

	var body openLibraryResponse
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return nil, err
	}

	results := make([]BookSearchResult, 0, len(body.Docs))
	for _, doc := range body.Docs {
		if doc.Title == "" {
			continue
		}
		results = append(results, normalizeBookDoc(doc))
	}
	return results, nil
}

func normalizeBookDoc(doc openLibraryDoc) BookSearchResult {
	result := BookSearchResult{
		ExternalID: strings.TrimPrefix(doc.Key, "/works/"),
		Title:      doc.Title,
		Pages:      doc.NumberOfPages,
		Year:       doc.FirstPublishYear,
		Genre:      mapSubjectsToGenre(doc.Subject),
	}
	if len(doc.AuthorName) > 0 {
		result.Author = doc.AuthorName[0]
	}
	if doc.CoverI > 0 {
		result.CoverURL = fmt.Sprintf("%s/b/id/%d-M.jpg", openLibraryCovers, doc.CoverI)
	}
	return result
}

// genreKeywords is ordered: first matching rule wins.
var genreKeywords = []struct {
	genre    Genre
	keywords []string
}{
	{Fantasy, []string{"fantasy"}},
	{ScienceFiction, []string{"science fiction", "sci-fi"}},
	{MagicRealism, []string{"magic realism", "magical realism"}},
	{Thriller, []string{"thriller", "suspense", "mystery", "detective"}},
	{Travel, []string{"travel"}},
	{PopularScience, []string{"popular science", "science", "physics", "biology", "astronomy"}},
	{Classic, []string{"classic"}},
	{CotemporaryFiction, []string{"fiction", "novel"}},
}

func mapSubjectsToGenre(subjects []string) Genre {
	for _, rule := range genreKeywords {
		for _, subject := range subjects {
			lower := strings.ToLower(subject)
			for _, kw := range rule.keywords {
				if strings.Contains(lower, kw) {
					return rule.genre
				}
			}
		}
	}
	return AnyBook
}

func SearchBooksHandler(searcher *BookSearcher) gin.HandlerFunc {
	return func(c *gin.Context) {
		q := strings.TrimSpace(c.Query("q"))
		if len([]rune(q)) < minSearchQueryLen {
			c.JSON(http.StatusBadRequest, gin.H{"error": "query must be at least 2 characters"})
			return
		}

		results, err := searcher.Search(c.Request.Context(), q)
		if err != nil {
			c.JSON(http.StatusBadGateway, gin.H{"error": "book search is unavailable right now"})
			return
		}
		c.JSON(http.StatusOK, results)
	}
}
