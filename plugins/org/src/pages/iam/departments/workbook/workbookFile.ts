import type { MemberWorkbookFile } from "@ingot/admin-common";

export const WORKBOOK_ACCEPT = ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
export const WORKBOOK_EXTENSION = ".xlsx";

export function isWorkbookFile(file: File): boolean {
  return file.name.toLowerCase().endsWith(WORKBOOK_EXTENSION);
}

export function downloadWorkbookFile(file: MemberWorkbookFile): void {
  const binary = atob(file.contentBase64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  const url = URL.createObjectURL(new Blob([bytes], { type: file.contentType }));
  const link = document.createElement("a");
  link.href = url;
  link.download = file.filename;
  link.click();
  URL.revokeObjectURL(url);
}
