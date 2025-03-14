import { NextFunction, Request, Response } from "express";
import { EventUseCase } from "../useCases/Event.usecase";
import { Event } from "../entities/Events";
import { User } from "../entities/User";
import { HttpException } from "../interface/HttpException";
import { UserAccount } from "../entities/UserAccount";
import { IExport } from "../interface/IExport";
import fs from 'fs'

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
                isConfirmed: false,
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
            return res.status(200).send(result)
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
        const {q, page}:any = req.query
        try {
            const result  = await this.eventUseCase.getParticipants(q, Number(page))
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
    async findEvents(req: Request, res: Response, next: NextFunction) {
        const {q, page}: any = req.query
        try {
            const result = await this.eventUseCase.findEvents(q, Number(page))
            res.status(200).json(result)
        } catch (error) {
            next(error)
        }
    }
    async deleteUser(req: Request, res: Response, next: NextFunction) {
        const {id} = req.query
        try {
            await this.eventUseCase.deleteUser(String(id))
            res.status(200).json()
        } catch (error) {
            next(error)
        }
    }
    async updateUser(req: Request, res: Response, next: NextFunction) {
        const {id} = req.params
        const data: UserAccount = req.body
        try {
            const result = await this.eventUseCase.updateUser(data,id)
            res.status(200).json(result)
        } catch (error) {
            next(error)
        }
    }
    async updateEvent(req: Request, res: Response, next: NextFunction) {
        const {id} = req.params
        const data = req.body
        try {
            const result =  await this.eventUseCase.updateEvent(data, id)
            res.status(200).json(result)
        } catch (error) {
            next(error)
        }
    }
    async deleteEvent(req: Request, res: Response, next: NextFunction) {
        const {id} = req.query
        try {
            const result = await this.eventUseCase.deleteEvent(String(id))
            res.status(200).json(result)
        } catch (error) {
            next(error)
        }
    }
    async getUserEvent(req: Request, res: Response, next: NextFunction) {
        const {q, page}: any = req.query    
        const {id} = req.params            
        try {
            const result = await this.eventUseCase.getUserEvents(q, Number(page),id)
            return res.status(200).json(result)
        } catch (error) {
            next(error)
        }
    }
    async cancelledSub(req: Request, res: Response, next: NextFunction) {
        const {eventId, userId} = req.query
        try {
            await this.eventUseCase.cancelledSub(eventId, userId)
            res.status(200).json({message: "cancelled sucess"})
        } catch (error) {
            next(error)
        }
    }
    async findEventsUsers(req: Request, res: Response, next: NextFunction) {
        const {q, page}: any = req.query    
        const {id} = req.params            
        try {
            const result = await this.eventUseCase.findEventsUsers(id,Number(page), q)
            return res.status(200).json(result)
        } catch (error) {
            next(error)
        }
    }
    async addPartWithEmail(req: Request, res: Response, next: NextFunction) {
        const {email, eventId,tickets,discount}:any = req.query
        try {
            const result = await this.eventUseCase.addPartWithEmail(email,eventId,tickets,discount)
            res.status(200).json({message: "Inscrição feita com successo"})
        } catch (error) {
            next(error)
        }
    }
    async getAllPay(req: Request, res: Response, next: NextFunction) {
        const {page,q} = req.query
        try {
            const result = await this.eventUseCase.getAllPay(Number(page),q)
            res.status(200).json(result)
        } catch (error) {
            next(error)
        }
    }
    async export(req: Request, res: Response, next: NextFunction) {
        const data: IExport = req.body;
        try {
            const result = await this.eventUseCase.export(data);
            // Enviar o arquivo gerado para o cliente
            res.sendFile(result?.filePath);
        } catch (error) {
            next(error);
        }
    }
    async chart(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await this.eventUseCase.chart()
            res.status(200).json(result)
        } catch (error) {
            next(error)
        }
    }
    async certificate(req: Request, res: Response, next: NextFunction) {
        const filePath = req.file?.filename || "fundo.png"
        const {id} = req.query
        try {
            await this.eventUseCase.generateCertificate(filePath,String(id))
            res.status(200).json({message: "Enviadado com sucesso"})
        } catch (error) {
            next(error)
        }
    }
    async myCertificate(req: Request, res: Response, next: NextFunction) {
        const {userId, eventId} = req.query
        try {
            const pdfBuffer = await this.eventUseCase.getMyCertificate(String(userId), String(eventId))
            if (pdfBuffer) {
                res.status(200).send(Buffer.from(pdfBuffer));
            }
        } catch (error) {
            next(error)
        }
    }
    async exportList(req: Request, res: Response, next: NextFunction) {
        const {id} = req.query
        try {
            const docxBuffer = await this.eventUseCase.listEvent(String(id))
            res.setHeader('Content-Disposition', 'attachment; filename=lista-de-presenca.docx');
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            
            res.send(docxBuffer);
        } catch (error) {
            next(error)
        }
    }
    async isConfirmed(req: Request, res: Response, next: NextFunction) {
        const { id, isConfirmed, eventId } = req.query

        try {
            const result = await this.eventUseCase.isConfirm(String(id), (isConfirmed == "false" ? false : true), String(eventId))
            res.status(200).json({message: "Confirmado com sucesso"})
        } catch (error) {
            next(error)
        }
    }
    async slug(req: Request, res: Response, next: NextFunction) {
        const { slug } = req.params

        try {
            const result = await this.eventUseCase.verification(slug)
            res.status(200).json(result)
        } catch (error) {
            next(error)
        }
    }
    async confirmAll(req: Request, res: Response, next: NextFunction) {
        const { id } = req.params

        try {
            await this.eventUseCase.confirmAll(id)
            res.status(200).json({message: "Todos confirmados"})
        } catch (error) {
            next(error)
        }
    }
}