import { NextFunction, Request, Response } from "express";
import { EventUseCase } from "../useCases/Event.usecase";
import { Event } from "../entities/Events";
import { API } from "../config";
import { User } from "../entities/User";
import { HttpException } from "../interface/HttpException";

export class EventController {
    constructor(private eventUseCase: EventUseCase) {}
    async create(req: Request, res: Response, next: NextFunction) {
        let eventData: Event = req.body
        
        const files = req.files as any        
        if (files) {
            const banner = files.banner[0];
            const flyers = files.flyers;
      
            eventData = {
              ...eventData,
              banner: banner.filename,
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
        const { id } = req.params;
        const { name, email, valor } = req.body;  
        try {     
            if (!name || !email || !valor || isNaN(valor)) {
                throw new HttpException(400, 'Nome, e-mail e valor do pagamento são obrigatórios');
            }

            const participant: User = {
                name,
                email,
                payment: {
                    status: 'Pendente',
                    txid: '',
                    valor: Number(),
                    qrCode: ''
                }
            };

            const updatedEvent = await this.eventUseCase.addParticipant(id, participant, parseFloat(valor));

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
        const { latitude, longitude, name, date, category, radius, price } = req.query          
        try {
            const events = await this.eventUseCase.filterEvents({
                latitude: Number(latitude),
                longitude: Number(longitude),
                name: String(name),
                date: String(date),
                category: String(category),
                radius: Number(radius),
                price: Number(price),
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
}