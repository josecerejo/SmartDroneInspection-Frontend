# Enterprise UI Design Guidelines & Anti-Pattern Prevention (UI Quality Standard)

> **Mục đích:** Tài liệu này là quy chuẩn bắt buộc (Engineering Standard) cho toàn bộ lập trình viên và AI Agent khi triển khai giao diện Frontend trong dự án **SmartDroneInspection**.
> **Mục tiêu:** Loại bỏ hoàn toàn phong cách thiết kế "AI-generated / Template nghiệp dư" (quá nhiều card lồng nhau, bo góc quá tròn như đồ chơi, bóng đổ mờ mịt, gradient sặc sỡ, màu sắc lung tung). Thay thế bằng phong cách **Enterprise High-Density Technical Tool** (phẳng, sắc nét, mật độ thông tin cao, trật tự thị giác rõ ràng tương tự Datadog, GitHub, Vercel, Linear, AWS Console).

---

## 1. Bản chất vấn đề: Nhận diện các lỗi "AI UI" điển hình

AI thường có xu hướng tạo ra giao diện mắc 6 lỗi chí mạng sau:
1. **Lạm dụng Card (Card-soup):** Bọc mọi thứ vào `<Card>`, `<Paper>` với padding lớn, khiến giao diện bị phân mảnh thành hàng chục khối vuông vụn vặt, lãng phí diện tích, thiếu tính liền mạch.
2. **Bo góc quá đà (Over-rounded corners):** Dùng `borderRadius: 16px`, `24px` hoặc `999px` (pill) cho cả container dữ liệu kỹ thuật, làm mất tính chuyên nghiệp của hệ thống quản lý hạ tầng công nghiệp.
3. **Lạm dụng Gradient & Glow:** Dùng dải màu gradient tím - xanh, hiệu ứng phát sáng mờ mịt không rõ mục đích công năng.
4. **Bóng đổ mờ ảo (Blurry heavy shadows):** Dùng box-shadow quá đậm hoặc quá phân tán, tạo cảm giác giao diện "nổi bồng bềnh" rẻ tiền.
5. **Màu sắc thiếu kỷ luật:** Tự ý gán màu tùy tiện (xanh dương, tím, vàng, cam lung tung trên cùng một màn hình).
6. **Mật độ thông tin quá loãng (Low data density):** Khoảng cách trống quá lớn khiến kỹ sư, thanh tra phải cuộn chuột liên tục để xem một vài thông số cơ bản.

---

## 2. Các nguyên tắc cốt lõi (The Core Principles)

### 2.1. Phẳng & Kỷ luật phân tầng (Flat & Architectural Layering)
* **Quy tắc phân vùng:** Sử dụng đường kẻ mảnh (`1px solid var(--mui-palette-divider)`) và màu nền phân cấp (`background.default` vs `background.paper`) để phân định các vùng chức năng, **KHÔNG** dùng bóng đổ dày hay viền màu lòe loẹt.
* **Hạn chế lồng Card:** Một view chỉ nên có 1 container chính hoặc bảng dữ liệu liền mạch. Không bọc từng dòng, từng mục nhỏ vào một thẻ Card riêng biệt.

### 2.2. Độ bo góc chuẩn kỹ thuật (Border Radius Discipline)
Tuyệt đối tuân thủ thang đo bo góc kỹ thuật:
* **0px - 4px:** Dùng cho Table, Cell, Tabs, Code blocks, Status bar, Progress bar.
* **6px:** Dùng cho Chip, Badge, Tooltip, Dropdown Menu item.
* **8px (Tiêu chuẩn tối đa cho Controls):** Input fields (`TextField`, `Select`), Buttons (`Button`), Alert box.
* **8px - 10px (Tối đa cho Panel/Dialog):** Modal dialog, Drawer, Outer main panels.
* **NGHIÊM CẤM:** Không dùng `borderRadius > 10px` cho bất kỳ container dữ liệu nào (trừ Avatar tròn `50%` hoặc Tag viên thuốc `pill` cho số đếm nhỏ).

### 2.3. Loại bỏ Gradient trang trí (Zero Decorative Gradient)
* Nền button, background, header, thanh điều hướng **PHẢI là màu đơn sắc (Solid Color)** hoặc trong suốt với viền mảnh (`outlined`).
* Tuyệt đối không dùng `linear-gradient(...)` cho nền card, hero banner hay nút bấm trong không gian làm việc tác vụ (Workspace/Dashboard).

### 2.4. Mật độ thông tin cao (High Density & Scannability)
* Ưu tiên bảng dữ liệu (`Table`) có đường kẻ mảnh, dòng gọn gàng (table row height từ 36px đến 48px).
* Sử dụng danh sách theo cặp **Key - Value** tinh gọn thay vì nhét mỗi trường vào một ô card riêng.
* Typography phân cấp rõ ràng: Tiêu đề vừa phải (`h5`, `h6`), nhãn mô tả (`caption`, font-size `0.75rem`), văn bản nội dung (`body2`, font-size `0.875rem`).

---

## 3. Bảng quy chuẩn Design Tokens

