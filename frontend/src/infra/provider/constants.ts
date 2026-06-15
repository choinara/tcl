/**
 */

// FormData(multipart)로 전송할 리소스 목록
export const MULTIPART_RESOURCES: Set<string> = new Set([]);

// 리소스별 ID 필드 매핑 (API의 PK 필드명 -> id로 변환)
export const idFieldMap: Record<string, string> = {};
