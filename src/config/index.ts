import axios from "axios";
import { agent } from "../infra/getCerts/certs";
import { authenticate } from "../Auth";

export const API = async  (credintial: any) =>{

    
    const authResponse = await authenticate(credintial)    
    
    const accessToken = await authResponse.data?.access_token    
    
    const post = axios.create({
        baseURL: process.env.GN_ENDPOINT,
        httpsAgent: agent,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    })
    
    return post
}