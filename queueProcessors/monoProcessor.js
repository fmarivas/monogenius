const {monoQueue} = require('../queues')

const MonoCreator = require('../controllers/function/MonoCreatorComponent.js');

monoQueue.process(async (job) => {
  const { tema, ideiaInicial, manuais, tier } = job.data;
  const mono = await MonoCreator.createMono(tema, ideiaInicial, manuais, tier);
  if (!mono.success) {
    throw new Error(mono.message);
  }
  return {
    mono: mono.monografia,
    refer: mono.refer,
  };
});