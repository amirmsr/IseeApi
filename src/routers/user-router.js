import express from "express"
import jsonwebtoken from "jsonwebtoken"
import { User, Video, Comment } from "../mongo.js"
import bcrypt from "bcrypt"
import { validateUser, validateLogin } from "../middlewares/validation-midleware.js"
import { isRegister, isAdmin, isAdminOrCurrentUser } from "../middlewares/auth-middleware.js"
import { sendVerificationEmail } from "../mailer.js"

const colorPalettes = [
    ["69d2e7", "a7dbd8", "e0e4cc", "f38630", "fa6900"],
    ["fe4365", "fc9d9a", "f9cdad", "c8c8a9", "83af9b"],
    ["ecd078", "d95b43", "c02942", "542437", "53777a"],
    ["556270", "4ecdc4", "c7f464", "ff6b6b", "c44d58"],
    ["774f38", "e08e79", "f1d4af", "ece5ce", "c5e0dc"],
    ["e8ddcb", "cdb380", "036564", "033649", "031634"],
    ["490a3d", "bd1550", "e97f02", "f8ca00", "8a9b0f"],
    ["594f4f", "547980", "45ada8", "9de0ad", "e5fcc2"],
    ["00a0b0", "6a4a3c", "cc333f", "eb6841", "edc951"],
    ["e94e77", "d68189", "c6a49a", "c6e5d9", "f4ead5"]
];

const router = express.Router()

router.get("/", isAdmin, async (request, response) => {
    const users = await User.find().populate("comments").populate({
        path: "videos",
        populate: {
          path: "comments",
          model: "Comment",
        },
    });
    response.status(200).json(users)
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