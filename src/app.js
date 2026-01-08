import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
const app=express()
//body parser ,cookies ,cookie parser , cors 
app.use(cors({
    origin: process.env.CORS_ORGN,
    credentials: true,
}))
app.use(express.json({
    limit: "16kb",
}))
app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}))
app.use(express.static("public"))
app.use(cookieParser())

//routes
import userRouter from './routes/user.routes.js'

//routes declaration 
app.use("/api/v1/users", userRouter);
// https://localhost:8000/api/v1/users/register


// app.use((err, req, res, next) => {
//   console.error("Global error:", err);
//   res.status(err.code || 500).json({
//     success: false,
//     message: err.message || "Internal Server Error"
//   });
// });

export default app;
