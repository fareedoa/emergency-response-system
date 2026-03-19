package com.emergency.incident_service.messaging;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.fasterxml.jackson.databind.ObjectMapper;

@Configuration
public class RabbitMQConfig {

    // ─── Exchange ─────────────────────────────────────────────────────────────
    public static final String EXCHANGE = "emergency.events";

    // ─── Routing keys (publishers) ────────────────────────────────────────────
    public static final String RK_INCIDENT_CREATED    = "incident.created";
    public static final String RK_INCIDENT_DISPATCHED = "incident.dispatched";
    public static final String RK_INCIDENT_RESOLVED   = "incident.resolved";
    // Status events use pattern: incident.status.<STATUS>
    public static final String RK_INCIDENT_STATUS_PREFIX = "incident.status.";

    // ─── Queue names (consumer) ───────────────────────────────────────────────
    public static final String Q_HOSPITAL_SYNC = "q.eis.hospital.sync";

    // ─── Declare exchange ─────────────────────────────────────────────────────
    @Bean
    public TopicExchange emergencyExchange() {
        return ExchangeBuilder.topicExchange(EXCHANGE).durable(true).build();
    }

    // ─── Consumer queue: hospital capacity sync ───────────────────────────────
    @Bean
    public Queue hospitalSyncQueue() {
        return QueueBuilder.durable(Q_HOSPITAL_SYNC).build();
    }

    @Bean
    public Binding hospitalSyncBinding(Queue hospitalSyncQueue, TopicExchange emergencyExchange) {
        return BindingBuilder.bind(hospitalSyncQueue)
                .to(emergencyExchange)
                .with("hospital.capacity.*");
    }

    // ─── Message converter: JSON ──────────────────────────────────────────────
    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper();
    }

    @Bean
    public MessageConverter jsonMessageConverter(ObjectMapper objectMapper) {
        return new JacksonJsonMessageConverter(String.valueOf(objectMapper));
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory,
                                          MessageConverter jsonMessageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter);
        return template;
    }
}
