const API_BASE = "/__dev-portal/api";

export interface PortalCapabilities {
  mode: "local" | "static";
  canWrite: boolean;
  configVersion: number;
  sessionToken?: string;
}

export interface CatalogItem {
  packageName: string;
  directory: string;
  id: string;
  label: string;
  exportName: string;
  canonicalPrefix?: string;
  available: boolean;
  reason: string;
  source: string;
}

export interface PreviewFile {
  path: string;
  kind: "text" | "binary";
  content?: string;
  bytes: number;
}

export interface ScaffoldPreview {
  kind: string;
  targetDir: string;
  packageName: string;
  fingerprint: string;
  files: PreviewFile[];
  diagnostics: Array<{ level: string; message: string; field?: string }>;
  nextSteps: Array<{ title: string; command?: string; code?: string; language?: string }>;
}

export interface EnvFieldSchema {
  key: string;
  group: string;
  label: string;
  control: string;
  required?: boolean;
  options?: string[];
  hint?: string;
  docs?: string;
  consumed?: boolean;
  output?: string;
}

export interface PublicSchema {
  version: number;
  envFields: EnvFieldSchema[];
  tokenNames: string[];
  headerUtilities: string[];
  headerUserMenu: string[];
  themeParts: string[];
  officialPlugins?: Array<{ packageName: string; exportName: string; label?: string }>;
  defaults: {
    app: Record<string, unknown>;
    plugin: Record<string, unknown>;
    theme: Record<string, unknown>;
  };
}

export class PortalApiError extends Error {
  code?: string;
  fields?: Record<string, string>;
  status: number;

  constructor(message: string, options: { code?: string; fields?: Record<string, string>; status: number }) {
    super(message);
    this.name = "PortalApiError";
    this.code = options.code;
    this.fields = options.fields;
    this.status = options.status;
  }
}

const isLocalRuntime = () => import.meta.env.DEV;

let sessionToken = "";

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (init?.body) {
    headers.set("Content-Type", "application/json");
  }
  if (sessionToken && init?.method && init.method !== "GET") {
    headers.set("X-Ingot-Scaffold-Token", sessionToken);
  }
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const payload = (await response.json()) as {
    ok: boolean;
    data?: T;
    error?: { code: string; message: string; fields?: Record<string, string> };
  };
  if (!payload.ok) {
    throw new PortalApiError(payload.error?.message ?? "请求失败", {
      code: payload.error?.code,
      fields: payload.error?.fields,
      status: response.status,
    });
  }
  return payload.data as T;
};

export const detectCapabilities = async (): Promise<PortalCapabilities> => {
  if (!isLocalRuntime()) {
    return { mode: "static", canWrite: false, configVersion: 1 };
  }
  const data = await request<PortalCapabilities>("/capabilities");
  sessionToken = data.sessionToken ?? "";
  return data;
};

export const fetchSchema = async (): Promise<PublicSchema | null> => {
  if (isLocalRuntime()) {
    return request<PublicSchema>("/schema");
  }
  const response = await fetch(`${import.meta.env.BASE_URL}scaffold-schema.json`.replace(/\/{2,}/g, "/"));
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as PublicSchema;
};

export const fetchCatalog = () =>
  request<{ plugins: CatalogItem[]; themes: CatalogItem[] }>("/catalog");

export const previewScaffold = (body: unknown) =>
  request<ScaffoldPreview>("/preview", { method: "POST", body: JSON.stringify(body) });

export const createScaffold = (requestBody: unknown, fingerprint: string) =>
  request<{
    kind: string;
    targetDir: string;
    packageName: string;
    files: string[];
    nextSteps: ScaffoldPreview["nextSteps"];
  }>("/create", {
    method: "POST",
    body: JSON.stringify({ request: requestBody, fingerprint }),
  });
