export const AppleDialogPanel = ({ title, subtitle, actions = null, children, className = '' }) => (
  <div className={`apple-dialog-panel ${className}`.trim()}>
    <div className="apple-dialog-head">
      <div className="apple-dialog-copy">
        {title ? <div className="apple-dialog-title">{title}</div> : null}
        {subtitle ? <div className="apple-dialog-subtitle">{subtitle}</div> : null}
      </div>
      {actions ? <div className="apple-dialog-actions">{actions}</div> : null}
    </div>
    <div className="apple-dialog-body">{children}</div>
  </div>
);

export default AppleDialogPanel;
