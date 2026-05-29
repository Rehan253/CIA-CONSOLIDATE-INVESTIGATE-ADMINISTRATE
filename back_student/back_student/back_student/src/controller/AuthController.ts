import * as crypto from 'crypto';
import {validate} from 'class-validator';
import {Request, Response} from 'express';
import * as jwt from 'jsonwebtoken';
import {getRepository} from 'typeorm';
import config from '../config/config';
import {User} from '../entity/User';
import {RefreshToken} from '../entity/RefreshToken';

class AuthController {

  public static register = async (req: Request, res: Response) => {
    const {username, password} = req.body;

    // username/email: must be present and between 4-100 characters
    if (!username || username.length < 4 || username.length > 100) {
      res.status(400).send('username must be at least 4 characters');
      return;
    }

    // password: min 8 chars, at least one uppercase, one lowercase, one number
    if (!password || password.length < 8) {
      res.status(400).send('password must be at least 8 characters');
      return;
    }
    if (!/(?=.*[a-z])/.test(password)) {
      res.status(400).send('password must contain at least one lowercase letter');
      return;
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      res.status(400).send('password must contain at least one uppercase letter');
      return;
    }
    if (!/(?=.*\d)/.test(password)) {
      res.status(400).send('password must contain at least one number');
      return;
    }

    const user = new User();
    user.username = username;
    user.password = password;
    user.role = "NORMAL";

    user.hashPassword();

    // Try to save. If fails, the username is already in use
    const userRepository = getRepository(User);
    try {
      await userRepository.save(user);
    } catch (e) {
      res.status(409).send('username already in use');
      return;
    }

    // If all ok, send 201 response
    res.status(201).send('User created');
  };

  public static login = async (req: Request, res: Response) => {
    const {username, password} = req.body;
    if (!(username && password)) {
      res.status(400).send('Body was empty');
      return;
    }
    // Get user from database
    const userRepository = getRepository(User);
    let user: User;
    try {
      user = await userRepository.findOneOrFail({
        where: {username},
      });
    } catch (error) {
      res.status(401).send('username or password incorrect');
      return;
    }
    // Check if encrypted password match
    if (!user.checkIfUnencryptedPasswordIsValid(password)) {
      res.status(401).send('username or password incorrect');
      return;
    }

    // access token is short lived — 15 minutes
    const accessToken = jwt.sign(
      {userId: user.id, username: user.username},
      config.jwtSecret,
      {expiresIn: '15m'},
    );

    // refresh token is a random string stored in the database — valid for 7 days
    const refreshTokenValue = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const refreshTokenRepo = getRepository(RefreshToken);
    const refreshToken = new RefreshToken();
    refreshToken.token = refreshTokenValue;
    refreshToken.userId = user.id;
    refreshToken.expiresAt = expiresAt;
    await refreshTokenRepo.save(refreshToken);

    res.send({ token: accessToken, accessToken, refreshToken: refreshTokenValue });
  };

  public static refresh = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).send('Refresh token required');
      return;
    }

    const refreshTokenRepo = getRepository(RefreshToken);
    let storedToken: RefreshToken;
    try {
      storedToken = await refreshTokenRepo.findOneOrFail({ where: { token: refreshToken } });
    } catch (e) {
      res.status(401).send('Invalid refresh token');
      return;
    }

    if (storedToken.expiresAt < new Date()) {
      await refreshTokenRepo.delete(storedToken.id);
      res.status(401).send('Refresh token expired, please login again');
      return;
    }

    const userRepository = getRepository(User);
    let user: User;
    try {
      user = await userRepository.findOneOrFail(storedToken.userId);
    } catch (e) {
      res.status(401).send('User not found');
      return;
    }

    const accessToken = jwt.sign(
      {userId: user.id, username: user.username},
      config.jwtSecret,
      {expiresIn: '15m'},
    );

    res.send({ accessToken });
  };

  public static logout = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).send('Refresh token required');
      return;
    }

    const refreshTokenRepo = getRepository(RefreshToken);
    await refreshTokenRepo.delete({ token: refreshToken });

    res.status(204).send();
  };

  public static getMe = async (_req: Request, res: Response) => {
    const userRepository = getRepository(User);
    let user: User;
    try {
      user = await userRepository.findOneOrFail({
        select: ['id', 'username', 'role'],
        where: {id: res.locals.jwtPayload.userId},
      });
      res.send({user});
    } catch (error) {
      res.status(404).send('User not found');
      return;
    }
  };

  public static changePassword = async (req: Request, res: Response) => {
    // Get ID from JWT
    const id = res.locals.jwtPayload.userId;

    // Get parameters from the body
    const {oldPassword, newPassword} = req.body;
    if (!(oldPassword && newPassword)) {
      res.status(400).send();
      return;
    }

    // Get user from the database
    const userRepository = getRepository(User);
    let user: User;
    try {
      user = await userRepository.findOneOrFail(id);
    } catch (id) {
      res.status(401).send();
      return;
    }

    // Check if old password matchs
    if (!user.checkIfUnencryptedPasswordIsValid(oldPassword)) {
      res.status(401).send();
      return;
    }

    // Validate de model (password lenght)
    user.password = newPassword;
    const errors = await validate(user);
    if (errors.length > 0) {
      res.status(400).send(errors);
      return;
    }
    // Hash the new password and save
    user.hashPassword();
    await userRepository.save(user);

    res.status(204).send();
  };
}
export default AuthController;
