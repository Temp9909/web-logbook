import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import LinearProgress from '@mui/material/LinearProgress';
import { fetchLicenses } from '../../util/http/licensing';
import { useErrorNotification } from '../../hooks/useAppNotifications';
import useSettings from '../../hooks/useSettings';
import { calculateExpiry } from './helpers';
import { effectiveValidUntil, validityRuleFor } from '../LicenseRecord/easaValidityRules';

const classify = (item) => {
  const c = String(item?.category || '').toLowerCase();
  const n = String(item?.name || '').toLowerCase();
  if (c.includes('medical') || n.includes('medical') || n.includes('class 1') || n.includes('class 2')) return 'Medical';
  if (c.includes('licen') || n.includes('licen') || /^(lapl|ppl|cpl|mpl|atpl|spl|bpl)/.test(n)) return 'Licences';
  if (c.includes('rating')) return 'Ratings';
  return 'Certificates & qualifications';
};

const expiryMeta = (item, warningDays) => {
  const rule = validityRuleFor(item?.category, item?.name);
  const validUntil = effectiveValidUntil(item);
  const exp = calculateExpiry(validUntil);
  if (!exp) {
    const fallback = rule.kind === 'none' ? rule.label : 'No expiry date';
    return { status:'Valid', cls:'ok', detail: item?.number ? `${item.number} · ${fallback}` : fallback };
  }
  if (exp.diffDays < 0) return { status:'Expired', cls:'bad', detail:`Expired ${validUntil}` };
  if (exp.diffDays < warningDays) return { status:'Expiring', cls:'warn', detail:`Expires ${validUntil} · in ${exp.diffDays} days` };
  return { status:'Valid', cls:'ok', detail:`Expires ${validUntil}` };
};

function Group({ title, rows, warningDays, onOpen }) {
  if (!rows.length) return null;
  return (
    <div className="group">
      <div className="group-title">{title}</div>
      <div className="card rows">
        {rows.map((item) => {
          const meta = expiryMeta(item, warningDays);
          const details = item.number && !meta.detail.startsWith(item.number) ? `${item.number} · ${meta.detail}` : meta.detail;
          return (
            <div className="grow" key={item.uuid} onClick={() => onOpen(item.uuid)} style={{cursor:'pointer'}}>
              <div><div className="lbl">{item.name || item.category || 'Licence'}</div><div className="sub">{details}</div></div>
              <span className="spacer" />
              <span className={`chip ${meta.cls}`}>{meta.status}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Licensing() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const warningDays = settings?.licenses_expiration?.warning_period || 90;
  const { data = [], isLoading, isError, error } = useQuery({
    queryKey:['licensing'], queryFn:({signal})=>fetchLicenses({signal}), staleTime:3600000, gcTime:3600000
  });
  useErrorNotification({ isError, error, fallbackMessage:'Failed to load licenses' });

  const groups = useMemo(() => {
    const out = { Licences:[], Ratings:[], Medical:[], 'Certificates & qualifications':[] };
    (Array.isArray(data) ? data : []).forEach(item => out[classify(item)].push(item));
    return out;
  }, [data]);
  const expiring = useMemo(() => (Array.isArray(data) ? data : []).filter(item => {
    const exp = calculateExpiry(effectiveValidUntil(item));
    return exp && exp.diffDays >= 0 && exp.diffDays < warningDays;
  }).length, [data, warningDays]);

  return (
    <section className="active apple-page-shell">
      <h1 className="page-title">Licensing</h1>
      <p className="page-sub">Licences, ratings and certificates — {expiring} item{expiring === 1 ? '' : 's'} expiring within {warningDays} days</p>
      {isLoading && <LinearProgress sx={{mb:1.5,borderRadius:99}} />}
      <Group title="Licences" rows={groups.Licences} warningDays={warningDays} onOpen={(id)=>navigate(`/licensing/${id}`)} />
      <Group title="Ratings" rows={groups.Ratings} warningDays={warningDays} onOpen={(id)=>navigate(`/licensing/${id}`)} />
      <Group title="Medical" rows={groups.Medical} warningDays={warningDays} onOpen={(id)=>navigate(`/licensing/${id}`)} />
      <Group title="Certificates & qualifications" rows={groups['Certificates & qualifications']} warningDays={warningDays} onOpen={(id)=>navigate(`/licensing/${id}`)} />
      <button className="btn primary" onClick={()=>navigate('/licensing/new')}>＋ Add a record</button>
    </section>
  );
}
