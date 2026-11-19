# Nguyệt Quang Chúc Phúc — khung hệ thống và Noelle Model 4.0

Ngày: **19/11/2026**, giờ Việt Nam. Phiên bản thiết kế: **0.1**.

**Trạng thái: tài liệu thiết kế, chưa triển khai gameplay.** Yêu cầu hiện tại chỉ là tạo tài liệu. Không thêm nhân vật, ID phát hành, tùy chọn developer, dữ liệu chiến đấu hoặc sửa save trong task này.

## 1. Nguồn quyết định và phạm vi

- **Đã chốt:** nội dung người dùng nêu trực tiếp trong cuộc trao đổi, ghi ở mục 2 và 6.
- **Đề xuất:** phương án kiến trúc, UI hoặc vận hành được ghi rõ trong tài liệu; chưa phải luật game đã được duyệt.
- **Chưa chốt:** lựa chọn ảnh hưởng kết quả chiến đấu; phải giải quyết trước khi triển khai phần tương ứng, không âm thầm dùng đề xuất làm mặc định.

Tên chính thức là **Nguyệt Quang Chúc Phúc**, concept tiếng Anh **Moonlight Blessing**. “Không Nguyệt Chúc Phúc” là tên cũ trong trao đổi, không dùng cho copy mới.

Mục tiêu trước mắt là một khung dùng lại được cho nhiều tổ hợp. Noelle Model 4.0 là cấu hình Technical Test đầu tiên, không phải lý do để hardcode mọi tổ hợp vào nội tại của Noelle.

## 2. Quyết định đã chốt cho khung chung

1. Một nhân vật phù hợp trong đội cấp quyền truy cập tổ hợp cụ thể cho cả đội. Không được ghép nguyên tố ngoài quyền mà nhân vật cho phép.
2. Cơ chế có bảng hiển thị theo phe, cùng loại vị trí trình bày với Hồn Kiếm hoặc Thuốc Súng.
3. Khi chưa kích hoạt, bảng có **hai ô tiếp nhận nguyên tố**.
4. Danh sách cặp nguyên tố được nêu cho khung hiện tại:

| Tổ hợp | Ghi chú |
| --- | --- |
| Thủy + Lôi | Có cấu hình Lôi Sấm Thịnh Nộ của Noelle |
| Thủy + Hỏa | Chưa có tên, nhân vật cấp quyền hoặc hiệu ứng cụ thể |
| Quang + Thổ | Chưa có tên, nhân vật cấp quyền hoặc hiệu ứng cụ thể |
| Quang + Ám | Chưa có tên, nhân vật cấp quyền hoặc hiệu ứng cụ thể |

Danh sách trên không tự cấp cả bốn tổ hợp cho mọi đội. Noelle chỉ cấp Thủy + Lôi.

5. Khi kích hoạt, Chúc Phúc có sự tồn tại riêng, được mô tả trong concept là **“nhân vật thứ 5”**.
6. **Chúc Phúc có chỉ số riêng.** Chỉ số được định nghĩa theo từng tổ hợp; Lôi Sấm Thịnh Nộ dùng ATK.
7. Trong cấu hình Noelle, khi một Chúc Phúc đang hoạt động: không kích hoạt lại, không nhận Lôi Nguyệt/Thủy Nguyệt, không kích hoạt tổ hợp Chúc Phúc khác.

“Nhân vật thứ 5” hiện chưa xác nhận quyền bị nhắm mục tiêu, nhận buff, hồi máu hoặc tham gia hàng lượt. Không suy những quyền này chỉ từ cách gọi.

## 3. Kiến trúc đề xuất: cơ chế theo phe, thực thể hỗ trợ riêng

### 3.1. Tách ba lớp dữ liệu

| Lớp | Trách nhiệm |
| --- | --- |
| Định nghĩa tổ hợp | Cặp nguyên tố; nguồn nạp hợp lệ; công thức chỉ số; thời hạn; các đợt hành động; hiệu ứng; VFX/copy |
| Quyền của phe | Những tổ hợp mà đội hình hiện tại cho phép, nhân vật cấp quyền và điều kiện quyền còn hiệu lực |
| Trạng thái trận | Hai ô đã nạp; tổ hợp đang hoạt động; ID thực thể; thời hạn; mốc kích hoạt; hạn mức phản ứng |

