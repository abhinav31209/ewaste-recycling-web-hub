package com.team04.ewaste.notification;

import com.team04.ewaste.auth.User;
import com.team04.ewaste.staff.Order;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class EmailNotificationService {

    private static final Logger log =
            LoggerFactory.getLogger(EmailNotificationService.class);

    private final EmailNotificationRepository emailNotificationRepository;

    public EmailNotificationService(EmailNotificationRepository emailNotificationRepository) {
        this.emailNotificationRepository = emailNotificationRepository;
    }

    public EmailNotification sendDataRetrievalReady(User owner,
                                                     Order order,
                                                     String downloadUrl) {
        String subject = "Your eWaste data retrieval link is ready";

        String body = """
                Your device data has been retrieved and uploaded securely.

                Secure download link: %s
                Link expires at: %s

                This prototype logs the notification instead of sending a real email.
                """.formatted(downloadUrl, order.getExpiresAt());

        return recordSent(owner, order, subject, body);
    }

    public EmailNotification sendDataRetrievalRestored(User owner,
                                                        Order order,
                                                        String downloadUrl) {
        String subject = "Your eWaste data retrieval access has been restored";

        String body = """
                Your secure data retrieval access has been restored after payment.

                Secure download link: %s
                Link expires at: %s

                This prototype logs the notification instead of sending a real email.
                """.formatted(downloadUrl, order.getExpiresAt());

        return recordSent(owner, order, subject, body);
    }

    private EmailNotification recordSent(User owner,
                                         Order order,
                                         String subject,
                                         String body) {
        Instant now = Instant.now();

        EmailNotification notification = new EmailNotification();
        notification.setUserId(owner.getId());
        notification.setOrderId(order.getId());
        notification.setRecipientEmail(owner.getEmail());
        notification.setSubject(subject);
        notification.setBody(body);
        notification.setStatus("sent");
        notification.setCreatedAt(now);
        notification.setSentAt(now);

        EmailNotification saved = emailNotificationRepository.save(notification);

        log.info("Demo email notification sent to {} for order {}: {}",
                owner.getEmail(),
                order.getId(),
                subject);

        log.info("Demo email body:\n{}", body);

        return saved;
    }
}