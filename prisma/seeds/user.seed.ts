import { PrismaClient } from "@prisma/client";
import { Role } from "../../generated/prisma/enums";
import config from "../../src/config";


export async function UserSeed(prisma: PrismaClient) {

    const email = config.admin_email

    await prisma.user.update({
        where: {
            email
        },
        data: {
            auth: {
                update: {
                    data: {
                        password: config.admin_password,
                    }
                }
            }
        }
    })

    console.log("Admin password updated successfully");
}