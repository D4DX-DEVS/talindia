/** Public URL of an R2 object (served by src/app/media/[...key]/route.ts). Safe for client and server. */
export function mediaUrl(key: string): string {
  return `/media/${key.split("/").map(encodeURIComponent).join("/")}`;
}
