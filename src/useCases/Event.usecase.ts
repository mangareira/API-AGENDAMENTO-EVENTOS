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
import { compare, hash} from "bcrypt";
import { sign, verify } from "jsonwebtoken";
import { IExport } from "../interface/IExport";
import path from 'path'
import excel from 'xlsx'
import crypto from 'node:crypto'
export class EventUseCase {
    constructor(private eventRepository: EventRepository) {}
    
    

    async create(eventData: Event) {
        
        if (!eventData.banner) {
            throw new HttpException(400, 'Banner is required');
          }
        if (!eventData.flyers) throw new HttpException(400, 'Flyers is required');
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
            const paymentPix =  await this.payment(paymentAmount)
            participant.payment = {
                    status: 'Pendente', 
                    txid: paymentPix.response.data.txid, 
                    valor: paymentAmount,
                    qrCode:paymentPix.qrcode.data.imagemQrcode,
                    pixCopiaECola: paymentPix.response.data.pixCopiaECola,
                    expirationTime: String(paymentPix.response.data.calendario.expiracao)
            }
        }
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
        const result  = userevent.findTxid(data.pix[0].txid)
        return result
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
        const isExists = await userRepository.findPayByTxid(txid)
        if(!isExists) throw new HttpException(400, 'This payment not exists')
        const newPix  = await this.payment(isExists.payment.valor)
        const update = await userRepository.updateUser(newPix.response.data, newPix.qrcode.data.imagemQrcode,txid)
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
            count
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
        if(event.price[0].amount == "") {
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
            const filePath:any = path.join(__dirname,"..","tmp", `exports/${fileName}.xlsx`);
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
            const filePath:any = path.join(__dirname,"..","tmp", `exports/${fileName}.xlsx`);
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
            const filePath:any = path.join(__dirname,"..","tmp", `exports/${fileName}.xlsx`);
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

    private async getCityNameCoordinates(latitude: string, longitude: string) {

        try {
            const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyDoAYR3fYzgI5bOuGldIG4c2hMni5dNBTk`)
            
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

    private async payment(valor: string) {
        
        const api =  await API({
            clientId: process.env.GN_CLIENT_ID,
            clientSecret: process.env.GN_CLIENT_SECRET
        })              
        const dataCob = {
            "calendario": {
              "expiracao": 3600
            },
            "valor": {
              "original": valor
            },
            "chave": "71cdf9ba-c695-4e3c-b010-abb521a3f1be",
            "solicitacaoPagador": "Cobrança dos serviços prestados."
          }
        

        const response = await api.post('/v2/cob', dataCob).catch()       
        const qrcode = await api.get(`/v2/loc/${response.data.loc.id}/qrcode`)
        
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
}