# Phân tích STYLE GAP — 20 khung hình chuẩn vs. pipeline hiện tại

Nguồn: 20 frame cắt từ video chuẩn (`short01..10 × 0060/0180`), đối chiếu với
`references/STYLE_BIBLE.md`, 8 report đo đạc trong `references/reports/`, và code hiện tại
`src/videos/fake-job/` + `templates/bridge/`. Mục tiêu: liệt kê **cần thay đổi gì** để hình ảnh
đạt mức tương đương. Mỗi mục ghi file chịu trách nhiệm (owner).

---

## A. DNA hình ảnh của video chuẩn (rút ra từ 20 frame)

### A1. Từ vựng cảnh quay — rất đa dạng, không đóng khung một chỗ
20 frame trải qua **17 bối cảnh khác nhau**: boong tàu, quán saloon, ống nhòm POV, thang trên
hull tàu, quảng trường đêm, phố cao bồi, phố mưa, phòng ngủ, vé số close-up, nghĩa trang tuyết,
văn phòng, cửa tiệm, phòng thẩm vấn, cao ốc đêm, bếp, phòng khách đêm…
Trong đó có **3 loại shot mà pipeline hiện tại không có**:
1. **Insert/POV**: nhìn qua vật thể (ống nhòm tròn, lỗ châu mai tròn) — viền vật thể tối đen làm
   khung, tâm nét, DOF nặng; hoặc insert graphic toàn khung (vé số, ảnh polaroid, màn hình điện thoại).
2. **Góc cực đoan**: nhìn thẳng xuống (thang trên hull — nhân vật nhỏ xíu giữa khung lớn),
   góc thấp ngước lên, wide nhân vật nhỏ trong cảnh lớn.
3. **Insert vật thể kể chuyện**: vé số, điện thoại, ảnh — đạo cụ "nói" thay lời thoại.

→ **Quy tắc của chuẩn: mỗi câu được minh họa theo nghĩa đen, đạo cụ gánh câu chuyện.**

