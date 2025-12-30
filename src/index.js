import dotenv from 'dotenv';
dotenv.config({path:'./env'})

import mongo_connection from "/coding/Backend/chaiaurbackend/src/db/connection.js"
import express from 'express';
import mongoose from 'mongoose'
import { db_name } from './constants.js';
const app=express();

mongo_connection().then((result) => {
    app.listen(process.env.PORT || 4000,()=>{
        console.log('connection successfully esatabilished...',result);
        
    });
    app.on("error",(err)=>{
        console.log('error while estabilishing connection ',err);
        throw err;
    })
}).catch((err) => {
    console.log('mongodb connection failed.... ');
    
});
app.get("/",(req,res)=>{
res.send("page is saying hello....");
})













/*
;(async()=>{
    try {
         const connection=await mongoose.connect(`${process.env.MONGO_URL}/${db_name}`);
         app.listen("process.env.PORT || 4000",()=>{
            console.log('connection establsilished' ,process.env.PORT);
            
         })
         app.on("erroe",(error)=>{
            console.log('express error while connecting to mongodb',error);
            throw error;
            
         })
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
})()
*/