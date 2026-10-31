import type { Metadata } from "next";

import { StressMap } from "@/components/StressMap";

export const metadata: Metadata = {
  title: "सैटेलाइट तनाव नक्शा",
};

export default function MapPage() {
  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">तनाव मॉनिटर</p>
        <h1>खेत का सैटेलाइट तनाव नक्शा</h1>
        <p>
          NDVI anomaly, NDMI, भूमि तापमान और मिट्टी नमी के आधार पर फसल तनाव देखें।
        </p>
      </header>

      <section className="panel">
        <StressMap />
        <dl className="metrics">
          <div>
            <dt>NDVI anomaly</dt>
            <dd>—</dd>
          </div>
          <div>
            <dt>NDMI</dt>
            <dd>—</dd>
          </div>
          <div>
            <dt>भूमि तापमान</dt>
            <dd>—</dd>
          </div>
          <div>
            <dt>मिट्टी नमी</dt>
            <dd>—</dd>
          </div>
        </dl>
      </section>
    </>
  );
}
