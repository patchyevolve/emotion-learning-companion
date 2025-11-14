// Utility functions

/**
 * Maps emotion string to color hex code
 */
export function mapEmotionToColor(emotion) {
  if (!emotion) return '#9ca3af';
  const m = emotion.toLowerCase();
  if (m.includes('happy')) return '#10b981';
  if (m.includes('neutral')) return '#6b7280';
  if (m.includes('surprised')) return '#0ea5e9';
  if (m.includes('sad')) return '#f97316';
  if (m.includes('angry')) return '#ef4444';
  if (m.includes('disgust')) return '#a16207';
  if (m.includes('fear')) return '#7c3aed';
  return '#6b7280';
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a, b) {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-10);
}
