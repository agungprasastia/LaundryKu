import axios, { AxiosHeaders } from 'axios';
import { getErrorMessage } from '@/utils/getErrorMessage';

describe('getErrorMessage', () => {
  it('reads backend message from Axios errors', () => {
    const error = new axios.AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
      data: { success: false, message: 'Backend says no' },
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: { headers: new AxiosHeaders() },
    });

    expect(getErrorMessage(error)).toBe('Backend says no');
  });

  it('uses Error.message for normal errors', () => {
    expect(getErrorMessage(new Error('Local error'))).toBe('Local error');
  });

  it('uses fallback for unknown values', () => {
    expect(getErrorMessage('oops', 'Fallback')).toBe('Fallback');
  });
});

