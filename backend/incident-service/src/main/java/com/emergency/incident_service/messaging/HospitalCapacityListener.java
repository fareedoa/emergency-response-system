package com.emergency.incident_service.messaging;

import com.emergency.incident_service.messaging.events.HospitalCapacityEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class HospitalCapacityListener {

    private static final Logger log = LoggerFactory.getLogger(HospitalCapacityListener.class);

    /** Key: hospitalId → latest capacity snapshot */
    private final Map<String, HospitalCapacityEvent> capacityCache = new ConcurrentHashMap<>();

    @RabbitListener(queues = RabbitMQConfig.Q_HOSPITAL_SYNC)
    public void handleCapacityUpdate(HospitalCapacityEvent event) {
        log.info("Hospital capacity update: hospitalId={}, beds={}/{}, ambulances={}",
                event.getHospitalId(),
                event.getOccupiedBeds(), event.getTotalBeds(),
                event.getAvailableAmbulances());
        capacityCache.put(event.getHospitalId(), event);
    }

    /** Returns the cached capacity for a given hospital, or null if not yet received. */
    public HospitalCapacityEvent getCapacity(String hospitalId) {
        return capacityCache.get(hospitalId);
    }

    /** Returns the entire current cache snapshot (for use in dispatch logic). */
    public Map<String, HospitalCapacityEvent> getAllCapacities() {
        return Map.copyOf(capacityCache);
    }
}
