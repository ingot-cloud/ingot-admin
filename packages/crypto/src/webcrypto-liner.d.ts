declare module "webcrypto-liner/build/index.es.js" {
  export class Crypto {
    readonly subtle: SubtleCrypto;
    getRandomValues<T extends ArrayBufferView>(array: T): T;
  }
  export const crypto: Crypto;
}
