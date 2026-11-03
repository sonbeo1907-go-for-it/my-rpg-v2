# Câu chuyện Lữ Hành

`/stories`: ba bìa/trang desktop, một bìa/trang mobile, phân trang URL. Catalog ở data/travelerStories.json; `/stories/:id` dùng luồng chọn Quest. Takeshi/Fiona đã có nội dung, không còn placeholder.

## Quyền vào và Level

Iris, Takeshi, Fiona là ba truyện nhập môn. Sách order>3 cần hoàn thành finales cả ba, độc lập số bìa trên mobile (story-gates.js). Chương sau cần first-clear chương trước. Ba chương cố địnhLv10/20/30, gồm mọi wave/phase; epilogue Arthur riêngLv30.

Nhân vật gacha không bắt sở hữu hoặc tham chiến để chơi truyện, trừ requiredPartyIds được chỉ định. Takeshi bắt buộc cả ba màn, Iris ở chương cuối, Arthur ở epilogue. Engine kiểm tra quyền vào/đội hình, không chỉ ẩn nút UI.

## Phần thưởng

Không cấp EXP. Thưởng lần đầu/gear slot/upgrade/recipe theo encounter, commit sau persist. Truyện gacha thường I/II5 Pure+500 Coin, III5 Pure+1 Original; công thức Trấn ở chươngII nếu có khai báo. Không suy ra tặng nhân vật hay đổi sang Blueprint.

Iris/Fiona/Takeshi có nâng cấp và ô gear riêng. Fiona đã có Tia sáng le lói, Takeshi đã mở Tâm nhãn kiếm sĩ qua chươngIII. Hoàn thành cả ba mở epilogue Hắc ảnh Arthur; thắng mở hai nâng cấp Ogre’s Bane. Sáu starter không dùng nguồn10 Blueprint của20 Trấn mới.

## Thêm chương

1. Sách khai báo id/characterId/name/art/order/chapters; đổi tên giữ ID.
2. Encounter khai báo travelerStory, requires.firstClear, requiredPartyIds nếu cần; level10/20/30, referenceLevel1.
3. firstClearRewards qua handler/validator chung; upgrade qua story-events, không sửa global definition.
4. Không đưa chương vào pool dungeon/Quest thường. Dùng story-waves, tổng thưởng cuối và đường trở về đúng chương.
5. Bìa SVG local, không nhúng text/script/mạng ngoài. Bìa vật thể không buộc có người. Ba art Sieg/Monica/Victorina đã được người dùng cung cấp bản thay, không sinh đè từ generator cũ.
6. Test khóa/URL/đội bắt buộc/retry save/migration/thưởng một lần/XP0/Level/UI và tay cầm.

Chi tiết ở FIONA_LIFE_ORIGIN_STORY, TAKESHI_EPILOGUE, ARTESIA_STORY, CHELSEA và COMPANION_EXCLUSIVES. Log mô phỏng trước Level/Rank không phải chứng cứ balance hiện hành.
