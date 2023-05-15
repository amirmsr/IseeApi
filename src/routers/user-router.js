import express from "express"
import jsonwebtoken from "jsonwebtoken"
import dotenv from "dotenv"
import { User } from "../mongo.js"
import bcrypt from "bcrypt"
import { validateUser, validateLogin, validateParamId } from "../middlewares/validation-midleware.js"
import { isRegister, isAdmin } from "../middlewares/auth-middleware.js"
import { sendVerificationEmail } from "../mailer.js"

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the user
 *           example: 6087c295fc13ae720001f7d3
 *         email:
 *           type: string
 *           description: The email address of the user
 *           example: john.doe@example.com
 *         username:
 *           type: string
 *           description: The username of the user
 *           example: johndoe
 *         role:
 *           type: string
 *           description: The role of the user
 *           example: user
 *         verified:
 *           type: boolean
 *           description: Whether the user's email address has been verified
 *           example: true
 *         videos:
 *           type: array
 *           description: An array of videos uploaded by the user
 *           items:
 *             $ref: '#/components/schemas/Video'
 *     Login:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *         password:
 *           type: string
 * tags:
 *   name: User
 *   description: Operations about users
 */

dotenv.config()

const router = express.Router()

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: The created user.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       406:
 *         description: Not acceptable, user already exists
 *
 */

router.post("/", validateUser, async (request, response) => {
    const usernameAlreadyExist = await User.exists({"username": request.body.username})
    const emailAlreadyExist = await User.exists({"email": request.body.email})
    if (!usernameAlreadyExist && !emailAlreadyExist) {
        bcrypt.hash(request.body.password, 10, async (error, hashedPasswd) => {
            if (error) {
                response.status(406).json(error)
            } else {
                await sendVerificationEmail(request.body.email, request.body.username)
                const newUser = await User.create({
                    ...request.body,
                    password: hashedPasswd
                })
                response.status(201).json(newUser)
            }
        })
    } else {
        usernameAlreadyExist ? response.status(406).json("Not acceptable, username already exists") : response.status(406).json("Not acceptable, email already exists")
    }
})

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Log user into system
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Login'
 *     responses:
 *       201:
 *         description: The logged user.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       500:
 *         description: Password could not be encrypted
 *       404:
 *         description: User not found
 *       401:
 *         description: Incorrect password
 */

router.post("/login", validateLogin, async  (request, response) => {
    const user = await User.findOne({"username": request.body.username})

    if (user === null) {
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
            const token = jsonwebtoken.sign({name: request.body.username}, process.env.SECRET, {expiresIn: 600})
            response.status(201).json( {"status": "Success Login", "user": user.username, "role": user.role, "token": token });
        } else {
            response.status(400).json("Incorrect password")
        }
    })
})

/**
 * @swagger
 * /users/logout:
 *   post:
 *     summary: Log user out of system
 *     tags: [User]
 *     requestBody:
 *       required: false
 *     responses:
 *       201:
 *         description: The status.
 *       404:
 *         description: User not found
 */

router.post("/logout", isRegister, async  (request, response) => {
    response.status(201).json("Success Logout")
})

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Retrieve current user account
 *     tags: [User]
 *     responses:
 *       200:
 *         description: The user's profile.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       403:
 *         description: Invalid token
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */

router.get("/profile", isRegister, async (request, response) => {
    const user = await User.findOne({"username": request.username})
    response.status(200).json(user);
})

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Update current user account
 *     tags: [User]
 *     responses:
 *       200:
 *         description: The user's updated profile.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       403:
 *         description: Invalid token
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */

router.put("/profile", isRegister, async (request, response) => {
    bcrypt.hash(request.body.password, 10, async (error, hashedPasswd) => {
        if (error) {
            response.status(406).json(error)
        } else {
            const user = await User.findOneAndUpdate({"username": request.username}, {
                ...request.body,
                password: hashedPasswd
            }, {new:true})
            response.status(200).json({"status": "User info updated succesfully", "user": user})
        }
    })
})

/**
 * @swagger
 * /users/profile:
 *   delete:
 *     summary: Delete current user account
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Profile deleted succesfully
 *       403:
 *         description: Invalid token
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */

router.delete("/profile", isRegister, async (request, response) => {
    await User.deleteOne({"username": request.username})
    response.status(200).json("Profile deleted succesfully")
    response.end()
})

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Retrieve all users (for admin)
 *     tags: [User]
 *     responses:
 *       200:
 *         description: All users.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       403:
 *         description: Invalid token
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */

router.get("/", async (request, response) => {
    const users = await User.find()
    response.status(200).json(users)
})

/**
 * @swagger
 * /users/verify:
 *   get:
 *     summary: Verify user email using token
 *     tags: [User]
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Verification token sent to the user's email
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       404:
 *         description: User not found
 *       403:
 *         description: Invalid token
 */


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

/**
 * @swagger
 * /users/{userId}:
 *   get:
 *     summary: Retrieve user by ID (for admin)
 *     tags: [User]
 *     parameters:
 *       - name: userId
 *         schema:
 *            type: string
 *         required: true
 *         in: path
 *     responses:
 *       200:
 *         description:  User's profile.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       403:
 *         description: Invalid token
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */

/* router.get("/:id", [validateParamId], async (request, response) => {
    const id = request.params.id
    const user = await User.findById(id)
    user ? response.status(200).json(user) : response.status(404).json("User not found")
}) */

router.get("/:username", async (request, response) => {
    const { username } = request.params;
    const user = await User.findOne({ username: username });
    user ? response.status(200).json(user) : response.status(404).json("User not found");
});


/**
 * @swagger
 * /users/{userId}:
 *   put:
 *     summary: Update user by ID (for admin)
 *     tags: [User]
 *     parameters:
 *       - name: userId
 *         schema:
 *            type: string
 *         required: true
 *         in: path
 *     responses:
 *       200:
 *         description:  User's updated profile.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       403:
 *         description: Invalid token
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */

router.put("/:id", [isAdmin, validateParamId], async (request, response) => {
    const id = request.params.id
    bcrypt.hash(request.body.password, 10, async (error, hashedPasswd) => {
        if (error) {
            response.status(406).json(error)
        } else {
            const newUser = await User.findByIdAndUpdate(id, {
                ...request.body,
                password: hashedPasswd
            }, {new: true})
            newUser ? response.status(200).json(newUser) : response.status(404).json("User not found")
        }
    })
})

/**
 * @swagger
 * /users/{userId}:
 *   delete:
 *     summary: Delete user by ID (for admin)
 *     tags: [User]
 *     parameters:
 *       - name: userId
 *         schema:
 *            type: string
 *         required: true
 *         in: path
 *     responses:
 *       200:
 *         description:  User deleted succesfully.
 *       403:
 *         description: Invalid token
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */

router.delete("/:id", [isAdmin, validateParamId], async (request, response) => {
    const id = request.params.id
    const user = await User.findByIdAndDelete(id)
    user ? response.status(200).json(`User '${user.username}' deleted succesfully`) : response.status(404).json("User not found")
})
















export default router