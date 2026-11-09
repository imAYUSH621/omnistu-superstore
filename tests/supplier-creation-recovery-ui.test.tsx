import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
jest.mock('@/lib/actions/supplier-creation.actions',()=>({recoverSupplierCreationAction:jest.fn()}));
import {SupplierCreationRecoveryPanel} from '@/components/shared/order/supplier-creation-recovery';
it('OFF refuses a recovery control even for UNKNOWN',()=>{const s=renderToStaticMarkup(<SupplierCreationRecoveryPanel enabled={false} state='UNKNOWN'/>);expect(s).toContain('not enabled');expect(s).not.toContain('<button');expect(s).toContain('Do not resubmit')});
it('UNKNOWN provides only an existing-order read, not create or payment',()=>{const s=renderToStaticMarkup(<SupplierCreationRecoveryPanel enabled state='UNKNOWN'/>);expect(s).toContain('Check existing supplier order');expect(s).toContain('missing result is not proof');expect(s).toContain('does not create another supplier order')});
it.each(['ACCEPTED','UNAVAILABLE',null])('does not offer another query on state %s',state=>{expect(renderToStaticMarkup(<SupplierCreationRecoveryPanel enabled state={state}/>)).not.toContain('<button')});
