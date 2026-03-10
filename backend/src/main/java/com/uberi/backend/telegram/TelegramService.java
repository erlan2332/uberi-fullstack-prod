package com.uberi.backend.telegram;

import com.uberi.backend.lead.LeadRequest;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class TelegramService {

  private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

  private final RestClient restClient;
  private final TelegramProperties telegramProperties;

  public TelegramService(RestClient.Builder restClientBuilder, TelegramProperties telegramProperties) {
    this.telegramProperties = telegramProperties;
    this.restClient = restClientBuilder.baseUrl("https://api.telegram.org").build();
  }

  public void sendLead(LeadRequest request) {
    String message = buildMessage(request);
    String shareUrl = buildShareUrl(request);

    TelegramApiResponse response = restClient.post()
        .uri("/bot" + telegramProperties.botToken() + "/sendMessage")
        .contentType(MediaType.APPLICATION_JSON)
        .body(Map.of(
            "chat_id", telegramProperties.chatId(),
            "text", message,
            "parse_mode", "HTML",
            "reply_markup", Map.of(
                "inline_keyboard", List.of(
                    List.of(
                        Map.of(
                            "text", "Поделиться заказом",
                            "url", shareUrl
                        )
                    )
                )
            )
        ))
        .retrieve()
        .body(TelegramApiResponse.class);

    if (response == null || !Boolean.TRUE.equals(response.ok())) {
      throw new IllegalStateException("Telegram API rejected message: " + (response == null ? "empty response" : response.description()));
    }
  }

  private String buildMessage(LeadRequest request) {
    String currentTime = DATE_TIME_FORMATTER.format(ZonedDateTime.now(ZoneId.of("Asia/Bishkek")));
    return "<b>Новая заявка</b>\n"
        + "Имя: <b>" + escape(request.name()) + "</b>\n"
        + "Телефон: <b>" + escape(request.phone()) + "</b>\n"
        + "Время: " + currentTime;
  }

  private String buildShareUrl(LeadRequest request) {
    String shareText = "Новый заказ Uberi\n"
        + "Имя: " + request.name() + "\n"
        + "Телефон: " + request.phone();
    String encodedText = URLEncoder.encode(shareText, StandardCharsets.UTF_8);
    String encodedUrl = URLEncoder.encode("https://t.me/uberi_ru_bot", StandardCharsets.UTF_8);
    return "https://t.me/share/url?url=" + encodedUrl + "&text=" + encodedText;
  }

  private String escape(String value) {
    return value.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;");
  }
}
