# Gear Hồn Kiếm và Trấn Amiya/Kaguya — 09/11/2026

## Gear hiệu ứng mới

### Giếng Hồn Kiếm — `soul_wellspring`

- MP của người trang bị tăng **20%**.
- Khi người trang bị **trực tiếp tạo Hồn Kiếm bằng hiệu ứng kỹ năng**, hồi **3% MP tối đa cho cả đội**.
- Một lần kích hoạt cho mỗi hành động tạo Hồn Kiếm, kể cả khi kỹ năng tạo nhiều hơn một.
- Nhóm hiệu ứng `gear_soul_wellspring`; không cộng dồn với trang bị cùng tên/nhóm trên cùng người.

### Ấn Lò Hồn Kiếm — `soul_forge_sigil`

- ATK và MAG của người trang bị tăng **15%**.
- Khi người trang bị tiêu Hồn Kiếm bằng kỹ năng, mỗi Hồn Kiếm đã tiêu khuếch đại sát thương thêm **8%**.
- Áp dụng cho toàn bộ đòn sát thương của kỹ năng đã tiêu Hồn Kiếm, gồm đòn đơn mục tiêu và diện rộng.
- Nhóm hiệu ứng `gear_soul_forge`; không cộng dồn với trang bị cùng tên/nhóm trên cùng người.

## Trấn Phái mới

### Amiya — Đèn Hồn Kiếm `amiya.lantern`

- `exposure_stack_bonus` cho `amiya.strike`.
- Mục tiêu chính nhận **3 tầng Sơ hở Hồn Kiếm** (2 gốc + 1).
- Mục tiêu phụ nhận **2 tầng** (1 gốc + 1).
- Không đổi các kỹ năng khác của Amiya.

### Kaguya — Nôi Trăng Hồn Kiếm `kaguya.moon_cradle`

- `soul_create_team_base_stat`, `amount:4`, `stats:['defense','resistance']`, `maxStacks:3`.
- Mỗi khi Kaguya tạo Hồn Kiếm bằng kỹ năng, toàn đội nhận **+4 DEF và +4 RES căn bản** đến hết trận.
- Mỗi kỹ năng tạo Hồn Kiếm chỉ cộng một tầng, kể cả kỹ năng tạo nhiều Hồn Kiếm.
- Tối đa **3 tầng** (+12 DEF/RES căn bản). Cộng vào căn bản trước các buff phần trăm.

## Kiểm chứng

`test/soul-gear-exclusives.test.js` khoá:

- hai recipe gear và hai Trấn hợp lệ;
- MP +20%, ATK/MAG +15%;
- hồi 3% MP đội khi tạo Hồn Kiếm;
- +8% sát thương mỗi Hồn Kiếm tiêu thụ;
- Amiya +1 tầng cho cả mục tiêu chính/phụ;
- Kaguya cộng đúng 3 tầng và dừng ở trần.
