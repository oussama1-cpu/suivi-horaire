const fs=require('fs');
const url=fs.readFileSync('.env.local','utf8').match(/DATABASE_URL="([^"]*)"/)[1];
const{neon}=require('@neondatabase/serverless');
const sql=neon(url);
const crypto=require('crypto');
(async()=>{
  const tok=crypto.randomUUID();
  const admin=await sql`SELECT id FROM profiles WHERE email='admin@demo.com'`;
  await sql`INSERT INTO sessions (token,profile_id,expires) VALUES (${tok},${admin[0].id},${Date.now()+3600000})`;
  console.log('TOKEN='+tok);
})().catch(e=>console.log('ERR',e.message));
