import { resolveCorsOrigins } from './cors.util';

describe('resolveCorsOrigins', () => {
  it('defaults to localhost:5173 when unset outside production', () => {
    expect(resolveCorsOrigins(undefined, 'development')).toEqual([
      'http://localhost:5173',
    ]);
  });

  it('parses a comma-separated list and trims spaces', () => {
    expect(
      resolveCorsOrigins(
        ' http://localhost:5173 , https://mpp-smau.fcpn.edu.bo ',
        'development',
      ),
    ).toEqual(['http://localhost:5173', 'https://mpp-smau.fcpn.edu.bo']);
  });

  it('throws in production when unset', () => {
    expect(() => resolveCorsOrigins(undefined, 'production')).toThrow(
      /CORS_ORIGIN/,
    );
  });

  it('throws in production when list includes *', () => {
    expect(() =>
      resolveCorsOrigins('https://mpp-smau.fcpn.edu.bo,*', 'production'),
    ).toThrow(/CORS_ORIGIN/);
  });

  it('allows explicit origins in production', () => {
    expect(
      resolveCorsOrigins('https://mpp-smau.fcpn.edu.bo', 'production'),
    ).toEqual(['https://mpp-smau.fcpn.edu.bo']);
  });
});
