package com.emergency.analytics_service.messaging;

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

    // ─── Queue names ──────────────────────────────────────────────────────────
    public static final String Q_INCIDENT_NEW      = "q.ams.incident.new";
    public static final String Q_INCIDENT_DISPATCH = "q.ams.incident.dispatch";
    public static final String Q_INCIDENT_STATUS   = "q.ams.incident.status";
    public static final String Q_VEHICLE_LOCATION  = "q.ams.vehicle.location";

    // ─── Declare exchange ─────────────────────────────────────────────────────
    @Bean
    public TopicExchange emergencyExchange() {
        return ExchangeBuilder.topicExchange(EXCHANGE).durable(true).build();
    }

    // ─── Queue: incident.created ──────────────────────────────────────────────
    @Bean
    public Queue incidentNewQueue() {
        return QueueBuilder.durable(Q_INCIDENT_NEW).build();
    }

    @Bean
    public Binding incidentNewBinding(Queue incidentNewQueue, TopicExchange emergencyExchange) {
        return BindingBuilder.bind(incidentNewQueue)
                .to(emergencyExchange)
                .with("incident.created");
    }

    // ─── Queue: incident.dispatched ───────────────────────────────────────────
    @Bean
    public Queue incidentDispatchQueue() {
        return QueueBuilder.durable(Q_INCIDENT_DISPATCH).build();
    }

    @Bean
    public Binding incidentDispatchBinding(Queue incidentDispatchQueue,
                                            TopicExchange emergencyExchange) {
        return BindingBuilder.bind(incidentDispatchQueue)
                .to(emergencyExchange)
                .with("incident.dispatched");
    }

    // ─── Queue: incident.status.* ─────────────────────────────────────────────
    @Bean
    public Queue incidentStatusQueue() {
        return QueueBuilder.durable(Q_INCIDENT_STATUS).build();
    }

    @Bean
    public Binding incidentStatusBinding(Queue incidentStatusQueue,
                                          TopicExchange emergencyExchange) {
        return BindingBuilder.bind(incidentStatusQueue)
                .to(emergencyExchange)
                .with("incident.status.*");
    }

    // ─── Queue: vehicle.location.* ───────────────────────────────────────────
    @Bean
    public Queue vehicleLocationQueue() {
        return QueueBuilder.durable(Q_VEHICLE_LOCATION).build();
    }

    @Bean
    public Binding vehicleLocationBinding(Queue vehicleLocationQueue,
                                           TopicExchange emergencyExchange) {
        return BindingBuilder.bind(vehicleLocationQueue)
                .to(emergencyExchange)
                .with("vehicle.location.*");
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
