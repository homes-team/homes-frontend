/**
 * 매물 한 건의 중개보수 법정 상한 — 중개사가 입찰 수수료(%)를 정할 때 기준으로 삼는다.
 * 요율표와 계산은 brokerageFee.ts를 그대로 쓰고, 여기서는 매물 필드를 계산기 입력으로 옮기고
 * 중개사가 입력한 요율이 상한을 넘는지 판단하는 일만 한다.
 * 서울 요율표 기준이라 지역 조례에 따라 실제 상한은 다를 수 있다.
 */
import { PropertyType, TradeType } from '../types/property';
import { BrokerageDealType, BrokerageTarget, DEFAULT_VAT_RATE, calculateBrokerageFee } from './brokerageFee';
import { floorWon } from './calcFormat';

const DEAL_OF_TRADE: Record<TradeType, BrokerageDealType> = {
  SALE: 'SALE',
  JEONSE: 'JEONSE',
  MONTHLY_RENT: 'MONTHLY',
};

const CALCULATOR_TRADE_PARAM: Record<TradeType, string> = {
  SALE: 'sale',
  JEONSE: 'jeonse',
  MONTHLY_RENT: 'monthly',
};

function targetOf(propertyType: PropertyType): BrokerageTarget {
  if (propertyType === 'OFFICETEL') return 'OFFICETEL';
  if (propertyType === 'PRESALE') return 'PRESALE';
  return 'HOUSE';
}

/** 법정 상한 계산에 필요한 매물 정보 (PropertyDetail의 일부) */
export interface FeeCapSubject {
  tradeType: TradeType;
  propertyType: PropertyType;
  /** 만원. 월세는 보증금, 전세·매매는 가격 */
  deposit: number;
  /** 만원. 전세·매매는 0 */
  monthlyRent: number;
}

export interface LegalFeeCap {
  /** 요율을 적용하는 거래금액 (만원). 월세는 보증금 + 월세 환산 */
  tradeAmount: number;
  /** 요율표의 상한 요율 (%) */
  rate: number;
  /** 요율 구간의 한도액 (만원). 없으면 null */
  limit: number | null;
  /** 한도액 때문에 요율 × 거래금액보다 상한이 줄었는지 */
  limited: boolean;
  /** 이 매물에서 받을 수 있는 최대 중개보수 (원, 부가세 별도) */
  maxFee: number;
  /** 한도액까지 반영한 실질 최대 요율 (%, 소수 둘째 자리 내림) */
  effectiveRate: number;
  /** 분양권: 프리미엄을 알 수 없어 불입금액만으로 계산했다 */
  presale: boolean;
}

/** 거래금액이 0이어서 상한을 구할 수 없으면 null */
export function legalFeeCap(subject: FeeCapSubject): LegalFeeCap | null {
  const result = calculateBrokerageFee({
    deal: DEAL_OF_TRADE[subject.tradeType],
    target: targetOf(subject.propertyType),
    price: subject.deposit,
    monthlyRent: subject.tradeType === 'MONTHLY_RENT' ? subject.monthlyRent : 0,
    premium: 0,
    customRate: null,
    vatRate: DEFAULT_VAT_RATE,
  });
  if (result.tradeAmount <= 0) return null;

  const rawEffectiveRate = (result.fee / (result.tradeAmount * 10000)) * 100;
  return {
    tradeAmount: result.tradeAmount,
    rate: result.rate,
    limit: result.limit,
    limited: result.limited,
    maxFee: result.fee,
    effectiveRate: Math.floor(rawEffectiveRate * 100 + 1e-6) / 100,
    presale: subject.propertyType === 'PRESALE',
  };
}

export interface ProposedFeeCheck {
  /** 입력한 요율로 계산한 중개보수 (원, 부가세 별도) */
  amount: number;
  /** 법정 상한을 넘는지 */
  exceeds: boolean;
}

/** 중개사가 제안한 요율(%)이 법정 상한 안인지 확인한다 */
export function checkProposedRate(cap: LegalFeeCap, proposedRate: number): ProposedFeeCheck {
  const amount = floorWon((cap.tradeAmount * 10000 * proposedRate) / 100);
  return { amount, exceeds: amount > cap.maxFee };
}

/** 이 매물의 값을 미리 채워 열어 주는 중개보수 계산기 경로 */
export function commissionCalculatorPath(subject: FeeCapSubject): string {
  const rent = subject.tradeType === 'MONTHLY_RENT' ? `&rent=${subject.monthlyRent}` : '';
  return `/calculator?tab=commission&trade=${CALCULATOR_TRADE_PARAM[subject.tradeType]}&price=${subject.deposit}${rent}`;
}
