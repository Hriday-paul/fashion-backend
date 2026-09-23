import { PrismaClient } from "@prisma/client";
import { Role } from "../../generated/prisma/enums";
import config from "../../src/config";


export async function UserSeed(prisma: PrismaClient) {

    //dlt extsing admin
    await prisma.user.deleteMany({
        where: {
            auth: {
                role: Role.ADMIN
            }
        }
    });

    const email = config.admin_email

    await prisma.user.create({
        data: {
            fname: "Admin",
            phone: "423232323",
            email,
            auth: {
                create: {
                    password: "$2b$15$v81mi/9xqobxl7EknUBPCuaRki5yZqFLr8h3FusXvE1JfzZXtoGgm",
                    email,
                    isverified: true,
                    approval_status : "Approved",
                    role: Role.ADMIN
                }
            }
        }
    })

    console.log("users created");
}