package com.uberi.backend.lead;

import com.uberi.backend.telegram.TelegramService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/leads")
public class LeadController {

  private static final Logger log = LoggerFactory.getLogger(LeadController.class);

  private final TelegramService telegramService;

  public LeadController(TelegramService telegramService) {
    this.telegramService = telegramService;
  }

  @PostMapping
  public ResponseEntity<LeadResponse> createLead(@Valid @RequestBody LeadRequest request) {
    try {
      telegramService.sendLead(request);
      return ResponseEntity.ok(new LeadResponse("ok", "Заявка отправлена"));
    } catch (RuntimeException ex) {
      log.error("Failed to forward lead to Telegram: {}", ex.getMessage(), ex);
      return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
          .body(new LeadResponse("error", "Не удалось отправить заявку в Telegram"));
    }
  }
}
