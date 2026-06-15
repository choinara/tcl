package com.peakmate.backend.domain.organization.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;

@Getter
@Entity
@Table(name = "department")
public class Department extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id")
    private Long id;

    @Column(name = "dept_code", length = 50, nullable = false, unique = true)
    private String deptCode;

    @Column(name = "dept_name", length = 100, nullable = false)
    private String deptName;

    @Column(name = "company_id")
    private Long companyId;

    @Column(name = "parent_id")
    private Long parentId;

    @Column(name = "dept_level", nullable = false)
    private Integer deptLevel = 1;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "manager_name", length = 100)
    private String managerName;

    @Column(name = "phone", length = 30)
    private String phone;

    @Column(name = "location", length = 200)
    private String location;

    @Column(name = "is_active", length = 1, nullable = false)
    private String isActive = "Y";

    public static Department create(String deptCode, String deptName, Long companyId, Long parentId,
                                    Integer deptLevel, Integer sortOrder, String managerName,
                                    String phone, String location) {
        Department d = new Department();
        d.deptCode = deptCode;
        d.deptName = deptName;
        d.companyId = companyId;
        d.parentId = parentId;
        d.deptLevel = deptLevel != null ? deptLevel : 1;
        d.sortOrder = sortOrder != null ? sortOrder : 0;
        d.managerName = managerName;
        d.phone = phone;
        d.location = location;
        d.isActive = "Y";
        return d;
    }

    public void update(String deptName, Long companyId, Long parentId, Integer deptLevel,
                       Integer sortOrder, String managerName, String phone, String location, String isActive) {
        this.deptName = deptName;
        this.companyId = companyId;
        this.parentId = parentId;
        if (deptLevel != null) this.deptLevel = deptLevel;
        if (sortOrder != null) this.sortOrder = sortOrder;
        this.managerName = managerName;
        this.phone = phone;
        this.location = location;
        if (isActive != null) this.isActive = isActive;
    }
}