Quyền truy cập là tập tổ hợp, không phải phép nhân tự do giữa mọi nguyên tố của mọi nhân vật. Có quyền Thủy–Lôi và Quang–Thổ không tạo thêm quyền Thủy–Thổ.

Mỗi phe có trạng thái riêng. Trong đấu đối xứng, cùng một tổ hợp có thể tồn tại độc lập ở hai phe; không dùng một biến toàn bàn để khóa lẫn nhau.

### 3.2. Ý nghĩa thực thể hỗ trợ

**Đề xuất:** Chúc Phúc có ID và nguồn hành động riêng nhưng không được thêm như một nhân vật thứ năm vào danh sách bốn ô đội hình. Nó không mặc định có HP, MP, SPD, lượt chủ động hoặc quyền nhận mục tiêu. Chỉ số phục vụ hiệu ứng vẫn là của thực thể này.

Hệ quả của đề xuất này:

- Không làm sai vị trí kề, nối vòng 1–4, roster snapshot hoặc điều kiện số thành viên gia tộc.
- Không nhận Lượt Thêm chỉ vì có nguồn sát thương riêng.
- Không tự được tính trong trung bình chỉ số tạo ra chính nó.
- Không tự kế thừa Gear IV, Trấn Phái, Rank, Thông Thạo, buff hoặc xuyên giáp của người cấp quyền.
- Các tương tác nghe sự kiện sát thương chỉ nhận nguồn mới nếu điều kiện của chúng cho phép; không giả danh Noelle để đi qua hook cũ.

Đây là đề xuất cho cách triển khai “nhân vật thứ 5”, chưa thay thế một quyết định cho phép nó trở thành đơn vị có thể bị tấn công.

### 3.3. Tiếp nhận và kích hoạt

Luồng đề xuất:

```text
Chưa kích hoạt → nhận nguyên tố vào hai ô → đủ một tổ hợp được phép
→ kết toán hành động hiện tại → tiêu nguyên tố và tạo thực thể
→ thực hiện hiệu ứng theo lịch → hết hạn → trở về trạng thái chờ
```

- Chuẩn hóa cặp nguyên tố để Thủy–Lôi và Lôi–Thủy tham chiếu cùng một tổ hợp. Thứ tự nạp không tạo một công thức mới.
- Đề xuất kết toán việc kích hoạt sau toàn bộ hành động, gồm nhiều hit và các mục tiêu, để không đổi luật giữa một kỹ năng đang giải. Người dùng ban đầu yêu cầu kích hoạt “ngay lập tức”; thời điểm cụ thể này **cần chốt**, không tự coi là đồng nghĩa.
- Đề xuất mỗi hành động nạp tối đa một lần mỗi hệ, không nạp theo từng địch/hit. Với Noelle, mỗi ô đã có giới hạn một tầng; vẫn cần chống lặp sự kiện.
- Trước khi phát sự kiện kích hoạt, phải khóa trạng thái và ghi mốc giới hạn theo vòng; phản ứng chen vào không thể kích hoạt lần thứ hai.
- Trong thời gian hoạt động, không lưu ngầm nguyên tố để bật một Chúc Phúc khác sau khi hết hạn.

Chưa chốt cách giữ/thay nguyên tố không tương thích, hoặc chọn tổ hợp khi một hành động đủ nhiều cặp cùng lúc. Xem mục 9.

## 4. Chỉ số và công thức dùng lại

Mỗi tổ hợp khai báo **chỉ số đầu ra**, **công thức**, **nhóm đơn vị lấy mẫu** và **thời điểm đánh giá**. Không bắt mọi Chúc Phúc phải có đủ bộ chỉ số của nhân vật.

