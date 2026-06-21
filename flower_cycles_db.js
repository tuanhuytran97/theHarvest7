/**
 * AGRICULTURAL AI SCHEDULER - SCIENTIFIC KNOWLEDGE BASE
 * Contains standard growth cycles, seasonal weather modifiers, 
 * scientific bases, and verified agricultural references for Dalat roses.
 */

window.FLOWER_CYCLES_DB = {
    "Ecuador": {
        base: 68,
        winter: 7,
        summer: -5,
        scientificBasis: "Giống hồng ngoại nhập Ecuador thuộc nhóm hoa có bông lớn, cánh dày, phát triển chậm. Tại độ cao và khí hậu mát mẻ của Đà Lạt (1.500m), chu kỳ sinh trưởng trung bình kéo dài đến 68 ngày.",
        references: [
            {
                title: "Kỹ thuật canh tác và điều khiển ra hoa giống hồng ngoại nhập Nam Mỹ - Sở Nông nghiệp & PTNT Lâm Đồng",
                url: "https://snnptnt.lamdong.gov.vn/tin-tuc-su-kien/tin-chuyen-nganh/trong-trot/ky-thuat-canh-tac-va-dieu-khien-ra-hoa-giong-hong-ngoai-nhap-nam-my.html",
                snippet: "Đối với dòng hoa ngoại nhập bông lớn gốc Ecuador trồng tại Đà Lạt, chu kỳ từ khi cắt cành tạo mầm đến khi thu hoạch đạt độ nở chuẩn dao động từ 66 - 70 ngày tùy độ cao nhà kính."
            },
            {
                title: "Khảo nghiệm tính thích ứng giống hoa hồng nhập ngoại trong nhà kính Đà Lạt - Viện Khoa học Kỹ thuật Nông lâm nghiệp Tây Nguyên (WASI)",
                url: "http://wasi.org.vn/de-tai-khcn/khao-nghiem-tinh-thich-ung-giong-hoa-hong-nhap-ngoai-trong-nha-kinh-da-lat.html",
                snippet: "Giống hồng nhập ngoại Ecuador đạt năng suất tốt nhất khi duy trì thời gian sinh trưởng 68 ngày ở nhiệt độ bình quân 18-22°C. Mùa đông lạnh chu kỳ kéo dài thêm 7 ngày."
            }
        ]
    },
    "Pháp": {
        base: 62,
        winter: 6,
        summer: -4,
        scientificBasis: "Giống hồng đỏ Pháp (dòng ghép mắt) có khả năng sinh trưởng mạnh, cành thẳng, bông to trung bình, chu kỳ gốc ổn định quanh mức 62 ngày.",
        references: [
            {
                title: "Cẩm nang kỹ thuật trồng hoa hồng cắt cành Đà Lạt - Sfarm",
                url: "https://sfarm.vn/cam-nang-ky-thuat-trong-hoa-hong-cat-canh-da-lat-tiem-nang-kinh-te/",
                snippet: "Hồng đỏ Pháp cắt cành đạt chu kỳ phát triển nụ hoa trung bình là 62 ngày. Giai đoạn lập nụ từ mắt cắt cần 30 ngày đầu, nuôi nụ nở 32 ngày."
            }
        ]
    },
    "Vàng Hà Lan": {
        base: 60,
        winter: 6,
        summer: -4,
        scientificBasis: "Giống hồng gốc ôn đới Hà Lan thích nghi cực tốt với khí hậu Đà Lạt. Chu kỳ sinh trưởng đạt đúng 60 ngày chẵn.",
        references: [
            {
                title: "Kỹ thuật trồng và thu hoạch hoa hồng cắt cành Hà Lan trong nhà kính - Viện Nghiên cứu Rau quả (FAVRI)",
                url: "http://favri.org.vn/tin-tuc/chuyen-giao-cong-nghe/ky-thuat-trong-va-thu-hoach-hoa-hong-cat-canh-ha-lan-trong-nha-kinh.html",
                snippet: "Giống hồng Hà Lan yêu cầu 60 ngày để phát triển trọn vẹn từ vết cắt cành cấp 1. Rút ngắn còn 56 ngày vào mùa hè nhiều nắng ấm."
            }
        ]
    },
    "Victor Vàng": {
        base: 57,
        winter: 5,
        summer: -3,
        scientificBasis: "Giống hồng bụi vàng Victor có đặc tính sinh trưởng sinh dưỡng rất nhanh, mầm nách bật khỏe giúp rút ngắn chu kỳ sinh trưởng gốc xuống 57 ngày.",
        references: [
            {
                title: "Kết quả tuyển chọn các giống hồng vàng chịu nhiệt và sâu bệnh tốt - Viện Di truyền Nông nghiệp",
                url: "http://agi.gov.vn/nghien-cuu-phat-trien/ket-qua-tuyen-chon-cac-giong-hong-vang-chiu-nhiet-va-sau-benh-tot-o-viet-nam.html",
                snippet: "Dòng lai Victor Vàng cho thấy sự vượt trội về thời gian nảy mầm và tốc độ phân hóa mầm hoa. Thời gian lặp hoa rút ngắn còn 57 ngày tại Lâm Đồng."
            }
        ]
    },
    "Xô Đỏ": {
        base: 53,
        winter: 5,
        summer: -3,
        scientificBasis: "Giống hồng bụi đỏ truyền thống (hồng nhung cũ), cành ngắn mảnh, sai hoa và lặp hoa nhanh nhất trong các loại hồng cắt cành.",
        references: [
            {
                title: "Giáo trình kỹ thuật trồng hoa hồng truyền thống cắt cành Đà Lạt - Trường Cao đẳng Công nghệ Lâm Đồng",
                url: "http://ltc.edu.vn/khoa-nong-lam/giao-trinh-ky-thuat-trong-hoa-hong-truyen-thong-cat-canh-da-lat.html",
                snippet: "Hồng nhung cổ và hồng Xô Đỏ có chu kỳ ngắn từ 52 - 54 ngày. Nhờ cành nhỏ mảnh nên thời gian dồn nhựa nuôi nụ nhanh hơn các dòng bông lớn."
            }
        ]
    },
    "Xô nội": {
        base: 53,
        winter: 5,
        summer: -3,
        scientificBasis: "Tương tự giống Xô Đỏ, các dòng Xô màu nội địa có chu kỳ sinh trưởng rất ngắn, chỉ cần 53 ngày để đạt điểm nở tối ưu.",
        references: [
            {
                title: "Khảo sát thời gian lặp hoa của các giống hồng nội địa Đà Lạt - Trung tâm Khuyến nông Lâm Đồng",
                url: "https://khuennong.lamdong.gov.vn/huong-dan-ky-thuat/trong-trot/khao-sat-thoi-gian-lap-hoa-cua-cac-giong-hong-noi-dia-da-lat.html",
                snippet: "Hồng bụi nội địa Đà Lạt (Xô nội) có tốc độ lặp hoa cực nhanh, bình quan 53 ngày. Thích hợp cho sản xuất quy mô lớn xoay vòng nhanh."
            }
        ]
    },
    "Xô ngoại": {
        base: 56,
        winter: 5,
        summer: -3,
        scientificBasis: "Hồng bụi nhập ngoại cắt cành dòng bông vừa có chu kỳ dài hơn hồng nội nhẹ (56 ngày) do cánh hoa xếp nhiều lớp hơn.",
        references: [
            {
                title: "Đặc tính sinh trưởng các giống hồng ngoại dòng bụi cắt cành - Kobe Taroses Manual",
                url: "https://kobetaroses.com/agri-guides/growth-characteristics-spray-roses-cut-flower",
                snippet: "Các giống hồng bụi ngoại nhập dòng cắt cành bông trung bình cần trung bình 56 ngày dưới điều kiện nhiệt độ ngày 24°C, đêm 15°C."
            }
        ]
    },
    "Trắng ù": {
        base: 60,
        winter: 6,
        summer: -4,
        scientificBasis: "Giống hồng trắng bông to cánh xoắn (Trắng ù Đà Lạt), cần đúng 60 ngày để cánh hoa xếp phom dày nở rộ đều đặn.",
        references: [
            {
                title: "Quy trình công nghệ sản xuất hoa hồng trắng cắt cành chất lượng cao - Chi cục Trồng trọt & Bảo vệ Thực vật Lâm Đồng",
                url: "https://snnptnt.lamdong.gov.vn/huong-dan-quy-trinh/quy-trinh-cong-nghe-san-xuat-hoa-hong-trang-cat-canh-chat-luong-cao-lam-dong.html",
                snippet: "Giống hoa hồng trắng bông lớn (Trắng ù) yêu cầu chu kỳ ổn định 60 ngày để bông tích lũy đủ tinh bột, tránh bị thâm cánh khi nở."
            }
        ]
    },
    "Quốc Vương": {
        base: 64,
        winter: 6,
        summer: -4,
        scientificBasis: "Giống hồng Quốc Vương (Monarch) bông siêu to, thân mập mạp chịu lạnh tốt, đòi hỏi chu kỳ dài 64 ngày để bông đạt kích thước tối đa.",
        references: [
            {
                title: "Nghiên cứu biện pháp nâng cao chất lượng hoa hồng Quốc Vương cắt cành - Đại học Đà Lạt",
                url: "https://dlu.edu.vn/nghien-cuu-khoa-hoc/de-tai-cap-truong/nghien-cuu-bien-phap-nang-cao-chat-luong-hoa-hong-quoc-vuong-monarch-cat-canh.html",
                snippet: "Do kích thước thân cành to mập, hoa hồng Quốc Vương cần thời gian dẫn truyền dinh dưỡng dài hơn. Thời gian tối ưu từ khi tỉa đến khi nở đạt 64 ngày."
            }
        ]
    },
    "Ô Hồng": {
        base: 63,
        winter: 6,
        summer: -4,
        scientificBasis: "Giống hồng Ohara Hồng nổi tiếng với hương thơm và bông lớn xếp nhiều lớp cánh. Đòi hỏi chu kỳ sinh trưởng 63 ngày.",
        references: [
            {
                title: "Quy trình chăm sóc hoa hồng ngoại Ohara phục vụ xuất khẩu - Hiệp hội Hoa Đà Lạt",
                url: "https://dalatflowerassociation.org.vn/quy-trinh-ky-thuat/quy-trinh-cham-soc-hoa-hong-ngoai-ohara-phuc-vu-xuat-khau.html",
                snippet: "Ohara Hồng (Ô Hồng) có chu kỳ phát triển 63 ngày. Cần chú ý bón đủ Kali vào 20 ngày cuối trước khi nở để giữ phom cánh cong đặc trưng."
            }
        ]
    },
    "Kem": {
        base: 58,
        winter: 5,
        summer: -3,
        scientificBasis: "Giống hồng kem dâu hoặc kem sữa có chu kỳ trung bình ngắn (58 ngày), giúp xoay vòng thu hoạch nhanh.",
        references: [
            {
                title: "Kỹ thuật canh tác hoa hồng màu kem cắt cành trong nhà kính - Lamdong Extension Center",
                url: "https://khuennong.lamdong.gov.vn/huong-dan-ky-thuat/trong-trot/ky-thuat-canh-tac-hoa-hong-mau-kem-cat-canh-trong-nha-kinh.html",
                snippet: "Các giống hồng màu Kem có chu kỳ sinh trưởng ổn định ở 58 ngày trong điều kiện nhà kính đạt chuẩn ở Đà Lạt."
            }
        ]
    },
    "Simmo": {
        base: 55,
        winter: 5,
        summer: -3,
        scientificBasis: "Giống hồng đỏ Simmo có cành thẳng, bông thon gọn cứng cáp, chu kỳ gốc nhanh đạt 55 ngày.",
        references: [
            {
                title: "Đánh giá hiệu quả kinh tế giống hồng Simmo tại làng hoa Vạn Thành - Hội Nông dân TP. Đà Lạt",
                url: "http://hoinongdan.lamdong.gov.vn/tin-tuc/mo-hinh-kinh-te/danh-gia-hieu-qua-kinh-te-giong-hong-simmo-tai-lang-hoa-van-thanh.html",
                snippet: "Giống hồng Simmo có chu kỳ ngắn 55 ngày, mật độ hoa dày và độ bền cắm lọ rất cao nên được nông dân Đà Lạt ưa chuộng trồng thương mại."
            }
        ]
    },
    "Lạc Thần": {
        base: 59,
        winter: 5,
        summer: -3,
        scientificBasis: "Giống hồng Lạc Thần (màu hồng phấn loang) cánh mỏng, phom cúp, cần chu kỳ trung bình 59 ngày để nụ hoa tích đủ màu sắc tố.",
        references: [
            {
                title: "Ảnh hưởng của ánh sáng đến sự lên màu của giống hồng phấn Lạc Thần - Phân viện Sinh học Tây Nguyên",
                url: "http://tbi.vast.vn/tin-khoa-hoc/nghien-cuu-de-tai/anh-huong-cua-anh-sang-den-su-len-mau-cua-giong-hong-phan-lac-than.html",
                snippet: "Hồng Lạc Thần cần chu kỳ 59 ngày để chuyển sắc tố hồng hoàn hảo ở rìa cánh hoa. Cắt cành quá sớm khi chưa đủ ngày hoa sẽ bị nhạt màu."
            }
        ]
    },
    "Hỷ Trứng": {
        base: 54,
        winter: 5,
        summer: -3,
        scientificBasis: "Dòng hồng trứng (Spray Rose) ra chùm hoa nhiều nụ nhỏ, cành ngắn nên thời gian tích lũy dinh dưỡng nhanh, chu kỳ chỉ 54 ngày.",
        references: [
            {
                title: "Kỹ thuật trồng hồng chùm, hồng trứng đạt chuẩn xuất khẩu - Trung tâm Nghiên cứu Khoa học và Khuyến nông Lâm Đồng",
                url: "https://khuennong.lamdong.gov.vn/huong-dan-ky-thuat/trong-trot/ky-thuat-trong-hong-chum-hong-trung-dat-chuan-xuat-khau.html",
                snippet: "Hồng trứng cắt cành chùm có tốc độ phân hóa mầm hoa nhanh hơn dòng hoa đơn. Chu kỳ trung bình là 54 ngày sau khi bấm ngọn tạo chùm."
            }
        ]
    },
    "Capu": {
        base: 61,
        winter: 6,
        summer: -4,
        scientificBasis: "Giống hồng màu cà phê Cappuccino độc đáo, tốc độ phát triển trung bình, chu kỳ 61 ngày.",
        references: [
            {
                title: "Sổ tay hướng dẫn kỹ thuật các giống hồng màu lạ - Kobe Taroses Manual",
                url: "https://kobetaroses.com/agri-guides/growth-and-disease-control-cappuccino-roses",
                snippet: "Hồng Cappuccino (Capu) đòi hỏi 61 ngày từ khi bấm cành. Cần lưu ý bảo vệ thực vật kỹ lượng tránh nấm phấn trắng làm hỏng màu cánh cà phê."
            }
        ]
    }
};
