// タイトルを単語に分け、同じ記事内の重複を除いて記事数を集計する。
const ignoredWords = new Set(['の', 'と', 'に', 'を', 'は', 'が', 'で', 'へ', 'も', 'から', 'まで', 'より', 'について', 'ため', 'こと', 'もの', 'する', 'できる', 'なる', 'です', 'ます', 'よう', 'みよう', '作っ', 'て', '確認', '確認用', '用', '記事', '編', '簡単', '基本', '方法', '入門', 'って', 'という', 'として', 'など', 'これ', 'それ', 'ここ', 'そこ'])
const normalize = (value: string) => value.normalize('NFKC').toLocaleLowerCase('ja')
const segmenter = typeof Intl.Segmenter === 'function'
  ? new Intl.Segmenter('ja', { granularity: 'word' })
  : null

export function articleTitleKeywords(title: string): string[] {
  if (!segmenter) return []
  return [...new Set([...segmenter.segment(normalize(title))]
    .filter(part => part.isWordLike)
    .map(part => part.segment)
    .filter(word => word.length >= 2 && /[\p{Script=Han}\p{Script=Katakana}A-Za-z]/u.test(word) && !ignoredWords.has(word)))]
}

export function collectArticleKeywords(articles: { title: string }[]) {
  const counts = new Map<string, number>()
  articles.forEach(article => articleTitleKeywords(article.title).forEach(word => {
    counts.set(word, (counts.get(word) ?? 0) + 1)
  }))
  return [...counts].filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ja'))
    .slice(0, 10).map(([word, count]) => ({ word, count }))
}
