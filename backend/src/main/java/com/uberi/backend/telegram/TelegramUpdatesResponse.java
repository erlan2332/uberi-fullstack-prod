package com.uberi.backend.telegram;

import java.util.List;

public record TelegramUpdatesResponse(
    Boolean ok,
    List<TelegramUpdate> result,
    String description
) {
}

record TelegramUpdate(TelegramMessage message) {
}

record TelegramMessage(String text, TelegramChat chat) {
}

record TelegramChat(Long id, String type) {
}
