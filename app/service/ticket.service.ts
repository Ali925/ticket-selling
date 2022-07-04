import { FastifyInstance } from "fastify";
import { DBNamesEnum } from "../enum/db-names.enum";

export class TicketService {
    server: FastifyInstance;

    constructor(fastify: FastifyInstance) {
        this.server = fastify;
    }

    public async descreaseStockCount(ticketId: number, reservedCount: number): Promise<boolean> {
        try {
            await (this.server as any).pg.query(
                `UPDATE ${DBNamesEnum.Tickets} SET stock = stock - ${reservedCount} WHERE id = $1 AND stock > 0`, [ticketId],
            );

            return Promise.resolve(true);
        } catch (err) {
            console.error(`[TicketService.descreaseStockCount]: ${err}`);

            return Promise.reject(err);
        }
    }

    public async increaseStockCount(ticketId: number, reservedCount: number): Promise<boolean> {
        try {
            await (this.server as any).pg.query(
                `UPDATE ${DBNamesEnum.Tickets} SET stock = stock + ${reservedCount} WHERE id = $1`, [ticketId],
            );

            return Promise.resolve(true);
        } catch (err) {
            console.error(`[TicketService.increaseStockCount]: ${err}`);

            return Promise.reject(err);
        }
    }
}