# Rà soát mô tả từ Patricia — 18/11/2026

Nguồn quy chuẩn: SKILL_COPY_AND_UX_SPEC.md; nguồn cơ chế: dữ liệu và resolver. Không đổi chỉ số, hệ số, MP, CD hoặc thời hạn trong đợt biên tập.

Đã rà 23 nhân vật từ releaseId94; sửa 47 mô tả kỹ năng và7 giới thiệu. Các mô tả đạt quy chuẩn giữ nguyên.

Hệ số và thời hạn được trình bày bằng thông số động, không sao chép vào văn tĩnh. Các điều kiện quan trọng (đồng đội khác, hệ bị loại, tài nguyên ưu tiên, chuỗi Liên kích, Sơ Hở theo từng mục tiêu) được giữ ở mô tả/chi tiết.

Lượt Thêm từ #97: Belochkin, Melpiphia, Kanade, Charlotte; Rotary có Voodoo/nhận lượt ở đầu vòng theo adapter riêng. Vilgard #95 nằm ngoài mốc nhưng cơ chế hồi sinh đã có regression riêng. Kiểm tra cả hai phe qua lượt chính thực, Vòng Phụ, save/reload và từ chối tái cấp trong Vòng Phụ.

Lỗi hiển thị đã sửa: damageBonusMagical lọt vào hệ số nhanh; hai dòng Lượt Thêm thiếu nhãn người nhận. Đã tái hiện crash UI khi chọn chiêu cấp lượt trong trận học viện: adapter truyền Set, renderer gọi includes như mảng. Chuẩn hóa view và dùng bộ kiểm tra chung nhận cả Set/mảng; không đổi cơ chế cấp lượt. E2E mới kiểm chọn/thi triển chiêu và reload, ngoài test vòng đời engine.

## Patricia

Tăng MAG theo số đồng đội có khiên, rồi dồn phép Thổ vào một mục tiêu.

- **Lớp Chắn Địa Tầng**: Tạo khiên cho toàn đội dựa trên MAG.
- **Quét Sóng Địa Chấn**: Gây sát thương phép Thổ lên toàn địch.
- **Khoan Phá Lõi Đá**: Khoan một địch bằng phép Thổ, có cơ hội gây Choáng.

## Vilgard

Tích Ám Ảnh, hồi sinh và trả đòn bằng những nhát chém xuyên DEF.

- **Truy Sát Không Rời**: Chém một địch và một mục tiêu khác ngẫu nhiên, rồi tích Ám Ảnh.
- **Nhát Chém Oán Hận**: Chém một địch và hai ô kề, gây Rạn Khiên và tích Ám Ảnh.
- **Trả Thù Toàn Diện**: Tiêu toàn bộ Ám Ảnh để chém toàn địch, tăng xuyên DEF theo số tầng.

## Ardelia

Dùng RES để hồi phục, thanh tẩy và tạo khiên cho toàn đội.

- **Ca Mổ Tiền Tuyến**: Hồi HP toàn đội theo RES, đồng thời tăng DEF và RES.
- **Lá Chắn Quân Y**: Thanh tẩy toàn đội và tạo khiên dựa trên RES.
- **Sóng Xung Kích**: Gây phép Thủy toàn địch, giảm ATK và MAG khi trúng.

## Belochkin

Cấp Lượt Thêm, tăng ATK và khuếch đại sát thương vật lí toàn đội.

- **Gió Xé Tuyến**: Gây sát thương toàn địch và giảm DEF khi trúng.
- **Lệnh Tiến Công**: Tăng ATK và cấp Lượt Thêm cho bản thân cùng một đồng đội khác.
- **Bão Gươm Viễn Chinh**: Tấn công toàn địch và khuếch đại sát thương vật lí của cả đội.

## Chen

Giảm DEF, mở Sơ Hở Thường và dồn sát thương bằng chuỗi chém đơn mục tiêu.

- **Nhất Trảm**: Chém một địch và giảm DEF.
- **Song Trảm**: Chém liên tiếp một địch và mở Sơ Hở Thường.
- **Lục Kiếm Quyết**: Chém liên hoàn một địch, kết thúc bằng một nhát mạnh hơn.

## Angelica

Khóa buff, làm hao MP và kéo dài hồi chiêu của đối phương.

- **Ấn Phong Hậu Cần**: Áp Phong Ấn lên toàn địch để chặn buff mới.
- **Nghi Thức Hỗn Loạn**: Gây Nhiễu Ma Lực, Vết Thương Sâu và giảm DEF, RES toàn địch.
- **Dấu Ấn Ngưng Đọng**: Kéo dài hồi chiêu của các kỹ năng hợp lệ trên toàn địch.

