import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { validateEmpty } from '../middlewares/checkBody';
import { checkJwt } from '../middlewares/checkJwt';
import config from '../config/config';

const mockReq = (body?: any, headers?: any): Partial<Request> => ({
  body,
  headers: headers || {},
});

const mockRes = (): Partial<Response> & { locals: Record<string, any> } => {
  const res = { locals: {} } as Partial<Response> & { locals: Record<string, any> };
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

describe('validateEmpty middleware', () => {
  it('calls next when both username and password are present', () => {
    const req = mockReq({ username: 'alice', password: 'secret' });
    const res = mockRes();
    const next: NextFunction = jest.fn();

    validateEmpty(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 400 when body is undefined', () => {
    const req = mockReq(undefined);
    const res = mockRes();
    const next: NextFunction = jest.fn();

    validateEmpty(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 400 when username is missing', () => {
    const req = mockReq({ password: 'secret' });
    const res = mockRes();
    const next: NextFunction = jest.fn();

    validateEmpty(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 400 when password is missing', () => {
    const req = mockReq({ username: 'alice' });
    const res = mockRes();
    const next: NextFunction = jest.fn();

    validateEmpty(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('checkJwt middleware', () => {
  it('returns 401 when auth header is absent', () => {
    const req = mockReq({}, {});
    const res = mockRes();
    const next: NextFunction = jest.fn();

    checkJwt(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is invalid', () => {
    const req = mockReq({}, { auth: 'not.a.valid.token' });
    const res = mockRes();
    const next: NextFunction = jest.fn();

    checkJwt(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next and attaches jwtPayload when token is valid', () => {
    const token = jwt.sign(
      { userId: 1, username: 'alice' },
      config.jwtSecret,
      { expiresIn: '1h' },
    );
    const req = mockReq({}, { auth: token });
    const res = mockRes();
    const next: NextFunction = jest.fn();

    checkJwt(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.locals.jwtPayload).toBeDefined();
    expect(res.locals.jwtPayload.userId).toBe(1);
    expect(res.locals.jwtPayload.username).toBe('alice');
  });
});
