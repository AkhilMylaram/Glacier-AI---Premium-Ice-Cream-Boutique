package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strings"
)

// Config holds service configurations
type Config struct {
	Port              string
	AuthServiceURL    string
	CatalogServiceURL string
}

// Response represents a standardized API response
type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

func main() {
	// Load configuration
	config := loadConfig()

	// Create router
	mux := http.NewServeMux()

	// Health check endpoint
	mux.HandleFunc("/health", healthHandler)

	// API routes
	mux.HandleFunc("/api/", apiHandler(config))

	// Legacy routes for backward compatibility
	mux.HandleFunc("/list", legacyHandler(config))
	mux.HandleFunc("/auth", legacyHandler(config))
	mux.HandleFunc("/order", legacyHandler(config))

	// CORS middleware
	handler := corsMiddleware(mux)

	// Start server
	log.Printf("API Gateway starting on port %s", config.Port)
	log.Printf("Auth Service: %s", config.AuthServiceURL)
	log.Printf("Catalog Service: %s", config.CatalogServiceURL)

	if err := http.ListenAndServe(":"+config.Port, handler); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}

func loadConfig() Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	authURL := os.Getenv("AUTH_SERVICE_URL")
	if authURL == "" {
		authURL = "http://localhost:3001"
	}

	catalogURL := os.Getenv("CATALOG_SERVICE_URL")
	if catalogURL == "" {
		catalogURL = "http://localhost:3002"
	}

	return Config{
		Port:              port,
		AuthServiceURL:    authURL,
		CatalogServiceURL: catalogURL,
	}
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(Response{
		Success: true,
		Message: "API Gateway is healthy",
		Data: map[string]string{
			"service": "api-gateway",
			"version": "1.0.0",
		},
	})
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func apiHandler(config Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		method := r.Method

		log.Printf("Incoming request: %s %s", method, path)

		// Route to appropriate service
		switch {
		case strings.HasPrefix(path, "/api/auth"):
			routeToService(w, r, config.AuthServiceURL, "/api/auth")
		case strings.HasPrefix(path, "/api/catalog"):
			routeToService(w, r, config.CatalogServiceURL, "/api/catalog")
		case strings.HasPrefix(path, "/api/products"):
			routeToService(w, r, config.CatalogServiceURL, "/api/products")
		case strings.HasPrefix(path, "/api/orders"):
			routeToService(w, r, config.CatalogServiceURL, "/api/orders")
		case strings.HasPrefix(path, "/api/categories"):
			routeToService(w, r, config.CatalogServiceURL, "/api/categories")
		case strings.HasPrefix(path, "/api/search"):
			routeToService(w, r, config.CatalogServiceURL, "/api/search")
		default:
			http.NotFound(w, r)
		}
	}
}

func legacyHandler(config Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path

		log.Printf("Legacy request: %s %s", r.Method, path)

		switch {
		case strings.HasPrefix(path, "/list"):
			routeToService(w, r, config.CatalogServiceURL, "/api/products")
		case strings.HasPrefix(path, "/auth"):
			routeToService(w, r, config.AuthServiceURL, "/api/auth")
		case strings.HasPrefix(path, "/order"):
			routeToService(w, r, config.CatalogServiceURL, "/api/orders")
		default:
			http.NotFound(w, r)
		}
	}
}

func routeToService(w http.ResponseWriter, r *http.Request, serviceURL string, prefix string) {
	// Parse target URL
	target, err := url.Parse(serviceURL)
	if err != nil {
		log.Printf("Error parsing target URL: %v", err)
		http.Error(w, "Service unavailable", http.StatusServiceUnavailable)
		return
	}

	// Create reverse proxy
	proxy := httputil.NewSingleHostReverseProxy(target)

	// Modify request
	proxy.Director = func(req *http.Request) {
		req.URL.Scheme = target.Scheme
		req.URL.Host = target.Host

		// Rewrite path
		originalPath := r.URL.Path
		newPath := strings.TrimPrefix(originalPath, prefix)
		if newPath == "" {
			newPath = "/"
		}
		if !strings.HasPrefix(newPath, "/") {
			newPath = "/" + newPath
		}
		req.URL.Path = newPath
		req.URL.RawQuery = r.URL.RawQuery

		// Copy headers
		req.Header = r.Header.Clone()

		log.Printf("Routing %s %s to %s%s", r.Method, originalPath, serviceURL, newPath)
	}

	// Handle errors
	proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
		log.Printf("Proxy error: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusServiceUnavailable)
		json.NewEncoder(w).Encode(Response{
			Success: false,
			Error:   "Service unavailable",
		})
	}

	// Modify response to ensure consistent format
	proxy.ModifyResponse = func(resp *http.Response) error {
		// Only modify JSON responses
		contentType := resp.Header.Get("Content-Type")
		if !strings.Contains(contentType, "application/json") {
			return nil
		}

		// Read body
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return err
		}
		resp.Body.Close()

		// Parse existing response
		var existingResponse map[string]interface{}
		if err := json.Unmarshal(body, &existingResponse); err != nil {
			// If not valid JSON, wrap it
			resp.Body = io.NopCloser(bytes.NewReader(body))
			return nil
		}

		// Check if it's already in our format
		if _, hasSuccess := existingResponse["success"]; hasSuccess {
			resp.Body = io.NopCloser(bytes.NewReader(body))
			return nil
		}

		// Wrap in standard format
		wrappedResponse := Response{
			Success: true,
			Data:    existingResponse,
		}

		// Handle error responses
		if resp.StatusCode >= 400 {
			wrappedResponse.Success = false
			if errMsg, ok := existingResponse["error"]; ok {
				wrappedResponse.Error = fmt.Sprintf("%v", errMsg)
			} else if errMsg, ok := existingResponse["message"]; ok {
				wrappedResponse.Error = fmt.Sprintf("%v", errMsg)
			} else {
				wrappedResponse.Error = "Request failed"
			}
			wrappedResponse.Data = nil
		}

		// Re-encode
		newBody, err := json.Marshal(wrappedResponse)
		if err != nil {
			return err
		}

		resp.Body = io.NopCloser(bytes.NewReader(newBody))
		resp.ContentLength = int64(len(newBody))
		resp.Header.Set("Content-Length", fmt.Sprintf("%d", len(newBody)))

		return nil
	}

	// Serve
	proxy.ServeHTTP(w, r)
}
