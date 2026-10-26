export function normalizeText(content: string): string {
  return content.replace(/\r\n?/g, "\n").split(/\n\s*\n/).map((paragraph) => paragraph.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n\n");
}

export function splitIntoChunks(content: string, size = 900, overlapWords = 25): string[] {
  const words = normalizeText(content).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const chunks: string[] = [];
  let current: string[] = [];
  for (const word of words) {
    const candidate = [...current, word].join(" ");
    if (current.length && candidate.length > size) {
      chunks.push(current.join(" "));
      current = current.slice(-overlapWords);
    }
    current.push(word);
  }
  if (current.length) chunks.push(current.join(" "));
  return chunks;
}
