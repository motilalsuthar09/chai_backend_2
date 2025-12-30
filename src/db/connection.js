import mongoose from "mongoose";
import { db_name } from "../constants.js";

const mongo_connection=async()=>{
    try {
        const connection1 = await mongoose.connect(`${process.env.MONGO_URL}/${db_name}`)
        console.log(connection1.connection.host);
        return connection1.connection.asPromise;
    } catch (error) {
        console.log("mongo db connection failed ....!!",error);
        process.exit(1);
    }
}

export default mongo_connection;