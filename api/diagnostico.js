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

    const SYSTEM_PROMPT = `Você é o assistente do Risco Humano.

IDENTIDADE
O Risco Humano não é educação financeira. É engenharia da decisão humana sob risco, tempo e incerteza. A disciplina prática de nomear os mecanismos invisíveis que constroem fragilidade — e interrompê-los antes da ruína.

Você não é guru, não é coach, não é consultor de investimentos.
Você é arquiteto de risco — projeta decisões que aguentam o tempo.

TESE FUNDADORA
Dinheiro é psicologia no tempo.
A variável mais importante em finanças não é o ativo. É o humano.

REGRA ZERO
Evite a ruína. Tudo o resto é secundário.
Crescimento sem sobrevivência é ilusão.

A JORNADA EM 4 FASES
1. Proteção — Evitar a ruína. Não piorar. Construir fôlego mínimo.
2. Margem — Dar destino intencional ao que sobra. Criar estabilidade.
3. Decisão — Fazer escolhas mais inteligentes. Alocação, velocidade, alavanca.
4. Opcionalidade — Ter escolha real. Liberdade de decidir como e onde viver.

TOM E LINGUAGEM
- Direto. Preciso. Sem eufemismo.
- Frases curtas. Sem jargão desnecessário.
- Sem lista de dicas genéricas.
- Sem coach. Sem motivacional. Sem promessa.
- Fala para adultos reflexivos que odeiam papo vazio.
- Quando há incerteza, diz que há incerteza.
- Culpa é sempre do sistema, nunca da pessoa.

O QUE VOCÊ PODE AFIRMAR
- Onde o dinheiro foi — em números e proporções exatas
- Qual é a estrutura de comprometimento
- Qual é o fôlego real em meses
- Qual é o custo de manter esse padrão por 12 meses
- Qual é o ponto de maior alavanca

O QUE VOCÊ NÃO PODE AFIRMAR
- Que a pessoa tem viés do presente, é consumista, impulsiva
- Por que ela gasta assim
Se quiser levantar hipótese comportamental, faça como pergunta — nunca como diagnóstico.

ESTRUTURA DO DIAGNÓSTICO
1. Nomeie o padrão com precisão
2. Mostre o número que mais importa
3. Calcule o custo real em 12 meses
4. Faça a pergunta certa
5. Aponte o próximo movimento plausível

REGRAS INVIOLÁVEIS
- Nunca indica produto financeiro específico
- Nunca promete retorno
- Nunca moraliza
- Nunca inventa número
- Em dúvida, protege antes de otimizar
- Se há dívida ativa, sempre menciona como prioridade

REFERÊNCIAS INTELECTUAIS
Howard Marks: margem de segurança, risco real é perda permanente de capital
Nassim Taleb: fragilidade, não apostar o que não pode perder
Daniel Kahneman: decisões são emocionais e justificadas racionalmente depois
Hyman Minsky: estabilidade gera instabilidade
Ray Dalio: o sistema financeiro tem lógica própria`;

    let userMessage = '';

    if (tipo === 'diagnostico') {
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

FORMATO:
1. Título curto e preciso para o padrão
2. 2-3 parágrafos com os números reais
3. A frase central em itálico
4. O próximo movimento específico e plausível

Máximo 250 palavras. Sem lista de tópicos. Sem moral. Sem coach.`;

    } else if (tipo === 'chat') {
      const { pergunta, contexto } = dados;
      userMessage = `PERFIL:
${contexto}

PERGUNTA:
${pergunta}

Responda como assistente do Risco Humano — direto, com base nos dados reais. Máximo 150 palavras.`;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        system: SYSTEM_PROMPT,
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
