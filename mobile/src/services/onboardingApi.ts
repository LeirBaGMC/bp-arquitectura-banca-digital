import { requestApi } from './bankingApi';

export function createFaceVerificationSession(consent: boolean) {
  return requestApi<{ sessionId: string; expiresAt: string }>('/api/onboarding/face-verification/sessions', {
    method: 'POST',
    body: JSON.stringify({ consent }),
  });
}
