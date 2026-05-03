// desktop-screens-2.jsx — Additional desktop screens
// Customers + CTKM (promotions) + expanded product price detail

// ═══════════════════════════════════════════════════════════════
// DESKTOP — Khách hàng (Customers)
// ═══════════════════════════════════════════════════════════════
function DesktopCustomers({ t }) {
  const customers = [
    {
      name: 'Lê Thị Yến', shop: 'Yến Lực', code: 'DL004126Y',
      addr: 'chợ buôn lá, thôn 3', area: 'Hoà Phong', ct: 2,
      tag: 'VIP Shop', tagColor: 'warning',
      vnmShop: { tier: 'Nhóm C', apos: 'MR_VNM526_TL_7', muc: 'Mức 7 (CK 1.2%)',
        target: 5000000, actual: 0 },
      sbps: { tier: 'TH-M5', muc: 'Mức 7', target: 5500000 },
      lastOrder: '2 ngày', amount: '4.2M',
    },
    { name: 'Nguyễn Sửu', shop: 'Tạp Hoá Hạnh sửu', code: 'DL004124H',
      addr: 'Thôn 3', area: 'Hoà Phong', ct: 3, tag: 'Active', tagColor: 'success',
      lastOrder: 'Hôm nay', amount: '1.8M' },
    { name: 'Trần Thị Hoa', shop: 'TH Hoa Chín', code: 'DL004126L',
      addr: '222 Hoà Phong', area: 'Hoà Phong', ct: 1, tag: 'Active', tagColor: 'success',
      lastOrder: '1 ngày', amount: '720k' },
    { name: 'Cửa hàng Thanh Cao', shop: '', code: 'DL004126D',
      addr: 'cách cở y 100m, thôn 1', area: 'Krông Bông', ct: 2, tag: 'Active', tagColor: 'success',
      lastOrder: '3 ngày', amount: '2.1M' },
    { name: 'Nguyễn Thị Bích Liễu', shop: 'TH Cô Liễu', code: 'DL004127T',
      addr: 'Thôn 9, Khuê Ngọc Điền', area: 'Krông Bông', ct: 2, tag: 'Mới', tagColor: 'accent',
      lastOrder: '5 ngày', amount: '320k' },
    { name: 'Trần Thanh Vân', shop: 'Tạp Hoá Mười Vân', code: 'DL004128V',
      addr: '56 Lê Lợi', area: 'Kim Châu', ct: 4, tag: 'VIP Shop', tagColor: 'warning',
      lastOrder: 'Hôm nay', amount: '6.8M' },
    { name: 'Phạm Văn Long', shop: 'Tạp Hoá Long Xuyên', code: 'DL004129P',
      addr: '12 Nguyễn Du', area: 'Kim Châu', ct: 1, tag: 'Cảnh báo', tagColor: 'danger',
      lastOrder: '21 ngày', amount: '0' },
  ];

  return (
    <DesktopShell t={t} route="customers">
      <DesktopPageHeader t={t} eyebrow="Tuyến và độ phủ"
        title="Khách hàng"
        subtitle="103 khách · 30 VNM Shop · 17 VIP Shop · 20 SBPS"
        actions={[
          <Button key="ex" t={t} icon="upload" variant="secondary">Xuất KH</Button>,
          <Button key="im" t={t} icon="download" variant="secondary">Nhập KH</Button>,
          <Button key="r" t={t} icon="map" variant="secondary">Tuyến</Button>,
          <Button key="n" t={t} icon="plus" variant="primary">Thêm KH</Button>,
        ]}
      />

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Left: filters */}
        <div style={{ width: 220, flexShrink: 0, borderRight: `1px solid ${t.border}`,
          background: t.surface, padding: 16, overflowY: 'auto' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: t.textTertiary,
            textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Khu vực</div>
          {[
            { name: 'Tất cả', n: 103, active: true },
            { name: 'Hoà Phong', n: 20 },
            { name: 'Krông Bông', n: 18 },
            { name: 'Kim Châu', n: 15 },
            { name: 'Cư Mgar', n: 12 },
          ].map(a => (
            <div key={a.name} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '7px 9px', borderRadius: 6, marginBottom: 1,
              background: a.active ? t.accentSoft : 'transparent',
              color: a.active ? t.accentText : t.textSecondary,
              fontSize: 12.5, fontWeight: a.active ? 600 : 500,
            }}>
              <span>{a.name}</span>
              <span style={{ fontSize: 11, opacity: .7,
                fontVariantNumeric: 'tabular-nums' }}>{a.n}</span>
            </div>
          ))}

          <div style={{ fontSize: 11, fontWeight: 600, color: t.textTertiary,
            textTransform: 'uppercase', letterSpacing: '.05em',
            margin: '18px 0 8px' }}>Loại KH</div>
          {[
            { name: 'VNM Shop', n: 30, c: t.cat1 },
            { name: 'VIP Shop', n: 17, c: t.cat5 },
            { name: 'SBPS', n: 20, c: t.cat4 },
            { name: 'KH thường', n: 36, c: t.cat3 },
          ].map(c => (
            <div key={c.name} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '7px 9px', borderRadius: 6, marginBottom: 1,
              fontSize: 12.5, fontWeight: 500, color: t.textSecondary,
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: c.c }}/>
                {c.name}
              </span>
              <span style={{ fontSize: 11, opacity: .7,
                fontVariantNumeric: 'tabular-nums' }}>{c.n}</span>
            </div>
          ))}

          <div style={{ fontSize: 11, fontWeight: 600, color: t.textTertiary,
            textTransform: 'uppercase', letterSpacing: '.05em',
            margin: '18px 0 8px' }}>Trạng thái</div>
          {[
            { name: 'Active', n: 57, c: t.success },
            { name: 'Mới', n: 12, c: t.accent },
            { name: 'Cảnh báo', n: 8, c: t.danger },
          ].map(s => (
            <div key={s.name} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '7px 9px', borderRadius: 6, marginBottom: 1,
              fontSize: 12.5, fontWeight: 500, color: t.textSecondary,
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: 99, background: s.c }}/>
                {s.name}
              </span>
              <span style={{ fontSize: 11, opacity: .7,
                fontVariantNumeric: 'tabular-nums' }}>{s.n}</span>
            </div>
          ))}
        </div>

        {/* Center: table */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24, minWidth: 0 }}>
          {/* Search */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <SearchField t={t} placeholder="Tìm KH theo tên, mã, địa chỉ…" height={34}/>
            </div>
            <Button t={t} variant="secondary" size="md" icon="filter">Lọc nâng cao</Button>
          </div>

          {/* Table */}
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12,
            overflow: 'hidden' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 110px 110px 130px 100px 100px',
              gap: 14, padding: '10px 16px', borderBottom: `1px solid ${t.borderSubtle}`,
              fontSize: 11, fontWeight: 600, color: t.textTertiary,
              textTransform: 'uppercase', letterSpacing: '.05em', background: t.surfaceMuted,
            }}>
              <div>Khách hàng</div>
              <div>Mã KH</div>
              <div>Khu vực</div>
              <div>Loại</div>
              <div>Đơn cuối</div>
              <div style={{ textAlign: 'right' }}>DS tháng</div>
            </div>
            {customers.map((c, i) => {
              const tagC = {
                success: { bg: t.successSoft, fg: t.successText },
                warning: { bg: t.warningSoft, fg: t.warningText },
                danger: { bg: t.dangerSoft, fg: t.dangerText },
                accent: { bg: t.accentSoft, fg: t.accentText },
              }[c.tagColor];
              return (
                <div key={c.code} style={{
                  display: 'grid', gridTemplateColumns: '1fr 110px 110px 130px 100px 100px',
                  gap: 14, padding: '12px 16px', alignItems: 'center',
                  borderTop: i === 0 ? 'none' : `1px solid ${t.borderSubtle}`,
                  background: i === 0 ? t.accentSoft + '40' : 'transparent',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8,
                      background: t.accentSoft, color: t.accentText, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', fontSize: 11,
                      fontWeight: 600, flexShrink: 0 }}>
                      {c.name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: t.text,
                        letterSpacing: '-0.005em', overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap' }}>
                        {c.name}{c.shop && <span style={{ color: t.textSecondary,
                          fontWeight: 500 }}> · {c.shop}</span>}
                      </div>
                      <div style={{ fontSize: 11, color: t.textTertiary, overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.addr}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, fontFamily: 'ui-monospace, monospace',
                    color: t.textSecondary }}>{c.code}</div>
                  <div style={{ fontSize: 12.5, color: t.textSecondary }}>{c.area}</div>
                  <div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', height: 20,
                      padding: '0 7px', background: tagC.bg, color: tagC.fg, borderRadius: 5,
                      fontSize: 10.5, fontWeight: 600 }}>{c.tag}</span>
                  </div>
                  <div style={{ fontSize: 12, color: t.textSecondary }}>{c.lastOrder}</div>
                  <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, color: t.text,
                    fontVariantNumeric: 'tabular-nums' }}>{c.amount}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: detail panel */}
        <div style={{ width: 360, flexShrink: 0, borderLeft: `1px solid ${t.border}`,
          background: t.surface, overflowY: 'auto' }}>
          <div style={{ padding: '18px 20px', borderBottom: `1px solid ${t.borderSubtle}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10,
                background: t.accentSoft, color: t.accentText, display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 14,
                fontWeight: 600 }}>LY</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.text,
                  letterSpacing: '-0.01em' }}>Lê Thị Yến</div>
                <div style={{ fontSize: 12, color: t.textTertiary }}>Yến Lực · DL004126Y</div>
              </div>
              <span style={{ display: 'inline-flex', alignItems: 'center', height: 20,
                padding: '0 7px', background: t.warningSoft, color: t.warningText,
                borderRadius: 5, fontSize: 10.5, fontWeight: 600 }}>VIP Shop</span>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
              <Button t={t} variant="primary" size="sm" icon="cart" style={{ flex: 1 }}>
                Tạo đơn
              </Button>
              <Button t={t} variant="secondary" size="sm" icon="phone">Gọi</Button>
              <Button t={t} variant="secondary" size="sm" icon="pin">Bản đồ</Button>
            </div>
          </div>

          {/* VNM Shop */}
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${t.borderSubtle}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <div style={{ width: 5, height: 5, borderRadius: 99, background: t.cat1 }}/>
              <div style={{ fontSize: 12, fontWeight: 700, color: t.text,
                letterSpacing: '-0.005em' }}>VNM Shop · Nhóm C</div>
            </div>
            <div style={{ fontSize: 12, color: t.textSecondary, lineHeight: 1.7 }}>
              <div>Mã apos: <span style={{ fontFamily: 'ui-monospace, monospace',
                fontSize: 11, color: t.text }}>MR_VNM526_TL_7</span></div>
              <div>Tích lũy: <span style={{ color: t.text, fontWeight: 600 }}>Mức 7 (CK 1.2%)</span></div>
            </div>
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11,
                marginBottom: 4 }}>
                <span style={{ color: t.textTertiary, fontWeight: 600 }}>Tiến độ DS</span>
                <span style={{ color: t.accentText, fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums' }}>0 / 5.000.000 (0%)</span>
              </div>
              <Progress value={0} t={t}/>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 4, marginTop: 12 }}>
              {['D1', 'D2', 'D3', 'D4'].map(d => (
                <div key={d} style={{ background: t.surfaceMuted, borderRadius: 6,
                  padding: '6px 4px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: t.textTertiary, fontWeight: 600 }}>{d}</div>
                  <div style={{ fontSize: 12, color: t.text, fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums', marginTop: 1 }}>0đ</div>
                </div>
              ))}
            </div>
          </div>

          {/* SBPS */}
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${t.borderSubtle}` }}>
            <div style={{ padding: 12, background: t.warningSoft, borderRadius: 8,
              borderLeft: `3px solid ${t.warning}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: t.warningText,
                marginBottom: 4 }}>SBPS · Sữa bột pha sẵn TE</div>
              <div style={{ fontSize: 11.5, color: t.textSecondary, lineHeight: 1.7 }}>
                <div>Mã apos: <span style={{ fontFamily: 'ui-monospace, monospace',
                  fontSize: 10.5, color: t.text }}>MR_SBPS26_T8</span></div>
                <div>Thưởng: <span style={{ color: t.text, fontWeight: 600 }}>Mức 7 (5.500.000đ)</span></div>
              </div>
            </div>
          </div>

          {/* Recent orders */}
          <div style={{ padding: '14px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: t.textTertiary,
              textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>
              Đơn gần đây
            </div>
            {[
              { id: 'DH-2026-0034', date: '03/05', total: '4.2M' },
              { id: 'DH-2026-0021', date: '01/05', total: '1.8M' },
              { id: 'DH-2026-0008', date: '28/04', total: '3.1M' },
            ].map(o => (
              <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', padding: '8px 0',
                borderBottom: `1px solid ${t.borderSubtle}` }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: t.text,
                    fontFamily: 'ui-monospace, monospace' }}>{o.id}</div>
                  <div style={{ fontSize: 11, color: t.textTertiary, marginTop: 1 }}>{o.date}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.text,
                  fontVariantNumeric: 'tabular-nums' }}>{o.total}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DesktopShell>
  );
}

// ═══════════════════════════════════════════════════════════════
// DESKTOP — Đặt hàng có expand giá chi tiết
// ═══════════════════════════════════════════════════════════════
function DesktopOrderExpanded({ t }) {
  return (
    <DesktopShell t={t} route="order">
      <DesktopPageHeader t={t} eyebrow="Bán hàng"
        title="Đặt hàng — Chi tiết giá"
        subtitle="Khách: Lê Thị Yến (Yến Lực) · VIP Shop"
        actions={[
          <Button key="d" t={t} icon="save" variant="secondary">Lưu nháp</Button>,
          <Button key="e" t={t} icon="check" variant="primary">Xác nhận đơn</Button>,
        ]}
      />
      <div style={{ flex: 1, overflow: 'auto', padding: 28 }}>
        {/* Expanded product card */}
        <div style={{ background: t.surface, border: `1px solid ${t.accent}`, borderRadius: 12,
          boxShadow: `0 0 0 4px ${t.accentSoft}`, overflow: 'hidden', marginBottom: 16 }}>
          {/* Header */}
          <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14,
            borderBottom: `1px solid ${t.borderSubtle}` }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ fontSize: 11, fontFamily: 'ui-monospace, monospace',
                  color: t.textTertiary }}>04ED35</div>
                <div style={{ width: 2, height: 2, borderRadius: 99, background: t.textTertiary }}/>
                <div style={{ fontSize: 11, color: t.textTertiary }}>48/Hộp</div>
                <div style={{ width: 2, height: 2, borderRadius: 99, background: t.textTertiary }}/>
                <Tag t={t} variant="outline">ADM</Tag>
                <Icon name="star" size={12} color={t.warning}/>
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: t.text,
                letterSpacing: '-0.01em' }}>SDD ADM có đường 110ml</div>
            </div>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: t.surfaceMuted,
              border: `1px solid ${t.border}`, color: t.textSecondary,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="chevronU" size={15}/>
            </div>
          </div>

          {/* Price detail table */}
          <div style={{ padding: '0 20px', background: t.surfaceMuted }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '120px 1fr 1fr 1fr 1fr',
              gap: 16, padding: '10px 0',
              fontSize: 11, fontWeight: 600, color: t.textTertiary,
              textTransform: 'uppercase', letterSpacing: '.05em',
              borderBottom: `1px solid ${t.borderSubtle}`,
            }}>
              <div></div>
              <div style={{ textAlign: 'right' }}>Gốc</div>
              <div style={{ textAlign: 'right' }}>Sau KM</div>
              <div style={{ textAlign: 'right', color: t.accentText }}>+ Thuế</div>
              <div style={{ textAlign: 'right' }}>Tiết kiệm</div>
            </div>
            {[
              { l: 'Thùng (48 hộp)', g: 225504, k: '—', v: 228387, save: 0 },
              { l: 'Hộp lẻ', g: 4698, k: '—', v: 4768, save: 0 },
              { l: 'CK chiết khấu', g: 0, k: '—', v: '−2.736', save: 2736 },
            ].map((r, idx) => (
              <div key={idx} style={{
                display: 'grid', gridTemplateColumns: '120px 1fr 1fr 1fr 1fr',
                gap: 16, padding: '10px 0',
                borderBottom: idx < 2 ? `1px solid ${t.borderSubtle}` : 'none',
                fontSize: 13, fontVariantNumeric: 'tabular-nums',
              }}>
                <div style={{ color: t.textSecondary, fontWeight: 500 }}>{r.l}</div>
                <div style={{ textAlign: 'right', color: t.text }}>
                  {typeof r.g === 'number' && r.g > 0 ? r.g.toLocaleString() + 'đ' : '—'}
                </div>
                <div style={{ textAlign: 'right', color: t.textTertiary }}>{r.k}</div>
                <div style={{ textAlign: 'right', color: t.accentText, fontWeight: 600 }}>
                  {typeof r.v === 'number' ? r.v.toLocaleString() + 'đ' : r.v + 'đ'}
                </div>
                <div style={{ textAlign: 'right', color: r.save > 0 ? t.successText : t.textTertiary,
                  fontWeight: r.save > 0 ? 600 : 400 }}>
                  {r.save > 0 ? '−' + r.save.toLocaleString() + 'đ' : '—'}
                </div>
              </div>
            ))}
          </div>

          {/* CTKM list */}
          <div style={{ padding: '14px 20px', borderTop: `1px solid ${t.borderSubtle}` }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: t.textTertiary,
              textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>
              Khuyến mãi áp dụng (12)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {['ADM 110ml 12+1', 'ADM 110ml 48+5', 'ADM 110ml 192+24',
                'Ontop SN 2M+2h Cascade', 'Ontop SN 5M+8h Cascade',
                'CK đơn từ 2tr +2%', 'BĐD HG2 +1%', 'Trưng bày M5', 'Tích lũy M7'].map(tg => (
                <Tag key={tg} t={t} color={t.accentText}>{tg}</Tag>
              ))}
              <Tag t={t} variant="outline">+3</Tag>
            </div>
          </div>

          {/* Customer accumulation notice */}
          <div style={{ padding: '12px 20px', background: t.accentSoft + '60',
            borderTop: `1px solid ${t.borderSubtle}`,
            display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="info" size={15} color={t.accentText}/>
            <div style={{ flex: 1, fontSize: 12, color: t.text }}>
              <b style={{ fontWeight: 600 }}>Lê Thị Yến</b> đang ở <b style={{ fontWeight: 600 }}>Mức 7
              (CK 1.2%)</b>. Đơn này sẽ cộng <b style={{ fontWeight: 600 }}>−2.736đ</b> chiết khấu thưởng tích lũy.
            </div>
          </div>

          {/* Quantity row */}
          <div style={{ padding: '16px 20px', borderTop: `1px solid ${t.borderSubtle}`,
            display: 'grid', gridTemplateColumns: '1fr 1fr 200px', gap: 14, alignItems: 'flex-end' }}>
            {[
              { label: 'Thùng × 48 hộp', value: '2', unit: '× 228.387đ = 456.774đ' },
              { label: 'Hộp lẻ', value: '12', unit: '× 4.768đ = 57.216đ' },
            ].map(f => (
              <div key={f.label}>
                <div style={{ fontSize: 11, fontWeight: 600, color: t.textTertiary,
                  textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 5 }}>
                  {f.label}
                </div>
                <div style={{ height: 38, background: t.surface,
                  border: `1px solid ${t.border}`, borderRadius: 8,
                  display: 'flex', alignItems: 'center', padding: '0 12px',
                  fontSize: 16, fontWeight: 600, color: t.text,
                  fontVariantNumeric: 'tabular-nums' }}>{f.value}</div>
                <div style={{ fontSize: 11, color: t.textTertiary, marginTop: 4,
                  fontVariantNumeric: 'tabular-nums' }}>{f.unit}</div>
              </div>
            ))}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: t.textTertiary,
                textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 5,
                textAlign: 'right' }}>
                Thành tiền
              </div>
              <div style={{ height: 38, background: t.accent, color: '#fff', borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                padding: '0 14px', fontSize: 18, fontWeight: 700,
                letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums' }}>
                513.990đ
              </div>
            </div>
          </div>
        </div>

        <div style={{ fontSize: 12, color: t.textTertiary, textAlign: 'center', padding: 12 }}>
          ↑ Click vào sản phẩm bất kỳ trong danh sách để mở chi tiết giá như trên
        </div>
      </div>
    </DesktopShell>
  );
}

// ═══════════════════════════════════════════════════════════════
// DESKTOP — Chương trình KM (Promotions / CTKM)
// ═══════════════════════════════════════════════════════════════
function DesktopCTKM({ t }) {
  const programs = [
    { code: 'ADM-110-4824', name: 'ADM 110ml 48+5, 192+24', type: 'BĐD',
      brand: 'ADM', start: '01/05/2026', end: '31/05/2026', status: 'active',
      sku: 12, customers: 103 },
    { code: 'ONTOP-SN-2M2H', name: 'Ontop SN 2M+2h/5M+8h Cascade', type: 'Cascade',
      brand: 'STT 100%', start: '01/05/2026', end: '31/05/2026', status: 'active',
      sku: 8, customers: 57 },
    { code: 'BDD-RIDIELAC', name: 'BĐD Ridielac - Mua 2 hộp CK 3%', type: 'Discount',
      brand: 'Dielac Gold', start: '15/04/2026', end: '15/06/2026', status: 'active',
      sku: 24, customers: 88 },
    { code: 'TT-OPTIMUM', name: 'Optimum tăng 8% trưng bày', type: 'Trưng bày',
      brand: 'Optimum', start: '01/05/2026', end: '31/05/2026', status: 'active',
      sku: 6, customers: 30 },
    { code: 'KD-SBPS-482', name: 'KD SBPS 48+2 đầu chuối', type: 'BĐD',
      brand: 'Grow Plus', start: '01/04/2026', end: '30/04/2026', status: 'expired',
      sku: 4, customers: 0 },
  ];

  return (
    <DesktopShell t={t} route="settings">
      <DesktopPageHeader t={t} eyebrow="Quản trị · CTKM"
        title="Chương trình khuyến mãi"
        subtitle="336 chương trình · 240 đang chạy · 96 hết hạn"
        actions={[
          <Button key="i" t={t} icon="upload" variant="secondary">Import Excel</Button>,
          <Button key="n" t={t} icon="plus" variant="primary">Thêm CTKM</Button>,
        ]}
      />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* List */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            {['Tất cả · 336', 'Đang chạy · 240', 'Sắp hết · 24', 'Hết hạn · 96'].map((c, i) => (
              <div key={c} style={{
                padding: '6px 12px', height: 30, display: 'inline-flex', alignItems: 'center',
                borderRadius: 99, fontSize: 12.5, fontWeight: 500,
                background: i === 0 ? t.text : t.surface,
                color: i === 0 ? t.textInverse : t.textSecondary,
                border: i === 0 ? 'none' : `1px solid ${t.border}`,
              }}>{c}</div>
            ))}
            <div style={{ flex: 1 }}/>
            <SearchField t={t} placeholder="Tìm CTKM…" height={30}/>
          </div>

          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12,
            overflow: 'hidden' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '120px 1fr 110px 110px 130px 80px 80px',
              gap: 12, padding: '10px 16px', borderBottom: `1px solid ${t.borderSubtle}`,
              fontSize: 11, fontWeight: 600, color: t.textTertiary,
              textTransform: 'uppercase', letterSpacing: '.05em', background: t.surfaceMuted,
            }}>
              <div>Mã CT</div>
              <div>Tên chương trình</div>
              <div>Loại</div>
              <div>Brand</div>
              <div>Thời gian</div>
              <div style={{ textAlign: 'right' }}>SKU</div>
              <div style={{ textAlign: 'right' }}>KH</div>
            </div>
            {programs.map((p, i) => (
              <div key={p.code} style={{
                display: 'grid', gridTemplateColumns: '120px 1fr 110px 110px 130px 80px 80px',
                gap: 12, padding: '12px 16px', alignItems: 'center',
                borderTop: i === 0 ? 'none' : `1px solid ${t.borderSubtle}`,
                background: i === 1 ? t.accentSoft + '40' : 'transparent',
                opacity: p.status === 'expired' ? .5 : 1,
              }}>
                <div style={{ fontSize: 11, fontFamily: 'ui-monospace, monospace',
                  color: t.textSecondary }}>{p.code}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <div style={{ width: 5, height: 18, borderRadius: 2,
                    background: p.status === 'active' ? t.success : t.textTertiary }}/>
                  <div style={{ fontSize: 13, fontWeight: 600, color: t.text,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                </div>
                <div><Tag t={t} color={t.cat3}>{p.type}</Tag></div>
                <div><Tag t={t} variant="outline">{p.brand}</Tag></div>
                <div style={{ fontSize: 11.5, color: t.textTertiary,
                  fontVariantNumeric: 'tabular-nums' }}>{p.start} → {p.end}</div>
                <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, color: t.text,
                  fontVariantNumeric: 'tabular-nums' }}>{p.sku}</div>
                <div style={{ textAlign: 'right', fontSize: 13, color: t.textSecondary,
                  fontVariantNumeric: 'tabular-nums' }}>{p.customers}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Add CTKM form panel */}
        <div style={{ width: 380, flexShrink: 0, borderLeft: `1px solid ${t.border}`,
          background: t.surface, overflowY: 'auto' }}>
          <div style={{ padding: '18px 20px 12px', borderBottom: `1px solid ${t.borderSubtle}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: t.accentSoft,
                color: t.accentText, display: 'flex', alignItems: 'center',
                justifyContent: 'center' }}>
                <Icon name="plus" size={16}/>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.text,
                  letterSpacing: '-0.01em' }}>Thêm CTKM mới</div>
                <div style={{ fontSize: 11.5, color: t.textTertiary }}>Tạo chương trình khuyến mãi</div>
              </div>
            </div>
          </div>

          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Mã CT', value: 'ADM-110-NEW', mono: true },
              { label: 'Tên chương trình', value: 'ADM 110ml 12+1' },
            ].map(f => (
              <div key={f.label}>
                <label style={{ fontSize: 11, fontWeight: 600, color: t.textTertiary,
                  textTransform: 'uppercase', letterSpacing: '.05em', display: 'block',
                  marginBottom: 5 }}>{f.label}</label>
                <div style={{ height: 36, background: t.surface, border: `1px solid ${t.border}`,
                  borderRadius: 8, padding: '0 12px', display: 'flex', alignItems: 'center',
                  fontSize: 13, color: t.text,
                  fontFamily: f.mono ? 'ui-monospace, monospace' : 'inherit' }}>{f.value}</div>
              </div>
            ))}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: t.textTertiary,
                  textTransform: 'uppercase', letterSpacing: '.05em', display: 'block',
                  marginBottom: 5 }}>Loại</label>
                <div style={{ height: 36, background: t.surface, border: `1px solid ${t.border}`,
                  borderRadius: 8, padding: '0 12px', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', fontSize: 13, color: t.text }}>
                  <span>BĐD</span>
                  <Icon name="chevronD" size={14} color={t.textTertiary}/>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: t.textTertiary,
                  textTransform: 'uppercase', letterSpacing: '.05em', display: 'block',
                  marginBottom: 5 }}>Brand</label>
                <div style={{ height: 36, background: t.surface, border: `1px solid ${t.border}`,
                  borderRadius: 8, padding: '0 12px', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', fontSize: 13, color: t.text }}>
                  <span>ADM</span>
                  <Icon name="chevronD" size={14} color={t.textTertiary}/>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Bắt đầu', value: '01/05/2026' },
                { label: 'Kết thúc', value: '31/05/2026' },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: t.textTertiary,
                    textTransform: 'uppercase', letterSpacing: '.05em', display: 'block',
                    marginBottom: 5 }}>{f.label}</label>
                  <div style={{ height: 36, background: t.surface, border: `1px solid ${t.border}`,
                    borderRadius: 8, padding: '0 12px', display: 'flex', alignItems: 'center',
                    gap: 8, fontSize: 13, color: t.text,
                    fontVariantNumeric: 'tabular-nums' }}>
                    <Icon name="calendar" size={13} color={t.textTertiary}/>
                    {f.value}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: t.textTertiary,
                textTransform: 'uppercase', letterSpacing: '.05em', display: 'block',
                marginBottom: 5 }}>Quy tắc khuyến mãi</label>
              <div style={{ background: t.surfaceMuted, border: `1px solid ${t.borderSubtle}`,
                borderRadius: 8, padding: 12, fontSize: 12.5, lineHeight: 1.6,
                color: t.text, fontFamily: 'ui-monospace, monospace' }}>
                Mua <b>12</b> thùng → tặng <b>1</b> thùng<br/>
                Mua <b>48</b> thùng → tặng <b>5</b> thùng<br/>
                Mua <b>192</b> thùng → tặng <b>24</b> thùng
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: t.textTertiary,
                textTransform: 'uppercase', letterSpacing: '.05em', display: 'block',
                marginBottom: 5 }}>Áp dụng cho SKUs</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5,
                padding: 8, background: t.surfaceMuted, borderRadius: 8,
                border: `1px solid ${t.borderSubtle}`, minHeight: 36 }}>
                {['ADM 110ml', 'ADM 180ml', 'ADM 110ml 48+5'].map(s => (
                  <Tag key={s} t={t} color={t.accentText}>{s}</Tag>
                ))}
                <span style={{ fontSize: 12, color: t.textTertiary, padding: '0 4px',
                  height: 20, display: 'inline-flex', alignItems: 'center' }}>+ Thêm SKU</span>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: t.textTertiary,
                textTransform: 'uppercase', letterSpacing: '.05em', display: 'block',
                marginBottom: 5 }}>Áp dụng cho khách hàng</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 10px', background: t.surfaceMuted, borderRadius: 8,
                border: `1px solid ${t.borderSubtle}` }}>
                <Icon name="users" size={14} color={t.accentText}/>
                <div style={{ flex: 1, fontSize: 12.5, color: t.text }}>
                  Tất cả VNM Shop & VIP Shop
                </div>
                <span style={{ fontSize: 11, color: t.textTertiary,
                  fontVariantNumeric: 'tabular-nums' }}>47 KH</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
              <Button t={t} variant="secondary" size="md" style={{ flex: 1 }}>Hủy</Button>
              <Button t={t} variant="primary" size="md" icon="save" style={{ flex: 2 }}>
                Lưu chương trình
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DesktopShell>
  );
}

