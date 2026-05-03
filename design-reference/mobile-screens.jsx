// mobile-screens.jsx — iPhone 13 redesigned screens for VNM Sales App
// Renders inside iPhone 13 frame (390x844). Clean, minimal, single accent.

const IP_W = 390;
const IP_H = 844;

// ─── Custom iPhone 13 frame (no notch, no dynamic island; clean shell) ───
function PhoneShell({ t, children, statusBarDark }) {
  return (
    <div style={{
      width: IP_W + 16, height: IP_H + 16, borderRadius: 54,
      padding: 8, background: '#1A1A1A',
      boxShadow: '0 30px 70px rgba(0,0,0,.18), 0 0 0 2px #2a2a2a, inset 0 0 0 1.5px #444',
      position: 'relative',
    }}>
      <div style={{
        width: IP_W, height: IP_H, borderRadius: 46, overflow: 'hidden',
        background: t.bg, position: 'relative',
        fontFamily: 'inherit',
      }}>
        {/* iPhone 13 notch */}
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 162, height: 30, borderBottomLeftRadius: 22, borderBottomRightRadius: 22,
          background: '#000', zIndex: 50,
        }}/>
        {/* status bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 47, zIndex: 40,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0 32px', color: statusBarDark ? '#fff' : t.text,
          fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em',
        }}>
          <div>9:41</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="17" height="11" viewBox="0 0 17 11"><rect x="0" y="6" width="3" height="5" rx="0.7" fill="currentColor"/><rect x="4.5" y="4" width="3" height="7" rx="0.7" fill="currentColor"/><rect x="9" y="2" width="3" height="9" rx="0.7" fill="currentColor"/><rect x="13.5" y="0" width="3" height="11" rx="0.7" fill="currentColor"/></svg>
            <svg width="24" height="11" viewBox="0 0 24 11"><rect x="0.5" y="0.5" width="20" height="10" rx="3" stroke="currentColor" strokeOpacity=".4" fill="none"/><rect x="2" y="2" width="17" height="7" rx="1.5" fill="currentColor"/><rect x="21.5" y="3.5" width="1.5" height="4" rx="0.5" fill="currentColor" fillOpacity=".4"/></svg>
          </div>
        </div>
        {/* screen content */}
        <div style={{ width: '100%', height: '100%', paddingTop: 47, boxSizing: 'border-box',
          display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
        {/* home indicator */}
        <div style={{
          position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
          width: 134, height: 5, borderRadius: 99,
          background: t.dark ? 'rgba(255,255,255,.6)' : 'rgba(0,0,0,.3)', zIndex: 60,
        }}/>
      </div>
    </div>
  );
}

