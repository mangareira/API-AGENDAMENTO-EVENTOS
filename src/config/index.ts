import axios from "axios";
require("dotenv").config()

export const API = async  () =>{

    const api = axios.create({
        baseURL: process.env.ASAAS_ENDPOIT,
        headers: {
            "access_token": process.env.ASAAS_TOKEN,
            'Content-Type': 'application/json'
        }
    })
    
    return api
}