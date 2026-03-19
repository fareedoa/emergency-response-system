package com.emergency.analytics_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ResponseTimeStat {

    private String serviceType;
    private double avgSeconds;
    private double minSeconds;
    private double maxSeconds;
    public String getAvgFormatted() {
        return formatSeconds((long) avgSeconds);
    }

    public String getMinFormatted() {
        return formatSeconds((long) minSeconds);
    }

    public String getMaxFormatted() {
        return formatSeconds((long) maxSeconds);
    }

    private static String formatSeconds(long totalSeconds) {
        long hours   = totalSeconds / 3600;
        long minutes = (totalSeconds % 3600) / 60;
        long secs    = totalSeconds % 60;
        if (hours > 0) return String.format("%dh %02dm %02ds", hours, minutes, secs);
        if (minutes > 0) return String.format("%dm %02ds", minutes, secs);
        return totalSeconds + "s";
    }
}
