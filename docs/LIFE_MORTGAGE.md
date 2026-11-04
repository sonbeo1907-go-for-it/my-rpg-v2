# Sinh Mệnh Thế Chấp

Triển khai 04/11/2026. Đây là cơ chế engine dùng chung, chưa cấp cho boss/nhân vật hiện hành.

## Dữ liệu

Status `life_mortgage`: debuff persistent, `healingDebt: {maxHpRatio:0.25, capMaxHpRatio:0.5}`.
Kỹ năng dùng `{type:"status",status:"life_mortgage"}` cho đơn mục tiêu, hoặc thêm `debtMaxHpRatio:0.15` cho diện rộng. Không khai duration/charges/stacks; Rank không tăng nợ. Bản đầu không hỗ trợ onHitStatus, linked status, tự nhận nợ để đổi sức mạnh hoặc mode entry.

## Hợp đồng vòng đời

- Mỗi lần áp dụng ghi `debtHp` theo HP tối đa hiện tại, làm tròn lên; cộng nợ đến 50% HP tối đa, làm tròn xuống. Nợ cũ không bị sửa khi HP tối đa thay đổi, kể cả vượt trần mới; lần áp dụng mới chỉ thêm vào phần còn trống.
- Hộ Ấn chặn mỗi lần áp dụng từ địch; cleanse xóa như debuff bình thường. Không tick theo lượt, không tự hết do choáng hoặc Lượt Thêm. Thiếu MP/sai mục tiêu không tạo nợ.
- Hồi phục đi qua giảm hồi nhận (Vết Thương Sâu) → thanh toán nợ → giới hạn phần dư theo HP thiếu. Đầy HP vẫn trả nợ được. Hút máu, regen, gear, nội tại và kỹ năng cùng pipeline. Oán Hận và đơn vị đã gục không nhận hồi phục hoặc thanh toán.
- Chỉ HP thực tăng tạo sự kiện `heal` và kích các hook được hồi HP. Nợ đã thanh toán tạo `life_debt_paid` riêng, không tạo heal giả. `life_debt_applied` ghi lượng thêm và tổng còn lại; không phát sinh sát thương, phản công hoặc đổi khiên.
- Gục: xóa nợ. Kết thúc trận thật: xóa. Victory tiếp chuyến/wave và chuyển phase: giữ. Combat mới trong Chronicle chỉ mang HP/MP như contract sẵn có. Snapshot/forecast lưu nợ trong status, không có đồng hồ ngoài hoặc RNG mới.
- Cùng cơ chế cho hai phe và PvP mirror; mọi thao tác theo actor/status instance, không tra tên nhân vật. AI tính thanh toán nợ là giá trị hỗ trợ riêng.

## UI và kiểm chứng

Thanh đỏ tím dưới HP ghi `Thế Chấp: N HP`; badge/tooltip hiển thị lượng nợ, không giả làm stack/thời hạn. Log phân biệt trả nợ với hồi HP. Không đổ màu vào thanh HP hoặc thay đổi tỷ lệ HP.

Tests ở `test/life-debt.test.js`: cộng/trần, Hộ Ấn/cleanse, hồi dư/đầy HP, Vết Thương Sâu, hút máu/regen/gear, không kích hồi MP khi chỉ trả nợ, lifecycle/forecast và validator. Browser test kiểm tra thanh nợ, tooltip và bố cục di động bằng fixture riêng.
