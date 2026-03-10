package com.uberi.backend.lead;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record LeadRequest(
    @NotBlank(message = "Имя обязательно")
    @Size(max = 80, message = "Имя слишком длинное")
    String name,

    @NotBlank(message = "Телефон обязателен")
    @Size(max = 30, message = "Телефон слишком длинный")
    @Pattern(regexp = "^[0-9+()\\-\\s]{6,30}$", message = "Некорректный формат телефона")
    String phone
) {
}
