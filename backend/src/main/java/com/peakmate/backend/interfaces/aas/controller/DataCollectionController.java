package com.peakmate.backend.interfaces.aas.controller;

import com.peakmate.backend.domain.aas.dto.CsvImportResult;
import com.peakmate.backend.domain.aas.entity.DataSource;
import com.peakmate.backend.domain.aas.entity.OpcuaDataPoint;
import com.peakmate.backend.domain.aas.service.OpcuaDataPointDomainService;
import com.peakmate.backend.domain.log.service.SystemLogService;
import com.peakmate.core.security.annotation.RequirePermission;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * AAS 수집항목 관리 컨트롤러
 * - 데이터소스 CRUD (AA0040)
 * - 수집항목(Collection Item) CRUD + engineering CSV Import (AA0030)
 * - OPC-UA 노드 조회 + 생성 (AA0030)
 */
@Slf4j
@RestController
@RequestMapping("/api/opcua")
@RequiredArgsConstructor
@Tag(name = "수집항목 관리", description = "데이터소스 CRUD, 수집항목 CRUD + CSV Import, OPC-UA 노드 조회/생성 API")
public class DataCollectionController {

    private final OpcuaDataPointDomainService domainService;
    private final SystemLogService systemLogService;

    // =========================================================================
    // Data Source CRUD (AA0040)
    // =========================================================================

    @Operation(summary = "데이터소스 조회", description = "데이터소스 목록을 반환합니다. instanceId를 지정하면 해당 인스턴스의 소스만 반환합니다.")
    @ApiResponse(responseCode = "200", description = "조회 성공")
    @RequirePermission(menu = "AA0040", action = "read")
    @GetMapping("/data-sources")
    public ResponseEntity<List<DataSourceResponse>> getDataSources(
            @RequestParam(required = false) Long instanceId) {
        List<DataSource> list = instanceId != null
                ? domainService.getDataSourcesByInstance(instanceId)
                : domainService.getAllDataSources();
        return ResponseEntity.ok(list.stream().map(DataSourceResponse::from).toList());
    }

    @Operation(summary = "데이터소스 생성", description = "새로운 데이터소스를 등록합니다. 소스 ID가 중복되면 400 에러를 반환합니다.")
    @ApiResponse(responseCode = "200", description = "생성 성공")
    @ApiResponse(responseCode = "400", description = "소스 ID 중복 또는 유효성 검증 실패")
    @RequirePermission(menu = "AA0040", action = "create")
    @PostMapping("/data-sources")
    public ResponseEntity<?> createDataSource(@RequestBody @Valid CreateDataSourceRequest req) {
        if (domainService.findDataSourceById(req.source_id()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("detail", "이미 존재하는 소스 ID입니다: " + req.source_id()));
        }
        String instanceName = domainService.resolveAssetInstanceName(req.asset_instance_id());
        DataSource ds = DataSource.create(
                req.source_id(), req.source_name(), req.source_type(),
                req.plc_protocol(), req.plc_ip(), req.plc_port(),
                req.vision_watch_folder(), req.vision_csv_pattern(), req.status(),
                req.asset_instance_code(), instanceName != null ? instanceName : req.asset_instance_name(),
                req.unit_id(), req.address_base(), req.byte_order(), req.word_order(),
                req.use_yn(), req.asset_instance_id()
        );
        DataSource saved = domainService.saveDataSource(ds);
        logDataSourceAction("created", req.source_id());
        return ResponseEntity.ok(DataSourceResponse.from(saved));
    }

