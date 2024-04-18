import { NextFunction, Request, Response } from "express";
import { HttpException } from "../interface/HttpException";
import { verify } from "jsonwebtoken";
import { IPayload } from "../interface/IPayload";

export async function authMiddleware(req: Request, res: Response, next: NextFunction,) {
    const authHeader:any = req.headers.authorization
    const [, token] = authHeader.split(' ')          
    try {
        const secretKey = process.env.TOKEN_SECRET_KEY
        if (!secretKey) {
            throw new HttpException(400,'No secret key')
        }
        const isVaule = verify(token, secretKey ) as IPayload        
    } catch (error: any) {
        if(error.message == 'invalid token') {
            return res.status(401).json({
                code: 'token.unauthorized',
                message: 'Unauthorized'
            })
        }
        if(error.message == 'invalid signature') {
            return res.status(401).json({
                code: 'token.unauthorized',
                message: 'Unauthorized'
            })
        }
        if(error.message == 'jwt expired') {
            return res.status(401).json({
                code: 'token.expired',
                message: 'token expired'
            })
        }
        if(error.message == 'jwt malformed') {
            return res.status(401).json({
                code: 'token',
                message: 'token is missing'
            })
        }
    }
    next()
}