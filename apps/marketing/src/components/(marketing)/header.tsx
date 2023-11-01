'use client';

import { HTMLAttributes, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';

import { useFeatureFlags } from '@documenso/lib/client-only/providers/feature-flag';
import ChangeLocale from '@documenso/ui/components/ChangeLocale';
import { useTranslation } from '@documenso/ui/i18n/client';
import type { LocaleTypes } from '@documenso/ui/i18n/settings';
import { cn } from '@documenso/ui/lib/utils';

import { HamburgerMenu } from './mobile-hamburger';
import { MobileNavigation } from './mobile-navigation';

export type HeaderProps = HTMLAttributes<HTMLElement>;

export const Header = ({ className, ...props }: HeaderProps) => {
  const [isHamburgerMenuOpen, setIsHamburgerMenuOpen] = useState(false);
  const pathName = usePathname();
  const locale = useParams()?.locale as LocaleTypes;
  const { t } = useTranslation(locale, 'common');
  const { getFlag } = useFeatureFlags();

  const isSinglePlayerModeMarketingEnabled = getFlag('marketing_header_single_player_mode');

  return (
    <header className={cn('flex items-center justify-between', className)} {...props}>
      <div className="flex items-center space-x-4">
        <Link href="/" className="z-10" onClick={() => setIsHamburgerMenuOpen(false)}>
          <Image
            src="/logo.png"
            alt="Documenso Logo"
            className="dark:invert"
            width={170}
            height={25}
          />
        </Link>

        {isSinglePlayerModeMarketingEnabled && (
          <Link
            href="/singleplayer"
            className="bg-primary dark:text-background rounded-full px-2 py-1 text-xs font-semibold sm:px-3"
          >
            {t(`try`)}
          </Link>
        )}
      </div>

      <div className="hidden items-center gap-x-6 md:flex">
        <Link
          href={`${locale}/pricing`}
          className="text-muted-foreground hover:text-muted-foreground/80 text-sm font-semibold"
        >
          Pricing
        </Link>

        <Link
          href={`${locale}/blog`}
          className="text-muted-foreground hover:text-muted-foreground/80 text-sm font-semibold"
        >
          Blog
        </Link>

        <Link
          href={`${locale}/open`}
          className="text-muted-foreground hover:text-muted-foreground/80 text-sm font-semibold"
        >
          Open
        </Link>

        <Link
          href={`"https://app.documenso.com/${locale}/signin"`}
          target="_blank"
          className="text-muted-foreground hover:text-muted-foreground/80 text-sm font-semibold"
        >
          Sign in
        </Link>
        <ChangeLocale />
      </div>

      <HamburgerMenu
        onToggleMenuOpen={() => setIsHamburgerMenuOpen((v) => !v)}
        isMenuOpen={isHamburgerMenuOpen}
      />
      <MobileNavigation
        isMenuOpen={isHamburgerMenuOpen}
        onMenuOpenChange={setIsHamburgerMenuOpen}
      />
    </header>
  );
};