    @Operation(summary = "데이터소스 수정", description = "기존 데이터소스 정보를 수정합니다. 소스 ID가 존재하지 않으면 404를 반환합니다.")
    @ApiResponse(responseCode = "200", description = "수정 성공")
    @ApiResponse(responseCode = "404", description = "데이터소스를 찾을 수 없음")
    @ApiResponse(responseCode = "400", description = "연결 수집항목 존재 시 인스턴스 변경 불가")
    @RequirePermission(menu = "AA0040", action = "update")
    @PutMapping("/data-sources/{sourceId}")
    public ResponseEntity<?> updateDataSource(@PathVariable String sourceId,
                                              @RequestBody @Valid CreateDataSourceRequest req) {
        Optional<DataSource> opt = domainService.findDataSourceById(sourceId);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        DataSource ds = opt.get();

        // asset_instance_id 변경 + 연결 수집항목 존재 시 차단
        boolean instanceChanging = req.asset_instance_id() != null
                && !req.asset_instance_id().equals(ds.getAssetInstanceId());
        if (instanceChanging && domainService.countDataPointsBySourceId(sourceId) > 0) {
            return ResponseEntity.badRequest().body(Map.of("detail",
                    "연결된 수집항목이 있어 인스턴스를 변경할 수 없습니다. 수집항목 연결 해제 후 변경하세요."));
        }

        String instanceName = domainService.resolveAssetInstanceName(req.asset_instance_id());
        ds.update(req.source_name(), req.source_type(), req.plc_protocol(), req.plc_ip(),
                req.plc_port(), req.vision_watch_folder(), req.vision_csv_pattern(), req.status(),
                req.asset_instance_code(), instanceName != null ? instanceName : req.asset_instance_name(),
                req.unit_id(), req.address_base(), req.byte_order(), req.word_order(),
                req.use_yn(), req.asset_instance_id());
        DataSource saved = domainService.saveDataSource(ds);
        logDataSourceAction("updated", sourceId);
        return ResponseEntity.ok(DataSourceResponse.from(saved));
    }

