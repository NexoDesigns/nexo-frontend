// ─── UI Components — Nexo Dark Theme ─────────────────────────────────────

const NX = {
  bg: 'hsl(222 22% 7%)',
  card: 'hsl(222 20% 10%)',
  cardHover: 'hsl(222 20% 12%)',
  border: 'hsl(222 18% 16%)',
  borderHover: 'hsl(222 18% 22%)',
  primary: 'hsl(153 60% 53%)',
  primaryDim: 'hsla(153,60%,53%,.12)',
  primaryBorder: 'hsla(153,60%,53%,.3)',
  text: 'hsl(210 17% 93%)',
  textSecondary: 'hsl(210 17% 75%)',
  textMuted: 'hsl(217 10% 50%)',
  textDim: 'hsl(217 10% 36%)',
  warning: 'hsl(38 92% 50%)',
  warningDim: 'hsla(38,92%,50%,.12)',
  destructive: 'hsl(0 72% 51%)',
  destructiveDim: 'hsla(0,72%,51%,.12)',
  success: 'hsl(142 71% 45%)',
  successDim: 'hsla(142,71%,45%,.12)',
  sidebar: 'hsl(222 22% 9%)',
  sidebarBorder: 'hsl(222 18% 14%)',
  radius: '8px',
  radiusSm: '6px',
  font: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  mono: '"SF Mono", "Fira Code", "Cascadia Code", monospace',
};

// Label
function NxLabel({ children, style }) {
  return <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: NX.textMuted, ...style }}>{children}</div>;
}

// Card wrapper
function NxCard({ children, style, active, onClick }) {
  return <div onClick={onClick} style={{
    background: NX.card, border: `1px solid ${active ? NX.primaryBorder : NX.border}`,
    borderRadius: NX.radius, padding: '12px 14px', transition: 'border-color .15s, background .15s',
    ...(active ? { background: NX.primaryDim } : {}),
    ...(onClick ? { cursor: 'pointer' } : {}),
    ...style,
  }}>{children}</div>;
}

