import type { ReactNode } from 'react';
import { usePageContext } from 'vike-react/usePageContext';

export function Link({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const pageContext = usePageContext();
  const { urlPathname } = pageContext;
  const isActive =
    href === '/' ? urlPathname === href : urlPathname.startsWith(href);
  return (
    <a
      href={href}
      className={`${isActive ? 'is-active' : ''} ${className || ''}`}
    >
      {children}
    </a>
  );
}
