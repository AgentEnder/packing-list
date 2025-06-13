import type { ReactNode } from 'react';
import { usePageContext } from 'vike-react/usePageContext';
import { navigate } from 'vike/client/router';

export function Link(
  props: {
    href?: string;
    children: ReactNode;
    className?: string;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>
) {
  const pageContext = usePageContext();
  const { urlPathname } = pageContext;
  const { href, children, className, onClick, ...anchorTagProps } = props;

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    // Call original onClick if provided
    if (onClick) {
      onClick(event);
    }

    // Only handle left clicks without modifier keys
    if (
      event.button !== 0 || // Not left click
      event.metaKey || // Cmd/Meta key
      event.ctrlKey || // Ctrl key
      event.shiftKey || // Shift key
      event.altKey || // Alt key
      event.defaultPrevented // Already prevented
    ) {
      return;
    }

    // Only handle internal links
    if (href && !href.startsWith('http') && !href.startsWith('//')) {
      event.preventDefault();
      navigate(href);
    }
  };

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
        onClick={handleClick}
        className={`${isActive ? 'is-active' : ''} ${className || ''}`}
        {...anchorTagProps}
      >
        {children}
      </a>
    );
  }

  return (
    <a className={className} onClick={onClick} {...anchorTagProps}>
      {children}
    </a>
  );
}
