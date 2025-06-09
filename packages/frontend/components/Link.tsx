import type { ReactNode } from 'react';
import { usePageContext } from 'vike-react/usePageContext';

export function Link(
  props: {
    href?: string;
    children: ReactNode;
    className?: string;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>
) {
  const pageContext = usePageContext();
  const { urlPathname } = pageContext;
  const { href, children, className, ...anchorTagProps } = props;

  if (href) {
    const hrefWithBaseUrl =
      import.meta.env.PUBLIC_ENV__BASE_URL === '/' ||
      !import.meta.env.PUBLIC_ENV__BASE_URL
        ? href
        : import.meta.env.PUBLIC_ENV__BASE_URL + href;

    // The urlPathname from vike's pageContext does not include the base url.
    const isActive =
      href === '/' ? urlPathname === href : urlPathname.startsWith(href);

    return (
      <a
        href={hrefWithBaseUrl}
        className={`${isActive ? 'is-active' : ''} ${className || ''}`}
        {...anchorTagProps}
      >
        {children}
      </a>
    );
  }

  return (
    <a className={className} {...anchorTagProps}>
      {children}
    </a>
  );
}
