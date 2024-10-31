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
        this.router.get('/category/:category', this.eventController.findEventsByCategory.bind(this.eventController))
        this.router.get('/get-events/:id', this.eventController.findEventsById.bind(this.eventController))
        this.router.get('/get-events/',authMiddleware, this.eventController.findEvents.bind(this.eventController))
        this.router.get('/get-events-participants/:id',authMiddleware, this.eventController.findEventsUsers.bind(this.eventController))
        this.router.get('/get-participants',authMiddleware, this.eventController.getParticipants.bind(this.eventController))
        this.router.get('/get-participant/:id',authMiddleware, this.eventController.getParticipant.bind(this.eventController))
        this.router.get('/findparticipants/:id',authMiddleware, this.eventController.confirmPayment.bind(this.eventController))
        this.router.get('/get-participant-role/:id',authMiddleware, this.eventController.getUserRole.bind(this.eventController))
        this.router.get('/get-participant-details/:id',authMiddleware, this.eventController.getPartDetails.bind(this.eventController))
        this.router.get('/get-participant-events/:id',authMiddleware, this.eventController.getPartEvent.bind(this.eventController))
        this.router.get('/get-user-events/:id',authMiddleware, this.eventController.getUserEvent.bind(this.eventController))
        this.router.get('/get-events-payment/:id',authMiddleware, this.eventController.getEventPay.bind(this.eventController))
        this.router.get('/get-pay/:txid',authMiddleware, this.eventController.getPayNewPix.bind(this.eventController))
        this.router.get('/get-all-payments',authMiddleware, this.eventController.getAllPay.bind(this.eventController))
        this.router.get('/chart',authMiddleware, this.eventController.chart.bind(this.eventController))
        this.router.get('/list', this.eventController.exportList.bind(this.eventController))
        this.router.get('/certificate/:slug', this.eventController.slug.bind(this.eventController))
        this.router.post('/new-pix/:txid',authMiddleware, this.eventController.newPix.bind(this.eventController))
        this.router.post('/:id/:user_id/participants',authMiddleware, this.eventController.addParticipant.bind(this.eventController))
        this.router.post('/create-account', this.eventController.createUserAccount.bind(this.eventController))
        this.router.post('/login', this.eventController.login.bind(this.eventController))
        this.router.post('/refresh-token',authMiddleware, this.eventController.refreshToken.bind(this.eventController))
        this.router.post('/webhook(/pix)?', this.eventController.webhook.bind(this.eventController))
        this.router.post('/add-with-email/participants', this.eventController.addPartWithEmail.bind(this.eventController))
        this.router.post('/exports',authMiddleware, this.eventController.export.bind(this.eventController))
        this.router.post('/certificate',authMiddleware,this.eventController.certificate.bind(this.eventController))
        this.router.post('/my-certificate',authMiddleware ,this.eventController.myCertificate.bind(this.eventController))
        this.router.put('/update-user/:id',authMiddleware, this.eventController.updateUser.bind(this.eventController))
        this.router.put('/update-event/:id',authMiddleware, this.eventController.updateEvent.bind(this.eventController))
        this.router.put('/cancelled-sub',authMiddleware, this.eventController.cancelledSub.bind(this.eventController))
        this.router.put('/confirm', authMiddleware, this.eventController.isConfirmed.bind(this.eventController))
        this.router.delete('/delete-user',authMiddleware, this.eventController.deleteUser.bind(this.eventController))
        this.router.delete('/delete-event',authMiddleware, this.eventController.deleteEvent.bind(this.eventController))
    }
}