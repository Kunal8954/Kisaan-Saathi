"use client";

import { useI18n } from "@/lib/locale";

type PhotoUploadProps = {
  label: string;
  accept?: string;
};

export function PhotoUpload({
  label,
  accept = "image/jpeg,image/png",
}: PhotoUploadProps) {
  const { t } = useI18n();

  return (
    <div className="upload-box">
      <label htmlFor="evidence-file">{label}</label>
      <input id="evidence-file" type="file" accept={accept} disabled />
      <p>{t.common.notImplemented}</p>
    </div>
  );
}
