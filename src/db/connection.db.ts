import { connect } from "mongoose"
const connectDB = async():Promise<void>=>{
   try {
     await connect(process.env.DB_URI as string,{serverSelectionTimeoutMS:3000});
      console.log("Database connected successfully"); 
    } catch (error) 
    { 
      console.error("Error connecting to database:", error); 
    } 
  } 
export default connectDB;