import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

/** Sheets and toasts render at the top of the page so no animated parent can trap them. */
export function Portal({ children }: { children: ReactNode }) {
  return createPortal(<div className="jx jx-portal">{children}</div>, document.body);
}
