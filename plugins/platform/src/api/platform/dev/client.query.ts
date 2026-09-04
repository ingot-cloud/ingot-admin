import { createPageQueryOptions, createResourceQueryKeys } from "@ingot/admin-core";
import type { OAuth2RegisteredClient } from "@/models";
import { ClientPageAPI } from "./client";

export const clientQueryKeys = createResourceQueryKeys("platform", "client");

export const ClientPageQueryOptions = createPageQueryOptions<
  OAuth2RegisteredClient,
  OAuth2RegisteredClient
>(clientQueryKeys, ClientPageAPI);
