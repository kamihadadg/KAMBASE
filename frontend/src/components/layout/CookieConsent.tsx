'use client';

import { useEffect, useState } from 'react';
import CookieConsent from 'react-cookie-consent';
import { useLanguageStore } from '@/store/language-store';

export default function CookieConsentBanner() {
  const { t } = useLanguageStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <CookieConsent
      location="bottom"
      buttonText={t('cookie.accept') || 'Accept Cookies'}
      declineButtonText={t('cookie.decline') || 'Decline'}
      cookieName="kambase-cookie-consent"
      style={{
        background: 'rgba(0, 0, 0, 0.9)',
        color: '#fff',
        fontSize: '14px',
        textAlign: 'center',
        padding: '20px',
        borderTop: '2px solid #3b82f6',
      }}
      buttonStyle={{
        background: '#3b82f6',
        color: 'white',
        fontSize: '14px',
        fontWeight: 'bold',
        border: 'none',
        borderRadius: '6px',
        padding: '10px 20px',
        margin: '0 10px',
        cursor: 'pointer',
        transition: 'background-color 0.3s',
      }}
      declineButtonStyle={{
        background: 'transparent',
        color: '#ccc',
        fontSize: '14px',
        border: '1px solid #ccc',
        borderRadius: '6px',
        padding: '10px 20px',
        margin: '0 10px',
        cursor: 'pointer',
        transition: 'all 0.3s',
      }}
      expires={365}
      onAccept={() => {
        console.log('Cookies accepted');
      }}
      onDecline={() => {
        console.log('Cookies declined');
        // Clear existing cookies if declined (except essential ones)
        const essentialCookies = ['kambase-cookie-consent']; // Keep the consent cookie itself
        document.cookie.split(";").forEach(function(c) {
          const cookieName = c.split("=")[0].trim();
          if (!essentialCookies.includes(cookieName)) {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
          }
        });

        // Clear localStorage as well
        if (typeof window !== 'undefined') {
          try {
            localStorage.clear();
          } catch (error) {
            console.warn('Failed to clear localStorage:', error);
          }
        }
      }}
      enableDeclineButton
      flipButtons
    >
      <div className="max-w-4xl mx-auto">
        <h3 className="font-semibold text-lg mb-2">
          🍪 {t('cookie.title') || 'Cookie Policy'}
        </h3>
        <p className="text-sm leading-relaxed">
          {t('cookie.message') || 'We use cookies to enhance your experience on our website. By continuing to use our site, you agree to our use of cookies.'}
        </p>
        <div className="mt-3 text-xs text-gray-300">
          <a href="/privacy" className="underline hover:text-white mr-4">
            {t('cookie.privacy') || 'Privacy Policy'}
          </a>
          <a href="/terms" className="underline hover:text-white">
            {t('cookie.terms') || 'Terms of Service'}
          </a>
        </div>
      </div>
    </CookieConsent>
  );
}
