import{readFileSync}from'fs';
it('translated long words wrap inside footer column rather than widening body',()=>{const s=readFileSync('components/footer.tsx','utf8');expect(s).toContain('[&>div]:min-w-0 [overflow-wrap:anywhere]');expect(s).not.toContain('overflow-x-hidden')});
