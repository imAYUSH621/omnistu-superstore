import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Truck, Clock, Globe2, ShieldCheck, MapPin } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Shipping & Delivery Policy | ${APP_NAME}`,
  description: 'Worldwide shipping timeframes, carrier partners, customs clearance, and end-to-end tracking standards for Omnistu Superstore.',
};

export default function ShippingPolicyPage() {
  return (
    <div className='w-full min-h-screen bg-[#eaeded] dark:bg-[#0f1111] py-8 px-4 sm:px-6 font-["Amazon_Ember",Arial,sans-serif]'>
      <div className='max-w-[960px] mx-auto bg-white dark:bg-[#1a1e24] rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6 sm:p-10'>
        {/* Header */}
        <div className='border-b border-gray-200 dark:border-gray-800 pb-6 mb-8'>
          <div className='flex items-center gap-3 text-amber-600 mb-2'>
            <Truck className='w-7 h-7' />
            <span className='text-xs font-bold uppercase tracking-wider'>Global Logistics</span>
          </div>
          <h1 className='text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white'>
            {APP_NAME} Shipping & Delivery Policy
          </h1>
          <p className='text-xs sm:text-sm text-gray-500 mt-2'>
            Direct Manufacturer Dispatch • Live Carrier Tracking • Customs-Cleared Delivery
          </p>
        </div>

        {/* Content Body */}
        <div className='space-y-8 text-sm leading-relaxed text-gray-700 dark:text-gray-300'>
          {/* Overview */}
          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
              <Globe2 className='w-4 h-4 text-amber-500' /> 1. Direct Global Fulfillment Sourcing
            </h2>
            <p className='mb-3'>
              {APP_NAME} partners directly with certified manufacturers and premier fulfillment hubs across the United States, Europe, and Asia. By dispatching parcels directly from the production facility or bonded export warehouse, we offer exceptional prices without middleman markups.
            </p>
          </section>

          {/* Regional Delivery Table */}
          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2'>
              <Clock className='w-4 h-4 text-amber-500' /> 2. Estimated Shipping Timeframes & Carriers
            </h2>
            <div className='overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg'>
              <table className='w-full text-left text-xs sm:text-sm divide-y divide-gray-200 dark:divide-gray-700'>
                <thead className='bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-bold'>
                  <tr>
                    <th className='py-3 px-4'>Destination</th>
                    <th className='py-3 px-4'>Primary Carriers</th>
                    <th className='py-3 px-4'>Production & Packing</th>
                    <th className='py-3 px-4'>Transit Time</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200 dark:divide-gray-800'>
                  <tr>
                    <td className='py-3 px-4 font-semibold text-gray-900 dark:text-white flex items-center gap-1.5'>
                      <MapPin className='w-3.5 h-3.5 text-blue-500' /> United States
                    </td>
                    <td className='py-3 px-4'>USPS Ground Advantage / Priority, DHL eCommerce</td>
                    <td className='py-3 px-4 text-gray-500'>1–3 Business Days</td>
                    <td className='py-3 px-4 font-medium text-emerald-600 dark:text-emerald-400'>5–10 Business Days</td>
                  </tr>
                  <tr>
                    <td className='py-3 px-4 font-semibold text-gray-900 dark:text-white flex items-center gap-1.5'>
                      <MapPin className='w-3.5 h-3.5 text-orange-500' /> India
                    </td>
                    <td className='py-3 px-4'>India Post Speed Post, CJ Packet Special Line, Blue Dart Express</td>
                    <td className='py-3 px-4 text-gray-500'>1–3 Business Days</td>
                    <td className='py-3 px-4 font-medium text-emerald-600 dark:text-emerald-400'>8–15 Business Days</td>
                  </tr>
                  <tr>
                    <td className='py-3 px-4 font-semibold text-gray-900 dark:text-white flex items-center gap-1.5'>
                      <MapPin className='w-3.5 h-3.5 text-indigo-500' /> Europe & UK
                    </td>
                    <td className='py-3 px-4'>YunExpress Tracked, DHL Parcel, Royal Mail</td>
                    <td className='py-3 px-4 text-gray-500'>1–3 Business Days</td>
                    <td className='py-3 px-4 font-medium text-emerald-600 dark:text-emerald-400'>7–14 Business Days</td>
                  </tr>
                  <tr>
                    <td className='py-3 px-4 font-semibold text-gray-900 dark:text-white flex items-center gap-1.5'>
                      <MapPin className='w-3.5 h-3.5 text-gray-500' /> Canada & Australia
                    </td>
                    <td className='py-3 px-4'>Canada Post, Australia Post, UBI Smart Parcel</td>
                    <td className='py-3 px-4 text-gray-500'>1–3 Business Days</td>
                    <td className='py-3 px-4 font-medium text-emerald-600 dark:text-emerald-400'>8–16 Business Days</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className='text-xs text-gray-500 mt-2'>
              *Note: Remote postal codes or customs inspections during seasonal peaks (Black Friday, Diwali, Christmas) may add 2–4 business days.
            </p>
          </section>

          {/* Tracking & Customs */}
          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
              <ShieldCheck className='w-4 h-4 text-amber-500' /> 3. End-to-End Tracking & Customs Clearance
            </h2>
            <ul className='list-disc pl-5 space-y-2'>
              <li>
                <strong>Automated Tracking Dispatch:</strong> As soon as the manufacturer scans the item and generates the postal waybill, your tracking number is automatically emailed to you and reflected in your order dashboard.
              </li>
              <li>
                <strong>Customs & Import Duties:</strong> All standard consumer retail orders are dispatched with pre-cleared postal customs documentation (Delivered Duty Paid - DDP). You will not be asked to pay unexpected carrier ransom fees at your doorstep.
              </li>
              <li>
                <strong>Separate Package Shipments:</strong> If you purchase items originating from different specialized suppliers (e.g., custom apparel from Printify and electronics from CJ Dropshipping), items may arrive in separate, individually tracked parcels.
              </li>
            </ul>
          </section>
        </div>

        {/* Back button */}
        <div className='mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center text-xs'>
          <Link href='/' className='text-amber-600 hover:underline font-bold'>
            ← Return to Store
          </Link>
          <div className='flex gap-4 text-gray-500'>
            <Link href='/terms' className='hover:underline'>Terms of Service</Link>
            <Link href='/privacy' className='hover:underline'>Privacy Notice</Link>
            <Link href='/refund-policy' className='hover:underline'>Refund Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
