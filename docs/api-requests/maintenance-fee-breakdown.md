# API 요청: 관리비 상세 내역 (인터넷·수도·전기 등)

관리비 공개가 의무화되어 "관리비 총액"만으로는 부족해서, **관리비에 무엇이 포함되고 항목별로 얼마인지**를
적고 보여주도록 프론트를 만들었습니다. 백엔드에는 `maintenance_fee`(총액) 한 칸뿐이라 아래 필드가 필요합니다.

## 프론트가 만든 것

| 화면 | 동작 |
|---|---|
| 매물 등록/수정 마법사 가격 단계 | "관리비 포함 내역" 체크박스(인터넷·수도·전기·가스·난방·청소·경비·주차·TV) + 항목별 금액(선택, 만원). 항목 금액 합이 월 관리비보다 크면 경고 |
| 매물 상세 | "관리비 상세" 섹션: 월 관리비 총액, 항목별 금액 또는 "포함", 총액에서 항목 합을 뺀 "기타". 항목이 없으면 "아직 등록되지 않았어요" 안내 |

- 등록/수정 요청의 JSON에 `maintenanceItems`를 **지금도 같이 보냅니다.** 스프링 부트는 모르는 JSON 필드를 무시하므로
  백엔드가 준비되기 전에는 저장되지 않을 뿐 오류는 나지 않습니다.
- 상세 응답에 `maintenanceItems`가 없으면 총액만 보여주고, 있으면 바로 항목 목록이 나옵니다 (프론트 추가 작업 없음).
- 금액 단위는 총액과 같은 **만원**이고, 항목별 금액은 소수 한 자리까지 받습니다 (예: 인터넷 2.5만원).
  `amount`가 `null`이면 "관리비에 포함되지만 금액은 적지 않음"을 뜻합니다.

## 1. 요청/응답에 필드 추가

`PropertyCreateReqDto`, `PropertyUpdateReqDto`, `PropertyDetailRespDto`에 동일하게 추가:

```java
@Schema(description = "관리비 포함 내역. 항목 종류는 중복 불가, amount는 만원 단위(없으면 null)")
List<MaintenanceItemDto> maintenanceItems

public record MaintenanceItemDto(
        MaintenanceItemType type,   // INTERNET, WATER, ELECTRICITY, GAS, HEATING, CLEANING, SECURITY, PARKING, TV
        @DecimalMin("0") Double amount
) {}
```

```java
public enum MaintenanceItemType {
    INTERNET("인터넷"), WATER("수도"), ELECTRICITY("전기"), GAS("가스"), HEATING("난방"),
    CLEANING("청소"), SECURITY("경비"), PARKING("주차"), TV("TV(케이블)");
}
```

프론트 라벨(`MAINTENANCE_ITEM_LABEL`)과 동일하게 유지해주세요.

## 2. 저장 방식 제안

기존 옵션(`property_options`)처럼 `@ElementCollection`으로 두면 간단합니다.

```java
@Embeddable
public class MaintenanceItem {
    @Enumerated(EnumType.STRING) private MaintenanceItemType type;
    private Double amount;
}

// Property
@ElementCollection
@CollectionTable(name = "property_maintenance_items", joinColumns = @JoinColumn(name = "property_id"))
private List<MaintenanceItem> maintenanceItems = new ArrayList<>();
```

- **수정 API는 전체 교체**입니다. 기존 `options`와 같이 `update()`에서 `clear()` 후 `addAll()` 해주세요
  (프론트 수정 화면이 전체 목록을 항상 다시 보냅니다. 요청에 필드가 없거나 null이면 기존 값 유지가 안전합니다).
- 검증 권장: 같은 `type` 중복 불가, `amount` 합이 `maintenanceFee`보다 크면 400 (프론트는 경고만 하고 막지는 않으므로 서버가 최종 판단).

## 3. ⚠️ DB CHECK 제약조건

`@Enumerated(STRING)` 컬럼은 하이버네이트가 CHECK 제약조건을 만들고, `ddl-auto: update`는 이후에 바뀌지 않습니다
(`property_options_options_check`와 동일). 새 enum을 만든 직후에는 문제가 없지만, **항목 종류를 나중에 추가할 때**
아래처럼 갱신해야 합니다. 각자 DB에서 한 번씩 실행:

```sql
-- 항목 종류를 추가할 때 (예: 'ELEVATOR' 추가)
ALTER TABLE property_maintenance_items DROP CONSTRAINT property_maintenance_items_type_check;
ALTER TABLE property_maintenance_items ADD CONSTRAINT property_maintenance_items_type_check
  CHECK (type::text = ANY (ARRAY['INTERNET','WATER','ELECTRICITY','GAS','HEATING','CLEANING','SECURITY','PARKING','TV']::text[]));
```
