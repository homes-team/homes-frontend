import axios from 'axios';
import { apiGet } from '../client';
import { uploadFileToS3 } from './presignedUpload';

vi.mock('../client', () => ({ apiGet: vi.fn() }));
vi.mock('axios', () => ({ default: { put: vi.fn() } }));

const file = new File(['x'], 'house.jpg', { type: 'image/jpeg' });

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(apiGet).mockResolvedValue({ uploadUrl: 'https://s3/upload', fileUrl: 'https://s3/file.jpg' });
  vi.mocked(axios.put).mockResolvedValue({});
});

describe('uploadFileToS3', () => {
  it('uses the authenticated properties endpoint for property photos', async () => {
    await expect(uploadFileToS3(file, { auth: true })).resolves.toBe('https://s3/file.jpg');

    expect(apiGet).toHaveBeenCalledWith('/properties/presigned-url?fileName=house.jpg', { auth: true });
  });

  it('uses the realtors endpoint with the verified email for realtor signup files', async () => {
    await uploadFileToS3(file, { email: 'realtor@homes.com' });

    expect(apiGet).toHaveBeenCalledWith('/realtors/presigned-url?fileName=house.jpg&email=realtor%40homes.com');
  });

  it('puts the file to the issued upload url', async () => {
    await uploadFileToS3(file, { auth: true });

    expect(axios.put).toHaveBeenCalledWith('https://s3/upload', file, expect.objectContaining({
      headers: { 'Content-Type': 'image/jpeg' },
    }));
  });
});
