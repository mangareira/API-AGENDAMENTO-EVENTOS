import { Router } from "express";
import { EventRepositoryMongoose } from "../repositories/Event/EventRepositoryMongoose";
import { EventController } from "../controllers/Event.controller";
import { EventUseCase } from "../useCases/Event.usecase";
import { upload } from "../infra/upload/multer";
import { authMiddleware } from "../middleware/auth.middleware";

export class EventRoutes {
    public router: Router
    private eventController: EventController
    constructor() {
        this.router = Router()
        const eventRepository = new EventRepositoryMongoose()
        const eventUseCase = new EventUseCase(eventRepository)
        this.eventController = new EventController(eventUseCase)
        this.initRoutes()
    }
    initRoutes() {
        this.router.post('/',authMiddleware,upload.fields([{
                    name: 'banner',
                    maxCount: 1
                },
                {
                    name: 'flyers',
                    maxCount: 3
                },
            ]), this.eventController.create.bind(this.eventController)
        )
        this.router.get('/name', this.eventController.findEventsByName.bind(this.eventController))
        this.router.get('/', this.eventController.findEventByLocation.bind(this.eventController))
        this.router.get('/main', this.eventController.findMainEvents.bind(this.eventController));
        this.router.get('/filter', this.eventController.filterEvents.bind(this.eventController))
        this.router.get('/:id', this.eventController.findEventsById.bind(this.eventController))
        this.router.get('/category/:category', this.eventController.findEventsByCategory.bind(this.eventController))
        this.router.get('/findparticipants/:id',authMiddleware, this.eventController.confirmPayment.bind(this.eventController))
        this.router.get('/get-participant/:id',authMiddleware, this.eventController.getUser.bind(this.eventController))
        this.router.get('/get-participant-details/:id',authMiddleware, this.eventController.getPartDetails.bind(this.eventController))
        this.router.get('/get-participant-events/:id',authMiddleware, this.eventController.getPartEvent.bind(this.eventController))
        this.router.get('/get-events-payment/:id',authMiddleware, this.eventController.getEventPay.bind(this.eventController))
        this.router.post('/:id/:user_id/participants',authMiddleware, this.eventController.addParticipant.bind(this.eventController))
        this.router.post('/create-account', this.eventController.createUserAccount.bind(this.eventController))
        this.router.post('/login', this.eventController.login.bind(this.eventController))
        this.router.post('/refresh-token',authMiddleware, this.eventController.refreshToken.bind(this.eventController))
        this.router.post('/webhook(/pix)?', this.eventController.webhook.bind(this.eventController))
    }
}