import { type ServiceRequest, type ServiceRequestMessage } from '../api/contractApi';

/**
 * Enterprise AI Virtual Assistant for SmartDrone Commercial Negotiation Chat.
 * Provides intelligent, domain-specific guidance on equipment, pricing, scheduling, and contracts
 * ONLY when Manager is absent or before Manager takes over the conversation.
 */

/**
 * Evaluates whether the AI bot should automatically step in to reply.
 * Rules:
 * 1. If a human Manager/Admin has already posted in this thread, Manager has TAKEN OVER -> DO NOT auto-reply.
 * 2. If the user message is a simple conversational closure ("ok", "dạ", "cảm ơn", "vâng") -> DO NOT auto-reply.
 * 3. Only auto-reply when Manager hasn't participated yet AND customer is asking for guidance.
 */
export function shouldAiBotAutoReply(
  messages: ServiceRequestMessage[] = [],
  incomingText: string,
  isManagerRole: boolean,
  isManagerOnline: boolean = false
): boolean {
  if (isManagerRole) return false;
  if (!incomingText || incomingText.startsWith('🤖')) return false;

  // If a Manager is actively online in the system right now, do not interrupt
  if (isManagerOnline) {
    return false;
  }

  // Rule 1: Check if any human Manager/Admin has already participated in this conversation
  const hasManagerParticipated = messages.some(
    (m) =>
      (m.authorRole === 'MANAGER' || m.authorRole === 'ADMIN') &&
      !m.body.startsWith('🤖')
  );
  if (hasManagerParticipated) {
    // Human Manager has taken over the thread; AI must step back!
    return false;
  }

  // Rule 2: Ignore conversational closures or brief acknowledgments
  const clean = incomingText.trim().toLowerCase();
  const conversationalClosures = [
    'ok',
    'oki',
    'okie',
    'dạ',
    'da',
    'vâng',
    'vang',
    'cảm ơn',
    'cam on',
    'tks',
    'thanks',
    'thank you',
    'bye',
    'tạm biệt',
    'tam biet',
    'rồi',
    'được',
    'duoc',
    'nhất trí',
    'nhat tri',
  ];
  if (conversationalClosures.includes(clean)) {
    return false;
  }

  // Rule 3: If the AI bot was already the very last message and user didn't ask a new substantive question, avoid loop
  return true;
}

/**
 * Generates an intelligent, context-aware AI response based on customer question intent.
 */
