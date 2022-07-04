import shell, { cat } from 'shelljs';
import { FastifyInstance } from 'fastify';
import { IDBConfig } from '../interface/config';
import { config } from '../../config';
import { TicketTypesEnum } from '../enum/ticket-types.enum';
import { IUser } from '../interface/user';
import { DBNamesEnum } from '../enum/db-names.enum';
import { TicketStatusesEnum } from '../enum/ticket-statuses.enum';

export class DatabaseService {
    server: FastifyInstance;

    constructor(fastify: FastifyInstance) {
        this.server = fastify;
    }

    private async createTables(): Promise<void> {
        await (this.server as any).pg.query(
            `
            CREATE TABLE IF NOT EXISTS public.users
            (
                id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
                username character varying(30) COLLATE pg_catalog."default" NOT NULL,
                email character varying(30) COLLATE pg_catalog."default" NOT NULL,
                password character varying(100) COLLATE pg_catalog."default" NOT NULL,
                CONSTRAINT users_pkey PRIMARY KEY (id)
            )

            TABLESPACE pg_default;

            ALTER TABLE IF EXISTS public.users
                OWNER to ${config.postgresSQL.username};

            CREATE TABLE IF NOT EXISTS public.tickets
            (
                id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
                name character varying(100) COLLATE pg_catalog."default" NOT NULL,
                type smallint NOT NULL,
                deadline timestamp without time zone NOT NULL,
                stock integer NOT NULL,
                CONSTRAINT tickets_pkey PRIMARY KEY (id)
            )

            TABLESPACE pg_default;

            ALTER TABLE IF EXISTS public.tickets
                OWNER to ${config.postgresSQL.username};

            CREATE TABLE IF NOT EXISTS public.ticket_stocks
            (
                ticket_id integer NOT NULL,
                status smallint NOT NULL,
                price bigint NOT NULL,
                "row" smallint NOT NULL,
                seat smallint NOT NULL,
                id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
                CONSTRAINT ticket_stocks_pkey PRIMARY KEY (id),
                CONSTRAINT ticket_id_row_seat UNIQUE (ticket_id, "row", seat),
                CONSTRAINT ticket_stocks_tickets FOREIGN KEY (ticket_id)
                    REFERENCES public.tickets (id) MATCH SIMPLE
                    ON UPDATE NO ACTION
                    ON DELETE NO ACTION
                    NOT VALID
            )

            TABLESPACE pg_default;

            ALTER TABLE IF EXISTS public.ticket_stocks
                OWNER to ${config.postgresSQL.username};

            CREATE TABLE IF NOT EXISTS public.reservations
            (
                id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
                date timestamp without time zone NOT NULL,
                user_id integer NOT NULL,
                status smallint NOT NULL,
                deadline timestamp without time zone NOT NULL,
                ticket_stock_ids integer[] NOT NULL,
                CONSTRAINT reservations_pkey PRIMARY KEY (id),
                CONSTRAINT reservations_users FOREIGN KEY (user_id)
                    REFERENCES public.users (id) MATCH SIMPLE
                    ON UPDATE NO ACTION
                    ON DELETE NO ACTION
                    NOT VALID
            )

            TABLESPACE pg_default;

            ALTER TABLE IF EXISTS public.reservations
                OWNER to ${config.postgresSQL.username};

            CREATE TABLE IF NOT EXISTS public.payments
            (
                id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
                reservation_id integer NOT NULL,
                user_id integer NOT NULL,
                amount bigint NOT NULL,
                status smallint NOT NULL,
                date timestamp without time zone NOT NULL,
                CONSTRAINT payments_pkey PRIMARY KEY (id),
                CONSTRAINT payments_reservations FOREIGN KEY (reservation_id)
                    REFERENCES public.reservations (id) MATCH SIMPLE
                    ON UPDATE NO ACTION
                    ON DELETE NO ACTION
                    NOT VALID,
                CONSTRAINT payments_users FOREIGN KEY (user_id)
                    REFERENCES public.users (id) MATCH SIMPLE
                    ON UPDATE NO ACTION
                    ON DELETE NO ACTION
                    NOT VALID
            )
            
            TABLESPACE pg_default;
            
            ALTER TABLE IF EXISTS public.payments
                OWNER to ${config.postgresSQL.username};
                
            CREATE INDEX IF NOT EXISTS fki_ticket_stocks_tickets
            ON public.ticket_stocks USING btree
            (ticket_id ASC NULLS LAST)
            TABLESPACE pg_default;

            CREATE INDEX IF NOT EXISTS fki_reservations_users
            ON public.reservations USING btree
            (user_id ASC NULLS LAST)
            TABLESPACE pg_default;

            CREATE INDEX IF NOT EXISTS fki_payments_reservations
            ON public.payments USING btree
            (reservation_id ASC NULLS LAST)
            TABLESPACE pg_default;

            CREATE INDEX IF NOT EXISTS fki_payments_users
            ON public.payments USING btree
            (user_id ASC NULLS LAST)
            TABLESPACE pg_default;
            `
        );
    }

