export function applyBaseUrl(baseUrl: string | null | undefined, url: string) {
  if (!baseUrl) {
    return url;
  }
  // if url starts with a protocol, return url
  if (url.startsWith('http')) {
    return url;
  }
  // if base url ends in /, and url starts with /, remove the / from the base url
  if (baseUrl.endsWith('/') && url.startsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }
  // if base url does not end in /, and url does not start with /, add a / to the base url
  if (!baseUrl.endsWith('/') && !url.startsWith('/')) {
    baseUrl = baseUrl + '/';
  }
  return baseUrl + url;
}
