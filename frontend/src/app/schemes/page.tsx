import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "सरकारी योजनाएँ",
};

const schemes = ["PMFBY", "PM-KISAN", "Soil Health Card", "Kisan Credit Card"];

export default function SchemesPage() {
  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">योजना सलाहकार</p>
        <h1>सरकारी योजनाओं की जानकारी</h1>
        <p>
          पात्रता संकेत, जरूरी दस्तावेज और बीमा दावे के कदम प्रमाणित दस्तावेजों से
          लिए जाएँगे।
        </p>
      </header>

      <section className="panel">
        <label htmlFor="scheme-question">योजना के बारे में पूछें</label>
        <textarea
          id="scheme-question"
          rows={3}
          disabled
          placeholder="उदाहरण: PMFBY में दावा कैसे करें?"
        />
        <button className="button" type="button" disabled>
          जवाब खोजें
        </button>
        <ul className="chip-list">
          {schemes.map((scheme) => (
            <li className="chip" key={scheme}>
              {scheme}
            </li>
          ))}
        </ul>
        <p className="muted">RAG खोज और उत्तर निर्माण अभी बाकी है।</p>
      </section>
    </>
  );
}
