import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ApiError } from '../../../api/client';
import { PropertyStatus } from '../../../types/property';
import PropertyStatusManager from './PropertyStatusManager';

const updatePropertyStatus = vi.hoisted(() => vi.fn());
const navigate = vi.hoisted(() => vi.fn());

vi.mock('../../../api/property/propertyApi', () => ({ updatePropertyStatus }));
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}));

function renderManager(status: PropertyStatus, onChanged = vi.fn()) {
  render(<MemoryRouter><PropertyStatusManager propertyId={21} status={status} onChanged={onChanged} /></MemoryRouter>);
  return onChanged;
}

beforeEach(() => vi.clearAllMocks());

describe('PropertyStatusManager', () => {
  it('hides a listing and reports the new status', async () => {
    updatePropertyStatus.mockResolvedValue(undefined);
    const onChanged = renderManager('AVAILABLE');

    fireEvent.click(screen.getByRole('button', { name: '숨김' }));

    await waitFor(() => expect(onChanged).toHaveBeenCalledWith('HIDDEN'));
    expect(updatePropertyStatus).toHaveBeenCalledWith(21, 'HIDDEN');
    expect(await screen.findByText("'숨김' 상태로 바꿨어요.")).toBeInTheDocument();
  });

  it('asks for confirmation before marking a listing as completed', async () => {
    updatePropertyStatus.mockResolvedValue(undefined);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    const onChanged = renderManager('AVAILABLE');

    fireEvent.click(screen.getByRole('button', { name: '거래 완료' }));
    expect(updatePropertyStatus).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '거래 완료' }));
    await waitFor(() => expect(onChanged).toHaveBeenCalledWith('COMPLETED'));
    confirm.mockRestore();
  });

  it('does nothing when the current status is clicked again', () => {
    renderManager('HIDDEN');
    fireEvent.click(screen.getByRole('button', { name: '숨김' }));
    expect(updatePropertyStatus).not.toHaveBeenCalled();
  });

  it('shows the server error and keeps the old status when the change fails', async () => {
    updatePropertyStatus.mockRejectedValue(new ApiError('404', '요청에 실패했습니다. (404)'));
    const onChanged = renderManager('AVAILABLE');

    fireEvent.click(screen.getByRole('button', { name: '숨김' }));

    expect(await screen.findByText(/상태를 바꾸지 못했어요/)).toBeInTheDocument();
    expect(onChanged).not.toHaveBeenCalled();
  });

  it('locks the buttons while matched and links to the bids page', () => {
    renderManager('MATCHED');

    for (const name of ['광고 중', '거래 완료', '숨김']) {
      expect(screen.getByRole('button', { name })).toBeDisabled();
    }
    fireEvent.click(screen.getByRole('button', { name: '받은 입찰' }));
    expect(navigate).toHaveBeenCalledWith('/properties/21/bids');
  });
});
