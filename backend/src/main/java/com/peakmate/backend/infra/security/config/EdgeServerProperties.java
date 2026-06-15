package com.peakmate.backend.infra.security.config;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@ConfigurationProperties(prefix = "peakmate.edge-server")
@Validated
public record EdgeServerProperties(
        @NotBlank String apiKey
) {}
