import axios from "axios";
import { Event } from "../entities/Events";
import { HttpException } from "../interface/HttpException";
import { EventRepository } from "../repositories/Event/EventRepository";
import { UserRepositoryMongoose } from "../repositories/User/UserRepositoryMongoose";
import { IFilterProps } from "../interface/IFilter";
import { API } from "../config";
import { User } from "../entities/User";
import { UserAccountRepositoryMongoose } from "../repositories/UserAccount/UserAccountRepositorymoongose";
import { UserAccount } from "../entities/UserAccount";
import { compare, hash } from "bcrypt";
import { sign, verify } from "jsonwebtoken";
import { IExport } from "../interface/IExport";
import path from 'path';
import excel from 'xlsx';
import crypto from 'node:crypto';
import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib";
import nodemailer, { SentMessageInfo } from 'nodemailer';
import fs from 'fs';
import { Document, HeadingLevel, ImageRun, Packer, Paragraph, Table, TableCell, TableRow, TextDirection, TextRun, VerticalAlign, WidthType } from "docx";
import QRCode from 'qrcode'

export class EventUseCase {
    constructor(private eventRepository: EventRepository) {}
    
    

    async create(eventData: Event) {
        
        if (!eventData.banner) {
            throw new HttpException(400, 'Banner is required');
          }
        if (!eventData.date) throw new HttpException(400, 'Date is required');

        const verifyEvent = await this.eventRepository.findByLocationAndDate(eventData.location, eventData.date)

        if (verifyEvent) throw new HttpException(400, 'Event already exists');
        
        const cityName = await this.getCityNameCoordinates(eventData.location.latitude, eventData.location.longitude)
        eventData = {
            ...eventData,
            city: cityName.cityName,
            formattedAddress: cityName.formattedAddress
        }
        const result = await this.eventRepository.add(eventData)
        return result
    }

    async findEventByLocation(latitude: string, longitude: string) {
        const cityName = await this.getCityNameCoordinates(latitude, longitude)
        
        const findEventsByCity = await this.eventRepository.findEventsByCity(cityName.cityName)

        const eventWithRadius = findEventsByCity.filter(event => {
            const distance = this.calculteDistance(
                Number(latitude),
                Number(longitude),
                Number(event.location.latitude),
                Number(event.location.longitude)
            )
            return distance <= 50
        })
        return eventWithRadius
    }

    async findEventByCategory(category: string) {
        if(!category) {
            throw new HttpException(400, 'Category is required')
        }
        const events = await this.eventRepository.findEventsByCategory(category)
        return events
    }

    async findEventByName(name: string) {
        if(!name) {
            throw new HttpException(400, 'Name is required')
        }
        const events = await this.eventRepository.findEventsByName(name)
        
        return events
    }

    async findEventById(id: string) {
        if(!id) {
            throw new HttpException(400, 'Id is required')
        }
        const events = await this.eventRepository.findEventsById(id)
        
        return events
    }

    async addParticipant(id: string, participant: User, paymentAmount: string) {
        const userAccountRepository = new UserAccountRepositoryMongoose()
        const userRepository = new UserRepositoryMongoose()
        const event = await this.eventRepository.findEventsById(id)
        const userAccount = await userAccountRepository.findUserById(participant.userId)
        if(event?.participants.length == event?.limit) {
            throw new HttpException(400, "Sem vagas para este evento")
        }
        if(event?.participants.includes(`${participant._id}`)) {
            throw new HttpException(400, "já esta inscrito no evento")
        }
        if(!event) {
            throw  new HttpException(400, 'Event not found')
        }
        if(!userAccount) {
            throw  new HttpException(400, 'User not found')
        }
        const user_id:any = participant.userId
        if(event.participants.includes(user_id)){
            throw new HttpException(400, 'Usuario ja esta escrito no evento')
        }
        let user:any = {}                        
        if(paymentAmount === '') {
            participant.payment = {
                    status: 'gratis', 
                    txid: '', 
                    valor: '',
                    qrCode:'',
                    pixCopiaECola: '',
                    expirationTime: ''
            }
        } else {
            const paymentPix =  await this.payment(paymentAmount, userAccount)
            participant.payment = {
                    status: 'Pendente', 
                    txid: paymentPix.response.data.id, 
                    valor: paymentAmount,
                    qrCode:paymentPix.qrcode.data.encodedImage,
                    pixCopiaECola: paymentPix.qrcode.data.payload,
                    expirationTime: String(paymentPix.qrcode.data.expirationDate)
            }
        }
        const slug = this.generateRandomId(8)
        participant.slug = slug
        user = await userRepository.add(participant)            
        
        const getPayment:any = await userRepository.findUser(user.userId) 
        
        if(!getPayment) throw new HttpException(400, "não existe este usuario")               
        event.participants.push(user.userId)
        userAccount.eventos.push(getPayment._id)
        
        const updateUser = await userAccountRepository.update(userAccount, user.userId)
        const updateEvent = await this.eventRepository.update(event, id)
        return {participantId: participant.userId}
    }

