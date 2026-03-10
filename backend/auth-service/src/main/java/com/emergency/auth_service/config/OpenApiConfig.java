package com.emergency.auth_service.config;

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
                        .title("Emergency Response System – Auth Service API")
                        .description("""
                                Identity and Authentication Service for the National Emergency \
                                Response and Dispatch Coordination Platform.
                                
                                This service manages all system users and provides JWT-based \
                                authentication for:
                                - System Administrators
                                - Hospital Administrators
                                - Police Station Administrators
                                - Fire Service Administrators
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
                                        .description("Provide a valid JWT access token.")));
    }
}
