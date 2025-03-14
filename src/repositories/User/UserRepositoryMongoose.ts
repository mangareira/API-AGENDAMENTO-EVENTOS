import mongoose from "mongoose";
import { UserRepository } from "./UserRepository";
import { User } from "../../entities/User";
import { randomUUID } from 'crypto';
import { IEventsPart } from "../../interface/IEventsPart";
import { IExport } from "../../interface/IExport";

const userEventsSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: () => randomUUID()
    },
    eventId: {
        type: String,
        ref: 'Events'
    },
    userId: {
        type: String,
        ref: 'UserAccounts'
    },
    payment: {
        status: String,
        txid: String,
        valor: String,
        qrCode: String,
        pixCopiaECola: String,
        expirationTime: String,
    },
    tickets: String,
    discount: String,
    isConfirmed: Boolean,
    slug: String,
    createdAt: {
        type: Date,
        default: Date.now
    }

});

const UserModel = mongoose.model('UserEvents', userEventsSchema);

export class UserRepositoryMongoose implements UserRepository {
    
    async add(user: User): Promise<User> {
        const userModel = new UserModel(user);
        await userModel.save();
        return user;
    }
    
    async veridyIsUserExists(email: string): Promise<User | undefined> {
        const result = await UserModel.findOne({ email }).exec();
        return result ? result.toObject() : undefined;
    }
    async findUser(id: string): Promise<User | undefined> {
        const lastPurchase = await UserModel.findOne({ userId: id })
        .sort({ createdAt: -1 }) // Ordenar por data de criação em ordem decrescente
        .limit(1) // Limitar o resultado a 1
        .exec();
        
        return lastPurchase ? lastPurchase.toObject() : undefined;
    }
    async findTxid(id: string): Promise<User | undefined> {
        const user = await UserModel.findOne({ 'payment.txid': id }).exec();
        
        if (!user) {
            return undefined;
        }
        
        user.payment = {
            status: 'Pago',
            valor: user.payment?.valor
        }
        await user.save()
        
        return user ? user.toObject() : undefined;
    }
    async findEvent(id: string): Promise<IEventsPart[]> {
        const result = await UserModel.find({userId: id}).exec()
        return result.map((event) => event.toObject())
    }
    async findPay(id: string, userId: string): Promise<User | undefined> {
        const result = await UserModel.findOne({eventId: id, userId}).exec()
        return result ? result.toObject() : undefined;
    }
    async findPayByTxid(txid: string): Promise<User | undefined> {        
        const result = await UserModel.findOne({'payment.txid': txid}).exec()        
        return result ? result.toObject() : undefined
    }
    async updateUser(data: any, qrCode: any, txid: string): Promise<User | undefined> {
        const user = await UserModel.findOne({'payment.txid': txid}).exec()
        if (!user) {
            return undefined;
        }        
        user.payment = {
            status: 'Pendente',
            valor: data.value,
            txid: data.id,
            qrCode: qrCode.encodedImage,
            pixCopiaECola: qrCode.payload,
            expirationTime: qrCode.expirationDate
        }
        await user.save()
        return user ? user.toObject() : undefined;
    }
    async deletePay(eventId: string, userId: string): Promise<User | null> {
        const pay = await UserModel.findOne({eventId,userId}).exec()
        if(!pay) {
            return null
        }
        pay.eventId = ''
        pay.payment = {
            expirationTime: '',
            pixCopiaECola: '',
            qrCode: '',
            status: "cancelled",
            txid: '',
            valor: pay.payment?.valor,
        }
        pay.save()
        return null
    }
    async getAllPay( p?:number | any): Promise<User[] | any> {
        const itemPerP = 6
        const result = await UserModel.find().limit(itemPerP).skip(itemPerP * (p-1)).sort('asc').exec()
        const count =  (await UserModel.find().exec()).length
        return {pays: result.map((pay) => pay.toObject()), count} 
    }
    async export (data: IExport): Promise<User[]| undefined> {
        const result = await UserModel.find({createdAt: {
            $gte: new Date(data.startDate),
            $lte: new Date(data.endDate)
        }}).exec()
        return result.map((user) => user.toObject())
    }
    async isConfirm(id: string, isConfirm: boolean, eventId: string): Promise<void> {
        await UserModel.findOneAndUpdate({userId: id, eventId}, {isConfirmed: isConfirm})
    }
    async findSlug(slug: string): Promise<{userId: string, eventId: string} | undefined> {
        const result = await UserModel.findOne(
            { slug },
            { userId: 1, eventId: 1, _id: 0 } // Projeção para retornar somente userId e eventId
        ).exec();
        if (!result) return undefined;
        return {
            userId: result.userId as string,
            eventId: result.eventId as string
        }
    }
    async findAllpaysEvent(id: string | null | undefined): Promise<User[] | undefined> {
        const result = await UserModel.find({eventId: id}).exec()
        return result.map((pay) => pay.toObject() )
    }
}
