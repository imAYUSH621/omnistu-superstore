import Link from 'next/link';
const INTERNAL=/^\/(?:product\/[a-zA-Z0-9-]+|user\/(?:orders|enquiries)|contact|search|cart|shipping-address|payment-method|place-order|sign-in|sign-up|forgot-password)$/;
/** Only complete allowlisted store paths become links. External URLs and
 * unknown paths (including queries/fragments/extra suffixes) remain text. */
export default function SupportMessage({text}:{text:string}){
 return text.split(/(https?:\/\/[^\s<>"()[\]{}]+|\/[^\s<>"()[\]{}、，,]+)/g).map((part,i)=>{
  const path=part.replace(/[.,;!?:।。]+$/u,'');
  return INTERNAL.test(path)?<span key={i}><Link href={path} className='underline underline-offset-2 break-words'>{path}</Link>{part.slice(path.length)}</span>:part;
 });
}
