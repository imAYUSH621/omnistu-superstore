import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getAllCategories } from '@/lib/actions/product.actions';
import { SearchIcon } from 'lucide-react';

const Search = async () => {
  const categories = await getAllCategories();

  return (
    <form action='/search' method='GET' className='w-full max-w-xl'>
      <div className='flex items-center w-full rounded-full border border-neutral-300 dark:border-neutral-700 bg-background overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-amber-400'>
        {/* Category Picker */}
        <Select name='category' defaultValue='all'>
          <SelectTrigger className='w-[140px] md:w-[160px] h-10 border-0 rounded-none bg-neutral-100/80 dark:bg-neutral-900 text-xs font-semibold focus:ring-0 border-r border-neutral-300 dark:border-neutral-700'>
            <SelectValue placeholder='All Departments' />
          </SelectTrigger>
          <SelectContent className='text-xs'>
            <SelectItem key='All' value='all'>
              All Departments
            </SelectItem>
            {categories.map((x) => (
              <SelectItem key={x.category} value={x.category}>
                {x.category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Search Input with Amazon Selector id */}
        <Input
          id='twotabsearchtextbox'
          name='q'
          type='text'
          placeholder='Search Omnistu Superstore (e.g. magnetic balls, hoodies)...'
          className='flex-1 border-0 h-10 text-xs md:text-sm focus-visible:ring-0 bg-transparent px-3'
        />

        {/* Search Submit Button */}
        <Button
          type='submit'
          className='h-10 px-4 rounded-none bg-amber-400 hover:bg-amber-500 text-neutral-900 transition font-bold'
          aria-label='Search'
        >
          <SearchIcon className='w-4 h-4' />
        </Button>
      </div>
    </form>
  );
};

export default Search;