| Thuộc tính thiết kế | Lôi Sấm Thịnh Nộ |
| --- | --- |
| Chỉ số chính | ATK — đã chốt |
| Công thức | Trung bình ATK động của các nhân vật Lôi và Thủy trong đội — đã chốt |
| Nhóm lấy mẫu | Thành viên đội có hệ Lôi/Thủy; có loại người đã gục hay không còn phải chốt |
| Thời điểm tính | Đề xuất tính lại trước mỗi đợt Chúc Phúc tấn công |
| Hệ số đợt đánh | 100% ATK |
| Nguyên tố của đợt đánh | Lôi và Nguyệt |
| Loại sát thương | Chưa chốt vật lí hay ma pháp |

Ví dụ kiểm thử công thức: nếu tập lấy mẫu có ATK động 80, 100 và 120 thì ATK Chúc Phúc bằng 100. Buff làm một giá trị tăng lên 150 sẽ cho trung bình mới 110 nếu dùng cách cập nhật động được đề xuất.

Phải xác định cách xử lý tập lấy mẫu rỗng, làm tròn và đơn vị đổi hệ. Không tự lấy ATK của Noelle làm phương án dự phòng.

**Chỉ số scale, loại sát thương và nguyên tố là ba thuộc tính độc lập.** Scale ATK không mặc định là vật lí; nguyên tố Nguyệt không mặc định bỏ DEF/RES hay gây sát thương HP tối đa.

Đòn Lôi + Nguyệt đề xuất đi qua quy tắc đa nguyên tố sẵn có: một hit mang hai hệ, không biến thành hai hit, không nhân điểm yếu hai lần. Tương tác kháng phải đi theo resolver chung, không tự viết công thức riêng.

## 5. Trình bày và thuật ngữ UI

**Đã chốt:** bảng theo phe, hai ô nguyên tố khi chưa kích hoạt. Các chi tiết sau là đề xuất UI:

```text
Nguyệt Quang Chúc Phúc          Nguyệt Quang Chúc Phúc
[ Lôi: đã nhận ] [ Thủy: chờ ]  Lôi Sấm Thịnh Nộ
                               ATK 128 · Còn 2 vòng
```

- Đổi tên theo tổ hợp hoạt động, hiển thị chỉ số và số vòng từ state/resolver thật.
- Ô chưa nạp phải phân biệt được với ô đã nạp bằng icon/nhãn, không chỉ dùng màu.
- Chỉ gợi ý những cặp đội có quyền sử dụng. Không hiển thị ba tổ hợp chưa có cấu hình như nội dung đã mở.
- Bảng Hồn Kiếm, Thuốc Súng, Bằng Chứng và Chúc Phúc phải cùng tồn tại nếu đội có các cơ chế đó; không ghi đè lẫn nhau.
- UI/VFX chỉ đọc sự kiện, không nạp nguyên tố hoặc gây sát thương. Rerender, chuyển tab hoặc bật/tắt log không chạy lại hiệu ứng.
- Chưa có yêu cầu thay toàn bộ background. Không tự thêm thay nền vì có thực thể hỗ trợ.

## 6. Cấu hình Technical Test: Noelle Model 4.0

### 6.1. Nhận diện và nguồn mở

Noelle Model 4.0 là **Hỗ trợ phòng thủ hệ Lôi**, mang Nguyệt Quang Chúc Phúc — **Lôi Sấm Thịnh Nộ**. Khi Noelle ở trong đội, cả đội được truy cập tổ hợp này.

Chỉ được mở trong **Developer Option**, thuộc nhóm **Technical Test Units**. Chưa đưa vào gacha hoặc nguồn nhận chính thức. Task tài liệu không tự cấp releaseId, chiếm ID deprecated hoặc thay đổi cờ developer của Astoria.

| HP | MP | ATK | MAG | DEF | RES | SPD |
| --- | --- | --- | --- | --- | --- | --- |
| 200 | Chưa chốt | 35 | 5 | 24 | 24 | 20 |

### 6.2. Lôi Sấm Thịnh Nộ — dữ kiện đã chốt

