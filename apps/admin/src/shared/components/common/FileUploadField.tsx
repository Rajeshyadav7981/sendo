import { useState } from 'react';
import { Button, Image, Upload, message } from 'antd';
import { LoadingOutlined, PaperClipOutlined, UploadOutlined } from '@ant-design/icons';
import type { RcFile, UploadFile } from 'antd/es/upload/interface';
import { resolveUrl, uploadFile } from '@shared/api/upload';

export interface FileUploadFieldProps {
  /** Storage key currently held by the form (undefined/null when empty). */
  value?: string | null;
  /** Called with the new key after a successful upload, or null on clear. */
  onChange?: (key: string | null) => void;
  /** Subdir/prefix on the backend (e.g. "driverOnboardings"). */
  subdir?: string;
  /** Restrict file types — passes through to <input accept="..."/>. */
  accept?: string;
  /** Treat the file as an image (renders thumbnail preview). Default: inferred from accept. */
  asImage?: boolean;
  /** Caption displayed above the picker. */
  label?: string;
  disabled?: boolean;
}

/**
 * Drop-in upload widget for forms. Stores only the storage `key` in form
 * state. On mount it resolves a fresh URL for preview; on change it uploads
 * the file and emits the new key.
 *
 *   <FileUploadField
 *     subdir="driverOnboardings"
 *     value={form.aadharFile}
 *     onChange={(k) => setForm({ ...form, aadharFile: k })}
 *     accept="image/*,application/pdf"
 *     label="Aadhar"
 *   />
 */
export function FileUploadField({
  value,
  onChange,
  subdir = 'misc',
  accept,
  asImage,
  label,
  disabled,
}: FileUploadFieldProps): JSX.Element {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const treatAsImage =
    asImage ?? (accept ? /image\//.test(accept) : /\.(png|jpe?g|gif|webp|svg)$/i.test(value ?? ''));

  // Lazy URL resolution — only when we actually want to render a preview.
  if (value && previewUrl === null) {
    void resolveUrl(value).then((u) => setPreviewUrl(u));
  }

  const beforeUpload = async (file: RcFile): Promise<boolean> => {
    setUploading(true);
    try {
      const result = await uploadFile(file, { subdir });
      onChange?.(result.key);
      const url = result.url || (await resolveUrl(result.key));
      setPreviewUrl(url);
    } catch (e) {
      message.error(`Upload failed: ${(e as Error).message}`);
    } finally {
      setUploading(false);
    }
    return false; // we handled the upload ourselves
  };

  const fileList: UploadFile[] = value
    ? [
        {
          uid: value,
          name: value.split('/').pop() ?? value,
          status: 'done',
          url: previewUrl ?? undefined,
        },
      ]
    : [];

  return (
    <div className="space-y-2">
      {label ? <div className="text-sm font-medium">{label}</div> : null}
      <Upload
        beforeUpload={beforeUpload}
        maxCount={1}
        accept={accept}
        disabled={disabled || uploading}
        fileList={fileList}
        onRemove={() => {
          onChange?.(null);
          setPreviewUrl(null);
          return true;
        }}
        listType={treatAsImage ? 'picture' : 'text'}
      >
        <Button
          icon={uploading ? <LoadingOutlined /> : value ? <PaperClipOutlined /> : <UploadOutlined />}
          disabled={disabled || uploading}
        >
          {uploading ? 'Uploading…' : value ? 'Replace' : 'Upload'}
        </Button>
      </Upload>
      {treatAsImage && previewUrl ? (
        <Image src={previewUrl} alt={label ?? 'preview'} height={80} />
      ) : null}
    </div>
  );
}
