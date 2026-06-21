/**
 * 애플리케이션 전역 문구 관리
 */

export const LOGIN_MESSAGES = {
    login_header_title: 'Logistics Management System',
    username: {
        label: '아이디',
        placeholder: 'admin',
        required: '아이디는 필수값 입니다.',
    },
    password: {
        label: '패스워드',
        placeholder: '',
        required: '패스워드는 필수값 입니다.',
    },
    hint: 'Hint: emilys / emilyspass',
    loginButton: '로그인',
    registerButton: '신규가입',
    login_warning_info:'· 로그인 이후 모든 기록은 로그로 보관이 됩니다.\n· 작업 완료후 반드시 Logout을 해주시기 바랍니다.',
    login_copy_right: 'Copyright 2026. True Companion Logistics. All Rights Reserved.'
} as const;
