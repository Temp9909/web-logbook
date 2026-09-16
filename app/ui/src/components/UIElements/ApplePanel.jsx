export const ApplePanel = ({ title, subtitle, actions = null, children, className = '' }) => (
  <section className={`apple-panel card ${className}`.trim()}>
    {(title || subtitle || actions) && (
      <div className="apple-panel-head">
        <div className="apple-panel-copy">
          {title ? <div className="apple-panel-title">{title}</div> : null}
          {subtitle ? <div className="apple-panel-subtitle">{subtitle}</div> : null}
        </div>
        {actions ? <div className="apple-panel-actions">{actions}</div> : null}
      </div>
    )}
    <div className="apple-panel-body">{children}</div>
  </section>
);

export const AppleSectionLabel = ({ children }) => (
  <div className="apple-section-label">{children}</div>
);

export const AppleSeparator = () => <div className="apple-separator" role="presentation" />;

export default ApplePanel;