- Khi một nhân vật gây sát thương Lôi, tạo một **Lôi Nguyệt**, tối đa một tầng.
- Khi một nhân vật gây sát thương Thủy, tạo một **Thủy Nguyệt**, tối đa một tầng.
- Đủ cả hai thì tiêu cả hai để kích hoạt. Tối đa một lần kích hoạt mỗi vòng.
- ATK động bằng trung bình ATK của các nhân vật Lôi/Thủy trong đội.
- Tồn tại ba vòng. Khi hoạt động, không nhận hai tài nguyên trên, không kích hoạt lại và không kích hoạt Chúc Phúc loại khác.
- Ở đầu vòng và cuối vòng khi đang hoạt động, gây **100% ATK sát thương Lôi toàn bộ kẻ địch**, đồng thời mang thuộc tính **Nguyệt**.

### 6.3. Nội tại Noelle — dữ kiện đã chốt

- Cấp quyền Lôi Sấm Thịnh Nộ cho cả đội.
- Khi Lôi Sấm Thịnh Nộ đang hoạt động, mọi sát thương Noelle gây ra mang thêm thuộc tính Nguyệt.
- Tối đa **ba lần mỗi vòng**, khi Lôi Sấm Thịnh Nộ tấn công kẻ địch, Noelle Liên kích bằng kỹ năng thứ nhất, không tiêu MP.

**Đề xuất chống lặp:** một đợt AoE Chúc Phúc chỉ gọi một Liên kích, không gọi theo từng mục tiêu/hit. Đây là cạnh phản ứng riêng `Chúc Phúc → Noelle`, không mở quyền mọi Liên kích kích tiếp mọi Liên kích. Đòn của Noelle không gọi lại Chúc Phúc.

Với hai mốc đánh đầu/cuối vòng, số Liên kích thường có thể là hai/vòng; trần ba không tự tạo thêm đợt đánh thứ ba. Không tăng tần suất Chúc Phúc để dùng hết trần.

### 6.4. Ba kỹ năng chính — dữ kiện đã chốt

| Kỹ năng tạm gọi theo chức năng | Hiệu ứng | Hồi chiêu |
| --- | --- | --- |
| Kỹ năng 1 — công kích | Lôi AoE 150% ATK; gắn hai Sơ Hở Lôi | Không |
| Kỹ năng 2 — bảo vệ | Khiên toàn đội 100% ATK; giảm 15% sát thương nhận vào trong ba vòng | Một vòng |
| Kỹ năng 3 — hồi phục | Hồi HP đơn mục tiêu 150% ATK | Một vòng |

Chưa có tên chính thức, MP kỹ năng, loại sát thương của kỹ năng 1, thời hạn Sơ Hở nếu cần, hoặc thời hạn khiên. Không tự thêm Hội Tâm, khiêu khích, debuff, dispel hoặc hạn mức ngoài các dữ kiện này.

“Ba vòng” của giảm sát thương là clock vòng, không đổi thành ba lượt người nhận. Theo luật CD kỹ năng hiện tại, CD1 dùng ở R thì khóa R+1, dùng lại R+2; đây không phải CD gear.

Đánh thường chưa có cấu hình riêng. Rank/Thông Thạo cho test unit cũng chưa được chốt; không mặc định mở Thông Thạo từ vị trí trong roster.

## 7. Hợp đồng vòng đời cần hoàn tất trước triển khai

Đọc cùng [COMBAT_LIFECYCLE_CONTRACT](COMBAT_LIFECYCLE_CONTRACT.md). Bảng này phân biệt dữ kiện với phần còn mở:

