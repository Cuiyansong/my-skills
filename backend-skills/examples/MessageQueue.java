import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class MessageQueueService {

    private final KafkaTemplate<String, String> kafkaTemplate;

    public MessageQueueService(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void sendMessage(String topic, String message) {
        kafkaTemplate.send(topic, message);
    }

    @KafkaListener(topics = "user-events", groupId = "user-group")
    public void handleUserEvent(String message) {
        System.out.println("收到用户事件: " + message);
        processUserEvent(message);
    }

    private void processUserEvent(String message) {
    }
}