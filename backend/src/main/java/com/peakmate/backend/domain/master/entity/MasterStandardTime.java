package com.peakmate.backend.domain.master.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;
import java.math.BigDecimal;

@Getter
@Entity
@Table(name = "master_standard_time")
public class MasterStandardTime extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id")
    private Long id;

    @Column(name = "category", length = 50)
    private String category;

    @Column(name = "item_name", length = 200)
    private String itemName;

    @Column(name = "standard_hours", precision = 10, scale = 2)
    private BigDecimal standardHours;

    @Column(name = "is_active", length = 1, nullable = false)
    private String isActive = "Y";

    public static MasterStandardTime create(String category, String itemName, BigDecimal standardHours) {
        MasterStandardTime c = new MasterStandardTime();
        c.category = category;
        c.itemName = itemName;
        c.standardHours = standardHours;
        c.isActive = "Y";
        return c;
    }

    public void update(String category, String itemName, BigDecimal standardHours, String isActive) {
        this.category = category;
        this.itemName = itemName;
        this.standardHours = standardHours;
        if (isActive != null) this.isActive = isActive;
    }
}
