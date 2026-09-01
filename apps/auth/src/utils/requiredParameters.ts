import type { LocationQuery } from "vue-router";

const requiredParameters = [
  "client_id",
  "code_challenge",
  "response_type",
  "redirect_uri",
  "scope",
];

export const hasNullParameter = (query: LocationQuery) => {
  let value;
  for (const key of requiredParameters) {
    value = query[key];
    if (!value || value.length === 0) {
      return key;
    }
  }

  return "";
};
