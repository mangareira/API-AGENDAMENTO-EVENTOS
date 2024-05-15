import { NextFunction, Request, Response } from "express";
import { EventUseCase } from "../useCases/Event.usecase";
import { Event } from "../entities/Events";
import { User } from "../entities/User";
import { HttpException } from "../interface/HttpException";
import { UserAccount } from "../entities/UserAccount";

export class EventController {
    constructor(private eventUseCase: EventUseCase) {}
    async create(req: Request, res: Response, next: NextFunction) {
        let eventData: Event = req.body
        
        const files = req.files as any 
        if (files) {
            const banner = files.banner?.[0]; // Access banner only if files exist
            const flyers = files.flyers || []; // Use an empty array if flyers are missing
        
            eventData = {
              ...eventData,
              banner: banner?.filename, // Access filename only if banner exists
              flyers: flyers.map((flyer: any) => flyer.filename),
            };
        }
        try {
            await this.eventUseCase.create(eventData)
            return res.status(201).json({message: 'Evento criado com sucesso.'})
        } catch (error) {
            next(error)
        }        
    }
    async findEventByLocation(req: Request, res: Response, next: NextFunction) {
        const {latitude, longitude} = req.query

        try {
            const events = await this.eventUseCase.findEventByLocation(
                String(latitude),
                String(longitude),
            )            
            return res.status(200).json(events)
        } catch (error) {
            next(error)
        }
    }
    async findEventsByCategory(req: Request, res: Response, next: NextFunction) {
        const {category} = req.params

        try {
            const events = await this.eventUseCase.findEventByCategory(
                String(category),
            )            
            return res.status(200).json(events)
        } catch (error) {
            next(error)
        }
    }
    async findEventsByName(req: Request, res: Response, next: NextFunction) {
        const {name} = req.query        
        try {
            const events = await this.eventUseCase.findEventByName(
                String(name),
            )            
            return res.status(200).json(events)
        } catch (error) {
            next(error)
        }
    }
    async findEventsById(req: Request, res: Response, next: NextFunction) {
        const {id} = req.params        
        try {
            const events = await this.eventUseCase.findEventById(
                String(id),
            )            
            return res.status(200).json(events)
        } catch (error) {
            next(error)
        }
    }
    async addParticipant(req: Request, res: Response, next: NextFunction) {
        const { id, user_id } = req.params;
        const { valor, tickets, discount } = req.body;          
        try {     

            const participant: User = {
                eventId: id,
                userId: user_id,
                payment: {
                    status: 'Pendente',
                    txid: '',
                    valor: '',
                    qrCode: '',
                    pixCopiaECola: '',
                    expirationTime: ''
                },
                tickets,
                discount
            };            
            const updatedEvent = await this.eventUseCase.addParticipant(id, participant, valor);

            res.status(200).json(updatedEvent);
        } catch (error) {
            next(error);
        }
    }
    async findMainEvents(req: Request, res: Response, next: NextFunction) {

        try {
            const events = await this.eventUseCase.findEventsMain()   
            return res.status(200).json(events)
        } catch (error) {
            next(error)
        }
    }
    async filterEvents(req: Request, res: Response, next: NextFunction) {
        const { latitude, longitude, name, date, category, radius } = req.query                  
        try {
            const events = await this.eventUseCase.filterEvents({
                latitude: Number(latitude),
                longitude: Number(longitude),
                name: String(name),
                date: String(date),
                category: String(category),
                radius: Number(radius),
                //price: Number(price),
              })              
            return res.status(200).json(events)
        } catch (error) {
            next(error)
        }      
    }
    async confirmPayment(req: Request, res: Response, next: NextFunction) {
        const {id} = req.params

        try {
            const event = await this.eventUseCase.comfirmPayment(id)
            return res.status(200).json(event)
        } catch (error) {
            next(error)
        }
    }
    async createUserAccount(req: Request, res: Response, next: NextFunction) {

        const data:UserAccount = req.body
        try {
            await this.eventUseCase.CreateAccount(data)
            return res.status(201).json({message: 'Usuario criado com sucesso'})
        } catch (error) {
            next(error)
        }
    }
    async login(req: Request, res: Response, next: NextFunction) {
        const {email, password} = req.body
        try {
            const result = await this.eventUseCase.login(email, password)
            res.status(200).json(result)
        } catch (error) {
            next(error)
        }
    }
    async refreshToken(req: Request, res: Response, next: NextFunction) {
        const refreshToken = req.headers.authorization
        if(!refreshToken) {
            throw new HttpException(400, 'Refresh token is missign')
        }
        try {
            const token = await this.eventUseCase.refreshToken(refreshToken)
            return res.status(200).json(token)
        } catch (error) {
            next(error)
        }
    }
    async webhook(req: Request, res: Response, next: NextFunction) {
        const data = req.body
        try {
            const result = await this.eventUseCase.webhook(data)
            return res.status(200).end()
        } catch (error) {
            next(error)
        }
    }
    async getUserRole(req: Request, res: Response, next: NextFunction) {
        const {id} = req.params
        try {
            const result = await this.eventUseCase.getUserRole(id)
            return res.status(200).json(result)
        } catch (error) {
            next(error)
        }
    }
    async getPartDetails(req: Request, res: Response, next: NextFunction) {
        const {id} = req.params
        try {
            const result = await this.eventUseCase.getPartDetails(id)
            return res.status(200).json(result)
        } catch (error) {
            next(error)
        }
    }
    async getPartEvent(req: Request, res: Response, next: NextFunction) {
        const {id} = req.params
        const {page, limit} = req.query                
        try {
            const result = await this.eventUseCase.getPartEvents(id, Number(page), Number(limit))
            return res.status(200).json(result)
        } catch (error) {
            next(error)
        }
    }
    async getEventPay(req: Request, res: Response, next: NextFunction) {
        const {userId} = req.query
        const {id} = req.params        
        try {
            const result = await this.eventUseCase.getEventPay(id, userId)
            return res.status(200).json(result)
        } catch (error) {
            next(error)
        }    
    }
    async newPix(req: Request, res: Response, next: NextFunction) {
        const {txid} = req.params
        try {
            const result = await this.eventUseCase.newPix(txid)            
            return res.status(200).json(result)
        } catch (error) {
            next(error)
        }
    }
    async getPayNewPix(req: Request, res: Response, next: NextFunction) {
        const {txid} = req.params
        try {
            const result = await this.eventUseCase.getPay(txid)
            return res.status(200).json(result)
        } catch (error) {
            next(error)
        }        
    }
    async getParticipants(req: Request, res: Response, next: NextFunction) {
        const {q}:any = req.query
        try {
            const result  = await this.eventUseCase.getParticipants(q)
            res.status(200).json(result)
        } catch (error) {
            next(error)
        }
    }
    async getParticipant(req: Request, res: Response, next: NextFunction) {
        const {id} = req.params
        try {
            const result = await this.eventUseCase.getParticipant(id)
            res.status(200).json(result)
        } catch (error) {
            next(error)
        }
    }
}