import axios from "axios"
import { agent } from "../infra/getCerts/certs"


export const authenticate = async ({clientId, clientSecret}: any): Promise<any> => {
    const credintial = Buffer.from(
        `${clientId}: ${clientSecret}`
    ).toString('base64')
    return axios({
        method: 'POST',
        url: `${process.env.GN_ENDPOINT}/${URL}`,
        httpsAgent: agent,
        headers: {
            Authorization: `Basic ${credintial}`,
            'Content-Type': 'application/json'
        },
        data: {
            grant_type: 'client_credentials'
        }
    }).then((response) => console.log(response.data))
}