import React from 'react';import{renderToStaticMarkup}from 'react-dom/server';
jest.mock('next/navigation',()=>({usePathname:()=>'/'}));
import TrafficAnalytics from '@/components/shared/analytics/traffic-analytics';
it('actual component with null config is empty: no provider script, banner or consent storage',()=>{expect(renderToStaticMarkup(<TrafficAnalytics config={null}/>)).toBe('')});
it('unresolved browserconsent renders equal allow/deny actions but no provider script',()=>{const s=renderToStaticMarkup(<TrafficAnalytics config={{measurementId:'G-TESTONLY01'}}/>);expect(s).toContain('Allow analytics');expect(s).toContain('Do not allow');expect(s).not.toContain('googletagmanager');expect(s).not.toContain('<script')});
