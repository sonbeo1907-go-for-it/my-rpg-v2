# Trạng thái gameplay hiện hành

Rà soát 03/11/2026. Trang này thay bảng roster nguyên mẫu; thông số đọc từ JSON, [catalog nhân vật](CHARACTER_CATALOG.md) và tài liệu chuyên đề.

| Hệ thống | Trạng thái |
| --- | --- |
| Combat | Vòng Chính/Phụ, Rank/loadout, mode/companion, phản công/Liên kích, status/weakness, boss nhiều phase |
| Nhân vật | Sáu starter; roster bổ sung qua gacha/nguồn riêng; Astoria chỉ developer. Level 1–50, phân bổ, Đột Phá và Rank riêng |
| Quest | Thảo Phạt, Truy Nã, Hiểm Ác; năm độ khó 5/15/25/35/45 cho normal/boss/bounty, mặc định Rất dễ |
| Lữ Hành | Chín sách hiện có; ba chương Lv10/20/30, epilogue Arthur Dễ/Thường/Khó Lv1/30/60; yêu cầu đội theo từng màn |
| Chronicle | Quyển I theo địa điểm; Quyển II phiên pháo đài, khóa đội/gear, HP/MP xuyên encounter; có checkpoint combat riêng |
| Dungeon | Mỏ vàng, Hiểm trở, Rèn Luyện, Phá Giới; wave/snapshot, quota ngày hoặc hồi lượt |
| Auto/Quét | AI chung với Arena; farm 1–999; quét ở xác nhận, cần đã thắng đúng độ khó; có BattleResult |
| Kinh tế | Gacha 30/50/18,5/1,5%, pity50; 600 Coin/Prisma; 1 Vé/nhân vật tự chọn; thưởng ngẫu nhiên Coin/Vụn và Blueprint Truy Nã |
| Gear | 3→6 ô thường theo dupe, ô Trấn riêng; T4 chỉ số/hiệu ứng, tái rèn có kết quả chờ, mở công thức |
| Nhiệm vụ ngày | Sáu nhiệm vụ/sáu mốc; Original ở mốc6, tối đa4 Thẻ Quét/ngày từ nhiệm vụ và mốc |
| Arena | AI offline, Tìm Trận/Luyện Tập; snapshot luật bất biến, soft cap/chống loop, không thưởng PvE |
| UX | Target card bốn góc cam, tooltip hover/focus, tay cầm, turn order chuyển động, VFX từ event, Settings log/BGM/logo |
| Save | Envelope v7; AppData slot JSON, backup/revision, giữ namespace legacy; UI không Import/Export |

**Đã gỡ:** Hầm Ngục Ảo Ảnh, node/endless/loot rủi ro. Module legacy chỉ để tương thích save. Không khôi phục từ GDD cũ.

**Chưa triển khai:** online PvP, app admin/banlist ngoài EXE, update service/cloud save; chưa có nhân vật Nguyệt chính thức. Không suy ra thời hạn ra mắt từ tên prototype.

[ENGINE_RULES](ENGINE_RULES.md) ghi luật chung; [INDEX](INDEX.md) dẫn ngoại lệ. Test tự động không chứng nhận roster cân bằng hoàn toàn hoặc tương thích mọi tay cầm thật.
