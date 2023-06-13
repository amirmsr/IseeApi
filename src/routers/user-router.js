import express from "express"
import jsonwebtoken from "jsonwebtoken"
import { User, Video, Comment } from "../mongo.js"
import dotenv from "dotenv"
import bcrypt from "bcrypt"
import { validateUser, validateLogin } from "../middlewares/validation-midleware.js"
import { isRegister, isAdmin, isAdminOrCurrentUser } from "../middlewares/auth-middleware.js"
import { sendVerificationEmail } from "../mailer.js"

const colorPalettes = [
    ['F4D166', 'F7A072', 'E76F51', '6B705C', '264653'],
    ['FF00FF', 'FF0000', 'FFFF00', '00FF00', '00FFFF'],
    ['C0C0C0', '808080', '000000', 'FFFFFF', 'FFD700'],
    ['F72585', 'B5179E', '7209B7', '560BAD', '480CA8'],
    ['FEC5BB', 'FCD5CE', 'FAE1DD', 'F8EDEB', 'E8E8E4'],
    ['F94144', 'F3722C', 'F8961E', 'F9C74F', '90BE6D'],
    ['0A0908', '12100E', '1E201C', '2B2C28', '323934'],
    ['A9BCD0', '58A4B0', '373F51', 'DDBC95', 'B07A46'],
    ['FF0099', 'FF66CC', 'FF99FF', 'CC99FF', '9966FF'],
    ['22223B', '4A4E69', '9A8C98', 'C9ADA7', 'F2E9E4']
];

dotenv.config()

const router = express.Router()

router.get("/", isAdmin, async (request, response) => {
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 10;

    const totalUsers = await User.countDocuments();
    const totalPages = Math.ceil(totalUsers / limit);
    const skip = (page - 1) * limit;

    const users = await User.find().populate("comments").populate({
        path: "videos",
        populate: {
          path: "comments",
          model: "Comment",
        },
    }).skip(skip).limit(limit);;
    response.status(200).json({
        users,
        currentPage: page,
        totalPages
    })
})

router.post("/", validateUser, async (request, response) => {
    const usernameAlreadyExist = await User.exists({"username": request.body.username})
    const emailAlreadyExist = await User.exists({"email": request.body.email})

    if (emailAlreadyExist) {
        response.status(406).json("You already have an account")
        return
    } else if (usernameAlreadyExist) {
        response.status(406).json("This username is not available")
        return
    } else {
        bcrypt.hash(request.body.password, 10, async (error, hashedPasswd) => {
            if (error) {
                response.status(406).json(error)
            } else {
                await sendVerificationEmail(request.body.email, request.body.username)

                const randomColorPalette = colorPalettes[Math.floor(Math.random() * 10)]
                
                const newUser = await User.create({
                    ...request.body,
                    profilePicture: `https://source.boringavatars.com/beam/500/${request.body.username}?colors=${randomColorPalette[0]},${randomColorPalette[1]},${randomColorPalette[2]},${randomColorPalette[3]},${randomColorPalette[4]}`,
                    password: hashedPasswd
                })
                response.status(201).json(newUser)
            }
        })
    }
})

router.post("/login", validateLogin, async  (request, response) => {
    const user = await User.findOne({"username": request.body.username})

    if (!user) {
        response.status(404).json("User not found");
        return;
    }

    if (!user.verified) {
        response.status(401).json("Please verify your account");
        return;
    }

    bcrypt.compare(request.body.password, user.password, (error, result) => {
        if (error) {
            response.status(500).json(error)
            return
        }
        if (result) {
            const token = jsonwebtoken.sign({name: request.body.username}, process.env.SECRET, {expiresIn: 1000})
            response.status(201).json( {"user": user.username, "isAdmin": user.isAdmin, "token": token });
        } else {
            response.status(400).json("Incorrect password")
        }
    })
})

router.post("/logout", isRegister, async  (request, response) => {
    response.status(201).json("Success Logout")
})


//TODO Faire la page de verification et mettre la requette en patch

router.get("/verify", async (request, response) => {
    const token = request.query.token
    jsonwebtoken.verify(token, process.env.SECRET, async (error, req) => {
        if (error) {
            response.status(403).send(error.message)
            return
        }

        const user = await User.findOneAndUpdate({"email": req.email}, {"verified": true}, {new:true})
        
        if (!user) {
            response.status(404).send("User not found")
            return
        }

        response.status(200).send("Mail verified succesfully")
    })
})

router.get("/profil", isRegister, async (request, response) => {
    console.log("username: " + request.username)
    const user = await User.findOne({ username: request.username }).populate("comments").populate({
        path: "videos",
        populate: {
          path: "comments",
          model: "Comment",
        },
    });
    response.status(200).json(user)
});


router.get("/:username", isAdminOrCurrentUser, async (request, response) => {
    const username = request.params.username;
    const user = await User.findOne({ username: username }).populate("comments").populate({
        path: "videos",
        populate: {
          path: "comments",
          model: "Comment",
        },
    });
    response.status(200).json(user)
});


router.put("/:username", isAdminOrCurrentUser, async (request, response) => {
    const username = request.params.username
    const user = await User.findOne({"username": username})
    
    if (request.body.username && user.username != request.body.username) {
        const usernameAlreadyExist = await User.exists({"username": request.body.username})
        if (usernameAlreadyExist) {
            response.status(406).json("This username is not available")
            return
        } else {
            await Video.updateMany({"username": user.username}, {"username": request.body.username})
            await Comment.updateMany({"username": user.username}, {"username": request.body.username})
            user.username = request.body.username
            await user.save()
        }
    }

    if (request.body.email && user.email != request.body.email) {
        const emailAlreadyExist = await User.exists({"email": request.body.email})
        if (emailAlreadyExist) {
            response.status(406).json("An account with this email already exist")
            return
        } else {
            user.email = request.body.email
            await user.save()
        }
    }

    if (request.body.password) {
        bcrypt.hash(request.body.password, 10, async (error, hashedPasswd) => {
            if (error) {
                response.status(406).json(error)
            } else {
                const updatedUser = await User.findByIdAndUpdate(user.id, {
                    ...request.body,
                    password: hashedPasswd
                })
                response.status(201).json(updatedUser)
            }
        })
    }

    response.status(200).json(user)
})

router.delete("/:username", isAdminOrCurrentUser, async (request, response) => {
    const username = request.params.username
    const user = await User.findOneAndDelete({username:username})
    await Video.deleteMany({"username": username})
    await Comment.deleteMany({"username": username})
    response.status(204).json(`User '${user.username}' and videos deleted succesfully`)
})

export default router