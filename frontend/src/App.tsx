import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import '@/i18n';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { SessionTimeoutProvider } from '@/components/auth/SessionTimeoutProvider';
import { NotificationBanner } from '@/components/notification/NotificationBanner';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotifyStore } from '@/stores/useNotifyStore';
import { WorkingOverlay } from '@/components/ui/WorkingOverlay';
import { ToastProvider } from './shared/components/toast/ToastProvider';
import { useToast } from './shared/components/toast/useToast';
import { menuConfig } from './config/menuConfig';

// Lazy load pages
const LoginPage = lazy(() => import('./domains/login/LoginPage'));
const Dashboard = lazy(() => import('./dashboard/Dashboard'));
const NotFound = lazy(() => import('./presenstation/default/NotFound'));
const PrivacyPolicyPage = lazy(() => import('./domains/privacy/PrivacyPolicyPage'));

// Settings
const Settings = lazy(() => import('./domains/settings/Settings'));

// User/Organization Management
const UserManagementPage = lazy(() => import('./domains/user/member/ui/UserManagementPage'));
const DepartmentPage = lazy(() => import('./domains/user/department/ui/DepartmentPage'));
const CompanyPage = lazy(() => import('./domains/user/company/ui/CompanyPage'));
const PositionPage = lazy(() => import('./domains/user/position/ui/PositionPage'));
const UserRolePage = lazy(() => import('./domains/user/role/ui/UserRolePage'));
const OrgChartPage = lazy(() => import('./domains/user/chart/ui/OrgChartPage'));

// System Management
const MenuManagementPage = lazy(() => import('./domains/system/menus/ui/MenuManagementPage'));
const MenuAuthPage = lazy(() => import('./domains/system/menu-auth/ui/MenuAuthPage'));
const RoleManagementPage = lazy(() => import('./domains/system/roles/ui/RoleManagementPage'));
const SystemSettingsPage = lazy(() => import('./domains/system/settings/ui/SystemSettingsPage'));
const UserAuthPage = lazy(() => import('./domains/system/user-auth/ui/UserAuthPage'));
const SystemLogPage = lazy(() => import('./domains/system/logs/ui/SystemLogPage'));
const NotificationPage = lazy(() => import('./domains/system/notification/ui/NotificationPage'));
const UiSettingsPage = lazy(() => import('./domains/system/ui-settings/ui/UiSettingsPage'));
const CommonCodePage = lazy(() => import('./domains/system/common-code/ui/CommonCodePage'));
const I18nManagementPage = lazy(() => import('./domains/system/i18n/ui/I18nManagementPage'));

// 유틸리티
const ReportPage = lazy(() => import('./domains/utility/reports/ui/ReportPage'));
const ExcelConvertPage = lazy(() => import('./domains/utility/excel-convert/ui/ExcelConvertPage'));

// TCL — 이메일 자동화
const EmailDashboardPage  = lazy(() => import('./domains/tcl/email/dashboard/ui/EmailDashboardPage'));
const EmailSearchPage     = lazy(() => import('./domains/tcl/email/search/ui/EmailSearchPage'));
const ImapAccountPage     = lazy(() => import('./domains/tcl/email/accounts/ui/ImapAccountPage'));
const AssignmentRulePage  = lazy(() => import('./domains/tcl/email/rules/ui/AssignmentRulePage'));

// TCL — 운임·스케줄
const FreightRatePage     = lazy(() => import('./domains/tcl/freight/rates/ui/FreightRatePage'));
const VesselSchedulePage  = lazy(() => import('./domains/tcl/freight/schedules/ui/VesselSchedulePage'));

// TCL — 선적 트랙킹
const TrackingPage        = lazy(() => import('./domains/tcl/tracking/ui/TrackingPage'));

// TCL — AI 챗봇
const ChatbotPage         = lazy(() => import('./domains/tcl/chatbot/ui/ChatbotPage'));

