# Senya — Thợ Săn Trong Làng

- **Vai trò:** DPS vật lý hệ Thường, dùng Hồn Kiếm.
- **Phe:** `hunters_guild`.
- **Release ID:** 101.

## Kỹ năng

| ID | Tên | Chi phí | Hiệu ứng |
| --- | --- | --- | --- |
| `senya.slash` | Nhát Săn | 3 MP, không CD | 120% ATK, vật lý Thường + Hồn Kiếm. |
| `senya.hunt` | Dấu Chân Trong Rừng | 8 MP, CD 2 | Tạo 1 Hồn Kiếm; hồi HP bằng 100% ATK. |
| `senya.fulfill` | Khép Vòng Săn | 24 MP hoặc 3 Hồn Kiếm, CD 2 | 3 hit × 150% ATK, vật lý Thường + Hồn Kiếm. |

## Nội tại

`Nhịp Săn`: sau khi bản thân thực sự tiêu Hồn Kiếm, nhận `senya_blood_hunt` (+30% ATK) trong 3 lượt chính.

## Mở khóa

- Nhân vật: thắng `east_ke_03` với Arthur trong đội.
- Ô trang bị:
  1. Thắng `east_ke_03` với Senya trong đội.
  2. Thắng `east_ke_06` với Senya trong đội.
  3. Thắng `east_ke_08` với Senya trong đội.

Ba mốc được ghi bằng `partyClearFlags`; mỗi mốc mở thêm 1 ô trang bị cho Senya (tổng cộng 3 ô).
