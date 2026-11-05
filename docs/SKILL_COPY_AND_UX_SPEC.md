# The Prisma Origin — Quy chuẩn mô tả kỹ năng và nhân vật

Phiên bản2 · 05/11/2026. Dùng cho toàn bộ roster, kỹ năng nâng cấp, dạng chiến đấu, nội tại và Trấn Phái. Data + resolver + test là nguồn cơ chế; tài liệu này quy định cách viết, không tự cân bằng lại kit.

## Người chơi cần biết gì?

Đọc một thẻ phải biết nhanh: làm gì, cho ai, điều kiện nào, hiệu lực bao lâu và phải trả gì. Mô tả gọn không đồng nghĩa giấu điều kiện. “Đồng đội khác”, “đơn mục tiêu”, thời điểm kích hoạt, giới hạn mỗi vòng và cách trả tài nguyên là thông tin chiến thuật.

Không đưa cách chống vòng lặp, thứ tự callback, tên enum, cảnh báo cho lập trình viên hoặc lời khuyên chỉ tay vào mô tả. Người chơi cần kết quả của luật, không cần lịch sử sửa bug.

## Ba lớp thông tin

| Lớp | Nội dung | Nguồn |
|---|---|---|
| Mô tả | Một câu nêu công dụng, khoảng12–25 từ, tối đa180 ký tự | `ability.description` |
| Thông số | Chi phí/CD → mục tiêu → hệ số → hiệu ứng/thời hạn/giới hạn | Formatter từ dữ liệu cơ chế đã resolve Rank/Trấn |
| Chi tiết | Ngoại lệ riêng làm thay đổi quyết định, tùy chọn mở | `rules[]` và formatter |

Mô tả không lặp phần trăm, MP và CD đã có trong thông số. Tên kỹ năng được giữ cá tính; không dùng tên dài thay cho giải thích. Mỗi dòng thông số chứa một hiệu ứng hoặc nhóm cùng thời hạn. Nội dung dài được mở rộng, không cắt bằng dấu ba chấm hay line-clamp.

Ví dụ:

- Lyon: “Bảo vệ một đồng đội khỏi hiệu ứng bất lợi kế tiếp.” Thông số: “Hộ Ấn:1 lần chặn · đến khi dùng hết”. Chi tiết: chặn từng hiệu ứng, không giải debuff cũ, dùng lại làm mới.
- Tsukiha: “Chém liên tiếp một địch; dùng Hồn Kiếm sẽ thêm một nhát chém.” Số hit, hệ số và hai cách trả ở thông số; không chép175% vào văn khiến Rank sau đó hiển thị mâu thuẫn.
- Yukino: “Chia đều trận tuyết cho mọi địch; tiêu nhiều Hồn Kiếm để tăng MAG cho chiêu này.” Phải ghi **tổng** hệ số chia đều, không khiến người đọc hiểu mỗi địch nhận600%.
- Aurora: giữ “phép đơn mục tiêu của đồng đội khác” và “1 lần/vòng” trên thẻ; không chỉ ghi chung “khi đồng đội tấn công”.

## Nội tại, giới thiệu và bối cảnh

Giới thiệu nhân vật: một câu về vòng chơi, tối đa160 ký tự. Tiểu sử kể xuất thân/tính cách riêng. Nội tại: tên → điều kiện và kết quả ngắn → lượng/giới hạn → ngoại lệ cần tra. Không chép cả nội tại vào phần giới thiệu.

Trấn Phái chỉ xuất hiện trên kỹ năng liên quan; tránh rải cùng đoạn giải thích lên mọi thẻ. Không dùng “rất mạnh”, “đánh cực đau”, “rất yếu”, “nhớ rằng”, “chỉ cần”, so sánh coi thường cách chơi hoặc lời nhắc “đừng nhầm”. Viết trung tính: điều kiện → hiệu quả.

## Ngôn ngữ và độ chính xác

