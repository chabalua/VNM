# Promotion Data Audit

Cap nhat: 2026-05-05

Muc tieu: ghi lai cac van de du lieu CTKM da gap de lan sau khong phai scan lai tu dau.

## Ket luan nhanh

- `promotions.json` da duoc dedupe vat ly. Khong con duplicate logical records.
- App da canh bao ngay trong runtime va tab KM khi CTKM active tham chieu ma SP khong con ton tai.
- Van con 2 lop loi du lieu nghiep vu:
  - `CTKM mu gia`: trigger SKU con ton tai, nhung ma qua tang khong ton tai trong `products.json`.
  - `missing trigger refs`: CTKM active dang tro vao SKU khong con trong `products.json`.

## CTKM mu gia can xu ly truoc

Day la nhom loi nguy hiem nhat vi CTKM van co the ap, nhung app khong co gia/master record cho qua tang.

1. `MR05263012-OB` — `T05·A·SBPS TE Ontop ĐH: 250k → 4h GP/Optimum 110ml (DS T1+T2≥5tr)`
   - `giftMa`: `02HL36`
   - Trigger con ton tai: `02HL37`, `02HD39`, `02HG38`, `02HO38`, `02HS37`, `02HY39`
2. `MR05263024` — `T05·B·ÔT Vỉ 40g: 36 hộp + 1 ĐB 110ml`
   - `giftMa`: `04ED32`
   - Trigger con ton tai: `01VD41`
3. `MR05263039-M1` — `T05·C·ĐB 1L: 3+1 ĐB 180ml`
   - `giftMa`: `04ED12`
   - Trigger con ton tai: `04ED04`, `04EI04`, `04ET04`, `04ET22`
4. `MR05263045` — `T05·C·GF Tổ Yến 180: 12+1 GF 180`
   - `giftMa`: `04GD13`
   - Trigger con ton tai: `04GB18`
5. `MR05263046` — `T05·C·GF 1L: 6+4 GF 110`
   - `giftMa`: `04GD33`
   - Trigger con ton tai: `04GT05`
6. `MR05263048` — `T05·C·GF A2 110: 12+1 GF 110`
   - `giftMa`: `04GD33`
   - Trigger con ton tai: `04AE32`
7. `MR05263049` — `T05·C·GF A2 180: 12+1 GF 180`
   - `giftMa`: `04GD13`
   - Trigger con ton tai: `04AE12`
8. `MR05263053-M1` — `T05·D·SCA Ontop ĐH 600k (≥2 SKU): 1 SCA Nha đam mỗi 300k`
   - `giftMa`: `07ND12`
   - Trigger con ton tai: `07KD12`, `07TR33`, `07ND15`
9. `MR05263053-M2` — `T05·D·SCA Ontop ĐH 800k (≥3 SKU): 1 SCA Nha đam mỗi 200k`
   - `giftMa`: `07ND12`
   - Trigger con ton tai: `07KD12`, `07TR33`, `07ND15`
10. `MR05263055-M1` — `T05·D·Sữa hạt: ĐH 250k → 2h 9 hạt`
   - `giftMa`: `05AN20`
   - Trigger con ton tai: `05AD11`, `05AD31`, `05AV33`, `05FV44`, `05MD10`, `05AV24`, `05DH14`, `05DD14`, `05DY10`, `04LL13`
11. `MR05263055-M2` — `T05·D·Sữa hạt: ĐH 400k → 4h 9 hạt`
   - `giftMa`: `05AN20`
   - Trigger con ton tai: `05AD11`, `05AD31`, `05AV33`, `05FV44`, `05MD10`, `05AV24`, `05DH14`, `05DD14`, `05DY10`, `04LL13`

## Ma qua tang dang thieu trong products.json

Co 11 ma qua tang unique dang thieu:

`01CX02`, `02HL36`, `04ED12`, `04ED32`, `04GD13`, `04GD33`, `05AN20`, `07ND12`, `09CC25`, `09NND1`, `14GC02`

## Ma trigger dang thieu trong products.json

Tong cong 605 ma unique dang duoc CTKM active tham chieu nhung khong co trong `products.json`.

Danh sach full:

