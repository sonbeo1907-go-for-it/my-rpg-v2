# Rà soát tài liệu — 03/11/2026

## Phạm vi

Tài liệu Markdown trong repo, hai bản chụp source TXT, AGENTS/README; đối chiếu các entrypoint core/runtime, JSON và hợp đồng test liên quan. Không mở lại Google Doc bên ngoài, không sửa save cá nhân, không cài Harness, không đổi mã gameplay hoặc chạy build EXE ở đợt tài liệu này.

## Kết quả

- Viết lại README, ARCHITECTURE, GAMEPLAY_STATUS, CONTENT_GUIDE để loại mô tả prototype: roster25, chưa Level/pity, Import/Export UI, save v3–v5, dungeon placeholder.
- Tạo HANDOFF, ENGINE_RULES, GLOSSARY, INDEX và catalog nhân vật từ JSON; AGENTS dẫn vào cùng điểm bắt đầu.
- Sửa Quest mặc định Rất dễ cho normal/boss/bounty, truyện ba chương10/20/30, referenceLv1 và HP profile theo encounter.
- Viết lại Dungeon/Daily/Traveler, bỏ lộ trình Ảo Ảnh, giữ riêng dữ liệu legacy. Dungeon dùng curveLevel thay hệ số HP/ATK/MAG cũ, không bỏ hệ sốMP hiện có.
- Sửa mô tả mở siêu trùm qua Chronicle và giữ tương thích cờ cũ; phân biệt Lữ Hành/Chronicle.
- Sửa save v7, T4 và giá Trấn2400Vụn, thêm Artesia vào nhóm công thức mở từ truyện; không chuyển Trấn truyện sang Blueprint.
- Ghi rõ Chronicle checkpoint battle/RNG là ngoại lệ của runtime battle thông thường. Pháo đài giữ session vàHP/MP giữa encounter, trạng thái trận tạo mới; không nhầm với carry dungeon.
- Ghi rõ đồng hồ main_turn/default/round và CDgear/kỹnăng khác nhau; luật FollowUp đồngđội khác hook truykích mode. Giữ ngoại lệ Chelsea100%né, không áp cap90%.
- Chốt SandraCD2/280%, VFX dấu phong ấn tạm thời, debuff reusable không độc quyền; MoriATK30/AoE280%, Tywin350%.
- Đánh dấu release notes nhân vật, catalog prototype, báo cáo mô phỏng và GDD cũ theo thời điểm; giữ bản Content Guide cũ ở archive để không mất ví dụ.

## Giới hạn

Không khẳng định đã playtest lại từng kit/rotation hoặc xác minh từng phép tính lịch sử. Các bảng số trong release note cũ có thể còn là baseline lúc phát hành, đã được đánh dấu snapshot; JSON và resolver mới là nguồn cho con số đang chạy. Không tự đổi thiết kế/cân bằng khi chỉ được giao tài liệu.

Không có bằng chứng để tuyên bố đã tích hợp DeepSeek Harness, online PvP, live banlist hoặc update server. Các tính năng này không được ghi như đã làm.

## Duy trì sau này

Thay luật chung: sửa ENGINE_RULES và chuyên đề. Đổi thuật ngữ: sửa GLOSSARY, giữ ID tương thích. Thêm nội dung: sửa chuyên đề/data, cập nhật catalog khi cần, không sao chép toàn bộ kit vào nhiều file. Kết thúc task ghi test thực sự đã chạy và trạng thái build; báo cáo mô phỏng luôn nêu Level, Rank, gear, unlock, seed và AI policy.

Kiểm tra link local, UTF-8, tính đầy đủ INDEX và dữ liệu snapshot trong đợt này. Kiểm tra validate nội dung để xác nhận dữ liệu vẫn hợp lệ; không xem đây là kiểm thử regression gameplay.

## Kiểm tra đã chạy

- 75 file Markdown (README/AGENTS và docs, gồm archive): link local hợp lệ, UTF-8 đọc được, không ký tự thay thế; INDEX bao phủ toàn bộ chuyên đề gốc.
- Đối chiếu JSON:74 nhân vật,382 kỹ năng,146 status,70 enemy,89 encounter,38 Trấn,9 sách Lữ Hành,73 AI profile. Số lượng là ảnh chụp03/11, không là invariant vĩnh viễn.
- Assert thông số Mori/Sandra/Tywin, enemy referenceLevel1 và mặc định Quest Rất dễ khớp dữ liệu.
- npm.cmd run validate và git diff --check đã qua. Không sửa source gameplay, không chạy full regression hoặc build EXE vì chỉ đổi tài liệu.

## Bản sắc lớp Thuật Sư

Bổ sung định hướng ưu tiên VFX đặc trưng vào HANDOFF, GLOSSARY, CONTENT_GUIDE và COMBAT_FEEDBACK. Phân biệt VFX cơ chế, scene PvE và chuẩn hóa mode Arena; không biến mọi combatMode thành hiệu ứng toàn bàn. Không đổi renderer hoặc gameplay ở lần bổ sung này.

## Bổ sung kiến trúc và quy trình

Đã thêm sơ đồ ownership/command/persist, phân biệt core mutable battle với transaction campaign, checklist theo loại thay đổi, phối hợp harness, release/rollback và rủi ro save mới với EXE cũ. `.github/workflows` chưa tồn tại tại lúc kiểm tra; CI, live updater và integration DeepSeek chưa được thực hiện. Kiểm tra lại link/UTF-8/diff cho77 file Markdown sau bổ sung, không chạy build EXE cho tài liệu.

## Ngôn ngữ sản phẩm

Đã ghi chính sách ưu tiên game thuần Việt ở AGENTS, HANDOFF, GLOSSARY, CONTENT_GUIDE và SKILL_COPY_AND_UX_SPEC. Tách ngôn ngữ UI khỏi code/trao đổi kỹ thuật; giữ ID, tên riêng và ký hiệu có chủ ý. Đây là cập nhật quy chuẩn, chưa phải tuyên bố đã Việt hóa lại toàn bộ chuỗi UI hiện có.
