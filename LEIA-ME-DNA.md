# DNA — pacote de atualização

## O que tem aqui
- `index.html` + `dna-*.js` / `dna-*.css` + imagens: o site novo da DNA (chats, TEMPESTA, agentes, planos, idiomas).
- `api/chat.js`: backend atualizado. Novidades:
  - ação `image` (gera imagem) e `image_status`
  - textos internos trocados de RIMAK para DNA (sempre no feminino)
- Os arquivos antigos (`rimak-functional.js`, `style.css`, `reel3d.js`, `reel-img.js`) deixam de ser usados. Pode apagar depois.
- `api/checkout*.js`, `payment.js`, `subscribe.js`, `mercadopago-webhook.js`, `vercel.json`: não mudaram.

## Como publicar
1. Substitua os arquivos no repositório `auralineia/Aura-line` (suba o conteúdo desta pasta na raiz, mantendo a pasta `api/`).
2. A Vercel faz o deploy sozinha.

## Para as imagens funcionarem
No projeto da Vercel, em Settings → Environment Variables, crie:

| Variável | Valor | Obrigatória |
|---|---|---|
| `OMNIROUTE_IMAGE_MODEL` | nome do modelo de imagem no seu OmniRoute | sim |
| `DNA_IMAGE_CREDITS` | créditos por imagem (padrão 3) | não |

Faça um novo deploy depois de criar a variável.

Como descobrir o nome do modelo: abra no navegador `SEU_OMNIROUTE/v1/models` (use a mesma URL de `OMNIROUTE_BASE_URL`; se pedir chave, é a `OMNIROUTE_API_KEY`) e procure um nome de modelo de imagem, por exemplo algo com `image`, `flux`, `dall-e`, `imagen` ou `sdxl`. Também aparece no painel do OmniRoute, na lista de provedores/modelos. O OmniRoute precisa ter um provedor de imagem conectado.

Sem a variável, o chat de texto continua normal e o botão de imagem mostra "A geração de imagens ainda não foi ativada na DNA." (e não cobra crédito).

## Regras do que foi feito
- Imagem só é cobrada se for gerada com sucesso.
- Se o saldo for menor que o custo, a DNA avisa antes de gerar.
- Botão de imagem aparece na DNA e nos agentes Writer, Designer e Marketing. Também dá para digitar `/imagem descrição`.
- Imagens que vêm como link ficam salvas no histórico; as que vêm em base64 ficam só enquanto a conversa está aberta.
- Respostas com pesquisa na web mostram as fontes embaixo.
- Suporte virou um formulário de verdade: grava na tabela `support_tickets`.

## O chat de texto
Já responde no site real pelo `/api/chat` (OmniRoute + Supabase). Na prévia do Claude ele não responde porque lá não existe servidor.
