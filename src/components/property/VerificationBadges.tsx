import Badge from '../ui/Badge';

interface VerificationFlags {
  /** 등기부등본(집주인) 인증이 끝났는지. 값을 모르면 undefined/null */
  isOwnerVerified?: boolean | null;
  /** 중개사 현장 인증이 끝났는지. 값을 모르면 undefined/null */
  isRealtorVerified?: boolean | null;
}

/**
 * 매물 카드·상세에 붙이는 인증 마크. 등기부등본 인증과 중개사 현장 인증은 확인하는 대상이 달라서
 * 각각 따로 보여주고, 값이 true가 된 것만 마크가 붙는다.
 */
function VerificationBadges({ isOwnerVerified, isRealtorVerified }: VerificationFlags) {
  if (!isOwnerVerified && !isRealtorVerified) return null;

  return (
    <>
      {isOwnerVerified && <Badge variant="success">✓ 등기부 인증</Badge>}
      {isRealtorVerified && <Badge variant="success">✓ 현장 인증</Badge>}
    </>
  );
}

export default VerificationBadges;
