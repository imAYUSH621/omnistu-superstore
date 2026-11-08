import fs from 'fs';
import path from 'path';
const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8');
it('contact saves through the existing inbox, never the email API', () => {
 const s=read('app/(root)/contact/page.tsx');
 expect(s).toContain("fetch('/api/enquiries'");expect(s).not.toContain("fetch('/api/contact'");
 expect(s).toContain('No email was sent');expect(s).toContain("href='/user/enquiries'");
 expect(s).toContain('Guest enquiries');expect(s).toContain("name='website'");
 expect(s).not.toContain('Email us');expect(s).not.toContain('accepted by the email service');
});
it('handoff is explicit and never silently forwards chat', () => {
 const s=read('components/shared/ai-concierge.tsx');expect(s).toContain("href='/contact'");
 expect(s).toContain('No chat is forwarded automatically');expect(s).not.toContain("fetch('/api/enquiries'");
});
it('same admin and own-account lists cover support without claiming notification',()=>{
 expect(read('app/admin/enquiries/page.tsx')).toContain('Support and service enquiries');
 expect(read('app/user/enquiries/page.tsx')).toContain('Support and service enquiries');
});
