// AAS Module Type Definitions
// All interfaces used across AAS pages (8 pages total)

// ─── OPC-UA Core Types ───

export type OpcuaCategory = 'Temperature' | 'Time' | 'Vision' | 'Pressure' | 'VisionNG'

export interface OpcuaDataPoint {
  id: number
  node_id: string          // ns=2;s=EQUIP-NAME/Temperature/UpTabHeat
  browse_name: string      // UpTabHeat
  korean_name: string      // 상부탭예열
  category: OpcuaCategory
  plc_address: string      // D7801
  data_type: string        // Word / DWord
  sampling_ms: number      // 1000
  aas_path: string | null  // /OperationalData/Temperature:UpTabHeat (null이면 AAS 미연결)
  aas_linked: boolean
  mock_value: number
  unit: string             // °C, sec, mm, count 등
  equip_name: string | null
  is_active: boolean
  source_type: string | null
  aas_property_path: string | null
}

// ─── AAS Core Types ───

export interface AasShell {
  aas_id: string
  id_short: string
  asset_kind: 'Instance' | 'Type'
  global_asset_id: string
  description: string
}

export interface AasSubmodel {
  submodel_id: string
  id_short: string
  semantic_id: string
  shell_id: string
  element_count: number
}

export interface AasElement {
  element_id: string
  submodel_id: string
  element_type: 'Property' | 'SubmodelElementCollection' | 'Blob' | 'Range'
  id_short: string
  element_path: string
  value_type: string
  value: string
  unit: string
  min?: string
  max?: string
}

// ─── Asset Management Types ───

export interface AssetType {
  type_code: 'equipment' | 'vision' | 'amr'
  type_name: string
  shell_id: string
}

export interface AssetInstance {
  id?: number
  instance_id: string
  instance_name: string
  type_code: string
  location_floor: string | null
  serial_number: string | null
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'
  opcua_node_count: number
  extra_fields?: Record<string, unknown>
}

// ─── Data Source & Mapping Types ───

export interface DataSource {
  source_id: string
  instance_id: string
  source_type: 'plc_modbus' | 'plc_mc' | 'vision_folder'
  host: string
  port: number
  extra: Record<string, string | number>
  connected: boolean
}

export interface MappingItem {
  mapping_id: string
  element_path: string
  value_type: string
  unit: string
  source_id: string
  source_address: string
  channel: 'plc_100ms' | 'plc_1s'
  scale_factor: number
  offset_value: number
  polling_enabled: boolean
  aas_linked: boolean
  category: OpcuaCategory
}

// ─── OPC-UA Node Tree Types ───

export interface OpcuaNode {
  node_id: string
  browse_name: string
  node_class: 'Object' | 'Variable'
  parent_id: string | null
  children?: OpcuaNode[]
}

// ─── Collection Types ───

export interface CollectionChannel {
  channel_id: string
  name: string
  active: boolean
  collected_count: number
  last_collected: string
}

export interface CollectionStatus {
  instance_id: string
  instance_name: string
  connected: boolean
  last_collected: string
  error_count: number
}

export interface CollectedRow {
  timestamp: string
  node_id: string
  aas_path: string | null
  plc_address: string
  category: OpcuaCategory
  value: string
  unit: string
}

// ─── Gateway Types (AasGatewayPage) ───

export interface GatewaySession {
  session_id: string
  client_name: string
  client_ip: string
  connected_at: string
  subscriptions: number
  monitored_items: number
}

export interface GatewayEquipNode {
  instance_id: string
  instance_name: string
  node_count: number
  connected: boolean
  last_read: string
  last_write: string
  read_count: number
  write_count: number
  error_count: number
}

export interface GatewayLog {
  id: number
  timestamp: string
  level: 'INFO' | 'WARN' | 'ERROR'
  source: string
  message: string
}

// ─── Modeling Page Types (AasModelingPage) ───

export interface AASXFile {
  id: number
  file_name: string
  file_hash: string
  aas_version: string | null
  description: string | null
  created_at: string
  shell_count: number
  submodel_count: number
  element_count: number
}