    async findEventsMain() {
        const events = await this.eventRepository.findEventsMain(new Date());
    
        return events;
    }

    async filterEvents({
        latitude,
        longitude,
        name,
        date,
        category,
        radius,
        //price,
      }: IFilterProps) {
        if(!date) return []
        const events = await this.eventRepository.findEventsByFilter({
            latitude,
            longitude,
            name,
            date,
            category,
            radius,
            //price,
          })                    
        return events
    }

    async comfirmPayment(id: string) {
        const userRepository = new UserRepositoryMongoose()
        const findParticipant = await userRepository.findUser(id)
        if(findParticipant) {
            return findParticipant
        } else {
            throw new HttpException(400, 'O usuario não esta escrito em nenhum evento')
        }

    }

    async CreateAccount(userAccount: UserAccount) {
        if (!userAccount.name) {
            throw new HttpException(400, 'Name is required');
          }
        if (!userAccount.email) throw new HttpException(400, 'Email is required');
        if (!userAccount.cpf) throw new HttpException(400, 'Cpf is required');
        if (!userAccount.password) throw new HttpException(400, 'Password is required');
        const userAccountRepository = new UserAccountRepositoryMongoose()
        const verifyIsUserExists = await userAccountRepository.findUser(userAccount.email)
        if(verifyIsUserExists) {
            throw new HttpException(400, 'User already Exists')
        }
        const passwordCrypted = await hash(userAccount.password, 10)
        const result = await userAccountRepository.add({...userAccount, password: passwordCrypted})
        return result
    }

    async login(email: string, password:string) {
        const userAccountRepository = new UserAccountRepositoryMongoose()
        const user:any = await userAccountRepository.findUser(email)
        if(!user) {
            throw new HttpException(400, 'usuario não existe')
        }
        const isValue = await compare(password, user.password)        
        if(isValue === false) {
            throw new HttpException(400, 'Senha incorreta')
        }
        const tokens = await this.token(user._id)
        return tokens
    }

    async refreshToken(refreshToken: string) {
        const secret = process.env.TOKEN_SECRET_KEY
        const [, token] = refreshToken.split(" ")
        if(!secret) {
            throw new HttpException(400, 'Key is not provider')
        }
        const {userId}:any = verify(token, secret)
        const newToken = sign({userId}, secret, {expiresIn: '1d'})
        const newRefreshToken = sign({userId}, secret, {expiresIn: '7d'})
        return {
            access_token: newToken,
            access_refresh_token: newRefreshToken
        }
    }

    async getUserRole (id: string) {                        
        const userAccountRepository = new UserAccountRepositoryMongoose()
        const user = await userAccountRepository.findUserById(id)
        if(!user) throw new HttpException(400, "user mo exists")
        return user.role
    }

    async webhook (data: any) {        
        const userevent = new UserRepositoryMongoose()
        if(data.event === "PAYMENT_RECEIVED"){
            const result  = await userevent.findTxid(data.payment.id)
            if(!result) throw new HttpException(400, "Payment not found")
        }
        if(data.event === "PAYMENT_OVERDUE") {
            const result = await userevent.deletePayWebHook(data.payment.id)
        }
        return {recive: true}
    }
    
    async getPartDetails(id: string) {
        const userRepository = new UserRepositoryMongoose()
        const event = userRepository.findEvent(id)
        if(!event) throw new HttpException(400, 'Usuario não existe')
        return event
    }

    async getPartEvents(id: string, page: number, limit: number) {
        const event = await this.eventRepository.findEventsByUserId(id, page, limit)
        return event
    }

    async getEventPay(id: string, userId: any) {
        const userRepository = new UserRepositoryMongoose()
        const findPay = userRepository.findPay(id, userId)
        return findPay
         
    }

