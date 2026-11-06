import { request } from "@/net";

const IAM_UPLOAD = "/api/iam/v1/assets/uploads";
const MEMBER_UPLOAD = "/api/member/v1/assets/uploads";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const BUSINESS_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";

export const ImagePurpose = {
  PLATFORM_MEMBER_CREATE: "platform-member-avatar-create",
  PLATFORM_MEMBER_UPDATE: "platform-member-avatar-update",
  TENANT_MEMBER_CREATE: "tenant-member-avatar-create",
  TENANT_MEMBER_REJOIN: "tenant-member-avatar-rejoin",
  TENANT_MEMBER_UPDATE: "tenant-member-avatar-update",
  PLATFORM_TENANT_CREATE: "platform-tenant-logo-create",
  PLATFORM_TENANT_UPDATE: "platform-tenant-logo-update",
  TENANT_SETTINGS_UPDATE: "tenant-logo-update",
  APPLICATION_CREATE: "application-icon-create",
  APPLICATION_UPDATE: "application-icon-update",
  APP_USER_CREATE: "app-user-avatar-create",
  APP_USER_UPDATE: "app-user-avatar-update",
} as const;

type ImagePurposeCode = (typeof ImagePurpose)[keyof typeof ImagePurpose];
type ImageField = "avatar" | "icon";

const isLocalImage = (value: unknown): value is string =>
  typeof value === "string" && value.startsWith("data:");

export function localImagePreview(file: File): Promise<string> {
  if (!file.size || file.size > MAX_IMAGE_BYTES || !BUSINESS_IMAGE_ACCEPT.split(",").includes(file.type)) {
    return Promise.reject(new Error("请选择 5 MiB 以内的 JPEG、PNG 或 WebP 图片"));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("暂时无法读取图片"));
    };
    reader.onerror = () => reject(new Error("暂时无法读取图片"));
    reader.readAsDataURL(file);
  });
}

export function withoutLocalImage<T extends object>(input: T, field: ImageField): T {
  return isLocalImage(Reflect.get(input, field)) ? { ...input, [field]: undefined } : input;
}

export async function stageImageField<T extends object>(
  input: T,
  field: ImageField,
  purpose: ImagePurposeCode,
  targetId?: string,
): Promise<T> {
  const source: unknown = Reflect.get(input, field);
  if (!isLocalImage(source)) return input;
  const header = /^data:(image\/(?:jpeg|png|webp));base64,/.exec(source);
  if (!header) throw new Error("图片预览格式无效");
  const bytes = Uint8Array.from(atob(source.slice(header[0].length)), (character) =>
    character.charCodeAt(0),
  );
  const image = new Blob([bytes], { type: header[1] });
  const form = new FormData();
  form.append("purpose", purpose);
  form.append("file", image, "image");
  if (targetId) form.append("targetId", targetId);
  const endpoint = purpose === ImagePurpose.APP_USER_CREATE || purpose === ImagePurpose.APP_USER_UPDATE
    ? MEMBER_UPLOAD : IAM_UPLOAD;
  const { data } = await request.post<{ uploadId: string }>(endpoint, form);
  return { ...input, [field]: undefined, [field === "icon" ? "iconUploadId" : "avatarUploadId"]: data.uploadId };
}
