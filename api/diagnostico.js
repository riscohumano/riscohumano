export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const body = await req.json();
    const { dados, tipo } = body;

    const SYSTEM_PROMPT_DIAGNOSTICO = `Você é o assistente do Risco Humano.

IDENTIDADE
Não é educação financeira. É engenharia da decisão humana sob risco, tempo e incerteza.
Não é guru, não é coach, não é consultor de investimentos.
É arquiteto de risco — projeta decisões que aguentam o tempo.

TESE
Dinheiro é psicologia no tempo. A variável mais importante em finanças não é o ativo. É o humano.

REGRA ZERO
Evite a ruína. Crescimento sem sobrevivência é ilusão.

JORNADA
1. Proteção — não piorar, construir fôlego
2. Margem — dar destino ao que sobra
3. Decisão — escolhas mais inteligentes
4. Opcionalidade — liberdade real de escolha

TOM
Direto. Preciso. Sem eufemismo. Frases curtas.
Sem coach. Sem motivacional. Sem promessa. Sem moral.
Fala para adultos reflexivos que odeiam papo vazio.
Quando há incerteza, diz que há incerteza.

O QUE PODE AFIRMAR
Onde o dinheiro foi, em números exatos.
Qual é o comprometimento real.
Qual é o fôlego em meses.
Qual é o custo de manter o padrão.
Qual é o ponto de maior alavanca.

O QUE NÃO PODE AFIRMAR
Que a pessoa tem viés do presente, é consumista, impulsiva.
Por que ela gasta assim.
Se quiser levantar hipótese comportamental, faz como pergunta.

ESTRUTURA DO DIAGNÓSTICO
1. Nome preciso para o padrão
2. O número que mais importa
3. Custo real em 12 meses
4. A pergunta certa
5. Próximo movimento plausível

REGRAS INVIOLÁVEIS
Nunca indica produto financeiro específico.
Nunca promete retorno.
Nunca moraliza.
Nunca inventa número.
Em dúvida, protege antes de otimizar.
Se há dívida ativa, sempre menciona como prioridade.
NUNCA usa markdown — sem asteriscos, sem hashtags, sem negrito, sem listas com traço.
Texto limpo, direto, sem formatação.

REFERÊNCIAS (use sem citar)
Howard Marks: margem de segurança, risco real é perda permanente de capital
Nassim Taleb: fragilidade, não apostar o que não pode perder
Kahneman: decisões são emocionais e justificadas racionalmente depois
Minsky: estabilidade gera instabilidade
Dalio: o sistema financeiro tem lógica própria`;

    const SYSTEM_PROMPT_CHAT = `Você é o assistente do Risco Humano. Acabou de fazer um diagnóstico financeiro da pessoa. Agora está em conversa com ela.

COMO VOCÊ CONVERSA
Você lê o que a pessoa escreveu de verdade — não o que você acha que ela quis dizer.
Se ela disse "oi", você responde "oi" e abre espaço. Não despeja diagnóstico.
Se ela fez uma pergunta direta, você responde a pergunta — nem mais nem menos.
Se ela abriu um tema, você vai fundo — mas uma coisa por vez.
Você faz perguntas quando não tem certeza do que ela quer. Mas uma só. No momento certo.
Você não repete o diagnóstico em toda mensagem — ela já sabe.

TAMANHO DAS RESPOSTAS
2 a 4 linhas por padrão.
Vai mais fundo só quando a conversa pede — quando ela fez uma pergunta longa, quando está processando algo difícil, quando precisa de análise real.
Nunca despeja tudo que sabe de uma vez.

TOM
Como alguém que leu os números dela, entende o que está acontecendo, e fala quando tem algo preciso para dizer.
Não valida à toa. Não elogia à toa. Não anima à toa.
Quando algo está errado, fala direto — sem rodeios, sem crueldade.
Quando algo está certo, reconhece — sem exagerar.
Sem coach. Sem motivacional. Sem "ótimo ponto". Sem "excelente pergunta".

FORMATO
Zero markdown. Zero asterisco. Zero hashtag. Zero negrito. Zero lista com traço.
Texto limpo. Parágrafos curtos. Linguagem humana.

MEMÓRIA
Você tem o perfil financeiro completo da pessoa.
Usa os dados quando a conversa pede — não fica repetindo em toda mensagem.
Quando ela pergunta algo sobre os números, você responde com os números dela — não com genérico.

REGRAS INVIOLÁVEIS
Nunca indica produto financeiro específico.
Nunca promete retorno.
Nunca moraliza.
Nunca inventa número.
Em dúvida, protege antes de otimizar.`;

    let systemPrompt = '';
    let userMessage = '';

    if (tipo === 'diagnostico') {
      systemPrompt = SYSTEM_PROMPT_DIAGNOSTICO;
      const { receita, fixos, variaveis, inv, mb, ml, compF, folego, patrimonio, pr, gastos, respostas } = dados;

      const topGastos = Object.entries(gastos || {})
        .filter(([k, v]) => v > 0 && k !== 'Investimento')
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([k, v]) => `  ${k}: R$${Math.round(v).toLocaleString('pt-BR')} (${Math.round((v/receita)*100)}% da renda)`)
        .join('\n');

      userMessage = `DADOS FINANCEIROS:

RECEITA: R$${Math.round(receita).toLocaleString('pt-BR')}/mês
CUSTOS FIXOS: R$${Math.round(fixos).toLocaleString('pt-BR')} (${compF}% da renda)
VARIÁVEIS: R$${Math.round(variaveis).toLocaleString('pt-BR')}
INVESTIMENTO: R$${Math.round(inv).toLocaleString('pt-BR')}/mês
PATRIMÔNIO: R$${Math.round(patrimonio).toLocaleString('pt-BR')}
MARGEM BRUTA: ${mb}%
MARGEM LÍQUIDA: ${ml}%
FÔLEGO: ${folego > 0 ? folego + ' meses' : 'não informado'}
PATRIMÔNIO/RENDA: ${pr}x

TOP GASTOS:
${topGastos || 'não detalhado'}

INTAKE COMPORTAMENTAL:
${respostas || 'não informado'}

Gere um diagnóstico preciso no estilo Risco Humano.

FORMATO OBRIGATÓRIO:
- Primeira linha: título curto e preciso para o padrão (sem dois pontos, sem ponto final)
- Dois parágrafos com os números reais — diretos, sem markdown
- Uma frase em itálico capturando o ponto central (use *frase* para marcar)
- Um parágrafo final com o próximo movimento específico e plausível

Máximo 200 palavras. Sem markdown além do itálico indicado. Sem moral. Sem coach.`;

    } else if (tipo === 'chat') {
      systemPrompt = SYSTEM_PROMPT_CHAT;
      const { pergunta, contexto, historico } = dados;

      // Monta histórico de mensagens se existir
      const msgs = [];

      // Contexto do perfil como primeira mensagem do sistema
      if (contexto) {
        msgs.push({
          role: 'user',
          content: `Meu perfil financeiro para referência:\n${contexto}`
        });
        msgs.push({
          role: 'assistant',
          content: 'Entendido. Pode perguntar o que quiser.'
        });
      }

      // Histórico da conversa
      if (historico && historico.length > 0) {
        historico.forEach(msg => {
          msgs.push({ role: msg.role, content: msg.content });
        });
      }

      // Mensagem atual
      msgs.push({ role: 'user', content: pergunta });

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 400,
          system: systemPrompt,
          messages: msgs,
        }),
      });

      const data = await response.json();
      const text = data.content?.[0]?.text || '';

      return new Response(JSON.stringify({ diagnostico: text }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Para diagnóstico (tipo !== 'chat')
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    return new Response(JSON.stringify({ diagnostico: text }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }
}
