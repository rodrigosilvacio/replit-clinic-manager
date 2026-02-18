const ZAPI_INSTANCE_ID = process.env.ZAPI_INSTANCE_ID;
const ZAPI_INSTANCE_TOKEN = process.env.ZAPI_INSTANCE_TOKEN;
const ZAPI_CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN;

const BASE_URL = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_INSTANCE_TOKEN}`;

function isConfigured(): boolean {
  return !!(ZAPI_INSTANCE_ID && ZAPI_INSTANCE_TOKEN && ZAPI_CLIENT_TOKEN);
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("55")) return digits;
  return `55${digits}`;
}

export async function sendWhatsAppText(phone: string, message: string): Promise<{ success: boolean; error?: string }> {
  if (!isConfigured()) {
    console.warn("[Z-API] Credenciais nao configuradas. Mensagem nao enviada.");
    return { success: false, error: "Z-API nao configurada" };
  }

  const formattedPhone = formatPhone(phone);

  try {
    const response = await fetch(`${BASE_URL}/send-text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Token": ZAPI_CLIENT_TOKEN!,
      },
      body: JSON.stringify({
        phone: formattedPhone,
        message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Z-API] Erro ao enviar mensagem: ${response.status} - ${errorText}`);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    const data = await response.json();
    console.log(`[Z-API] Mensagem enviada com sucesso para ${formattedPhone}. ID: ${data.messageId || data.zaapId}`);
    return { success: true };
  } catch (err: any) {
    console.error(`[Z-API] Erro de conexao: ${err.message}`);
    return { success: false, error: err.message };
  }
}

export function buildAgendamentoMessage(params: {
  pacienteNome: string;
  data: string;
  hora: string;
  profissionalNome: string;
  servicoNome: string;
  clinicaNome?: string;
}): string {
  const clinica = params.clinicaNome || "Nina Clinica";
  return [
    `Ola, *${params.pacienteNome}*!`,
    ``,
    `Sua consulta foi agendada com sucesso:`,
    ``,
    `*Data:* ${params.data}`,
    `*Horario:* ${params.hora}`,
    `*Profissional:* ${params.profissionalNome}`,
    `*Servico:* ${params.servicoNome}`,
    ``,
    `Em caso de imprevisto, entre em contato para reagendar.`,
    ``,
    `${clinica}`,
  ].join("\n");
}
