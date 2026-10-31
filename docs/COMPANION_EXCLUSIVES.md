# Trấn Phái và ba câu chuyện đồng hành

## Nội dung

- Victorina — **Hoa Hồng Không Cúi Đầu** (3 chương).
- Monica — **Thời Gian Không Chờ Ai** (3 chương).
- Sieg — **Nơi Dòng Sông Gọi Là Nhà** (3 chương).

Cả ba dùng cơ chế truyện gacha chung: phải hoàn thành toàn bộ truyện Iris, Fiona và Takeshi; không yêu cầu sở hữu hoặc đưa nhân vật vào đội. Chương sau mở bằng lần thắng đầu của chương trước. Các trận truyện không vào pool Quest hoặc hầm ngục ngẫu nhiên.

Chương I/II thưởng lần đầu **500 Coin + 5 Pure Prisma**, cộng phần thưởng thắng trận thông thường 50 Coin. Chương III thưởng lần đầu **5 Pure Prisma + 1 Original Prisma**, cộng 150 Coin. Công thức Trấn mở ở chương II. Chỉ chế tạo khi sở hữu nhân vật; chi phí và tái rèn theo hệ thống Trấn hiện có.

## Quy tắc Trấn

| Trấn | Hiệu lực |
| --- | --- |
| Chiếc Đồng Hồ Cầm Tay Bạc | Trường của Monica kéo dài 3 vòng thay vì 2, tính cả vòng thi triển. Khi trường do chính Monica tạo còn hiệu lực, tăng 25% MAG. Lượt Phụ không tiêu thời hạn trường. Dùng lại làm mới, không cộng dồn. |
| Tấm Khiên Hoa Hồng Kiêu Sa | Khi khiên của Victorina bị đánh vỡ, người mang còn sống hồi thêm HP bằng 35% trung bình DEF/RES hiện tại của Victorina. Hồi HP và MP dùng chung hạn mức 1 lần/người/vòng. MP đầy vẫn được hồi HP. Không hồi sinh; không kích hoạt khi thay/hết khiên hoặc Victorina đã gục. |
| Ngân Triều Kiếm | Nội tại +8% sát thương của Sieg áp dụng cho mọi đồng minh đang có khiên, bất kể nguồn khiên. Sieg phải còn sống; bản thân Sieg không nhận hai lần. Hiệu lực cùng loại lấy mức cao nhất. |
| La Bàn Dẫn Đường | Giữ phản công 85% ATK và tăng Thư Khẩn lên 3 lượt chính của Chelsea (cả ATK và Khiêu khích). |

HP hồi làm tròn theo hàm hồi HP chung; MP hồi làm tròn lên theo nội tại gốc. Bonus MAG của Monica được gỡ khi trường hết hạn hoặc bị thay, được đồng bộ khi chuyển đợt truyện.

## Boss

Rauth, Nguyên Mẫu 07 và Thạch Nhân Sông Cạn là boss thường không phase. Mỗi boss dùng một hành động trong lượt chính, rotation ghi trong dữ liệu. Thiếu MP hoặc chiêu còn hồi thì dùng đòn miễn phí.

**Nghiền Nát Chiến Tuyến** của Rauth có bước vận sức thay cho một hành động. Cảnh báo hiện trên bàn đấu đến lượt chính tiếp theo, sau đó mới trả MP và tung đúng một đòn diện rộng. Lượt Phụ không giải phóng chiêu. Nếu mục tiêu cũ mất thì chọn mục tiêu hợp lệ; thiếu MP lúc tung thì chuyển sang đòn miễn phí. Choáng trì hoãn đến lượt có thể hành động.

Các quái học viện mới: Bút Lông Nhiễu Thời, Đồng Hồ Cát Bất Ổn, Dư Ảnh Thuật Thức và Trục Đồng Bộ Bất Ổn. Hệ số và rotation boss nằm trong `data/abilities.json`, `data/enemies.json`; waves và thưởng trong `data/encounters.json`.

## Hook dùng lại

`exclusive-hooks.js` hỗ trợ passive `bundle` gồm các hook độc lập, không bundle lồng nhau. ID kỹ năng/hiệu ứng chọn hook, không kiểm tra tên hiển thị.

- `field_duration`: tăng thời hạn của `turn_order_field` theo `abilityIds`.
- `field_stat_boost`: bonus chỉ số khi trường do người mang tạo còn hiệu lực.
- `shield_break_restore_hp`: bổ sung hồi HP vào sự kiện nội tại khiên vỡ.
- `share_shielded_passive`: chia sẻ nội tại tăng sát thương khi có khiên, lấy mức cao nhất.

Field lưu `abilityId` cùng `sourceId` để tránh bonus từ trường của người khác. Save chỉ lưu trang bị/tiến độ như trước; không tăng phiên bản save và không chỉnh file save thật.

## VFX Arthur

`hero_mastered` là nhát chém Ogre’s Bane đỏ/đen với lõi sáng vàng và ấn Prisma tại mục tiêu. `hero_flash` là một đường kiếm sáng rộng ngang đội hình địch. Mỗi lần thi triển chỉ sinh một signature SVG; số sát thương, chặn khiên và né vẫn hiện riêng. Không thay RNG, damage hoặc tài nguyên. Hoạt ảnh hữu hạn, hỗ trợ tốc độ nhanh và giảm chuyển động.

Ba bìa truyện là SVG do người dùng cung cấp, lưu trực tiếp trong `public/art/story-victorina.svg`, `story-monica.svg` và `story-sieg.svg`. Không dùng script sinh ảnh cũ để ghi đè các bản này. Kiểm thử bổ sung: `test/three-stories-exclusives.test.js`, `e2e/companion-exclusives.spec.ts`.
