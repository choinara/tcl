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
import { ToastProvider, useToast } from './shared/components/toast/ToastProvider';
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

// Production Management
const ProductionPlanPage = lazy(() => import('./domains/production/plan/ui/ProductionPlanPage'));
const OrderRegistrationPage = lazy(() => import('./domains/production/order/ui/OrderRegistrationPage'));
const DailyProductionPlanPage = lazy(() => import('./domains/production/daily-plan/ui/DailyProductionPlanPage'));
const ApsPage = lazy(() => import('./domains/production/aps/ui/ApsPage'));
const ApsCapacitySlotPage = lazy(() => import('./domains/production/aps/ui/ApsCapacitySlotPage'));
const ApsTaktTimePage = lazy(() => import('./domains/production/aps/ui/ApsTaktTimePage'));
const ApsGanttPage = lazy(() => import('./domains/production/aps/ui/ApsGanttPage'));
const ShipmentPlanPage = lazy(() => import('./domains/production/shipment-plan/ui/ShipmentPlanPage'));

// 전자결재
const ApprovalPage = lazy(() => import('./domains/approval/ui/ApprovalPage'));
const ApprovalLinePage = lazy(() => import('./domains/approval/lines/ui/ApprovalLinePage'));
const ApprovalStatusPage = lazy(() => import('./domains/approval/status/ui/ApprovalStatusPage'));

// Master Data Management (기준정보관리)
const CustomerPage = lazy(() => import('./domains/master/customer/ui/CustomerPage'));
// SupplierPage: 협력사관리(PartnerPage)로 통합됨 — 라우트 제거, 코드는 유지
const StandardTimePage = lazy(() => import('./domains/master/standard-time/ui/StandardTimePage'));
const ProcessChemicalPage = lazy(() => import('./domains/master/process-chemical/ui/ProcessChemicalPage'));
const EquipmentPage = lazy(() => import('./domains/master/equipment/ui/EquipmentPage'));
const RawMaterialPage = lazy(() => import('./domains/master/raw-material/ui/RawMaterialPage'));
const ProductPage = lazy(() => import('./domains/master/product/ui/ProductPage'));
const ProductionRatePage = lazy(() => import('./domains/master/production-rate/ui/ProductionRatePage'));
const QualityStandardPage = lazy(() => import('./domains/master/quality-standard/ui/QualityStandardPage'));
const QualitySpecPage = lazy(() => import('./domains/master/quality-spec/ui/QualitySpecPage'));
const AppearanceInspectionPage = lazy(() => import('./domains/master/appearance-inspection/ui/AppearanceInspectionPage'));
const PartnerPage = lazy(() => import('./domains/master/partner/ui/PartnerPage'));

// 유틸리티 (전자결재 하위)
const ReceiptOcrPage = lazy(() => import('./domains/utility/receipt-ocr/ui/ReceiptOcrPage'));
const ReportPage = lazy(() => import('./domains/utility/reports/ui/ReportPage'));
const ExcelConvertPage = lazy(() => import('./domains/utility/excel-convert/ui/ExcelConvertPage'));

// 문서관리 (전자결재 하위)
const DrawingPage = lazy(() => import('./domains/document/drawing/ui/DrawingPage'));
const SopPage = lazy(() => import('./domains/document/sop/ui/SopPage'));
const CertificatePage = lazy(() => import('./domains/document/certificate/ui/CertificatePage'));
const TechnicalDocPage = lazy(() => import('./domains/document/technical/ui/TechnicalDocPage'));
const DocTemplatePage = lazy(() => import('./domains/document/template/ui/DocTemplatePage'));
const PeriodicDocPage = lazy(() => import('./domains/document/periodic/ui/PeriodicDocPage'));

// 자재관리
const PreInboundPage = lazy(() => import('./domains/warehouse/pre-inbound/ui/PreInboundPage'));

// 이메일관리
const EmailListPage = lazy(() => import('./domains/email/list/ui/EmailListPage'));
const LabelMappingPage = lazy(() => import('./domains/email/settings/labels/ui/LabelMappingPage'));
const CustomerMappingPage = lazy(() => import('./domains/email/settings/customer-mapping/ui/CustomerMappingPage'));
const OauthSettingPage = lazy(() => import('./domains/email/settings/oauth/ui/OauthSettingPage'));
const AiUsagePage = lazy(() => import('./domains/email/settings/ai-usage/ui/AiUsagePage'));

