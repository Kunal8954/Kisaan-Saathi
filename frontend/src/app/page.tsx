import Link from "next/link";

const features = [
  {
    title: "फसल योजना",
    description: "जलवायु, मौसम और मंडी भाव के आधार पर फसल चुनने में मदद।",
    href: "/chat",
  },
  {
    title: "फसल रोग जाँच",
    description: "फोटो से संभावित कारण और दो उपाय, स्रोतों के साथ।",
    href: "/diagnose",
  },
  {
    title: "मिट्टी विश्लेषण",
    description: "मिट्टी परीक्षण रिपोर्ट से खनिज सिफारिशें।",
    href: "/soil",
  },
  {
    title: "सैटेलाइट तनाव नक्शा",
    description: "खेत के लिए NDVI, NDMI, तापमान और नमी संकेत।",
    href: "/map",
  },
  {
    title: "सरकारी योजनाएँ",
    description: "PMFBY, PM-KISAN, KCC और अन्य योजनाओं की जानकारी।",
    href: "/schemes",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <p className="eyebrow">हिंदी-प्रथम खेती सलाहकार</p>
        <h1>बदलते मौसम में खेती के लिए भरोसेमंद साथी</h1>
        <p className="lede">
          आवाज़, टेक्स्ट, फोटो और रिपोर्ट से फसल, मिट्टी, सिंचाई और बीमा के
          सवालों के जवाब।
        </p>
        <div className="actions">
          <Link className="button" href="/chat">
            सलाह शुरू करें
          </Link>
          <Link className="button button-secondary" href="/diagnose">
            फसल की फोटो जाँचें
          </Link>
        </div>
      </section>

      <section aria-labelledby="features-heading">
        <h2 id="features-heading">सुविधाएँ</h2>
        <div className="feature-grid">
          {features.map((feature) => (
            <Link className="card" href={feature.href} key={feature.title}>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="notice">
        <h2>महत्वपूर्ण सूचना</h2>
        <p>
          यह ऐप शुरुआती सलाह देता है। रोग, दवा या बीमा दावे से पहले अपने स्थानीय
          कृषि विज्ञान केंद्र (KVK) से सलाह लें।
        </p>
      </section>
    </>
  );
}
