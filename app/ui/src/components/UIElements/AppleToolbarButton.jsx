import { forwardRef } from 'react';
import IconButton from '@mui/material/IconButton';

/**
 * Toolbar-style icon button without the MUI X Toolbar context dependency.
 * Safe to render in grid toolbars, page headers, menus and dialogs.
 */
const AppleToolbarButton = forwardRef(function AppleToolbarButton(
  { label, ownerState: _ownerState, title, children, ...props },
  ref,
) {
  const ariaLabel = props['aria-label'] || label || title;

  return (
    <IconButton
      ref={ref}
      className="apple-toolbar-button"
      title={title || label}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </IconButton>
  );
});

export default AppleToolbarButton;
