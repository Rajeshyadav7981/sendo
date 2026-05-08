import { useState } from 'react';
import { Button, Image, Upload, message } from 'antd';
import { LoadingOutlined, PaperClipOutlined, UploadOutlined } from '@ant-design/icons';
import type { RcFile, UploadFile } from 'antd/es/upload/interface';
import { resolveUrl, uploadFile } from '@shared/api/upload';

export interface FileUploadFieldProps {
  value?: string | null;
  onChange?: (key: string | null) => void;
  subdir?: string;
  accept?: string;
  asImage?: boolean;
  label?: string;
  disabled?: boolean;
}

/** See sendo-ui-vite version for full docs — same component, same contract. */
export function FileUploadField({
  value,
  onChange,
  subdir = 'supervisor',
  accept,
  asImage,
  label,
  disabled,
}: FileUploadFieldProps): JSX.Element {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const treatAsImage =
    asImage ?? (accept ? /image\//.test(accept) : /\.(png|jpe?g|gif|webp|svg)$/i.test(value ?? ''));

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
    return false;
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
