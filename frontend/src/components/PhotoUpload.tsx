"use client";

type PhotoUploadProps = {
  label: string;
  accept?: string;
};

export function PhotoUpload({
  label,
  accept = "image/jpeg,image/png",
}: PhotoUploadProps) {
  return (
    <div className="upload-box">
      <label htmlFor="evidence-file">{label}</label>
      <input id="evidence-file" type="file" accept={accept} disabled />
      <p>Upload and analysis are not implemented yet.</p>
    </div>
  );
}