// 설비기술
const EquipMaintenancePage = lazy(() => import('./domains/equip-tech/maintenance/ui/EquipMaintenancePage'));
const EquipInspectionPage = lazy(() => import('./domains/equip-tech/inspection/ui/EquipInspectionPage'));
const EquipRepairHistPage = lazy(() => import('./domains/equip-tech/repair-hist/ui/EquipRepairHistPage'));
const EquipSparePage = lazy(() => import('./domains/equip-tech/spare/ui/EquipSparePage'));
const EquipTechInfoPage = lazy(() => import('./domains/equip-tech/tech-info/ui/EquipTechInfoPage'));
const EquipLossEventPage = lazy(() => import('./domains/equip-tech/loss-event/ui/EquipLossEventPage'));
const EquipLossMgmtPage = lazy(() => import('./domains/equip-tech/loss-mgmt/ui/EquipLossMgmtPage'));
const EquipMtbfPage = lazy(() => import('./domains/equip-tech/mtbf/ui/EquipMtbfPage'));
const EquipMttrPage = lazy(() => import('./domains/equip-tech/mttr/ui/EquipMttrPage'));
const EquipOperationPlanPage = lazy(() => import('./domains/equip-tech/operation-plan/ui/EquipOperationPlanPage'));
const EquipDashboardPage = lazy(() => import('./domains/equip-tech/dashboard/ui/EquipDashboardPage'));

