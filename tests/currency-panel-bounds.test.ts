import fs from 'node:fs';
const source=fs.readFileSync('components/shared/header/global-selector.tsx','utf8');
it('mobile selector uses viewport margins and bounded scroll instead of clipping at footer anchor',()=>{expect(source).toContain('fixed left-4 right-4 top-20');expect(source).toContain('max-h-[calc(100dvh-6rem)] overflow-y-auto')});
it('desktop footer panel opens above lower-half anchors',()=>{expect(source).toContain('getBoundingClientRect().top>window.innerHeight/2');expect(source).toContain('sm:bottom-full')});
it('Escape closes the panel and listeners are cleaned up',()=>{expect(source).toContain("e.key==='Escape'");expect(source).toContain("removeEventListener('keydown',onKey)")});
