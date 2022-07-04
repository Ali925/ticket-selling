import { FastifyInstance } from "fastify";
import { config } from "../../config";
import { DBNamesEnum } from "../enum/db-names.enum";
import { PaymentStatusesEnum } from "../enum/payment-statuses.enum";
import { ICreatePayment, IPayment } from "../interface/payment";

export class PaymentService {
    server: FastifyInstance;

    constructor(fastify: FastifyInstance) {
        this.server = fastify;
    }

    public async createPayment(payment: ICreatePayment): Promise<string> {
        try {
            let date: Date = new Date();

            let paymentIdRows: {rows: {id: number}[]} = await (this.server as any).pg.query(
                `INSERT INTO ${DBNamesEnum.Payments} (reservation_id, user_id, amount, status, date) VALUES($1, $2 ,$3, $4, $5) RETURNING id`, [payment.reservation_id, payment.user_id, payment.amount, PaymentStatusesEnum.Pending, date.toISOString()],
            );

            let paymentURL: string = `${config.app}/${config.api}/payments/${paymentIdRows.rows[0].id}`;

            return Promise.resolve(paymentURL);
        } catch (err) {
            console.error(`[PaymentService.createPayment]: ${err}`);

            return Promise.reject(err);
        }
    }

    public async completePayment(id: number): Promise<number> {
        try {
            let reservationIdRows: {rows: {reservation_id: number}[]} = await (this.server as any).pg.query(
                `UPDATE ${DBNamesEnum.Payments} SET status = ${PaymentStatusesEnum.Completed} WHERE id=$1 RETURNING reservation_id`, [id],
            );

            return Promise.resolve(reservationIdRows.rows[0].reservation_id);
        } catch (err) {
            console.error(`[PaymentService.completePayment]: ${err}`);

            return Promise.reject(err);
        }
    }

    public async cancelPayment(id: number): Promise<number> {
        try {
            let reservationIdRows: {rows: {reservation_id: number}[]} = await (this.server as any).pg.query(
                `UPDATE ${DBNamesEnum.Payments} SET status = ${PaymentStatusesEnum.Cancelled} WHERE id=$1 RETURNING reservation_id`, [id],
            );

            return Promise.resolve(reservationIdRows.rows[0].reservation_id);
        } catch (err) {
            console.error(`[PaymentService.cancelPayment]: ${err}`);

            return Promise.reject(err);
        }
    }

    public async getPayment(id: number): Promise<IPayment> {
        try {
            let paymentRows: {rows: IPayment[]} = await (this.server as any).pg.query(
                `SELECT * FROM ${DBNamesEnum.Payments} WHERE id=$1`, [id],
            );

            return Promise.resolve(paymentRows.rows[0]);
        } catch (err) {
            console.error(`[PaymentService.getPayment]: ${err}`);

            return Promise.reject(err);
        }
    }
}