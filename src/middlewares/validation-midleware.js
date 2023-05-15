import yup from "yup"
import mongoose from "mongoose"

function validate(schema) {
    return async (request, response, next) => {
        try {
            await schema.validate({
                body: request.body
            })
            next()
        } catch (error) {
            response.status(400).json(error.message)
        }
    }
}

const userVerifSchema = yup.object({
    body: yup.object({
        email: yup.string().email().required(),
        username: yup.string().min(3).required(),
        password: yup.string().min(3).required(),
        role: yup.string().oneOf(["admin", "user"]).notRequired(),
        videos: yup.array().notRequired()
    })
})

const loginVerifSchema = yup.object({
    body: yup.object({
        username: yup.string().required(),
        password: yup.string().required()
    })
})

const videoVerifSchema = yup.object({
    body: yup.object({
        nom_fichier: yup.string().required()
    })
})

const commentVerifSchema = yup.object({
    body: yup.object({
        contenu: yup.string().required()
    })
})

export const validateUser = validate(userVerifSchema);
export const validateLogin = validate(loginVerifSchema);
export const validateVideo = validate(videoVerifSchema);
export const validateComment = validate(commentVerifSchema);
export const validateParamId = (request, response, next) => {
    if (mongoose.isValidObjectId(request.params.id) || mongoose.isValidObjectId(request.query.videoId)) {
        next()
    } else {
        response.status(400).json("Invalid id in query")
    }
}