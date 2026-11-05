interface VerificationNoticeProps {
  /** false면 아직 인증 전. 값을 아직 모르면 null이라 아무것도 보여주지 않는다 */
  isOwnerVerified: boolean | null;
  isRealtorVerified: boolean | null;
}

/** 인증이 안 된 매물을 보는 사람에게 어떤 인증이 아직인지 알려준다 */
function VerificationNotice({ isOwnerVerified, isRealtorVerified }: VerificationNoticeProps) {
  const messages = [
    isOwnerVerified === false && '아직 등기부등본 인증이 안 된 매물이에요!',
    isRealtorVerified === false && '중개사 현장 인증이 안 된 매물이에요!',
  ].filter((message): message is string => Boolean(message));

  if (messages.length === 0) return null;

  return (
    <ul className="flex flex-col gap-1.5 rounded-card bg-warning-50 px-4 py-3 text-[13px] font-medium text-warning-dark" aria-label="인증 안내">
      {messages.map((message) => (
        <li key={message}>⚠️ {message}</li>
      ))}
    </ul>
  );
}

export default VerificationNotice;
