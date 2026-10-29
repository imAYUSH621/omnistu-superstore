import { redirect } from 'next/navigation';

export default async function AmazonSPage(props: {
  searchParams: Promise<{
    k?: string;
    q?: string;
    category?: string;
    price?: string;
    price_max?: string;
    rating?: string;
    sort?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams.k || searchParams.q || '';
  const category = searchParams.category || '';
  const priceMax = searchParams.price_max || '';
  const sort = searchParams.sort || '';

  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (category) params.set('category', category);
  if (priceMax) params.set('price', `0-${priceMax}`);
  if (sort) params.set('sort', sort);

  redirect(`/search?${params.toString()}`);
}
