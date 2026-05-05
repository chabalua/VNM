# UI Pricing Smoke Checklist

Cap nhat: 2026-05-05

Muc tieu: verify nhanh cac path render gia trong tab Dat hang sau khi sua `js/ui.js`, `js/order-pricing-ui.js`, `js/cart.js` hoac `js/km.js`.

## Cach chay

1. Mo app.
2. Vao tab Dat hang.
3. Chon 1 KH neu case can strip tich luy.
4. Nhap so luong tren card SP, mo phan expand neu can.
5. Doi chieu 3 noi:
   - Bang gia `Goc / +KM / +VAT`
   - Preview `Tam tinh`
   - Gio hang sau khi bam `Them`

## Case 1 — Khong co KM

- Chon SP khong kich hoat CTKM o so luong thu.
- Nhap so luong le va so luong tron thung.
- Ky vong:
  - cot `+KM` khong hien gia giam
  - `Tam tinh` = gia goc + VAT
  - khong hien block qua tang / discount

## Case 2 — Same-product bonus

- Chon SP co CT tang cung ma hang.
- Nhap so luong vuot nguong nhan thuong.
- Ky vong:
  - preview hien dong `Tang ...` voi quy doi thung neu co
  - `hopKM/thungKM` giam theo so luong nhan thuc te
  - them vao gio xong mo lai card van ra cung ket qua

## Case 3 — Gift-other bonus

- Chon SP co CT tang ma hang khac.
- Nhap so luong dat nguong.
- Ky vong:
  - preview hien qua tang ma khac
  - bang gia quy gia tri qua thanh giam gia ao
  - tong truoc VAT trong preview khop voi logic da quy doi

## Case 4 — order_money

- Tao gio dat nguong CTKM don hang.
- Kiem tra 1 SP trong gio va 1 SP ngoai gio.
- Ky vong:
  - discount don hang duoc phan bo vao cac SP trong gio
  - card SP trong gio co `+KM` thay doi sau khi dat nguong
  - SP ngoai gio khong bi an discount don hang khi chua nam trong draft cart

## Case 5 — order_bonus

- Tao gio dat nguong qua tang don hang.
- Ky vong:
  - preview hien `Ontop`
  - neu qua cung ma, so luong nhan them duoc tinh vao gia hieu dung
  - neu qua khac ma, gia tri qua duoc quy doi vao discount ao

## Case 6 — TL strip

- Chon KH co dang ky chuong trinh tich luy.
- Mo SP thuoc nhom A / C / D tuong ung.
- Ky vong:
  - strip hien dung chuong trinh dang ky
  - % tien do va so tien con thieu khong vo am
  - doi KH khac thi strip doi theo KH moi

## Khi bug

- Ghi lai:
  - ma KH
  - ma SP
  - qT / qL
  - ten CTKM hien tren card
  - tong goc, tong tru KM, tong VAT, tong cuoi
- Neu la bug tinh gia: chay them `node tests/km-engine.test.js`.
- Neu la bug lech render UI: chup man hinh card + preview + gio hang.