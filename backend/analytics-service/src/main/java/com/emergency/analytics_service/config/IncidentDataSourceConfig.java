package com.emergency.analytics_service.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.PlatformTransactionManager;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableJpaRepositories(
    basePackages = "com.emergency.analytics_service.repository.incident",
    entityManagerFactoryRef = "incidentEntityManagerFactory",
    transactionManagerRef = "incidentTransactionManager"
)
public class IncidentDataSourceConfig {

    @Primary
    @Bean(name = "incidentDataSource")
    @ConfigurationProperties(prefix = "spring.datasource.incident")
    public DataSource incidentDataSource() {
        return DataSourceBuilder.create().type(HikariDataSource.class).build();
    }

    @Primary
    @Bean(name = "incidentEntityManagerFactory")
    public LocalContainerEntityManagerFactoryBean incidentEntityManagerFactory(
            @Qualifier("incidentDataSource") DataSource dataSource) {
        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(dataSource);
        em.setPackagesToScan("com.emergency.analytics_service.domain.incident");
        em.setPersistenceUnitName("incident");

        HibernateJpaVendorAdapter adapter = new HibernateJpaVendorAdapter();
        em.setJpaVendorAdapter(adapter);

        Map<String, Object> props = new HashMap<>();
        props.put("hibernate.dialect", "org.hibernate.dialect.PostgreSQLDialect");
        props.put("hibernate.hbm2ddl.auto", "none");
        props.put("hibernate.show_sql", "false");
        em.setJpaPropertyMap(props);

        return em;
    }

    @Primary
    @Bean(name = "incidentTransactionManager")
    public PlatformTransactionManager incidentTransactionManager(
            @Qualifier("incidentEntityManagerFactory") LocalContainerEntityManagerFactoryBean emf) {
        JpaTransactionManager tm = new JpaTransactionManager();
        tm.setEntityManagerFactory(emf.getObject());
        return tm;
    }
}
