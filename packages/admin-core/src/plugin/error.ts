export type InAdminPluginErrorCode =
  | "DUPLICATE_PLUGIN_ID"
  | "UNSUPPORTED_API_VERSION"
  | "MISSING_PLUGIN_DEPENDENCY"
  | "CYCLIC_PLUGIN_DEPENDENCY"
  | "DUPLICATE_PAGE_KEY"
  | "DUPLICATE_COMPONENT_NAME"
  | "DUPLICATE_DIRECTIVE_NAME"
  | "DUPLICATE_ROUTE_NAME"
  | "INVALID_COMPONENT_NAME"
  | "INVALID_DIRECTIVE_MODULE";

export class InAdminPluginError extends Error {
  public readonly code: InAdminPluginErrorCode;
  public readonly pluginIds: string[];
  public readonly resource?: string;
  public readonly cause?: unknown;

  public constructor(
    code: InAdminPluginErrorCode,
    message: string,
    options: {
      pluginIds: string[];
      resource?: string;
      cause?: unknown;
    },
  ) {
    super(message);
    this.name = "InAdminPluginError";
    this.code = code;
    this.pluginIds = options.pluginIds;
    this.resource = options.resource;
    this.cause = options.cause;
  }
}
