import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Card from '../../../components/ui/Card';
import { HelperText } from '../../../components/ui/Field';
import { formatCostManwon, formatRate, formatWon, parseCalcNumber } from '../../../utils/calcFormat';
import {
  ACQUISITION_TAX_DEADLINE_DAYS,
  AcquisitionKind,
  calculateAcquisitionTax,
  FIRST_HOME_REDUCTION_CAP,
  FIRST_HOME_REDUCTION_CAP_DEPOPULATION,
  HouseCountAfter,
} from '../../../utils/acquisitionTax';
import { CALC_DISCLAIMER, CheckField, NumberField, ResultLine, ToggleGroup, Verdict } from './CalcFields';

const KINDS: ReadonlyArray<{ value: AcquisitionKind; label: string }> = [
  { value: 'HOUSE', label: '주택' },
  { value: 'NON_HOUSE', label: '주택 외 (상가·토지·건물)' },
];

const HOUSE_COUNTS: ReadonlyArray<{ value: `${HouseCountAfter}`; label: string }> = [
  { value: '1', label: '1주택' },
  { value: '2', label: '2주택' },
  { value: '3', label: '3주택' },
  { value: '4', label: '4주택 이상' },
];

const man = (cap: number) => formatCostManwon(cap / 10000);

/** 취득세 계산기 — 주택 매매·분양 등 유상취득과 주택 외 부동산 */
function AcquisitionTaxCalculator() {
  const [searchParams] = useSearchParams();

  const [kind, setKind] = useState<AcquisitionKind>('HOUSE');
  const [price, setPrice] = useState(searchParams.get('price') ?? '50000');
  const [houseCount, setHouseCount] = useState<`${HouseCountAfter}`>('1');
  const [adjustedArea, setAdjustedArea] = useState(false);
  const [temporaryTwoHouses, setTemporaryTwoHouses] = useState(false);
  const [corporation, setCorporation] = useState(false);
  const [over85, setOver85] = useState(false);
  const [firstTimeBuyer, setFirstTimeBuyer] = useState(false);
  const [depopulationArea, setDepopulationArea] = useState(false);

  const isHouse = kind === 'HOUSE';
  const count = Number(houseCount) as HouseCountAfter;

  const result = useMemo(
    () =>
      calculateAcquisitionTax({
        kind,
        price: parseCalcNumber(price, 0, 100_000_000),
        houseCountAfter: count,
        adjustedArea,
        corporation,
        temporaryTwoHouses,
        over85,
        firstTimeBuyer,
        depopulationArea,
      }),
    [kind, price, count, adjustedArea, corporation, temporaryTwoHouses, over85, firstTimeBuyer, depopulationArea],
  );

  const reduced = result.reduction > 0;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr]">
      <div className="flex flex-col gap-6">
        <Card className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <h2 className="text-base font-bold text-gray-900">부동산 종류</h2>
            <ToggleGroup label="부동산 종류" value={kind} options={KINDS} onChange={setKind} />
          </div>
          <NumberField id="acqPrice" label="취득가액 (매매가)" unit="만원" value={price} onChange={setPrice} />
        </Card>

        {isHouse && (
          <Card className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <h2 className="text-base font-bold text-gray-900">취득 후 보유 주택 수</h2>
              <ToggleGroup label="취득 후 보유 주택 수" value={houseCount} options={HOUSE_COUNTS} onChange={setHouseCount} />
              <HelperText>이번에 취득하는 주택을 포함한 수예요. 분양권·입주권도 주택 수에 포함될 수 있어요.</HelperText>
            </div>

            <div className="flex flex-col gap-3 border-t border-gray-100 pt-4">
              {count >= 2 && !corporation && (
                <CheckField id="adjustedArea" label="조정대상지역 주택이에요" checked={adjustedArea} onChange={setAdjustedArea} />
              )}
              {count === 2 && adjustedArea && !corporation && (
                <CheckField
                  id="temporaryTwoHouses"
                  label="일시적 2주택이에요 (종전 주택을 정해진 기간 안에 처분)"
                  checked={temporaryTwoHouses}
                  onChange={setTemporaryTwoHouses}
                />
              )}
              <CheckField id="corporation" label="법인이 취득해요" checked={corporation} onChange={setCorporation} />
              <CheckField id="over85" label="전용면적 85㎡ 초과예요" checked={over85} onChange={setOver85} />
            </div>

            {count === 1 && !corporation && (
              <div className="flex flex-col gap-3 border-t border-gray-100 pt-4">
                <CheckField id="firstTimeBuyer" label="생애최초 주택 구입이에요 (감면)" checked={firstTimeBuyer} onChange={setFirstTimeBuyer} />
                {firstTimeBuyer && (
                  <CheckField id="depopulationArea" label="인구감소지역 주택이에요" checked={depopulationArea} onChange={setDepopulationArea} />
                )}
              </div>
            )}
          </Card>
        )}
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <Card className="flex flex-col gap-5">
          <Verdict tone="primary">
            <p className="text-[13px] text-gray-600">납부할 세금 합계</p>
            <p className="text-2xl font-bold text-primary">{formatWon(result.total)}</p>
            <p className="mt-1 text-[13px] text-gray-600">취득가액의 {formatRate(result.effectiveRate)}%</p>
          </Verdict>

          <p className="rounded-lg bg-gray-50 p-3 text-[13px] text-gray-700">{result.reason}</p>

          <dl className="divide-y divide-gray-100">
            <ResultLine label={`취득세 (${formatRate(result.acquisitionRate)}%)`} value={formatWon(result.acquisitionTax)} />
            {reduced && <ResultLine label="생애최초 감면" value={`-${formatWon(result.reduction)}`} />}
            <ResultLine label={`지방교육세 (${formatRate(result.localEducationRate)}%)`} value={formatWon(result.localEducationTax)} />
            <ResultLine
              label={result.ruralSpecialRate > 0 ? `농어촌특별세 (${formatRate(result.ruralSpecialRate)}%)` : '농어촌특별세'}
              value={result.ruralSpecialRate > 0 ? formatWon(result.ruralSpecialTax) : '없음 (85㎡ 이하)'}
            />
            <ResultLine label="합계" value={formatWon(result.total)} strong />
          </dl>

          {result.reductionBlockedReason && (
            <p className="rounded-lg bg-warning-50 p-3 text-[13px] text-warning-dark" role="alert">
              {result.reductionBlockedReason}
            </p>
          )}
          {firstTimeBuyer && reduced && (
            <p className="text-xs text-gray-500">
              생애최초 감면은 취득세에서 최대 {man(depopulationArea ? FIRST_HOME_REDUCTION_CAP_DEPOPULATION : FIRST_HOME_REDUCTION_CAP)}
              까지(취득가액 12억원 이하)예요. 감면을 받으면 3년 안에 매각·증여하거나 다른 용도로 쓸 때 추징될 수 있고, 감면 시 농어촌특별세가
              달라질 수 있어요.
            </p>
          )}

          <div className="rounded-lg bg-gray-50 p-4 text-[13px] leading-relaxed text-gray-600">
            <p className="font-bold text-gray-900">알아두세요</p>
            <ul className="mt-1 list-disc pl-4">
              <li>
                잔금 납부일과 등기일 중 빠른 날부터 <strong>{ACQUISITION_TAX_DEADLINE_DAYS}일 안에</strong> 신고·납부해야 해요. 늦으면 가산세가 붙어요.
              </li>
              <li>주택은 6억원 이하 1%, 9억원 초과 3%, 그 사이는 1~3%를 비례해서 적용해요.</li>
              <li>상속·증여·신축(원시취득), 농지, 신혼부부·다자녀 등 다른 감면은 계산하지 않아요.</li>
              <li>실제 고지액은 10원 단위 절사 등으로 몇 원 다를 수 있어요.</li>
            </ul>
          </div>

          <p className="text-xs leading-relaxed text-gray-500">
            2026년 기준 세율이에요. 조정대상지역 지정과 세법은 바뀔 수 있으니{' '}
            <a href="https://www.wetax.go.kr" target="_blank" rel="noreferrer" className="font-bold text-primary underline">
              위택스
            </a>
            에서 최신 내용을 확인해주세요. {CALC_DISCLAIMER}
          </p>
        </Card>
      </div>
    </div>
  );
}

export default AcquisitionTaxCalculator;
