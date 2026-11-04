# Trạng thái khắc chế hỗ trợ

Phong Ấn (`buff_seal`): một lần chặn buff mới, duy trì tới khi dùng hết/bị giải. Không xóa buff cũ; chặn riêng từng status, gồm Hộ Ấn. Mode và tài nguyên không phải status. Hộ Ấn có trước chặn Phong Ấn.

Vết Thương Sâu (`deep_wound`): giảm 40% mọi HP hồi nhận trong hai lượt chính của người mang, gồm hút máu/gear/nội tại/regen; không tác động MP.

Rạn Khiên (`shield_fracture`): giảm 35% khiên mới nhận trong hai lượt chính; khiên cũ giữ nguyên. Vẫn dùng quy tắc khiên mạnh nhất.

Nhiễu Ma Lực (`mana_disruption`): một lần, tăng 50% chi phí sau mọi điều chỉnh, làm tròn lên; chỉ tiêu khi thi triển hợp lệ và trả MP. Kỹ năng 0 MP hoặc trả bằng tài nguyên thay thế không tiêu.

Cả bốn có thể bị giải như debuff và bị Hộ Ấn chặn khi đến từ địch. Áp dụng lại làm mới, không cộng tầng. Hiệu quả giảm hồi/khiên khác nguồn chỉ lấy mức mạnh nhất. Hiệu ứng theo lượt không giảm trong Lượt Thêm. Các status là khung reusable dùng chung, không độc quyền Sandra. Sandra hiện cấp Phong Ấn/Nhiễu Ma Lực; Tywin dùng Vết Thương Sâu. `effect.charges` cấp số lần riêng cho Phong Ấn/Hộ Ấn/Nhiễu, tái cấp làm mới, không cộng và không tăng theo Rank. VFX dấu phong ấn chỉ chạy trong cast; biến mất không xóa debuff.

Quét hầm ngục tạo biên nhận thưởng/XP riêng sau lưu thành công, dùng lại BattleResult; đóng kết quả không tiêu thêm vé và không thay trận trước đó.

Sinh Mệnh Thế Chấp (`life_mortgage`): nợ hồi phục cộng dồn theo số HP, mặc định 25%, trần 50% HP tối đa lúc áp dụng. Hồi phục trả nợ trước; phần dư mới hồi HP. Xem [hợp đồng chi tiết](LIFE_MORTGAGE.md).
