import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtVerifyOptions } from '@nestjs/jwt';
import { ActivationDto, ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from './dto/user.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { EmailService } from './email/email.service';
import { TokenSender } from './utils/sendToken';
import { User } from './entities/user.entities';
interface UserData {
  name: string;
  email: string;
  password: string;
  phone_number: number;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly mailService: EmailService,
  ) { }

  async register(registerDto: RegisterDto, response: Response) {
    const { name, email, password, phone_number, address } = registerDto;
    console.log(registerDto);
    const isEmailExisted = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    const isPhoneNumberExisted = await this.prisma.user.findUnique({
      where: {
        phone_number,
      },
    });

    if (isEmailExisted) {
      throw new BadRequestException('This email has already in used');
    }

    if (isPhoneNumberExisted) {
      throw new BadRequestException('This phone number has already in used');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      name,
      email,
      password: hashedPassword,
      phone_number,
      address,
    };

    console.log(user)

    const activationToken = await this.CreateActivationToken(user);
    const activationCode = activationToken.activationCode;
    const activation_token = activationToken.token;
    // after this , we need to sent OTP to email
    // use MaiLService to achieve

    await this.mailService.sendMail({
      email,
      subject: 'Activate your user account',
      template: './activation-mail',
      name,
      activationCode,
    })


    return { activation_token, response };
  }

  // Create activation token

  async CreateActivationToken(user: UserData) {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

    const token = this.jwtService.sign(
      {
        user,
        activationCode,
      },
      {
        secret: this.configService.get<string>('ACTIVATION_SECRET'),
        expiresIn: '5m',
      },
    );

    return { token, activationCode };
  }


  // Activation service

  async activationUser(activationDto: ActivationDto, response: Response) {
    const { activationCode, activationToken } = activationDto;
    const newUser: { user: UserData, activationCode: string } = this.jwtService.verify(
      activationToken,
      { secret: this.configService.get<string>('ACTIVATION_SECRET'), } as JwtVerifyOptions) as { user: UserData, activationCode: string }

    if (newUser.activationCode !== activationCode) {
      throw new BadRequestException('Invalid activation code')
    }

    const { name, email, password, phone_number } = newUser.user;

    const existedUser = await this.prisma.user.findUnique({
      where: {
        email,
      }
    });

    if (existedUser) {
      throw new BadRequestException('User already existed with this email');

    }

    try {
      const user = await this.prisma.user.create({
        data: {
          name,
          email,
          password,
          phone_number,
        },
      });
      console.log("User created successfully");
      return { user, response };
    } catch (error) {
      console.error("Error creating user:", error);
      // Handle error appropriately, such as throwing an exception or returning a default user object
      throw new InternalServerErrorException('Failed to create user');
    }
  }


  async login(logindto: LoginDto) {
    const { email, password } = logindto;
    const user = await this.prisma.user.findUnique({
      where: {
        email
      }
    });



    if (user && (await this.comparePassword(password, user.password))) {
      const tokenSender = new TokenSender(this.configService, this.jwtService)
      return tokenSender.sendToken(user);

    }
    else {
      return {
        user: null,
        accessToken: null,
        refreshToken: null,
        error: {
          message: 'Invalid email or password',
        },
      }
    }
  }

  async getLoginUser(req: any) {
    const user = req.user;
    const refreshToken = req.refreshtoken;
    const accessToken = req.accesstoken;
    console.log("🚀 ~ UsersService ~ getLoginUser ~ {user,accessToken,refreshToken}:", { user, accessToken, refreshToken })
    return { user, accessToken, refreshToken };



  }

  async getUsers() {
    return this.prisma.user.findMany({});
  }

  async Logout(req: any) {
    req.user = null;
    req.accessToken = null;
    req.refreshToken = null;

    return { message: 'Logout Succesful' };

  }

  // compare hashed password to the user.password
  async comparePassword(password: string, hashedPassword: string): Promise<Boolean> {

    return await bcrypt.compare(password, hashedPassword)
  }


  async generateForgotPasswordLink(user: User) {
    const forgotPasswordToken = this.jwtService.sign(
      { user },
      {
        secret: this.configService.get<string>('FORGOT_PASSWORD_SECRET'),
        expiresIn: '5m',
      },

    );
    return forgotPasswordToken;
  }


  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    const user = await this.prisma.user.findUnique({
      where: {
        email
      }
    });

    if (!user) {
      throw new BadRequestException("User not found with this email");

    }

    const forgotPasswordToken = await this.generateForgotPasswordLink(user);
    const resetPasswordURL = this.configService.get<string>('CLIENT_SIDE_URI') + `/reset-password?verify=${forgotPasswordToken}`;

    await this.mailService.sendMail({
      email,
      subject: 'Reset your Password!',
      template: './forgot-password',
      name: user.name,
      activationCode: resetPasswordURL,
    });

    return { message: `Your forgot password request succesful!` };
  }


  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { password, activationToken } = resetPasswordDto;
    const decoded = await this.jwtService.decode(activationToken);

    if (!decoded || decoded?.exp * 1000 < Date.now()) {
      throw new BadRequestException('Invalid token!');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.update({
      where: {
        id: decoded.user.id,
      },
      data: {
        password: hashedPassword,
      },
    });

    return { user };
  }

}