// TCL — 어드민
const TaskManagementPage  = lazy(() => import('./domains/tcl/admin/tasks/ui/TaskManagementPage'));
const SchedulerStatusPage = lazy(() => import('./domains/tcl/admin/scheduler/ui/SchedulerStatusPage'));

// Test
const GridTestPage = lazy(() => import('./domains/test/ui/GridTestPage'));
const ComponentShowcasePage = lazy(() => import('./domains/test/ui/ComponentShowcasePage'));
const TemplateL1ADemoPage = lazy(() => import('./domains/test/ui/TemplateL1ADemoPage'));
const TemplateL1BDemoPage = lazy(() => import('./domains/test/ui/TemplateL1BDemoPage'));
const TemplateL2DemoPage  = lazy(() => import('./domains/test/ui/TemplateL2DemoPage'));
const TemplateT03DemoPage = lazy(() => import('./domains/test/ui/TemplateT03DemoPage'));
const TemplateT05DemoPage = lazy(() => import('./domains/test/ui/TemplateT05DemoPage'));

function PageLoader() {
  return (
    <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
      Loading...
    </div>
  );
}

function AppInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);

  return <>{children}</>;
}

function BrowserBackBlocker({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return <>{children}</>;
}

// path → menuCode 매핑 (ProtectedRoute에서 canRead 자동 체크)
const pathToMenuCode: Record<string, string> = {
  // 사용자/조직관리
  '/system/users':            'UM0010',
  '/organization/department': 'UM0020',
  '/organization/company':    'UM0030',
  '/organization/position':   'UM0040',
  '/organization/chart':      'UM0050',
  // 시스템관리
  '/system/menus':            'SM0010',
  '/system/menu-auth':        'SM0020',
  '/system/roles':            'SM0030',
  '/user-role':               'SM0030',
  '/system/settings':         'SM0040',
  '/system/user-auth':        'SM0050',
  '/system/logs':             'SM0060',
  '/system/notification':     'SM0070',
  '/system/ui-settings':      'SM0080',
  '/system/common-codes':     'SM0090',
  '/system/i18n':             'SM0100',
  // 유틸리티
  '/utility/reports':         'UT0020',
  '/utility/excel-convert':   'UT0030',
  // TCL — 이메일 자동화
  '/email/dashboard': 'EM0010',
  '/email/search':    'EM0020',
  '/email/accounts':  'EM0030',
  '/email/rules':     'EM0040',
  // TCL — 운임·스케줄
  '/freight/rates':     'FR0010',
  '/freight/schedules': 'FR0020',
  // TCL — 선적 트랙킹
  '/tracking': 'TK0010',
  // TCL — AI 챗봇
  '/chatbot': 'CB0010',
  // TCL — 어드민
  '/admin/tasks':     'AD0010',
  '/admin/scheduler': 'AD0020',
  // 개발도구
  '/test/components':         'TS0010',
  '/test/template-l1a':       'TS0020',
  '/test/template-l1b':       'TS0030',
  '/test/template-l2':        'TS0040',
  '/test/template-t03':       'TS0050',
  '/test/template-t05':       'TS0060',
};

/** ToastProvider 내부에서 notify/errorHistory/setErrorPanelOpen을 useNotifyStore에 등록 — peakmate-core에서 사용 가능 */
function NotifyStoreInitializer() {
  const { notify, errorHistory, setErrorPanelOpen } = useToast();
  useEffect(() => {
    useNotifyStore.getState().setNotifyFn(notify);
    useNotifyStore.getState().setErrorPanelOpenFn(setErrorPanelOpen);
  }, [notify, setErrorPanelOpen]);

  // errorHistory 변경 시 스토어 동기화 (에러 빈도 낮아 성능 영향 무시 가능)
  useEffect(() => {
    useNotifyStore.getState().setErrorHistory(errorHistory);
  }, [errorHistory]);

  return null;
}

function App() {
  return (
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <AppInitializer>
          <SessionTimeoutProvider>
            <NotificationBanner />
            <ToastProvider>
            <NotifyStoreInitializer />
            <WorkingOverlay />
            <BrowserBackBlocker>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/privacy" element={<PrivacyPolicyPage />} />

                  {/* Protected */}
                  <Route element={<ProtectedRoute pathToMenuCode={pathToMenuCode} />}>
                    <Route element={<AppLayout menuConfig={menuConfig} />}>
                    <Route path="/" element={<Dashboard />} />

                    {/* Settings */}
                    <Route path="/settings" element={<Settings />} />

                    {/* User/Organization Management */}
                    <Route path="/system/users" element={<UserManagementPage />} />
                    <Route path="/organization/department" element={<DepartmentPage />} />
                    <Route path="/organization/company" element={<CompanyPage />} />
                    <Route path="/organization/position" element={<PositionPage />} />
                    <Route path="/user-role" element={<UserRolePage />} />
                    <Route path="/organization/chart" element={<OrgChartPage />} />

                    {/* System Management */}
                    <Route path="/system/menus" element={<MenuManagementPage />} />
                    <Route path="/system/menu-auth" element={<MenuAuthPage />} />
                    <Route path="/system/roles" element={<RoleManagementPage />} />
                    <Route path="/system/settings" element={<SystemSettingsPage />} />
                    <Route path="/system/user-auth" element={<UserAuthPage />} />
                    <Route path="/system/logs" element={<SystemLogPage />} />
                    <Route path="/system/notification" element={<NotificationPage />} />
                    <Route path="/system/ui-settings" element={<UiSettingsPage />} />
                    <Route path="/system/common-codes" element={<CommonCodePage />} />
                    <Route path="/system/i18n" element={<I18nManagementPage />} />

                    {/* 유틸리티 */}
                    <Route path="/utility/reports" element={<ReportPage />} />
                    <Route path="/utility/excel-convert" element={<ExcelConvertPage />} />

                    {/* TCL — 이메일 자동화 */}
                    <Route path="/email/dashboard" element={<EmailDashboardPage />} />
                    <Route path="/email/search"    element={<EmailSearchPage />} />
                    <Route path="/email/accounts"  element={<ImapAccountPage />} />
                    <Route path="/email/rules"     element={<AssignmentRulePage />} />

                    {/* TCL — 운임·스케줄 */}
                    <Route path="/freight/rates"     element={<FreightRatePage />} />
                    <Route path="/freight/schedules" element={<VesselSchedulePage />} />

                    {/* TCL — 선적 트랙킹 */}
                    <Route path="/tracking" element={<TrackingPage />} />

                    {/* TCL — AI 챗봇 */}
                    <Route path="/chatbot" element={<ChatbotPage />} />

                    {/* TCL — 어드민 */}
                    <Route path="/admin/tasks"     element={<TaskManagementPage />} />
                    <Route path="/admin/scheduler" element={<SchedulerStatusPage />} />

                    {/* Test */}
                    <Route path="/test/grid" element={<GridTestPage />} />
                    <Route path="/test/components" element={<ComponentShowcasePage />} />
                    <Route path="/test/template-l1a" element={<TemplateL1ADemoPage />} />
                    <Route path="/test/template-l1b" element={<TemplateL1BDemoPage />} />
                    <Route path="/test/template-l2"  element={<TemplateL2DemoPage />} />
                    <Route path="/test/template-t03" element={<TemplateT03DemoPage />} />
                    <Route path="/test/template-t05" element={<TemplateT05DemoPage />} />

                    {/* 404 */}
                    <Route path="*" element={<NotFound />} />
                    </Route>
                  </Route>
                </Routes>
              </Suspense>
            </BrowserBackBlocker>
            </ToastProvider>
          </SessionTimeoutProvider>
        </AppInitializer>
      </BrowserRouter>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
