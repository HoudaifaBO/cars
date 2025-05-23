import { NextFunction, Request, Response } from "express";

export function secureMiddleware(req: Request, res: Response, next: NextFunction) {
    if (req.session.user) {
        res.locals.user = req.session.user;
        next();
    } else {
        res.redirect("/login");
    }
};

export function checkLogin(req: Request, res: Response, next: NextFunction) {
    if (req.session.user) {
        return res.redirect("/");
    }
    next();
}

export function ensureAdmin(req: Request, res: Response, next: NextFunction) {
    if (req.session.user && req.session.user.role === "ADMIN") {
        next();
    } else {
        res.status(403).send("Access denied. Admins only.");
    }
}