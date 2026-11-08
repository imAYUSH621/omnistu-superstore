import PublicInfo from '@/components/shared/public-info';
import{publicInfoMetadata}from '@/lib/public-info-metadata';
export const generateMetadata=publicInfoMetadata('shipping');
export default function Page(){return <PublicInfo kind='shipping'/>}
