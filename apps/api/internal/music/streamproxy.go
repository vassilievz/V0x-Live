package music

import (
	"bufio"
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const (
	maxManifestBytes = 2 << 20
	maxUpstreamBody  = 128 << 20
)

var upstreamHTTP = &http.Client{
	Timeout: 90 * time.Second,
	CheckRedirect: func(req *http.Request, via []*http.Request) error {
		if len(via) >= 6 {
			return fmt.Errorf("too many redirects")
		}
		if len(via) > 0 {
			if !sameStreamHost(via[0].URL, req.URL) {
				return fmt.Errorf("redirect to foreign host")
			}
		}
		return nil
	},
}

func sameStreamHost(a, b *url.URL) bool {
	return strings.EqualFold(a.Hostname(), b.Hostname())
}

// AllowedStreamURL ensures segment/sub-playlist URLs stay on the same CDN host as the room anchor URL.
func AllowedStreamURL(anchorRaw, targetRaw string) (*url.URL, bool) {
	anchor, err := url.Parse(strings.TrimSpace(anchorRaw))
	if err != nil || anchor.Scheme != "https" || anchor.Host == "" {
		return nil, false
	}
	target, err := url.Parse(strings.TrimSpace(targetRaw))
	if err != nil || target.Scheme != "https" || target.Host == "" {
		return nil, false
	}
	if target.User != nil {
		return nil, false
	}
	ah := strings.ToLower(anchor.Hostname())
	th := strings.ToLower(target.Hostname())
	if th != ah && !strings.HasSuffix(th, "."+ah) && !strings.HasSuffix(ah, "."+th) {
		return nil, false
	}
	return target, true
}

func resolvePlaylistURI(manifestURL *url.URL, line string) (string, bool) {
	line = strings.TrimSpace(line)
	if line == "" || strings.HasPrefix(line, "#") {
		return "", false
	}
	if strings.HasPrefix(line, "http://") || strings.HasPrefix(line, "https://") {
		return line, true
	}
	ref, err := url.Parse(line)
	if err != nil {
		return "", false
	}
	abs := manifestURL.ResolveReference(ref)
	if abs.Scheme != "https" {
		return "", false
	}
	return abs.String(), true
}

func rewriteHLSTagURIs(manifestURL *url.URL, anchorRaw, line string, proxySeg func(string) string) string {
	const needle = `URI="`
	idx := strings.Index(line, needle)
	if idx < 0 {
		return line
	}
	start := idx + len(needle)
	endRel := strings.Index(line[start:], `"`)
	if endRel < 0 {
		return line
	}
	end := start + endRel
	inner := line[start:end]
	abs, ok := resolvePlaylistURI(manifestURL, inner)
	if !ok {
		return line
	}
	if _, ok := AllowedStreamURL(anchorRaw, abs); !ok {
		return line
	}
	return line[:start] + proxySeg(abs) + line[end:]
}

func rewriteHLSManifest(manifestURL *url.URL, anchorRaw string, body []byte, proxySeg func(string) string) ([]byte, error) {
	var out strings.Builder
	scanner := bufio.NewScanner(bytes.NewReader(body))
	scanner.Buffer(make([]byte, 0, 64*1024), 1024*1024)
	for scanner.Scan() {
		line := scanner.Text()
		if uri, ok := resolvePlaylistURI(manifestURL, line); ok {
			if _, ok := AllowedStreamURL(anchorRaw, uri); !ok {
				return nil, fmt.Errorf("disallowed playlist uri host")
			}
			out.WriteString(proxySeg(uri))
			out.WriteByte('\n')
			continue
		}
		if strings.Contains(line, `URI="`) {
			out.WriteString(rewriteHLSTagURIs(manifestURL, anchorRaw, line, proxySeg))
			out.WriteByte('\n')
			continue
		}
		out.WriteString(line)
		out.WriteByte('\n')
	}
	if err := scanner.Err(); err != nil {
		return nil, err
	}
	return []byte(out.String()), nil
}

func fetchUpstream(ctx context.Context, rawURL string, rangeHeader string) (*http.Response, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, rawURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "V0xLive-WatchParty/1.0")
	if rangeHeader != "" {
		req.Header.Set("Range", rangeHeader)
	}
	return upstreamHTTP.Do(req)
}

func readUpstreamBody(res *http.Response, limit int64) ([]byte, error) {
	defer res.Body.Close()
	return io.ReadAll(io.LimitReader(res.Body, limit))
}

func copyUpstream(w http.ResponseWriter, res *http.Response, limit int64) error {
	defer res.Body.Close()
	w.Header().Set("Accept-Ranges", "bytes")
	for k, v := range res.Header {
		lk := strings.ToLower(k)
		switch lk {
		case "content-type", "content-length", "content-range", "etag", "last-modified", "cache-control":
			for _, vv := range v {
				w.Header().Add(k, vv)
			}
		}
	}
	w.WriteHeader(res.StatusCode)
	_, err := io.Copy(w, io.LimitReader(res.Body, limit))
	return err
}
