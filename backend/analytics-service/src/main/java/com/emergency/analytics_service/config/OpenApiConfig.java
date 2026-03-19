package com.emergency.analytics_service.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "bearerAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("Emergency Response System – Analytics Service API")
                        .description("""
                                Analytics and Operational Insights Service for the National Emergency \
                                Response and Dispatch Coordination Platform.
                                
                                This service aggregates data from incidents, dispatch operations, hospital
                                capacity, and vehicle tracking to produce useful statistics, including:
                                - Average response time by service type and region
                                - Incident frequency heat-maps by GPS region and type
                                - Per-station dispatch counts and idle time
                                - Hospital bed / ambulance deployment analytics
                                - Rolling 7/30/90-day incident volume trends
                                - Peak hour and day-of-week analysis
                                - Top responder rankings
                                - Summary KPI dashboard
                                """)
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("Emergency Response System")
                                .email("admin@emergency.gov.gh")))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Provide a valid JWT access token issued by the Auth Service.")));
    }
}
