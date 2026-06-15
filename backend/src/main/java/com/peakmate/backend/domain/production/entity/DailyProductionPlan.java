package com.peakmate.backend.domain.production.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Entity
@Table(name = "daily_production_plan")
public class DailyProductionPlan extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id")
    private Long id;

    @Column(name = "plan_year", nullable = false)
    private Integer planYear;

    @Column(name = "plan_month", nullable = false)
    private Integer planMonth;

    @Column(name = "customer", length = 50, nullable = false)
    private String customer = "";

    @Column(name = "line_code", length = 10, nullable = false)
    private String lineCode;

    @Column(name = "product_name", length = 20, nullable = false)
    private String productName;

    @Column(name = "spec", length = 50, nullable = false)
    private String spec;

    @Column(name = "material", length = 50, nullable = false)
    private String material;

    @Column(name = "plan_type", length = 10, nullable = false)
    private String planType = "계획";

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "d1",  precision = 10, scale = 1) private BigDecimal d1;
    @Column(name = "d2",  precision = 10, scale = 1) private BigDecimal d2;
    @Column(name = "d3",  precision = 10, scale = 1) private BigDecimal d3;
    @Column(name = "d4",  precision = 10, scale = 1) private BigDecimal d4;
    @Column(name = "d5",  precision = 10, scale = 1) private BigDecimal d5;
    @Column(name = "d6",  precision = 10, scale = 1) private BigDecimal d6;
    @Column(name = "d7",  precision = 10, scale = 1) private BigDecimal d7;
    @Column(name = "d8",  precision = 10, scale = 1) private BigDecimal d8;
    @Column(name = "d9",  precision = 10, scale = 1) private BigDecimal d9;
    @Column(name = "d10", precision = 10, scale = 1) private BigDecimal d10;
    @Column(name = "d11", precision = 10, scale = 1) private BigDecimal d11;
    @Column(name = "d12", precision = 10, scale = 1) private BigDecimal d12;
    @Column(name = "d13", precision = 10, scale = 1) private BigDecimal d13;
    @Column(name = "d14", precision = 10, scale = 1) private BigDecimal d14;
    @Column(name = "d15", precision = 10, scale = 1) private BigDecimal d15;
    @Column(name = "d16", precision = 10, scale = 1) private BigDecimal d16;
    @Column(name = "d17", precision = 10, scale = 1) private BigDecimal d17;
    @Column(name = "d18", precision = 10, scale = 1) private BigDecimal d18;
    @Column(name = "d19", precision = 10, scale = 1) private BigDecimal d19;
    @Column(name = "d20", precision = 10, scale = 1) private BigDecimal d20;
    @Column(name = "d21", precision = 10, scale = 1) private BigDecimal d21;
    @Column(name = "d22", precision = 10, scale = 1) private BigDecimal d22;
    @Column(name = "d23", precision = 10, scale = 1) private BigDecimal d23;
    @Column(name = "d24", precision = 10, scale = 1) private BigDecimal d24;
    @Column(name = "d25", precision = 10, scale = 1) private BigDecimal d25;
    @Column(name = "d26", precision = 10, scale = 1) private BigDecimal d26;
    @Column(name = "d27", precision = 10, scale = 1) private BigDecimal d27;
    @Column(name = "d28", precision = 10, scale = 1) private BigDecimal d28;
    @Column(name = "d29", precision = 10, scale = 1) private BigDecimal d29;
    @Column(name = "d30", precision = 10, scale = 1) private BigDecimal d30;
    @Column(name = "d31", precision = 10, scale = 1) private BigDecimal d31;

    public static DailyProductionPlan create(Integer year, Integer month, String customer,
                                              String lineCode, String productName, String spec,
                                              String material, String planType, Integer sortOrder) {
        DailyProductionPlan p = new DailyProductionPlan();
        p.planYear = year;
        p.planMonth = month;
        p.customer = customer != null ? customer : "";
        p.lineCode = lineCode;
        p.productName = productName;
        p.spec = spec;
        p.material = material;
        p.planType = planType != null ? planType : "계획";
        p.sortOrder = sortOrder != null ? sortOrder : 0;
        return p;
    }

    public void setDay(int day, BigDecimal value) {
        switch (day) {
            case 1  -> this.d1  = value; case 2  -> this.d2  = value;
            case 3  -> this.d3  = value; case 4  -> this.d4  = value;
            case 5  -> this.d5  = value; case 6  -> this.d6  = value;
            case 7  -> this.d7  = value; case 8  -> this.d8  = value;
            case 9  -> this.d9  = value; case 10 -> this.d10 = value;
            case 11 -> this.d11 = value; case 12 -> this.d12 = value;
            case 13 -> this.d13 = value; case 14 -> this.d14 = value;
            case 15 -> this.d15 = value; case 16 -> this.d16 = value;
            case 17 -> this.d17 = value; case 18 -> this.d18 = value;
            case 19 -> this.d19 = value; case 20 -> this.d20 = value;
            case 21 -> this.d21 = value; case 22 -> this.d22 = value;
            case 23 -> this.d23 = value; case 24 -> this.d24 = value;
            case 25 -> this.d25 = value; case 26 -> this.d26 = value;
            case 27 -> this.d27 = value; case 28 -> this.d28 = value;
            case 29 -> this.d29 = value; case 30 -> this.d30 = value;
            case 31 -> this.d31 = value;
            default -> throw new IllegalArgumentException("day must be 1-31");
        }
    }

    public BigDecimal getDay(int day) {
        return switch (day) {
            case 1  -> d1;  case 2  -> d2;  case 3  -> d3;  case 4  -> d4;
            case 5  -> d5;  case 6  -> d6;  case 7  -> d7;  case 8  -> d8;
            case 9  -> d9;  case 10 -> d10; case 11 -> d11; case 12 -> d12;
            case 13 -> d13; case 14 -> d14; case 15 -> d15; case 16 -> d16;
            case 17 -> d17; case 18 -> d18; case 19 -> d19; case 20 -> d20;
            case 21 -> d21; case 22 -> d22; case 23 -> d23; case 24 -> d24;
            case 25 -> d25; case 26 -> d26; case 27 -> d27; case 28 -> d28;
            case 29 -> d29; case 30 -> d30; case 31 -> d31;
            default -> null;
        };
    }
}
