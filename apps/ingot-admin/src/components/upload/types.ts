export interface UploadRequestParams {
  file: File;
  fileName: string;
}

export type UploadAPIFn = (params: UploadRequestParams) => Promise<any>;
