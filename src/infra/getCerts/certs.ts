import fs from 'fs'
import path from 'path'
import https from 'https'
require('dotenv').config()

export const certs = fs.readFileSync(
    path.resolve(__dirname, `../../../certs/${process.env.GN_CERT}`)
)
console.log('certs loaded');
export const agent = new https.Agent({
    pfx: certs,
    passphrase: ''
})