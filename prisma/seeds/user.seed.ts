import { PrismaClient } from "@prisma/client";
import { Role } from "../../generated/prisma/enums";
import config from "../../src/config";


export async function UserSeed(prisma: PrismaClient) {

    const email = config.admin_email

    await prisma.user.create({
        data: {
            fname: "Admin",
            phone: "423232323",
            email,
            auth: {
                create: {
                    password: config.admin_password,
                    email,
                    isverified: true,
                    approval_status : "Approved",
                    role: Role.ADMIN
                }
            }
        }
    })

    console.log("Admin created");
}