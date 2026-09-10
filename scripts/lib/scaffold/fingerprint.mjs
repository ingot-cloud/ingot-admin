import { createHash } from "node:crypto";

const sortValue = (value) => {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  if (value && typeof value === "object") {
    const result = {};
    for (const key of Object.keys(value).sort()) {
      result[key] = sortValue(value[key]);
    }
    return result;
  }
  return value;
};

export const canonicalJson = (value) => JSON.stringify(sortValue(value));

export const fingerprintOf = ({ request, files, catalogMeta }) => {
  const hash = createHash("sha256");
  hash.update(canonicalJson(request));
  hash.update("\n");
  hash.update(canonicalJson(catalogMeta ?? {}));
  hash.update("\n");
  const sorted = [...files].sort((left, right) => left.path.localeCompare(right.path));
  for (const file of sorted) {
    hash.update(file.path);
    hash.update("\0");
    hash.update(file.kind);
    hash.update("\0");
    if (file.kind === "binary") {
      hash.update(file.buffer);
    } else {
      hash.update(file.content);
    }
    hash.update("\n");
  }
  return hash.digest("hex");
};
