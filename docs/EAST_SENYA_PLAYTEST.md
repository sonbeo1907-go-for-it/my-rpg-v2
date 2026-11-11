# Bộ seed F2P Senya · Thảo Phạt Phương Đông

Đối chiếu ngày 11/11/2026. Đã `git fetch origin main`; local `main` và `origin/main` cùng commit **7c7f9e6** (`Merge pull request #10`, 08:19:15 giờ Việt Nam), ahead/behind **0/0** trước khi tạo công cụ kiểm thử. Không sửa thông số gameplay hoặc save người chơi.

## Dữ liệu và phạm vi

- Factory: `scripts/fixtures/east-senya.mjs`.
- Runner: `scripts/east-senya-playtest.mjs`.
- Regression: `test/east-senya-playtest.test.js`.
- Snapshot kết quả: [EAST_SENYA_PLAYTEST_RESULTS.json](EAST_SENYA_PLAYTEST_RESULTS.json).
- 30 seed chung: **2026111101–2026111130**. Có thể chỉ định riêng một seed bằng `--seed`.
- Milestones gồm 8 sự kiện chính, boss cuối mỗi nhóm (05/10/15/20/25) và replay nhận ô Senya ở sự kiện 3. Tổng **192 case × 30 seed = 5.760 lượt**.
- Đối chiếu thêm AI auto-farm thật: 10 case smoke × 30 seed = **300 lượt**.
- Tổng **6.060 lượt**, **0 lỗi thực thi**. Kết quả thua/hòa/chạm giới hạn vẫn được giữ, không tính thành thắng.

Mỗi case là một encounter độc lập. Các màn cần thiết trước đó được tạo receipt bằng reward handler để dựng trạng thái mở khóa; **không có nghĩa các lượt mô phỏng này đã đánh thắng toàn bộ chiến dịch liên tục**. Các nhóm thảo phạt trong suite milestones dùng mức mặc định; suite full mới mở ma trận cả Lv35/45/55. Chưa chạy suite full.

## Sáu đội miễn phí

| ID | Đội hình, theo thứ tự ô |
| --- | --- |
| `starter_control` | Arthur / Iris / Garrek / Elaine |
| `senya_guard` | Senya / Iris / Garrek / Elaine |
| `senya_arthur` | Senya / Arthur / Iris / Elaine |
| `senya_fiona` | Senya / Fiona / Iris / Elaine |
| `senya_takeshi` | Senya / Takeshi / Iris / Elaine |
| `senya_two_guards` | Senya / Arthur / Garrek / Elaine |

Không có nhân vật gacha. Trước khi nhận Senya ở sự kiện 3 chỉ dùng đội đối chứng. Sự kiện 3 yêu cầu Arthur: case replay Senya luôn có Arthur cùng đội.

## Ba build

| Build | Level / Rank | Gear |
| --- | --- | --- |
| `entry35` | Lv35 / Rank3 | T2, dòng +3 |
| `progress45` | Lv45 / Rank4 | T3 chuyên biệt, dòng +5 |
| `endgame50` | Lv50 / Rank5 | T3 chuyên biệt, dòng +5 |

- Phân bổ toàn bộ điểm đúng giới hạn Level và chi phí từng chỉ số. Ưu tiên ATK cho DPS vật lí, MAG cho Fiona/Elaine, DEF cho Garrek, MP/HP cho Iris. Chi tiết từng người được ghi trong metadata và file fixture.
- Ba câu chuyện Iris/Fiona/Takeshi, thử thách tay sai vua chằn và Hắc Ảnh Arthur Dễ được coi là đã hoàn thành. Không tự mở Hắc Ảnh Thường/Khó, Ogre's Bane hoàn toàn hoặc Thông Thạo.
- Starter mang đúng 3 món thường; không Trấn, T4, vật phẩm tiêu hao hoặc buff ngoài trận. Đây là mức build kiểm soát, **không phải trần sức mạnh F2P**.
- Mở khóa Senya không tặng luôn ô thứ 4. Factory ghi một lần replay sự kiện 3 với Senya + Arthur trước các màn sau đó.
- Trước Chiyoko: Senya có **4 ô**. Sau khi đã clear Chiyoko cùng Senya: **5 ô**. Trước Orochi vẫn chỉ **5 ô**; ô thứ 6 không được dùng để đánh chính trận mở nó.
- Đội đối chứng vẫn có thể đã sở hữu Senya trong túi nhân vật sau sự kiện 3, nhưng không đưa cậu ấy vào trận.

## Cách chạy