export interface ParseSummary {
  file_name: string
  aas_version: string
  file_hash: string
  shell_count: number
  submodel_count: number
  element_count: number
}

export interface ParsedShell {
  id: string
  idShort: string
  assetInformation?: {
    assetKind?: string
    globalAssetId?: string
  }
  description?: Array<{ language: string; text: string }>
}

export interface ParsedSubmodel {
  id: string
  idShort: string
  semanticId?: { keys?: Array<{ value: string }> }
  submodelElements?: unknown[]
}

export interface ParsedElement {
  id_short: string
  element_type: string
  element_path: string
  submodel_id: string
  submodel_id_short: string
  value: unknown
  value_type: string
  semantic_id: string | null
  description_ko: string | null
  description_en: string | null
  unit: string | null
}

export interface ParsedData {
  shells: ParsedShell[]
  submodels: ParsedSubmodel[]
  elements: ParsedElement[]
}

export interface ValidationResult {
  check_no: number
  category: string
  importance: string
  check_item: string
  description: string
  is_passed: boolean
  remarks: string
}

export interface ValidationSummary {
  total: number
  passed: number
  failed: number
  pass_rate: number
  mandatory_total: number
  mandatory_passed: number
  mandatory_failed: number
  optional_total: number
  optional_passed: number
  optional_failed: number
}

export interface ValidationResponse {
  success: boolean
  file_name: string
  results: ValidationResult[]
  summary: ValidationSummary
}

// ─── Instances Page Types (AasInstancesPage) ───

export interface AssetTypeDB {
  id: number
  type_code: string
  type_name: string
  shell_id: string | null
  description: string | null
  field_schema: Array<{ key: string; label: string; type: string }>
}

export interface FieldSchemaItem {
  key: string
  label: string
  type: 'text' | 'number' | 'textarea'
}

// ─── Collection Page Types (AasCollectionPage) ───

export interface CollectionDataSource {
  id: number
  source_id: string
  source_name: string
  source_type: 'plc' | 'vision' | 'database'
  plc_protocol?: string
  plc_ip?: string
  plc_port?: number
  vision_watch_folder?: string
  vision_csv_pattern?: string
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR'
  last_connected_at?: string
}

export interface CollectionItem {
  id: number
  item_id: string
  node_id: string
  browse_name: string
  display_name: string
  category: string
  data_type: string
  unit: string
  sampling_ms: number
  source_type: 'aas_property' | 'plc_direct' | 'vision' | 'manual'
  aas_property_path?: string
  plc_address?: string
  vision_csv_column?: string
  is_active: boolean
}

export interface CollectionOpcuaNode {
  id: number
  node_id: string
  node_class: string
  browse_name: string
  display_name: string
  parent_node_id?: string
  data_type?: string
  is_published: boolean
  last_value?: string
  last_updated?: string
}

export interface FileHeader {
  fileName: string
  headers: string[]
}

// ─── Linkage Page Types (AasLinkagePage) ───

export interface AasTreeNode {
  id: string
  label: string
  type: 'root' | 'submodel' | 'category' | 'element'
  children?: AasTreeNode[]
  linked?: boolean
  dataPoint?: OpcuaDataPoint
}

// ─── Pipeline Monitor Types (AA0090) ───

export interface PipelineStatus {
  queue_size: number
  queue_capacity: number
  queue_full: boolean
  queue_usage_percent: number
  redis_status: 'CONNECTED' | 'DISCONNECTED' | 'NOT_CONFIGURED'
  timescaledb_status: 'CONNECTED' | 'DISCONNECTED' | 'NOT_CONFIGURED'
  insert_tps_5min: number
  pending_count: number
  done_count: number
  dead_count: number
}

export interface EdgeStatus {
  edge_id: string
  last_ingest_at: string | null
  recent_1min_count: number
  status: 'NORMAL' | 'DELAYED' | 'NO_SIGNAL'
}

export interface PendingItem {
  id: number
  status: 'PENDING' | 'DONE' | 'DEAD'
  retry_count: number
  error_message: string | null
  created_at: string
  last_retry_at: string | null
  done_at: string | null
}
