package com.peakmate.backend.domain.production.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;

@Getter
@Entity
@Table(name = "order_registration")
public class OrderRegistration extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id")
    private Long id;

    @Column(name = "order_year", nullable = false)
    private Integer orderYear;

    @Column(name = "order_month", nullable = false)
    private Integer orderMonth;

    @Column(name = "polarity", length = 10, nullable = false)
    private String polarity;

    @Column(name = "site", length = 10, nullable = false)
    private String site;

    @Column(name = "spec", length = 50, nullable = false)
    private String spec;

    @Column(name = "material", length = 50, nullable = false)
    private String material;

    @Column(name = "category", length = 50, nullable = false)
    private String category = "Demand";

    @Column(name = "status", length = 20, nullable = false)
    private String status = "접수";

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "d1")  private Integer d1;
    @Column(name = "d2")  private Integer d2;
    @Column(name = "d3")  private Integer d3;
    @Column(name = "d4")  private Integer d4;
    @Column(name = "d5")  private Integer d5;
    @Column(name = "d6")  private Integer d6;
    @Column(name = "d7")  private Integer d7;
    @Column(name = "d8")  private Integer d8;
    @Column(name = "d9")  private Integer d9;
    @Column(name = "d10") private Integer d10;
    @Column(name = "d11") private Integer d11;
    @Column(name = "d12") private Integer d12;
    @Column(name = "d13") private Integer d13;
    @Column(name = "d14") private Integer d14;
    @Column(name = "d15") private Integer d15;
    @Column(name = "d16") private Integer d16;
    @Column(name = "d17") private Integer d17;
    @Column(name = "d18") private Integer d18;
    @Column(name = "d19") private Integer d19;
    @Column(name = "d20") private Integer d20;
    @Column(name = "d21") private Integer d21;
    @Column(name = "d22") private Integer d22;
    @Column(name = "d23") private Integer d23;
    @Column(name = "d24") private Integer d24;
    @Column(name = "d25") private Integer d25;
    @Column(name = "d26") private Integer d26;
    @Column(name = "d27") private Integer d27;
    @Column(name = "d28") private Integer d28;
    @Column(name = "d29") private Integer d29;
    @Column(name = "d30") private Integer d30;
    @Column(name = "d31") private Integer d31;

    public static OrderRegistration create(Integer year, Integer month, String polarity,
                                           String site, String spec, String material,
                                           String category, String status, Integer sortOrder) {
        OrderRegistration o = new OrderRegistration();
        o.orderYear = year;
        o.orderMonth = month;
        o.polarity = polarity;
        o.site = site;
        o.spec = spec;
        o.material = material;
        o.category = category != null ? category : "Demand";
        o.status = status != null ? status : "접수";
        o.sortOrder = sortOrder != null ? sortOrder : 0;
        return o;
    }

    public void updateStatus(String status) {
        this.status = status;
    }

    public void setDay(int day, Integer value) {
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

    public Integer getDay(int day) {
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
