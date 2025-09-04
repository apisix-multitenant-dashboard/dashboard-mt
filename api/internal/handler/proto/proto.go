/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package proto

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"reflect"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/shiningrush/droplet"
	"github.com/shiningrush/droplet/data"
	"github.com/shiningrush/droplet/wrapper"
	wgin "github.com/shiningrush/droplet/wrapper/gin"

	"github.com/apisix/manager-api/internal/core/context_global"
	"github.com/apisix/manager-api/internal/core/entity"
	"github.com/apisix/manager-api/internal/core/store"
	"github.com/apisix/manager-api/internal/handler"
	"github.com/apisix/manager-api/internal/utils"
)

type Handler struct {
	routeStore        store.Interface
	serviceStore      store.Interface
	consumerStore     store.Interface
	pluginConfigStore store.Interface
	globalRuleStore   store.Interface
	protoStore        store.Interface
}

func NewHandler() (handler.RouteRegister, error) {
	return &Handler{
		routeStore:        store.GetStore(store.HubKeyRoute),
		serviceStore:      store.GetStore(store.HubKeyService),
		consumerStore:     store.GetStore(store.HubKeyConsumer),
		pluginConfigStore: store.GetStore(store.HubKeyPluginConfig),
		globalRuleStore:   store.GetStore(store.HubKeyGlobalRule),
		protoStore:        store.GetStore(store.HubKeyProto),
	}, nil
}

func (h *Handler) ApplyRoute(r *gin.Engine) {
	r.GET("/apisix/admin/proto/:id", wgin.Wraps(h.Get,
		wrapper.InputType(reflect.TypeOf(GetInput{}))))
	r.GET("/apisix/admin/proto", wgin.Wraps(h.List,
		wrapper.InputType(reflect.TypeOf(ListInput{}))))
	r.POST("/apisix/admin/proto", wgin.Wraps(h.Create,
		wrapper.InputType(reflect.TypeOf(entity.Proto{}))))
	r.PUT("/apisix/admin/proto", wgin.Wraps(h.Update,
		wrapper.InputType(reflect.TypeOf(UpdateInput{}))))
	r.PUT("/apisix/admin/proto/:id", wgin.Wraps(h.Update,
		wrapper.InputType(reflect.TypeOf(UpdateInput{}))))
	r.PATCH("/apisix/admin/proto/:id", wgin.Wraps(h.Patch,
		wrapper.InputType(reflect.TypeOf(PatchInput{}))))
	r.PATCH("/apisix/admin/proto/:id/*path", wgin.Wraps(h.Patch,
		wrapper.InputType(reflect.TypeOf(PatchInput{}))))
	r.DELETE("/apisix/admin/proto/:ids", wgin.Wraps(h.BatchDelete,
		wrapper.InputType(reflect.TypeOf(BatchDeleteInput{}))))
}

var plugins = []string{"grpc-transcode"}

type GetInput struct {
	ID string `auto_read:"id,path" validate:"required"`
}

func (h *Handler) Get(c droplet.Context) (interface{}, error) {
	input := c.Input().(*GetInput)
	protoStore, err := store.GetStoreFromContext(context_global.ContextGlobal, store.HubKeyProto)
	if err != nil {
		return nil, err
	}
	r, err := protoStore.Get(c.Context(), input.ID)
	if err != nil {
		return handler.SpecCodeResponse(err), err
	}

	return r, nil
}

type ListInput struct {
	Desc string `auto_read:"desc,query"`
	store.Pagination
}

func (h *Handler) List(c droplet.Context) (interface{}, error) {
	input := c.Input().(*ListInput)
	protoStore, err := store.GetStoreFromContext(context_global.ContextGlobal, store.HubKeyProto)
	if err != nil {
		return nil, err
	}
	ret, err := protoStore.List(c.Context(), store.ListInput{
		Predicate: func(obj interface{}) bool {
			if input.Desc != "" {
				return strings.Contains(obj.(*entity.Proto).Desc, input.Desc)
			}
			return true
		},
		PageSize:   input.PageSize,
		PageNumber: input.PageNumber,
	})
	if err != nil {
		return nil, err
	}

	return ret, nil
}

func (h *Handler) Create(c droplet.Context) (interface{}, error) {
	input := c.Input().(*entity.Proto)
	protoStore, err := store.GetStoreFromContext(context_global.ContextGlobal, store.HubKeyProto)
	if err != nil {
		return nil, err
	}
	// check proto id exist
	if input.ID != nil {
		protoID := utils.InterfaceToString(input.ID)
		ret, err := protoStore.Get(c.Context(), protoID)
		if err != nil && err != data.ErrNotFound {
			return handler.SpecCodeResponse(err), err
		}
		if ret != nil {
			return &data.SpecCodeResponse{StatusCode: http.StatusBadRequest}, errors.New("proto id exists")
		}
	}

	// create
	ret, err := protoStore.Create(c.Context(), input)
	if err != nil {
		return handler.SpecCodeResponse(err), err
	}

	return ret, nil
}

