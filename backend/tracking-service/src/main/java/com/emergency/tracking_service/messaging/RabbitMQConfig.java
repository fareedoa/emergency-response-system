package com.emergency.tracking_service.messaging;

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

    // ─── Routing keys (publisher) ─────────────────────────────────────────────
    public static final String RK_VEHICLE_LOCATION_PREFIX = "vehicle.location.";
    public static final String RK_VEHICLE_ON_SCENE        = "vehicle.on_scene";
    public static final String RK_VEHICLE_RETURNED        = "vehicle.returned";

    // ─── Queue names (consumer) ───────────────────────────────────────────────
    public static final String Q_DISPATCH = "q.dts.incident.dispatch";
    public static final String Q_RESOLVED = "q.dts.incident.resolved";

    // ─── Declare exchange ─────────────────────────────────────────────────────
    @Bean
    public TopicExchange emergencyExchange() {
        return ExchangeBuilder.topicExchange(EXCHANGE).durable(true).build();
    }

    // ─── Consumer queue: incident dispatched ──────────────────────────────────
    @Bean
    public Queue dispatchQueue() {
        return QueueBuilder.durable(Q_DISPATCH).build();
    }

    @Bean
    public Binding dispatchBinding(Queue dispatchQueue, TopicExchange emergencyExchange) {
        return BindingBuilder.bind(dispatchQueue)
                .to(emergencyExchange)
                .with("incident.dispatched");
    }

    // ─── Consumer queue: incident resolved ───────────────────────────────────
    @Bean
    public Queue resolvedQueue() {
        return QueueBuilder.durable(Q_RESOLVED).build();
    }

    @Bean
    public Binding resolvedBinding(Queue resolvedQueue, TopicExchange emergencyExchange) {
        return BindingBuilder.bind(resolvedQueue)
                .to(emergencyExchange)
                .with("incident.resolved");
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
