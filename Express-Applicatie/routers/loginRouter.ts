import express, { Router, Request, Response } from "express";
import { login } from "../database";
import { User } from "../interfaces";
import { checkLogin } from "../middleware/secureMiddleware";

export function loginRouter(): Router {
    const router = express.Router();

    router.get("/login", checkLogin, (req: Request, res: Response) => {
        res.render("login");
    });

    router.post("/login", async (req: Request, res: Response) => {
        const email: string = req.body.email;
        const password: string = req.body.password;
        try {
            const user: User = await login(email, password);
            delete user.password;
            if (req.session) {
                req.session.user = {
                    ...user,
                    _id: user._id ? user._id.toString() : undefined
                };
            }
            res.redirect("/");
        } catch (e: any) {
            res.redirect("/login");
        }
    });

    router.post("/logout", (req: Request, res: Response) => {
        req.session.destroy(() => {
            res.redirect("/login");
        });
    });

    return router;
}