| Thành phần | Quy chuẩn được phép | Điều cấm kỵ |
| :--- | :--- | :--- |
| **Border Radius** | Button/Input: `8px`<br>Badge/Chip: `6px`<br>Modal/Drawer: `8px - 10px` | Bo tròn `16px`, `24px` cho container dữ liệu. |
| **Shadows (Bóng)** | Phẳng hoàn toàn (`boxShadow: 'none'`) hoặc bóng vi mô: `0 1px 2px 0 rgba(0,0,0,0.05)` | `box-shadow` dày, mờ ảo (`0 10px 25px ...`), glow effect. |
| **Borders** | `1px solid var(--mui-palette-divider)` | Viền màu mè (`border: 2px solid primary`), viền đứt nét không mục đích. |
| **Màu nhấn (Accent)** | Dùng màu chủ đạo (`#5750F1` hoặc `#3758F9`) có chủ đích cho primary CTA và tab active. | Nhuộm màu khắp nơi; đổi màu liên tục giữa các trang. |
| **Màu trạng thái** | Success: `#176B52`<br>Warning: `#8C520B`<br>Error: `#A8323B`<br>Info: `#225F85` | Dùng màu neon rực rỡ, chữ trắng trên nền chip quá chói lóa. |
| **Padding** | Nhỏ gọn, tỷ lệ chuẩn: `8px`, `12px`, `16px`, tối đa `24px` cho outer container. | Padding `32px` - `48px` gây loãng thông tin trên màn hình thao tác. |

---

## 4. Danh sách kiểm tra "Do & Don't" khi viết code

### ❌ DON'T (CẤM LÀM):
```tsx
// ❌ SAI: Kiểu thiết kế AI lạm dụng Card, bo góc to, padding khổng lồ, bóng dày
<Card sx={{ borderRadius: '20px', p: 4, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
  <CardContent>
    {items.map(item => (
      <Card key={item.id} sx={{ borderRadius: '16px', mb: 2, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
        <Typography variant="h5">{item.name}</Typography>
        ...
      </Card>
    ))}
  </CardContent>
</Card>
```

### ✅ DO (NÊN LÀM):
```tsx
// ✅ ĐÚNG: Giao diện Enterprise kỹ thuật số, phẳng, phân cách bằng border và bảng rõ ràng
<Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5, bgcolor: 'background.paper', overflow: 'hidden' }}>
  <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <Typography variant="subtitle2" sx={{ fontWeight: 650, color: 'text.primary' }}>
      DANH SÁCH KHUYẾT TẬT ĐÃ PHÁT HIỆN ({items.length})
    </Typography>
    <Button size="small" variant="contained" sx={{ borderRadius: 1 }}>Thêm mới</Button>
  </Box>
  <Table size="small">
    <TableHead>
      <TableRow>
        <TableCell>MÃ</TableCell>
        <TableCell>MÔ TẢ</TableCell>
        <TableCell>MỨC ĐỘ</TableCell>
        <TableCell align="right">THAO TÁC</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {items.map(item => (
        <TableRow key={item.id} hover>
          <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{item.code}</TableCell>
          <TableCell>{item.name}</TableCell>
          <TableCell><StatusChip status={item.severity} /></TableCell>
          <TableCell align="right">...</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</Box>
```

---

## 5. Quy tắc cho các thành phần cụ thể

### 5.1. Dashboard & Thống kê (KPI Cards / Metrics)
* Không dùng icon 3D hoặc bóng đổ màu theo card.
* Sử dụng `MetricCard` tiêu chuẩn: Nền phẳng, viền `1px solid divider`, nhãn nhỏ viết hoa nhẹ hoặc in đậm vừa phải, số liệu to và rõ (`Geist Mono` hoặc font số sạch sẽ), kèm nhãn thay đổi tinh tế.

### 5.2. Biểu mẫu nhập liệu (Forms & Inputs)
* Input fields đồng nhất chiều cao (size `small` hoặc `medium` gọn, `borderRadius: 8px`).
* Label nằm phía trên hoặc dùng standard outlined MUI label. Không đặt icon rườm rà trong input nếu không cần thiết.
* Nút bấm Submit/Action: Không dùng hiệu ứng nổi phồng (scale up on hover). Chỉ đổi nhẹ màu nền (`hover: background-color`).

### 5.3. Trạng thái và Nhãn (Chips & Badges)
* `borderRadius: 6px` (hoặc `4px`), font-size `0.75rem`, font-weight `600`.
* Dùng kiểu `soft / subtle background` (nền nhạt `color-mix` hoặc alpha 10%, chữ màu đậm tương ứng). Tránh dùng chip nền đặc chói mắt làm lu mờ nội dung chính.

### 5.4. Chế độ Sáng / Tối (Dark / Light Mode)
* Trong dark mode: Nền chính là carbon/slate đen dịu (`#0B0F17` hoặc `#0F172A`), container là `#111827` hoặc `#1E293B`.
* Viền phân cách dùng màu divider tối (`#1E293B` hoặc `#334155`), tuyệt đối không để viền trắng sáng sắc lẹm hoặc bóng đổ đen ngòm.

---

## 6. Cam kết thực thi đối với AI Agent
Khi nhận yêu cầu code hoặc refactor UI trong dự án này, Agent **BẮT BUỘC** phải:
1. Đọc và đối chiếu với file quy chuẩn này (`UI_QUALITY_STANDARD.md`).
2. Tự động loại bỏ bất kỳ thuộc tính nào vi phạm: `linear-gradient` trên bề mặt công việc, `borderRadius > 10px` cho container, `boxShadow` nhiều lớp mờ mịt, Card lồng Card vô nghĩa.
3. Giữ giao diện mang phong cách công cụ kỹ thuật chuyên nghiệp (Technical Tooling), hướng tới độ tin cậy và khả năng xử lý dữ liệu nhanh chóng của doanh nghiệp.
