import dotenv from "dotenv"
import jsonwebtoken from "jsonwebtoken"
import { User, Video, Comment } from "../mongo.js"

dotenv.config()

export const verifyJwt = async (token) => {
    const jwt = jsonwebtoken.verify(token, process.env.SECRET, async (error, req) => {
        if (error) {
            return
        }

        const user = await User.findOne({"username": req.name})

        return user
    })

    return jwt
}

export const isAdmin = async (request, response, next) => {
    const user = await verifyJwt(request.cookies.jwt)

    if (!user) {
        response.status(404).send("User not found")
        return
    }

    if (user.isAdmin) {
        request.username = user.name
        next();
    } else {
        response.status(401).send("Unauthorized");
        return
    }
}

export const isRegister =  async (request, response, next) => {
    const user = await verifyJwt(request.cookies.jwt)

    if (!user) {
        response.status(404).send("User not found")
        return
    }

    request.username = user.username
    next();
}

export const isAdminOrCurrentUser = async (request, response, next) => {
    const user = await verifyJwt(request.cookies.jwt)

    if (!user) {
        response.status(404).send("User not found")
        return
    }

    if (user.isAdmin || request.params.username === user.username) {
        next();
    } else {
        response.status(401).send("Unauthorized");
    }
}

export const isAdminOrVideoOwner = async (request, response, next) => {
    const user = await verifyJwt(request.cookies.jwt)
    const videoId = request.params.id

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
}

export const isAdminOrCommentOwner = async (request, response, next) => {
    const user = await verifyJwt(request.cookies.jwt)
    const commentId = request.params.id

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
        request.username = user.name
        next();
    } else {
        response.status(401).send("Unauthorized");
    }
}