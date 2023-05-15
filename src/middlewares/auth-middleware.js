import dotenv from "dotenv"
import jsonwebtoken from "jsonwebtoken"
import { User } from "../mongo.js"

dotenv.config()

function isValidUser(authorizedValue, optAuthorizedValue = undefined) {
    return (request, response, next) => {
        const token = request.headers.token

        jsonwebtoken.verify(token, process.env.SECRET, async (error, req) => {
            if (error) {
                response.status(403).send(error.message)
                return
            }

            const user = await User.findOne({"username": req.name})
            
            if (!user) {
                response.status(404).send("User not found")
                return
            }

            const authorization = user.role

            if ((authorization === authorizedValue && optAuthorizedValue === undefined) || (authorization === authorizedValue || authorization === optAuthorizedValue)) {
                request.username = req.name
                next();
            } else {
                response.status(401).send("User is not authorized to access this page");
                return
            }
        })
    };
}

export const isAdmin = isValidUser("admin");
export const isRegister = isValidUser("admin", "user")