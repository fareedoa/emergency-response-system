package com.emergency.tracking_service.service;

import com.emergency.tracking_service.domain.model.Station;
import com.emergency.tracking_service.dto.CreateStationRequest;
import com.emergency.tracking_service.dto.StationResponse;
import com.emergency.tracking_service.exception.ResourceNotFoundException;
import com.emergency.tracking_service.repository.StationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class StationService {

    private final StationRepository stationRepository;

    public StationService(StationRepository stationRepository) {
        this.stationRepository = stationRepository;
    }

    @Transactional
    public StationResponse createStation(CreateStationRequest request) {
        Station station = Station.builder()
                .name(request.getName())
                .stationType(request.getStationType())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .build();
        return toResponse(stationRepository.save(station));
    }

    @Transactional(readOnly = true)
    public StationResponse getStation(UUID id) {
        Station station = stationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Station not found with ID: " + id));
        return toResponse(station);
    }

    @Transactional(readOnly = true)
    public List<StationResponse> getAllStations() {
        return stationRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteStation(UUID id) {
        Station station = stationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Station not found with ID: " + id));
        stationRepository.delete(station);
    }

    private StationResponse toResponse(Station station) {
        return StationResponse.builder()
                .id(station.getId())
                .name(station.getName())
                .stationType(station.getStationType())
                .latitude(station.getLatitude())
                .longitude(station.getLongitude())
                .createdAt(station.getCreatedAt())
                .updatedAt(station.getUpdatedAt())
                .build();
    }
}
