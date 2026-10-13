/**
 * 취득세 계산 (주택 매매·분양 등 유상취득, 주택 외 부동산 유상취득).
 *
 * 근거: 지방세법 제11조(세율), 제13조의2(다주택·법인 중과), 제151조(지방교육세),
 * 농어촌특별세법, 지방세특례제한법 제36조의3(생애최초 주택 구입 감면). 2026년 기준 세율.
 * 조정대상지역 지정과 세법은 바뀔 수 있으므로 신고 전에 위택스(wetax.go.kr)에서 최신 내용을 확인해야 한다.
 *
 * 금액: 취득가액은 만원, 결과 세액은 원. 세율은 %.
 * 포함하지 않는 것: 상속·증여·원시취득(신축), 농지, 분양권, 그 밖의 감면(신혼부부·다자녀 등).
 */
import { floorWon } from './calcFormat';

export type AcquisitionKind = 'HOUSE' | 'NON_HOUSE';

/** 취득 후 소유하게 되는 주택 수. 4는 4주택 이상 */
export type HouseCountAfter = 1 | 2 | 3 | 4;

/** 일반 세율(1~3%), 다주택 중과(8%·12%), 주택 외(4%) */
export type AcquisitionCategory = 'GENERAL' | 'HEAVY_8' | 'HEAVY_12' | 'NON_HOUSE';

export interface AcquisitionTaxInput {
  kind: AcquisitionKind;
  /** 취득가액 (만원) */
  price: number;
  /** 이 주택을 취득한 뒤 소유하게 되는 주택 수 */
  houseCountAfter: HouseCountAfter;
  /** 조정대상지역 주택인지 */
  adjustedArea: boolean;
  /** 법인이 취득하는지 */
  corporation: boolean;
  /** 일시적 2주택(종전 주택을 정해진 기간 안에 처분)인지 — 취득 후 2주택일 때만 의미가 있다 */
  temporaryTwoHouses: boolean;
  /** 전용면적 85㎡ 초과인지 (농어촌특별세 과세 기준) */
  over85: boolean;
  /** 생애최초 주택 구입 감면을 받으려는지 */
  firstTimeBuyer: boolean;
  /** 인구감소지역 주택인지 (생애최초 감면 한도가 커진다) */
  depopulationArea: boolean;
}

export interface AcquisitionTaxResult {
  category: AcquisitionCategory;
  /** 취득세율 (%) */
  acquisitionRate: number;
  /** 지방교육세율 (%) */
  localEducationRate: number;
  /** 농어촌특별세율 (%) */
  ruralSpecialRate: number;
  /** 감면 전 취득세 (원) */
  acquisitionTax: number;
  /** 생애최초 감면액 (원). 받지 못하면 0 */
  reduction: number;
  /** 감면을 신청했지만 받을 수 없는 이유. 해당 없으면 null */
  reductionBlockedReason: string | null;
  localEducationTax: number;
  ruralSpecialTax: number;
  /** 감면 후 납부할 세금 합계 (원) */
  total: number;
  /** 취득가액 대비 실제 부담률 (%) */
  effectiveRate: number;
  /** 어떤 규정이 적용됐는지 한 줄 설명 */
  reason: string;
}

/** 일반 세율 구간: 6억 이하 1%, 9억 초과 3% */
const GENERAL_LOW_LIMIT = 60000; // 만원
const GENERAL_HIGH_LIMIT = 90000;
const NON_HOUSE_RATE = 4;

const HEAVY_EDUCATION_RATE = 0.4;
const NON_HOUSE_EDUCATION_RATE = 0.4;

/** 농어촌특별세율: 85㎡ 초과 주택(또는 주택 외)에만 붙는다 */
const RURAL_SPECIAL_RATE: Record<AcquisitionCategory, number> = {
  GENERAL: 0.2,
  HEAVY_8: 0.6,
  HEAVY_12: 1.0,
  NON_HOUSE: 0.2,
};

/** 생애최초 주택 구입 감면 */
export const FIRST_HOME_PRICE_LIMIT = 120000; // 12억원 이하 (만원)
export const FIRST_HOME_REDUCTION_CAP = 2_000_000; // 200만원
export const FIRST_HOME_REDUCTION_CAP_DEPOPULATION = 3_000_000; // 인구감소지역 300만원

/** 신고·납부 기한(일): 잔금 납부일과 등기일 중 빠른 날부터 */
export const ACQUISITION_TAX_DEADLINE_DAYS = 60;

const round2 = (value: number) => Math.round(value * 100) / 100;
const round3 = (value: number) => Math.round(value * 1000) / 1000;

/** 주택 일반 세율. 6억 초과 9억 이하는 (취득가액(억) × 2/3 − 3)%로 1~3%를 비례 적용(소수 둘째 자리 반올림) */
export function generalHouseRate(price: number): number {
  if (price <= GENERAL_LOW_LIMIT) return 1;
  if (price > GENERAL_HIGH_LIMIT) return 3;
  return round2((price / 10000) * (2 / 3) - 3);
}

