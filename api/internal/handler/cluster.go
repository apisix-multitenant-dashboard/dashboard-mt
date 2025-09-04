package handler

import (
	"net/http"

	"github.com/apisix/manager-api/internal/conf"
	"github.com/gin-gonic/gin"
)

func GetClusters(c *gin.Context) {
	c.JSON(http.StatusOK, conf.GlobalConf.Clusters)
}
