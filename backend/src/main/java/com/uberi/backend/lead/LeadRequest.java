package com.uberi.backend.lead;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record LeadRequest(
    @NotBlank(message = "Имя обязательно")
    @Size(max = 80, message = "Имя слишком длинное")
    String name,

    @NotBlank(message = "Телефон обязателен")
    @Size(max = 30, message = "Телефон слишком длинный")
    @Pattern(regexp = "^[0-9+()\\-\\s]{6,30}$", message = "Некорректный формат телефона")
    String phone,

    @NotBlank(message = "Дата выполнения обязательна")
    @Size(max = 20, message = "Дата выполнения слишком длинная")
    @Pattern(
        regexp = "^(\\d{4}-\\d{2}-\\d{2}|\\d{2}\\.\\d{2}\\.\\d{4})$",
        message = "Дата: используйте формат ГГГГ-ММ-ДД или ДД.ММ.ГГГГ"
    )
    String executionDate,

    @NotBlank(message = "Адрес обязателен")
    @Size(max = 220, message = "Адрес слишком длинный")
    String address,

    @NotBlank(message = "Укажите, что нужно забрать")
    @Size(max = 600, message = "Описание слишком длинное")
    String pickupItems,

    @NotNull(message = "Укажите наличие лифта")
    Boolean elevatorAvailable
) {
}
