'use client';
import{useStoreLanguage}from '@/hooks/use-store-language';
import{PRODUCT_COPY}from '@/lib/product-language';

import { useEffect } from 'react';
import { Review } from '@/types';
import Link from 'next/link';
import { useState } from 'react';
import ReviewForm from './review-form';
import { getReviews } from '@/lib/actions/review.actions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Calendar, User } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import Rating from '@/components/shared/product/rating';

const ReviewList = ({
  userId,
  productId,
  productSlug,
}: {
  userId: string;
  productId: string;
  productSlug: string;
}) => {
  const language=useStoreLanguage();const t=PRODUCT_COPY[language];
  const [state,setState]=useState<'loading'|'ready'|'error'>('loading');
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    let active=true;
    setState('loading');setReviews([]);
    getReviews({productId}).then(res=>{if(active){setReviews(res.data);setState('ready')}}).catch(()=>{if(active)setState('error')});
    return()=>{active=false};
  }, [productId]);
  const reload = async () => {
    setState('loading');
    try{const res=await getReviews({productId});setReviews([...res.data]);setState('ready')}catch{setState('error')}
  };

  return (
    <div className='space-y-4'>
      {state==='loading'&&<p role='status'>{t.reviewLoading}</p>}
      {state==='error'&&<p role='alert'>{t.reviewUnavailable}</p>}
      {state==='ready'&&reviews.length===0&&<div>{t.noReviews}</div>}
      {userId ? (
        <ReviewForm
          userId={userId}
          productId={productId}
          onReviewSubmitted={reload}
        />
      ) : (
        <div>
          <Link className='text-blue-700 underline' href={`/sign-in?callbackUrl=${encodeURIComponent('/product/'+productSlug)}`}>{t.reviewSignin}</Link>
        </div>
      )}
      <div className='flex flex-col gap-3'>
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardHeader>
              <div className='flex-between'>
                <CardTitle>{review.title}</CardTitle>
              </div>
              <CardDescription>{review.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='flex space-x-4 text-sm text-muted-foreground'>
                <Rating value={review.rating} />
                <div className='flex items-center'>
                  <User className='mr-1 h-3 w-3' />
                  {review.user ? review.user.name : t.reviewUser}
                </div>
                <div className='flex items-center'>
                  <Calendar className='mr-1 h-3 w-3' />
                  {formatDateTime(review.createdAt).dateTime}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ReviewList;
