import { redirect } from 'next/navigation';

export default async function SPage(props: {
  searchParams: Promise<{
    k?: string;
    q?: string;
    category?: string;
    price?: string;
    rating?: string;
    sort?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const q = searchParams.k || searchParams.q || '';
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (searchParams.category) params.set('category', searchParams.category);
  if (searchParams.price) params.set('price', searchParams.price);
  if (searchParams.rating) params.set('rating', searchParams.rating);
  if (searchParams.sort) params.set('sort', searchParams.sort);

  const queryStr = params.toString();
  redirect(queryStr ? `/search?${queryStr}` : '/search');
}