| Mốc | Đã biết | Cần quyết định / đề xuất |
| --- | --- | --- |
| Vào trận | Có nhân vật cấp quyền thì đội truy cập tổ hợp | Có bắt đầu hai ô trống không; cấp quyền theo snapshot hay người cấp phải còn sống |
| Nhận sát thương nguyên tố | Noelle dùng Thủy/Lôi để tạo tầng | Chủ thể cùng phe; đánh thường, Liên kích, phản công, DoT, khiên hấp thụ, 0 damage và đa nguyên tố tính thế nào |
| Đủ nguyên tố | Tiêu cả hai, kích hoạt tối đa một lần/vòng | Sau hit hay sau hành động; thứ tự chọn khi đủ nhiều tổ hợp |
| Đang hoạt động | Không tích, không bật lại, không bật tổ hợp khác | Có bị xóa/cấm/khóa bởi hiệu ứng nào không |
| Đầu/cuối vòng | Có đợt AoE 100% ATK ở mỗi mốc hợp lệ | Chốt thứ tự với gear, companion, hồi phục, boss và kiểm tra thắng/thua |
| Hết hạn | Tồn tại ba vòng | Có tính vòng kích hoạt không; đợt cuối và Liên kích giải trước hay sau việc kết thúc |
| Bỏ lượt / Vòng Phụ | Giới hạn ghi theo vòng | Đề xuất không tick thêm ở Vòng Phụ; Choáng không mặc định ngừng thực thể tự động |
| Noelle bị hạ | Chưa chốt | Quyền truy cập, thực thể đang hoạt động và Liên kích phải có chính sách riêng |
| Cả đội bị hạ | Chưa chốt vai trò “người thứ 5” | Đề xuất không giữ trận sống chỉ nhờ Chúc Phúc không có HP |
| Wave/phòng/phase | Chưa chốt riêng | Nếu giữ cùng battle snapshot thì đề xuất giữ trạng thái và mốc tuyệt đối; không kích/đánh lại do đổi phòng |
| Encounter mới / thoát / reload | Chưa chốt riêng | Chỉ lưu trong checkpoint của nội dung có hỗ trợ; không tự thêm offline progress hoặc serialize battle cho mọi quest |

Ví dụ thời hạn cần chốt: kích giữa vòng R, tính cả vòng tạo và hết sau cuối R+2 thì các đợt còn lại là **cuối R, đầu/cuối R+1, đầu/cuối R+2 = năm đợt**. Không ghi “ba vòng luôn có sáu đợt” nếu dùng cách này. Kích tại đầu vòng cũng cần xác định có tham gia ngay đợt đầu vòng đang xử lý hay không.

## 8. Đối chiếu engine hiện tại và hướng tích hợp

Các đường dẫn sau là nền đã có, không chứng minh Chúc Phúc đã được triển khai:

| Nền hiện có | Cách tái sử dụng / giới hạn |
| --- | --- |
| [team-resources.js](../src/core/team-resources.js) | Tài nguyên tách theo phe, truy cập chung. Có thể tái dùng cách trình bày/serialize; không ép vòng đời Chúc Phúc vào một số nguyên tích–tiêu |
| [combat-summons.js](../src/core/combat-summons.js) | Có hook đợt đầu/cuối vòng, hạn mức đã reserve và companion không chiếm slot. Hiện dựa theo owner còn sống; cần đánh giá trước khi tái dùng cho thực thể thuộc phe |
| [elements.js](../src/core/elements.js), [weakness.js](../src/core/weakness.js) | Một hit nhiều hệ, điểm yếu/Sơ Hở. Không thêm một element tên “Chúc Phúc” |
| [follow-up.js](../src/core/follow-up.js) | Liên kích đồng đội không tự kích từ bản thân. Nguồn thực thể mới cần context/ID riêng và điều kiện explicit |
| [battle.js](../src/core/battle.js) | Start/end round, hành động, kết quả, wave và các đường skip cần tích hợp; không chỉ nối vào cuối resolveAction |
| [ENGINE_RULES](ENGINE_RULES.md) | Giữ stat scale tách damageType, quy tắc damage amp, Sơ Hở và giảm sát thương |

Kiến trúc đề xuất là module riêng cho Chúc Phúc, bộ định nghĩa tổ hợp và adapter sự kiện chiến đấu. Nên tách sự kiện nạp nguyên tố, kích hoạt, đợt đánh và kết thúc, có ID thực thể/phe/nguyên nhân để log, VFX và replay đọc được.

Không khai báo ID/schema chính thức trong tài liệu này. Khi triển khai, validator phải kiểm tra cặp hợp lệ, nguồn cấp quyền, công thức chỉ số và clock; không chấp nhận dữ liệu không đầy đủ bằng fallback ngầm.

## 9. Các quyết định còn mở