## Melpiphia

Mở Sơ Hở Thủy, bào mòn RES, SPD và tiếp sức bằng Lượt Thêm.

- **Mũi Nước Dò Đường**: Gây phép Thủy đơn mục tiêu và mở Sơ Hở Thủy.
- **Dòng Nước Dẫn Lối**: Tăng MAG và cấp Lượt Thêm cho một đồng đội hệ Thủy.
- **Xoáy Nước Nặng**: Tấn công một địch, giảm RES, SPD và nhận Lượt Thêm.

## Senya

Một thợ săn trẻ sống trong làng, dùng Hồn Kiếm như một nghi lễ săn đuổi. Càng tiêu Hồn Kiếm, nhịp chém của cậu càng dữ dội.

- **Nhát Săn**: Chém một địch bằng Hồn Kiếm.
- **Dấu Chân Trong Rừng**: Tạo Hồn Kiếm và hồi HP cho bản thân theo ATK.
- **Khép Vòng Săn**: Ưu tiên tiêu Hồn Kiếm để chém liên hoàn một địch; thiếu tầng thì trả MP.

## Kanade Hanasato

Khai thác điểm yếu Thổ, bẻ gãy kháng phép và khóa sức mạnh đối phương.

- **Hoa Nở Nơi Đất Khách**: Tăng MAG cho bản thân và nhận Lượt Thêm.
- **Địa Mạch — Hoa Chạm Đá**: Tấn công một địch và giảm RES.
- **Hanasato — Vườn Hoa Khép Lối**: Tấn công toàn địch và áp một lần Phong Ấn.

## Wilson Marquis

Mở Sơ Hở Thổ, giảm RES và tiếp sức bằng những Liên kích diện rộng.

- **Hoa Đất Mở Đường**: Tấn công toàn địch và mở Sơ Hở Thổ.
- **Lời Hẹn Trên Địa Mạch**: Tấn công toàn địch và giảm RES.
- **Mùa Hoa Chưa Hẹn**: Hồi HP cho toàn đội.

## Remulia

Nương theo Sơ Hở của từng địch, tích Khúc Ca để hồi phục cả đội.

- **Dạo Khúc — Tiếng Gọi Đầu Tiên**: Tăng MAG và nhận Khai Phá Điểm Yếu.
- **Điệp Khúc — Ký Ức Không Tên**: Tấn công toàn địch và tích Khúc Ca.
- **Chung Khúc — Ngoài Trang Sử**: Tấn công toàn địch; đủ Khúc Ca sẽ tiêu hết để hồi phục và làm mới cả đội.

## Geoffrey

Giữ vững phòng tuyến bằng hào quang phòng thủ và che chắn toàn đội.

- **Vương Thuẫn — Giữ Vững Hàng Quân**: Tạo khiên toàn đội và Khiêu Khích bản thân.
- **Quân Lệnh — Hạ Vũ Khí**: Tấn công toàn địch, giảm ATK và MAG.
- **Thành Trì Trước Ngai Vàng**: Dựng khiên bản thân, nhận đòn thay cả đội.

## Anabel

Tích sức mạnh từ buff, tung những đòn trảm quang nối tiếp lên mục tiêu còn trụ vững.

- **Quân Lệnh — Ánh Dương Dẫn Lối**: Tăng ATK cho bản thân.
- **Tiên Phong — Trảm Quang**: Chém một địch; nếu mục tiêu sống sót, Liên kích bằng cùng chiêu.
- **Phán Quyết — Bình Minh Viễn Chinh**: Trảm một địch; nếu mục tiêu sống sót, Liên kích bằng cùng chiêu.

## Nikita

Tích Ám Phong, khai thác điểm yếu Phong rồi kết liễu bằng dao gió.

- **Màn Gió — Hộ Giá**: Đâm một địch, tăng MAG bản thân và tích Ám Phong.
- **Phong Nhận — Vô Thanh**: Đâm một địch và tích Ám Phong.
- **Mật Lệnh — Xóa Dấu**: Tiêu đủ Ám Phong để tung nhát dao kết liễu.

## Cyrus

Tiếp ma lực bằng Phòng thủ, dẫn đồng đội Phong khai thác điểm yếu.

- **Phong Điển — Trang Sách Đồng Hành**: Tăng ATK và MAG cho đồng đội hệ Phong.
- **Lật Trang — Gió Xé Kết Giới**: Gây sát thương Phong, gắn Sơ Hở Phong và giảm phòng thủ toàn địch.
- **Dấu Sách — Lối Gió Trở Về**: Hồi HP và cấp Khai Phá Điểm Yếu cho đồng đội hệ Phong.

