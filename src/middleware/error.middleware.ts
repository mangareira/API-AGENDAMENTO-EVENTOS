import { NextFunction, Request, Response } from "express"
import { HttpException } from "../interface/HttpException"

export function errorMiddleware(err: HttpException, req: Request, res: Response, next: NextFunction) {
    const status: number = err.status ?? 500
    const message: string = err.message ?? 'Intenal server error'

    res.status(status).json({
        status,
        message
    })
}