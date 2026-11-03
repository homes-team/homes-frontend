import { parseIdentityRedirect } from './identityVerification';

describe('parseIdentityRedirect', () => {
  it('reads the id the verification redirected back with', () => {
    expect(parseIdentityRedirect('?identityVerificationId=abc&identityVerificationTxId=tx')).toEqual({
      status: 'success',
      identityVerificationId: 'abc',
    });
  });

  it('reports a failure when the redirect carries an error code', () => {
    expect(parseIdentityRedirect('?identityVerificationId=abc&code=FAILED&message=취소')).toEqual({
      status: 'failure',
      message: '취소',
    });
  });

  it('ignores addresses that are not coming back from a verification', () => {
    expect(parseIdentityRedirect('')).toBeNull();
    expect(parseIdentityRedirect('?tab=1')).toBeNull();
  });
});
