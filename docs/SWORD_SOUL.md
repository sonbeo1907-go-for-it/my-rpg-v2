# Hồn Kiếm và Tsukiha

Triển khai 05/11/2026. Tên hiển thị thống nhất **Hồn Kiếm**; “Kiếm Hồn” trong brief là cùng cơ chế. Hồn Kiếm vừa là **nguyên tố** `sword_soul`, vừa là tên tài nguyên đội. Không phải Oán Hận. Tsukiha vẫn có nguyên tố nhân vật Hỏa để tương tác hỗ trợ Hỏa; thành viên cơ chế được đánh dấu tag `sword_soul`.

## Tài nguyên chung Keijo

- Khi đội có nhân vật khai `teamResources.sword_soul`, tạo pool 0/6 cho toàn đội (Kaguya nâng trần đội mình lên10; Amiya có thể tạo ngay ở đầu vòng1). Các khai báo cùng ID phải giống hoàn toàn. Đối thủ có pool/giới hạn riêng; owner gục không tự xóa pool.
- Mỗi vòng, tối đa hai lần tăng tự nhiên: kỹ năng chủ động đầu tiên của một thành viên tag Hồn Kiếm tạo 1; kỹ năng đầu tiên của thành viên không có tag tạo 1. Hạn mức theo **đội và nhóm**, không theo người. Mọi người trong một nhóm dùng chung một cơ hội.
- Không tính đánh thường, Phòng thủ, phản công, Liên kích, chiêu tự động hoặc bỏ lượt do choáng. Kỹ năng hợp lệ không gây sát thương vẫn tính; né hoặc không áp được buff vẫn là dùng kỹ năng. Lệnh bị từ chối không tính.
- Tăng tự nhiên sau hiệu ứng kỹ năng và sau kết toán đòn nguồn, trước các phản ứng từ kết thúc cast. Kỹ năng tạo riêng 1 Hồn Kiếm không tiêu hạn mức tự nhiên. Chiêu tạo riêng + tăng tự nhiên lần đầu có thể tạo tổng 2.
- Chi phí chốt trước hiệu ứng/tăng trưởng: có 3 không thể vay Hồn Kiếm sẽ tạo ở cuối chiêu để trả 4. Tạo khi đầy vẫn ghi event và dùng hạn mức tự nhiên; không ngân hàng cho lượt sau.
- Vòng Chính/Phụ dùng chung limiter `growthRounds.member/other`. Qua round mới sẵn sàng. Bỏ lượt không tự tạo. Qua wave/phase giữ pool/limiter và round offset hiện hành; trận độc lập mới bắt đầu 0. Snapshot/forecast clone cả ledger. Khi kỹ năng đã thi triển, tăng tự nhiên vẫn ghi nhận dù người thi triển ngã trong đòn.
- `naturalGrowth:{memberTag,amount:1}` là cấu hình dùng lại. Không hardcode Tsukiha trong hook. Tài nguyên không tự tạo từ event tăng/tiêu khác nên không có vòng lặp.

## Đòn hai nguyên tố

`effect.element` là nguyên tố chính cho VFX; `additionalElements:[element]` cho phép đúng một nguyên tố phụ khác. Tsukiha có Hỏa + Hồn Kiếm trên kỹ năng tấn công, còn đánh thường chỉ Hỏa.

- Mỗi hit vẫn chỉ gây một lần sát thương. Khớp điểm yếu Hỏa **hoặc** Hồn Kiếm là đủ; khớp cả hai/điểm yếu vật lí không cộng/nhân lần nữa. Khai Phá Điểm Yếu thay ×1.5 thành ×2 như cũ.
- Sơ Hở phù hợp với một trong hai hệ tiêu một tầng/mục tiêu/cast; burst 4 hit không tiêu 4 tầng. Không mượn Sơ Hở mới tạo trong chính cast; giữ reservation chống Liên kích chen vào dùng chung tầng cuối.
- Nếu kháng hai hệ khác nhau, dùng hệ số nhận sát thương có lợi hơn cho người đánh, **một lần**, không nhân hai kháng. Log nêu nguyên tố thực sự khớp. Event đòn hai hệ ghi `elements`; event đơn hệ giữ schema cũ.
- Các hook nhận diện hệ sát thương xét cả hai hệ, nhưng một hit/cast vẫn dùng chung limiter của hook, không kích hai lần từ cùng đòn. Bộ lọc hệ nhân vật vẫn xét `actor.element` (Tsukiha là Hỏa).
- Quỷ lùn đã yếu mọi hệ tiếp tục yếu cả Hồn Kiếm; không đổi điểm yếu các địch khác.

