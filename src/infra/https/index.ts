import fs from 'fs'
import https from 'https'
import express from 'express'
import path from 'path'

const app = express()
const httpsOptions:any = {
    ca: fs.readFileSync(path.resolve(__dirname, `../../../certs/chain-pix-prod.crt`)),
    minVersion: "TLSv1.2",
    requestCert: true,
    rejectUnauthorized: true,
}
export const httpsServer = https.createServer(httpsOptions,app )