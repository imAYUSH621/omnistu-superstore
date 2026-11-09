import PublicInfo from '@/components/shared/public-info';
import{publicInfoMetadata}from '@/lib/public-info-metadata';
export const generateMetadata=publicInfoMetadata('ads');
export default function Page(){return <PublicInfo kind='ads'/>}
