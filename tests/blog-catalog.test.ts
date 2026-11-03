import { BLOG_ARTICLES, getArticle } from '@/lib/blog-catalog';

describe('blog catalog integrity', () => {
  it('has articles with unique slugs', () => {
    expect(BLOG_ARTICLES.length).toBeGreaterThan(0);
    const slugs = BLOG_ARTICLES.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('every article has title, summary, date and a non-empty body', () => {
    for (const a of BLOG_ARTICLES) {
      expect(a.title.trim().length).toBeGreaterThan(0);
      expect(a.summary.trim().length).toBeGreaterThan(0);
      expect(a.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(a.body.length).toBeGreaterThan(0);
      for (const b of a.body) {
        expect(['h2', 'p']).toContain(b.kind);
        expect(b.text.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('slugs are URL-safe', () => {
    for (const a of BLOG_ARTICLES) {
      expect(a.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('makes no performance claims (no guarantees, client names, rankings)', () => {
    const banned = [/guarantee[ds]?\b/i, /#\s?1\b/, /best in (the )?(world|market|industry)/i, /\d+\s*(clients|customers served|projects delivered)/i];
    for (const a of BLOG_ARTICLES) {
      const all = [a.title, a.summary, ...a.body.map((b) => b.text)].join(' ');
      for (const re of banned) expect(all).not.toMatch(re);
    }
  });

  it('getArticle returns the article or undefined', () => {
    const first = BLOG_ARTICLES[0];
    expect(getArticle(first.slug)?.title).toBe(first.title);
    expect(getArticle('no-such-article')).toBeUndefined();
  });
});