// ─── Bottom Tab Bar ──────────────────────────────────────────────
function MobileTabBar({ t, active = 'order' }) {
  const tabs = [
    { id: 'home', icon: 'home', label: 'Trang chủ' },
    { id: 'order', icon: 'cart', label: 'Đặt hàng' },
    { id: 'orders', icon: 'list', label: 'Đơn hàng' },
    { id: 'ai', icon: 'sparkle', label: 'AI' },
    { id: 'customers', icon: 'users', label: 'Khách hàng' },
  ];
  return (
    <div style={{
      borderTop: `1px solid ${t.border}`, background: t.surface,
      padding: '8px 4px 22px', display: 'flex', justifyContent: 'space-around',
    }}>
      {tabs.map(tab => {
        const isActive = tab.id === active;
        return (
          <div key={tab.id} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            color: isActive ? t.accent : t.textTertiary,
            padding: '4px 2px',
          }}>
            <Icon name={tab.icon} size={22} strokeWidth={isActive ? 2.1 : 1.7}/>
            <div style={{ fontSize: 10.5, fontWeight: isActive ? 600 : 500, letterSpacing: '-0.005em' }}>
              {tab.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Mobile Header ───────────────────────────────────────────────
function MobileHeader({ title, subtitle, t, action, eyebrow }) {
  return (
    <div style={{ padding: '8px 20px 16px', background: t.bg }}>
      {eyebrow && (
        <div style={{ fontSize: 11, fontWeight: 600, color: t.textTertiary,
          textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>
          {eyebrow}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, color: t.text,
            letterSpacing: '-0.025em', lineHeight: 1.15 }}>{title}</h1>
          {subtitle && <div style={{ fontSize: 13.5, color: t.textSecondary, marginTop: 4,
            letterSpacing: '-0.005em' }}>{subtitle}</div>}
        </div>
        {action}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCREEN 1 — TRANG CHỦ (Home / KPI Dashboard)
// ═══════════════════════════════════════════════════════════════
function MobileHome({ t, density }) {
  const monthTarget = 1416533;
  const monthActual = 642000;
  const pct = Math.round((monthActual / monthTarget) * 100);

  const kpis = [
    { label: 'Phân phối Green Farm', target: 40, actual: 28, unit: 'KH' },
    { label: 'Tăng trưởng Green Farm', target: 15178, actual: 9200, unit: 'k' },
    { label: 'Phân phối FM ít đường', target: 60, actual: 42, unit: 'KH' },
    { label: 'Tăng trưởng cốt D', target: 137350, actual: 89200, unit: 'k' },
  ];

  return (
    <PhoneShell t={t}>
      <div style={{ flex: 1, overflow: 'auto', paddingBottom: 12 }}>
        <MobileHeader
          eyebrow="VNM Sales · Tháng 5, 2026"
          title="Trang chủ"
          subtitle="Tổng quan hiệu suất tháng"
          t={t}
          action={
            <div style={{ width: 36, height: 36, borderRadius: 10, background: t.surface,
              border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: t.textSecondary, position: 'relative' }}>
              <Icon name="bell" size={17}/>
              <div style={{ position: 'absolute', top: 8, right: 8, width: 7, height: 7,
                borderRadius: 99, background: t.accent, border: `1.5px solid ${t.surface}` }}/>
            </div>
          }
        />

        {/* Hero KPI card */}
        <div style={{ padding: '0 20px 14px' }}>
          <div style={{
            background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14,
            padding: 18,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: t.textTertiary,
                textTransform: 'uppercase', letterSpacing: '.06em' }}>Doanh số tháng</div>
              <div style={{ fontSize: 11, color: t.textTertiary,
                fontVariantNumeric: 'tabular-nums' }}>{pct}% / mục tiêu</div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 600, color: t.text,
              letterSpacing: '-0.025em', marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
              642M<span style={{ color: t.textTertiary, fontWeight: 500, fontSize: 18 }}> / 1.41B ₫</span>
            </div>
            <div style={{ marginTop: 12 }}>
              <Progress value={pct} t={t} accent={t.accent}/>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 14, paddingTop: 14,
              borderTop: `1px solid ${t.borderSubtle}` }}>
              <div>
                <div style={{ fontSize: 11, color: t.textTertiary, fontWeight: 500,
                  textTransform: 'uppercase', letterSpacing: '.04em' }}>Đơn</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: t.text,
                  letterSpacing: '-0.02em', marginTop: 2 }}>34</div>
              </div>
              <div style={{ width: 1, background: t.borderSubtle }}/>
              <div>
                <div style={{ fontSize: 11, color: t.textTertiary, fontWeight: 500,
                  textTransform: 'uppercase', letterSpacing: '.04em' }}>KH active</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: t.text,
                  letterSpacing: '-0.02em', marginTop: 2 }}>57</div>
              </div>
              <div style={{ width: 1, background: t.borderSubtle }}/>
              <div>
                <div style={{ fontSize: 11, color: t.textTertiary, fontWeight: 500,
                  textTransform: 'uppercase', letterSpacing: '.04em' }}>ASO</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: t.text,
                  letterSpacing: '-0.02em', marginTop: 2 }}>0.0</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ padding: '0 20px 18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { icon: 'cart', label: 'Đặt hàng', desc: 'Tạo đơn mới' },
              { icon: 'users', label: 'Khách hàng', desc: '103 KH' },
              { icon: 'sparkle', label: 'AI gợi ý', desc: 'Hỏi AI' },
              { icon: 'list', label: 'Đơn hàng', desc: 'Lịch sử' },
            ].map(a => (
              <div key={a.label} style={{
                background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12,
                padding: 14,
              }}>
                <div style={{ width: 30, height: 30, borderRadius: 8,
                  background: t.accentSoft, color: t.accentText,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                  <Icon name={a.icon} size={16}/>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.text,
                  letterSpacing: '-0.01em' }}>{a.label}</div>
                <div style={{ fontSize: 11.5, color: t.textTertiary, marginTop: 1 }}>{a.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* KPI checklist */}
        <div style={{ padding: '0 20px 24px' }}>
          <SectionLabel t={t} action={
            <div style={{ fontSize: 12, color: t.accent, fontWeight: 500 }}>Xem hết</div>
          }>Mục tiêu trọng tâm</SectionLabel>
          <div style={{ background: t.surface, border: `1px solid ${t.border}`,
            borderRadius: 12, overflow: 'hidden' }}>
            {kpis.map((k, i) => {
              const p = Math.round((k.actual / k.target) * 100);
              return (
                <div key={k.label} style={{
                  padding: '14px 16px',
                  borderTop: i === 0 ? 'none' : `1px solid ${t.borderSubtle}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: t.text,
                      letterSpacing: '-0.01em' }}>{k.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 600,
                      color: p >= 80 ? t.successText : p >= 50 ? t.text : t.textTertiary,
                      fontVariantNumeric: 'tabular-nums' }}>{p}%</div>
                  </div>
                  <Progress value={p} t={t}
                    accent={p >= 80 ? t.success : p >= 50 ? t.accent : t.textTertiary}
                  />
                  <div style={{ fontSize: 11, color: t.textTertiary, marginTop: 6,
                    fontVariantNumeric: 'tabular-nums' }}>
                    {k.actual.toLocaleString()} / {k.target.toLocaleString()} {k.unit}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <MobileTabBar t={t} active="home"/>
    </PhoneShell>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCREEN 2 — ĐẶT HÀNG (Order)
// ═══════════════════════════════════════════════════════════════
function MobileOrder({ t, layoutVariant = 'default' }) {
  const cats = ['Tất cả', 'A·Bột', 'B·Đặc', 'C·Nước', 'D·Chua'];
  const products = [
    { code: '04EH31', name: 'Hero vị dâu 110ml', pack: '48/Chai', brand: 'Susu/Hero',
      tags: ['SCU Susu/Hero/Yomilk 80/110, 22+2', 'CK 2%'], starred: true,
      priceThung: 225504, priceLe: 4698, priceThungKM: 226387, priceLeKM: 4768 },
    { code: '04ED35', name: 'SDD ADM có đường 110ml', pack: '48/Hộp', brand: 'ADM',
      tags: ['ADM 110ml 12+1, 48+5, 192+24', 'ADM 110ml 48+5', 'Ontop SN 2M+2h/5M+8h Cascade'],
      starred: true, expanded: true,
      priceThung: 225504, priceLe: 4698, priceThungKM: 226387, priceLeKM: 4768,
      priceThungVAT: 228387, priceLeVAT: 4768 },
    { code: '04ED32', name: 'SDD không đường Vinamilk F220ml', pack: '40/Hộp', brand: 'Fino',
      tags: ['Fino 16+1', 'Ontop SN 2M+2h/5M+8h Cascade'],
      priceThung: 168000, priceLe: 4200 },
    { code: '04ED04', name: 'STTT có đường VNM 1L', pack: '12/Hộp', brand: 'STT 100%',
      tags: ['Đán Bồ 1L 12+1', 'CK 2%'],
      priceThung: 360000, priceLe: 30000 },
    { code: '04D33', name: 'STTT ít đường VNM 110ml', pack: '40/Hộp', brand: 'STT 100%',
      tags: ['Đán Bồ 110ml 12+1', 'Ontop SN 2M+2h/5M+8h Cascade'],
      priceThung: 168000, priceLe: 4200 },
    { code: '04N25', name: 'Sữa hạt 9 loại hạt VNM 180ml', pack: '24/Hộp', brand: 'SDN/Hạt',
      tags: ['STV Hạt 180ml 24+2', 'STV đơn 250k tặng 2h/400k tặng 4h 9 loại 180ml'],
      priceThung: 192000, priceLe: 8000 },
  ];

  return (
    <PhoneShell t={t}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <MobileHeader
          eyebrow="Bán hàng"
          title="Đặt hàng"
          t={t}
          action={
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, height: 32,
              padding: '0 12px', background: t.accent, color: '#fff',
              borderRadius: 8, fontSize: 12.5, fontWeight: 600,
            }}>
              <Icon name="cart" size={14}/>
              Giỏ · 3
            </div>
          }
        />

        {/* Customer picker */}
        <div style={{ padding: '0 20px 12px' }}>
          <div style={{
            background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12,
            padding: 14, display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 99,
              background: t.accentSoft, color: t.accentText, display: 'flex',
              alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="users" size={17}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: t.textTertiary, fontWeight: 500,
                textTransform: 'uppercase', letterSpacing: '.04em' }}>Khách hàng</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: t.text,
                letterSpacing: '-0.01em', marginTop: 1, overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Tạp hoá Minh Châu · Q.3
              </div>
            </div>
            <Icon name="chevronD" size={16} color={t.textTertiary}/>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: '0 20px 10px' }}>
          <SearchField placeholder="Tìm sản phẩm, mã SP…" t={t} height={40}/>
        </div>

        {/* Category tabs */}
        <div style={{ padding: '0 20px 10px', display: 'flex', gap: 6, overflow: 'auto' }}>
          {cats.map((c, i) => (
            <div key={c} style={{
              padding: '6px 12px', height: 30, display: 'inline-flex', alignItems: 'center',
              borderRadius: 99, fontSize: 12.5, fontWeight: 500, whiteSpace: 'nowrap',
              background: i === 0 ? t.text : t.surface,
              color: i === 0 ? t.textInverse : t.textSecondary,
              border: i === 0 ? 'none' : `1px solid ${t.border}`,
              letterSpacing: '-0.005em',
            }}>{c}</div>
          ))}
        </div>

        {/* Section label */}
        <div style={{ padding: '12px 20px 8px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 4, height: 14, borderRadius: 2, background: t.cat1 }}/>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.text,
              letterSpacing: '-0.01em' }}>Sữa bột</div>
            <span style={{ fontSize: 12, color: t.textTertiary,
              fontVariantNumeric: 'tabular-nums' }}>80</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4,
            color: t.textSecondary, fontSize: 12, fontWeight: 500 }}>
            <Icon name="filter" size={13}/>Lọc
          </div>
        </div>

        {/* Products list */}
        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {products.map((p, i) => (
            <div key={p.code} style={{
              background: t.surface, border: `1px solid ${p.expanded ? t.accent : t.border}`,
              borderRadius: 12, position: 'relative', overflow: 'hidden',
              boxShadow: p.expanded ? `0 0 0 3px ${t.accentSoft}` : 'none',
            }}>
              <div style={{ padding: 14, display: 'flex', justifyContent: 'space-between',
                alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <div style={{ fontSize: 10.5, fontFamily: 'ui-monospace, monospace',
                      color: t.textTertiary, letterSpacing: '.02em' }}>{p.code}</div>
                    <div style={{ width: 2, height: 2, borderRadius: 99, background: t.textTertiary, opacity: .5 }}/>
                    <div style={{ fontSize: 10.5, color: t.textTertiary }}>{p.pack}</div>
                    <div style={{ width: 2, height: 2, borderRadius: 99, background: t.textTertiary, opacity: .5 }}/>
                    <div style={{ fontSize: 10.5, color: t.textTertiary }}>{p.brand}</div>
                    {p.starred && <Icon name="star" size={11} color={t.warning}/>}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: t.text,
                    letterSpacing: '-0.01em', lineHeight: 1.3, textWrap: 'pretty' }}>
                    {p.name}
                  </div>
                  {p.tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                      {p.tags.slice(0, 2).map(tag => (
                        <Tag key={tag} t={t} color={t.accentText}>{tag}</Tag>
                      ))}
                      {p.tags.length > 2 && (
                        <span style={{ fontSize: 11, color: t.textTertiary, padding: '0 4px',
                          height: 20, display: 'inline-flex', alignItems: 'center' }}>
                          +{p.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: t.surfaceMuted,
                  border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: t.textSecondary, flexShrink: 0 }}>
                  <Icon name={p.expanded ? 'chevronU' : 'chevronD'} size={14}/>
                </div>
              </div>

              {/* Expanded price detail */}
              {p.expanded && (
                <div style={{ borderTop: `1px solid ${t.borderSubtle}`,
                  background: t.surfaceMuted }}>
                  {/* Price table */}
                  <div style={{ padding: '10px 14px 0' }}>
                    <div style={{
                      display: 'grid', gridTemplateColumns: '60px 1fr 1fr 1fr', gap: 8,
                      fontSize: 10, fontWeight: 600, color: t.textTertiary,
                      textTransform: 'uppercase', letterSpacing: '.05em',
                      paddingBottom: 6, borderBottom: `1px solid ${t.borderSubtle}`,
                    }}>
                      <div></div>
                      <div style={{ textAlign: 'right' }}>Gốc</div>
                      <div style={{ textAlign: 'right' }}>Sau KM</div>
                      <div style={{ textAlign: 'right', color: t.accentText }}>+ Thuế</div>
                    </div>
                    {[
                      { label: 'Thùng 48', g: 225504, k: '—', v: 228387 },
                      { label: 'Hộp', g: 4698, k: '—', v: 4768 },
                    ].map((r, idx) => (
                      <div key={idx} style={{
                        display: 'grid', gridTemplateColumns: '60px 1fr 1fr 1fr', gap: 8,
                        fontSize: 12, padding: '7px 0',
                        borderBottom: idx < 1 ? `1px solid ${t.borderSubtle}` : 'none',
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        <div style={{ color: t.textSecondary, fontWeight: 500 }}>{r.label}</div>
                        <div style={{ textAlign: 'right', color: t.text }}>
                          {typeof r.g === 'number' ? r.g.toLocaleString() + 'đ' : r.g}
                        </div>
                        <div style={{ textAlign: 'right', color: t.textTertiary }}>{r.k}</div>
                        <div style={{ textAlign: 'right', color: t.accentText, fontWeight: 600 }}>
                          {r.v.toLocaleString()}đ
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* CTKM tags */}
                  <div style={{ padding: '10px 14px', borderTop: `1px solid ${t.borderSubtle}` }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: t.textTertiary,
                      textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>
                      Khuyến mãi áp dụng
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {['ADM 110ml 12+1, 48+5, 192+24', 'ADM 110ml 48+5',
                        'ADM 110ml 192+24', 'Ontop SN 2M+2h/5M+8h Cascade'].map(tg => (
                        <Tag key={tg} t={t} color={t.accentText}>{tg}</Tag>
                      ))}
                      <Tag t={t} variant="outline">+7 CT</Tag>
                    </div>
                  </div>

                  {/* Loyalty notice */}
                  <div style={{ margin: '0 14px 10px', padding: '8px 10px',
                    background: t.warningSoft, color: t.warningText, borderRadius: 7,
                    fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon name="info" size={13}/>
                    Chọn khách hàng để xem thưởng tích lũy tháng
                  </div>

                  {/* Quantity inputs */}
                  <div style={{ padding: '0 14px 14px', display: 'grid',
                    gridTemplateColumns: '1fr 1fr 40px', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 10.5, fontWeight: 600, color: t.textTertiary,
                        textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>
                        Thùng
                      </div>
                      <div style={{ height: 38, background: t.surface,
                        border: `1px solid ${t.border}`, borderRadius: 8,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 600, color: t.text,
                        fontVariantNumeric: 'tabular-nums' }}>0</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10.5, fontWeight: 600, color: t.textTertiary,
                        textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>
                        Lẻ
                      </div>
                      <div style={{ height: 38, background: t.surface,
                        border: `1px solid ${t.border}`, borderRadius: 8,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 600, color: t.text,
                        fontVariantNumeric: 'tabular-nums' }}>0</div>
                    </div>
                    <div style={{ width: 40, height: 38, borderRadius: 8, background: t.accent,
                      color: '#fff', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', alignSelf: 'flex-end' }}>
                      <Icon name="plus" size={16}/>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <MobileTabBar t={t} active="order"/>
    </PhoneShell>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCREEN 3 — CÀI ĐẶT (Settings)
// ═══════════════════════════════════════════════════════════════
function MobileSettings({ t }) {
  const stats = [
    { label: 'Sản phẩm', value: '192', icon: 'package' },
    { label: 'CTKM', value: '336', icon: 'tag' },
    { label: 'Khách hàng', value: '103', icon: 'users' },
    { label: 'Đơn lưu', value: '0', icon: 'box' },
  ];

  return (
    <PhoneShell t={t}>
      <div style={{ flex: 1, overflow: 'auto', paddingBottom: 20 }}>
        <MobileHeader
          eyebrow="Quản trị dữ liệu"
          title="Cài đặt"
          subtitle="Vận hành và đồng bộ"
          t={t}
        />

        {/* Cloud sync card */}
        <div style={{ padding: '0 20px 14px' }}>
          <div style={{
            background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14,
            padding: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10,
                background: t.successSoft, color: t.successText,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="cloud" size={18}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.text,
                  letterSpacing: '-0.01em' }}>Cloud GitHub</div>
                <div style={{ fontSize: 12, color: t.textTertiary, marginTop: 1 }}>
                  Đồng bộ lúc 10:58 · Hôm nay
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5,
                height: 28, padding: '0 10px', background: t.successSoft,
                color: t.successText, borderRadius: 99, fontSize: 11.5, fontWeight: 600 }}>
                <div style={{ width: 6, height: 6, borderRadius: 99, background: t.success }}/>
                Đã kết nối
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <Button variant="primary" t={t} size="md" icon="sync" style={{ flex: 1 }}>
                Đồng bộ ngay
              </Button>
              <Button variant="secondary" t={t} size="md" icon="github">
                GitHub
              </Button>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ padding: '0 20px 18px' }}>
          <SectionLabel t={t}>Dữ liệu</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {stats.map(s => (
              <div key={s.label} style={{
                background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12,
                padding: 14,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Icon name={s.icon} size={14} color={t.textTertiary}/>
                  <div style={{ fontSize: 11, color: t.textTertiary, fontWeight: 500,
                    textTransform: 'uppercase', letterSpacing: '.04em' }}>{s.label}</div>
                </div>
                <div style={{ fontSize: 24, fontWeight: 600, color: t.text,
                  letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Settings list */}
        <div style={{ padding: '0 20px 18px' }}>
          <SectionLabel t={t}>Giao diện</SectionLabel>
          <div style={{ background: t.surface, border: `1px solid ${t.border}`,
            borderRadius: 12, overflow: 'hidden' }}>
            {[
              { icon: 'sun', title: 'Chế độ', value: 'Sáng', desc: 'Sáng / Tối' },
              { icon: 'tag', title: 'Chương trình KM', value: '336', desc: 'Quản lý CTKM' },
              { icon: 'pieChart', title: 'Quy tắc phân loại', value: '0 rule', desc: 'Phân loại tự động' },
              { icon: 'star', title: 'Trưng bày & Tích lũy', value: '12 KH', desc: 'CT trưng bày' },
            ].map((row, i, arr) => (
              <div key={row.title} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px',
                borderTop: i === 0 ? 'none' : `1px solid ${t.borderSubtle}`,
              }}>
                <div style={{ width: 32, height: 32, borderRadius: 8,
                  background: t.surfaceMuted, color: t.textSecondary,
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={row.icon} size={15}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: t.text,
                    letterSpacing: '-0.01em' }}>{row.title}</div>
                  <div style={{ fontSize: 11.5, color: t.textTertiary, marginTop: 1 }}>{row.desc}</div>
                </div>
                <div style={{ fontSize: 13, color: t.textTertiary,
                  fontVariantNumeric: 'tabular-nums' }}>{row.value}</div>
                <Icon name="chevronR" size={15} color={t.textTertiary}/>
              </div>
            ))}
          </div>
        </div>

        {/* Account */}
        <div style={{ padding: '0 20px 24px' }}>
          <SectionLabel t={t}>Tài khoản</SectionLabel>
          <div style={{ background: t.surface, border: `1px solid ${t.border}`,
            borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 14px', borderBottom: `1px solid ${t.borderSubtle}` }}>
              <div style={{ width: 38, height: 38, borderRadius: 99, background: t.accentSoft,
                color: t.accentText, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 14, fontWeight: 600 }}>NH</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.text,
                  letterSpacing: '-0.01em' }}>Nguyễn Hùng</div>
                <div style={{ fontSize: 11.5, color: t.textTertiary, marginTop: 1 }}>
                  SR · Khu vực Q.3 · Hồ Chí Minh
                </div>
              </div>
              <Icon name="chevronR" size={15} color={t.textTertiary}/>
            </div>
            <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
              color: t.danger }}>
              <Icon name="logout" size={15}/>
              <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.01em' }}>
                Đăng xuất
              </div>
            </div>
          </div>
        </div>
      </div>
      <MobileTabBar t={t} active="settings"/>
    </PhoneShell>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCREEN 4 — AI Assistant
// ═══════════════════════════════════════════════════════════════
function MobileAI({ t }) {
  const suggestions = [
    'Top 5 SP bán chạy tuần này',
    'KH chưa đặt hàng tháng này',
    'Gợi ý cross-sell cho Tạp hoá Minh Châu',
    'Tóm tắt hiệu suất tuần',
  ];

  return (
    <PhoneShell t={t}>
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <MobileHeader
          eyebrow="Trợ lý ảo"
          title="AI"
          subtitle="Gợi ý và phân tích thông minh"
          t={t}
        />

        {/* Hero greeting */}
        <div style={{ padding: '0 20px 16px' }}>
          <div style={{
            background: `linear-gradient(135deg, ${t.accentSoft}, ${t.surface})`,
            border: `1px solid ${t.border}`, borderRadius: 14, padding: 20,
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: t.accent,
              color: '#fff', display: 'flex', alignItems: 'center',
              justifyContent: 'center', marginBottom: 12 }}>
              <Icon name="sparkle" size={20}/>
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: t.text,
              letterSpacing: '-0.02em', lineHeight: 1.3 }}>
              Chào Hùng — tôi có thể giúp gì?
            </div>
            <div style={{ fontSize: 13, color: t.textSecondary, marginTop: 6,
              lineHeight: 1.5, letterSpacing: '-0.005em' }}>
              Hỏi về doanh số, KH, sản phẩm, KPI hoặc bất kỳ điều gì về dữ liệu của bạn.
            </div>
          </div>
        </div>

        {/* Suggestions */}
        <div style={{ padding: '0 20px 16px' }}>
          <SectionLabel t={t}>Gợi ý cho bạn</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {suggestions.map(s => (
              <div key={s} style={{
                background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10,
                padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <Icon name="sparkle" size={14} color={t.accent}/>
                <div style={{ flex: 1, fontSize: 13.5, color: t.text,
                  letterSpacing: '-0.005em' }}>{s}</div>
                <Icon name="arrowR" size={14} color={t.textTertiary}/>
              </div>
            ))}
          </div>
        </div>

        {/* Recent insights */}
        <div style={{ padding: '0 20px 24px' }}>
          <SectionLabel t={t}>Insight gần đây</SectionLabel>
          <div style={{ background: t.surface, border: `1px solid ${t.border}`,
            borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Icon name="trending" size={13} color={t.successText}/>
              <div style={{ fontSize: 11, fontWeight: 600, color: t.successText,
                textTransform: 'uppercase', letterSpacing: '.04em' }}>Tăng trưởng</div>
            </div>
            <div style={{ fontSize: 14, color: t.text, lineHeight: 1.5,
              letterSpacing: '-0.005em' }}>
              Green Farm đang tăng <b style={{ fontWeight: 600 }}>+24%</b> so với tuần trước. Hãy tập trung
              ưu tiên KH đã đặt &gt;3 lần liên tiếp.
            </div>
          </div>
        </div>
      </div>

      {/* Composer */}
      <div style={{ padding: '10px 16px 14px', borderTop: `1px solid ${t.border}`,
        background: t.surface }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, height: 44,
          background: t.surfaceMuted, borderRadius: 22, padding: '0 6px 0 16px',
          border: `1px solid ${t.borderSubtle}`,
        }}>
          <div style={{ flex: 1, fontSize: 13.5, color: t.textTertiary }}>
            Hỏi AI bất cứ điều gì…
          </div>
          <div style={{ width: 30, height: 30, borderRadius: 99, color: t.textSecondary,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="mic" size={16}/>
          </div>
          <div style={{ width: 32, height: 32, borderRadius: 99, background: t.accent,
            color: '#fff', display: 'flex', alignItems: 'center',
            justifyContent: 'center' }}>
            <Icon name="send" size={14}/>
          </div>
        </div>
      </div>
      <MobileTabBar t={t} active="ai"/>
    </PhoneShell>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCREEN 5 — Khách hàng (Customers)
// ═══════════════════════════════════════════════════════════════
function MobileCustomers({ t }) {
  const customers = [
    {
      name: 'Lê Thị Yến', shop: 'Yến Lực', code: 'DL004126Y',
      addr: 'chợ buôn lá, thôn 3 · 05/2026', ct: 2,
      tag: 'VIP', tagColor: 'warning',
      vnmShop: { tier: 'Nhóm C', apos: 'MR_VNM526_TL_7', muc: 'Mức 7 (CK 1.2%)',
        ds: '01-D2 0d · 0d2 0d · 0d3 0d · 04 0d', target: 5000000, actual: 0 },
      sbps: { name: 'SBPS · Sữa bột pha sẵn TE', apos: 'MR_SBPS26_T8 · TH_M5, MR_SBPS26_TL_7',
        thuong: 'TH-M5 (D5±5.500.000) · M7 (D5±5.500.000)',
        ds: 'N1 0d · N2 0d · N3 0d · Đơn 26 0d' },
    },
    { name: 'Nguyễn Sửu', shop: 'Tạp Hoá Hạnh sửu', code: 'DL004124H',
      addr: 'Thôn, 3 · 05/2026', ct: 3, tag: 'Active', tagColor: 'success' },
    { name: 'Trần Thị Hoa', shop: 'TH Hoa Chín', code: 'DL004126L',
      addr: '222, Hoà Phong · 05/2026', ct: 1, tag: 'Active', tagColor: 'success' },
    { name: 'Cửa hàng tạp hoá Thanh Cao', shop: '', code: 'DL004126D',
      addr: 'cách cở y 100m, thôn 1 · 05/2026', ct: 2, tag: 'Active', tagColor: 'success' },
    { name: 'Nguyễn Thị Bích Liễu', shop: 'TH Cô Liễu', code: 'DL004127T',
      addr: 'Thôn 9, Khuê Ngọc Điền · 05/2026', ct: 2, tag: 'Mới', tagColor: 'accent' },
  ];

  return (
    <PhoneShell t={t}>
      <div style={{ flex: 1, overflow: 'auto', paddingBottom: 12 }}>
        <MobileHeader
          eyebrow="Quản lý"
          title="Khách hàng"
          subtitle="Tuyến và độ phủ · Theo dõi tiến độ 05/2026"
          t={t}
          action={
            <div style={{ width: 36, height: 36, borderRadius: 10, background: t.accent,
              color: '#fff', display: 'flex', alignItems: 'center',
              justifyContent: 'center' }}>
              <Icon name="plus" size={18}/>
            </div>
          }
        />

        {/* Search + filters */}
        <div style={{ padding: '0 20px 10px' }}>
          <SearchField placeholder="Tìm khách hàng…" t={t} height={40}/>
        </div>
        <div style={{ padding: '0 20px 14px', display: 'flex', gap: 6, overflow: 'auto' }}>
          {['Tất cả · 103', 'Active · 57', 'Mới · 12', 'Cảnh báo · 8', 'VIP · 14'].map((c, i) => (
            <div key={c} style={{
              padding: '6px 12px', height: 30, display: 'inline-flex', alignItems: 'center',
              borderRadius: 99, fontSize: 12.5, fontWeight: 500, whiteSpace: 'nowrap',
              background: i === 0 ? t.text : t.surface,
              color: i === 0 ? t.textInverse : t.textSecondary,
              border: i === 0 ? 'none' : `1px solid ${t.border}`,
            }}>{c}</div>
          ))}
        </div>

        {/* Stats summary */}
        <div style={{ padding: '0 20px 12px' }}>
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12,
            padding: 12, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[
              { v: '103', l: 'Tổng KH' },
              { v: '30', l: 'VNM Shop' },
              { v: '17', l: 'VIP Shop' },
              { v: '20', l: 'SBPS' },
            ].map((s, i) => (
              <div key={s.l} style={{ textAlign: 'center',
                borderLeft: i === 0 ? 'none' : `1px solid ${t.borderSubtle}` }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: t.text,
                  letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{s.v}</div>
                <div style={{ fontSize: 10.5, color: t.textTertiary, fontWeight: 500,
                  textTransform: 'uppercase', letterSpacing: '.04em', marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer list */}
        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {customers.map((c, ci) => {
            const tagC = {
              success: { bg: t.successSoft, fg: t.successText },
              warning: { bg: t.warningSoft, fg: t.warningText },
              danger: { bg: t.dangerSoft, fg: t.dangerText },
              accent: { bg: t.accentSoft, fg: t.accentText },
            }[c.tagColor];
            const expanded = ci === 0;
            return (
              <div key={c.code} style={{
                background: t.surface,
                border: `1px solid ${expanded ? t.accent : t.border}`,
                borderRadius: 12, overflow: 'hidden',
                boxShadow: expanded ? `0 0 0 3px ${t.accentSoft}` : 'none',
              }}>
                {/* Header row */}
                <div style={{ padding: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10,
                    background: t.accentSoft, color: t.accentText, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 12,
                    fontWeight: 600, flexShrink: 0, letterSpacing: '-0.01em' }}>
                    {c.name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: t.text,
                        letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap', minWidth: 0 }}>
                        {c.name}{c.shop && <span style={{ color: t.textSecondary,
                          fontWeight: 500 }}> ({c.shop})</span>}
                      </div>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', height: 18, padding: '0 6px',
                        background: tagC.bg, color: tagC.fg, borderRadius: 4, fontSize: 10,
                        fontWeight: 600, flexShrink: 0,
                      }}>{c.tag}</span>
                    </div>
                    <div style={{ fontSize: 11, fontFamily: 'ui-monospace, monospace',
                      color: t.textTertiary, marginBottom: 2 }}>{c.code}</div>
                    <div style={{ fontSize: 11.5, color: t.textTertiary, overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.addr} · {c.ct} CT
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ height: 28, padding: '0 10px', borderRadius: 7,
                      background: t.surface, border: `1px solid ${t.border}`,
                      color: t.text, fontSize: 11.5, fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Icon name="edit" size={11}/>Nhập DS
                    </div>
                    <div style={{ width: 28, height: 28, borderRadius: 7,
                      background: t.surfaceMuted, color: t.textSecondary,
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="edit" size={13}/>
                    </div>
                  </div>
                </div>

                {/* Expanded — VNM Shop + SBPS */}
                {expanded && c.vnmShop && (
                  <div style={{ borderTop: `1px solid ${t.borderSubtle}`,
                    background: t.surfaceMuted, padding: 14 }}>
                    {/* VNM Shop block */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <div style={{ width: 5, height: 5, borderRadius: 99, background: t.cat1 }}/>
                      <div style={{ fontSize: 12, fontWeight: 700, color: t.text,
                        letterSpacing: '-0.005em' }}>VNM Shop · {c.vnmShop.tier}</div>
                    </div>
                    <div style={{ fontSize: 11.5, color: t.textSecondary, lineHeight: 1.6,
                      fontVariantNumeric: 'tabular-nums' }}>
                      <div>Mã apos: <span style={{ color: t.text, fontFamily: 'ui-monospace, monospace',
                        fontSize: 10.5 }}>{c.vnmShop.apos}</span></div>
                      <div>Tích lũy: <span style={{ color: t.text, fontWeight: 600 }}>{c.vnmShop.muc}</span></div>
                      <div>DS tháng đó: <span style={{ color: t.text }}>{c.vnmShop.ds}</span></div>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between',
                        fontSize: 11, marginBottom: 4 }}>
                        <span style={{ color: t.textTertiary, fontWeight: 600 }}>Tiến độ DS</span>
                        <span style={{ color: t.accentText, fontWeight: 600,
                          fontVariantNumeric: 'tabular-nums' }}>0 / 5.000.000 (0%)</span>
                      </div>
                      <Progress value={0} t={t}/>
                    </div>

                    {/* SBPS block */}
                    {c.sbps && (
                      <div style={{ marginTop: 12, padding: 12, background: t.warningSoft,
                        borderRadius: 8, borderLeft: `3px solid ${t.warning}` }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: t.warningText,
                          marginBottom: 4, letterSpacing: '-0.005em' }}>{c.sbps.name}</div>
                        <div style={{ fontSize: 11, color: t.textSecondary, lineHeight: 1.6 }}>
                          <div>Mã apos: <span style={{ fontFamily: 'ui-monospace, monospace',
                            fontSize: 10.5, color: t.text }}>{c.sbps.apos}</span></div>
                          <div>Thưởng tích lũy: <span style={{ color: t.text, fontWeight: 600 }}>
                            {c.sbps.thuong}</span></div>
                          <div>DS tháng đó: <span style={{ color: t.text,
                            fontVariantNumeric: 'tabular-nums' }}>{c.sbps.ds}</span></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <MobileTabBar t={t} active="customers"/>
    </PhoneShell>
  );
}

Object.assign(window, {
  PhoneShell, MobileTabBar, MobileHeader,
  MobileHome, MobileOrder, MobileSettings, MobileAI, MobileCustomers,
});