    @Operation(summary = "데이터소스 삭제", description = "지정한 소스 ID의 데이터소스를 삭제합니다. 연결 수집항목이 있으면 400을 반환합니다.")
    @ApiResponse(responseCode = "200", description = "삭제 성공")
    @ApiResponse(responseCode = "400", description = "연결 수집항목 존재 시 삭제 불가")
    @ApiResponse(responseCode = "404", description = "데이터소스를 찾을 수 없음")
    @RequirePermission(menu = "AA0040", action = "delete")
    @DeleteMapping("/data-sources/{sourceId}")
    public ResponseEntity<?> deleteDataSource(@PathVariable String sourceId) {
        if (domainService.findDataSourceById(sourceId).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        long linkedCount = domainService.countDataPointsBySourceId(sourceId);
        if (linkedCount > 0) {
            return ResponseEntity.badRequest().body(Map.of("detail",
                    "연결된 수집항목 " + linkedCount + "건이 있어 삭제할 수 없습니다. 수집항목에서 소스 연결을 먼저 제거해 주세요."));
        }
        domainService.deleteDataSource(sourceId);
        logDataSourceAction("deleted", sourceId);
        return ResponseEntity.ok(Map.of("message", "삭제되었습니다."));
    }

    @Operation(summary = "데이터소스 연결 테스트", description = "지정한 데이터소스의 연결 상태를 테스트합니다. Gateway API 미구현 시 상태 기반 mock 응답.")
    @ApiResponse(responseCode = "200", description = "테스트 완료 (success 필드로 성공 여부 확인)")
    @ApiResponse(responseCode = "404", description = "데이터소스를 찾을 수 없음")
    @RequirePermission(menu = "AA0040", action = "read")
    @PostMapping("/data-sources/{sourceId}/test-connection")
    public ResponseEntity<ConnectionTestResult> testConnection(@PathVariable String sourceId) {
        Optional<DataSource> opt = domainService.findDataSourceById(sourceId);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        DataSource ds = opt.get();
        boolean active = "ACTIVE".equals(ds.getStatus());
        String message = active ? "연결 성공" : "소스가 비활성 상태입니다";
        return ResponseEntity.ok(new ConnectionTestResult(active, message, active ? "12" : null));
    }

    public record ConnectionTestResult(boolean success, String message, String latency_ms) {}

    // =========================================================================
    // Collection Items (OpcuaDataPoint) CRUD — AA0030
    // =========================================================================

    @Operation(summary = "수집항목 조회", description = "수집항목 목록을 반환합니다. sourceId 우선, 없으면 instanceId, 둘 다 없으면 전체 반환.")
    @ApiResponse(responseCode = "200", description = "조회 성공")
    @RequirePermission(menus = {"AA0030", "AA0031"}, action = "read")
    @GetMapping("/collection-items")
    public ResponseEntity<List<CollectionItemResponse>> getCollectionItems(
            @RequestParam(required = false) Long instanceId,
            @RequestParam(required = false) String sourceId) {
        List<OpcuaDataPoint> list;
        if (sourceId != null && !sourceId.isBlank()) {
            list = domainService.getDataPointsBySource(sourceId);
        } else if (instanceId != null) {
            list = domainService.getDataPointsByInstance(instanceId);
        } else {
            list = domainService.getAllDataPoints();
        }
        return ResponseEntity.ok(list.stream().map(CollectionItemResponse::from).toList());
    }

    @Operation(summary = "수집항목 생성", description = "새로운 수집항목을 등록합니다. 노드 ID가 중복되면 400 에러를 반환합니다.")
    @ApiResponse(responseCode = "200", description = "생성 성공")
    @ApiResponse(responseCode = "400", description = "노드 ID 중복 또는 유효성 검증 실패")
    @RequirePermission(menus = {"AA0030", "AA0031"}, action = "create")
    @PostMapping("/collection-items")
    public ResponseEntity<?> createCollectionItem(@RequestBody @Valid CreateCollectionItemRequest req) {
        if (domainService.findByNodeId(req.node_id()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("detail", "이미 존재하는 노드 ID입니다: " + req.node_id()));
        }
        // source_id ↔ asset_instance_id 계층 일관성 검증
        if (req.source_id() != null && !req.source_id().isBlank()) {
            domainService.validateSourceHierarchy(req.source_id(), req.asset_instance_id());
        }
        OpcuaDataPoint dp = OpcuaDataPoint.create(
                req.node_id(), req.browse_name(), req.display_name(),
                null, req.category(), req.data_type(),
                req.unit(), req.sampling_ms(), req.source_type(),
                req.plc_address(), req.aas_property_path(), req.vision_csv_column(),
                req.is_active(),
                req.asset_instance_id(), null, null, null,
                req.memory_area(), req.register_count(), req.bit_position(),
                req.source_id()
        );
        OpcuaDataPoint saved = domainService.saveDataPoint(dp);
        return ResponseEntity.ok(CollectionItemResponse.from(saved));
    }

    @Operation(summary = "수집항목 수정", description = "기존 수집항목 정보를 수정합니다. 노드 ID가 존재하지 않으면 404를 반환합니다.")
    @ApiResponse(responseCode = "200", description = "수정 성공")
    @ApiResponse(responseCode = "404", description = "수집항목을 찾을 수 없음")
    @ApiResponse(responseCode = "400", description = "source_id/asset_instance_id 불일치")
    @RequirePermission(menus = {"AA0030", "AA0031"}, action = "update")
    @PutMapping("/collection-items/{nodeId}")
    public ResponseEntity<?> updateCollectionItem(@PathVariable String nodeId,
                                                  @RequestBody @Valid CreateCollectionItemRequest req) {
        Optional<OpcuaDataPoint> opt = domainService.findByNodeId(nodeId);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        // source_id ↔ asset_instance_id 계층 일관성 검증
        if (req.source_id() != null && !req.source_id().isBlank()) {
            domainService.validateSourceHierarchy(req.source_id(), req.asset_instance_id());
        }
        OpcuaDataPoint dp = opt.get();
        dp.update(req.browse_name(), req.display_name(), null,
                req.category(), req.data_type(), req.unit(), req.sampling_ms(),
                req.source_type(), req.plc_address(), req.aas_property_path(),
                req.vision_csv_column(), req.is_active(),
                req.memory_area(), req.register_count(), req.bit_position(),
                req.source_id());
        OpcuaDataPoint saved = domainService.saveDataPoint(dp);
        return ResponseEntity.ok(CollectionItemResponse.from(saved));
    }

    @Operation(summary = "수집항목 삭제", description = "지정한 노드 ID의 수집항목을 삭제합니다.")
    @ApiResponse(responseCode = "200", description = "삭제 성공")
    @ApiResponse(responseCode = "404", description = "수집항목을 찾을 수 없음")
    @RequirePermission(menus = {"AA0030", "AA0031"}, action = "delete")
    @DeleteMapping("/collection-items/{nodeId}")
    public ResponseEntity<?> deleteCollectionItem(@PathVariable String nodeId) {
        if (domainService.findByNodeId(nodeId).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        domainService.deleteDataPoint(nodeId);
        return ResponseEntity.ok(Map.of("message", "삭제되었습니다."));
    }

    // =========================================================================
    // Engineering CSV Import — AA0030
    // =========================================================================

    @Operation(summary = "engineering CSV 가져오기",
            description = "engineering CSV 파일을 업로드하여 수집항목을 일괄 등록/갱신합니다. "
                    + "EquipmentName 기반 인스턴스 자동 매칭. instanceId 파라미터 제공 시 전체 행 강제 오버라이드. "
                    + "성공 행은 저장, 실패 행은 errors 배열로 반환.")
    @ApiResponse(responseCode = "200", description = "가져오기 성공 (inserted/updated/errors 반환)")
    @ApiResponse(responseCode = "400", description = "파일 비어있음 또는 형식 오류")
    @RequirePermission(menus = {"AA0030", "AA0031"}, action = "create")
    @PostMapping("/collection-items/import-csv")
    public ResponseEntity<?> importCsv(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) Long instanceId) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("detail", "파일이 비어있습니다."));
        }
        try {
            CsvImportResult result = domainService.importFromCsv(file, instanceId);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        } catch (Exception e) {
            log.error("CSV import 실패", e);
            return ResponseEntity.internalServerError().body(Map.of("detail", "CSV 가져오기 중 서버 오류가 발생했습니다."));
        }
    }

    // =========================================================================
    // OPC-UA Nodes — AA0030
    // =========================================================================

    @Operation(summary = "OPC-UA 노드 조회", description = "발행(Published) 상태인 OPC-UA 노드 목록을 반환합니다.")
    @ApiResponse(responseCode = "200", description = "조회 성공")
    @RequirePermission(menus = {"AA0030", "AA0031"}, action = "read")
    @GetMapping("/nodes")
    public ResponseEntity<List<OpcuaNodeResponse>> getNodes() {
        List<OpcuaDataPoint> list = domainService.getPublishedNodes();
        return ResponseEntity.ok(list.stream().map(OpcuaNodeResponse::from).toList());
    }

    @Operation(summary = "OPC-UA 노드 자동 생성", description = "수집항목 기반으로 OPC-UA 노드를 자동 생성합니다.")
    @ApiResponse(responseCode = "200", description = "생성 성공 (created_count 반환)")
    @RequirePermission(menus = {"AA0030", "AA0031"}, action = "create")
    @PostMapping("/nodes/generate")
    public ResponseEntity<?> generateNodes() {
        int count = domainService.generateNodes();
        return ResponseEntity.ok(Map.of("created_count", count));
    }

    // =========================================================================
    // DTOs
    // =========================================================================

    @Schema(description = "데이터소스 생성 요청")
    public record CreateDataSourceRequest(
            @Schema(description = "소스 ID", example = "SRC001") @NotBlank String source_id,
            @Schema(description = "소스 이름", example = "PLC 센서 A") @NotBlank String source_name,
            @Schema(description = "소스 유형 (PLC, VISION 등)", example = "PLC") @NotBlank String source_type,
            @Schema(description = "PLC 프로토콜", example = "MODBUS_TCP") String plc_protocol,
            @Schema(description = "PLC IP 주소", example = "192.168.0.10") String plc_ip,
            @Schema(description = "PLC 포트 번호", example = "502") Integer plc_port,
            @Schema(description = "비전 감시 폴더 경로") String vision_watch_folder,
            @Schema(description = "비전 CSV 패턴") String vision_csv_pattern,
            @Schema(description = "상태", example = "ACTIVE") String status,
            @Schema(description = "Asset Instance 코드") String asset_instance_code,
            @Schema(description = "Asset Instance 이름 (캐시)") String asset_instance_name,
            @Schema(description = "Modbus Slave 주소 (1-247)") Integer unit_id,
            @Schema(description = "주소 베이스 (0 or 1)", example = "0") Integer address_base,
            @Schema(description = "바이트 순서", example = "BIG_ENDIAN") String byte_order,
            @Schema(description = "워드 순서", example = "HIGH_WORD_FIRST") String word_order,
            @Schema(description = "사용 여부 (Y/N)", example = "Y") String use_yn,
            @Schema(description = "연결 인스턴스 ID") Long asset_instance_id
    ) {}

    @Schema(description = "데이터소스 응답")
    public record DataSourceResponse(
            @Schema(description = "데이터소스 PK") Long id,
            @Schema(description = "소스 ID") String source_id,
            @Schema(description = "소스 이름") String source_name,
            @Schema(description = "소스 유형") String source_type,
            @Schema(description = "PLC 프로토콜") String plc_protocol,
            @Schema(description = "PLC IP 주소") String plc_ip,
            @Schema(description = "PLC 포트 번호") Integer plc_port,
            @Schema(description = "비전 감시 폴더 경로") String vision_watch_folder,
            @Schema(description = "비전 CSV 패턴") String vision_csv_pattern,
            @Schema(description = "상태") String status,
            @Schema(description = "마지막 접속 일시") String last_connected_at,
            @Schema(description = "Asset Instance 코드") String asset_instance_code,
            @Schema(description = "Asset Instance 이름") String asset_instance_name,
            @Schema(description = "연결 인스턴스 ID") Long asset_instance_id,
            @Schema(description = "Modbus Slave 주소") Integer unit_id,
            @Schema(description = "주소 베이스") Integer address_base,
            @Schema(description = "바이트 순서") String byte_order,
            @Schema(description = "워드 순서") String word_order,
            @Schema(description = "사용 여부") String use_yn
    ) {
        public static DataSourceResponse from(DataSource e) {
            return new DataSourceResponse(
                    e.getId(), e.getSourceId(), e.getSourceName(), e.getSourceType(),
                    e.getPlcProtocol(), e.getPlcIp(), e.getPlcPort(),
                    e.getVisionWatchFolder(), e.getVisionCsvPattern(),
                    e.getStatus(),
                    e.getLastConnectedAt() != null ? e.getLastConnectedAt().toString() : null,
                    e.getAssetInstanceCode(), e.getAssetInstanceName(),
                    e.getAssetInstanceId(),
                    e.getUnitId(), e.getAddressBase(), e.getByteOrder(), e.getWordOrder(),
                    e.getUseYn()
            );
        }
    }

    @Schema(description = "수집항목 생성 요청")
    public record CreateCollectionItemRequest(
            @Schema(description = "노드 ID", example = "ns=2;s=Temperature") @NotBlank String node_id,
            @Schema(description = "브라우즈 이름", example = "Temperature") @NotBlank String browse_name,
            @Schema(description = "표시 이름", example = "온도 센서") String display_name,
            @Schema(description = "카테고리", example = "SENSOR") String category,
            @Schema(description = "데이터 타입", example = "Double") String data_type,
            @Schema(description = "단위", example = "C") String unit,
            @Schema(description = "샘플링 주기 (ms)", example = "1000") Integer sampling_ms,
            @Schema(description = "소스 유형", example = "PLC") String source_type,
            @Schema(description = "PLC 주소", example = "D100") String plc_address,
            @Schema(description = "AAS 속성 경로") String aas_property_path,
            @Schema(description = "비전 CSV 컬럼명") String vision_csv_column,
            @Schema(description = "활성 여부") boolean is_active,
            @Schema(description = "Modbus 메모리 영역") String memory_area,
            @Schema(description = "레지스터 개수", example = "1") Integer register_count,
            @Schema(description = "비트 위치 (0-15)") Integer bit_position,
            @Schema(description = "데이터소스 ID") String source_id,
            @Schema(description = "Asset Instance ID") Long asset_instance_id
    ) {}

    @Schema(description = "수집항목 응답")
    public record CollectionItemResponse(
            @Schema(description = "수집항목 PK") Long id,
            @Schema(description = "항목 ID") String item_id,
            @Schema(description = "노드 ID") String node_id,
            @Schema(description = "브라우즈 이름") String browse_name,
            @Schema(description = "표시 이름") String display_name,
            @Schema(description = "한국어 이름") String korean_name,
            @Schema(description = "카테고리") String category,
            @Schema(description = "데이터 타입") String data_type,
            @Schema(description = "단위") String unit,
            @Schema(description = "샘플링 주기 (ms)") int sampling_ms,
            @Schema(description = "소스 유형") String source_type,
            @Schema(description = "AAS 속성 경로") String aas_property_path,
            @Schema(description = "PLC 주소") String plc_address,
            @Schema(description = "비전 CSV 컬럼명") String vision_csv_column,
            @Schema(description = "활성 여부") boolean is_active,
            @Schema(description = "AAS 연결 여부") boolean aas_linked,
            @Schema(description = "AAS 경로") String aas_path,
            @Schema(description = "Asset Instance ID") Long asset_instance_id,
            @Schema(description = "Edge 이름") String edge_name,
            @Schema(description = "설비명") String equip_name,
            @Schema(description = "배열 인덱스") Integer array_index,
            @Schema(description = "Modbus 메모리 영역") String memory_area,
            @Schema(description = "레지스터 개수") Integer register_count,
            @Schema(description = "비트 위치") Integer bit_position,
            @Schema(description = "데이터소스 ID") String source_id
    ) {
        public static CollectionItemResponse from(OpcuaDataPoint e) {
            return new CollectionItemResponse(
                    e.getId(), e.getNodeId(), e.getNodeId(),
                    e.getBrowseName(), e.getDisplayName(), e.getKoreanName(),
                    e.getCategory(), e.getDataType(), e.getUnit(),
                    e.getSamplingMs() != null ? e.getSamplingMs() : 1000,
                    e.getSourceType(),
                    e.getAasPropertyPath(), e.getPlcAddress(), e.getVisionCsvColumn(),
                    "Y".equals(e.getIsActive()),
                    "Y".equals(e.getAasLinked()),
                    e.getAasPath(),
                    e.getAssetInstanceId(),
                    e.getEdgeName(),
                    e.getEquipName(),
                    e.getArrayIndex(),
                    e.getMemoryArea(),
                    e.getRegisterCount(),
                    e.getBitPosition(),
                    e.getSourceId()
            );
        }
    }

    // =========================================================================
    // SystemLog Helper
    // =========================================================================

    private void logDataSourceAction(String action, String sourceId) {
        try {
            String currentUser = SecurityContextHolder.getContext()
                    .getAuthentication().getName();
            systemLogService.log("MASTER_DATA", null, currentUser, null,
                    "DataSource " + action, sourceId);
        } catch (Exception e) {
            log.warn("[시스템 로그 기록 실패] DataSource {}", action, e);
        }
    }

    @Schema(description = "OPC-UA 노드 응답")
    public record OpcuaNodeResponse(
            @Schema(description = "노드 PK") Long id,
            @Schema(description = "노드 ID") String node_id,
            @Schema(description = "노드 클래스") String node_class,
            @Schema(description = "브라우즈 이름") String browse_name,
            @Schema(description = "표시 이름") String display_name,
            @Schema(description = "상위 노드 ID") String parent_node_id,
            @Schema(description = "데이터 타입") String data_type,
            @Schema(description = "발행 여부") boolean is_published,
            @Schema(description = "최종 값") String last_value,
            @Schema(description = "최종 갱신 일시") String last_updated
    ) {
        public static OpcuaNodeResponse from(OpcuaDataPoint e) {
            return new OpcuaNodeResponse(
                    e.getId(), e.getNodeId(), e.getNodeClass(),
                    e.getBrowseName(), e.getDisplayName(),
                    e.getParentNodeId(), e.getDataType(),
                    "Y".equals(e.getIsPublished()),
                    e.getLastValue(),
                    e.getLastUpdated() != null ? e.getLastUpdated().toString() : null
            );
        }
    }

}
