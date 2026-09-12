export enum StatusCode {
  Unknown = "-1",
  OK = "S0200",

  UNAUTHORIZED = "S0401",
  FORBIDDEN = "S0403",
  TokenInvalid = "invalid_token",
  TokenSignBack = "user_sign_out",

  ILLEGAL_OPERATION = "S0002",
  DataScopeForbidden = "ds_forbidden",
  AuthorizationSnapshotUnavailable = "AuthorizationSnapshot.Unavailable",
}
