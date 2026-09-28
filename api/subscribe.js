const PLANS={pro:{name:"PRO",amount:11.99},ultra:{name:"ULTRA",amount:29.99}};
function bearer(req){const v=req.headers?.authorization||req.headers?.Authorization||"";return v.startsWith("Bearer ")?v.slice(7).trim():"";}
function cfg(){const url=process.env.SUPABASE_URL?.replace(/\/+$/,"");const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;const anonKey=process.env.SUPABASE_ANON_KEY||process.env.SUPABASE_PUBLISHABLE_KEY;if(!url||!serviceKey||!anonKey)throw new Error("Supabase não configurado.");return{url,serviceKey,anonKey};}
async function user(req){const t=bearer(req);if(!t)return null;const {url,anonKey}=cfg();const r=await fetch(url+"/auth/v1/user",{headers:{apikey:anonKey,Authorization:"Bearer "+t}});if(!r.ok)return null;return r.json();}
async function rest(path,options={}){const {url,serviceKey}=cfg();return fetch(url+"/rest/v1/"+path,{...options,headers:{apikey:serviceKey,Authorization:"Bearer "+serviceKey,"Content-Type":"application/json",...(options.headers||{})}});}
export default async function handler(req,res){
 if(req.method!=="POST")return res.status(405).json({error:"Método não permitido."});
 try{
  const u=await user(req);if(!u?.id||!u?.email)return res.status(401).json({error:"Sessão inválida ou expirada."});
  const plan=String(req.body?.plan||"").toLowerCase(), p=PLANS[plan], cardToken=String(req.body?.card_token_id||req.body?.token||"").trim();
  if(!p)return res.status(400).json({error:"Plano inválido."});
  if(!cardToken)return res.status(400).json({error:"Token do cartão não recebido."});
  const accessToken=process.env.MERCADOPAGO_ACCESS_TOKEN;if(!accessToken)throw new Error("Mercado Pago não configurado.");
  const mp=await fetch("https://api.mercadopago.com/preapproval",{method:"POST",headers:{Authorization:"Bearer "+accessToken,"Content-Type":"application/json"},body:JSON.stringify({reason:"AURA "+p.name,external_reference:"aura:"+u.id+":"+plan,payer_email:u.email,card_token_id:cardToken,auto_recurring:{frequency:1,frequency_type:"months",transaction_amount:p.amount,currency_id:"BRL"},back_url:(process.env.AURA_PUBLIC_URL||"https://aura-line-s.vercel.app")+"?checkout=return",status:"authorized"})});
  const data=await mp.json().catch(()=>({}));if(!mp.ok){console.error("Mercado Pago subscription:",mp.status,data);return res.status(502).json({error:data?.message||data?.cause?.[0]?.description||"Não foi possível ativar a assinatura."});}
  await rest("subscriptions",{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify({user_id:u.id,plan,status:data.status||"authorized",mercado_pago_subscription_id:data.id||null,external_reference:data.external_reference||null,amount:p.amount,updated_at:new Date().toISOString()})}).catch(e=>console.error("Subscription save:",e));
  return res.status(200).json({ok:true,plan,status:data.status||"authorized",subscription_id:data.id||null});
 }catch(e){console.error("Subscribe:",e);return res.status(500).json({error:e?.message||"Não foi possível ativar a assinatura."});}
}