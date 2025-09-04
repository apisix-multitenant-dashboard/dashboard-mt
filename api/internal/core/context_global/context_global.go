package context_global

import (
	"context"
	"fmt"
)

var (
	ContextGlobal context.Context
)

func init() {
	defaultPrefix := "/apisix"
	ContextGlobal = context.WithValue(context.Background(), "etcdPrefix", defaultPrefix)
	fmt.Printf("ContextGlobal initialized with prefix %s\n", defaultPrefix)
}

func SetEtcdPrefix(prefix string) {
	ContextGlobal = context.WithValue(context.Background(), "etcdPrefix", prefix)

}
