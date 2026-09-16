export default function AppleLegacyHeading({ title, subtitle, actions = null }) {
  return (
    <div className="apple-legacy-heading">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle ? <p className="page-sub">{subtitle}</p> : null}
      </div>
      {actions ? <div className="apple-legacy-heading-actions">{actions}</div> : null}
    </div>
  );
}