// AAS/OPC-UA
const AasModelingPage = lazy(() => import('./domains/aas/model/ui/AasModelingPage'));
const AasInstancesPage = lazy(() => import('./domains/aas/instances/ui/AasInstancesPage'));
const AasInstancesOldPage = lazy(() => import('./domains/aas/instances/ui/AasInstancesOldPage'));
const AasCollectionPage = lazy(() => import('./domains/aas/collection/ui/AasCollectionPage'));
const AasConnectionPage = lazy(() => import('./domains/aas/connection/ui/AasConnectionPage'));
const AasDataPointPage = lazy(() => import('./domains/aas/collection/ui/AasDataPointPage'));
const AasLinkagePage = lazy(() => import('./domains/aas/linkage/ui/AasLinkagePage'));
const AasGatewayPage = lazy(() => import('./domains/aas/gateway/ui/AasGatewayPage'));
const AasMonitorPage = lazy(() => import('./domains/aas/monitor/ui/AasMonitorPage'));
const AasPipelineMonitorPage = lazy(() => import('./domains/aas/pipeline-monitor/ui/AasPipelineMonitorPage'));

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
  // 생산관리
  '/production/plan':         'PM0010',
  '/production/order':        'PM0020',
  '/production/daily-plan':   'PM0030',
  '/production/aps':           'PM0040',
  '/production/aps/capacity':  'PM0041',
  '/production/aps/takt':      'PM0042',
  '/production/aps/gantt':     'PM0043',
  '/production/shipment-plan': 'PM0050',
  // 전자결재
  '/approval':                'EA0010',
  '/approval/new':            'EA0020',
  '/approval/lines':          'EA0030',
  '/approval/status':         'EA0040',
  // 기준정보관리
  '/master/customer':             'MM0010',
  // '/master/supplier': 'MM0020', — 협력사관리로 통합
  '/master/standard-time':        'MM0030',
  '/master/process-chemical':     'MM0040',
  '/master/equipment':            'MM0050',
  '/master/raw-material':         'MM0060',
  '/master/product':              'MM0070',
  '/master/production-rate':      'MM0080',
  '/master/quality-standard':     'MM0090',
  '/master/quality-spec':         'MM0100',
  '/master/appearance-inspection':'MM0110',
  '/master/partner':             'MM0120',
  // 유틸리티 (전자결재 하위)
  '/utility/receipt-ocr':     'UT0010',
  '/utility/reports':         'UT0020',
  '/utility/excel-convert':   'UT0030',
  // 문서관리 (전자결재 하위)
  '/document/drawing':        'DOC0010',
  '/document/sop':            'DOC0020',
  '/document/certificate':    'DOC0030',
  '/document/technical':      'DOC0040',
  '/document/template':       'DOC0050',
  '/document/periodic':       'DOC0060',
  // 이메일관리
  '/email/list':                      'EM0010',
  '/email/settings/labels':           'EM0020',
  '/email/settings/customer-mapping': 'EM0030',
  '/email/settings/oauth':            'EM0040',
  '/email/settings/ai-usage':         'EM0050',
  // 자재관리
  '/warehouse/pre-inbound':   'WH0010',
  // 개발도구
  '/test/components':         'TS0010',
  '/test/template-l1a':       'TS0020',
  '/test/template-l1b':       'TS0030',
  '/test/template-l2':        'TS0040',
  '/test/template-t03':       'TS0050',
  '/test/template-t05':       'TS0060',
  // 설비기술
  '/et/maintenance':          'ET0010',
  '/et/inspection':           'ET0020',
  '/et/repair-hist':          'ET0030',
  '/et/spare':                'ET0050',
  '/et/tech-info':            'ET0090',
  '/et/loss-event':           'ET0100',
  '/et/loss-mgmt':            'ET0060',
  '/et/mtbf':                 'ET0070',
  '/et/mttr':                 'ET0080',
  '/et/operation-plan':       'ET0110',
  '/et/dashboard':            'ET0120',
  // AAS/OPC-UA
  '/aas/modeling':            'AA0010',
  '/aas/instances':           'AA0020',
  '/test/asset-instance-ui':  'AA0021',
  '/aas/collection':          'AA0030',
  '/aas/connection':          'AA0040',
  '/aas/collection-items':    'AA0031',
  '/test/aas-linkage-ui':     'AA0060',
  '/opcua/gateway':           'AA0070',
  '/aas/monitor':             'AA0080',
  '/aas/pipeline-monitor':   'AA0090',
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

                    {/* Production Management */}
                    <Route path="/production/plan" element={<ProductionPlanPage />} />
                    <Route path="/production/order" element={<OrderRegistrationPage />} />
                    <Route path="/production/daily-plan" element={<DailyProductionPlanPage />} />
                    <Route path="/production/aps" element={<ApsPage />} />
                    <Route path="/production/aps/capacity" element={<ApsCapacitySlotPage />} />
                    <Route path="/production/aps/takt" element={<ApsTaktTimePage />} />
                    <Route path="/production/aps/gantt" element={<ApsGanttPage />} />
                    <Route path="/production/shipment-plan" element={<ShipmentPlanPage />} />

                    {/* 기준정보관리 */}
                    <Route path="/master/customer" element={<CustomerPage />} />
                    {/* /master/supplier: 협력사관리로 통합 */}
                    <Route path="/master/standard-time" element={<StandardTimePage />} />
                    <Route path="/master/process-chemical" element={<ProcessChemicalPage />} />
                    <Route path="/master/equipment" element={<EquipmentPage />} />
                    <Route path="/master/raw-material" element={<RawMaterialPage />} />
                    <Route path="/master/product" element={<ProductPage />} />
                    <Route path="/master/production-rate" element={<ProductionRatePage />} />
                    <Route path="/master/quality-standard" element={<QualityStandardPage />} />
                    <Route path="/master/quality-spec" element={<QualitySpecPage />} />
                    <Route path="/master/appearance-inspection" element={<AppearanceInspectionPage />} />
                    <Route path="/master/partner" element={<PartnerPage />} />

                    {/* 이메일관리 */}
                    <Route path="/email/list" element={<EmailListPage />} />
                    <Route path="/email/settings/labels" element={<LabelMappingPage />} />
                    <Route path="/email/settings/customer-mapping" element={<CustomerMappingPage />} />
                    <Route path="/email/settings/oauth" element={<OauthSettingPage />} />
                    <Route path="/email/settings/ai-usage" element={<AiUsagePage />} />

                    {/* 자재관리 */}
                    <Route path="/warehouse/pre-inbound" element={<PreInboundPage />} />

                    {/* 전자결재 */}
                    <Route path="/approval/lines" element={<ApprovalLinePage />} />
                    <Route path="/approval/status" element={<ApprovalStatusPage />} />
                    <Route path="/approval/*" element={<ApprovalPage />} />
                    <Route path="/utility/receipt-ocr" element={<ReceiptOcrPage />} />
                    <Route path="/utility/reports" element={<ReportPage />} />
                    <Route path="/utility/excel-convert" element={<ExcelConvertPage />} />

                    {/* 문서관리 */}
                    <Route path="/document/drawing" element={<DrawingPage />} />
                    <Route path="/document/sop" element={<SopPage />} />
                    <Route path="/document/certificate" element={<CertificatePage />} />
                    <Route path="/document/technical" element={<TechnicalDocPage />} />
                    <Route path="/document/template" element={<DocTemplatePage />} />
                    <Route path="/document/periodic" element={<PeriodicDocPage />} />

                    {/* 설비기술 */}
                    <Route path="/et/maintenance" element={<EquipMaintenancePage />} />
                    <Route path="/et/inspection" element={<EquipInspectionPage />} />
                    <Route path="/et/repair-hist" element={<EquipRepairHistPage />} />
                    <Route path="/et/spare" element={<EquipSparePage />} />
                    <Route path="/et/tech-info" element={<EquipTechInfoPage />} />
                    <Route path="/et/loss-event" element={<EquipLossEventPage />} />
                    <Route path="/et/loss-mgmt" element={<EquipLossMgmtPage />} />
                    <Route path="/et/mtbf" element={<EquipMtbfPage />} />
                    <Route path="/et/mttr" element={<EquipMttrPage />} />
                    <Route path="/et/operation-plan" element={<EquipOperationPlanPage />} />
                    <Route path="/et/dashboard" element={<EquipDashboardPage />} />

                    {/* AAS/OPC-UA */}
                    <Route path="/aas/modeling" element={<AasModelingPage />} />
                    <Route path="/aas/instances" element={<AasInstancesPage />} />
                    <Route path="/test/asset-instance-ui" element={<AasInstancesOldPage />} />
                    <Route path="/aas/collection" element={<AasCollectionPage />} />
                    <Route path="/aas/connection" element={<AasConnectionPage />} />
                    <Route path="/aas/collection-items" element={<AasDataPointPage />} />
                    <Route path="/test/aas-linkage-ui" element={<AasLinkagePage />} />
                    <Route path="/opcua/gateway" element={<AasGatewayPage />} />
                    <Route path="/aas/monitor" element={<AasMonitorPage />} />
                    <Route path="/aas/pipeline-monitor" element={<AasPipelineMonitorPage />} />

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
