'use client';

import type { HTMLAttributes } from 'react';
import { useEffect, useState } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@documenso/ui/lib/utils';
import { Button } from '@documenso/ui/primitives/button';

import { CommandMenu } from '../common/command-menu';

export type DesktopNavProps = HTMLAttributes<HTMLDivElement>;

export const DesktopNav = ({ className, ...props }: DesktopNavProps) => {
  const pathname = usePathname();
  const { t } = useTranslation();

  const navigationLinks = [
    {
      href: '/documents',
      label: `${t('documents')}`,
    },
    {
      href: '/templates',
      label: `${t('templates')}`,
    },
  ];

  const [open, setOpen] = useState(false);
  const [modifierKey, setModifierKey] = useState(() => 'Ctrl');

  useEffect(() => {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
    const isMacOS = /Macintosh|Mac\s+OS\s+X/i.test(userAgent);

    setModifierKey(isMacOS ? '⌘' : 'Ctrl');
  }, []);

  return (
    <div
      className={cn(
        'ml-8 hidden flex-1 items-center gap-x-12 md:flex md:justify-between',
        className,
      )}
      {...props}
    >
      <div className="flex items-baseline gap-x-6">
        {navigationLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'text-muted-foreground dark:text-muted focus-visible:ring-ring ring-offset-background rounded-md font-medium leading-5 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2',
              {
                'text-foreground dark:text-muted-foreground': pathname?.startsWith(href),
              },
            )}
          >
            {label}
          </Link>
        ))}
      </div>

      <CommandMenu open={open} onOpenChange={setOpen} />

      <Button
        variant="outline"
        className="text-muted-foreground flex w-96 items-center justify-between rounded-lg"
        onClick={() => setOpen((open) => !open)}
      >
        <div className="flex items-center">
          <Search className="mr-2 h-5 w-5" />
          {t('search')}
        </div>

        <div>
          <div className="text-muted-foreground bg-muted flex items-center rounded-md px-1.5 py-0.5  text-xs tracking-wider">
            {modifierKey}+K
          </div>
        </div>
      </Button>
    </div>
  );
};