// ═══════════════════════════════════════════════════════════════
// DESKTOP — Đơn hàng (Orders history)
// ═══════════════════════════════════════════════════════════════
function DesktopOrders({ t }) {
  const orders = [
    { id: 'DH-2026-0034', customer: 'Lê Thị Yến (Yến Lực)', date: '03/05/2026 10:42',
      items: 8, total: 4203450, status: 'pending', tagColor: 'warning' },
    { id: 'DH-2026-0033', customer: 'Tạp Hoá Mười Vân', date: '03/05/2026 09:18',
      items: 12, total: 6802000, status: 'confirmed', tagColor: 'success' },
    { id: 'DH-2026-0032', customer: 'Trần Thị Hoa (TH Hoa Chín)', date: '02/05/2026 16:30',
      items: 4, total: 720500, status: 'confirmed', tagColor: 'success' },
    { id: 'DH-2026-0031', customer: 'Nguyễn Sửu', date: '02/05/2026 14:05',
      items: 6, total: 1815000, status: 'delivered', tagColor: 'accent' },
    { id: 'DH-2026-0030', customer: 'Cửa hàng Thanh Cao', date: '01/05/2026 11:20',
      items: 10, total: 2105000, status: 'delivered', tagColor: 'accent' },
    { id: 'DH-2026-0029', customer: 'Phạm Văn Long', date: '28/04/2026 15:42',
      items: 0, total: 0, status: 'cancelled', tagColor: 'danger' },
  ];
  const labels = { pending: 'Chờ xử lý', confirmed: 'Đã xác nhận',
    delivered: 'Đã giao', cancelled: 'Đã hủy' };

  return (
    <DesktopShell t={t} route="orders">
      <DesktopPageHeader t={t} eyebrow="Lịch sử"
        title="Đơn hàng"
        subtitle="34 đơn tháng 5 · 3 chờ xử lý · Tổng doanh số 642M"
        actions={[
          <Button key="ex" t={t} icon="download" variant="secondary">Xuất Excel</Button>,
          <Button key="n" t={t} icon="plus" variant="primary">Đơn mới</Button>,
        ]}
      />
      <div style={{ flex: 1, overflow: 'auto', padding: 28 }}>
        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
          marginBottom: 20 }}>
          {[
            { l: 'Tổng đơn', v: '34', acc: t.cat1 },
            { l: 'Doanh số', v: '642M', acc: t.cat3 },
            { l: 'Chờ xử lý', v: '3', acc: t.cat5 },
            { l: 'TB / đơn', v: '18.9M', acc: t.cat2 },
          ].map(s => (
            <div key={s.l} style={{ background: t.surface, border: `1px solid ${t.border}`,
              borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 5, height: 5, borderRadius: 99, background: s.acc }}/>
                <div style={{ fontSize: 11, color: t.textTertiary, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '.04em' }}>{s.l}</div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 600, color: t.text,
                letterSpacing: '-0.025em', marginTop: 4,
                fontVariantNumeric: 'tabular-nums' }}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {['Tất cả · 34', 'Chờ xử lý · 3', 'Đã xác nhận · 12', 'Đã giao · 18', 'Đã hủy · 1'].map((c, i) => (
            <div key={c} style={{
              padding: '6px 12px', height: 30, display: 'inline-flex', alignItems: 'center',
              borderRadius: 99, fontSize: 12.5, fontWeight: 500,
              background: i === 0 ? t.text : t.surface,
              color: i === 0 ? t.textInverse : t.textSecondary,
              border: i === 0 ? 'none' : `1px solid ${t.border}`,
            }}>{c}</div>
          ))}
        </div>

        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12,
          overflow: 'hidden' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '160px 1fr 160px 80px 130px 110px',
            gap: 14, padding: '10px 16px', borderBottom: `1px solid ${t.borderSubtle}`,
            fontSize: 11, fontWeight: 600, color: t.textTertiary,
            textTransform: 'uppercase', letterSpacing: '.05em', background: t.surfaceMuted,
          }}>
            <div>Mã đơn</div><div>Khách hàng</div><div>Ngày tạo</div>
            <div style={{ textAlign: 'right' }}>SP</div>
            <div style={{ textAlign: 'right' }}>Tổng tiền</div>
            <div>Trạng thái</div>
          </div>
          {orders.map((o, i) => {
            const tagC = {
              success: { bg: t.successSoft, fg: t.successText },
              warning: { bg: t.warningSoft, fg: t.warningText },
              danger: { bg: t.dangerSoft, fg: t.dangerText },
              accent: { bg: t.accentSoft, fg: t.accentText },
            }[o.tagColor];
            return (
              <div key={o.id} style={{
                display: 'grid', gridTemplateColumns: '160px 1fr 160px 80px 130px 110px',
                gap: 14, padding: '12px 16px', alignItems: 'center',
                borderTop: i === 0 ? 'none' : `1px solid ${t.borderSubtle}`,
              }}>
                <div style={{ fontSize: 12, fontFamily: 'ui-monospace, monospace',
                  color: t.text, fontWeight: 600 }}>{o.id}</div>
                <div style={{ fontSize: 13, color: t.text, fontWeight: 500,
                  letterSpacing: '-0.005em' }}>{o.customer}</div>
                <div style={{ fontSize: 12, color: t.textSecondary,
                  fontVariantNumeric: 'tabular-nums' }}>{o.date}</div>
                <div style={{ textAlign: 'right', fontSize: 12.5, color: t.textSecondary,
                  fontVariantNumeric: 'tabular-nums' }}>{o.items}</div>
                <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, color: t.text,
                  fontVariantNumeric: 'tabular-nums' }}>{o.total.toLocaleString()}đ</div>
                <div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', height: 22,
                    padding: '0 8px', background: tagC.bg, color: tagC.fg, borderRadius: 5,
                    fontSize: 11, fontWeight: 600 }}>{labels[o.status]}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DesktopShell>
  );
}

Object.assign(window, {
  DesktopCustomers, DesktopOrderExpanded, DesktopCTKM, DesktopOrders,
});