## Tsukiha — Vu Nữ Của Đền Keijo

Nhân vật chính thức trong Chiêu Mộ thường, phe `keijo_shrine` (Đền Keijo). HP180 / MP90 / ATK35 / MAG10 / DEF16 / RES20 / SPD16. Không có Trấn/truyện riêng trong bản này. Không thay nền/BGM; dùng VFX vật lí Hỏa có sẵn.

| Kỹ năng Rank 1 | MP/CD | Hiệu ứng |
| --- | --- | --- |
| Đánh thường | 0 | 100% ATK vật lí Hỏa. Không tăng tự nhiên. |
| Linh Hỏa — Nhất Kiếm | 6 / không CD | 200% ATK vật lí Hỏa / Hồn Kiếm, một địch. |
| Lời Nguyện Trước Cổng Đền | 8 / CD2 | Tạo riêng 1 Hồn Kiếm; +50% ATK bản thân 3 lượt chính. |
| Keijo Bí Kiếm — Tứ Hồn Quy Hỏa | 24 hoặc 4 Hồn Kiếm / CD2 | 3 hit ×175% ATK Hỏa/Hồn Kiếm. Đủ 4 Hồn Kiếm thì tiêu thay MP và thành 4 hit ×175%. |

Nội tại **Linh Hỏa Gửi Trong Kiếm**: mỗi đơn vị tài nguyên được tạo hoặc tiêu +4 ATK căn bản trong 4 lượt chính, tối đa 3 tầng. Tiêu 4 có thể đầy ngay 3 tầng **trước hit đầu tiên**. Tạo khi đầy vẫn tính. Refresh toàn bộ thời hạn, kể cả đang đủ 3 tầng. Buff có thể bị Phong Ấn chặn/xóa như buff thường. Chủ gục không nhận buff.

`team_resource_growth.baseStatPerStack` tạo `baseStatModifiers` trên instance theo số tầng mới; cộng trước buff % và mất khi buff hết. Không sửa `baseStats` vĩnh viễn, không tăng theo Rank. Native choáng vẫn hoạt động khi người khác tạo/tiêu; lượt chính bị bỏ vẫn giảm thời hạn, lượt phụ không giảm.

CD2 castR khóa R+1/R+2, sẵn sàng R+3. Buff3 được cấp mới không tick tại chính lượt cấp; dùng lại được khi hết mà không có lượt hành động thiếu buff. Burst CD dùng chung cho cả nhánh MP/tài nguyên. Hồn Kiếm không đủ thì giữ nguyên và trả MP; thiếu cả MP thì từ chối. Nhiễu Ma Lực/Thuốc Súng xét MP thực trả, nhánh trả Hồn Kiếm là 0MP.

Rank tăng damage từng hit 10%/cấp và buff ATK 5%/cấp; không tăng số hit, lượng tạo, giá tài nguyên, MP/CD hay native +4. `preferTeamResource` / `hitsWhenTeamSpent` dùng lại ở engine, AI và preview; không sửa JSON theo nhân vật tại runtime.

## Trình bày

Tái dùng bố cục bảng Bằng Chứng/Thuốc Súng và CombatPopover. Sáu ô mặc định (mười khi có Kaguya) là lửa xanh có trạng thái đầy/rỗng và tổng x/6. Hạn mức của hai nhóm hiện “Sẵn sàng/Đã tạo”.

Cổng torii có vị trí không đổi trong SVG nền bảng, mặt hồ tĩnh cho 0–3; 4 trở lên thêm nhánh anh đào và cánh hoa. SVG chỉ nằm trong bảng, tuyệt đối không ghi đè background game. Khi số giảm dưới4, về hồ; `prefers-reduced-motion` bỏ hoa rơi/chuyển cảnh. Đối thủ Arena có bảng riêng, không ghi đè bảng mình.

Kiểm chứng: `test/sword-soul.test.js`, `e2e/sword-soul.spec.ts`, full regression/validate/typecheck/build. Các mốc MP/CD và chỉ số còn lại là cấu hình playtest do agent hoàn thiện, không phải kết luận cân bằng.

Mở rộng chính thức: [bốn nhân vật Hồn Kiếm mới](SWORD_SOUL_QUARTET.md). Xem riêng ngoại lệ Izuna tự Liên kích và Kaguya cap10; không áp ngoại lệ lên mọi nhân vật.

Miyuki: [MIYUKI_AND_CONTROL](MIYUKI_AND_CONTROL.md) — tự vào mode ở6 Hồn Kiếm, kỹ năng Thủy/Hồn Kiếm và Choáng theo ATK.