    async newPix(txid: string) {
        const userRepository = new UserRepositoryMongoose()
        const userAccountRepository = new UserAccountRepositoryMongoose()
        const isExists = await userRepository.findPayByTxid(txid)
        if(!isExists) throw new HttpException(400, 'This payment not exists')
        const user = await userAccountRepository.findUserById(isExists.userId)
        if(!user) throw new HttpException(400, "Usuario não encotrado")
        const newValue = (isExists.payment.valor.split(','))[0] + '.' +(isExists.payment.valor.split(','))[1] 
        const newPix  = await this.updatePix(newValue, user, txid)
        const update = await userRepository.updateUser(newPix.response.data, newPix.qrcode.data,txid)
        return update
        
    }

    async getPay(txid: string) {
        const userRepository = new UserRepositoryMongoose()
        const isExists = userRepository.findPayByTxid(txid)
        return isExists
    }

    async getParticipants(q?: string, page?: number) {
        const userAccountRepository = new UserAccountRepositoryMongoose()
        const result = await userAccountRepository.findUsers(q, page)
        return result
    }

    async getParticipant(id: string) {
        const userAccountRepository = new UserAccountRepositoryMongoose()
        const user = await userAccountRepository.findUserById(id)
        if(!user) throw new HttpException(400, "User not exists")
        return user
    }

    async findEvents(q?: string, page?: number) {
        const result = await this.eventRepository.findEvents(q, page)
        return result
    }

    async deleteUser(id: string) {
        const userAccountRepository = new UserAccountRepositoryMongoose()
        const isDelete = await userAccountRepository.delete(id)
        if(!isDelete) return new HttpException(400, "User not exists")
    } 

    async updateUser(user: UserAccount, userId: string) {
        const userAccountRepository = new UserAccountRepositoryMongoose()
        if(user.password && user.password !== (await userAccountRepository.findUserById(userId))?.password) {
            const hashPassword  = await hash(user.password, 10)
            const isExists = await userAccountRepository.updateUser({...user, password: hashPassword}, userId)
            return isExists
        }
        const isExists = await userAccountRepository.updateUser(user, userId)
        if(!isExists) throw new HttpException(400, "User not Exists")
        return isExists
    }
    
    async updateEvent(events: Event, eventId: string) {
        const isExists = await this.eventRepository.updateEvent(events, eventId)
        if(!isExists) throw new HttpException(400, "Event not exists")
        return isExists 
    }

    async deleteEvent(id: string) {
        const result  = await this.eventRepository.delete(id)
        return result
    }

    async getUserEvents(q?: string, page?: number,id?: string) {
        const event = await this.eventRepository.findUserEvents(q,page, id)
        return event
    }

    async cancelledSub(eventId: string | any, userId: string | any) {
        const userAccountRepository = new UserAccountRepositoryMongoose()
        const userRepository = new UserRepositoryMongoose()
        const isExists = await userAccountRepository.findUserById(userId)
        if(!isExists) throw new HttpException(400, "User not Exists")
        const isEventExists = await this.eventRepository.findEventsById(eventId)
        if(!isEventExists) throw new HttpException(400, "Event not exists")
        const isExistsPay = await userRepository.findPay(eventId, userId)
        if(!isExistsPay) throw new HttpException(400, "User is not subscribe in event")
        const deleteEventFromUser = await userAccountRepository.deleteEvent(isExistsPay._id, userId)
        const deletePay = await userRepository.deletePay(eventId, userId)
        const deleteUserFromEvent = await this.eventRepository.deleteUser(userId, eventId)
        return
    }

    async findEventsUsers(id: string,page: number, q?: string) {
        let users: UserAccount[] = []
        const event = await this.eventRepository.findEventsById(id)
        if (event && event.participants) {
            await Promise.all(event.participants.map(async (userId) => {
                const result = await this.findUserByIdInEvent(userId)
                if(result) {
                    const user: UserAccount = {
                        name: result.name,
                        email: result.email,
                        eventos: result.eventos,
                        role: result.role,
                        _id: result._id,
                        createdAt: result.createdAt
                    }
                    users.push(user)
                }
            }))
        }
        if (q) {
            users = users.filter(user => user.name.toLowerCase().includes(q.toLowerCase()));
        }
        const count = users.length;
        const limit = 6
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedUsers = users.slice(startIndex, endIndex);
        return {
            users: paginatedUsers,
            count,
            event
        }
    }