Tại thư mục gốc dự án:

```powershell
# Bộ nhỏ, 10 case, 30 seed; kết quả và fixture vào thư mục ignored.
node scripts/east-senya-playtest.mjs --suite smoke --seeds 30

# Các mốc chính: 192 case, 30 seed.
node scripts/east-senya-playtest.mjs --suite milestones --seeds 30

# Dùng đúng planner của auto-farm trong game.
node scripts/east-senya-playtest.mjs --suite smoke --seeds 30 --policy arena --out test-results/east-senya-auto

# Chỉ sinh fixture + manifest cho toàn bộ màn và ba độ khó, chưa chạy trận.
node scripts/east-senya-playtest.mjs --suite full --generate-only --out test-results/east-senya-full-fixtures

# Tái hiện một trận thua Chiyoko của policy cố định.
node scripts/east-senya-playtest.mjs --case senya_guard__endgame50__east_ke_06__east_45 --seed 2026111104 --out test-results/east-senya-repro
```

Mỗi thư mục output chứa `manifest.json`, `fixtures/<case>.json` dạng save v7 hợp lệ, `summary.json` và `<case>.json` với từng seed. `--generate-only` tạo `fixture-index.json` thay cho kết quả trận. Đây là dữ liệu test riêng, không tự ghi vào AppData hoặc thay hồ sơ thật.

## Kết quả nổi bật

Đội Senya chính: Senya / Iris / Garrek / Elaine. Đối chứng: Arthur / Iris / Garrek / Elaine. Cả hai Lv50/Rank5/T3, nhưng Senya được mang số ô đã mở hợp lệ theo tiến trình — đây không phải phép so sánh kit với số món giống nhau.

| Màn | Đội đối chứng, policy cố định | Đội Senya, policy cố định | Đội Senya, AI auto-farm |
| --- | --- | --- | --- |
| Jorōgumo Lv45 | 15/30 thắng | **30/30**, trung bình 32 vòng | 16/30 thắng |
| Chiyoko Lv45 | 0/30 | **24/30**, trung bình 27,04 vòng khi thắng | 0/30 |
| Orochi Lv55 | 0/30 | 0/30 | 0/30 |

Với đội Senya ở Lv45/Rank4/T3: Jorōgumo đạt 30/30 nhưng Chiyoko chỉ 2/30 ở policy cố định. Đây là một mốc tăng áp lực cần playtest thủ công.

Seed 2026111101 thắng Chiyoko bằng policy cố định; seed **2026111104 thua** với cùng fixture. Orochi seed 2026111101 đưa boss tới phase 2 rồi thua: trace giữ phase, số Hồn Kiếm tạo/tiêu, HP/MP và 10 dòng log cuối để tái hiện.

## Giới hạn diễn giải

- `senya-f2p-heuristic-v1` là policy có quy tắc và biết bộ kỹ năng F2P, không phải người chơi tối ưu. `--policy arena` dùng `planAutoBattleTurn` hiện hành; tên option là tên planner, trận vẫn là PvE, không áp soft cap hoặc chuẩn hóa PvP.
- Chênh lệch **24/30 so với 0/30 ở Chiyoko** cho thấy quyết định hành động ảnh hưởng lớn. Không dùng kết quả auto một mình để kết luận nhân vật yếu hoặc boss không thể thắng.
- Orochi 0/30 ở các build này là tín hiệu rà soát finale/build/policy; chưa chứng minh mọi đội miễn phí đều không vượt được.
- Giữ nguyên HP/MP, trạng thái, cooldown, tài nguyên qua đợt bằng `createStoryRun`/`advanceStoryWave`. Không hồi đầy giữa đợt, không chỉnh stats địch.
- Giới hạn runner: 100 vòng tích lũy / 1.800 hành động; giới hạn hòa riêng của engine vẫn có hiệu lực. `bounded` trong bảng gồm cả hòa của engine và hết budget runner, không phải chiến thắng.
- `minHp`/`minMp` là đáy quan sát sau hành động, không phải đáy bên trong chuỗi hit hoặc trước một lần hồi tức thời.

## Kiểm chứng công cụ

27 regression liên quan đã qua: cơ chế Phương Đông, Senya và factory/runner. Có kiểm tra save round-trip cho cả 192 fixture, quyền sở hữu đúng mốc, ô chưa mở, Rank đúng Level, replay, RNG tái hiện, carry qua ba đợt, planner thật và không mutate campaign/template. `npm.cmd run validate` và cập nhật graph local đã hoàn tất. Task này không thay gameplay và không cần build EXE.