type UpdateInput struct {
	ID string `auto_read:"id,path"`
	entity.Proto
}

func (h *Handler) Update(c droplet.Context) (interface{}, error) {
	input := c.Input().(*UpdateInput)
	protoStore, err := store.GetStoreFromContext(context_global.ContextGlobal, store.HubKeyProto)
	if err != nil {
		return nil, err
	}
	// check if ID in body is equal ID in path
	if err := handler.IDCompare(input.ID, input.Proto.ID); err != nil {
		return &data.SpecCodeResponse{StatusCode: http.StatusBadRequest}, err
	}

	if input.ID != "" {
		input.Proto.ID = input.ID
	}

	res, err := protoStore.Update(c.Context(), &input.Proto, true)
	if err != nil {
		return handler.SpecCodeResponse(err), err
	}

	return res, nil
}

type PatchInput struct {
	ID      string `auto_read:"id,path"`
	SubPath string `auto_read:"path,path"`
	Body    []byte `auto_read:"@body"`
}

func (h *Handler) Patch(c droplet.Context) (interface{}, error) {
	input := c.Input().(*PatchInput)
	reqBody := input.Body
	id := input.ID
	subPath := input.SubPath
	protoStore, err := store.GetStoreFromContext(context_global.ContextGlobal, store.HubKeyProto)
	if err != nil {
		return nil, err
	}
	stored, err := protoStore.Get(c.Context(), id)
	if err != nil {
		return handler.SpecCodeResponse(err), err
	}

	res, err := utils.MergePatch(stored, subPath, reqBody)

	if err != nil {
		return handler.SpecCodeResponse(err), err
	}

	var proto entity.Proto
	if err := json.Unmarshal(res, &proto); err != nil {
		return handler.SpecCodeResponse(err), err
	}

	ret, err := protoStore.Update(c.Context(), &proto, false)
	if err != nil {
		return handler.SpecCodeResponse(err), err
	}

	return ret, nil
}

type BatchDeleteInput struct {
	IDs string `auto_read:"ids,path"`
}

func (h *Handler) BatchDelete(c droplet.Context) (interface{}, error) {
	input := c.Input().(*BatchDeleteInput)
	routeStore, err := store.GetStoreFromContext(context_global.ContextGlobal, store.HubKeyRoute)
	if err != nil {
		return nil, err
	}

	serviceStore, err := store.GetStoreFromContext(context_global.ContextGlobal, store.HubKeyService)
	if err != nil {
		return nil, err
	}
	consumerStore, err := store.GetStoreFromContext(context_global.ContextGlobal, store.HubKeyConsumer)
	if err != nil {
		return nil, err
	}

	pluginConfigStore, err := store.GetStoreFromContext(context_global.ContextGlobal, store.HubKeyPluginConfig)
	if err != nil {
		return nil, err
	}
	globalRuleStore, err := store.GetStoreFromContext(context_global.ContextGlobal, store.HubKeyGlobalRule)
	if err != nil {
		return nil, err
	}
	protoStore, err := store.GetStoreFromContext(context_global.ContextGlobal, store.HubKeyProto)
	if err != nil {
		return nil, err
	}
	ids := strings.Split(input.IDs, ",")
	checklist := []store.Interface{routeStore, consumerStore, serviceStore, pluginConfigStore, globalRuleStore}

	for _, id := range ids {
		for _, store := range checklist {
			if err := h.checkProtoUsed(c.Context(), store, id); err != nil {
				return handler.SpecCodeResponse(err), err
			}
		}
	}

	if err := protoStore.BatchDelete(c.Context(), ids); err != nil {
		return handler.SpecCodeResponse(err), err
	}

	return nil, nil
}

func (h *Handler) checkProtoUsed(ctx context.Context, storeInterface store.Interface, key string) error {
	ret, err := storeInterface.List(ctx, store.ListInput{
		Predicate: func(obj interface{}) bool {
			record := obj.(entity.GetPlugins)
			for _, plugin := range plugins {
				if _, ok := record.GetPlugins()[plugin]; ok {
					configs := record.GetPlugins()[plugin].(map[string]interface{})
					protoId := utils.InterfaceToString(configs["proto_id"])
					if protoId == key {
						return true
					}
				}
			}
			return false
		},
		Format: func(obj interface{}) interface{} {
			return obj.(entity.GetPlugins)
		},
		PageSize:   0,
		PageNumber: 0,
	})
	if err != nil {
		return err
	}
	if ret.TotalSize > 0 {
		return fmt.Errorf("proto used check invalid: %s: %s is using this proto", storeInterface.Type(), ret.Rows[0].(entity.GetBaseInfo).GetBaseInfo().ID)
	}
	return nil

}
