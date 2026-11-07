jest.mock('@/db/prisma',()=>({prisma:{$queryRaw:jest.fn()}}));
import{prisma}from'@/db/prisma';import{getSessionVersion}from'@/lib/session-version';
const env=process.env.NODE_ENV;beforeEach(()=>{Object.assign(process.env,{NODE_ENV:'production'});jest.clearAllMocks()});afterAll(()=>{Object.assign(process.env,{NODE_ENV:env})});
test.each([[],[{version:-1}],[{version:NaN}],[{version:1.5}],[{version:'0'}],[{version:0},{version:1}]].map(rows=>[rows]))('ordinary production invalid identity/version %p refuses',async rows=>{(prisma.$queryRaw as jest.Mock).mockResolvedValue(rows);await expect(getSessionVersion('synthetic')).rejects.toThrow('Session verification unavailable')});
test('ordinary production revocation-store failure refuses instead of accepting version zero',async()=>{(prisma.$queryRaw as jest.Mock).mockRejectedValue(Error('private DB failure'));await expect(getSessionVersion('synthetic')).rejects.toThrow('Session verification unavailable')});
test.each([0,1,7])('ordinary production verified version %i accepted',async version=>{(prisma.$queryRaw as jest.Mock).mockResolvedValue([{version}]);expect(await getSessionVersion('synthetic')).toBe(version)});
