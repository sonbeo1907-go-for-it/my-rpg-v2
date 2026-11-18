# Phiên giải học viện — nền bước 1–3

> **Hiện trạng 18/11/2026:** Bước7–8 đã triển khai shop Huy Hiệu riêng và bốn siêu trùm hiếm. Xem [ACADEMY_TOURNAMENT_REWARDS_SPECIALS](ACADEMY_TOURNAMENT_REWARDS_SPECIALS.md) để biết luật hiện hành; phần mô tả “chưa thưởng/chưa boss” và bảng thưởng v1 bên dưới là lịch sử.


Triển khai 18/11/2026. Đây là dịch vụ core + lưu game, chưa có UI/combat adapter. enabled=false/data_only vẫn giữ; các hàm mở phiên là API nội bộ để tích hợp/kiểm thử, không phải đường vào sự kiện đã phát hành.

## Module

- tournament-session.js: phiên bất biến, revision chống lệnh cũ; mở/rút giải, đổi bốn người mượn, checkpoint, kết quả chờ/retry/confirm, First Clear và lịch sử.
- tournament-schedule.js: RNG theo seed, bốc thăm pot, 24 fixtures, standings, mô phỏng NPC.
- progression.js: trường tournaments tùy chọn trong save hiện hành v7; save cũ thiếu trường được khởi tạo rỗng. Không đổi namespace hoặc chạm file save thật khi test.

## Lưu và khôi phục

Mọi command trả campaign mới, không mutate đầu vào. Caller phải persist thành công trước publish, giống các action hiện hữu. Revision/runId chống thực thi hai lần trên trạng thái mới; việc điều phối hai lệnh cùng trạng thái cũ thuộc runtime lock khi nối UI. Không tự ghi disk trong core. Champion kết quả, history và First Clear cùng nằm trong một giá trị campaign mới để caller lưu nguyên tử.

Mỗi run lưu seeds, danh sách đội, đội hình, snapshot definition/teams/builds và bộ dữ liệu kỹ năng liên quan. Đọc lại dùng snapshot, không resolve phiên đang dở từ kit/config mới. Bốc thăm và kết quả mô phỏng không lưu RNG mutable: mỗi trận dùng substream seed riêng theo matchId; xem menu không tiêu RNG.

normalizeTournamentState kiểm cấu trúc, bốc thăm, quota, định danh và dựng lại chuỗi fixtures từ kết quả người chơi đã chốt. NPC results/phase/tie tasks giả hoặc chuyển vòng sớm bị từ chối. Checkpoint combat hiện là payload JSON giới hạn 2MB với matchId/seed; validate actor/turn/restore engine thuộc combat adapter bước tiếp theo. Chưa tuyên bố khôi phục trận thật hoạt động.

## Bảng đấu và mô phỏng

7A pot4 được gán bảng A; giới thiệu khóa bạn cũ pot3 cùng bảng. Bốn bảng, mỗi đội 3 trận, một cặp chỉ gặp một lần. Xếp điểm thắng3/thua0 → mini-table đối đầu giữa các đội bằng điểm → hiệu số người sống. Cụm vẫn bằng nhau và ảnh hưởng top2 được giải bằng playoff loại trực tiếp hữu hạn, shuffle seed để phân suất miễn lượt; 3 đội có 2 trận, 4 đội có 3 trận. Winner xếp đầu, loser chung kết kế tiếp; các vị trí không ảnh hưởng đi tiếp không tạo trận phụ.

Mỗi lượt có trận người chơi đang chờ: NPC chưa được mô phỏng/commit trước confirm. Khi confirm, các trận NPC còn lại của lượt được tính đúng một lần, sau đó mới chuyển lượt. Playoff NPC-only được xử lý tự động đến điểm người chơi cần act. Không lộ kết quả tương lai; visibleTournamentFixtures trả dữ liệu đã chốt và lịch của lượt hiện tại. Kết quả người chơi là input của adapter tương lai; API này không tự đánh combat.

Simulation playtest dùng rating + đa dạng role + hỗ trợ phòng thủ và nhiễu seed giới hạn bởi maxUpsetInfluence. Đội chủ chốt có rating cao hơn trong data, không cộng stat/đổi kit. Đây là mô hình ước lượng, không chạy AI combat và không chứng minh cân bằng. Cần playtest tỷ lệ đi tiếp theo đội sau khi duyệt roster.

## Kết thúc và chơi lại

Thắng chung kết bật First Clear; bị loại/rút lui không bật. Trước clear drawSeed giới thiệu giữ nguyên dù runId và combat seed mới. Sau clear pool selector mở 1–2 đội chủ chốt và drawSeed mới. special encounter chỉ có gate firstClearAtCreation, chưa tung xác suất hay tạo boss.

History giữ20 lượt, completedRuns/championships giữ tổng, bestPlacement giữ mốc tốt nhất (1/2/4/8/16; rút lui không cấp thứ hạng). Sổ thưởng giữ nguyên, chưa có payout. Không có reset theo ngày. Chơi lại được ở API sau kết thúc; nút UI chưa triển khai.

## Nghiệm thu

Test đi qua encodeGameSave/decodeGameSave thật: save cũ, pending result, retry, checkpoint, giải vô địch/bị loại, playoff bằng điểm và replay. Snapshot không bị đổi khi content hiện hành đổi. Chưa cần E2E vì chưa có route/UI; combat lifecycle và kiểm thử engine thật là việc của bước adapter.


## Cập nhật bước 4–5 — bản chơi thử

Đã mở `/chronicles/academy` từ kệ sách; có combat adapter, lưu/khôi phục trận thật, chuẩn bị/trinh sát, bảng giải và kết quả/replay UI. Xem [Combat và UI giải học viện](ACADEMY_TOURNAMENT_COMBAT_UI.md). enabled=true/publication=playtest thay ghi chú data_only/chưa có UI ở các phần lịch sử. Chưa payout, hoàn thiện NPC hoặc boss hiếm.
