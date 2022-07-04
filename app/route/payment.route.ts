import { FastifyRequest } from 'fastify';
import { FastifyReply } from 'fastify';
import { FastifyInstance } from 'fastify';
import { config } from '../../config';
import { ReservationStatusesEnum } from '../enum/reservation-statuses.enum';
import { ValidationErrorsEnum } from '../enum/validation-errors.enum';
import { IPayment } from '../interface/payment';
import { PaymentService } from '../service/payment.service';
import { ReservationService } from '../service/reservation.service';
import { TicketStockService } from '../service/ticket-stock.service';
import { TicketService } from '../service/ticket.service';
import { CommonUtil } from '../util/common.util';

export class PaymentRoutes {
    server: FastifyInstance;
    paymentService: PaymentService;
    reservationService: ReservationService;
    ticketStockService: TicketStockService;
    ticketService: TicketService;

    constructor(fastify: FastifyInstance) {
        this.server = fastify;
        this.paymentService = new PaymentService(this.server);
        this.reservationService = new ReservationService(this.server);
        this.ticketStockService = new TicketStockService(this.server);
        this.ticketService = new TicketService(this.server);
    }

    public initEndpoints(): void {
        this.server.register((fastify: FastifyInstance, opts: any, done: any) => {
            fastify.put('/:id', async (request: FastifyRequest, reply: FastifyReply): Promise<any> => {
                const { id } = request.params as any;
                let reservationStatus: { id: number, status: number, deadline: string };

                try {
                    reservationStatus = await this.reservationService.getReservationStatusByPaymentId(id);
                } catch (err: any) {
                    throw new Error(err);
                }

                switch (reservationStatus.status) {
                    case ReservationStatusesEnum.Completed:
                        throw new Error(ValidationErrorsEnum.ReservationAlreadyCompleted);
                    case ReservationStatusesEnum.Cancelled:
                        throw new Error(ValidationErrorsEnum.ReservationCancelled);
                    case ReservationStatusesEnum.Expired:
                        throw new Error(ValidationErrorsEnum.ReservationExpired);
                }

                let deadline: number = (new Date(reservationStatus.deadline)).getTime();

                if (deadline > Date.now()) {
                    let ticketStockIds: number[];

                    try {
                        ticketStockIds = await this.reservationService.setExpireStatus(reservationStatus.id);
                    } catch (err: any) {
                        throw new Error(err);
                    }

                    try {
                        await this.paymentService.cancelPayment(id);
                    } catch (err: any) {
                        throw new Error(err);
                    }

                    let ticketId: number;

                    try {
                        ticketId = await this.ticketStockService.cancelTicketSelling(ticketStockIds);
                    } catch (err: any) {
                        throw new Error(err);
                    }

                    try {
                        await this.ticketService.increaseStockCount(ticketId, ticketStockIds.length);
                    } catch (err: any) {
                        throw new Error(err);
                    }

                    throw new Error(ValidationErrorsEnum.ReservationExpired);
                }

                let reservationId: number;

                try {
                    reservationId = await this.paymentService.completePayment(id);
                } catch (err: any) {
                    throw new Error(err);
                }

                let ticketStockIds: number[];

                try {
                    ticketStockIds = await this.reservationService.completeReservation(reservationId);
                } catch (err: any) {
                    throw new Error(err);
                }

                try {
                    await this.ticketStockService.completeTicketSelling(ticketStockIds);
                } catch (err: any) {
                    throw new Error(err);
                }

                return true;
            });

            fastify.get('/:id', async (request: FastifyRequest, reply: FastifyReply): Promise<any> => {
                const { id } = request.params as any;
                let payment: IPayment;

                try {
                    payment = await this.paymentService.getPayment(id);
                } catch (err: any) {
                    throw new Error(err);
                }

                return payment;
            });

            fastify.delete('/:id', async (request: FastifyRequest, reply: FastifyReply): Promise<any> => {
                const { id } = request.params as any;
                let reservationId: number;

                try {
                    reservationId = await this.paymentService.cancelPayment(id);
                } catch (err: any) {
                    throw new Error(err);
                }

                let ticketStockIds: number[];

                try {
                    ticketStockIds = await this.reservationService.cancelReservation(reservationId);
                } catch (err: any) {
                    throw new Error(err);
                }

                let ticketId: number;

                try {
                    ticketId = await this.ticketStockService.cancelTicketSelling(ticketStockIds);
                } catch (err: any) {
                    throw new Error(err);
                }

                try {
                    await this.ticketService.increaseStockCount(ticketId, ticketStockIds.length);
                } catch (err: any) {
                    throw new Error(err);
                }

                return true;
            });

            done();
        }, { prefix: `${config.api}/payments` });
    }
}