package com.peakmate.backend.interfaces.email.controller;

import com.peakmate.backend.domain.email.entity.EmailMessage;
import com.peakmate.backend.domain.email.repository.EmailMessageRepository;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.core.security.annotation.RequirePermission;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/email/messages")
@RequiredArgsConstructor
public class EmailMessageController {

    private final EmailMessageRepository messageRepository;

    @RequirePermission(menu = "EM0010", action = "read")
    @GetMapping
    public ApiResponse<Map<String, Object>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String processingStatus,
            @RequestParam(required = false) String classificationPurpose,
            @RequestParam(required = false) String keyword) {

        PageRequest pageRequest = PageRequest.of(page, size);
        String kw = blankToNull(keyword);
        if (kw != null) kw = "%" + kw.toLowerCase() + "%";
        Page<EmailMessage> result = messageRepository.findByFilters(
                blankToNull(processingStatus),
                blankToNull(classificationPurpose),
                kw,
                pageRequest);

        List<Map<String, Object>> content = result.getContent().stream()
                .map(this::toMap)
                .collect(Collectors.toList());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", content);
        response.put("totalElements", result.getTotalElements());
        response.put("totalPages", result.getTotalPages());
        response.put("last", result.isLast());
        return ApiResponse.success(response);
    }

    private Map<String, Object> toMap(EmailMessage m) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", m.getId());
        map.put("subject", m.getSubject());
        map.put("senderEmail", m.getSenderEmail());
        map.put("senderName", m.getSenderName());
        map.put("receivedAt", m.getReceivedAt() != null ? m.getReceivedAt().toString() : null);
        map.put("processingStatus", m.getProcessingStatus());
        map.put("classificationPurpose", m.getClassificationPurpose());
        map.put("classificationConfidence", m.getClassificationConfidence());
        map.put("customerCode", m.getCustomerCode());
        map.put("customerName", m.getCustomerName());
        map.put("partnerName", m.getPartnerName());
        map.put("sizeBytes", m.getSizeBytes());
        map.put("aiProcessedAt", m.getAiProcessedAt() != null ? m.getAiProcessedAt().toString() : null);
        return map;
    }

    private String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }
}
