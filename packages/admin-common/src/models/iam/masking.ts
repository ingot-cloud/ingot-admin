import { MaskKind } from "./constants";
import type { MaskSpec } from "./types";

export const IAM_MASK_MAX_POSITION = 256;
const MASKED_PLACEHOLDER = "***";
const MASK_CHAR = "*";
const PHONE_PREFIX = 3;
const PHONE_SUFFIX = 4;

export const IAM_MASK_OPTIONS = [
  { value: MaskKind.ALL, label: "全部遮盖", sample: "张小明" },
  { value: MaskKind.PHONE, label: "手机号：保留前 3 后 4 位", sample: "13812345678" },
  { value: MaskKind.EMAIL, label: "邮箱：保留首字符和域名", sample: "alice@example.com" },
  { value: MaskKind.KEEP_EDGES, label: "自定义：保留前后字符", sample: "abcdef" },
  { value: MaskKind.RANGE, label: "自定义：遮盖指定位置", sample: "abcdef" },
];

export const defaultIamMask = (kind: MaskKind): MaskSpec =>
  kind === MaskKind.KEEP_EDGES
    ? { kind, prefix: 1, suffix: 1 }
    : kind === MaskKind.RANGE
      ? { kind, start: 1, end: 3 }
      : { kind };

const validPosition = (value?: number): boolean =>
  Number.isInteger(value) && value !== undefined && value >= 0 && value <= IAM_MASK_MAX_POSITION;

/** 与后端 MaskSpec 的参数契约一致，供配置确认和预览共用。 */
export const isValidIamMask = (mask: MaskSpec): boolean => {
  if (mask.kind === MaskKind.KEEP_EDGES)
    return (
      validPosition(mask.prefix) &&
      validPosition(mask.suffix) &&
      mask.start === undefined &&
      mask.end === undefined
    );
  if (mask.kind === MaskKind.RANGE)
    return (
      validPosition(mask.start) &&
      validPosition(mask.end) &&
      (mask.end ?? 0) > (mask.start ?? 0) &&
      mask.prefix === undefined &&
      mask.suffix === undefined
    );
  return (
    IAM_MASK_OPTIONS.some((option) => option.value === mask.kind) &&
    mask.prefix === undefined &&
    mask.suffix === undefined &&
    mask.start === undefined &&
    mask.end === undefined
  );
};

export const iamMaskLabel = (mask?: MaskSpec): string => {
  if (mask?.kind === MaskKind.KEEP_EDGES)
    return `保留前 ${mask.prefix ?? 0}、后 ${mask.suffix ?? 0} 个字符`;
  if (mask?.kind === MaskKind.RANGE)
    return `遮盖第 ${(mask.start ?? 0) + 1}～${mask.end ?? 0} 个字符`;
  return (
    IAM_MASK_OPTIONS.find((option) => option.value === (mask?.kind ?? MaskKind.ALL))?.label ??
    "全部遮盖"
  );
};

// Java Character.isWhitespace / isISOControl；NBSP 等不属于 Java 空白字符。
const invalidEmailCharacter = (character: string): boolean => {
  const code = character.codePointAt(0) ?? 0;
  return (
    code <= 0x20 ||
    (code >= 0x7f && code <= 0x9f) ||
    code === 0x1680 ||
    (code >= 0x2000 && code <= 0x200a && code !== 0x2007) ||
    code === 0x2028 ||
    code === 0x2029 ||
    code === 0x205f ||
    code === 0x3000
  );
};

/** 配置示例预览，与 DefaultMaskStrategy 按 Unicode code point 的语义一致。 */
export const previewIamMask = (value: string, mask: MaskSpec): string => {
  if (!isValidIamMask(mask)) return MASKED_PLACEHOLDER;
  const characters = Array.from(value);
  if (mask.kind === MaskKind.ALL) return MASKED_PLACEHOLDER;
  if (mask.kind === MaskKind.EMAIL) {
    const index = characters.indexOf("@");
    if (
      characters.some(invalidEmailCharacter) ||
      index <= 0 ||
      index === characters.length - 1 ||
      index !== characters.lastIndexOf("@")
    )
      return MASKED_PLACEHOLDER;
    return (index > 1 ? characters[0] : "") + MASKED_PLACEHOLDER + characters.slice(index).join("");
  }
  if (mask.kind === MaskKind.RANGE) {
    const start = mask.start ?? 0;
    if (start >= characters.length) return MASKED_PLACEHOLDER;
    const end = Math.min(characters.length, mask.end ?? 0);
    return (
      characters.slice(0, start).join("") +
      MASK_CHAR.repeat(end - start) +
      characters.slice(end).join("")
    );
  }
  if (mask.kind === MaskKind.PHONE && !characters.every((character) => /^\p{Nd}$/u.test(character)))
    return MASKED_PLACEHOLDER;
  const prefix = mask.kind === MaskKind.PHONE ? PHONE_PREFIX : (mask.prefix ?? 0);
  const suffix = mask.kind === MaskKind.PHONE ? PHONE_SUFFIX : (mask.suffix ?? 0);
  if (characters.length <= prefix + suffix) return MASKED_PLACEHOLDER;
  return (
    characters.slice(0, prefix).join("") +
    MASK_CHAR.repeat(characters.length - prefix - suffix) +
    characters.slice(characters.length - suffix).join("")
  );
};
