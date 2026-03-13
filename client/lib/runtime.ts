const DEFAULT_BACKEND_URL = 'http://localhost:4100';
const DEFAULT_FRONTEND_ORIGIN = 'http://localhost:3000';

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? DEFAULT_BACKEND_URL;

export function getFrontendOrigin() {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return process.env.NEXT_PUBLIC_FRONTEND_ORIGIN ?? DEFAULT_FRONTEND_ORIGIN;
}

export function getOverlayUrls(origin = getFrontendOrigin()) {
  return {
    overlay: `${origin}/overlay`,
    superchat: `${origin}/superchat`,
    members: `${origin}/members`,
  };
}