- Tiếng Việt trước: Thường, Hỏa, Thủy, Thổ, Phong, Lôi, Quang, Ám, Nguyệt, Hồn Kiếm. Oán Hận là trạng thái, không phải hệ. Giữ tên riêng và nhãn chỉ số HP/MP/ATK/MAG/DEF/RES/SPD.
- Dùng “Liên kích”, “dạng chiến đấu”, “mục tiêu chính/còn lại”, “thanh tẩy”, “khuếch đại sát thương”. Tránh lọt `combatMode`, `handler`, `snapshot`, `proc`, `bonus` vào văn người chơi.
- Vật lí/phép độc lập chỉ số scale: Yufina dùng ATK gây phép, Lumine dùng MAG gây vật lí. Đừng sửa cơ chế chỉ để tên lớp dễ hiểu hơn.
- Phân biệt `+5 ATK căn bản` và `+25% ATK`; chỉ số hiện tại bao gồm buff/debuff hợp lệ. Ghi cap và chỉ số đối chiếu ở conversion.
- “Lượt chính của mục tiêu”, “lượt của bản thân” và “vòng” là ba đơn vị khác nhau. Không nói mọi buff đều bỏ qua Lượt Thêm. Tham khảo COMBAT_LIFECYCLE_CONTRACT.
- Hồi chiêu kỹ năng CD2: khóa hai vòng sau khi dùng. Không đổi thành “2 lượt”. Lượt Thêm diễn ra ở Vòng Phụ, không chen ngay lượt chính.
- Giới hạn mỗi vòng dùng chung chính/phụ. Liên kích từ đồng đội phải ghi “khác” khi áp dụng; những cơ chế tự truy kích riêng phải mô tả theo đúng native hiện hành.
- Hệ số là sức mạnh trước phòng thủ, điểm yếu và giảm sát thương. Đa hit ghi `số đòn × hệ số/đòn`; chia tổng ghi rõ “tổng… chia đều”.
- Chi phí ưu tiên phải thể hiện ngưỡng, tiêu cố định/toàn bộ và fallback MP. Đánh thường/Phòng thủ không ngầm tạo tài nguyên như kỹ năng.
- Phong Ấn/Hộ Ấn và hiệu ứng theo số lần phải ghi “lần”; không mô tả thành miễn nhiễm trọn kỹ năng. Thời hạn chờ khác số lần hưởng.

## Quy tắc chung đặt một nơi

Quy ước chiến đấu trên trang nhân vật giữ luật phổ biến: khiên giữ lớp mạnh hơn, buff cùng tên làm mới trừ loại cộng tầng, hồi không vượt tối đa, damage amp lấy nguồn đủ điều kiện lớn nhất nhưng vẫn tiêu lượt dùng, lượt chính/phụ. Chỉ lặp trên kỹ năng khi luật riêng thay đổi cách vận hành.

Chi tiết được phép dài khi thực sự khác biệt (Auguste/công thức, Astoria/triệu hồi…), nhưng tách thành các ý về điều kiện, chi phí, thời hạn và mục tiêu. Không đổi nền/BGM chỉ vì nhân vật có dạng; đây là thông tin mỹ thuật trong tài liệu phát triển, không phải một dòng luật trên mọi thẻ.

## Hợp đồng code và dữ liệu

`src/ui/skill-copy.js` tạo `{summary,facts,rules}` cho `SkillBody`/`PassiveBody`. `skill-presentation.js` sinh chi phí, giả định và công thức; `combat-presentation.js` sinh phần gọn trong trận. Phải cập nhật cả ba khi thêm cơ chế.

Không duy trì bản sao hệ số trong văn tĩnh. Rank10% cho damage/heal/shield,5% cho stat buff hợp lệ; native/cap/damage amp không tự tăng. Các con số phải lấy từ resolver, kể cả Trấn Phái và lựa chọn đang trả bằng tài nguyên hay MP.

Nếu thêm field dữ liệu: bổ sung validator, runtime, preview/chi phí, AI và test. Nếu một quy tắc chưa có presentation, không lấy ID tiếng Anh làm fallback im lặng.

## Quy trình nghiệm thu

1. Đọc cả roster và các chiêu nâng cấp/dạng, không chỉ nhân vật mới.
2. Kiểm tra câu mô tả không lặp bảng số, không bỏ điều kiện tạo bản sắc kit.
3. So Rank1/5 và khi có Trấn; chuyển đổi MP/tài nguyên; so số mục tiêu1/nhiều và chủ thể hai phe.
4. Kiểm tra native một/nhiều hit, chính/phụ, né, khiên, hạ địch, đầy tài nguyên và nguồn đồng đội khác.
5. Chạy `node scripts/audit-skill-copy.mjs` để xuất catalog câu chữ và phát hiện thiếu mô tả/ID nội bộ. Báo cáo là ảnh chụp biên tập, không là bảng cân bằng.
6. Chạy skill-copy test, regression cơ chế liên quan và kiểm tra UI. Không thay đổi damage/chi phí vì biên tập văn.

Đợt05/11 đã rà toàn roster, rút gọn52 mô tả kỹ năng và8 giới thiệu cũ; bổ sung2 nhân vật và presentation mới. Chi tiết trong SKILL_COPY_REVIEW_2026_11_05.md. Quy chuẩn cũ có catalog32 nhân vật đã được thay bằng báo cáo tạo từ roster hiện hành, tránh dùng số cũ làm nguồn thứ hai.
