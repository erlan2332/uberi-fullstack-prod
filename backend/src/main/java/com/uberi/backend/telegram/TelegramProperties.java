package com.uberi.backend.telegram;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "telegram")
public record TelegramProperties(
    @NotBlank String botToken,
    @NotBlank String chatId
) {
}