/** 주택 수·지역·법인 여부에 따른 세율 구분 */
export function houseCategory(input: AcquisitionTaxInput): { category: AcquisitionCategory; reason: string } {
  if (input.corporation) return { category: 'HEAVY_12', reason: '법인이 주택을 취득하면 12%가 적용돼요' };

  switch (input.houseCountAfter) {
    case 4:
      return { category: 'HEAVY_12', reason: '4주택 이상은 지역과 관계없이 12%가 적용돼요' };
    case 3:
      return input.adjustedArea
        ? { category: 'HEAVY_12', reason: '조정대상지역 3주택은 12%가 적용돼요' }
        : { category: 'HEAVY_8', reason: '비조정대상지역 3주택은 8%가 적용돼요' };
    case 2:
      if (input.adjustedArea && input.temporaryTwoHouses) {
        return { category: 'GENERAL', reason: '일시적 2주택이라 중과(8%)를 적용하지 않고 일반 세율(1~3%)이에요' };
      }
      return input.adjustedArea
        ? { category: 'HEAVY_8', reason: '조정대상지역 2주택은 8%가 적용돼요' }
        : { category: 'GENERAL', reason: '비조정대상지역 2주택은 중과 없이 일반 세율(1~3%)이에요' };
    default:
      return { category: 'GENERAL', reason: '1주택은 취득가액에 따라 1~3%의 일반 세율이에요' };
  }
}

function firstHomeReduction(
  input: AcquisitionTaxInput,
  category: AcquisitionCategory,
  acquisitionTax: number,
): { reduction: number; blockedReason: string | null } {
  if (!input.firstTimeBuyer) return { reduction: 0, blockedReason: null };

  if (input.kind !== 'HOUSE') return { reduction: 0, blockedReason: '생애최초 감면은 주택에만 적용돼요' };
  if (input.corporation) return { reduction: 0, blockedReason: '법인은 생애최초 감면을 받을 수 없어요' };
  if (input.houseCountAfter !== 1) return { reduction: 0, blockedReason: '생애최초 감면은 취득 후 1주택일 때만 받을 수 있어요' };
  if (category !== 'GENERAL') return { reduction: 0, blockedReason: '중과 대상에는 생애최초 감면을 적용할 수 없어요' };
  if (input.price > FIRST_HOME_PRICE_LIMIT) return { reduction: 0, blockedReason: '취득가액이 12억원을 넘으면 생애최초 감면을 받을 수 없어요' };

  const cap = input.depopulationArea ? FIRST_HOME_REDUCTION_CAP_DEPOPULATION : FIRST_HOME_REDUCTION_CAP;
  return { reduction: Math.min(acquisitionTax, cap), blockedReason: null };
}

export function calculateAcquisitionTax(input: AcquisitionTaxInput): AcquisitionTaxResult {
  let category: AcquisitionCategory;
  let acquisitionRate: number;
  let localEducationRate: number;
  let reason: string;

  if (input.kind === 'NON_HOUSE') {
    category = 'NON_HOUSE';
    acquisitionRate = NON_HOUSE_RATE;
    localEducationRate = NON_HOUSE_EDUCATION_RATE;
    reason = '주택 외 부동산(상가·토지·건물 등)은 4%가 적용돼요 (농지는 3%로 달라요)';
  } else {
    const decided = houseCategory(input);
    category = decided.category;
    reason = decided.reason;
    acquisitionRate = category === 'HEAVY_8' ? 8 : category === 'HEAVY_12' ? 12 : generalHouseRate(input.price);
    // 일반 세율은 취득세율의 10%, 중과는 0.4%
    localEducationRate = category === 'GENERAL' ? round3(acquisitionRate / 10) : HEAVY_EDUCATION_RATE;
  }

  // 주택은 전용 85㎡ 이하이면 농어촌특별세가 붙지 않는다. 주택 외는 항상 붙는다.
  const ruralSpecialRate = input.kind === 'HOUSE' && !input.over85 ? 0 : RURAL_SPECIAL_RATE[category];

  const base = input.price * 10000;
  const acquisitionTax = floorWon((base * acquisitionRate) / 100);
  const { reduction, blockedReason } = firstHomeReduction(input, category, acquisitionTax);
  const localEducationTax = floorWon((base * localEducationRate) / 100);
  const ruralSpecialTax = floorWon((base * ruralSpecialRate) / 100);
  const total = acquisitionTax - reduction + localEducationTax + ruralSpecialTax;

  return {
    category,
    acquisitionRate,
    localEducationRate,
    ruralSpecialRate,
    acquisitionTax,
    reduction,
    reductionBlockedReason: blockedReason,
    localEducationTax,
    ruralSpecialTax,
    total,
    effectiveRate: base > 0 ? (total / base) * 100 : 0,
    reason,
  };
}