## Siesta

Đánh thường tích Dã Tính, rồi nối rìu bằng những đợt Liên kích dữ dội.

- **Nanh Rìu — Xé Vòng Vây**: Chém mục tiêu chính và hai ô kề, gắn Sơ Hở Phong.
- **Tiếng Tru — Đánh Thức Dã Tính**: Tăng ATK bản thân và nhận Khai Phá Điểm Yếu.
- **Bầy Sói — Rìu Cuồng Phong**: Giáng hai nhát rìu lên mục tiêu chính và hai ô kề.

## Rotary

Dùng Voodoo chuyển lượt chính cho đồng đội và bảo vệ người được liên kết.

- **Voodoo — Sợi Chỉ Đồng Mệnh**: Liên kết với một đồng đội khác để chuyển lượt chính cho họ.
- **Búp Bê Hộ Mệnh**: Tạo khiên và cấp một Hộ Ấn cho đồng đội đang mang Voodoo.
- **Kim Châm — Dấu Ấn Giao Cảm**: Gây sát thương Ám và tạo Sơ Hở theo hệ chính của đồng đội mang Voodoo, trừ Hồn Kiếm.

## Luka

Dùng ATK gây sát thương phép, tích Nhịp Điệu rồi dồn sức vào đòn lan.

- **Nhịp Nổi Loạn**: Tăng ATK bản thân và tích thêm Nhịp Điệu.
- **Hợp Âm Xé Gió**: Gây phép Phong theo ATK lên một địch và tích Nhịp Điệu.
- **Khúc Cao Trào**: Tiêu toàn bộ Nhịp Điệu để tăng hệ số đòn phép Phong lên mục tiêu chính và hai ô kề.

## Gairyu

Dồn lửa diện rộng, nối chiêu bằng Liên kích có cơ hội được bảo đảm.

- **Hỏa Khí Bốc Đồng**: Thiêu đốt toàn bộ kẻ địch.
- **Đừng Chọc Giận Ta!**: Thiêu đốt toàn địch; có cơ hội Liên kích bằng Hỏa Khí Bốc Đồng.
- **Thiêu Rụi Tất Cả!**: Công kích toàn địch; có cơ hội nối Liên kích qua Đừng Chọc Giận Ta! đến Hỏa Khí Bốc Đồng.

## Ariel

Dựng Sân Khấu tiếp sức đồng đội, dùng MAG hỗ trợ sát thương phép.

- **Khúc Ca Thanh Xuân**: Tăng ATK và MAG cho toàn đội.
- **Tâm Điểm Ánh Đèn**: Cộng sát thương cho kỹ năng phép kế tiếp của một đồng đội, dựa trên MAG của Ariel.
- **Sân Khấu — Thanh Xuân Rực Rỡ**: Dựng Sân Khấu để tăng SPD toàn đội.

## Charlotte

Tích Tham Vọng từ kỹ năng hỗ trợ của đồng đội, rồi Liên kích phép Lôi diện rộng.

- **Màn Chào Sấm Sét**: Tấn công toàn địch, giảm RES khi trúng và tích Tham Vọng.
- **Tài Năng Không Thể Lu Mờ**: Tăng ATK và MAG căn bản cho đồng đội ngoài Quang, Ám và tích Tham Vọng.
- **Hào Quang Thuộc Về Chúng Ta!**: Bản thân và một đồng đội khác ngoài Quang, Ám nhận khuếch đại phép theo số lần dùng cùng Lượt Thêm.

## Clark

Hồi phục, giải hiệu ứng bất lợi khi đầy HP và giữ cả đội vững vàng.

- **Sơ Cứu Chuẩn Mực**: Hồi HP và cấp Hộ Ấn cho một đồng đội.
- **Chấn Chỉnh Thuật Thức**: Giảm ATK và MAG toàn địch.
- **Giờ Nghỉ An Toàn**: Cấp hồi phục đầu lượt và giảm sát thương nhận vào cho toàn đội.

## Mariel

Chắn đòn cho đồng đội và củng cố hàng khiên trước sát thương phép.

- **Kết Giới Không Bỏ Ai**: Tạo khiên cho toàn đội và giải 1 hiệu ứng bất lợi trên mỗi người.
- **Ôn Tập Kết Giới**: Tăng RES cho toàn đội.
- **Cứ Để Tôi Đứng Trước**: Khiêu Khích, Che Chắn toàn đội và tăng RES bản thân.

