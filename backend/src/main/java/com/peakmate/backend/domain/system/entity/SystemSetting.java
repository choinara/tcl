package com.peakmate.backend.domain.system.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "system_setting")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SystemSetting extends AuditableEntity {

    @Id
    @Column(name = "setting_key", length = 100)
    private String settingKey;

    @Column(name = "setting_value", length = 500, nullable = false)
    private String settingValue;

    @Column(name = "description", length = 200)
    private String description;

    public static SystemSetting create(String key, String value, String description) {
        SystemSetting setting = new SystemSetting();
        setting.settingKey = key;
        setting.settingValue = value;
        setting.description = description;
        return setting;
    }

    public void updateValue(String value) {
        this.settingValue = value;
    }
}
