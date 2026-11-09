'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { useTheme } from 'next-themes';
import { SunIcon, MoonIcon, SunMoon, Briefcase } from 'lucide-react';
import{useStoreLanguage}from '@/hooks/use-store-language';
import{HEADER_COPY}from '@/lib/header-language';

const ModeToggle = () => {
  const c=HEADER_COPY[useStoreLanguage()];
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          aria-label={c.appearance}
          className='focus-visible:ring-0 focus-visible:ring-offset-0'
        >
          {theme === 'system' ? (
            <SunMoon />
          ) : theme === 'dark' ? (
            <MoonIcon />
          ) : theme === 'professional' ? (
            <Briefcase />
          ) : (
            <SunIcon />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{c.appearance}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={theme === 'system'}
          onClick={() => setTheme('system')}
        >
          {c.system}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={theme === 'dark'}
          onClick={() => setTheme('dark')}
        >
          {c.dark}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={theme === 'professional'}
          onClick={() => setTheme('professional')}

        >
          {c.professional}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={theme === 'light'}
          onClick={() => setTheme('light')}
        >
          {c.light}
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ModeToggle;
