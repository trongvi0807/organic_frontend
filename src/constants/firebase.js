// Public Firebase web credentials supplied for this application. No Admin SDK keys here.
export const firebaseDefaults = {
  apiKey: 'REMOVED_FIREBASE_API_KEY',
  authDomain: 'backend-organic.firebaseapp.com',
  projectId: 'backend-organic',
  storageBucket: 'backend-organic.firebasestorage.app',
  messagingSenderId: '100870302988',
  appId: '1:100870302988:web:b394eb465b403b7ffa6d29',
  measurementId: 'G-LK2FEW3YFV',
};
export const defaultVapidKey = 'BOBEc_gfBydu6Y_cGqlkGTLAD5sdgkKtaYziwwkIxtlczhv8rFZIKDx-_HqS_J2qJHVaGhBku65NJqPoav3aBno';
export function firebaseConfig(runtime = {}, env = {}) {
  return Object.fromEntries(Object.entries(firebaseDefaults).map(([key, fallback]) => {
    const name = `VITE_FIREBASE_${key.replace(/[A-Z]/g, (letter) => `_${letter}`).toUpperCase()}`;
    return [key, runtime[name] || env[name] || fallback];
  }));
}
