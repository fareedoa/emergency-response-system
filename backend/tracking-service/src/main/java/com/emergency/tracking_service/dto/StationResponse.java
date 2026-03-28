package com.emergency.tracking_service.dto;

import com.emergency.tracking_service.domain.enums.StationType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class StationResponse {
    private UUID id;
    private String name;
    private StationType stationType;
    private Double latitude;
    private Double longitude;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
