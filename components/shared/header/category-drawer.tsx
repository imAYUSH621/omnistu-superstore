import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { getAllCategories } from '@/lib/actions/product.actions';
import { Menu, Sparkles } from 'lucide-react';
import Link from 'next/link';
import HeaderText from './header-text';

const CategoryDrawer = async () => {
  const categories = await getAllCategories();

  return (
    <Drawer direction='left'>
      <DrawerTrigger asChild>
        <Button
          id='nav-hamburger-menu'
          variant='ghost'
          className='flex items-center gap-1.5 px-3 font-bold text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg'

        >
          <Menu aria-hidden className='w-5 h-5 text-foreground' />
          <span aria-hidden className='font-bold text-[14px] leading-none'><HeaderText name='all'/></span><span className='sr-only'><HeaderText name='allCategories'/></span>
        </Button>
      </DrawerTrigger>
      <DrawerContent className='h-full max-w-sm p-6'>
        <DrawerHeader className='text-left pb-4 border-b border-neutral-200 dark:border-neutral-800 px-0'>
          <DrawerTitle className='flex items-center gap-2 text-lg font-bold'>
            <Sparkles className='w-4 h-4 text-amber-500' />
            <HeaderText name='shopByCategory'/>
          </DrawerTitle>
        </DrawerHeader>
        <div className='space-y-1.5 mt-4 overflow-y-auto max-h-[calc(100vh-140px)]'>
          <Button
            variant='ghost'
            className='w-full justify-between font-semibold text-xs'
            asChild
          >
            <DrawerClose asChild>
              <Link href='/search?category=all'>
                <span><HeaderText name='allCategories'/></span>
                <span className='text-muted-foreground'><HeaderText name='viewAll'/></span>
              </Link>
            </DrawerClose>
          </Button>

          {categories.map((x) => (
            <Button
              variant='ghost'
              className='w-full justify-between text-xs py-2.5'
              key={x.category}
              asChild
            >
              <DrawerClose asChild>
                <Link href={`/search?category=${encodeURIComponent(x.category)}`}>
                  <span className='font-medium'><HeaderText category={x.category}/></span>
                  <span className='text-[11px] text-muted-foreground bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full'>
                    <HeaderText count={x._count}/>
                  </span>
                </Link>
              </DrawerClose>
            </Button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default CategoryDrawer;
