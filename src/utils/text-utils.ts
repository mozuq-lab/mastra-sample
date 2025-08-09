export function chunkText(
  text: string,
  chunkSize = 200,
  overlap = 50
): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + chunkSize, text.length);
    chunks.push(text.slice(i, end));
    i += chunkSize - overlap; // overlapを考慮して次の開始位置を調整
    if (i + chunkSize >= text.length && i < text.length) {
      break; // 最後のチャンクがテキストの終わりに達したら終了
    }
  }
  return chunks;
}
