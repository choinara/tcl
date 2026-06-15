package com.peakmate.backend.global.config;

import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

@Configuration
@ConditionalOnProperty(name = "peakmate.timescaledb.enabled", havingValue = "true")
public class TimescaleFlywayConfig {

    @Bean("timescaleFlyway")
    public Flyway timescaleFlyway(@Qualifier("timescaleDataSource") DataSource dataSource) {
        Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration-timescale")
                .table("flyway_schema_history")
                .outOfOrder(true)
                .baselineOnMigrate(true)
                .baselineVersion("0")
                .load();
        flyway.migrate();
        return flyway;
    }
}
