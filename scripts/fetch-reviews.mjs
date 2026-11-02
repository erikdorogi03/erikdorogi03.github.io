// Letölti a Google-értékeléseket (Places API) és elmenti a reviews.json-ba.
// A GitHub Actions naponta futtatja, a kulcsot GitHub titokként (secret) kapja.
import { writeFile } from 'node:fs/promises';

const key = process.env.GOOGLE_PLACES_KEY;
const placeId = process.env.GOOGLE_PLACE_ID;
if (!key || !placeId) {
  console.log('Nincs beállítva GOOGLE_PLACES_KEY vagy GOOGLE_PLACE_ID, a frissítés kimarad.');
  process.exit(0);
}

const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}?languageCode=hu`, {
  headers: {
    'X-Goog-Api-Key': key,
    'X-Goog-FieldMask': 'rating,userRatingCount,googleMapsUri,reviews'
  }
});
if (!res.ok) {
  console.error('A Google hibát adott vissza:', res.status, await res.text());
  process.exit(1);
}
const p = await res.json();
const out = {
  rating: p.rating ?? null,
  count: p.userRatingCount ?? 0,
  url: p.googleMapsUri ?? null,
  reviews: (p.reviews || []).map(v => ({
    author: v.authorAttribution?.displayName || 'Google-felhasználó',
    rating: v.rating,
    text: (v.originalText?.text || v.text?.text || '').trim(),
    time: v.relativePublishTimeDescription || '',
    published: v.publishTime || null
  }))
};
await writeFile('reviews.json', JSON.stringify(out, null, 2) + '\n');
console.log(`reviews.json frissítve: ${out.reviews.length} értékelés, átlag ${out.rating}`);
