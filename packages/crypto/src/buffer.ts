/**
 * 将任意 Uint8Array 归一化为 ArrayBuffer 支持的视图。
 * WebCrypto 的 BufferSource 要求底层为 ArrayBuffer，而非 SharedArrayBuffer。
 */
export function toArrayBufferView(view: Uint8Array): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(view.byteLength);
  copy.set(view);
  return copy;
}
