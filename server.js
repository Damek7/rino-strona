"use strict";
const http=require("node:http"),fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
const ROOT=__dirname,DATA=path.join(ROOT,"data"),USERS=path.join(DATA,"users.json"),SESSIONS=path.join(DATA,"sessions.json");
const PORT=Number(process.env.PORT||8787),SESSION_TTL=7*24*60*60*1000,MAX_BODY=32_000;
const trainers=[
  {id:"marek-kowalski",name:"Marek Kowalski",discipline:"tenis",district:"Śródmieście",price:220,rating:4.9,reviews:38,level:"Każdy poziom",nextSlot:"2026-07-13T09:30:00+02:00",verified:true,initials:"MK"},
  {id:"julia-nowak",name:"Julia Nowak",discipline:"tenis",district:"Mokotów",price:190,rating:4.8,reviews:24,level:"Dzieci i juniorzy",nextSlot:"2026-07-14T17:00:00+02:00",verified:true,initials:"JN"},
  {id:"pawel-wrona",name:"Paweł Wrona",discipline:"boks",district:"Wola",price:180,rating:5,reviews:19,level:"Początkujący",nextSlot:"2026-07-13T18:30:00+02:00",verified:true,initials:"PW"},
  {id:"anna-sowa",name:"Anna Sowa",discipline:"padel",district:"Wilanów",price:240,rating:4.9,reviews:31,level:"Każdy poziom",nextSlot:"2026-07-18T10:00:00+02:00",verified:true,initials:"AS"},
  {id:"tomasz-lis",name:"Tomasz Lis",discipline:"golf",district:"Ursynów",price:300,rating:4.7,reviews:15,level:"Początkujący",nextSlot:"2026-07-16T12:00:00+02:00",verified:true,initials:"TL"},
  {id:"karolina-zielinska",name:"Karolina Zielińska",discipline:"boks",district:"Praga-Południe",price:170,rating:4.9,reviews:27,level:"Kobiety i juniorzy",nextSlot:"2026-07-15T16:00:00+02:00",verified:true,initials:"KZ"}
];
fs.mkdirSync(DATA,{recursive:true});for(const f of [USERS,SESSIONS])if(!fs.existsSync(f))fs.writeFileSync(f,"[]\n",{mode:0o600});
const read=f=>JSON.parse(fs.readFileSync(f,"utf8")),write=(f,v)=>{const tmp=f+".tmp";fs.writeFileSync(tmp,JSON.stringify(v,null,2)+"\n",{mode:0o600});fs.renameSync(tmp,f)};
const json=(res,status,data,headers={})=>{res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store",...headers});res.end(JSON.stringify(data))};
const body=req=>new Promise((resolve,reject)=>{let raw="";req.on("data",c=>{raw+=c;if(Buffer.byteLength(raw)>MAX_BODY){reject(Object.assign(new Error("Za duże żądanie"),{status:413}));req.destroy()}});req.on("end",()=>{try{resolve(raw?JSON.parse(raw):{})}catch{reject(Object.assign(new Error("Nieprawidłowy JSON"),{status:400}))}});req.on("error",reject)});
const normalizeEmail=v=>String(v||"").trim().toLowerCase(),safeUser=u=>({id:u.id,name:u.name,email:u.email,role:u.role,createdAt:u.createdAt});
const hashPassword=password=>{const salt=crypto.randomBytes(16).toString("hex"),hash=crypto.scryptSync(password,salt,64).toString("hex");return `${salt}:${hash}`};
const passwordMatches=(password,stored)=>{const [salt,expected]=stored.split(":"),actual=crypto.scryptSync(password,salt,64);return crypto.timingSafeEqual(actual,Buffer.from(expected,"hex"))};
function sessionUser(req){const token=(req.headers.authorization||"").replace(/^Bearer\s+/i,"");if(!token)return null;const sessions=read(SESSIONS),now=Date.now(),session=sessions.find(s=>s.token===token&&s.expiresAt>now);if(!session)return null;return read(USERS).find(u=>u.id===session.userId)||null}
function createSession(userId){let sessions=read(SESSIONS).filter(s=>s.expiresAt>Date.now());const token=crypto.randomBytes(32).toString("base64url");sessions.push({token,userId,expiresAt:Date.now()+SESSION_TTL});write(SESSIONS,sessions);return token}
const attempts=new Map();function allowed(ip){const now=Date.now(),r=attempts.get(ip)||{start:now,count:0};if(now-r.start>60_000){r.start=now;r.count=0}r.count++;attempts.set(ip,r);return r.count<=30}
async function api(req,res,url){
  if(!allowed(req.socket.remoteAddress||"local"))return json(res,429,{error:"Za dużo prób. Spróbuj ponownie za minutę."});
  if(req.method==="GET"&&url.pathname==="/api/health")return json(res,200,{ok:true,service:"RinoMove API"});
  if(req.method==="GET"&&url.pathname==="/api/trainers"){
    const q=(url.searchParams.get("q")||"").trim().toLocaleLowerCase("pl"),discipline=(url.searchParams.get("discipline")||"").toLowerCase(),district=(url.searchParams.get("district")||"").toLocaleLowerCase("pl"),maxPrice=Number(url.searchParams.get("maxPrice")||0),page=Math.max(1,Number(url.searchParams.get("page")||1)),limit=Math.min(20,Math.max(1,Number(url.searchParams.get("limit")||10)));
    const found=trainers.filter(t=>(!q||`${t.name} ${t.discipline} ${t.district} ${t.level}`.toLocaleLowerCase("pl").includes(q))&&(!discipline||t.discipline===discipline)&&(!district||t.district.toLocaleLowerCase("pl")===district)&&(!maxPrice||t.price<=maxPrice)).sort((a,b)=>b.rating-a.rating||a.price-b.price);const start=(page-1)*limit;
    return json(res,200,{items:found.slice(start,start+limit),total:found.length,page,limit,filters:{disciplines:["tenis","boks","padel","golf","squash"],districts:[...new Set(trainers.map(t=>t.district))].sort()}});
  }
  if(req.method==="GET"&&url.pathname.startsWith("/api/trainers/")){const trainer=trainers.find(t=>t.id===decodeURIComponent(url.pathname.slice(14)));return trainer?json(res,200,trainer):json(res,404,{error:"Nie znaleziono trenera"})}
  if(req.method==="POST"&&url.pathname==="/api/auth/register"){
    const b=await body(req),name=String(b.name||"").trim(),email=normalizeEmail(b.email),password=String(b.password||""),role=String(b.role||"");
    if(name.length<2||name.length>80)return json(res,422,{error:"Podaj imię i nazwisko (2–80 znaków)."});if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return json(res,422,{error:"Podaj prawidłowy adres e-mail."});if(password.length<10||!/[a-ząćęłńóśźż]/i.test(password)||!/[0-9]/.test(password))return json(res,422,{error:"Hasło musi mieć co najmniej 10 znaków i zawierać cyfrę."});if(!["client","trainer"].includes(role))return json(res,422,{error:"Wybierz typ konta."});if(b.acceptTerms!==true)return json(res,422,{error:"Zaakceptuj regulamin i politykę prywatności."});
    const users=read(USERS);if(users.some(u=>u.email===email))return json(res,409,{error:"Konto z tym adresem już istnieje."});const user={id:crypto.randomUUID(),name,email,role,passwordHash:hashPassword(password),acceptedTermsAt:new Date().toISOString(),createdAt:new Date().toISOString()};users.push(user);write(USERS,users);return json(res,201,{user:safeUser(user),token:createSession(user.id)});
  }
  if(req.method==="POST"&&url.pathname==="/api/auth/login"){const b=await body(req),email=normalizeEmail(b.email),password=String(b.password||""),user=read(USERS).find(u=>u.email===email);if(!user||!passwordMatches(password,user.passwordHash))return json(res,401,{error:"Nieprawidłowy e-mail lub hasło."});return json(res,200,{user:safeUser(user),token:createSession(user.id)})}
  if(req.method==="GET"&&url.pathname==="/api/auth/me"){const user=sessionUser(req);return user?json(res,200,{user:safeUser(user)}):json(res,401,{error:"Sesja wygasła."})}
  if(req.method==="POST"&&url.pathname==="/api/auth/logout"){const token=(req.headers.authorization||"").replace(/^Bearer\s+/i,"");write(SESSIONS,read(SESSIONS).filter(s=>s.token!==token));return json(res,200,{ok:true})}
  return json(res,404,{error:"Nie znaleziono endpointu"});
}
const types={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".png":"image/png",".ico":"image/x-icon"};
const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,"http://localhost");if(url.pathname.startsWith("/api/"))return await api(req,res,url);let rel=decodeURIComponent(url.pathname==="/"?"/index.html":url.pathname),file=path.resolve(ROOT,"."+rel);if(!file.startsWith(ROOT+path.sep)||file.includes(path.sep+"data"+path.sep))return json(res,403,{error:"Brak dostępu"});const stat=fs.existsSync(file)&&fs.statSync(file);if(!stat||!stat.isFile())return json(res,404,{error:"Nie znaleziono strony"});res.writeHead(200,{"Content-Type":types[path.extname(file)]||"application/octet-stream","X-Content-Type-Options":"nosniff","X-Frame-Options":"DENY","Referrer-Policy":"strict-origin-when-cross-origin"});fs.createReadStream(file).pipe(res)}catch(e){if(!res.headersSent)json(res,e.status||500,{error:e.status?e.message:"Błąd serwera"});console.error(e)}});
if(require.main===module)server.listen(PORT,()=>console.log(`RinoMove działa: http://localhost:${PORT}`));
module.exports={server,trainers};
