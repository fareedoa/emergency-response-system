package com.emergency.analytics_service.messaging;

import com.emergency.analytics_service.messaging.events.VehicleLocationEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class VehicleLocationListener {

    private static final Logger log = LoggerFactory.getLogger(VehicleLocationListener.class);

    @RabbitListener(queues = RabbitMQConfig.Q_VEHICLE_LOCATION)
    public void onVehicleLocation(VehicleLocationEvent event) {
        log.info("[AMS] vehicle.location — vehicleId={} incident={} lat={} lng={} speed={}kmh at={}",
                event.getVehicleId(),
                event.getIncidentId(),
                event.getLatitude(),
                event.getLongitude(),
                event.getSpeedKmh(),
                event.getRecordedAt());
    }
}
