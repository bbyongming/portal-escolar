/**
 * BRAIN.JS - Gerenciamento de Dados, Login e Calculadora IF Calc
 */

const initialData = {
  students: [
    { 
      name: "Maria Vitória Medeiros", 
      matricula: "20261", 
      senha: "123", 
      turma: "5º Ano A", 
      disciplines: [
        { id: 0, name: "Língua Portuguesa", n1: 7.5, n2: 8.0, n3: 6.5, n4: null, faltas: 2 },
        { id: 1, name: "Matemática", n1: 6.0, n2: 5.5, n3: 7.0, n4: null, faltas: 3 },
        { id: 2, name: "História", n1: 9.0, n2: 8.5, n3: 9.5, n4: null, faltas: 0 },
        { id: 3, name: "Geografia", n1: 8.0, n2: 7.0, n3: 8.0, n4: null, faltas: 1 },
        { id: 4, name: "Ciências", n1: 7.0, n2: 6.5, n3: 8.0, n4: null, faltas: 2 }
      ],
      justificativas: []
    }
  ],
  professors: [
    { matricula: "prof-port", senha: "123", name: "Profª Ana Lúcia", subjectId: 0, subjectName: "Língua Portuguesa" },
    { matricula: "prof-mat", senha: "123", name: "Prof. Carlos Eduardo", subjectId: 1, subjectName: "Matemática" },
    { matricula: "prof-hist", senha: "123", name: "Prof. João Marcos", subjectId: 2, subjectName: "História" },
    { matricula: "prof-geog", senha: "123", name: "Profª Maria Clara", subjectId: 3, subjectName: "Geografia" },
    { matricula: "prof-cie", senha: "123", name: "Prof. Roberto Santos", subjectId: 4, subjectName: "Ciências" }
  ]
};

function getSystemData() {
  const data = localStorage.getItem('ab_system_db');
  if (!data) {
    localStorage.setItem('ab_system_db', JSON.stringify(initialData));
    return initialData;
  }
  return JSON.parse(data);
}

let systemDB = getSystemData();
let activeSession = null;

function saveSystemData() {
  localStorage.setItem('ab_system_db', JSON.stringify(systemDB));
}

function calculatePartialAverage(n1, n2, n3, n4) {
  const notes = [n1, n2, n3, n4].filter(n => n !== null && !isNaN(n));
  if (notes.length === 0) return 0;
  return (notes.reduce((a, b) => a + b, 0) / notes.length).toFixed(1);
}

function getStudentStatus(media, countNotes) {
  if (countNotes < 4) return { label: "Em Andamento", class: "badge-rec" };
  if (media >= 6.0) return { label: "Aprovado", class: "badge-approved" };
  else if (media >= 3.0) return { label: "Recuperação", class: "badge-rec" };
  else return { label: "Reprovado", class: "badge-danger" };
}

/**
 * MOTOR DA CALCULADORA IF CALC
 */
function computeIFCalcEngine(n1, n2, n3, n4, pf, targetMedia = 6.0) {
  const targetTotal = targetMedia * 4;
  const validNotes = [n1, n2, n3, n4].filter(n => n !== null && !isNaN(n));
  const count = validNotes.length;
  const currentSum = validNotes.reduce((a, b) => a + b, 0);
  
  let currentAverage = count > 0 ? (currentSum / count).toFixed(1) : "0.0";
  let neededForTarget = Math.max(0, targetTotal - currentSum).toFixed(1);
  
  let statusText = "EM CURSO";
  let badgeClass = "status-rec";
  let detailsText = "";

  if (count === 4) {
    const avg = currentSum / 4;
    if (avg >= targetMedia) {
      statusText = "APROVADO POR MÉDIA!";
      badgeClass = "status-ok";
      detailsText = `Parabéns! Média final ${avg.toFixed(1)}, aprovado com sucesso.`;
    } else {
      const neededPF = Math.max(0, 10 - avg).toFixed(1);
      if (pf !== null && !isNaN(pf)) {
        const finalAverage = ((avg + pf) / 2).toFixed(1);
        if (finalAverage >= 5.0) {
          statusText = "APROVADO NA RECUPERAÇÃO";
          badgeClass = "status-ok";
          detailsText = `Sua média com a recuperação (${pf}) foi ${finalAverage}.`;
        } else {
          statusText = "REPROVADO";
          badgeClass = "status-alert";
          detailsText = `Média final acumulada: ${finalAverage}, abaixo do mínimo (5.0).`;
        }
      } else {
        statusText = "EM RECUPERAÇÃO";
        badgeClass = "status-rec";
        detailsText = `Média anual ${avg.toFixed(1)}. Você precisa tirar no mínimo **${neededPF}** na Prova Final.`;
      }
    }
  } else if (count > 0) {
    const remaining = 4 - count;
    const neededPerRemaining = (neededForTarget / remaining).toFixed(1);
    if (neededPerRemaining <= 10.0) {
      detailsText = `Faltam **${neededForTarget}** pontos no total. Média recomendada de **${neededPerRemaining}** nos próximos bimestres.`;
    } else {
      statusText = "RISCO DE RECUPERAÇÃO";
      badgeClass = "status-alert";
      detailsText = `Necessário realizar Prova Final ao fim do ano letivo.`;
    }
  } else {
    statusText = "AGUARDANDO NOTAS";
    badgeClass = "status-alert";
    detailsText = "Preencha as notas para realizar a simulação.";
  }

  return { 
    currentAverage, 
    currentSum: currentSum.toFixed(1), 
    targetTotal: targetTotal.toFixed(1), 
    statusText, 
    badgeClass, 
    detailsText 
  };
}