### A2. Ánh sáng = kịch tính theo beat, không phải một preset duy nhất
Ba chế độ xuất hiện lặp lại:
- **Day** (phố cao bồi, tiệm "OUR WINNERS", bếp, văn phòng): sáng bão hòa, bầu trời xanh đậm
  (#238bf4-#0a6beb đo được), bóng mềm, ánh sáng xiên qua cửa sổ tạo **vệt sáng sàn** (phòng thẩm vấn).
- **Golden** (hiếm hơn): nắng ngược (backlit), bóng tím lam trên nền cam.
- **Night-blue** (nhiều nhất trong 20 frame: nghĩa trang tuyết, saloon đêm, poker, phố mưa,
  cao ốc, phòng khách, nút bấm): nền **navy/tím đậm**, chỉ **một điểm nhấn ấm duy nhất**
  (cửa sổ đèn vàng, đèn lồng, mặt trăng, nút đỏ, màn hình điện thoại) có **glow/bloom** rõ.
→ Trong mỗi frame, nhân vật bị **ánh sáng cảnh tint** (bên sáng ấm / bên tối lam-tím), không bao giờ
phẳng màu. Chi tiết đo được (lighting.md): đầu nhân vật V≈.97 mọi lighting, gradient sáng-tối .14,
rim nhẹ — **đầu luôn sáng**, tint theo cảnh chứ không tối xỉn.

### A3. Màu & grade (đo từ 2.164 frame — grade.md)
- Day: median Y' **.57**, non-ink p5 **.23** (không có vùng đen chết), p99 .97 (có near-white),
  C* p90 **~55** (rất bão hòa), blacks lift ấm (35,19,20), **vignette 0.86** (tối góc 14%).
- Night: p2 .03-.11 (dark sâu thật), nhưng dark vẫn có **sắc** (xanh/tím), không xám.
- Saturation tổng .38-.65 — **bão hòa cao hơn nhiều mức hiện tại**.

### A4. Texture = vẽ tay, mảng phẳng, đường chỉ mảnh
- Mỗi bề mặt = vài **mảng màu phẳng** (L* 72-80 cho gỗ sáng; **không bao giờ dưới L* 19**),
  đường kẻ (khe ván, mạch gạch) **3-5 px @1080**, mảnh và sạch.
- Biến thiên tông chỉ ở mảng lớn; không có noise/bump giả.
- Gỗ, vân damask (giấy dán tường saloon), gạch men xanh (phòng thẩm vấn), gạch hoa (sàn bếp),
  kính cao ốc, tuyết, mái ngói — **đủ loại vật liệu**, mỗi loại một treatment riêng.

### A5. Nhân vật = blob 2D phẳng + phụ kiện + biểu cảm
- Đầu bean (H/W .93), viền mảnh (đậm gấp ~3 ở cạnh dưới/bên tối), mắt chấm/mí nặng, **không blush,
  không catchlight**. Người cao ~3.5 head-heights, tay chân **que mảnh** (0.055 bề rộng đầu), bàn tay chấm mực.
- **Phụ kiện tạo tính cách**: mũ (thuyền trưởng, cao bồi, đầu bếp, khăn trùm, len, đèn đội đầu),
  kính, râu, cà vạt, áo khoác — mỗi nhân vật một silhouette riêng.
- **Dấu cảm xúc vẽ tay**: giọt mồ hôi, lông mày nhíu, răng nghiến, miệng méo.
- 14 biểu cảm là đúng hướng; nhưng chuẩn dùng **kho phụ kiện + pose** nhiều hơn để phân biệt nhân vật.

### A6. FX = sprite 2D phẳng ghép vào cảnh 3D
Mưa (sọc + mặt đường ướt), tuyết (hạt to/thô/nhòe = DOF), sparkle/glitter (vé số), glow burst
(nút bấm, con số), speed lines (hậu cảnh POV), **ghost/dissolve chuyển cảnh** (frame tàu ma),
bụi, vệt sáng. Tất cả là sprite vẽ phẳng, không phải particle 3D vật lý.

### A7. Caption
Trắng đậm + viền đen mảnh, giữa-dưới, đổi theo từng từ. (RULE của chúng ta: **không làm trừ khi
user yêu cầu** — chỉ ghi nhận để hỏi khi cần.)

---

## B. Đối chiếu với pipeline hiện tại — thiếu gì, ở file nào

| Layer | Chuẩn | Hiện tại | Gap |
|---|---|---|---|
| **Bối cảnh** (A1) | 17 set + insert/POV + object close-up | 1 diorama (văn phòng + két + hang hacker), mọi beat quanh bàn giám sát | **LỚN NHẤT**: thiếu minh họa nghĩa đen, thiếu insert, thiếu POV, thiếu góc cực đoan |
| **Ánh sáng** (A2) | 3 mode, vệt sáng cửa sổ, pool đèn, tint nhân vật | day + golden (lights.ts); cardshade tint nhân vật đã có ✓ | Thiếu **night-blue**, thiếu vệt sáng/pool, thiếu glow nguồn sáng |
| **Grade** (A3) | Y'.57 / p5 .23 / C*90 55 / blacks ấm / vignette .86 | GRADE_DAY2/GOLDEN2 đã fit rounds trước ✓ nhưng cần verify lại trên frame mới; **không có night** | Thêm GRADE.night; nới saturation; kiểm tra blacks ấm |
| **Texture** (A4) | Mảng phẳng, đường 3-5px, L*≥19, đủ loại vật liệu | paint.ts procedural (planks/brick/cobble/stone…) nhưng world dùng mảng màu đơn giản; tường văn phòng phẳng | Thêm giấy dán tường/gạch hoa/gương/kính; tăng chi tiết bề mặt; tránh tối đen (L*<19) |
| **Nhân vật** (A5) | 3.5 HH, que mảnh, phụ kiện, dấu cảm xúc | toon.ts: bean head, plum ink, 14 expr, mũ/râu ✓; cardshade giữ đầu sáng ✓ | Thêm phụ kiện (kính, khăn, cà vạt, đèn đội đầu), thêm dấu mồ hôi/răng nghiến linh hoạt, thêm pose |
| **FX** (A6) | Mưa/tuyết, sparkle, glow, speed lines, dissolve | fxBill/fxPuff/fxStars + fx check/glitch | Thêm **fxSparkle, fxGlow, fxShaft (vệt sáng), fxRain/fxSnow**; dùng dissolve 6-8f khi đổi bối cảnh |
| **Post** (A7) | Glow e-fold 14-21px@720, DOF nền 1/3 shots, DOF tiền cảnh 20% | bloom thr 1.0 nhưng nguồn phát sáng yếu (p99.9≈.81 → bloom gần như không chạy — depth.md); DOF table có nhưng cInf cần đẩy theo chuẩn CU 15-16 | Tăng emissive màn hình/đèn/mặt trời >1.0; thêm foreground blur; thêm vignette mạnh hơn |
| **Caption** (A7) | 1 từ/lượt, trắng viền đen | không có (đúng RULE) | Hỏi user nếu muốn bật |
| **Camera** | Glide symmetric (đã đúng theo motion.md), rolls 4-5°, kicks 7f ✓ | story.ts đã đạt grammar ✓ nhưng **thiếu shot variety** (POV/insert/góc cực đoan/wide nhỏ) | Mở rộng shot vocabulary trong story.ts + thêm satellite sets |

**Kết luận cốt lõi:** phần "máy" (ink, camera grammar, card shading, DOF, grade fit) đã gần chuẩn —
điểm tụt bây giờ nằm ở **(1) bối cảnh/đạo cụ nghèo nàn, (2) thiếu night-blue + ánh sáng kịch tính,
(3) thiếu insert/POV shot, (4) emissive/glow quá yếu, (5) FX thời tiết/atmosphere**.

---

## C. Kế hoạch thay đổi — theo mức ưu tiên

### P0 — Cải thiện lớn nhất trên mỗi giờ công (không đổi kịch bản)
1. **Thêm mode `night`** (lights.ts + shade.ts + grade.ts): navy/tím đậm + một nguồn ấm + glow.
   Chuyển beat 8-10 (vỡ két → "no new job" → hacker) sang **night-blue** thay vì day — đúng luật
   "lighting đổi theo beat" của chuẩn. Beat 12-13 giữ golden. → owner: world/lighting.
2. **Bật glow đúng nghĩa**: nâng emissive màn hình/đèn bàn/lõi AI/mặt trời vượt ngưỡng bloom (1.0),
   thêm nguồn sáng thật (PointLight bàn làm việc, đèn trần), vệt sáng cửa sổ chiếu sàn. → world.ts, Bridge.tsx.
3. **Insert shots trong story.ts**: 3-5 shot insert toàn khung hoặc cận vật thể (bài test dạng
   gói hàng/USB, dấu tích xanh khổng lồ, đồng hồ "2024", màn hình điện thoại rung) — minh họa nghĩa đen. → story.ts + world.ts.
4. **Dissolve 6-8f khi đổi bối cảnh** (đã có sẵn cơ chế layersAt alpha trong Bridge.tsx) — thay vì
   camera "đi xuyên tường" giữa các khu. → story.ts (layersAt).

### P1 — Nâng chất lượng vật liệu & nhân vật
5. **Giàu hóa set chính**: giấy dán tường/sơn có hoa văn cho tường văn phòng, gạch hoa sàn,
   rèm cửa, khung ảnh, sách, cốc cà phê, giấy tờ — tăng mật độ đạo cụ lên mức "bận mắt" như chuẩn. → world.ts/build.ts/paint.ts.
6. **Kho phụ kiện nhân vật**: kính, khăn trùm đầu, cà vạt, áo khoác, đèn đội đầu; thêm dấu
   mồ hôi/răng nghiến hoạt theo beat (đã có nền tảng `nervous` sweat). → toon.ts/cast.ts.
7. **FX atmosphere**: sparkle (check/AI), glow burst (mở két), speed lines (glitch), hạt bụi/nhấp nháy
   tiền bay có glitter. → cast.ts (fx) hoặc fx mới trong toon.ts.

### P2 — Đánh bóng
8. **POV/framing devices**: shot nhìn qua khung cửa/monitor viền tối (giống ống nhòm), foreground
   silhouette (đèn, cây, vai người) mờ — FOREGROUND đã có nền tảng. → story.ts/world.ts.
9. **Caption** (tùy chọn — hỏi user): 1 từ/lượt, trắng viền đen, giữa-dưới.
10. **Verify bằng số liệu**: render stills → chạy lại phép đo của reports (median Y', p5, C*, bloom
    threshold, DOF sigma) cho tới khi khớp bảng A3.

### Không làm
- Không đổi camera grammar (đã khớp motion.md: glide symmetric, push 0.15-0.35%/f, rolls, kicks).
- Không đổi tỷ lệ nhân vật/đầu (đã khớp characters.md sau các round).
- Không thêm grain (chuẩn không có grain).

---

## D. Quy trình thực hiện (theo look-match loop trong SKILL.md)
1. Chốt P0 trước (night + glow + insert + dissolve) → render stills 2 độ phân giải (1080 + 2K).
2. So sánh số liệu với `references/reports/` (grade.md §0, lighting.md §0, depth.md §0).
3. P1/P2 theo thứ tự, mỗi vòng một owner một file, có sandbox như SKILL.md mô tả.
4. Verify bằng sheet so sánh trực tiếp (`scripts/sbs_sheet.py`) với 20 frame chuẩn này.