    async addPartWithEmail(email: string, eventId: string, tickets: string, discount: string) {
        const userAccountRepository = new UserAccountRepositoryMongoose()
        const userRepository = new UserRepositoryMongoose()
        const event = await this.eventRepository.findEventsById(eventId)
        const userAccount = await userAccountRepository.findUser(email)
        if(!event) {
            throw  new HttpException(400, 'Event not found')
        }
        if(!userAccount) {
            throw  new HttpException(400, 'User not found')
        }
        const user_id:any = userAccount._id
        if(event.participants.includes(user_id)){
            throw new HttpException(400, 'Usuario ja esta escrito no evento')
        }
        let user:any = {}
        let userPay:any = {}
        userPay = {
            tickets,
            discount,
            eventId,
            userId: user_id
        }                 
        if(event.price[0].amount == "" || discount === "Discount") {
            userPay.payment = {
                status: 'gratis', 
                txid: '', 
                valor: '',
                qrCode:'',
                pixCopiaECola: '',
                expirationTime: ''
            }
        } else {
            const separate = event.price[0].amount.split(",")
            const money = separate[0] + '.' + separate[1]
            const paymentPix =  await this.payment(money)
            userPay.payment= {
                    status: 'Pendente', 
                    txid: paymentPix.response.data.txid, 
                    valor: event.price[0].amount,
                    qrCode:paymentPix.qrcode.data.imagemQrcode,
                    pixCopiaECola: paymentPix.response.data.pixCopiaECola,
                    expirationTime: String(paymentPix.response.data.calendario.expiracao)
            }
        }
        const slug = this.generateRandomId(8)
        userPay.slug = slug
        
        user = await userRepository.add(userPay)            
        
        const getPayment:any = await userRepository.findUser(user.userId) 
        
        if(!getPayment) throw new HttpException(400, "não existe este usuario")               
        event.participants.push(user.userId)
        userAccount.eventos.push(getPayment._id)
        
        const updateUser = await userAccountRepository.update(userAccount, user.userId)
        const updateEvent = await this.eventRepository.update(event, eventId)

    }

    async getAllPay(p: number, q?: string | any) {
        const userRepository = new UserRepositoryMongoose()
        const userAccountRepository = new UserAccountRepositoryMongoose()
        const result = await userRepository.getAllPay(p)
        let payments:any = []
        if (result && result.pays) {
            await Promise.all(result.pays.map(async (data: User) => {
                const user = await userAccountRepository.findUserById(data.userId)
                const pay= {
                    name: user?.name,
                    status: data.payment.status,
                    _id: data._id,
                    value: data.payment.valor,
                    userId: data.userId,
                    createdAt: data.createdAt
                }
                payments.push(pay)
            }))
            payments.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            if(q) {
                payments = payments.filter((payment: { name: string; }) => payment.name.toLowerCase().includes(q.toLowerCase()))
            }
        } 
        return {payments, count: result.count}
    }

    async export(data: IExport) {
        
        if(data.tableType == 'Users') {
            let res: any = []
            const userAccountRepository = new UserAccountRepositoryMongoose()
            const response = await userAccountRepository.export(data)
            if (response) {
                await Promise.all(response.map(async (data) => {
                        const user= {
                            name: data.name,
                            email: data.email,
                        }
                        res.push(user)
                    }
                ))
            }
            const fileName:any = `${crypto.randomBytes(5).toString('hex')}${data.tableType}`
            const filePath:any = path.join(__dirname,"..","infra","upload","tmp", `exports/${fileName}.xlsx`);
            this.exportToExcel(res,fileName,filePath)
            return {filePath,fileName}
        }
        if(data.tableType == 'events') {
            let res: any = []
            const response = await this.eventRepository.export(data)
            if (response) {
                await Promise.all(response.map(async (data) => {
                        const event= {
                            title:data.title,
                            date: data.date,
                            coupons: data.coupons[0],
                            description: data.description,
                            categories: data.categories[0],
                            price:data.price[0].amount,
                            sector: data.price[0].sector,
                            city: data.city,
                            formattedAddress: data.formattedAddress,
                        }
                        res.push(event)
                    }
                ))
            }
            const fileName:any = `${crypto.randomBytes(5).toString('hex')}${data.tableType}`
            const filePath:any = path.join(__dirname,"..","infra","upload","tmp", `exports/${fileName}.xlsx`);
            this.exportToExcel(res,fileName,filePath)
            return {filePath,fileName}
        }
        if(data.tableType == 'transactions') {
            let res: any = []
            const userAccountRepository = new UserAccountRepositoryMongoose()
            const user = new UserRepositoryMongoose()
            const response = await user.export(data)
            if (response) {
                await Promise.all(response.map(async (data) => {
                    const user = await userAccountRepository.findUserById(data.userId)
                    const pay= {
                        name: user?.name,
                        status: data.payment.status,
                        value: data.payment.valor,
                        createdAt: data.createdAt
                    }
                        res.push(pay)
                    }
                ))
            }
            const fileName:any = `${crypto.randomBytes(5).toString('hex')}${data.tableType}`
            const filePath:any = path.join(__dirname,"..","infra","upload","tmp", `exports/${fileName}.xlsx`);
            this.exportToExcel(res,fileName,filePath)
            return {filePath,fileName}
        }
    }

