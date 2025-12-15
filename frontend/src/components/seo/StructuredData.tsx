import Script from 'next/script';

interface StructuredDataProps {
  type?: 'website' | 'organization' | 'article';
  data?: any;
}

export default function StructuredData({ type = 'website', data }: StructuredDataProps) {
  const getStructuredData = () => {
    const baseData = {
      '@context': 'https://schema.org',
      '@type': type === 'website' ? 'WebSite' : type === 'organization' ? 'Organization' : 'Article',
      name: 'KAMEXCHANGE',
      url: 'https://kambase.ir',
      description: 'پلتفرم معاملاتی پیشرفته ارزهای دیجیتال با ابزارهای حرفه‌ای',
      inLanguage: 'fa-IR',
    };

    switch (type) {
      case 'organization':
        return {
          ...baseData,
          '@type': 'Organization',
          logo: 'https://kambase.ir/logo.png',
          sameAs: [
            'https://twitter.com/kambase',
            'https://linkedin.com/company/kambase',
            'https://instagram.com/kambase'
          ],
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+98-21-12345678',
            contactType: 'customer service',
            availableLanguage: ['Persian', 'English']
          },
          foundingDate: '2024',
          numberOfEmployees: '50-100',
        };

      case 'website':
        return {
          ...baseData,
          '@type': 'WebSite',
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: 'https://kambase.ir/search?q={search_term_string}'
            },
            'query-input': 'required name=search_term_string'
          },
          publisher: {
            '@type': 'Organization',
            name: 'KAMEXCHANGE',
            logo: {
              '@type': 'ImageObject',
              url: 'https://kambase.ir/logo.png'
            }
          }
        };

      default:
        return baseData;
    }
  };

  const structuredData = data || getStructuredData();

  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
  );
}
