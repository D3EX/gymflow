/* ─────────────────────────────────────────────────────────────
   Shared dark "gym" theme for the GymFlow admin + member portal.
   Import COLORS for inline styles, and render <ThemeStyles /> once
   near the top of any page that uses the shared global classes
   (card, btn, badge, form-input, table, modal, search-wrap...).
   Wrap the page root in className="gf-theme" for the overrides to apply.
───────────────────────────────────────────────────────────────*/

export const COLORS = {
  ink: 'var(--bg)',
  surface: 'var(--surface)',
  surface2: 'var(--surface-2)',
  surface3: 'var(--surface-3)',
  line: 'var(--border)',
  text: 'var(--text)',
  text2: 'var(--text-2)',
  text3: 'var(--text-3)',
  ember: 'var(--accent)',
  mint: 'var(--green)',
  amber: 'var(--amber)',
  red: 'var(--red)',
  blue: 'var(--blue)',
  // tinted backgrounds for badges/buttons — index.css doesn't override
  // these per-theme, so they stay consistent in light and dark
  mintBg: 'var(--green-bg)',
  amberBg: 'var(--amber-bg)',
  redBg: 'var(--red-bg)',
}

export function ThemeStyles() {
  return (
    <style>{`
      .gf-theme { background: ${COLORS.ink}; color: ${COLORS.text}; min-height: 100vh; padding: 28px; box-sizing: border-box; font-family: 'Inter', -apple-system, sans-serif; }
      .gf-theme * { box-sizing: border-box; }
      .gf-theme ::-webkit-scrollbar { width: 6px; height: 6px; }
      .gf-theme ::-webkit-scrollbar-thumb { background: ${COLORS.line}; border-radius: 99px; }

      .gf-theme .card { background: ${COLORS.surface}; border: 1px solid ${COLORS.line}; border-radius: 14px; }
      .gf-theme .page-title { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; color: ${COLORS.text}; margin: 0; }
      .gf-theme .page-subtitle { font-size: 13px; color: ${COLORS.text3}; margin-top: 4px; }
      .gf-theme .page-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 14px; margin-bottom: 22px; }

      .gf-theme .stat-value { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; color: ${COLORS.text}; }
      .gf-theme .stat-label { font-size: 11.5px; color: ${COLORS.text2}; margin-top: 4px; font-weight: 600; }
      .gf-theme .stat-sub { font-size: 11px; color: ${COLORS.text3}; margin-top: 2px; }
      .gf-theme .stat-card { background: ${COLORS.surface2}; border: 1px solid ${COLORS.line}; border-radius: 12px; }

      .gf-theme .text-xs { font-size: 11px; }
      .gf-theme .text-sm { font-size: 13px; }
      .gf-theme .text-base { font-size: 14px; }
      .gf-theme .text-lg { font-size: 16px; }
      .gf-theme .text-md { font-size: 13px; }
      .gf-theme .text-muted { color: ${COLORS.text3}; }
      .gf-theme .text-green-500 { color: ${COLORS.mint}; }
      .gf-theme .font-medium { font-weight: 600; }
      .gf-theme .font-semibold { font-weight: 700; }
      .gf-theme .mb-1 { margin-bottom: 4px; }
      .gf-theme .mb-2 { margin-bottom: 8px; }
      .gf-theme .mb-3 { margin-bottom: 12px; }
      .gf-theme .mb-4 { margin-bottom: 16px; }
      .gf-theme .mb-6 { margin-bottom: 24px; }
      .gf-theme .mt-1 { margin-top: 4px; }
      .gf-theme .mt-3 { margin-top: 12px; }
      .gf-theme .pb-2 { padding-bottom: 8px; }
      .gf-theme .py-8 { padding-top: 32px; padding-bottom: 32px; }
      .gf-theme .pt-2 { padding-top: 8px; }
      .gf-theme .mx-auto { margin-left: auto; margin-right: auto; }
      .gf-theme .opacity-50 { opacity: 0.5; }
      .gf-theme .flex { display: flex; }
      .gf-theme .flex-1 { flex: 1; }
      .gf-theme .items-center { align-items: center; }
      .gf-theme .items-start { align-items: flex-start; }
      .gf-theme .justify-between { justify-content: space-between; }
      .gf-theme .justify-center { justify-content: center; }
      .gf-theme .gap-1 { gap: 4px; }
      .gf-theme .gap-2 { gap: 8px; }
      .gf-theme .gap-3 { gap: 12px; }
      .gf-theme .space-y-3 > * + * { margin-top: 12px; }
      .gf-theme .space-y-4 > * + * { margin-top: 16px; }
      .gf-theme .w-full { width: 100%; }
      .gf-theme .w-10 { width: 40px; }
      .gf-theme .h-10 { height: 40px; }
      .gf-theme .h-8 { height: 32px; }
      .gf-theme .rounded-full { border-radius: 50%; }
      .gf-theme .rounded-lg { border-radius: 10px; }
      .gf-theme .overflow-hidden { overflow: hidden; }
      .gf-theme .grid-2 { display: grid; grid-template-columns: 1fr 1fr; }
      .gf-theme .bg-surface-2 { background: ${COLORS.surface2}; }
      .gf-theme .border-b { border-bottom: 1px solid ${COLORS.line}; }
      .gf-theme .border-t { border-top: 1px solid ${COLORS.line}; }
      .gf-theme .border-border { border-color: ${COLORS.line}; }
      .gf-theme .text-center { text-align: center; }
      .gf-theme a.font-medium { color: ${COLORS.text}; text-decoration: none; }
      .gf-theme a.font-medium:hover { color: ${COLORS.ember}; }

      .gf-theme .badge { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 99px; }
      .gf-theme .badge-green { background: ${COLORS.mintBg}; color: ${COLORS.mint}; }
      .gf-theme .badge-red { background: ${COLORS.redBg}; color: ${COLORS.red}; }
      .gf-theme .badge-amber { background: ${COLORS.amberBg}; color: ${COLORS.amber}; }

      .gf-theme .btn { display: inline-flex; align-items: center; gap: 7px; border-radius: 9px; font-weight: 700; cursor: pointer; border: 1px solid transparent; font-size: 13px; padding: 10px 18px; }
      .gf-theme .btn-sm { padding: 7px 12px; font-size: 12px; }
      .gf-theme .btn-primary { background: ${COLORS.ember}; color: ${COLORS.ink}; }
      .gf-theme .btn-secondary { background: ${COLORS.surface2}; color: ${COLORS.text}; border-color: ${COLORS.line}; }
      .gf-theme .btn-ghost { background: transparent; color: ${COLORS.text2}; border-color: ${COLORS.line}; }
      .gf-theme .btn-danger { background: ${COLORS.redBg}; color: ${COLORS.red}; }

      .gf-theme .form-input, .gf-theme select.form-input, .gf-theme textarea.form-input { background: ${COLORS.surface2}; border: 1px solid ${COLORS.line}; color: ${COLORS.text}; border-radius: 9px; padding: 10px 12px; font-size: 13px; width: 100%; outline: none; font-family: inherit; }
      .gf-theme .form-input::placeholder { color: ${COLORS.text3}; }
      .gf-theme .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
      .gf-theme .form-label { font-size: 12px; font-weight: 600; color: ${COLORS.text2}; }

      .gf-theme .search-wrap { display: flex; align-items: center; gap: 8px; background: ${COLORS.surface2}; border: 1px solid ${COLORS.line}; border-radius: 9px; padding: 0 12px; color: ${COLORS.text3}; }
      .gf-theme .search-wrap .form-input { background: none; border: none; padding: 10px 0; }

      .gf-theme .table-wrap { overflow-x: auto; }
      .gf-theme table { width: 100%; border-collapse: collapse; }
      .gf-theme thead th { text-align: left; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; color: ${COLORS.text3}; padding: 12px 18px; border-bottom: 1px solid ${COLORS.line}; background: ${COLORS.surface2}; }
      .gf-theme tbody td { padding: 14px 18px; border-bottom: 1px solid ${COLORS.line}; font-size: 13px; }
      .gf-theme tbody tr:last-child td { border-bottom: none; }
      .gf-theme tbody tr { transition: background 0.12s ease; }
      .gf-theme tbody tr:hover { background: ${COLORS.surface2}; }

      .gf-theme .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
      .gf-theme .modal { background: ${COLORS.surface}; border: 1px solid ${COLORS.line}; border-radius: 16px; padding: 24px; max-height: 90vh; overflow-y: auto; }
      .gf-theme .modal-title { color: ${COLORS.text}; font-weight: 700; font-size: 16px; margin: 0; }
      .gf-theme .modal-close { background: none; border: none; color: ${COLORS.text3}; font-size: 22px; cursor: pointer; line-height: 1; }

      .gf-theme .empty-state { text-align: center; padding: 48px 0; color: ${COLORS.text3}; }
      .gf-theme .loading { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; min-height: 100vh; background: ${COLORS.ink}; color: ${COLORS.text3}; font-size: 13px; font-weight: 600; }
      .gf-theme .spinner { width: 32px; height: 32px; border-radius: 50%; border: 3px solid ${COLORS.line}; border-top-color: ${COLORS.ember}; animation: gf-spin 0.8s linear infinite; }
      @keyframes gf-spin { to { transform: rotate(360deg); } }
    `}</style>
  )
}