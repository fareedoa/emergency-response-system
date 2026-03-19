package com.emergency.analytics_service.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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
    basePackages = "com.emergency.analytics_service.repository.tracking",
    entityManagerFactoryRef = "trackingEntityManagerFactory",
    transactionManagerRef = "trackingTransactionManager"
)
public class TrackingDataSourceConfig {

    @Bean(name = "trackingDataSource")
    @ConfigurationProperties(prefix = "spring.datasource.tracking")
    public DataSource trackingDataSource() {
        return DataSourceBuilder.create().type(HikariDataSource.class).build();
    }

    @Bean(name = "trackingEntityManagerFactory")
    public LocalContainerEntityManagerFactoryBean trackingEntityManagerFactory(
            @Qualifier("trackingDataSource") DataSource dataSource) {
        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(dataSource);
        em.setPackagesToScan("com.emergency.analytics_service.domain.tracking");
        em.setPersistenceUnitName("tracking");

        HibernateJpaVendorAdapter adapter = new HibernateJpaVendorAdapter();
        em.setJpaVendorAdapter(adapter);

        Map<String, Object> props = new HashMap<>();
        props.put("hibernate.dialect", "org.hibernate.dialect.PostgreSQLDialect");
        props.put("hibernate.hbm2ddl.auto", "none");
        props.put("hibernate.show_sql", "false");
        em.setJpaPropertyMap(props);

        return em;
    }

    @Bean(name = "trackingTransactionManager")
    public PlatformTransactionManager trackingTransactionManager(
            @Qualifier("trackingEntityManagerFactory") LocalContainerEntityManagerFactoryBean emf) {
        JpaTransactionManager tm = new JpaTransactionManager();
        tm.setEntityManagerFactory(emf.getObject());
        return tm;
    }
}
