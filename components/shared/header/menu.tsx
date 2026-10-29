import ModeToggle from './mode-toggle';
import { EllipsisVertical } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import UserButton from './user-button';
import CartBadge from './cart-badge';

const Menu = () => {
  return (
    <div className='flex justify-end gap-2 items-center'>
      <nav className='hidden md:flex w-full max-w-xs gap-1.5 items-center'>
        <ModeToggle />
        <CartBadge />
        <UserButton />
      </nav>
      <nav className='md:hidden flex items-center gap-1'>
        <CartBadge />
        <Sheet>
          <SheetTrigger className='p-2 align-middle rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition'>
            <EllipsisVertical className='w-5 h-5' />
          </SheetTrigger>
          <SheetContent className='flex flex-col items-start space-y-4 pt-8'>
            <SheetTitle className='font-bold text-lg'>Navigation Menu</SheetTitle>
            <div className='flex items-center gap-3 w-full border-b pb-4'>
              <ModeToggle />
              <span className='text-xs text-muted-foreground'>Toggle Theme</span>
            </div>
            <div className='w-full'>
              <UserButton />
            </div>
            <SheetDescription></SheetDescription>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
};

export default Menu;
