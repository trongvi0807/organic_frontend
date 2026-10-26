import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {firebaseConfig,firebaseConfigured} from './firebase';
it('has no checked-in Google API key and requires explicit deployment/local configuration',()=>{
  const googleKeyPattern=new RegExp('AI'+'za[0-9A-Za-z_-]{35}');
  for(const path of ['./firebase.js','../../.env.example']) expect(readFileSync(new URL(path,import.meta.url),'utf8')).not.toMatch(googleKeyPattern);
  expect(firebaseConfig().apiKey).toBe('');expect(firebaseConfigured(firebaseConfig())).toBe(false);
});
it('uses runtime/build config equally for the page and worker without a hardcoded key fallback',()=>{
  expect(firebaseConfig({VITE_FIREBASE_API_KEY:'runtime-example'},{VITE_FIREBASE_API_KEY:'build-example'}).apiKey).toBe('runtime-example');
  expect(firebaseConfigured(firebaseConfig({VITE_FIREBASE_API_KEY:'runtime-example'}))).toBe(true);
});
