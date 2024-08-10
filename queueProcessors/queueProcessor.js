const { feedbackQueue } = require('../queues');
const aiProcessor = require('../controllers/function/aiProcessor');

feedbackQueue.process(async (job) => {
  const { questions, transcription, thesisContent } = job.data;
  
  // Aqui você coloca o código original de generateFeedback e generateAudioFeedback
  const feedbackResult = await aiProcessor.generateFeedback(questions, transcription, thesisContent);
  if (!feedbackResult.success) {
    throw new Error(feedbackResult.message);
  }

  const audioResult = await aiProcessor.generateAudioFeedback(feedbackResult.feedback);
  if (!audioResult.success) {
    throw new Error(audioResult.message);
  }

  return {
    feedback: feedbackResult.feedback,
    audioFeedbackPath: audioResult.audioFeedbackPath
  };
});