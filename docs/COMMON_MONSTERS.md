# Quái thường và Quest dễ

Mười loại quái dùng cơ chế engine hiện có. Có thể dùng ID trong `encounter.enemies`, lặp ID để thêm nhiều cá thể. Tất cả tám Quest mới dùng `rewardTier: normal`, `bgm: normal`, nhận 50 Coin mỗi chiến thắng; không có thưởng lần đầu riêng.

| ID | Quái | HP | Điểm yếu | Đặc điểm |
| --- | --- | ---: | --- | --- |
| `wild_boar` | Lợn rừng | 135 | Phong, Hỏa | Húc đơn mục tiêu; chậm |
| `forest_rat` | Chuột rừng | 65 | Hỏa, Thổ | Nhanh, ít máu và ít giáp |
| `giant_beetle` | Bọ cánh cứng | 115 | Hỏa, Lôi | DEF 24, RES 5; tự tạo 20 khiên, hồi 2 vòng |
| `cave_bat` | Dơi hang | 80 | Quang, Lôi | Cắn hai nhịp nhẹ, SPD 20 |
| `marsh_snake` | Rắn đầm lầy | 95 | Hỏa, Phong | Cắn gắn Nhiễm độc trong 2 lượt; không cộng dồn |
| `pond_crab` | Cua đồng | 110 | Lôi, Thổ | Mai cứng, RES thấp, chậm |
| `forest_spider` | Nhện rừng | 75 | Quang, Hỏa | Hai nhát cắn Ám nhẹ; không phải Nhện khổng lồ |
| `wild_mushroom` | Nấm độc | 105 | Hỏa, Phong | Phấn phép Thổ diện rộng nhẹ, không gắn độc kéo dài |
| `ember_wisp` | Đốm lửa | 85 | Thủy | Phép Hỏa, ít DEF; đòn cơ bản cũng là phép |
| `moss_slime` | Nhầy rêu | 125 | Hỏa, mọi đòn vật lí | Ít DEF, RES khá; trùng điểm yếu vẫn chỉ tăng 50% một lần |

## Quest có sẵn

| ID | Tên | Đội quái |
| --- | --- | --- |
| `boar_field` | Lợn rừng phá ruộng | 1 lợn rừng + 2 chuột rừng |
| `granary_rats` | Kho thóc náo loạn | 3 chuột rừng |
| `beetle_orchard` | Bọ phá vườn rau | 2 bọ cánh cứng |
| `bat_roost` | Dơi quấy hang đá | 3 dơi hang |
| `riverbank_pests` | Bờ suối xôn xao | 2 cua đồng + 1 nhầy rêu |
| `marsh_trail` | Lối mòn đầm lầy | 1 rắn đầm lầy + 1 nhện rừng |
| `mushroom_grove` | Bụi nấm bên đường | 2 nấm độc + 1 chuột rừng |
| `flickering_woods` | Đốm lửa lạc trong rừng | 2 đốm lửa + 1 nhầy rêu |

Kiểm tra cân bằng: năm seed mỗi Quest với đội mặc định Arthur/Iris/Elaine/Garrek, không gear, không nâng cấp truyện, chỉ đánh thường. Cả 40 trận phải thắng trong tối đa 10 vòng, không ai gục; nhận đúng 50 Coin và không nhận thưởng lại trên cùng một trận. Đây là mức tham chiếu đội bốn người, không phải bảo đảm mọi đội solo hoặc đội thiếu thành viên đều thắng.