    async chart() {
        const userAccountRepository = new UserAccountRepositoryMongoose()
        const date = new Date()
        const chartData = [
            { name: "Sun", participants: 0, events: 0 },
            { name: "Mon", participants: 0, events: 0 },
            { name: "Tue", participants: 0, events: 0 },
            { name: "Wed", participants: 0, events: 0 },
            { name: "Thu", participants: 0, events: 0 },
            { name: "Fri", participants: 0, events: 0 },
            { name: "Sat", participants: 0, events: 0 },
        ]
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(date);
            currentDate.setDate(date.getDate() - date.getDay() + i);
            const startDate = new Date(currentDate);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(currentDate);
            endDate.setHours(23, 59, 59, 999);
            const participants = await userAccountRepository.export({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            });
            const numberOfParticipants = participants?.length || 0;
            const numberOfEvents = participants?.reduce((acc, participant) => acc + (participant.eventos?.length || 0), 0) || 0;
            chartData[i].participants = numberOfParticipants;
            chartData[i].events = numberOfEvents;
        }
        
        return chartData;
    }

    async generateCertificate( fileName: string | any, id: string) {
        const event = await this.eventRepository.findEventsById(id)
        const userRepository = new UserRepositoryMongoose()
        const userAccountRepository = new UserAccountRepositoryMongoose()
        if(event && event.participants) {
            const quantity = event.participants.length
            await Promise.all(event.participants.map(async (userId) => {
                const payment = await userRepository.findPay(id, userId)
                if(payment) {
                    if(payment.payment.status == "Pago" || "gratis") {
                        const user = await userAccountRepository.findUserById(userId)
                        this.createCertificate(user,event,fileName, quantity)
                    }
                }
            }))
        }
        fs.rename(path.resolve(__dirname,'..','tmp','uploads', fileName), path.resolve(__dirname, '..', 'tmp','uploads','fundo.png'), (err) => {
            if (err) throw err;
        })
    }

    async getMyCertificate(userId: string | undefined, eventId: string | undefined) {
        const userAccountRepository = new UserAccountRepositoryMongoose()
        const userRepository = new UserRepositoryMongoose()
        const findEvent = await this.eventRepository.findEventsById(eventId)
        const user = await userAccountRepository.findUserById(userId)
        if(findEvent && eventId && userId) {
            const payment = await userRepository.findPay(eventId, userId)
            if(payment?.isConfirmed) {
                const pdf = await this.createCertificate(user,findEvent,"fundo.png",1, payment.slug)
                return pdf
            }
            throw new HttpException(400, "Você não foi confimado a presença")
            // const filePath = path.resolve(__dirname, "..", "tmp", "exports", `${user.name.replace(/\s/g, '_')}-certificate.pdf`)
            // fs.writeFileSync(filePath, pdf)
            // return filePath
        }
    }

    async listEvent(id: string) {
        const findEvent = await this.eventRepository.findEventsById(id);
        if (!findEvent) throw new HttpException(400, "evento não encontrado");
    
        const userAccount = new UserAccountRepositoryMongoose();
        const user = new UserRepositoryMongoose();
    
        const participants = (
            await Promise.all(
                findEvent.participants.map(async (participantId) => {
                    const participant = await userAccount.findUserById(participantId);
                    const paymentConfirm = await user.findUser(participantId);
                    
                    if (paymentConfirm?.payment.status === "Pago" || "gratis") {
                        return { name: participant?.name };
                    }
                    return null;
                })
            )
        ).filter(Boolean);
    
        const buffer = await this.createList(participants, findEvent.title, findEvent.date);
        return buffer;
    }
    

    async isConfirm(id: string, isConfirm: boolean, eventId: string) {
        const user = new UserRepositoryMongoose()
        await user.isConfirm(id, isConfirm, eventId)
    }

    async verification(slug: string) {
        const userRepository = new UserRepositoryMongoose()
        const userAccount = new UserAccountRepositoryMongoose()
        if(slug == "undefined" ) throw new HttpException(400, "Slug necessary")
        const findSlug = await userRepository.findSlug(slug)
        if(!findSlug) throw new HttpException(404, "Certificado não reconhecido")
        const user = await  userAccount.findUserById(findSlug.userId)
        if(!user) throw new HttpException(404, "Usuario não encontrado")
        const event = await this.eventRepository.findEventsById(findSlug.eventId)
        if(!event) throw new HttpException(404, "Event not found")
        return {
            name: user.name,
            cpf: user.cpf,
            email: user.email,
            eventName: event.title,
            eventDate: event.date
        }
    }

    async confirmAll(id: string) {
        const userRepository = new UserRepositoryMongoose()
        const users = await userRepository.findAllpaysEvent(id)
        if(!users) throw new HttpException(400, "Pays not found")
        await Promise.all(users.map(async (user) => {
            const findUser = await userRepository.isConfirm(user.userId, true, id)
        }))
    }

    private async getCityNameCoordinates(latitude: string, longitude: string) {

        try {
            const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.GOOGLE_API_KEY}`)
            
            if(response.data.status === 'OK' && response.data.results.length > 0) {
                const address = response.data.results[0].address_components
                const cityType = address.find(
                    (type: any)=> 
                        type.types.includes('administrative_area_level_2') && 
                        type.types.includes('political')
                )
                const formattedAddress = response.data.results[0].formatted_address
                return {
                    cityName: cityType.long_name,
                    formattedAddress,
                }
            }
            throw new HttpException(404, 'City not found')
        } catch (error) {
            throw new HttpException(401, 'Error request city name')
        }
        
    }

    private calculteDistance( lat1: number, lon1: number, lat2: number, lon2: number ): number {
        const R = 6371
        const dLat = this.deg2rad(lat2-lat1)
        const dLon = this.deg2rad(lon2-lon1)
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat/ 2) + 
            Math.cos(this.deg2rad(lat1)) *
            Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const d = R * c
        return d
    }

    private deg2rad(deg: number) {
        return deg * (Math.PI / 180)
    }

    private async payment(valor: string, user?: UserAccount) {
        
        const api =  await API()  

        const isExists = await api.get(`/customers?cpfCnpj=${user?.cpf}`)
        
        let dataCob = {}


        if(isExists.data.data.length == 0) {
            
            const client = await api.post("/customers", {
                name: user?.name,
                cpfCnpj: user?.cpf
            })
            console.log(client.data);
            
            dataCob = {
                customer: client.data.id ,
                billingType: "PIX",
                value: valor,
                dueDate: `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`        
            }

            const response = await api.post("/payments", dataCob)
            const qrcode = await api.post(`/payments/${response.data.id}/pixQrCode`)
            return {response, qrcode}

        }

        dataCob = {
            customer:isExists.data.data[0].id ,
            billingType: "PIX",
            value: valor,
            dueDate: `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`
        }
        
        const response = await api.post("/payments", dataCob)
        const qrcode = await api.post(`/payments/${response.data.id}/pixQrCode`)

        
        return {
            qrcode, response
        }
    }

    private async token(id: string) {
        const secret = process.env.TOKEN_SECRET_KEY
        if(!secret) {
            throw new HttpException(400, 'Key is not provider')
        }
        const token = sign({userId: id}, secret, {expiresIn: '1d'})
        const refreshToken = sign({userId: id}, secret, {expiresIn: '7d'})
        return {
            access_token: token,
            access_refresh_token:refreshToken,
            user_id: id
        }
    }

    private async findUserByIdInEvent(id: string) {
        const userAccountRepository = new UserAccountRepositoryMongoose()
        const user = await userAccountRepository.findUserById(id)
        return user
    }

    private exportToExcel = (data:any, sheetName: string, filePath: string) => {
        const workbook = excel.utils.book_new();
        const worksheet = excel.utils.json_to_sheet(data);
        
        excel.utils.book_append_sheet(workbook, worksheet, sheetName);
        
        excel.writeFile(workbook, filePath);
    };

    private loadImage(filePath: string) {
        return fs.readFileSync(filePath)
    }

    private wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number) {
        const words = text.split(' ');
        let lines = [];
        let currentLine = words[0];
    
        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = font.widthOfTextAtSize(currentLine + ' ' + word, fontSize);
            if (width < maxWidth) {
                currentLine += ' ' + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }

    private async createCertificate (user: UserAccount | undefined, event: Event, fileName: string, quantity: number, slug?: string) {
        const pdfDoc = await PDFDocument.create()
        const page = pdfDoc.addPage([842, 595])
        if(fileName){    
            const backgroundImagePath = path.resolve(__dirname,'..','infra/upload','tmp','uploads', fileName); // Caminho da imagem de fundo
            const backgroundImageBytes = this.loadImage(backgroundImagePath);
            const backgroundImage = await pdfDoc.embedPng(backgroundImageBytes);
            
            page.drawImage(backgroundImage, {
                x: 0,
                y: 0,
                width: page.getWidth(),
                height: page.getHeight(),
            })
        }
        const { width, height } = page.getSize();
        const fontSizeTitle = 62;
        const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);

        page.drawText('CERTIFICADO', {
            x: 215,
            y: height - 150,
            size: fontSizeTitle,
            font,
            color: rgb(0, 0, 0),
        });

        const newDate = new Date(event.date).toISOString().split('-')
        const finalDate = new Date(event.finalDate).toISOString().split('-')
        
        const date =  `${newDate[2].split('T')[0]}/${newDate[1]}/${newDate[0]}`
        const finaldate =  `${finalDate[2].split('T')[0]}/${finalDate[1]}/${finalDate[0]}`

        const porExtenso = require('numero-por-extenso')

        const horasTexto = porExtenso.porExtenso(event.hours)

        const textLines = this.wrapText(`Certificamos que ${user?.name} participou do ${event.title}, realizado ${(date === finaldate) ? `no dia ${date}` :`no periodo de ${date} a ${finaldate}`}, com carga horária de ${event.hours} (${horasTexto}) horas.`,
            font,
            10,
            400,
        )

        let yPosition: number = height - 160 - fontSizeTitle - 50;
        textLines.forEach(line => {
        page.drawText(line, {
            x: 130 ,
            y: yPosition,
            size: 15,
            font,
            color: rgb(0, 0, 0),

        });
        yPosition -= 10 + 20; // Avançar para a próxima linha
        });
        const mesesEmPortugues = [
            "janeiro", "fevereiro", "março", "abril", "maio", "junho",
            "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
        ]
        const mes = mesesEmPortugues[parseInt(newDate[1]) - 1];
        page.drawText(`Barra do corda (MA), ${finalDate[2].split('T')[0]} de ${mes} de ${finalDate[0]}.`, {
            x: 130,
            y: height - 380,
            font,
            size: 15,
            color: rgb(0,0,0)
        })
        const qrCodeDataUrl = await QRCode.toDataURL(process.env.FRONT_URL + `/verification?slug=${slug}`);
        const qrCodeImageBytes = await fetch(qrCodeDataUrl).then(res => res.arrayBuffer());
    
        const qrCodeImage = await pdfDoc.embedPng(qrCodeImageBytes);
        const qrCodeSize = 100; 
    
        page.drawImage(qrCodeImage, {
            x: width - qrCodeSize - 650, 
            y: height - qrCodeSize - 420,
            width: qrCodeSize,
            height: qrCodeSize,
        });

        page.drawText(`Codigo de verificação: ${slug}`, {
            size: 10,
            lineHeight: 200,
            x: width - 750,
            y: height - 525
        })
        
        const pdfBytes = await pdfDoc.save();
        if(quantity > 1) await this.sendCert(user,pdfBytes)        
        return pdfBytes 
    }

    private async sendCert(data: UserAccount | undefined, pdfBytes: Uint8Array) {
        const account = await nodemailer.createTestAccount()
        if(data) {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_EMAIL,
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: false,
                auth: {
                  user: process.env.SMTP_AUTH, 
                  pass: process.env.SMTP_PASS,
                },
            } as nodemailer.TransportOptions); 
            const mailOptions = {
                from: `"Nome do Remetente"<${process.env.SMTP_AUTH}>`,
                to: data.email,
                subject: 'Seu Certificado de Participação',
                text: `Olá ${data.name},\n\nAqui está o seu certificado de participação no evento.\n\nAtenciosamente,\nEquipe Organizadora`,
                attachments: [
                    {
                    filename: `${data.name.replace(/\s/g, '_')}-certificate.pdf`,
                    content:  Buffer.from(pdfBytes),
                    contentType: 'application/pdf',
                    },
                ],
            };
            try {
                const info: SentMessageInfo = await transporter.sendMail(mailOptions);
            } catch (error) {
                console.error(`Erro ao enviar email: ${error}`);
            }
        }
    }

    private async createList(participants: any, eventName: string, date: Date) {
        
        const doc = new Document({
            sections: [
                {
                    properties: {},
                    headers: {
                        default: {
                            options: {
                                children: [
                                    // Cabeçalho
                                    new Paragraph({
                                        children: [
                                            new ImageRun({
                                                data: fs.readFileSync(path.resolve(__dirname, "../infra/upload/tmp/uploads/logo.png")),
                                                transformation: {
                                                    height: 50,
                                                    width: 300
                                                }
                                            }),
                                        ],
                                        alignment: "center"
                                    }),
                                    new Paragraph({
                                        children: [
                                            new TextRun({
                                                text: "FACULDADE DO CENTRO MARANHENSE - FCMA",
                                                bold: true,
                                                size: 24,
                                            }),
                                        ],
                                        alignment: "center"
                                    }),
                                    new Paragraph({
                                        children: [
                                            new TextRun({
                                                text: `Credenciada pelo Ministério da Educação - MEC Portaria no. 135, de 02 de fevereiro de 2017`,
                                                size: 18,
                                            }),
                                        ],
                                        alignment: "center"
                                    }),
                                ]
                            }
                        }
                    },
                    children: [
                        
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `Evento: ${eventName}`,
                                    size: `${12}pt`,
                                }),
                            ],
                            alignment: "center"
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `\nData Inicial: ${new Date(date).getDay()}/${new Date(date).getMonth()}/${new Date(date).getFullYear()}`,
                                    size: `${12}pt`,
                                })
                            ],
                            alignment: "center"
                        }),
                        // Tabela
                        new Table({
                            width: {
                                size: 9070,
                                type: WidthType.DXA
                            },
                            rows: [
                                // Cabeçalho da Tabela
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            children: [
                                                new Paragraph({
                                                    heading: HeadingLevel.HEADING_2,
                                                    children: [
                                                        new TextRun({
                                                            text: "Participante",
                                                            bold: true,
                                                            size: 40,
                                                            color: "#000000"
                                                        }),
                                                    ],
                                                    alignment: "center"
                                                }),
                                            ],
                                        }),
                                        new TableCell({
                                            children: [
                                                new Paragraph({
                                                    heading: HeadingLevel.HEADING_2,
                                                    children: [
                                                        new TextRun({
                                                            text: "Assinatura",
                                                            bold: true,
                                                            size: 40,
                                                            color: "#000000",
                                                        }),
                                                    ],
                                                    alignment: "center"
                                                }),
                                            ],
                                            
                                        }),
                                    ]
                                }),
                                // Adicionando os participantes na tabela
                                ...participants.map((participant: any) =>
                                    new TableRow({
                                        children: [
                                            new TableCell({
                                                children: [new Paragraph({
                                                    children: [
                                                        new TextRun({
                                                            text: participant.name,
                                                            size: `${10}pt`
                                                        })
                                                    ],
                                                })],
                                                margins: {
                                                    top: 100,
                                                    bottom: 100,
                                                    left: 100
                                                },
                                                width: {
                                                    size: 50,
                                                    type: "pct"
                                                }
                                            }),
                                            new TableCell({
                                                children: [new Paragraph("")], 
                                                width: {
                                                    size: 50,
                                                    type: "pct"
                                                }
                                            }),
                                        ],
                                    })
                                ),
                            ],
                        }),
                    ],
                },
            ],
            
        });
        
    
        // Gerar o documento Word
        const buffer = await Packer.toBuffer(doc);
        return buffer
    }

    private generateRandomId(length: number): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    private async updatePix(valor: string, user: UserAccount, txid: string) {
        const api =  await API()  

        const dataCob = {
            bilingType: "PIX",
            value: valor,
            dueDate: `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate() + 1}`
        }

        const response = await api.put(`/payments/${txid}`, dataCob)
        const qrcode = await api.post(`/payments/${response.data.id}/pixQrCode`)        

        return {
            response, qrcode
        }
    }
    
}