import axios from "axios"
import { agent } from "../infra/getCerts/certs"


export const authenticate = async ({clientId, clientSecret}: any): Promise<any> => {
    
    const credintial = Buffer.from(
        `${clientId}:${clientSecret}`
    ).toString('base64')   
   
    
    return axios({
        method: 'POST',
        url: `${process.env.GN_ENDPOINT}/oauth/token`,
        headers: {
          Authorization: `Basic ` + credintial,
          "Content-Type": "application/json"
        },
        httpsAgent: agent,
        data:{ grant_type: "client_credentials" }
      })
      .catch(function (error) {
        console.log(error);
      })
}