    public async populateDefaultUser(): Promise<void> {
        await (this.server as any).pg.query(
            `
            INSERT INTO public.users(
                username, email, password)
                VALUES ('john.smith123', 'john@smith.com',
                        '5937bf4bc1dcc483b34aa7cbbb754875');
            `
        );
    }

    public async populateDefaultTicket(): Promise<void> {
        let deadline: Date = new Date();
        deadline.setMonth(deadline.getMonth() + 1);

        await (this.server as any).pg.query(
            `
            INSERT INTO public.tickets(
                name, type, deadline, stock)
                VALUES ('Spider-Man: No Way Home (Bow Tie Cinemas Movieland 6)', ${TicketTypesEnum.Even}, $1, 4),
                       ('Elvis (Regal Aviation Mall)', ${TicketTypesEnum.AllTogether}, $2, 5),
                       ('MINIONS: THE RISE OF GRU (Rotterdam Square Cinema)', ${TicketTypesEnum.AvoidOne}, $3, 3);
            `,
            [deadline.toISOString(), deadline.toISOString(), deadline.toISOString()]
        );
    }

    public async populateDefaultTicketStock(): Promise<void> {
        let deadline: Date = new Date();
        deadline.setMonth(deadline.getMonth() + 1);

        await (this.server as any).pg.query(
            `
            INSERT INTO public.ticket_stocks(
                ticket_id, status, price, row, seat)
                VALUES (1, ${TicketStatusesEnum.InStock}, 25, 2, 3),
                    (1, ${TicketStatusesEnum.InStock}, 25, 2, 4),
                    (1, ${TicketStatusesEnum.InStock}, 25, 2, 5),
                    (1, ${TicketStatusesEnum.InStock}, 25, 2, 6),
                    (2, ${TicketStatusesEnum.InStock}, 15, 3, 10),
                    (2, ${TicketStatusesEnum.InStock}, 15, 3, 11),
                    (2, ${TicketStatusesEnum.InStock}, 15, 3, 12),
                    (2, ${TicketStatusesEnum.InStock}, 12, 4, 1),
                    (2, ${TicketStatusesEnum.InStock}, 12, 4, 2),
                    (3, ${TicketStatusesEnum.InStock}, 10, 1, 1),
                    (3, ${TicketStatusesEnum.InStock}, 10, 2, 4),
                    (3, ${TicketStatusesEnum.InStock}, 8, 3, 2);
            `
        );
    }

    public async updateDB(): Promise<void> {
        let users: { rows: IUser[] } | null = null;

        try {
            users = await (this.server as any).pg.query(
                `SELECT id FROM ${DBNamesEnum.Users} LIMIT 1`
            );
        } catch (err) {
            console.error(`[DatabaseService.updateDB]: ${err}`);
        }

        if (users?.rows?.length) {
            return Promise.resolve();
        }

        try {
            await this.createTables();
            await this.populateDefaultUser()
            await this.populateDefaultTicket();
            await this.populateDefaultTicketStock();
        } catch (err) {
            console.error(`[DatabaseService.updateDB]: ${err}`)
        }
    }

    public async initDB(options: IDBConfig): Promise<void> {
        try {
            await this.server.register(require('@fastify/postgres'), {
                connectionString: `postgres://${options.username}:${options.password}@${options.host}:${options.port}/${options.dbName}`
            });
        } catch (err) {
            console.error(`[DatabaseService.initDB]: ${err}`)
        }
    }
}
