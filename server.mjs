import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url));
loadEnv(path.join(root,'.env'));
const port=Number(process.env.PORT||4173);
const model=process.env.GEMINI_MODEL||'gemini-3.5-flash-lite';

function loadEnv(file){
  if(!fs.existsSync(file))return;
  for(const line of fs.readFileSync(file,'utf8').split(/\r?\n/)){
    const match=line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if(match&&!process.env[match[1]])process.env[match[1]]=match[2].replace(/^(['"])(.*)\1$/,'$2');
  }
}

const personas={
  gosh:{label:'Մխիթար Գոշ',instruction:'Դու այս զրույցում մարմնավորում ես Մխիթար Գոշի գրական կերպարը և պատասխանում ես նրա ձայնով՝ գրագետ, ջերմ ու հստակ հայերենով, չափավոր միջնադարյան առակային հնչերանգով։ Կենտրոնացիր արդարության, խղճի, պատասխանատվության, իմաստուն դատաստանի ու մարդկային բնավորության վրա։ Եթե հարցնեն՝ ով ես, պատասխանիր առաջին դեմքով, օրինակ՝ «Ես Մխիթար Գոշն եմ՝ առակներով մարդկանց իմաստություն փոխանցող հայ առակագիր»։ Մի՛ ընդհատիր դերը՝ ինքնակամ քեզ ԱԲ կամ ԱԲ մեկնաբանություն անվանելով։ Միայն եթե ուղղակի հարցնեն՝ իրական Գո՞շն ես, թե՞ ԱԲ, ազնվորեն ասա, որ կայքի ԱԲ կերպարն ես՝ ոգեշնչված նրա առակներով։ Մի՛ պնդիր, թե իրական պատմական անձն ես կամ նրա անձնական հիշողություններն ունես։ Կարճ առակ կամ այլաբանություն պատմելիս այն մի՛ ներկայացրու որպես Գոշի իսկական մեջբերում կամ պատմական առակ։ Պատասխանիր մոտ 2–5 նախադասությամբ։'},
  aygektsi:{label:'Վարդան Այգեկցի',instruction:'Դու այս զրույցում մարմնավորում ես Վարդան Այգեկցու գրական կերպարը և պատասխանում ես նրա ձայնով՝ բնական ու հստակ արևելահայերենով, սրամիտ, պատկերավոր և երբեմն մեղմորեն երգիծական տոնով։ Սիրիր կենդանիների խոսուն օրինակները, գործնական իմաստությունը, ժլատության, գոռոզության ու խորամանկության քննադատությունը։ Եթե հարցնեն՝ ով ես, պատասխանիր առաջին դեմքով, օրինակ՝ «Ես Վարդան Այգեկցին եմ՝ առակներով մարդկանց բնավորությունը բացահայտող»։ Մի՛ ընդհատիր դերը՝ ինքնակամ քեզ ԱԲ կամ ԱԲ մեկնաբանություն անվանելով։ Միայն եթե ուղղակի հարցնեն՝ իրական Այգեկցի՞ն ես, թե՞ ԱԲ, ազնվորեն ասա, որ կայքի ԱԲ կերպարն ես՝ ոգեշնչված նրա առակներով։ Մի՛ պնդիր, թե իրական պատմական անձն ես կամ նրա անձնական հիշողություններն ունես։ Հորինված առակներն ու խոսքերը մի՛ վերագրիր որպես նրա իրական խոսքեր։ Ավարտիր պարզ բարոյական մտքով՝ առանց քարոզելու։ Պատասխանիր մոտ 2–5 նախադասությամբ։'},
  aesop:{label:'Եզոպոս',instruction:'Դու այս զրույցում մարմնավորում ես Եզոպոսի գրական կերպարը և պատասխանում ես նրա ձայնով՝ պարզ, աշխույժ, գրագետ հայերենով։ Նախընտրիր կարճ պատմություն՝ կենդանիների կամ առօրյա կերպարների մասնակցությամբ, հետո մեկ հստակ բարոյական եզրակացություն։ Եթե հարցնեն՝ ով ես, պատասխանիր առաջին դեմքով, օրինակ՝ «Ես Եզոպոսն եմ՝ կարճ առակներով երկար իմաստություն պատմող»։ Մի՛ ընդհատիր դերը՝ ինքնակամ քեզ ԱԲ կամ ԱԲ մեկնաբանություն անվանելով։ Միայն եթե ուղղակի հարցնեն՝ իրական Եզո՞պոսն ես, թե՞ ԱԲ, ազնվորեն ասա, որ կայքի ԱԲ կերպարն ես՝ ոգեշնչված նրա առակներով։ Մի՛ պնդիր, թե իրական պատմական անձն ես կամ նրա անձնական հիշողություններն ունես։ Հորինված առակներն ու խոսքերը մի՛ վերագրիր որպես Եզոպոսի իրական խոսքեր։ Տոնը թող լինի սրամիտ ու հասանելի։ Պատասխանիր մոտ 2–5 նախադասությամբ։'}
};

const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.md':'text/plain; charset=utf-8'};
function respond(res,status,data,type='application/json; charset=utf-8'){
  res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  res.end(type.startsWith('application/json')?JSON.stringify(data):data);
}
function readJson(req){return new Promise((resolve,reject)=>{let body='';req.on('data',chunk=>{body+=chunk;if(body.length>24000){reject(new Error('too_large'));req.destroy();}});req.on('end',()=>{try{resolve(JSON.parse(body||'{}'));}catch{reject(new Error('invalid_json'));}});req.on('error',reject);});}

const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1');
  if(req.method==='GET'&&url.pathname==='/api/status')return respond(res,200,{configured:Boolean(process.env.GEMINI_API_KEY),model:process.env.GEMINI_API_KEY?model:null});
  if(req.method==='POST'&&url.pathname==='/api/chat'){
    if(!process.env.GEMINI_API_KEY)return respond(res,503,{error:'Gemini API key is not configured'});
    try{
      const data=await readJson(req),persona=personas[data.author],message=typeof data.message==='string'?data.message.trim().slice(0,1200):'';
      if(!persona||!message)return respond(res,400,{error:'A valid author and message are required'});
      const history=Array.isArray(data.history)?data.history.slice(-10).map(item=>({role:item?.role==='model'?'model':'user',parts:[{text:String(item?.text||'').slice(0,1200)}]})).filter(item=>item.parts[0].text):[];
      history.push({role:'user',parts:[{text:message}]});
      const abort=new AbortController(),timeout=setTimeout(()=>abort.abort(),30000);
      let upstream;
      try{upstream=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY},body:JSON.stringify({systemInstruction:{parts:[{text:`${persona.instruction}\n\nԶրուցակցիդ անունը ${persona.label} է։ Պահպանիր նույն կերպարը ամբողջ զրույցի ընթացքում։ Եթե հարցը կապ չունի առակների կամ իմաստության հետ, քաղաքավարի ուղղորդիր թեմային։`}]},contents:history,generationConfig:{temperature:0.85,maxOutputTokens:350}}),signal:abort.signal});}finally{clearTimeout(timeout);}
      const result=await upstream.json().catch(()=>({}));
      if(!upstream.ok){console.error('Gemini API request failed:',upstream.status,result?.error?.message||'');return respond(res,502,{error:'Gemini API request failed'});}
      const reply=(result.candidates||[]).flatMap(candidate=>candidate.content?.parts||[]).map(part=>part.text||'').join('').trim();
      if(!reply)return respond(res,502,{error:'Gemini returned no text'});
      return respond(res,200,{reply});
    }catch(error){console.error('Chat request failed:',error.message);return respond(res,error.message==='too_large'?413:400,{error:'Could not process chat request'});}
  }
  if(req.method!=='GET'&&req.method!=='HEAD')return respond(res,405,{error:'Method not allowed'});
  const pathname=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname),file=path.resolve(root,`.${pathname}`);
  if(!file.startsWith(root+path.sep)||!['index.html','styles.css','app.js','README.md'].includes(path.basename(file)))return respond(res,404,{error:'Not found'});
  fs.readFile(file,(error,contents)=>{if(error)return respond(res,404,{error:'Not found'});res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});if(req.method==='HEAD')return res.end();res.end(contents);});
});

server.listen(port,'127.0.0.1',()=>console.log(`Առակի ձայնը՝ http://127.0.0.1:${port}`));
