// Belly Up — cloud-backup proxy
//
// Deployed as a Cloudflare Worker. Holds a GitHub fine-grained PAT (scoped to
// Contents: read/write on njf520/dinner-planner) as the secret GH_TOKEN, and
// lets anonymous app users back up their own recipes/photos into namespaced
// paths in that repo — WITHOUT ever handing out write access to the repo
// itself.
//
// Endpoints:
//   PUT /sync/:userId            body = backup JSON  -> data/users/:userId/backup.json
//   PUT /image/:userId/:filename body = data URL/base64 image -> images/users/:userId/:filename
//
// :userId must be a UUID (crypto.randomUUID() from the app).
// :filename must look like "<recipeId>-<index>.jpg".

const GH_OWNER='njf520';
const GH_REPO='dinner-planner';
const ALLOWED_ORIGIN='https://njf520.github.io';
const MAX_BODY_BYTES=2*1024*1024; // 2MB

const USER_ID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IMAGE_FILENAME_RE=/^\d+-\d+\.jpg$/;

function corsHeaders(){
  return {
    'Access-Control-Allow-Origin':ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods':'GET,PUT,OPTIONS',
    'Access-Control-Allow-Headers':'Content-Type',
  };
}
function json(status,body){
  return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json',...corsHeaders()}});
}

async function ghRequest(path,token,opts={}){
  return fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`,{
    ...opts,
    headers:{'Authorization':`Bearer ${token}`,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'belly-up-worker',...(opts.headers||{})}
  });
}
async function ghGetSha(path,token){
  const res=await ghRequest(path,token);
  if(res.status===404) return null;
  if(!res.ok) throw new Error('GitHub GET '+path+' failed: '+res.status);
  return (await res.json()).sha;
}
// Creates or updates a file in the repo, retrying once if the sha is stale.
async function ghPutFile(path,token,base64Content,message){
  for(let attempt=0;attempt<2;attempt++){
    const sha=await ghGetSha(path,token);
    const body={message,content:base64Content};
    if(sha) body.sha=sha;
    const res=await ghRequest(path,token,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    if(res.ok) return res.json();
    if((res.status===409||res.status===422)&&attempt===0) continue;
    const e=await res.json().catch(()=>({}));
    throw new Error(e.message||('GitHub PUT '+path+' failed: '+res.status));
  }
}

export default {
  async fetch(request,env){
    if(request.method==='OPTIONS'){
      return new Response(null,{status:204,headers:corsHeaders()});
    }
    if(request.method!=='PUT'){
      return json(405,{ok:false,error:'Method not allowed'});
    }

    const url=new URL(request.url);
    const parts=url.pathname.split('/').filter(Boolean); // e.g. ['sync','<uuid>'] or ['image','<uuid>','<file>']

    const token=env.GH_TOKEN;
    if(!token) return json(500,{ok:false,error:'Worker not configured'});

    try{
      const cl=request.headers.get('content-length');
      if(cl && Number(cl)>MAX_BODY_BYTES) return json(413,{ok:false,error:'Payload too large'});
      const text=await request.text();
      if(text.length>MAX_BODY_BYTES) return json(413,{ok:false,error:'Payload too large'});

      if(parts[0]==='sync' && parts.length===2){
        const userId=parts[1];
        if(!USER_ID_RE.test(userId)) return json(400,{ok:false,error:'Invalid user id'});
        // Validate it's JSON before writing it
        try{ JSON.parse(text); }catch(e){ return json(400,{ok:false,error:'Body is not valid JSON'}); }
        const base64=btoa(unescape(encodeURIComponent(text)));
        await ghPutFile(`data/users/${userId}/backup.json`,token,base64,`Sync recipe data for ${userId}`);
        return json(200,{ok:true});
      }

      if(parts[0]==='image' && parts.length===3){
        const[,userId,filename]=parts;
        if(!USER_ID_RE.test(userId)) return json(400,{ok:false,error:'Invalid user id'});
        if(!IMAGE_FILENAME_RE.test(filename)) return json(400,{ok:false,error:'Invalid filename'});
        // Accept either a raw base64 body or a data: URL
        let base64=text;
        const comma=base64.indexOf(',');
        if(base64.startsWith('data:') && comma!==-1) base64=base64.slice(comma+1);
        await ghPutFile(`images/users/${userId}/${filename}`,token,base64,`Add image ${filename} for ${userId}`);
        return json(200,{ok:true});
      }

      return json(404,{ok:false,error:'Not found'});
    }catch(e){
      return json(502,{ok:false,error:e.message||'Upstream error'});
    }
  }
};
