import Link from 'next/link';
/** Only fixed store paths and generated product slugs become links. External/unknown paths stay text. */
export default function SupportMessage({ text }: { text: string }) {
  return text.split(/(\/(?:product\/[a-zA-Z0-9-]+|user\/orders|contact|search)\b)/g).map((part, i) =>
    /^\/(?:product\/[a-zA-Z0-9-]+|user\/orders|contact|search)$/.test(part)
      ? <Link key={i} href={part} className="underline underline-offset-2 break-words">{part}</Link>
      : part
  );
}
