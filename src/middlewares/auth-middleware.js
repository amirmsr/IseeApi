import dotenv from "dotenv"
import jsonwebtoken from "jsonwebtoken"
import { User, Video, Comment } from "../mongo.js"

dotenv.config()

export const isAdmin = (request, response, next) => {
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

        if (user.isAdmin) {
            request.username = req.name
            next();
        } else {
            response.status(401).send("Unauthorized");
            return
        }
    })
}

export const isRegister = (request, response, next) => {
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

        request.username = req.name
        next();
    })
}

export const isAdminOrCurrentUser = (request, response, next) => {
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

        if (user.isAdmin || request.params.username === user.username) {
            next();
        } else {
            response.status(401).send("Unauthorized");
        }
    })
}

export const isAdminOrVideoOwner = (request, response, next) => {
    const token = request.headers.token
    const videoId = request.params.id

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

        const video = await Video.findById(videoId)

        if (!video) {
            response.status(404).send("Video not found")
            return
        }

        if (user.isAdmin || video.username === user.username) {
            next();
        } else {
            response.status(401).send("Unauthorized");
        }
    })
}

export const isAdminOrCommentOwner = (request, response, next) => {
    const token = request.headers.token
    const commentId = request.params.id

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

        const video = await Video.findOne({"username": req.name})
        
        if (!video) {
            response.status(404).send("Video not found")
            return
        }

        const comment = await Comment.findById(commentId)

        if (!comment) {
            response.status(404).send("Comment not found")
            return
        }

        if (user.isAdmin || comment.username === video.username) {
            request.username = req.name
            next();
        } else {
            response.status(401).send("Unauthorized");
        }
    })
}