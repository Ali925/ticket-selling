import { FastifyInstance } from "fastify";
import { DBNamesEnum } from "../enum/db-names.enum";
import { TicketStatusesEnum } from "../enum/ticket-statuses.enum";

export class TicketStockService {
    server: FastifyInstance;

    constructor(fastify: FastifyInstance) {
        this.server = fastify;
    }

    public async updateTicketStockStatus(ticketStockIds: number[]): Promise<boolean> {
        try {
            let variables: string = '';

            ticketStockIds.forEach((el: number, index: number) => {
                if (index > 0) {
                    variables += `, `;
                }

                variables += `$${index + 1}`;
            });

            await (this.server as any).pg.query(
                `UPDATE ${DBNamesEnum.TicketStocks} SET status = ${TicketStatusesEnum.Pending} WHERE id IN (${variables})`, [...ticketStockIds],
            );

            return Promise.resolve(true);
        } catch (err) {
            console.error(`[TicketStockService.updateTicketStockStatus]: ${err}`);

            return Promise.reject(err);
        }
    }

    public async completeTicketSelling(ticketStockIds: number[]): Promise<boolean> {
        try {
            let variables: string = '';

            ticketStockIds.forEach((el: number, index: number) => {
                if (index > 0) {
                    variables += `, `;
                }

                variables += `$${index + 1}`;
            });

            await (this.server as any).pg.query(
                `UPDATE ${DBNamesEnum.TicketStocks} SET status = ${TicketStatusesEnum.Sold} WHERE id IN (${variables})`, [...ticketStockIds],
            );

            return Promise.resolve(true);
        } catch (err) {
            console.error(`[TicketStockService.completeTicketSelling]: ${err}`);

            return Promise.reject(err);
        }
    }

    public async cancelTicketSelling(ticketStockIds: number[]): Promise<number> {
        try {
            let variables: string = '';

            ticketStockIds.forEach((el: number, index: number) => {
                if (index > 0) {
                    variables += `, `;
                }

                variables += `$${index + 1}`;
            });

            let ticketIdRows: {rows: {ticket_id: number}[]} = await (this.server as any).pg.query(
                `UPDATE ${DBNamesEnum.TicketStocks} SET status = ${TicketStatusesEnum.InStock} WHERE id IN (${variables}) RETURNING ticket_id`, [...ticketStockIds],
            );

            return Promise.resolve(ticketIdRows.rows[0].ticket_id);
        } catch (err) {
            console.error(`[TicketStockService.cancelTicketSelling]: ${err}`);

            return Promise.reject(err);
        }
    }
}