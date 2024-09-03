// timelineGenerator.js

const projectStages = [
  { name: 'Escolha do Tema', duration: 14 }, // 2 semanas
  { name: 'Projeto', duration: 30 }, // 1 mês
  { name: 'Coleta de Dados', duration: 60 }, // 2 meses
  { name: 'Escrita', duration: 90 }, // 3 meses
  { name: 'Revisão', duration: 30 } // 1 mês
];

function generateTimeline(expectedGraduation, currentPhase) {
  const today = new Date();
  const graduationDate = new Date(expectedGraduation);
  let totalDays = Math.max(0, (graduationDate - today) / (1000 * 60 * 60 * 24));
  
  let timeline = [];
  let currentDate = new Date(today);
  
  let startFromIndex = projectStages.findIndex(stage => stage.name === currentPhase);
  if (startFromIndex === -1) startFromIndex = 0; // Se a fase atual não for encontrada, comece do início
  
  for (let i = startFromIndex; i < projectStages.length; i++) {
    let stage = projectStages[i];
    let stageDuration = Math.min(stage.duration, totalDays);
    
    let stageEndDate = new Date(currentDate.getTime() + stageDuration * 24 * 60 * 60 * 1000);
    
    timeline.push({
      name: stage.name,
      startDate: new Date(currentDate),
      endDate: stageEndDate
    });
    
    currentDate = new Date(stageEndDate);
    totalDays -= stageDuration;
    if (totalDays <= 0) break;
  }
  
  return timeline;
}

// function calculateProgress(timeline) {
  // const today = new Date();
  // let totalDays = 0;
  // let completedDays = 0;
  
  // timeline.forEach(stage => {
    // let stageDays = (stage.endDate - stage.startDate) / (1000 * 60 * 60 * 24);
    // totalDays += stageDays;
    
    // if (today > stage.endDate) {
      // completedDays += stageDays;
    // } else if (today > stage.startDate && today <= stage.endDate) {
      // completedDays += (today - stage.startDate) / (1000 * 60 * 60 * 24);
    // }
  // });
  
  // return (completedDays / totalDays) * 100;
// }

function calculateProgress(currentPhase) {
  const phases = ['Escolha do Tema', 'Projeto', 'Coleta de Dados', 'Escrita', 'Revisão'];
  const progressPerPhase = 20;

  const currentPhaseIndex = phases.indexOf(currentPhase);
  if (currentPhaseIndex === -1) return 0; // Se a fase não for encontrada, retorna 0%

  return currentPhaseIndex * progressPerPhase;
}

module.exports = {
  generateTimeline,
  calculateProgress
};