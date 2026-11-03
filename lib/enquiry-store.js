import {MongoClient} from 'mongodb';let connection;
export async function enquiryStore(){
 if(!process.env.MONGODB_URI)throw Error('Enquiry storage unavailable');
 if(!connection)connection=(async()=>{const client=await new MongoClient(process.env.MONGODB_URI,{serverSelectionTimeoutMS:5000,connectTimeoutMS:5000}).connect();const db=client.db();const enquiries=db.collection('portfolio_enquiries'),limits=db.collection('portfolio_enquiry_limits');await Promise.all([enquiries.createIndex({createdAt:-1}),limits.createIndex({expiresAt:1},{expireAfterSeconds:0})]);return {enquiries,limits};})().catch(e=>{connection=null;throw e;});return connection;
}
