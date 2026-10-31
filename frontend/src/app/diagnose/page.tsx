import type { Metadata } from "next";

import { PhotoUpload } from "@/components/PhotoUpload";

export const metadata: Metadata = {
  title: "फसल रोग जाँच",
};

export default function DiagnosePage() {
  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">रोग डॉक्टर</p>
        <h1>फसल की फोटो से जाँच</h1>
        <p>
          संभावित कारण, भरोसा स्कोर, दो उपाय (रासायनिक और जैविक) और स्थानीय KVK
          सलाह दिखाई जाएगी।
        </p>
      </header>

      <section className="panel">
        <PhotoUpload label="प्रभावित पत्ती या पौधे की फोटो चुनें" />
        <div className="notice">
          <h2>सुरक्षा नियम</h2>
          <p>
            उपाय केवल प्रमाणित कृषि दस्तावेजों से दिए जाएँगे। कोई भी दवा लगाने से
            पहले अपने KVK या कृषि विशेषज्ञ से सलाह लें।
          </p>
        </div>
      </section>
    </>
  );
}
