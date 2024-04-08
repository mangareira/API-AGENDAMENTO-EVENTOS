import { NextFunction, Request, Response } from "express";
import { HttpException } from "../interface/HttpException";
import { verify } from "jsonwebtoken";
import { IPayload } from "../interface/IPayload";

export async function authMiddleware(req: Request, res: Response, next: NextFunction,) {
    const authHeader = req.headers.authorization
        if (!authHeader) {
            return res.status(401).json({
                code: 'token.missing',
                message: " token missing"
            })
        }
        const [, token] = authHeader.split(' ')

    try {
        const secretKey = process.env.TOKEN_SECRET_KEY
        if (!secretKey) {
            throw new HttpException(400,'No secret key')
        }
        verify(token, secretKey ) as IPayload
        
        return next()
    } catch (error) {
        return res.status(401).json({
            code: 'token.expired',
            message: 'token expired'
        })
    }

}