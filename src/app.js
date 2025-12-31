import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser' 
const app=express();

//body parser ,cookies ,cookie parser , cors 

app.use(cors({
    origin:process.env.CORS_ORGN,
    credentials:true,
}))

app.use(express.json({
    limit:"16kb",
}))

app.use(express.urlencoded({
    extended:true,
    limit:"16kb"
}))

app.use(express.static("public"))

app.use(cookieParser())

export default app;
