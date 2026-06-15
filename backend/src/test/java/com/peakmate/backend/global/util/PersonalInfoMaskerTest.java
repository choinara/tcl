package com.peakmate.backend.global.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * PersonalInfoMasker 단위 테스트.
 * 역할 기반 / canViewPii 기반 AccessLevel 결정 로직과 마스킹 결과를 검증합니다.
 */
class PersonalInfoMaskerTest {

    @Nested
    @DisplayName("resolveAccessLevel(List<String> roles, boolean isSelf)")
    class ResolveAccessLevelByRoles {

        @Test
        @DisplayName("SUPER_ADMIN 역할이면 FULL을 반환한다")
        void superAdmin_returnsFull() {
            PersonalInfoMasker.AccessLevel level =
                    PersonalInfoMasker.resolveAccessLevel(List.of("SUPER_ADMIN"), false);
            assertThat(level).isEqualTo(PersonalInfoMasker.AccessLevel.FULL);
        }

        @Test
        @DisplayName("ADMIN 역할이면 PARTIAL을 반환한다")
        void admin_returnsPartial() {
            PersonalInfoMasker.AccessLevel level =
                    PersonalInfoMasker.resolveAccessLevel(List.of("ADMIN"), false);
            assertThat(level).isEqualTo(PersonalInfoMasker.AccessLevel.PARTIAL);
        }

        @Test
        @DisplayName("USER 역할이면 NONE을 반환한다")
        void user_returnsNone() {
            PersonalInfoMasker.AccessLevel level =
                    PersonalInfoMasker.resolveAccessLevel(List.of("USER"), false);
            assertThat(level).isEqualTo(PersonalInfoMasker.AccessLevel.NONE);
        }

        @Test
        @DisplayName("isSelf=true이면 역할에 관계없이 FULL을 반환한다")
        void isSelf_alwaysFull() {
            PersonalInfoMasker.AccessLevel level =
                    PersonalInfoMasker.resolveAccessLevel(List.of("USER"), true);
            assertThat(level).isEqualTo(PersonalInfoMasker.AccessLevel.FULL);
        }

        @Test
        @DisplayName("roles가 null이고 isSelf=false이면 NONE을 반환한다")
        void nullRoles_returnsNone() {
            PersonalInfoMasker.AccessLevel level =
                    PersonalInfoMasker.resolveAccessLevel((java.util.List<String>) null, false);
            assertThat(level).isEqualTo(PersonalInfoMasker.AccessLevel.NONE);
        }

        @Test
        @DisplayName("roles가 빈 리스트이면 NONE을 반환한다")
        void emptyRoles_returnsNone() {
            PersonalInfoMasker.AccessLevel level =
                    PersonalInfoMasker.resolveAccessLevel(List.of(), false);
            assertThat(level).isEqualTo(PersonalInfoMasker.AccessLevel.NONE);
        }

        @Test
        @DisplayName("SUPER_ADMIN과 ADMIN 복수 역할이면 FULL을 반환한다")
        void multipleRoles_superAdminTakesPrecedence() {
            PersonalInfoMasker.AccessLevel level =
                    PersonalInfoMasker.resolveAccessLevel(List.of("ADMIN", "SUPER_ADMIN"), false);
            assertThat(level).isEqualTo(PersonalInfoMasker.AccessLevel.FULL);
        }
    }

    @Nested
    @DisplayName("maskEmail(String email, AccessLevel level)")
    class MaskEmailWithLevel {

        @Test
        @DisplayName("FULL이면 평문 이메일을 반환한다")
        void full_returnsPlainEmail() {
            String result = PersonalInfoMasker.maskEmail("hong@example.com", PersonalInfoMasker.AccessLevel.FULL);
            assertThat(result).isEqualTo("hong@example.com");
        }

        @Test
        @DisplayName("PARTIAL이면 부분 마스킹된 이메일을 반환한다")
        void partial_returnsMaskedEmail() {
            String result = PersonalInfoMasker.maskEmail("hong@example.com", PersonalInfoMasker.AccessLevel.PARTIAL);
            assertThat(result).isEqualTo("ho***@example.com");
        }

        @Test
        @DisplayName("NONE이면 완전 마스킹된 이메일을 반환한다")
        void none_returnsFullyMaskedEmail() {
            String result = PersonalInfoMasker.maskEmail("hong@example.com", PersonalInfoMasker.AccessLevel.NONE);
            assertThat(result).isEqualTo("***@***.***");
        }

        @Test
        @DisplayName("null 이메일은 null을 반환한다")
        void nullEmail_returnsNull() {
            assertThat(PersonalInfoMasker.maskEmail(null, PersonalInfoMasker.AccessLevel.FULL)).isNull();
            assertThat(PersonalInfoMasker.maskEmail(null, PersonalInfoMasker.AccessLevel.NONE)).isNull();
        }

        @Test
        @DisplayName("PARTIAL에서 짧은 로컬 파트(2자 이하)는 첫 글자 + *** 형태로 마스킹한다")
        void partial_shortLocal_masksCorrectly() {
            String result = PersonalInfoMasker.maskEmail("ab@example.com", PersonalInfoMasker.AccessLevel.PARTIAL);
            assertThat(result).isEqualTo("a***@example.com");
        }
    }

    @Nested
    @DisplayName("maskName(String name, AccessLevel level)")
    class MaskNameWithLevel {

        @Test
        @DisplayName("FULL이면 평문 이름을 반환한다")
        void full_returnsPlainName() {
            String result = PersonalInfoMasker.maskName("홍길동", PersonalInfoMasker.AccessLevel.FULL);
            assertThat(result).isEqualTo("홍길동");
        }

        @Test
        @DisplayName("PARTIAL이면 부분 마스킹된 이름을 반환한다 (홍*동)")
        void partial_returnsMaskedName() {
            String result = PersonalInfoMasker.maskName("홍길동", PersonalInfoMasker.AccessLevel.PARTIAL);
            assertThat(result).isEqualTo("홍*동");
        }

        @Test
        @DisplayName("NONE이면 완전 마스킹된 이름을 반환한다")
        void none_returnsFullyMaskedName() {
            String result = PersonalInfoMasker.maskName("홍길동", PersonalInfoMasker.AccessLevel.NONE);
            assertThat(result).isEqualTo("***");
        }

        @Test
        @DisplayName("2글자 이름의 PARTIAL 마스킹")
        void partial_twoCharName() {
            String result = PersonalInfoMasker.maskName("김철", PersonalInfoMasker.AccessLevel.PARTIAL);
            assertThat(result).isEqualTo("김*");
        }

        @Test
        @DisplayName("1글자 이름의 PARTIAL 마스킹")
        void partial_oneCharName() {
            String result = PersonalInfoMasker.maskName("김", PersonalInfoMasker.AccessLevel.PARTIAL);
            assertThat(result).isEqualTo("*");
        }

        @Test
        @DisplayName("null 이름은 null을 반환한다")
        void nullName_returnsNull() {
            assertThat(PersonalInfoMasker.maskName(null, PersonalInfoMasker.AccessLevel.FULL)).isNull();
            assertThat(PersonalInfoMasker.maskName(null, PersonalInfoMasker.AccessLevel.PARTIAL)).isNull();
        }

        @Test
        @DisplayName("4글자 이름의 PARTIAL 마스킹 (첫글자 + ** + 마지막글자)")
        void partial_fourCharName() {
            String result = PersonalInfoMasker.maskName("남궁민수", PersonalInfoMasker.AccessLevel.PARTIAL);
            assertThat(result).isEqualTo("남**수");
        }
    }
}
