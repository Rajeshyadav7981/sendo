/**
 * Result of a successful upload — what every caller gets back regardless of
 * whether the bytes landed on disk or in S3.
 *
 *   key           Storage-relative path. THIS is what gets stored in the DB.
 *                 e.g. "driverOnboardings/1747000000-abcd-photo.jpg"
 *   url           Resolved download URL (signed for private S3, plain for
 *                 local). Recompute via storage.getUrl(key) for fresh signed
 *                 URLs — don't persist this.
 *   fieldname     Original multipart field name (preserved for back-compat).
 *   originalName  Sanitised filename submitted by the client.
 *   storedName    Just the basename portion of `key`.
 *   relativePath  Alias of `key`; kept so existing call sites can read this
 *                 field without churn.
 *   path          Absolute disk path for the local driver, '' for S3.
 */
export interface UploadedFile {
  fieldname: string;
  originalName: string;
  storedName: string;
  key: string;
  relativePath: string;
  path: string;
  url: string;
  size: number;
  mimetype: string;
}

export interface UploadOptions {
  /** Logical bucket within storage — becomes a prefix on the key. */
  subdir: string;
  /** Override mimetype detection. */
  contentType?: string;
  /** Allow callers to pin a key (e.g. "users/123/avatar.jpg"). */
  keyHint?: string;
}