// Radio option
function NxRadio({ checked, label, onClick, disabled }) {
  return <div onClick={disabled ? undefined : onClick} style={{
    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: NX.radiusSm,
    cursor: disabled ? 'default' : 'pointer', opacity: disabled ? .4 : 1,
    background: checked ? NX.primaryDim : 'transparent',
    border: `1px solid ${checked ? NX.primaryBorder : 'transparent'}`,
    transition: 'all .12s',
  }}>
    <div style={{
      width: 16, height: 16, borderRadius: 99, flexShrink: 0,
      border: `2px solid ${checked ? NX.primary : NX.textDim}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'border-color .12s',
    }}>
      {checked && <div style={{ width: 7, height: 7, borderRadius: 99, background: NX.primary }} />}
    </div>
    <span style={{ fontSize: 12, color: checked ? NX.text : NX.textSecondary, fontWeight: checked ? 500 : 400 }}>{label}</span>
  </div>;
}

// Checkbox option
function NxCheckbox({ checked, label, onClick, disabled }) {
  return <div onClick={disabled ? undefined : onClick} style={{
    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: NX.radiusSm,
    cursor: disabled ? 'default' : 'pointer', opacity: disabled ? .4 : 1,
    background: checked ? NX.primaryDim : 'transparent',
    border: `1px solid ${checked ? NX.primaryBorder : 'transparent'}`,
    transition: 'all .12s',
  }}>
    <div style={{
      width: 16, height: 16, borderRadius: 4, flexShrink: 0,
      border: `2px solid ${checked ? NX.primary : NX.textDim}`,
      background: checked ? NX.primary : 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all .12s',
    }}>
      {checked && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke={NX.bg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
    </div>
    <span style={{ fontSize: 12, color: checked ? NX.text : NX.textSecondary, fontWeight: checked ? 500 : 400 }}>{label}</span>
  </div>;
}

// Button
function NxButton({ children, primary, small, ghost, onClick, disabled, style }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: small ? '5px 12px' : '7px 16px',
    borderRadius: NX.radiusSm, fontSize: small ? 11 : 12, fontWeight: 600,
    cursor: disabled ? 'default' : 'pointer', fontFamily: NX.font,
    border: 'none', outline: 'none', transition: 'all .12s',
    opacity: disabled ? .5 : 1,
  };
  if (primary) Object.assign(base, { background: NX.primary, color: NX.bg });
  else if (ghost) Object.assign(base, { background: 'transparent', color: NX.textMuted, padding: small ? '5px 8px' : '7px 10px' });
  else Object.assign(base, { background: 'transparent', color: NX.textSecondary, border: `1px solid ${NX.border}` });
  return <button onClick={disabled ? undefined : onClick} style={{ ...base, ...style }}>{children}</button>;
}

// "I don't know" button
function NxUnknownButton({ onClick, active }) {
  return <button onClick={onClick} style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '5px 12px', borderRadius: NX.radiusSm, fontSize: 11, fontWeight: 500,
    cursor: 'pointer', border: 'none', fontFamily: NX.font,
    background: active ? NX.warningDim : 'transparent',
    color: active ? NX.warning : NX.textDim,
    border: `1px solid ${active ? 'hsla(38,92%,50%,.3)' : NX.border}`,
    transition: 'all .12s',
  }}>
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5"/><text x="7" y="10.5" textAnchor="middle" fill="currentColor" fontSize="9" fontWeight="700">?</text></svg>
    No lo sé aún
  </button>;
}

// Legislation status badge
function NxLegBadge({ leg, compact }) {
  const c = { confirmed: NX.success, possible: NX.warning, excluded: NX.destructive, not_evaluated: NX.textDim };
  const bg = { confirmed: NX.successDim, possible: NX.warningDim, excluded: NX.destructiveDim, not_evaluated: 'transparent' };
  const icon = { confirmed: '✓', possible: '?', excluded: '✕', not_evaluated: '·' };
  const color = c[leg.status] || NX.textDim;
  const bgColor = bg[leg.status] || 'transparent';

  if (compact) {
    return <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: NX.radiusSm, background: bgColor }}>
      <span style={{ fontSize: 10, fontWeight: 700, color }}>{icon[leg.status]}</span>
      <span style={{ fontSize: 10, fontWeight: 600, color: NX.text, fontFamily: NX.mono }}>{leg.code}</span>
    </div>;
  }

  return <div style={{ padding: '8px 10px', borderRadius: NX.radiusSm, background: bgColor, border: `1px solid ${color}22` }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color }}>{icon[leg.status]}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: NX.text }}>{leg.code}</span>
      <span style={{ fontSize: 9, color: NX.textMuted, fontFamily: NX.mono, marginLeft: 'auto' }}>{leg.ref}</span>
    </div>
    <div style={{ fontSize: 10, color: NX.textMuted, lineHeight: 1.4 }}>{leg.name}</div>
  </div>;
}

// Progress bar
function NxProgressBar({ value, max, style }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return <div style={{ height: 4, borderRadius: 2, background: NX.border, overflow: 'hidden', ...style }}>
    <div style={{ width: `${pct}%`, height: '100%', background: NX.primary, borderRadius: 2, transition: 'width .3s ease' }} />
  </div>;
}

// Block step in sidebar
function NxBlockStep({ block, active, done, progress, onClick, skipped }) {
  return <div onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', cursor: 'pointer',
    background: active ? NX.primaryDim : 'transparent',
    borderRight: active ? `2px solid ${NX.primary}` : '2px solid transparent',
    transition: 'all .12s', opacity: skipped ? .35 : 1,
  }}>
    <div style={{
      width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 10, fontWeight: 700, fontFamily: NX.mono, flexShrink: 0,
      background: done ? NX.primary : active ? NX.primaryDim : NX.card,
      color: done ? NX.bg : active ? NX.primary : NX.textDim,
      border: `1px solid ${done ? NX.primary : active ? NX.primaryBorder : NX.border}`,
    }}>
      {done ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6l2.5 2.5L9.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> : block.id}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: active ? 600 : 400, color: active ? NX.text : done ? NX.textSecondary : NX.textDim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {block.label}
      </div>
      {progress && <div style={{ fontSize: 9, color: NX.textDim, marginTop: 1 }}>{progress.done}/{progress.total}</div>}
    </div>
  </div>;
}

window.NX = NX;
window.NxLabel = NxLabel;
window.NxCard = NxCard;
window.NxRadio = NxRadio;
window.NxCheckbox = NxCheckbox;
window.NxButton = NxButton;
window.NxUnknownButton = NxUnknownButton;
window.NxLegBadge = NxLegBadge;
window.NxProgressBar = NxProgressBar;
window.NxBlockStep = NxBlockStep;
