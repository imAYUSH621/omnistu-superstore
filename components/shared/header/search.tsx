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
    <form action='/search' method='GET' className='w-full max-w-3xl'>
      <div className='flex items-center w-full rounded-[4px] bg-white overflow-hidden shadow-xs border border-transparent focus-within:ring-2 focus-within:ring-[#f3a847] focus-within:ring-offset-1 h-10'>
        {/* Category Picker */}
        <Select name='category' defaultValue='all'>
          <SelectTrigger className='w-[130px] md:w-[150px] h-10 border-0 rounded-none bg-[#f3f3f3] hover:bg-[#dadada] text-[#555] text-[12px] font-normal focus:ring-0 border-r border-[#cdcdcd] px-2.5 transition-colors cursor-pointer'>
            <SelectValue placeholder='All' />
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
          placeholder='Search Omnistu Superstore'
          className='flex-1 border-0 h-10 text-[14px] text-[#0f1111] placeholder:text-[#767676] focus-visible:ring-0 bg-white px-3 font-["Amazon_Ember",Arial,sans-serif]'
        />

        {/* Search Submit Button */}
        <Button
          type='submit'
          className='h-10 px-4 rounded-none bg-[#febd69] hover:bg-[#f3a847] active:bg-[#e09838] text-[#111] border-0 transition-colors cursor-pointer'
          aria-label='Search'
        >
          <SearchIcon className='w-5 h-5 text-[#333]' />
        </Button>
      </div>
    </form>
  );
};

export default Search;
