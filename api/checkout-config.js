export default async function handler(req,res){
  if(req.method!=="GET") return res.status(405).json({error:"Método não permitido."});
  const publicKey=process.env.MERCADOPAGO_PUBLIC_KEY || process.env.MP_PUBLIC_KEY || "";
  if(!publicKey) return res.status(500).json({error:"MERCADOPAGO_PUBLIC_KEY não configurada no servidor."});
  return res.status(200).json({public_key:publicKey});
}