1. **Hai ô khi gặp nguyên tố không tương thích:** giữ ô đầu, thay ô đầu hay lưu các công thức riêng? Ví dụ có Thủy rồi nhận Quang. Đồng thời chốt tuổi thọ tầng chưa ghép và khóa thứ tự khi một đòn đủ nhiều cặp.
2. **Nguồn nạp:** chỉ sát thương từ cùng phe; tính những loại hành động nào; có yêu cầu mất HP/khiên thật không; một đòn mang hai nguyên tố có tự hoàn thành một cặp không.
3. **Thời điểm kích hoạt:** “ngay” sau hit hay sau toàn hành động; quyết định này ảnh hưởng việc thêm Nguyệt cho các hit còn lại của Noelle.
4. **Ba vòng và các đợt:** tính vòng gọi, lần đầu, đợt cuối và thứ tự kết toán phản ứng.
5. **Chỉ số:** lấy người còn sống hay mọi thành viên; cách cập nhật, tập rỗng, làm tròn; tác động buff/gear trực tiếp lên Chúc Phúc và cách tính số đồng đội.
6. **Sự tồn tại:** có HP/MP/SPD/lượt/target thật không, hay dùng thực thể hỗ trợ như đề xuất; Noelle bị hạ thì phần nào còn tồn tại.
7. **Thông số Noelle còn thiếu:** maxMP, MP kỹ năng, loại sát thương, thời hạn khiên/Sơ Hở và nguồn tiến trình Rank.
8. **PvP, AI và snapshot:** khi nào mở cho hai phe; phân loại sát thương tự động để áp soft cap; carry/checkpoint theo nội dung. Không ngầm bỏ cap vì nguồn không phải nhân vật thường.

Các mục này là checklist để chốt thiết kế, không phải yêu cầu tự chọn và implement trong task tài liệu.

## 10. Ma trận nghiệm thu cho lần triển khai sau

- Có Noelle: truy cập đúng Thủy–Lôi; không mở ba cặp chưa được cấp. Hai provider cùng tổ hợp không nhân đôi quyền.
- Hai ô, bốn cặp và thứ tự nạp hoạt động theo chính sách đã chốt; kiểm tra nguyên tố lạc cặp và nhiều cặp đồng thời.
- Nhiều hit/nhiều địch không nạp hoặc kích lặp ngoài quy tắc. Trong thời gian hoạt động không tích dự trữ; hết hạn trong cùng vòng vẫn giữ hạn mức đã kích.
- Đợt đầu/cuối vòng chỉ chạy một lần/mốc, cả khi choáng, Vòng Phụ, boss đổi phase, load checkpoint hoặc UI render lại. Kiểm thử bằng tiến trình trận thật.
- ATK và preview khớp công thức; thử buff hết hạn, đồng đội gục, đổi tập lấy mẫu và tập rỗng. Không tính chính Chúc Phúc vào công thức của nó.
- Lôi + Nguyệt là một hit: điểm yếu không nhân hai lần; Sơ Hở tiêu đúng; qua kháng, khiên và loại phòng thủ đã chọn.
- Một AoE Chúc Phúc chỉ gọi số Liên kích đã duyệt; Noelle không tự nối vô hạn, không tiêu MP cho Liên kích, trần ba giữ xuyên pha phụ. Thử mục tiêu gục giữa đợt và trận kết thúc trong chuỗi.
- Nguyệt bổ sung cho Noelle bật/tắt đúng biên thời hạn; không làm đổi nguyên tố dữ liệu gốc vĩnh viễn.
- Hai phe độc lập, ID nguồn không trùng; Không phá vị trí kề, tài nguyên chung, hàng lượt, điều kiện thắng/thua hoặc hiệu ứng theo số đồng đội.
- UI cùng tồn tại với Hồn Kiếm/Thuốc Súng/Bằng Chứng; tay cầm, mobile, tooltip, log và reduced-motion không đổi kết quả engine.
- Developer Option mở/tắt test unit an toàn; không xuất hiện trong gacha; không xóa hoặc cấp nhân vật chính thức do đổi tùy chọn.
- Checkpoint hợp lệ giữ trạng thái theo chính sách, không đánh lại mốc đã xử lý; dữ liệu cũ thiếu trường được normalize mà không tự kích Chúc Phúc.

Tài liệu này chưa yêu cầu chạy các kiểm thử gameplay trên, vì hệ thống chưa được triển khai.
