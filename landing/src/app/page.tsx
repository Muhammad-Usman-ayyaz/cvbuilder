import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import HowItWorks from '@/components/HowItWorks';
import CtaBand from '@/components/CtaBand';
import Footer from '@/components/Footer';
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION } from '@/lib/site';

// No metadata export here — the root layout's metadata already covers the
// home page (title.default / description / OG / Twitter), and this page
// makes no data requests, so it's fully static: prerendered to HTML at
// build time with zero client-side data fetching.

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: SITE_NAME,
  url: SITE_URL,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: SITE_DESCRIPTION,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Header />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <CtaBand />
      </main>
      <Footer />
    </div>
  );
}
