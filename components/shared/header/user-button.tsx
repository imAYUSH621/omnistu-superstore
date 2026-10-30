import Link from 'next/link';
import { auth } from '@/auth';
import { signOutUser } from '@/lib/actions/user.actions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, ShieldCheck } from 'lucide-react';

const UserButton = async () => {
  const session = await auth();

  if (!session) {
    return (
      <Link
        href='/sign-in'
        className='flex flex-col text-left px-2 py-1 border border-transparent hover:border-white rounded-xs text-white leading-tight transition-colors'
      >
        <span className='text-[11px] text-[#cccccc] font-normal leading-none'>
          Hello, sign in
        </span>
        <span className='text-[13px] font-bold text-white leading-tight flex items-center gap-0.5 mt-0.5'>
          Account & Lists
          <ChevronDown className='w-3 h-3 text-[#a7acb2]' />
        </span>
      </Link>
    );
  }

  const firstName = session.user?.name?.split(' ')[0] || 'User';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className='flex flex-col text-left px-2 py-1 border border-transparent hover:border-white rounded-xs text-white leading-tight cursor-pointer transition-colors'>
          <span className='text-[11px] text-[#cccccc] font-normal leading-none'>
            Hello, {firstName}
          </span>
          <span className='text-[13px] font-bold text-white leading-tight flex items-center gap-0.5 mt-0.5'>
            Account & Lists
            <ChevronDown className='w-3 h-3 text-[#a7acb2]' />
          </span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56 font-["Amazon_Ember",Arial,sans-serif]' align='end' forceMount>
        <DropdownMenuLabel className='font-normal py-2'>
          <div className='flex flex-col space-y-1'>
            <div className='text-sm font-bold leading-none text-[#0f1111]'>
              {session.user?.name}
            </div>
            <div className='text-xs text-muted-foreground leading-none'>
              {session.user?.email}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href='/user/profile' className='w-full cursor-pointer text-xs'>
            Your Account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href='/user/orders' className='w-full cursor-pointer text-xs'>
            Your Orders
          </Link>
        </DropdownMenuItem>

        {session?.user?.role === 'admin' && (
          <DropdownMenuItem asChild>
            <Link href='/admin/overview' className='w-full cursor-pointer text-xs text-amber-600 font-bold flex items-center gap-1.5'>
              <ShieldCheck className='w-3.5 h-3.5' /> Seller Central / Admin
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem className='p-0 mb-1'>
          <form action={signOutUser} className='w-full'>
            <Button
              className='w-full py-2 px-3 h-8 justify-start text-xs font-semibold'
              variant='ghost'
            >
              Sign Out
            </Button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserButton;