`01CX02`, `01CX12`, `01SC02`, `01TF60`, `01TL20`, `01TM60`, `02AA24`, `02AC13`, `02AC14`, `02AD11`, `02AD12`, `02AG15`, `02AG16`, `02AG1A`, `02AG25`, `02AG26`, `02AG2A`, `02AM11`, `02AM21`, `02AO13`, `02AO14`, `02AO16`, `02AO1A`, `02AO23`, `02AO24`, `02AO26`, `02AO2A`, `02AO33`, `02AO36`, `02AS11`, `02AS12`, `02AS18`, `02AS19`, `02AS21`, `02AU14`, `02AY10`, `02AY20`, `02BA24`, `02BN20`, `02BN22`, `02DG35`, `02DG36`, `02DG37`, `02DG45`, `02DG46`, `02DG47`, `02DO33`, `02DO34`, `02DO37`, `02DO43`, `02DO44`, `02DO47`, `02DR63`, `02DR73`, `02EC13`, `02EC90`, `02ED11`, `02EG15`, `02EG16`, `02EG1A`, `02EG25`, `02EG26`, `02EG2A`, `02EG36`, `02EG3A`, `02EG46`, `02EG4A`, `02EM11`, `02EM21`, `02EN20`, `02EO13`, `02EO14`, `02EO17`, `02EO1A`, `02EO23`, `02EO24`, `02EO27`, `02EO2A`, `02EO33`, `02EO34`, `02EO3A`, `02EO43`, `02EO44`, `02EO4A`, `02ER63`, `02ER64`, `02ER73`, `02ER74`, `02ES11`, `02ES12`, `02ES19`, `02ES21`, `02ES22`, `02ES28`, `02ES29`, `02ES31`, `02ES32`, `02ES39`, `02EU14`, `02EU90`, `02EY10`, `02EY30`, `02HA19`, `02HA38`, `02HB19`, `02HB38`, `02HD14`, `02HD34`, `02HG17`, `02HG19`, `02HG1A`, `02HG37`, `02HG39`, `02HG3A`, `02HL15`, `02HL16`, `02HL18`, `02HL19`, `02HL35`, `02HL36`, `02HL38`, `02HL39`, `02HO15`, `02HO16`, `02HO19`, `02HO35`, `02HO36`, `02HO39`, `02HS12`, `02HS13`, `02HS17`, `02HS19`, `02HS32`, `02HS33`, `02HS39`, `02HT39`, `02HY11`, `02HY30`, `02HY31`, `02PD22`, `02PU22`, `03AA22`, `03AA24`, `03AA32`, `03AA41`, `03AA43`, `03AA53`, `03AA55`, `03AA73`, `03AA75`, `03AA91`, `03AA93`, `03AB10`, `03AH11`, `03AY03`, `03AY71`, `03AY72`, `03CA13`, `03CA14`, `03CA22`, `03CA23`, `03CA32`, `03CA33`, `03CA42`, `03CA43`, `03CA53`, `03CA55`, `03CA73`, `03CA74`, `03CA82`, `03CA83`, `03CA91`, `03CA93`, `03CM03`, `03CM04`, `03CM05`, `03CM10`, `03CY02`, `03CY03`, `03CY71`, `03CY72`, `04AD19`, `04AD31`, `04AE11`, `04AE31`, `04BI18`, `04CA13`, `04CA14`, `04CA32`, `04CC15`, `04CC16`, `04CC33`, `04CD10`, `04CD12`, `04CD13`, `04CD14`, `04CD31`, `04CD34`, `04CI10`, `04CI30`, `04CY11`, `04CY12`, `04CY32`, `04EA11`, `04EA12`, `04EA19`, `04EA32`, `04EA39`, `04EB10`, `04EC12`, `04EC19`, `04EC32`, `04EC39`, `04EC70`, `04ED02`, `04ED03`, `04ED11`, `04ED12`, `04ED19`, `04ED1K`, `04ED32`, `04ED39`, `04ED40`, `04EI02`, `04EI03`, `04EI11`, `04EI12`, `04EI13`, `04EI19`, `04EI32`, `04EI39`, `04ET02`, `04ET03`, `04ET11`, `04ET12`, `04ET18`, `04ET19`, `04ET20`, `04ET21`, `04ET32`, `04ET39`, `04ET62`, `04EU10`, `04FA32`, `04FC31`, `04FD0H`, `04FD1H`, `04FD31`, `04FD42`, `04FD43`, `04FH29`, `04FI0H`, `04FI1H`, `04FI2H`, `04FI31`, `04FT0H`, `04FT1H`, `04FT31`, `04GB10`, `04GB11`, `04GD13`, `04GD14`, `04GD19`, `04GD33`, `04GD34`, `04GD39`, `04GI03`, `04GI04`, `04GI05`, `04GI13`, `04GI18`, `04GI19`, `04GI33`, `04GI39`, `04GO10`, `04GP21`, `04GP22`, `04GT03`, `04GT04`, `04GT13`, `04GT14`, `04GT19`, `04GT34`, `04LL12`, `04LT11`, `04LT12`, `04SS72`, `04SS73`, `04SS77`, `04SS79`, `04SS82`, `04SS83`, `04SS85`, `04SS86`, `04SS88`, `04US32`, `04US35`, `04US36`, `04US38`, `04WI32`, `05AD10`, `05AD20`, `05AD21`, `05AD22`, `05AD30`, `05AN01`, `05AN02`, `05AN03`, `05AN04`, `05AN20`, `05AN21`, `05AN22`, `05AN23`, `05AN24`, `05AN27`, `05AN28`, `05AN30`, `05AN37`, `05AT11`, `05AT12`, `05AT13`, `05AV04`, `05AV11`, `05AV12`, `05AV20`, `05AV21`, `05AV22`, `05AV23`, `05AV28`, `05AV31`, `05AV32`, `05AV37`, `05BG11`, `05BG13`, `05BG21`, `05BG22`, `05BG23`, `05BG24`, `05DD10`, `05DD11`, `05DD12`, `05DD13`, `05DH10`, `05DH11`, `05DH12`, `05DH13`, `05FV41`, `05FV42`, `05FV43`, `06SA71`, `06SA77`, `06SA79`, `06SC71`, `06SC77`, `06SC79`, `06UA35`, `06UA36`, `06UA37`, `06UA38`, `06UA45`, `06UA46`, `06UA48`, `06UC30`, `06UC35`, `06UC36`, `06UC37`, `06UC38`, `06UC45`, `06UC46`, `06UC48`, `06UC50`, `06UN35`, `06UN36`, `06UN38`, `06UN45`, `06UN46`, `06UN48`, `06UQ35`, `06UQ36`, `06UQ38`, `06UQ45`, `06UQ46`, `06UQ48`, `07CR12`, `07CR13`, `07ID11`, `07ID19`, `07KT10`, `07NC14`, `07NC15`, `07ND12`, `07ND13`, `07ND14`, `07NH11`, `07NH19`, `07NI11`, `07NI12`, `07NI19`, `07PH10`, `07PX10`, `07SD84`, `07SR11`, `07SR60`, `07SR84`, `07ST84`, `07TD10`, `07TR32`, `07VQ11`, `08HC11`, `08HC31`, `08HD11`, `08HD31`, `08HN11`, `08HN31`, `08SK10`, `08SM10`, `08SM30`, `08SV10`, `08SV30`, `09CA14`, `09CA15`, `09CA18`, `09CC18`, `09CC24`, `09CC25`, `09CC26`, `09CC27`, `09CC28`, `09CD14`, `09CD15`, `09CD17`, `09CD23`, `09CD24`, `09CD28`, `09CF11`, `09CF12`, `09CF18`, `09CM14`, `09CM15`, `09CM17`, `09CM23`, `09CM24`, `09CM28`, `09CS14`, `09CS15`, `09CS18`, `09CX14`, `09CX15`, `09CX18`, `09LA11`, `09LA12`, `09LC11`, `09LC12`, `09LD01`, `09LD11`, `09LD12`, `09LM01`, `09LM11`, `09LM12`, `09LO01`, `09LP22`, `09LS11`, `09LT22`, `09LX11`, `09M314`, `09M315`, `09MA13`, `09MA14`, `09MA15`, `09MC11`, `09MC12`, `09MD06`, `09MD07`, `09MM07`, `09MM08`, `09MS14`, `09MS15`, `09MV14`, `09MV15`, `09MX07`, `09MX08`, `09NA12`, `09NA13`, `09NA14`, `09NC11`, `09NC12`, `09NC22`, `09NC23`, `09ND07`, `09ND08`, `09ND09`, `09ND10`, `09NF20`, `09NM06`, `09NM07`, `09NND1`, `09NO04`, `09NP10`, `09NP11`, `09NP21`, `09NP22`, `09NR10`, `09NR11`, `09NS12`, `09NS13`, `09NT22`, `09NT23`, `09NV12`, `09NX06`, `09NX22`, `09NX23`, `09NY01`, `09OA10`, `09OA11`, `09OA18`, `09OC10`, `09OC11`, `09OC18`, `09OM10`, `09OM11`, `09OM18`, `09PND01`, `09SA11`, `09SA12`, `09SA17`, `09SC11`, `09SC12`, `09SC17`, `09SD11`, `09SD12`, `09SD17`, `09SG11`, `09SG12`, `09SG18`, `09SM11`, `09SM12`, `09SM17`, `09SR11`, `09SR12`, `09SR17`, `09SV11`, `09SV12`, `09SV17`, `09VC01`, `09VN01`, `10VA01`, `10VS01`, `14AA20`, `14AK20`, `14AL20`, `14BA01`, `14BA02`, `14BA13`, `14BA14`, `14BA15`, `14BB01`, `14BB02`, `14BB13`, `14BB14`, `14BC13`, `14BD01`, `14BD02`, `14BD13`, `14BD14`, `14BK01`, `14BK20`, `14BK21`, `14BL01`, `14BL21`, `14BL22`, `14BL23`, `14BN01`, `14BN20`, `14BN21`, `14BO01`, `14BO02`, `14BO20`, `14BO21`, `14BS14`, `14BS22`, `14BS25`, `14BS26`, `14BT01`, `14BT13`, `14BT14`, `14GC01`, `14GC02`, `14GC20`, `14GC21`, `14GK01`, `14GK11`, `14GK15`, `14GK21`, `14GK31`, `14GK35`, `14GK41`, `14GU10`, `14GU30`, `14SA10`, `14SD10`, `15BN03`, `15BN05`, `15BN40`, `16GD00`, `17SK01`

## Quy tac xu ly sau nay

- Neu chi thay canh bao `missing trigger refs`, chua du ket luan xoa CTKM. Can doi chieu voi danh muc san pham thuc te cua thang.
- Neu thay `CTKM mu gia`, uu tien bo sung `products.json` cho gift SKU truoc khi cho NVBH dung.
- Moi lan import/pull CTKM xong, vao tab KM de xem banner duplicate/missing refs.
- Moi lan sua danh muc SP/KM, chay them `node tests/data-validation.test.js`.