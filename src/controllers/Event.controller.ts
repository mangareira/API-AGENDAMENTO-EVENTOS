import { NextFunction, Request, Response } from "express";
import { EventUseCase } from "../useCases/Event.usecase";
import { Event } from "../entities/Events";
import { IFIlter } from "../interface/IFilter";

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
        const { name, email } = req.body
        const { id } = req.params

        try {
            const events = await this.eventUseCase.addParticipant(id, name, email)
            return res.status(200).json(events)
        } catch (error) {
            next(error)
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
        const data: IFIlter = req.query  
        //const data = {name, latitude, longitude, date, category, radius, price}
        try {
            const events = await this.eventUseCase.filterEvents(data)
            return res.status(200).json(events)
        } catch (error) {
            next(error)
        }      
    }
}