import { TicketTypesEnum } from "../enum/ticket-types.enum";

export interface ITicket {
    id: number;
    name: string;
    type: TicketTypesEnum;
    deadline: Date;
    stock: number;
}