// These are bundled React Native assets. Keep each require static so Metro can
// include the files in the application bundle.
const carImages = {
  cultus: require('../assets/cars/cultus.png'),
  brv: require('../assets/cars/brv.png'),
  haval: require('../assets/cars/haval.png'),
};

export const CAR_REWARDS = [
  {
    id: 'cultus',
    nameKey: 'rewards.carCultus',
    image: carImages.cultus,
    options: [
      { plotSizeKey: 'rewards.oneKanalPlots', count: 100 },
      { plotSizeKey: 'rewards.tenMarlaPlots', count: 200 },
      { plotSizeKey: 'rewards.fiveMarlaPlots', count: 400 },
    ],
  },
  {
    id: 'brv',
    nameKey: 'rewards.carBrv',
    image: carImages.brv,
    options: [
      { plotSizeKey: 'rewards.oneKanalPlots', count: 150 },
      { plotSizeKey: 'rewards.tenMarlaPlots', count: 300 },
      { plotSizeKey: 'rewards.fiveMarlaPlots', count: 600 },
    ],
  },
  {
    id: 'haval',
    nameKey: 'rewards.carHaval',
    image: carImages.haval,
    options: [
      { plotSizeKey: 'rewards.oneKanalPlots', count: 200 },
      { plotSizeKey: 'rewards.tenMarlaPlots', count: 400 },
      { plotSizeKey: 'rewards.fiveMarlaPlots', count: 800 },
    ],
  },
];

export default CAR_REWARDS;
