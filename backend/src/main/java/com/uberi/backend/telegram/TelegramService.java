package com.uberi.backend.telegram;

import com.uberi.backend.lead.LeadRequest;
import jakarta.annotation.PostConstruct;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class TelegramService {

  private static final Logger log = LoggerFactory.getLogger(TelegramService.class);
  private static final String TELEGRAM_API_BASE_URL = "https://api.telegram.org";
  private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");
  private static final DateTimeFormatter EXECUTION_DATE_FORMATTER = DateTimeFormatter.ofPattern("dd.MM.yyyy");
  private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(4);
  private static final Duration READ_TIMEOUT = Duration.ofSeconds(8);
  private static final Duration CHAT_IDS_CACHE_TTL = Duration.ofMinutes(10);

  private final RestClient restClient;
  private final TelegramProperties telegramProperties;
  private final AtomicBoolean recipientRefreshInProgress = new AtomicBoolean(false);
  private volatile CachedRecipients cachedRecipients = CachedRecipients.empty();

  public TelegramService(RestClient.Builder restClientBuilder, TelegramProperties telegramProperties) {
    this.telegramProperties = telegramProperties;
    HttpClient httpClient = HttpClient.newBuilder()
        .connectTimeout(CONNECT_TIMEOUT)
        .build();

    JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
    requestFactory.setReadTimeout(READ_TIMEOUT);

    this.restClient = restClientBuilder
        .baseUrl(TELEGRAM_API_BASE_URL)
        .requestFactory(requestFactory)
        .build();
  }

  @PostConstruct
  void warmupRecipientCache() {
    refreshRecipientCacheBlocking();
  }

  public void sendLead(LeadRequest request) {
    refreshRecipientCacheAsyncIfNeeded();

    String message = buildMessage(request);
    String shareUrl = buildShareUrl(request);
    Set<String> recipients = resolveRecipientChatIds();

    if (recipients.isEmpty()) {
      throw new IllegalStateException("No recipients configured for Telegram lead delivery");
    }

    boolean delivered = false;
    List<String> failedRecipients = new ArrayList<>();

    for (String chatId : recipients) {
      boolean sent = sendLeadToChat(chatId, message, shareUrl);
      delivered = delivered || sent;

      if (!sent) {
        failedRecipients.add(chatId);
      }
    }

    if (!failedRecipients.isEmpty()) {
      log.warn("Lead sent with partial failures, failed chat ids: {}", failedRecipients);
    }

    if (!delivered) {
      throw new IllegalStateException("Telegram API rejected message for all recipients");
    }
  }

  private String buildMessage(LeadRequest request) {
    String currentTime = DATE_TIME_FORMATTER.format(ZonedDateTime.now(ZoneId.of("Asia/Bishkek")));
    return "<b>Новая заявка</b>\n"
        + "Имя: <b>" + escape(request.name()) + "</b>\n"
        + "Телефон: <b>" + escape(request.phone()) + "</b>\n"
        + "Дата выполнения: <b>" + escape(formatExecutionDate(request.executionDate())) + "</b>\n"
        + "Время выполнения: <b>" + escape(request.executionTime()) + "</b>\n"
        + "Адрес: <b>" + escape(request.address()) + "</b>\n"
        + "Что забрать: <b>" + escape(request.pickupItems()) + "</b>\n"
        + "Оплата клиента: <b>" + escape(request.clientPayment()) + "</b>\n"
        + "Заявка принята: " + currentTime;
  }

  private String buildShareUrl(LeadRequest request) {
    String shareText = "Новый заказ Uberi\n"
        + "Имя: " + request.name() + "\n"
        + "Телефон: " + request.phone() + "\n"
        + "Дата выполнения: " + formatExecutionDate(request.executionDate()) + "\n"
        + "Время выполнения: " + request.executionTime() + "\n"
        + "Адрес: " + request.address() + "\n"
        + "Что забрать: " + request.pickupItems() + "\n"
        + "Оплата клиента: " + request.clientPayment();
    String encodedText = URLEncoder.encode(shareText, StandardCharsets.UTF_8);
    String encodedUrl = URLEncoder.encode("https://t.me/uberi_ru_bot", StandardCharsets.UTF_8);
    return "https://t.me/share/url?url=" + encodedUrl + "&text=" + encodedText;
  }

  private boolean sendLeadToChat(String chatId, String message, String shareUrl) {
    try {
      String botToken = getBotTokenOrThrow();
      TelegramApiResponse response = restClient.post()
          .uri(uriBuilder -> uriBuilder
              .path("/bot{token}/sendMessage")
              .build(botToken))
          .contentType(MediaType.APPLICATION_JSON)
          .body(Map.of(
              "chat_id", chatId,
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
        log.warn(
            "Telegram API rejected message for chat {}: {}",
            chatId,
            response == null ? "empty response" : response.description()
        );
        return false;
      }

      return true;
    } catch (RuntimeException ex) {
      log.warn("Failed to send Telegram lead to chat {}: {}", chatId, ex.getMessage(), ex);
      return false;
    }
  }

  private Set<String> resolveRecipientChatIds() {
    Set<String> chatIds = new LinkedHashSet<>();
    chatIds.add(telegramProperties.chatId());
    chatIds.addAll(cachedRecipients.chatIds());
    return normalizeChatIds(chatIds);
  }

  private void refreshRecipientCacheAsyncIfNeeded() {
    if (cachedRecipients.isFresh(Instant.now())) {
      return;
    }

    if (!recipientRefreshInProgress.compareAndSet(false, true)) {
      return;
    }

    CompletableFuture.runAsync(() -> {
      try {
        refreshRecipientCacheBlocking();
      } finally {
        recipientRefreshInProgress.set(false);
      }
    });
  }

  private void refreshRecipientCacheBlocking() {
    Set<String> dynamicChatIds = loadActivatedChatIds();
    cachedRecipients = new CachedRecipients(
        normalizeChatIds(dynamicChatIds),
        Instant.now().plus(CHAT_IDS_CACHE_TTL)
    );
  }

  private Set<String> normalizeChatIds(Set<String> chatIds) {
    return chatIds.stream()
        .filter(Objects::nonNull)
        .map(String::trim)
        .filter(value -> !value.isEmpty())
        .collect(Collectors.toCollection(LinkedHashSet::new));
  }

  private Set<String> loadActivatedChatIds() {
    try {
      String botToken = getBotTokenOrThrow();
      TelegramUpdatesResponse updatesResponse = restClient.get()
          .uri(uriBuilder -> uriBuilder
              .path("/bot{token}/getUpdates")
              .queryParam("limit", 100)
              .build(botToken))
          .retrieve()
          .body(TelegramUpdatesResponse.class);

      if (updatesResponse == null || !Boolean.TRUE.equals(updatesResponse.ok()) || updatesResponse.result() == null) {
        return Set.of();
      }

      return updatesResponse.result().stream()
          .map(TelegramUpdate::message)
          .filter(Objects::nonNull)
          .filter(message -> message.chat() != null && "private".equals(message.chat().type()))
          .filter(message -> message.text() != null && message.text().trim().startsWith("/start"))
          .map(message -> message.chat().id())
          .filter(Objects::nonNull)
          .map(String::valueOf)
          .collect(Collectors.toCollection(LinkedHashSet::new));
    } catch (RuntimeException ex) {
      log.warn("Failed to fetch chat ids from Telegram getUpdates: {}", ex.getMessage(), ex);
      return Set.of();
    }
  }

  private String formatExecutionDate(String dateValue) {
    try {
      LocalDate date = LocalDate.parse(dateValue);
      return EXECUTION_DATE_FORMATTER.format(date);
    } catch (DateTimeParseException ex) {
      return dateValue;
    }
  }

  private String getBotTokenOrThrow() {
    String token = telegramProperties.botToken();

    if (token == null || token.isBlank()) {
      throw new IllegalStateException("TELEGRAM_BOT_TOKEN is empty");
    }

    String trimmed = token.trim();
    if (trimmed.startsWith("${") && trimmed.endsWith("}")) {
      throw new IllegalStateException("TELEGRAM_BOT_TOKEN is not resolved");
    }

    return trimmed;
  }

  private String escape(String value) {
    return value.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;");
  }

  private record CachedRecipients(Set<String> chatIds, Instant expiresAt) {
    private static CachedRecipients empty() {
      return new CachedRecipients(Set.of(), Instant.EPOCH);
    }

    private boolean isFresh(Instant now) {
      return now.isBefore(expiresAt);
    }
  }
}
