package com.peakmate.backend.global.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

@Configuration
@ConditionalOnProperty(name = "peakmate.timescaledb.enabled", havingValue = "true")
public class TimescaleDataSourceConfig {

    @Bean("timescaleDataSource")
    @ConfigurationProperties(prefix = "peakmate.timescaledb.datasource")
    public DataSource timescaleDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean("timescaleJdbcTemplate")
    public JdbcTemplate timescaleJdbcTemplate(
            @Qualifier("timescaleDataSource") DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }
}
