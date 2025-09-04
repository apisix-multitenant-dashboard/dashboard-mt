// handler/monitoring.go
package monitoring

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"
	"time"

	"github.com/apisix/manager-api/internal/conf"
	"github.com/apisix/manager-api/internal/core/context_global"
	"github.com/apisix/manager-api/internal/core/store"
	"github.com/gin-gonic/gin"
)

type InstanceSummary struct {
	Name     string             `json:"name"`
	Prefix   string             `json:"prefix"`
	Status   string             `json:"status"`
	Counters map[string]int     `json:"counters"`
	Metrics  map[string]float64 `json:"metrics"`
}

func IsInstanceUp(adminURL, adminKey string) bool {
	client := http.Client{
		Timeout: 2 * time.Second,
	}
	req, err := http.NewRequest("GET", adminURL+"/routes", nil)
	if err != nil {
		fmt.Printf("Request creation error: %v\n", err)
		return false
	}
	req.Header.Add("X-API-Key", adminKey)

	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("Request error: %v\n", err)
		return false
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		fmt.Printf("Read body error: %v\n", err)
		return false
	}

	fmt.Printf("Response from %s:\n%s\n", adminURL, string(body))

	if resp.StatusCode != http.StatusOK {
		fmt.Printf("Unexpected status code: %d\n", resp.StatusCode)
		return false
	}

	return true
}
func FetchPrometheusMetrics(prometheusURL string) (map[string]float64, error) {
	metrics := make(map[string]float64)
	resp, err := http.Get(prometheusURL)
	if err != nil {
		return metrics, err
	}
	defer resp.Body.Close()

	body, _ := ioutil.ReadAll(resp.Body)
	lines := strings.Split(string(body), "\n")

	for _, line := range lines {
		if strings.HasPrefix(line, "apisix_http_requests_total") {
			var value float64
			_, err := fmt.Sscanf(line, "apisix_http_requests_total %f", &value)
			if err == nil {
				metrics["requests_total"] = value
			}
		}

		
		states := []string{"accepted", "active", "handled", "reading", "writing", "waiting"}
		for _, state := range states {
			if strings.Contains(line, fmt.Sprintf(`state="%s"`, state)) {
				var value float64
				_, err := fmt.Sscanf(line, fmt.Sprintf(`apisix_nginx_http_current_connections{state="%s"} %%f`, state), &value)
				if err == nil {
					metrics["connections_"+state] = value
				}
			}
		}
	}

	return metrics, nil
}

func MonitoringSummary(c *gin.Context) {
	var out []InstanceSummary
	prefixValue := context_global.ContextGlobal.Value("etcdPrefix")
	currentPrefix, _ := prefixValue.(string)
	for name, cluster := range conf.GlobalConf.Clusters {
		prefix := cluster.Prefix
		adminURL := cluster.AdminURL
		prometheusURL := cluster.PrometheusURL
		context_global.SetEtcdPrefix(prefix)
		status := "DOWN"
		if IsInstanceUp(adminURL, "edd1c9f034335f136f87ad84b625c8f1") {
			status = "UP"
		}
		counters := make(map[string]int)
		storeKeys := []struct {
			key   store.HubKey
			label string
		}{
			{store.HubKeyRoute, "routes"},
			{store.HubKeyService, "services"},
			{store.HubKeyUpstream, "upstreams"},
			{store.HubKeyConsumer, "consumers"},
			{store.HubKeyProto, "protos"},
			{store.HubKeyGlobalRule, "global_rules"},
			{store.HubKeySsl, "ssls"},
		}

		for _, sk := range storeKeys {
			st, err := store.GetStoreByPrefix(prefix, sk.key)
			if err != nil {
				counters[sk.label] = 0
				continue
			}
			li, _ := st.List(context_global.ContextGlobal, store.ListInput{})
			counters[sk.label] = li.TotalSize
		}
		metrics, err := FetchPrometheusMetrics(prometheusURL)
		if err != nil {
			metrics = map[string]float64{}
		}
		out = append(out, InstanceSummary{
			Name:     name,
			Prefix:   prefix,
			Status:   status,
			Counters: counters,
			Metrics:  metrics,
		})
	}

	if currentPrefix != "" {
		context_global.SetEtcdPrefix(currentPrefix)
	}

	c.JSON(http.StatusOK, gin.H{
		"instances":  out,
		"updated_at": time.Now().Unix(),
	})

}
