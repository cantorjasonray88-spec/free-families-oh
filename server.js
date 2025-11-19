import express from 'express';
import fs from 'fs';
import nodemailer from 'nodemailer';
import basicAuth from 'express-basic-auth';

const app = express();
app.use(express.json());
app.use(express.static('./'));

const FILE='./cases.json';

function loadCases(){ return fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE)) : []; }
function saveCases(c){ fs.writeFileSync(FILE, JSON.stringify(c,null,2)); }

// Email setup (configure your SMTP server)
const transporter = nodemailer.createTransport({
  host:"smtp.example.com",
  port:587,
  secure:false,
  auth:{ user:"user@example.com", pass:"password" }
});

// Submit case
app.post('/api/submit-case', async (req,res)=>{
  const cases=loadCases();
  const entry={...req.body,timestamp:Date.now()};
  cases.push(entry);
  saveCases(cases);

  // email notification
  try{
    await transporter.sendMail({
      from:"no-reply@freefamiliesoh.org",
      to:"admin@freefamiliesoh.org",
      subject:"New Case Submitted",
      text:`New case:
${JSON.stringify(entry,null,2)}`
    });
  }catch(e){ console.log("Email failed:",e.message); }

  res.json({status:'ok'});
});

// Admin auth
app.use('/admin', basicAuth({ users:{ 'admin':'password' }, challenge:true }));
app.use('/admin', express.static('./admin.html'));

// API list
app.get('/api/list-cases',(req,res)=> res.json(loadCases()));

// Delete case
app.delete('/api/delete-case/:id',(req,res)=>{
  const id=parseInt(req.params.id);
  const cases=loadCases();
  cases.splice(id,1);
  saveCases(cases);
  res.json({status:'deleted'});
});

app.listen(3000,()=>console.log("Running on 3000"));
