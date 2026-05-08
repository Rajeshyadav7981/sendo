import { http, HttpResponse } from 'msw';

const apiPathPatterns = [
  '*/api/*',
  '*/onboarding/*',
  '*/vehicle/*',
  '*/trip/*',
  '*/attendance/*',
  '*/advance/*',
  '*/payment/*',
  '*/customer/*',
  '*/home/*',
  '*/send-otp/*',
  '*/driver/*',
  '*/uploads/*',
  '*/billing/*',
  '*/employee/*',
  '*/tracker/*',
  '*/expense/*',
  '*/expenses/*',
  '*/notification/*',
  '*/vendor/*',
];

export const handlers = apiPathPatterns.flatMap((pattern) => [
  http.get(pattern, () => HttpResponse.json([])),
  http.post(pattern, () => HttpResponse.json({})),
  http.put(pattern, () => HttpResponse.json({})),
  http.patch(pattern, () => HttpResponse.json({})),
  http.delete(pattern, () => HttpResponse.json({})),
]);
