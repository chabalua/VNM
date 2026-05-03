// desktop-screens.jsx — Desktop redesigned screens for VNM Sales App
// Renders inside browser frame. Clean, minimal, single accent.

const DT_W = 1280;
const DT_H = 820;

// ─── Browser-style chrome wrapper ────────────────────────────────
function DesktopShell({ t, children, route = 'home' }) {
  return (
    <div style={{
      width: DT_W, height: DT_H, borderRadius: 14, overflow: 'hidden',
      background: t.bg, position: 'relative',
      border: `1px solid ${t.borderStrong}`,
      boxShadow: '0 30px 80px rgba(0,0,0,.12)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'inherit',
    }}>
      {/* Top window bar */}
      <div style={{
        height: 38, background: t.surface, borderBottom: `1px solid ${t.border}`,
        display: 'flex', alignItems: 'center', padding: '0 14px', gap: 14,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['#FF5F57', '#FEBC2E', '#28C840'].map(c => (
            <div key={c} style={{ width: 11, height: 11, borderRadius: 99, background: c }}/>
          ))}
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{
            background: t.surfaceMuted, borderRadius: 6, height: 24, width: 320,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 6, fontSize: 11.5, color: t.textTertiary, fontWeight: 500,
            letterSpacing: '-0.005em', border: `1px solid ${t.borderSubtle}`,
          }}>
            <Icon name="dot" size={10} color={t.success}/>
            vnm.sales/app
          </div>
        </div>
      </div>

      {/* Main layout: sidebar + content */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <DesktopSidebar t={t} route={route}/>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0,
          background: t.bg }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function DesktopSidebar({ t, route }) {
  const sections = [
    { label: 'Bán hàng', items: [
      { id: 'home', icon: 'home', label: 'Trang chủ' },
      { id: 'order', icon: 'cart', label: 'Đặt hàng', badge: '3' },
      { id: 'orders', icon: 'list', label: 'Đơn hàng' },
      { id: 'customers', icon: 'users', label: 'Khách hàng' },
    ]},
    { label: 'Trợ lý', items: [
      { id: 'ai', icon: 'sparkle', label: 'AI gợi ý', badge: 'new' },
      { id: 'insight', icon: 'trending', label: 'Phân tích' },
    ]},
    { label: 'Hệ thống', items: [
      { id: 'settings', icon: 'settings', label: 'Cài đặt' },
      { id: 'sync', icon: 'cloud', label: 'Đồng bộ' },
    ]},
  ];

  return (
    <div style={{
      width: 232, flexShrink: 0, borderRight: `1px solid ${t.border}`,
      background: t.surface, display: 'flex', flexDirection: 'column',
    }}>
      {/* Brand */}
      <div style={{ padding: '18px 16px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, background: t.accent,
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 14, letterSpacing: '-0.02em',
        }}>V</div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: t.text,
            letterSpacing: '-0.01em', lineHeight: 1.1 }}>VNM Sales</div>
          <div style={{ fontSize: 11, color: t.textTertiary, marginTop: 1 }}>Sales rep</div>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '0 12px 12px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7, height: 30,
          background: t.surfaceMuted, borderRadius: 7, padding: '0 9px',
          border: `1px solid ${t.borderSubtle}`,
        }}>
          <Icon name="search" size={13} color={t.textTertiary}/>
          <div style={{ flex: 1, fontSize: 12, color: t.textTertiary }}>Tìm…</div>
          <div style={{
            padding: '1px 5px', borderRadius: 3.5, background: t.surface,
            border: `1px solid ${t.borderSubtle}`, fontSize: 10, color: t.textTertiary,
            fontFamily: 'ui-monospace, monospace',
          }}>⌘K</div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
        {sections.map((sec, si) => (
          <div key={sec.label} style={{ marginBottom: 14 }}>
            <div style={{
              fontSize: 10.5, fontWeight: 600, color: t.textTertiary,
              textTransform: 'uppercase', letterSpacing: '.06em',
              padding: '6px 8px 4px',
            }}>{sec.label}</div>
            {sec.items.map(item => {
              const active = item.id === route;
              return (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, height: 32,
                  padding: '0 8px', borderRadius: 7, marginBottom: 1,
                  background: active ? t.accentSoft : 'transparent',
                  color: active ? t.accentText : t.textSecondary,
                  fontSize: 13, fontWeight: active ? 600 : 500, letterSpacing: '-0.005em',
                }}>
                  <Icon name={item.icon} size={15} strokeWidth={active ? 2 : 1.7}/>
                  <div style={{ flex: 1, minWidth: 0, overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</div>
                  {item.badge && (
                    <div style={{
                      minWidth: 18, height: 18, borderRadius: 99, padding: '0 6px',
                      background: item.badge === 'new' ? t.accent : t.surface,
                      color: item.badge === 'new' ? '#fff' : t.textSecondary,
                      border: item.badge === 'new' ? 'none' : `1px solid ${t.border}`,
                      fontSize: 10, fontWeight: 600, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}>{item.badge}</div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer — user */}
      <div style={{ padding: 10, borderTop: `1px solid ${t.borderSubtle}` }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 9, padding: 6,
          borderRadius: 7,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 99, background: t.accentSoft,
            color: t.accentText, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 11, fontWeight: 600,
          }}>NH</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: t.text,
              letterSpacing: '-0.005em', overflow: 'hidden', textOverflow: 'ellipsis',
              whiteSpace: 'nowrap' }}>Nguyễn Hùng</div>
            <div style={{ fontSize: 10.5, color: t.textTertiary, overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>SR · Q.3 HCM</div>
          </div>
          <Icon name="chevronR" size={13} color={t.textTertiary}/>
        </div>
      </div>
    </div>
  );
}

// ─── Page header ────────────────────────────────────────────────
function DesktopPageHeader({ eyebrow, title, subtitle, actions, t }) {
  return (
    <div style={{
      padding: '20px 32px 18px', borderBottom: `1px solid ${t.border}`, background: t.bg,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', gap: 16 }}>
        <div>
          {eyebrow && (
            <div style={{ fontSize: 11.5, color: t.textTertiary, fontWeight: 500,
              letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 4 }}>
              {eyebrow}
            </div>
          )}
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: t.text,
            letterSpacing: '-0.02em', lineHeight: 1.2 }}>{title}</h1>
          {subtitle && <div style={{ fontSize: 13, color: t.textSecondary, marginTop: 4,
            letterSpacing: '-0.005em' }}>{subtitle}</div>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>{actions}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DESKTOP — Trang chủ (Home / KPI Dashboard)
// ═══════════════════════════════════════════════════════════════
function DesktopHome({ t }) {
  const kpis = [
    { label: 'Doanh số tổng', target: 1416533, actual: 642000, fmt: 'currency', cat: t.cat1, hot: true },
    { label: 'Phân phối Green Farm', target: 40, actual: 28, fmt: 'count', cat: t.cat3 },
    { label: 'Tăng trưởng Green Farm', target: 15178, actual: 9200, fmt: 'k', cat: t.cat3 },
    { label: 'Phân phối FM ít đường', target: 60, actual: 42, fmt: 'count', cat: t.cat2 },
    { label: 'Tăng trưởng FM', target: 227011, actual: 142000, fmt: 'k', cat: t.cat2 },
    { label: 'Tăng trưởng cốt D', target: 137350, actual: 89200, fmt: 'k', cat: t.cat4 },
    { label: 'Bình quân SKUs/ASO', target: 10, actual: 6.2, fmt: 'num', cat: t.cat5 },
    { label: 'Tỷ lệ KH phát sinh DS', target: 54, actual: 38, fmt: 'pct', cat: t.cat3 },
  ];

  const fmt = (k) => {
    const f = k.fmt;
    if (f === 'currency') return (k.actual / 1e6).toFixed(0) + 'M / ' + (k.target / 1e6).toFixed(1) + 'B ₫';
    if (f === 'k') return (k.actual / 1000).toFixed(1) + 'k / ' + (k.target / 1000).toFixed(0) + 'k';
    if (f === 'pct') return k.actual + '% / ' + k.target + '%';
    if (f === 'num') return k.actual + ' / ' + k.target;
    return k.actual + ' / ' + k.target;
  };

  return (
    <DesktopShell t={t} route="home">
      <DesktopPageHeader t={t} eyebrow="Tháng 5, 2026"
        title="Trang chủ"
        subtitle="Tổng quan hiệu suất, KPI và đồng bộ dữ liệu"
        actions={[
          <Button key="d" t={t} icon="calendar" variant="secondary">Tháng 5, 2026</Button>,
          <Button key="s" t={t} icon="sync" variant="secondary">Đồng bộ</Button>,
          <Button key="e" t={t} icon="plus" variant="primary">Đơn mới</Button>,
        ]}
      />

      <div style={{ flex: 1, overflow: 'auto', padding: 28 }}>
        {/* Top KPI tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14,
          marginBottom: 24 }}>
          <StatTile t={t} label="Doanh số tháng" value="642M ₫" change={12}
            icon="dollar" accent={t.accent}/>
          <StatTile t={t} label="Đơn trong tháng" value="34" change={8}
            icon="cart" accent={t.cat3}/>
          <StatTile t={t} label="KH active" value="57" change={-3}
            icon="users" accent={t.cat2}/>
          <StatTile t={t} label="Bình quân ASO" value="0.0" change={0}
            icon="target" accent={t.cat5}/>
        </div>

        {/* Two-column: KPI table + sidebar info */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          {/* KPI table */}
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12,
            overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${t.borderSubtle}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.text,
                  letterSpacing: '-0.01em' }}>Mục tiêu KPI</div>
                <div style={{ fontSize: 12, color: t.textTertiary, marginTop: 1 }}>
                  Tháng 5, 2026 · 8 chỉ tiêu trọng tâm
                </div>
              </div>
              <Button t={t} variant="ghost" size="sm">Xem hết</Button>
            </div>

            {/* Table header */}
            <div style={{ display: 'grid',
              gridTemplateColumns: '1fr 130px 130px 80px',
              gap: 14, padding: '8px 18px', borderBottom: `1px solid ${t.borderSubtle}`,
              fontSize: 11, fontWeight: 600, color: t.textTertiary,
              textTransform: 'uppercase', letterSpacing: '.05em' }}>
              <div>Chỉ tiêu</div>
              <div>Mục tiêu</div>
              <div>Thực hiện</div>
              <div style={{ textAlign: 'right' }}>%</div>
            </div>

            {/* Rows */}
            {kpis.map((k, i) => {
              const p = Math.min(100, Math.round((k.actual / k.target) * 100));
              return (
                <div key={k.label} style={{
                  display: 'grid', gridTemplateColumns: '1fr 130px 130px 80px',
                  gap: 14, padding: '12px 18px', alignItems: 'center',
                  borderTop: i === 0 ? 'none' : `1px solid ${t.borderSubtle}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{ width: 3, height: 16, borderRadius: 2, background: k.cat,
                      flexShrink: 0 }}/>
                    <div style={{ fontSize: 13, fontWeight: 500, color: t.text,
                      letterSpacing: '-0.005em', overflow: 'hidden', textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap' }}>{k.label}</div>
                    {k.hot && <Tag t={t} color={t.warningText}>Quan trọng</Tag>}
                  </div>
                  <div style={{ fontSize: 12.5, color: t.textSecondary,
                    fontVariantNumeric: 'tabular-nums' }}>
                    {k.target.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 12.5, color: t.text, fontWeight: 500,
                    fontVariantNumeric: 'tabular-nums' }}>
                    {k.actual.toLocaleString()}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8,
                    justifyContent: 'flex-end' }}>
                    <div style={{ width: 60 }}>
                      <Progress value={p} t={t}
                        accent={p >= 80 ? t.success : p >= 50 ? k.cat : t.textTertiary}/>
                    </div>
                    <div style={{ minWidth: 32, textAlign: 'right', fontSize: 12,
                      fontWeight: 600,
                      color: p >= 80 ? t.successText : p >= 50 ? t.text : t.textTertiary,
                      fontVariantNumeric: 'tabular-nums' }}>{p}%</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Cloud status */}
            <div style={{ background: t.surface, border: `1px solid ${t.border}`,
              borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8,
                  background: t.successSoft, color: t.successText,
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="cloud" size={16}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: t.text,
                    letterSpacing: '-0.005em' }}>Cloud GitHub</div>
                  <div style={{ fontSize: 11, color: t.textTertiary }}>Đã đồng bộ · 10:58</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
                marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 10.5, color: t.textTertiary, fontWeight: 600,
                    letterSpacing: '.04em', textTransform: 'uppercase' }}>Push</div>
                  <div style={{ fontSize: 12, color: t.text, marginTop: 2,
                    fontVariantNumeric: 'tabular-nums' }}>08:10 · 3/5</div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: t.textTertiary, fontWeight: 600,
                    letterSpacing: '.04em', textTransform: 'uppercase' }}>Pull</div>
                  <div style={{ fontSize: 12, color: t.text, marginTop: 2,
                    fontVariantNumeric: 'tabular-nums' }}>10:58 · 3/5</div>
                </div>
              </div>
              <Button t={t} variant="primary" size="sm" icon="sync"
                style={{ width: '100%' }}>Đồng bộ ngay</Button>
            </div>

            {/* Quick navigation */}
            <div style={{ background: t.surface, border: `1px solid ${t.border}`,
              borderRadius: 12, padding: 4 }}>
              <div style={{ padding: '10px 12px 6px', fontSize: 11, fontWeight: 600,
                color: t.textTertiary, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                Điều hướng nhanh
              </div>
              {[
                { icon: 'cart', label: 'Đặt hàng', kbd: 'O' },
                { icon: 'users', label: 'Khách hàng', kbd: 'C' },
                { icon: 'list', label: 'Đơn hàng', kbd: 'L' },
                { icon: 'settings', label: 'Cài đặt', kbd: ',' },
              ].map(n => (
                <div key={n.label} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                  borderRadius: 7,
                }}>
                  <div style={{ width: 26, height: 26, borderRadius: 6,
                    background: t.surfaceMuted, color: t.textSecondary, display: 'flex',
                    alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={n.icon} size={13}/>
                  </div>
                  <div style={{ flex: 1, fontSize: 13, color: t.text, fontWeight: 500,
                    letterSpacing: '-0.005em' }}>{n.label}</div>
                  <div style={{ padding: '1px 6px', borderRadius: 4,
                    background: t.surfaceMuted, fontSize: 10.5, color: t.textTertiary,
                    fontFamily: 'ui-monospace, monospace', border: `1px solid ${t.borderSubtle}` }}>
                    G {n.kbd}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DesktopShell>
  );
}

// ═══════════════════════════════════════════════════════════════
// DESKTOP — Đặt hàng (Order)
// ═══════════════════════════════════════════════════════════════
function DesktopOrder({ t }) {
  const cats = ['Tất cả · 192', 'A·Bột · 80', 'B·Đặc · 24', 'C·Nước · 56', 'D·Chua · 32'];
  const products = [
    { code: '02HL37', name: 'Dielac Grow Plus 110ml', pack: '48/Hộp', brand: 'Grow Plus',
      price: 14500, qty: 2, tags: ['KD SBPS 48+2', 'CK 3%'], starred: true },
    { code: '02IO38', name: 'Optimum Gold 110ml', pack: '48/Hộp', brand: 'Optimum',
      price: 18200, qty: 0, tags: ['TT tăng 8%', 'CK 3%'], starred: true },
    { code: '03A039', name: 'Bột AD Optimum Gold Yến Mạch Cá Hồi 350g', pack: '24/Lon',
      brand: 'Optimum', price: 165000, qty: 0, tags: [] },
    { code: '03CM06', name: 'Bột AD Ridielac 4 gói vị mặn 4×50g', pack: '24/Hộp',
      brand: 'Dielac Gold', price: 32000, qty: 1, tags: ['BĐD Mua 2 hộp CK 3%'] },
    { code: '03CM20', name: 'Bột AD Ridielac 4 gói vị ngọt 4×50g', pack: '24/16sp',
      brand: 'Dielac Gold', price: 32000, qty: 0, tags: ['BĐD Mua 2 hộp CK 3%'] },
    { code: '03CA15', name: 'Bột AD Ridielac bò củ HG 200g', pack: '24/Hộp',
      brand: 'Dielac Gold', price: 28000, qty: 0, tags: ['BĐD Mua 2 hộp CK 3%'] },
    { code: '03A011', name: 'Bột AD Ridielac bò củ HT 350g', pack: '24/Lon',
      brand: 'Dielac Gold', price: 142000, qty: 0, tags: ['BĐD Mua 2 hộp CK 3%'] },
    { code: '03CA82', name: 'Bột AD Ridielac cá hồi bông cải xanh HG 200g', pack: '24/Hộp',
      brand: 'Dielac Gold', price: 28000, qty: 0, tags: [] },
  ];

  return (
    <DesktopShell t={t} route="order">
      <DesktopPageHeader t={t} eyebrow="Bán hàng"
        title="Đặt hàng"
        subtitle="Tạo đơn hàng cho khách"
        actions={[
          <Button key="d" t={t} icon="save" variant="secondary">Lưu nháp</Button>,
          <Button key="e" t={t} icon="check" variant="primary">Xem đơn (3)</Button>,
        ]}
      />

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Main: products list */}
        <div style={{ flex: 1, overflow: 'auto', padding: 28, minWidth: 0 }}>
          {/* Customer + search bar */}
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12,
            padding: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingRight: 12,
              borderRight: `1px solid ${t.borderSubtle}` }}>
              <div style={{ width: 30, height: 30, borderRadius: 99,
                background: t.accentSoft, color: t.accentText, display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>
                MC
              </div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: t.text,
                  letterSpacing: '-0.005em' }}>Tạp hoá Minh Châu</div>
                <div style={{ fontSize: 11, color: t.textTertiary }}>VIP · Q.3 HCM</div>
              </div>
              <Icon name="chevronD" size={14} color={t.textTertiary}/>
            </div>
            <div style={{ flex: 1 }}>
              <SearchField t={t} placeholder="Tìm sản phẩm, mã SP, brand…" height={32}/>
            </div>
            <Button t={t} variant="secondary" size="md" icon="filter">Lọc</Button>
          </div>

          {/* Categories */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
            {cats.map((c, i) => (
              <div key={c} style={{
                padding: '6px 12px', height: 30, display: 'inline-flex', alignItems: 'center',
                borderRadius: 99, fontSize: 12.5, fontWeight: 500,
                background: i === 0 ? t.text : t.surface,
                color: i === 0 ? t.textInverse : t.textSecondary,
                border: i === 0 ? 'none' : `1px solid ${t.border}`,
                letterSpacing: '-0.005em',
              }}>{c}</div>
            ))}
          </div>

          {/* Products section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 4, height: 16, borderRadius: 2, background: t.cat1 }}/>
            <div style={{ fontSize: 14, fontWeight: 600, color: t.text,
              letterSpacing: '-0.01em' }}>Sữa bột</div>
            <span style={{ fontSize: 12.5, color: t.textTertiary,
              fontVariantNumeric: 'tabular-nums' }}>80 sản phẩm</span>
          </div>

          {/* Products as table-like list */}
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12,
            overflow: 'hidden' }}>
            {/* Header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '90px 1fr 110px 110px 140px',
              gap: 16, padding: '10px 16px', borderBottom: `1px solid ${t.borderSubtle}`,
              fontSize: 11, fontWeight: 600, color: t.textTertiary,
              textTransform: 'uppercase', letterSpacing: '.05em', background: t.surfaceMuted,
            }}>
              <div>Mã</div>
              <div>Sản phẩm</div>
              <div>Quy cách</div>
              <div style={{ textAlign: 'right' }}>Giá</div>
              <div style={{ textAlign: 'center' }}>Số lượng</div>
            </div>
            {products.map((p, i) => (
              <div key={p.code} style={{
                display: 'grid', gridTemplateColumns: '90px 1fr 110px 110px 140px',
                gap: 16, padding: '14px 16px', alignItems: 'center',
                borderTop: i === 0 ? 'none' : `1px solid ${t.borderSubtle}`,
                background: p.qty > 0 ? t.accentSoft + '40' : 'transparent',
              }}>
                <div style={{ fontSize: 11.5, fontFamily: 'ui-monospace, monospace',
                  color: t.textSecondary, letterSpacing: '.02em' }}>{p.code}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: t.text,
                      letterSpacing: '-0.005em', overflow: 'hidden', textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap' }}>{p.name}</div>
                    {p.starred && <Icon name="star" size={11} color={t.warning}/>}
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <Tag t={t} variant="outline">{p.brand}</Tag>
                    {p.tags.slice(0, 2).map(tg => (
                      <Tag key={tg} t={t} color={t.accentText}>{tg}</Tag>
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: 12.5, color: t.textSecondary }}>{p.pack}</div>
                <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 500, color: t.text,
                  fontVariantNumeric: 'tabular-nums' }}>
                  {p.price.toLocaleString()}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  {p.qty > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4,
                      background: t.surface, border: `1px solid ${t.border}`,
                      borderRadius: 8, padding: 2, height: 30 }}>
                      <div style={{ width: 24, height: 24, borderRadius: 6,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: t.textSecondary }}>
                        <Icon name="minus" size={13}/>
                      </div>
                      <div style={{ minWidth: 24, textAlign: 'center', fontSize: 13,
                        fontWeight: 600, color: t.text,
                        fontVariantNumeric: 'tabular-nums' }}>{p.qty}</div>
                      <div style={{ width: 24, height: 24, borderRadius: 6, background: t.accent,
                        color: '#fff', display: 'flex', alignItems: 'center',
                        justifyContent: 'center' }}>
                        <Icon name="plus" size={13}/>
                      </div>
                    </div>
                  ) : (
                    <Button t={t} variant="secondary" size="sm" icon="plus">Thêm</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: cart summary */}
        <div style={{ width: 320, flexShrink: 0, borderLeft: `1px solid ${t.border}`,
          background: t.surface, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '18px 20px', borderBottom: `1px solid ${t.borderSubtle}` }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: t.text,
              letterSpacing: '-0.01em' }}>Giỏ hàng</div>
            <div style={{ fontSize: 12, color: t.textTertiary, marginTop: 2 }}>3 sản phẩm</div>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '6px 0' }}>
            {[
              { name: 'Dielac Grow Plus 110ml', qty: 2, price: 14500 },
              { name: 'Bột AD Ridielac 4 gói vị mặn 4×50g', qty: 1, price: 32000 },
              { name: 'Bột AD Ridielac bò củ HT 350g', qty: 1, price: 142000 },
            ].map((c, i) => (
              <div key={i} style={{
                padding: '12px 20px',
                borderTop: i === 0 ? 'none' : `1px solid ${t.borderSubtle}`,
              }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: t.text,
                  letterSpacing: '-0.005em', lineHeight: 1.35, marginBottom: 6,
                  textWrap: 'pretty' }}>{c.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center' }}>
                  <div style={{ fontSize: 12, color: t.textTertiary,
                    fontVariantNumeric: 'tabular-nums' }}>
                    {c.qty} × {c.price.toLocaleString()} ₫
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: t.text,
                    fontVariantNumeric: 'tabular-nums' }}>
                    {(c.qty * c.price).toLocaleString()} ₫
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: '16px 20px', borderTop: `1px solid ${t.borderSubtle}`,
            display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5,
              color: t.textSecondary }}>
              <span>Tạm tính</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>203.000 ₫</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5,
              color: t.successText }}>
              <span>Khuyến mãi</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>−6.090 ₫</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between',
              alignItems: 'baseline', marginTop: 6, paddingTop: 10,
              borderTop: `1px solid ${t.borderSubtle}` }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: t.text }}>Tổng</span>
              <span style={{ fontSize: 19, fontWeight: 600, color: t.text,
                letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                196.910 ₫
              </span>
            </div>
            <Button t={t} variant="primary" size="lg" icon="check"
              style={{ width: '100%', marginTop: 10 }}>
              Xác nhận đơn hàng
            </Button>
          </div>
        </div>
      </div>
    </DesktopShell>
  );
}

// ═══════════════════════════════════════════════════════════════
// DESKTOP — Cài đặt
// ═══════════════════════════════════════════════════════════════
function DesktopSettings({ t }) {
  const stats = [
    { label: 'Sản phẩm', value: '192', icon: 'package', acc: t.cat1 },
    { label: 'CTKM', value: '336', icon: 'tag', acc: t.cat3 },
    { label: 'Khách hàng', value: '103', icon: 'users', acc: t.cat2 },
    { label: 'Rule phân loại', value: '0', icon: 'pieChart', acc: t.cat4 },
    { label: 'Đơn đã lưu', value: '0', icon: 'box', acc: t.cat5 },
  ];

  return (
    <DesktopShell t={t} route="settings">
      <DesktopPageHeader t={t} eyebrow="Quản trị dữ liệu"
        title="Cài đặt và vận hành"
        subtitle="Đồng bộ, phân loại, và cấu hình hệ thống"
        actions={[
          <Button key="s" t={t} icon="sync" variant="primary">Đồng bộ</Button>,
        ]}
      />
      <div style={{ flex: 1, overflow: 'auto', padding: 28 }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12,
          marginBottom: 24 }}>
          {stats.map(s => (
            <div key={s.label} style={{
              background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12,
              padding: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: s.acc + '14',
                  color: s.acc, display: 'flex', alignItems: 'center',
                  justifyContent: 'center' }}>
                  <Icon name={s.icon} size={13}/>
                </div>
                <div style={{ fontSize: 11, color: t.textTertiary, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '.04em' }}>{s.label}</div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 600, color: t.text,
                letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Cloud + theme */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
          <div style={{ background: t.surface, border: `1px solid ${t.border}`,
            borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8,
                background: t.successSoft, color: t.successText,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="cloud" size={17}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.text,
                  letterSpacing: '-0.01em' }}>Cloud GitHub</div>
                <div style={{ fontSize: 12, color: t.textTertiary, marginTop: 1 }}>
                  Push 08:10 · Pull 10:58 · 3/5/2026
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5,
                height: 26, padding: '0 9px', background: t.successSoft,
                color: t.successText, borderRadius: 99, fontSize: 11, fontWeight: 600 }}>
                <div style={{ width: 6, height: 6, borderRadius: 99, background: t.success }}/>
                Đã kết nối
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button t={t} variant="primary" size="md" icon="sync">Đồng bộ ngay</Button>
              <Button t={t} variant="secondary" size="md" icon="upload">Push</Button>
              <Button t={t} variant="secondary" size="md" icon="download">Pull</Button>
              <Button t={t} variant="secondary" size="md" icon="github">Token</Button>
            </div>
          </div>

          <div style={{ background: t.surface, border: `1px solid ${t.border}`,
            borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.text,
              letterSpacing: '-0.01em', marginBottom: 4 }}>Giao diện</div>
            <div style={{ fontSize: 12, color: t.textTertiary, marginBottom: 14 }}>
              Sáng / tối
            </div>
            <div style={{ display: 'flex', gap: 6, padding: 3, background: t.surfaceMuted,
              borderRadius: 8, border: `1px solid ${t.borderSubtle}` }}>
              <div style={{ flex: 1, height: 30, borderRadius: 6,
                background: !t.dark ? t.surface : 'transparent',
                border: !t.dark ? `1px solid ${t.border}` : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontSize: 12.5, fontWeight: 500,
                color: !t.dark ? t.text : t.textTertiary }}>
                <Icon name="sun" size={14}/>Sáng
              </div>
              <div style={{ flex: 1, height: 30, borderRadius: 6,
                background: t.dark ? t.surface : 'transparent',
                border: t.dark ? `1px solid ${t.border}` : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontSize: 12.5, fontWeight: 500,
                color: t.dark ? t.text : t.textTertiary }}>
                <Icon name="moon" size={14}/>Tối
              </div>
            </div>
          </div>
        </div>

        {/* Module cards */}
        <SectionLabel t={t}>Quản lý hệ thống</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {[
            { icon: 'tag', title: 'Chương trình KM', desc: 'Xem và chỉnh CTKM',
              count: '336 chương trình', acc: t.cat3 },
            { icon: 'pieChart', title: 'Quy tắc phân loại',
              desc: 'Cấu hình cách nhận diện Green Farm, Ông Thọ, NSPN…',
              count: '0 rule', acc: t.cat4 },
            { icon: 'star', title: 'Trưng bày & Tích lũy',
              desc: 'Chính sách DS min, chiết khấu, thưởng VNM Shop',
              count: '12 KH', acc: t.cat5 },
            { icon: 'package', title: 'Quản lý sản phẩm',
              desc: 'Danh mục bán hàng, giá bán, tag CTKM',
              count: '192 SP', acc: t.cat1 },
            { icon: 'users', title: 'Khách hàng',
              desc: 'Profile, phân tuyến, hợp đồng',
              count: '103 KH', acc: t.cat2 },
            { icon: 'cloud', title: 'Backup & Restore',
              desc: 'Token, lịch sử backup, restore',
              count: 'Hôm nay', acc: t.cat3 },
          ].map(m => (
            <div key={m.title} style={{
              background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12,
              padding: 18, display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: m.acc + '14',
                  color: m.acc, display: 'flex', alignItems: 'center',
                  justifyContent: 'center' }}>
                  <Icon name={m.icon} size={15}/>
                </div>
                <div style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: t.text,
                  letterSpacing: '-0.005em' }}>{m.title}</div>
                <Icon name="chevronR" size={14} color={t.textTertiary}/>
              </div>
              <div style={{ fontSize: 12, color: t.textSecondary, lineHeight: 1.45,
                letterSpacing: '-0.005em', textWrap: 'pretty' }}>{m.desc}</div>
              <div style={{ fontSize: 11.5, color: t.textTertiary, marginTop: 6,
                fontWeight: 500 }}>{m.count}</div>
            </div>
          ))}
        </div>
      </div>
    </DesktopShell>
  );
}

Object.assign(window, {
  DesktopShell, DesktopSidebar, DesktopPageHeader,
  DesktopHome, DesktopOrder, DesktopSettings,
});
