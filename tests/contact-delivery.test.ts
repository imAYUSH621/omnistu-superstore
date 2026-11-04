const send=jest.fn();const smtp=jest.fn();const resolve=jest.fn();
jest.mock('resend',()=>({Resend:jest.fn().mockImplementation(()=>({emails:{send}}))}));jest.mock('@/lib/mail/transport',()=>({resolveMailTransport:(...x:unknown[])=>resolve(...x)}));
import {POST} from '@/app/api/contact/route';
const req=()=>new Request('http://local/api/contact',{method:'POST',body:JSON.stringify({name:'Local Tester',email:'test@example.test',message:'This is a local test message only.'})});
beforeEach(()=>{jest.clearAllMocks();resolve.mockReturnValue(null);process.env.RESEND_API_KEY='mockkey'});afterAll(()=>delete process.env.RESEND_API_KEY);
it('Resend API resolved error never becomes success',async()=>{send.mockResolvedValue({data:null,error:{message:'denied'}});expect((await POST(req())).status).toBe(502)});
it('SMTP uses existing transport and confirmed team recipient, not Resend',async()=>{resolve.mockReturnValue({kind:'smtp',send:smtp});smtp.mockResolvedValue(true);expect((await POST(req())).status).toBe(200);expect(smtp.mock.calls[0][0].to).toBe('team@omnistu.com');expect(send).not.toHaveBeenCalled()});
it('SMTP rejection never falls through to a second provider send',async()=>{resolve.mockReturnValue({kind:'smtp',send:smtp});smtp.mockResolvedValue(false);expect((await POST(req())).status).toBe(502);expect(send).not.toHaveBeenCalled()});
