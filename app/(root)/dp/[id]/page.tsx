import { redirect } from 'next/navigation';

export default async function AmazonDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  // Check known mapping or direct slug
  const knownMappings: Record<string, string> = {
    'OMN-SENS-001': 'silicone-magnetic-balls-fidget-toys-for-adults-teens',
    'OMN-GLOW-001': 'turmeric-kojic-glow-cleansing-pads-90ct',
    'OMN-RING-001': 'smart-health-sleep-tracker-ring',
    'OMN-AUDIO-001': 'hi-fi-anc-wireless-earbuds-pro',
  };

  const targetSlug = knownMappings[id] || id;
  redirect(`/product/${targetSlug}`);
}
