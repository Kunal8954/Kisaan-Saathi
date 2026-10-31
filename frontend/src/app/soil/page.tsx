import type { Metadata } from "next";

import { PhotoUpload } from "@/components/PhotoUpload";

export const metadata: Metadata = {
  title: "मिट्टी विश्लेषण",
};

export default function SoilPage() {
  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">मिट्टी विश्लेषक</p>
        <h1>मिट्टी परीक्षण रिपोर्ट अपलोड करें</h1>
        <p>PDF या फोटो से खनिज मान निकालकर सुझाव तैयार किए जाएँगे।</p>
      </header>

      <section className="panel">
        <PhotoUpload
          label="मिट्टी परीक्षण रिपोर्ट चुनें"
          accept="application/pdf,image/jpeg,image/png"
        />
        <p className="muted">
          रिपोर्ट पढ़ने और खनिज सिफारिशों का कार्यान्वयन अभी बाकी है।
        </p>
      </section>
    </>
  );
}