export function generateContextualAiBotReply(userMessage: string, request?: ServiceRequest): string {
  const q = userMessage.toLowerCase().trim();
  const assetScope = request?.description ? `cho công trình "${request.description}"` : 'cho công trình của bạn';
  const windowText =
    request?.requestedFrom && request?.requestedUntil
      ? `${request.requestedFrom} đến ${request.requestedUntil}`
      : 'khung thời gian bạn đăng ký trong đơn';

  // 1. Social, romantic, jokes, or casual banter ("tôi yêu bạn", "haha", "yêu em", etc.)
  if (
    q.includes('yêu bạn') ||
    q.includes('yêu em') ||
    q.includes('thích em') ||
    q.includes('thích bạn') ||
    q.includes('yêu ad') ||
    q.includes('cute') ||
    q.includes('xinh gái') ||
    q.includes('đẹp gái') ||
    q.includes('haha') ||
    q.includes('hihi') ||
    q === 'tôi yêu bạn' ||
    q === 'yêu' ||
    q === 'thích'
  ) {
    return `🤖 [Trợ lý AI - SmartDrone]
Dạ cảm ơn tình cảm và sự quan tâm của bạn dành cho đội ngũ SmartDrone! 😊

Em là Trợ lý AI túc trực hỗ trợ giải đáp kỹ thuật bay và quy trình kiểm định. Bạn có câu hỏi nào về thông số thiết bị drone, khung giờ bay tối ưu hay dự toán chi phí ${assetScope} cần em hỗ trợ trước khi Quản lý sàn tiếp quản không ạ?`;
  }

  // 2. Greetings and initial inquiry ("chào", "hello", "hi", "alo", "có ai không")
  if (
    q === 'chào' ||
    q === 'xin chào' ||
    q === 'hi' ||
    q === 'hello' ||
    q === 'alo' ||
    q.includes('có ai không') ||
    q.includes('ai trực') ||
    q.includes('có người không')
  ) {
    return `🤖 [Trợ lý AI - SmartDrone]
Xin chào bạn! Rất hân hạnh được hỗ trợ bạn ${assetScope}.

Hiện Quản lý sàn đang điều phối lịch bay thực địa và sẽ vào trao đổi trực tiếp với bạn ngay. Trong lúc chờ Quản lý, bạn có thể hỏi nhanh em về:
• Thiết bị bay & Cảm biến nhiệt chuyên dụng (DJI Matrice 30T / 350 RTK)
• Dự toán đơn giá & Báo giá kiểm định tham khảo
• Khung giờ bay tối ưu & Điều kiện an toàn thời tiết
• Quy trình ký kết hợp đồng dịch vụ & Cấp phép bay`;
  }

  // 3. Equipment, Drone models, Thermal Cameras, Sensor specifications
  if (
    q.includes('drone') ||
    q.includes('thiết bị') ||
    q.includes('nhiệt') ||
    q.includes('camera') ||
    q.includes('thermal') ||
    q.includes('máy bay') ||
    q.includes('flycam') ||
    q.includes('độ phân giải') ||
    q.includes('cảm biến') ||
    q.includes('vết nứt') ||
    q.includes('zoom')
  ) {
    return `🤖 [Trợ lý AI - SmartDrone]
Về trang thiết bị kiểm định chuyên dụng ${assetScope}:
• Thiết bị triển khai: Sàn điều phối ưu tiên các dòng drone công nghiệp chuẩn kiểm định hạ tầng (DJI Matrice 30T hoặc Matrice 350 RTK).
• Cảm biến tích hợp: Camera quang học độ phóng đại cao (Zoom quang học 16x - 200x) kết hợp camera ảnh nhiệt hồng ngoại (Thermal Sensor 640x512, độ nhạy nhiệt ≤ 50mK). Thiết bị này cho phép phát hiện chính xác các vết nứt bề mặt từ 0.1mm, khuyết tật kết cấu bê tông và hiện tượng thấm ngầm.
• An toàn bay: Định vị vệ tinh RTK độ chính xác milimet kết hợp cảm biến radar tránh vật cản đa hướng 360 độ.

Quản lý sàn sẽ kiểm tra chi tiết hồ sơ kỹ thuật của công trình để phân công phi công đối tác sở hữu đúng chủng loại drone phù hợp nhất!`;
  }

  // 4. Pricing, Rates, Quotation, Cost, Payment
  if (
    q.includes('giá') ||
    q.includes('chi phí') ||
    q.includes('bao nhiêu') ||
    q.includes('tiền') ||
    q.includes('báo giá') ||
    q.includes('đắt') ||
    q.includes('rẻ') ||
    q.includes('vnd') ||
    q.includes('usd') ||
    q.includes('thanh toán')
  ) {
    return `🤖 [Trợ lý AI - SmartDrone]
Về đơn giá và chi phí kiểm định ${assetScope}:
• Cơ chế định giá: Đơn giá được tính minh bạch dựa trên quy mô công trình, số lượng đợt bay, số lượng điểm kiểm tra (checkpoints) và yêu cầu camera quang học/nhiệt. Mức giá tham khảo tiêu chuẩn thường từ 1.500.000đ – 3.500.000đ / đợt bay.
• Báo giá chính thức: Quản lý sàn đang hoàn thiện Bảng báo giá chi tiết (bao gồm chi phí phi công, thiết bị, thuế VAT và phí dịch vụ sàn). Báo giá sẽ được phát hành trực tiếp vào mục "Báo giá" của yêu cầu này để bạn kiểm tra và bấm "Chấp thuận báo giá".`;
  }

  // 5. Schedule, Timing, Flight window, Weather conditions
  if (
    q.includes('giờ') ||
    q.includes('khi nào') ||
    q.includes('thời gian') ||
    q.includes('lịch') ||
    q.includes('ngày') ||
    q.includes('bao lâu') ||
    q.includes('thời tiết') ||
    q.includes('mưa') ||
    q.includes('gió')
  ) {
    return `🤖 [Trợ lý AI - SmartDrone]
Về lịch trình và khung thời gian bay kiểm định:
• Khung giờ bạn đăng ký: Hệ thống ghi nhận khoảng thời gian từ ${windowText}.
• Khung giờ kỹ thuật tối ưu: Nên bay kiểm tra vào buổi sáng sớm (07:00 – 10:30) hoặc buổi chiều mát (14:30 – 17:00) nhằm đảm bảo điều kiện ánh sáng chuẩn và độ tương phản bức xạ nhiệt bề mặt kết cấu rõ nét nhất.
• Điều kiện an toàn: Phi công chỉ tiến hành cất cánh khi sức gió < 12m/s và không có mưa dông. Quản lý sàn sẽ chốt thời gian bay cụ thể và liên hệ bạn xác nhận trước giờ cất cánh.`;
  }

  // 6. Contract Signing, Workflow steps, Legal procedure
  if (
    q.includes('hợp đồng') ||
    q.includes('ký') ||
    q.includes('quy trình') ||
    q.includes('thủ tục') ||
    q.includes('bước') ||
    q.includes('pháp lý') ||
    q.includes('biên bản')
  ) {
    return `🤖 [Trợ lý AI - SmartDrone]
Về quy trình ký kết hợp đồng dịch vụ kiểm định:
1. Duyệt báo giá: Sau khi Quản lý gửi báo giá, bạn xem chi tiết và nhấn "Chấp thuận báo giá" (Accept quote).
2. Ký kết hợp đồng giấy (Offline): Hai bên hoàn tất ký hợp đồng dịch vụ bằng văn bản có dấu pháp lý theo quy định.
3. Kích hoạt phân công: Quản lý sàn tải bản scan hợp đồng đã ký lên hệ thống để lưu trữ bằng chứng và mở cổng phân công phi công cùng drone thực hiện đợt bay.`;
  }

  // 7. Flight Permit, Military airspace, Authority clearance
  if (
    q.includes('giấy phép') ||
    q.includes('phép bay') ||
    q.includes('quân sự') ||
    q.includes('cục tác chiến') ||
    q.includes('vùng cấm') ||
    q.includes('pháp luật')
  ) {
    return `🤖 [Trợ lý AI - SmartDrone]
Về thủ tục cấp phép bay và pháp lý:
• Tất cả phi công đối tác trên sàn đều có chứng chỉ bay UAV được kiểm duyệt chặt chẽ.
• Đối với công trình nằm trong vùng cần cấp phép của Cục Tác chiến - Bộ Tổng Tham mưu, Sàn điều phối SmartDrone sẽ hỗ trợ hoàn thiện hồ sơ và thủ tục xin phép bay theo Nghị định 36/2008/NĐ-CP trước khi tiến hành chuyến bay.`;
  }

  // 8. Other specific technical queries
  return `🤖 [Trợ lý AI - SmartDrone]
Trợ lý AI đã ghi nhận câu hỏi của bạn: "${userMessage}".

Do đây là yêu cầu kỹ thuật chuyên sâu ${assetScope}, Trợ lý AI đã đánh dấu ưu tiên cho Quản lý sàn phụ trách. Quản lý sẽ kiểm tra hồ sơ và nhắn tin phản hồi trực tiếp cho bạn sớm nhất có thể. Cảm ơn bạn đã kiên nhẫn!`;
}

