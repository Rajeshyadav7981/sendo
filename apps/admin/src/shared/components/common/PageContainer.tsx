import type { PropsWithChildren, ReactNode } from 'react';

interface PageContainerProps {
  title?: ReactNode;
  toolbar?: ReactNode;
  className?: string;
}

/**
 * Wraps a page in the legacy `.sendo-page` shell with the yellow heading bar
 * and optional toolbar row. Use for any admin screen.
 */
export function PageContainer({
  title,
  toolbar,
  className,
  children,
}: PropsWithChildren<PageContainerProps>): JSX.Element {
  return (
    <div className={`sendo-page ${className ?? ''}`}>
      {title ? <h2 className="sendo-heading">{title}</h2> : null}
      {toolbar ? <div className="sendo-toolbar">{toolbar}</div> : null}
      <div className="sendo-section">{children}</div>
    </div>
  );
}
