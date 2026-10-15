export const messages = [
  { id: '1', category: 'Autocuidado', text: 'Você também merece o cuidado que oferece aos outros.', action: 'Separe dez minutos do dia para algo que faça bem a você.' },
  { id: '2', category: 'Coragem', text: 'Pedir ajuda é uma forma de seguir em frente.', action: 'Mande uma mensagem para alguém em quem você confia.' },
  { id: '3', category: 'Equilíbrio', text: 'Seu valor não depende de quanto você produz.', action: 'Faça uma pausa sem tentar merecê-la primeiro.' },
  { id: '4', category: 'Recomeço', text: 'Um dia difícil não define a sua história.', action: 'Escolha uma pequena tarefa possível para hoje.' },
  { id: '5', category: 'Emoções', text: 'Sentir tristeza, medo ou cansaço faz parte de ser humano.', action: 'Dê um nome ao que sente, sem se julgar.' },
  { id: '6', category: 'Conexão', text: 'Você não precisa carregar tudo sozinho.', action: 'Convide alguém para conversar ou dar uma caminhada.' },
  { id: '7', category: 'Descanso', text: 'Descansar também é cuidar do seu futuro.', action: 'Desligue as telas um pouco antes de dormir.' },
  { id: '8', category: 'Gentileza', text: 'Fale consigo com o respeito que daria a um amigo.', action: 'Troque uma cobrança por uma frase de compreensão.' },
  { id: '9', category: 'Presença', text: 'Você pode dar um passo de cada vez.', action: 'Respire devagar e perceba três coisas ao seu redor.' },
  { id: '10', category: 'Limites', text: 'Dizer que precisa de espaço também é um ato de cuidado.', action: 'Identifique um limite que você precisa respeitar hoje.' },
  { id: '11', category: 'Confiança', text: 'Pequenos avanços continuam sendo avanços.', action: 'Reconheça algo que conseguiu fazer nesta semana.' },
  { id: '12', category: 'Saúde', text: 'Cuidar da mente faz parte de cuidar da saúde.', action: 'Se o sofrimento persistir, procure um profissional de saúde.' },
  { id: '13', category: 'Autenticidade', text: 'Você não precisa parecer forte o tempo todo.', action: 'Compartilhe como realmente está com alguém de confiança.' },
  { id: '14', category: 'Esperança', text: 'Recomeçar pode ser tão simples quanto tentar de novo amanhã.', action: 'Escolha uma intenção gentil para o próximo dia.' },
];

export function dayIndex(date = new Date()): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
}
export function messageForDay(date = new Date()) {
  return messages[((dayIndex(date) % messages.length) + messages.length) % messages.length];
}
