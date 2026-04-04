/**
 * Monotonic revision for SEO-related public JSON. Bumped when admin mutates
 * catalog or marketing content so clients/CDNs can revalidate or purge.
 */
let revision = Date.now();

export function bumpSeoRevision() {
  revision = Date.now();
}

export function getSeoRevision() {
  return revision;
}

/** Public package/adventure detail responses carry SEO fields — avoid stale caches. */
export function setPublicDetailSeoHeaders(res) {
  res.set('Cache-Control', 'private, max-age=0, must-revalidate');
  res.set('X-SEO-Revision', String(revision));
}
