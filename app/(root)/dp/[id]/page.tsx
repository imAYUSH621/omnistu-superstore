import { redirect } from 'next/navigation';

export default async function AmazonDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  const knownMappings: Record<string, string> = {
    'OMN-SENS-001': 'silicone-magnetic-balls-fidget-toys',
    'OMN-GLOW-001': 'turmeric-kojic-glow-cleansing-pads-90ct',
    'OMN-RING-001': 'smart-health-sleep-tracker-ring',
    'OMN-AUDIO-001': 'active-noise-cancelling-wireless-earbuds-pro',
    'B0DSVTXFNW': 'silicone-magnetic-balls-fidget-toys',
  };

  const targetSlug = knownMappings[id] || id;
  redirect(`/product/${targetSlug}`);
}
