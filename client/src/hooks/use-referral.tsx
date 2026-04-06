import { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * Hook to handle promoter referral tracking.
 * Checks for ?ref=CODE in the URL and stores it in localStorage with a 30-day expiration.
 */
export function useReferral() {
  const [location] = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const refCode = searchParams.get('ref');

    if (refCode) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);

      const referralData = {
        code: refCode,
        expiresAt: expirationDate.getTime(),
      };

      localStorage.setItem('promoter_referral', JSON.stringify(referralData));
      console.log(`[Referral] Stored referral code: ${refCode}, expires: ${expirationDate.toISOString()}`);
    }
  }, [location]);

  /**
   * Retrieves the current stored referral code if it hasn't expired.
   */
  const getReferralCode = (): string | null => {
    const stored = localStorage.getItem('promoter_referral');
    if (!stored) return null;

    try {
      const data = JSON.parse(stored);
      if (data.expiresAt > Date.now()) {
        return data.code;
      } else {
        // Clean up expired referral
        localStorage.removeItem('promoter_referral');
        return null;
      }
    } catch (e) {
      console.error('[Referral] Error parsing stored referral data:', e);
      return null;
    }
  };

  return { getReferralCode };
}
